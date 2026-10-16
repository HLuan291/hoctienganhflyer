import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import worker from '../dist/index.js';
const db=new DatabaseSync(':memory:');db.exec(await readFile(new URL('../schema.sql',import.meta.url),'utf8'));
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
console.log('Account setup, child login, isolation, save, conflict, code reset, logout, recovery, deletion and origin check passed.');

