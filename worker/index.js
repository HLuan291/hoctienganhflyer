import {createRemoteJWKSet, createLocalJWKSet, jwtVerify} from 'jose';
// Cloudflare Worker for a family-owned learning site. No ChatGPT identity is used.
// ASSETS is inserted by scripts/build.mjs.
const reply=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
const error=(message,status)=>reply({error:message},status);
const validName=x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<=25;
const validUsername=x=>typeof x==='string'&&/^[a-z][a-z0-9._-]{2,23}$/.test(x);
const validData=x=>x&&typeof x==='object'&&!Array.isArray(x)&&validName(x.name)&&x.completed&&typeof x.completed==='object'&&!Array.isArray(x.completed)&&Array.isArray(x.history)&&x.history.length<=500&&x.cards&&typeof x.cards==='object'&&!Array.isArray(x.cards)&&x.games&&typeof x.games==='object'&&!Array.isArray(x.games);
const bytes=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',bytes.encode(s)));
const equal=(a,b)=>{if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;};
const normalizeCode=x=>String(x||'').toUpperCase().replace(/[\s-]/g,'');
const code=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',random=crypto.getRandomValues(new Uint8Array(20));return Array.from(random,n=>alphabet[n%alphabet.length]).join('').match(/.{1,5}/g).join('-');};
const hashCode=(env,username,credential)=>sha(`${env.AUTH_PEPPER}:${username}:${normalizeCode(credential)}`);
const emailHash=(env,email)=>sha(`${env.AUTH_PEPPER}:google-email:${email}`);
const validEmail=x=>typeof x==='string'&&x.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
const speechWords=value=>String(value||'').toLowerCase().replace(/[’‘]/g,"'").match(/[a-z]+(?:'[a-z]+)?/g)||[];
function speechScore(reference,spoken){
  const expected=speechWords(reference),actual=speechWords(spoken);
  if(!actual.length)return {score:0,matched:0,total:expected.length};
  let row=Array.from({length:actual.length+1},(_,i)=>i);
  for(let i=1;i<=expected.length;i++){
    const next=[i];for(let j=1;j<=actual.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+Number(expected[i-1]!==actual[j-1]));row=next;
  }
  const matched=Math.max(0,expected.length-row[actual.length]);
  return {score:Math.round(100*Math.max(0,1-row[actual.length]/Math.max(expected.length,actual.length)))/10,matched,total:expected.length};
}
function base64Audio(buffer){
  const bytes=new Uint8Array(buffer);let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(value);
}
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
async function googleIdentity(env,credential){
  if(!env.GOOGLE_CLIENT_ID||typeof credential!=='string'||credential.length>10000)throw Error('Google chưa được cấu hình hoặc thông tin đăng nhập không hợp lệ.');
  const keys=env.GOOGLE_TEST_JWKS?createLocalJWKSet(JSON.parse(env.GOOGLE_TEST_JWKS)):googleKeys;
  const {payload}=await jwtVerify(credential,keys,{audience:env.GOOGLE_CLIENT_ID,issuer:['https://accounts.google.com','accounts.google.com'],algorithms:['RS256']});
  const email=String(payload.email||'').trim().toLowerCase();
  if(payload.email_verified!==true||!validEmail(email)||typeof payload.sub!=='string'||!payload.sub||payload.sub.length>255)throw Error('Tài khoản Google chưa xác minh email.');
  return {sub:payload.sub,email,name:String(payload.given_name||payload.name||'Phụ huynh').trim().slice(0,25)||'Phụ huynh'};
}
const cookie=(token,secure)=>`quest_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=2592000${secure?'; Secure':''}`;
const soloCookie=(token,secure)=>`quest_solo=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=31536000${secure?'; Secure':''}`;
const clearCookie=secure=>`quest_session=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${secure?'; Secure':''}`;
const assetType=p=>p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.css')?'text/css; charset=utf-8':p.endsWith('.js')?'text/javascript; charset=utf-8':p.endsWith('.svg')?'image/svg+xml':'application/octet-stream';
async function bodyOf(request){const raw=await request.text();if(raw.length>350000)throw Error('Dữ liệu quá lớn.');try{return JSON.parse(raw)}catch{throw Error('Dữ liệu không hợp lệ.')}}
async function sessionUser(request,env){
  const token=/\bquest_session=([^;]+)/.exec(request.headers.get('cookie')||'')?.[1];if(!token)return null;
  const tokenHash=await sha(decodeURIComponent(token));
  return env.DB.prepare('SELECT u.id,u.username,u.role,u.parent_id,u.display_name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(tokenHash,Date.now()).first();
}
async function soloUser(request,env){
  const token=/\bquest_solo=([a-f0-9]{64})\b/.exec(request.headers.get('cookie')||'')?.[1];
  if(!token)return null;
  const tokenHash=await sha(token);
  return env.DB.prepare("SELECT u.id,u.display_name FROM solo_links l JOIN users u ON u.id=l.user_id WHERE l.token_hash=? AND u.role='child'").bind(tokenHash).first();
}
async function newSession(env,userId,secure){
  const token=hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await sha(token),userId,Date.now()+2592000000).run();
  return cookie(token,secure);
}
function permitted(user,row){return row&&(user.id===row.id||(user.role==='parent'&&row.parent_id===user.id));}
async function api(request,env,url){
  if(!env.DB||!env.AUTH_PEPPER||env.AUTH_PEPPER.length<32)return error('Máy chủ chưa được cấu hình đầy đủ.',503);
  const secure=url.protocol==='https:';
  if(['POST','PUT','DELETE'].includes(request.method)){
    if(request.headers.get('origin')!==url.origin)return error('Yêu cầu không cùng trang.',403);
    const speechUpload=url.pathname==='/api/speech/assess'&&request.method==='POST';
    if(!request.headers.get('content-type')?.startsWith(speechUpload?'audio/wav':'application/json'))return error(speechUpload?'Yêu cầu âm thanh WAV.':'Yêu cầu phải là JSON.',415);
  }
  if(!env.LEGACY_AUTH_ENABLED&&!['/api/solo','/api/speech/assess'].includes(url.pathname))return error('Chức năng tài khoản đã ngừng sử dụng.',410);
  if(url.pathname==='/api/setup/status'&&request.method==='GET'){
    const parent=await env.DB.prepare("SELECT id FROM users WHERE role='parent' LIMIT 1").first();return reply({needed:!parent});
  }
  if(url.pathname==='/api/google/config'&&request.method==='GET')return reply({clientId:env.GOOGLE_CLIENT_ID||''});
  if(url.pathname==='/api/google/login'&&request.method==='POST'){
    if(!env.GOOGLE_CLIENT_ID||!env.PARENT_GOOGLE_EMAIL_HASH)return error('Đăng nhập Google chưa được cấu hình.',503);
    let identity;
    try{identity=await googleIdentity(env,(await bodyOf(request)).credential)}catch{return error('Không xác minh được tài khoản Google. Hãy thử lại.',401)}
    let user=await env.DB.prepare('SELECT id,role,display_name,username FROM users WHERE google_sub=?').bind(identity.sub).first();
    if(!user){
      const hash=await emailHash(env,identity.email);
      const isParent=equal(hash,env.PARENT_GOOGLE_EMAIL_HASH);
      if(isParent){
        const parent=await env.DB.prepare("SELECT id,google_sub FROM users WHERE role='parent' LIMIT 1").first();
        if(parent){
          if(parent.google_sub)return error('Tài khoản phụ huynh đã nối với Google khác.',403);
          await env.DB.prepare('UPDATE users SET google_sub=? WHERE id=? AND google_sub IS NULL').bind(identity.sub,parent.id).run();
          user=await env.DB.prepare('SELECT id,role,display_name,username FROM users WHERE id=?').bind(parent.id).first();
        }else{
          const id=crypto.randomUUID(),username=`parent-${id.slice(0,8)}`,now=new Date().toISOString();
          await env.DB.prepare('INSERT INTO users (id,username,role,parent_id,display_name,code_hash,google_sub,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,username,'parent',null,identity.name,await hashCode(env,username,code()),identity.sub,now).run();
          user={id,role:'parent',display_name:identity.name,username};
        }
      }else{
        const invited=await env.DB.prepare("SELECT id,role,display_name,username FROM users WHERE google_email_hash=? AND role='child'").bind(hash).first();
        if(!invited)return error('Tài khoản Google này chưa được phụ huynh thêm vào.',403);
        await env.DB.prepare('UPDATE users SET google_sub=?,google_email_hash=NULL WHERE id=? AND google_sub IS NULL').bind(identity.sub,invited.id).run();
        user=invited;
      }
    }
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()).run();
    return reply({role:user.role,name:user.display_name},200,{'set-cookie':await newSession(env,user.id,secure)});
  }
  if(url.pathname==='/api/setup'&&request.method==='POST'){
    const parent=await env.DB.prepare("SELECT id FROM users WHERE role='parent' LIMIT 1").first();if(parent)return error('Tài khoản phụ huynh đã được tạo.',409);
    const body=await bodyOf(request),username=String(body.username||'').trim().toLowerCase(),name=String(body.name||'').trim();
    if(!env.SETUP_KEY||!equal(String(body.setupKey||''),env.SETUP_KEY)||!validUsername(username)||!validName(name))return error('Mã thiết lập hoặc thông tin không hợp lệ.',400);
    const accessCode=code(),id=crypto.randomUUID(),now=new Date().toISOString();
    await env.DB.prepare('INSERT INTO users (id,username,role,parent_id,display_name,code_hash,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,username,'parent',null,name,await hashCode(env,username,accessCode),now).run();
    return reply({username,accessCode},201);
  }
  if(url.pathname==='/api/setup/recover'&&request.method==='POST'){
    const body=await bodyOf(request),username=String(body.username||'').trim().toLowerCase();
    if(!env.SETUP_KEY||!equal(String(body.setupKey||''),env.SETUP_KEY)||!validUsername(username))return error('Mã khôi phục hoặc tên đăng nhập không hợp lệ.',400);
    const parent=await env.DB.prepare("SELECT id FROM users WHERE username=? AND role='parent'").bind(username).first();if(!parent)return error('Không tìm thấy tài khoản phụ huynh.',404);
    const accessCode=code();await env.DB.prepare('UPDATE users SET code_hash=? WHERE id=?').bind(await hashCode(env,username,accessCode),parent.id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(parent.id).run();
    return reply({username,accessCode});
  }
  if(url.pathname==='/api/login'&&request.method==='POST'){
    const body=await bodyOf(request),username=String(body.username||'').trim().toLowerCase();
    if(!validUsername(username))return error('Tên đăng nhập hoặc mã truy cập không đúng.',401);
    const throttle=await env.DB.prepare('SELECT failures,locked_until FROM auth_throttle WHERE username=?').bind(username).first();
    if(throttle?.locked_until>Date.now())return error('Đã thử quá nhiều lần. Hãy thử lại sau 15 phút.',429);
    const user=await env.DB.prepare('SELECT id,username,role,parent_id,display_name,code_hash FROM users WHERE username=?').bind(username).first();
    const supplied=await hashCode(env,username,body.accessCode);
    if(!user||!equal(supplied,user.code_hash)){
      const failures=(throttle?.failures||0)+1,locked=failures>=5?Date.now()+900000:0;
      await env.DB.prepare('INSERT INTO auth_throttle (username,failures,locked_until) VALUES (?,?,?) ON CONFLICT(username) DO UPDATE SET failures=excluded.failures,locked_until=excluded.locked_until').bind(username,locked?0:failures,locked).run();
      return error('Tên đăng nhập hoặc mã truy cập không đúng.',401);
    }
    await env.DB.prepare('DELETE FROM auth_throttle WHERE username=?').bind(username).run();
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()).run();
    return reply({role:user.role,name:user.display_name,username:user.username},200,{'set-cookie':await newSession(env,user.id,secure)});
  }
  const solo=await soloUser(request,env);
  if(url.pathname==='/api/solo'&&request.method==='GET'){
    if(!solo)return error('Cần mở liên kết riêng của bé.',401);
    const row=await env.DB.prepare('SELECT data_json,revision FROM progress WHERE user_id=?').bind(solo.id).first();
    if(!row)return error('Chưa có tiến độ.',404);
    return reply({id:solo.id,name:solo.display_name,data:JSON.parse(row.data_json),revision:row.revision});
  }
  if(url.pathname==='/api/solo'&&request.method==='PUT'){
    if(!solo)return error('Cần mở liên kết riêng của bé.',401);
    const body=await bodyOf(request);
    if(!Number.isInteger(body.revision)||body.revision<0||!validData(body.data))return error('Tiến độ không hợp lệ.',400);
    const name=body.data.name.trim(),now=new Date().toISOString();
    const updated=await env.DB.prepare('UPDATE progress SET data_json=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(JSON.stringify(body.data),now,solo.id,body.revision).run();
    if(updated.meta?.changes!==1)return error('Tiến độ đã thay đổi ở thiết bị khác.',409);
    await env.DB.prepare('UPDATE users SET display_name=? WHERE id=?').bind(name,solo.id).run();
    return reply({revision:body.revision+1});
  }
  const user=await sessionUser(request,env);
  if(!user&&!solo)return error('Cần mở liên kết riêng của bé.',401);
  if(url.pathname==='/api/session'&&request.method==='GET')return reply({role:user.role,name:user.display_name,username:user.username});
  if(url.pathname==='/api/logout'&&request.method==='POST'){
    const token=/\bquest_session=([^;]+)/.exec(request.headers.get('cookie')||'')?.[1];if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(decodeURIComponent(token))).run();
    return reply({ok:true},200,{'set-cookie':clearCookie(secure)});
  }
  if(url.pathname==='/api/speech/assess'&&request.method==='POST'){
    if(!env.AI)return error('Chấm nói chưa được cấu hình.',503);
    const profileId=solo?.id||url.searchParams.get('profile'),level=Number(url.searchParams.get('level')),sample=Number(url.searchParams.get('sample')||0);
    if(!/^[a-f0-9-]{36}$/.test(profileId||'')||!Number.isInteger(level)||level<1||level>SPEAKING_MODELS.length||!Number.isInteger(sample)||sample<0||sample>=SPEAKING_MODELS[level-1].length)return error('Bài nói không hợp lệ.',400);
    const child=await env.DB.prepare("SELECT id,parent_id FROM users WHERE id=? AND role='child'").bind(profileId).first();
    if(!child||!solo&&!permitted(user,child))return error('Không tìm thấy học sinh.',404);
    if(Number(request.headers.get('content-length'))>800000)return error('Bản ghi quá dài; tối đa 20 giây.',413);
    const audio=await request.arrayBuffer();
    const header=new Uint8Array(audio,0,Math.min(audio.byteLength,12));
    if(audio.byteLength<32044||audio.byteLength>800000||String.fromCharCode(...header.subarray(0,4))!=='RIFF'||String.fromCharCode(...header.subarray(8,12))!=='WAVE')return error('Cần ghi âm 1–20 giây ở định dạng WAV.',400);
    const day=new Date().toISOString().slice(0,10);
    const usage=await env.DB.prepare('INSERT INTO speech_usage (user_id,day_utc,attempts) VALUES (?,?,1) ON CONFLICT(user_id,day_utc) DO UPDATE SET attempts=attempts+1 WHERE attempts<25').bind(child.id,day).run();
    if(usage.meta?.changes!==1)return error('Hôm nay đã dùng hết 25 lượt chấm nói. Bé có thể luyện lại vào ngày mai.',429);
    let result;
    try{result=await env.AI.run('@cf/openai/whisper-large-v3-turbo',{audio:base64Audio(audio),task:'transcribe',language:'en',vad_filter:true});}
    catch{return error('Dịch vụ nhận diện đang bận. Hãy thử lại sau.',503)}
    const transcript=typeof result?.text==='string'?result.text.trim().slice(0,500):'';
    const reference=SPEAKING_MODELS[level-1][sample],assessment=speechScore(reference,transcript);
    return reply({transcript,reference,...assessment,remaining:25-Number((await env.DB.prepare('SELECT attempts FROM speech_usage WHERE user_id=? AND day_utc=?').bind(child.id,day).first())?.attempts||25)});
  }
  if(!user)return error('Cần tài khoản quản trị.',401);
  const list=url.pathname==='/api/profiles',match=/^\/api\/profiles\/([a-f0-9-]{36})$/.exec(url.pathname),codeMatch=/^\/api\/profiles\/([a-f0-9-]{36})\/code$/.exec(url.pathname);
  if(list&&request.method==='GET'){
    const result=user.role==='parent'?await env.DB.prepare("SELECT id,display_name AS name,username,created_at,google_email_hash IS NOT NULL AS google_pending,google_sub IS NOT NULL AS google_linked FROM users WHERE parent_id=? AND role='child' ORDER BY created_at ASC").bind(user.id).all():await env.DB.prepare('SELECT id,display_name AS name,username,created_at FROM users WHERE id=?').bind(user.id).all();
    return reply({profiles:result.results||[]});
  }
  if(list&&request.method==='POST'){
    if(user.role!=='parent')return error('Chỉ phụ huynh tạo tài khoản học sinh.',403);
    const body=await bodyOf(request),name=String(body.name||'').trim(),googleEmail=String(body.googleEmail||'').trim().toLowerCase(),googleMode=Boolean(googleEmail),username=googleMode?`learner-${crypto.randomUUID().slice(0,8)}`:String(body.username||'').trim().toLowerCase();
    if(!validName(name)||!validUsername(username)||!validData(body.data)||googleMode&&!validEmail(googleEmail))return error('Thông tin học sinh không hợp lệ.',400);
    if(googleMode&&!env.GOOGLE_CLIENT_ID)return error('Đăng nhập Google chưa được cấu hình.',503);
    if(googleMode&&equal(await emailHash(env,googleEmail),env.PARENT_GOOGLE_EMAIL_HASH||''))return error('Cần dùng tài khoản Google riêng của bé.',400);
    const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE parent_id=? AND role='child'").bind(user.id).first();if(count.n>=10)return error('Tối đa 10 tài khoản học sinh.',400);
    const existing=await env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first();if(existing)return error('Tên đăng nhập đã được dùng.',409);
    const id=crypto.randomUUID(),now=new Date().toISOString(),accessCode=code(),data={...body.data,name};
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users (id,username,role,parent_id,display_name,code_hash,google_email_hash,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,username,'child',user.id,name,await hashCode(env,username,googleMode?code():accessCode),googleMode?await emailHash(env,googleEmail):null,now),
      env.DB.prepare('INSERT INTO progress (user_id,data_json,revision,updated_at) VALUES (?,?,0,?)').bind(id,JSON.stringify(data),now)
    ]);
    return reply({id,name,username,googlePending:googleMode,...(googleMode?{}:{accessCode}),revision:0},201);
  }
  const inviteMatch=/^\/api\/profiles\/([a-f0-9-]{36})\/google-invite$/.exec(url.pathname);
  if(inviteMatch&&request.method==='PUT'){
    if(user.role!=='parent'||!env.GOOGLE_CLIENT_ID)return error('Không thể nối Google.',403);
    const child=await env.DB.prepare("SELECT id FROM users WHERE id=? AND parent_id=? AND role='child' AND google_sub IS NULL").bind(inviteMatch[1],user.id).first();
    if(!child)return error('Không tìm thấy học sinh chưa nối Google.',404);
    const email=String((await bodyOf(request)).googleEmail||'').trim().toLowerCase();
    if(!validEmail(email)||equal(await emailHash(env,email),env.PARENT_GOOGLE_EMAIL_HASH||''))return error('Email của bé không hợp lệ.',400);
    await env.DB.prepare('UPDATE users SET google_email_hash=? WHERE id=?').bind(await emailHash(env,email),child.id).run();
    return reply({ok:true});
  }
  if(codeMatch&&request.method==='POST'){
    if(user.role!=='parent')return error('Chỉ phụ huynh đặt lại mã.',403);
    const child=await env.DB.prepare("SELECT id,username FROM users WHERE id=? AND parent_id=? AND role='child'").bind(codeMatch[1],user.id).first();if(!child)return error('Không tìm thấy học sinh.',404);
    const accessCode=code();await env.DB.prepare('UPDATE users SET code_hash=? WHERE id=?').bind(await hashCode(env,child.username,accessCode),child.id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(child.id).run();
    return reply({username:child.username,accessCode});
  }
  if(match){
    const child=await env.DB.prepare("SELECT id,parent_id,display_name AS name FROM users WHERE id=? AND role='child'").bind(match[1]).first();if(!permitted(user,child))return error('Không tìm thấy học sinh.',404);
    if(request.method==='DELETE'){
      if(user.role!=='parent')return error('Chỉ phụ huynh xóa tài khoản học sinh.',403);
      await env.DB.batch([
        env.DB.prepare('DELETE FROM solo_links WHERE user_id=?').bind(child.id),
        env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(child.id),
        env.DB.prepare('DELETE FROM progress WHERE user_id=?').bind(child.id),
        env.DB.prepare('DELETE FROM speech_usage WHERE user_id=?').bind(child.id),
        env.DB.prepare('DELETE FROM users WHERE id=? AND parent_id=?').bind(child.id,user.id)
      ]);
      return reply({ok:true});
    }
    if(request.method==='GET'){
      const row=await env.DB.prepare('SELECT data_json,revision FROM progress WHERE user_id=?').bind(child.id).first();if(!row)return error('Chưa có tiến độ.',404);
      return reply({id:child.id,name:child.name,data:JSON.parse(row.data_json),revision:row.revision});
    }
    if(request.method==='PUT'){
      const body=await bodyOf(request);if(!Number.isInteger(body.revision)||body.revision<0||!validData(body.data))return error('Tiến độ không hợp lệ.',400);
      const name=body.data.name.trim(),now=new Date().toISOString();
      const updated=await env.DB.prepare('UPDATE progress SET data_json=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(JSON.stringify(body.data),now,child.id,body.revision).run();
      if(updated.meta?.changes!==1)return error('Tiến độ đã thay đổi ở thiết bị khác.',409);
      await env.DB.prepare('UPDATE users SET display_name=? WHERE id=?').bind(name,child.id).run();
      return reply({revision:body.revision+1});
    }
  }
  return error('Không tìm thấy chức năng.',404);
}
export default {async fetch(request,env){
  const url=new URL(request.url);
  const link=/^\/start\/([a-f0-9]{64})$/.exec(url.pathname);
  if(link){
    if(request.method!=='GET')return new Response('Method not allowed',{status:405});
    if(!env.DB||!env.AUTH_PEPPER)return new Response('Unavailable',{status:503});
    const tokenHash=await sha(link[1]);
    const found=await env.DB.prepare('SELECT user_id FROM solo_links WHERE token_hash=?').bind(tokenHash).first();
    if(!found)return new Response('Liên kết không hợp lệ.',{status:404,headers:{'cache-control':'no-store','referrer-policy':'no-referrer'}});
    return new Response(null,{status:302,headers:{location:'/', 'set-cookie':soloCookie(link[1],url.protocol==='https:'),'cache-control':'no-store','referrer-policy':'no-referrer','x-robots-tag':'noindex'}});
  }
  if(url.pathname.startsWith('/api/')){
    try{return await api(request,env,url)}catch(e){if(e?.message==='Dữ liệu quá lớn.'||e?.message==='Dữ liệu không hợp lệ.')return error(e.message,400);return error('Máy chủ chưa xử lý được yêu cầu.',500)}
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  const path=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  if(path.includes('..')||!Object.hasOwn(ASSETS,path))return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:ASSETS[path],{headers:{'content-type':assetType(path),'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-robots-tag':'noindex'}});
}};

