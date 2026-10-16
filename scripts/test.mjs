import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import worker from '../dist/index.js';
const db=new DatabaseSync(':memory:');db.exec(await readFile(new URL('../schema.sql',import.meta.url),'utf8'));
const legacyDb=new DatabaseSync(':memory:');
legacyDb.exec((await readFile(new URL('../schema.sql',import.meta.url),'utf8')).replace(/^  google_(?:sub|email_hash) TEXT,\r?\n/gm,'').replace(/^CREATE UNIQUE INDEX IF NOT EXISTS users_google_.*\r?\n/gm,''));
legacyDb.exec(await readFile(new URL('../migrations/001_google_auth.sql',import.meta.url),'utf8'));
assert.ok(legacyDb.prepare('PRAGMA table_info(users)').all().some(column=>column.name==='google_sub'));
assert.ok(legacyDb.prepare('PRAGMA table_info(users)').all().some(column=>column.name==='google_email_hash'));
function prepared(sql,args=[]){const s=db.prepare(sql);return {bind(...next){return prepared(sql,next)},async first(){return s.get(...args)},async all(){return {results:s.all(...args)}},async run(){return {meta:{changes:s.run(...args).changes}}}}}
const env={AUTH_PEPPER:'testing-pepper-with-at-least-thirty-two-characters',SETUP_KEY:'testing-setup-key-with-enough-entropy',DB:{
  prepare(sql){return prepared(sql)},
  async batch(statements){const result=[];for(const statement of statements)result.push(await statement.run());return result}
}};
const origin='https://family.example';
async function call(path,{method='GET',body,cookie,headers={}}={}){
  const h={...headers};if(cookie)h.cookie=cookie;if(body!==undefined){h.origin=origin;h['content-type']='application/json'}
  return worker.fetch(new Request(origin+path,{method,headers:h,body:body!==undefined?JSON.stringify(body):undefined}),env);
}
const json=async r=>({status:r.status,cookie:r.headers.get('set-cookie'),body:await r.json()});
assert.equal((await call('/')).status,200);
assert.equal((await call('/api/setup/status').then(r=>r.json())).needed,true);
assert.equal((await call('/api/setup',{method:'POST',body:{setupKey:'wrong',username:'parent',name:'Mẹ'}})).status,400);
const parent=await json(await call('/api/setup',{method:'POST',body:{setupKey:env.SETUP_KEY,username:'parent',name:'Mẹ'}}));
assert.equal(parent.status,201);assert.ok(parent.body.accessCode.length>20);
assert.equal((await call('/api/setup/status').then(r=>r.json())).needed,false);
const parentLogin=await json(await call('/api/login',{method:'POST',body:{username:'parent',accessCode:parent.body.accessCode}}));
assert.equal(parentLogin.status,200);const parentCookie=parentLogin.cookie.split(';')[0];
const seed={name:'Mai',completed:{},history:[],cards:{},games:{},placement:{done:false,results:{},starts:{}},sound:true};
const created=await json(await call('/api/profiles',{method:'POST',cookie:parentCookie,body:{name:'Mai',username:'mai.hoc',data:seed}}));
assert.equal(created.status,201);assert.ok(created.body.accessCode);
const other=await json(await call('/api/profiles',{method:'POST',cookie:parentCookie,body:{name:'Lan',username:'lan.hoc',data:{...seed,name:'Lan'}}}));
assert.equal(other.status,201);
const childLogin=await json(await call('/api/login',{method:'POST',body:{username:'mai.hoc',accessCode:created.body.accessCode}}));
assert.equal(childLogin.status,200);const childCookie=childLogin.cookie.split(';')[0];
assert.equal((await call('/api/session',{cookie:childCookie}).then(r=>r.json())).role,'child');
assert.equal((await call('/api/profiles',{cookie:childCookie}).then(r=>r.json())).profiles.length,1);
assert.equal((await call('/api/profiles/'+other.body.id,{cookie:childCookie})).status,404);
assert.equal((await call('/api/profiles/'+created.body.id,{method:'DELETE',cookie:childCookie,body:{}})).status,403);
assert.equal((await call('/api/profiles',{method:'POST',cookie:childCookie,body:{name:'Fake',username:'fake',data:seed}})).status,403);
assert.equal((await call('/api/profiles/'+created.body.id,{cookie:childCookie}).then(r=>r.json())).data.name,'Mai');
seed.history.push({track:'vocab',level:1,score:10,duration:30,date:new Date().toISOString()});
assert.equal((await call('/api/profiles/'+created.body.id,{method:'PUT',cookie:childCookie,body:{revision:0,data:seed}}).then(r=>r.json())).revision,1);
assert.equal((await call('/api/profiles/'+created.body.id,{method:'PUT',cookie:childCookie,body:{revision:0,data:seed}})).status,409);
const reset=await json(await call('/api/profiles/'+created.body.id+'/code',{method:'POST',cookie:parentCookie,body:{}}));assert.equal(reset.status,200);
assert.equal((await call('/api/session',{cookie:childCookie})).status,401);
assert.equal((await call('/api/login',{method:'POST',body:{username:'mai.hoc',accessCode:created.body.accessCode}})).status,401);
assert.equal((await call('/api/login',{method:'POST',body:{username:'mai.hoc',accessCode:reset.body.accessCode}})).status,200);
assert.equal((await call('/api/logout',{method:'POST',cookie:parentCookie,body:{}})).status,200);
assert.equal((await call('/api/session',{cookie:parentCookie})).status,401);
const recovery=await json(await call('/api/setup/recover',{method:'POST',body:{username:'parent',setupKey:env.SETUP_KEY}}));
assert.equal(recovery.status,200);assert.equal((await call('/api/login',{method:'POST',body:{username:'parent',accessCode:parent.body.accessCode}})).status,401);
assert.equal((await call('/api/login',{method:'POST',body:{username:'parent',accessCode:recovery.body.accessCode}})).status,200);
const recoveredLogin=await json(await call('/api/login',{method:'POST',body:{username:'parent',accessCode:recovery.body.accessCode}}));
const recoveredCookie=recoveredLogin.cookie.split(';')[0];
assert.equal((await call('/api/profiles/'+other.body.id,{method:'DELETE',cookie:recoveredCookie,body:{}})).status,200);
assert.equal((await call('/api/profiles/'+other.body.id,{cookie:recoveredCookie})).status,404);
assert.equal((await worker.fetch(new Request(origin+'/api/login',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{}'}),env)).status,403);
const {publicKey,privateKey}=await generateKeyPair('RS256');
const jwk=await exportJWK(publicKey);jwk.kid='test-key';jwk.alg='RS256';jwk.use='sig';
env.GOOGLE_TEST_JWKS=JSON.stringify({keys:[jwk]});env.GOOGLE_CLIENT_ID='english-quest-client.apps.googleusercontent.com';
env.PARENT_GOOGLE_EMAIL_HASH=createHash('sha256').update(`${env.AUTH_PEPPER}:google-email:parent@example.com`).digest('hex');
async function googleToken(email,sub,{aud=env.GOOGLE_CLIENT_ID,issuer='https://accounts.google.com',verified=true}={}){
  return new SignJWT({email,email_verified:verified,sub,name:'Phụ huynh'}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(issuer).setAudience(aud).setIssuedAt().setExpirationTime('5m').sign(privateKey);
}
const googleSignIn=credential=>call('/api/google/login',{method:'POST',body:{credential}});
assert.equal((await call('/api/google/config').then(r=>r.json())).clientId,env.GOOGLE_CLIENT_ID);
assert.equal((await googleSignIn(await googleToken('stranger@example.com','stranger'))).status,403);
assert.equal((await googleSignIn(await googleToken('parent@example.com','parent-sub',{aud:'wrong-client'}))).status,401);
assert.equal((await googleSignIn(await googleToken('parent@example.com','parent-sub',{issuer:'https://evil.example'}))).status,401);
assert.equal((await googleSignIn(await googleToken('parent@example.com','parent-sub',{verified:false}))).status,401);
const tampered=await googleToken('parent@example.com','parent-sub');
const parts=tampered.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);
assert.equal((await googleSignIn(parts.join('.'))).status,401);
const googleParent=await json(await googleSignIn(await googleToken('parent@example.com','parent-sub')));
assert.equal(googleParent.status,200);const googleParentCookie=googleParent.cookie.split(';')[0];
assert.equal((await call('/api/session',{cookie:googleParentCookie}).then(r=>r.json())).role,'parent');
assert.equal((await googleSignIn(await googleToken('parent@example.com','different-sub'))).status,403);
const invited=await json(await call('/api/profiles',{method:'POST',cookie:googleParentCookie,body:{name:'Bé An',googleEmail:'wrong@example.com',data:{...seed,name:'Bé An',history:[]}}}));
assert.equal(invited.status,201);assert.equal(invited.body.accessCode,undefined);
assert.equal((await googleSignIn(await googleToken('child@example.com','child-sub'))).status,403);
assert.equal((await call(`/api/profiles/${invited.body.id}/google-invite`,{method:'PUT',cookie:googleParentCookie,body:{googleEmail:'child@example.com'}})).status,200);
const googleChild=await json(await googleSignIn(await googleToken('child@example.com','child-sub')));
assert.equal(googleChild.status,200);const googleChildCookie=googleChild.cookie.split(';')[0];
assert.equal((await call('/api/profiles',{cookie:googleChildCookie}).then(r=>r.json())).profiles.length,1);
assert.equal((await call('/api/profiles/'+created.body.id,{cookie:googleChildCookie})).status,404);
assert.equal((await call(`/api/profiles/${invited.body.id}/google-invite`,{method:'PUT',cookie:googleParentCookie,body:{googleEmail:'another@example.com'}})).status,404);
console.log('Legacy access and Google parent/child identity, invitation, isolation and token checks passed.');

