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
const cookie=(token,secure)=>`quest_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=2592000${secure?'; Secure':''}`;
const clearCookie=secure=>`quest_session=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${secure?'; Secure':''}`;
const assetType=p=>p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.css')?'text/css; charset=utf-8':p.endsWith('.js')?'text/javascript; charset=utf-8':p.endsWith('.svg')?'image/svg+xml':'application/octet-stream';
async function bodyOf(request){const raw=await request.text();if(raw.length>350000)throw Error('Dữ liệu quá lớn.');try{return JSON.parse(raw)}catch{throw Error('Dữ liệu không hợp lệ.')}}
async function sessionUser(request,env){
  const token=/\bquest_session=([^;]+)/.exec(request.headers.get('cookie')||'')?.[1];if(!token)return null;
  const tokenHash=await sha(decodeURIComponent(token));
  return env.DB.prepare('SELECT u.id,u.username,u.role,u.parent_id,u.display_name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(tokenHash,Date.now()).first();
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
    if(!request.headers.get('content-type')?.startsWith('application/json'))return error('Yêu cầu phải là JSON.',415);
  }
  if(url.pathname==='/api/setup/status'&&request.method==='GET'){
    const parent=await env.DB.prepare("SELECT id FROM users WHERE role='parent' LIMIT 1").first();return reply({needed:!parent});
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
  const user=await sessionUser(request,env);
  if(!user)return error('Cần đăng nhập.',401);
  if(url.pathname==='/api/session'&&request.method==='GET')return reply({role:user.role,name:user.display_name,username:user.username});
  if(url.pathname==='/api/logout'&&request.method==='POST'){
    const token=/\bquest_session=([^;]+)/.exec(request.headers.get('cookie')||'')?.[1];if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(decodeURIComponent(token))).run();
    return reply({ok:true},200,{'set-cookie':clearCookie(secure)});
  }
  const list=url.pathname==='/api/profiles',match=/^\/api\/profiles\/([a-f0-9-]{36})$/.exec(url.pathname),codeMatch=/^\/api\/profiles\/([a-f0-9-]{36})\/code$/.exec(url.pathname);
  if(list&&request.method==='GET'){
    const result=user.role==='parent'?await env.DB.prepare("SELECT id,display_name AS name,username,created_at FROM users WHERE parent_id=? AND role='child' ORDER BY created_at ASC").bind(user.id).all():await env.DB.prepare('SELECT id,display_name AS name,username,created_at FROM users WHERE id=?').bind(user.id).all();
    return reply({profiles:result.results||[]});
  }
  if(list&&request.method==='POST'){
    if(user.role!=='parent')return error('Chỉ phụ huynh tạo tài khoản học sinh.',403);
    const body=await bodyOf(request),name=String(body.name||'').trim(),username=String(body.username||'').trim().toLowerCase();
    if(!validName(name)||!validUsername(username)||!validData(body.data))return error('Thông tin học sinh không hợp lệ.',400);
    const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE parent_id=? AND role='child'").bind(user.id).first();if(count.n>=10)return error('Tối đa 10 tài khoản học sinh.',400);
    const existing=await env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first();if(existing)return error('Tên đăng nhập đã được dùng.',409);
    const id=crypto.randomUUID(),now=new Date().toISOString(),accessCode=code(),data={...body.data,name};
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users (id,username,role,parent_id,display_name,code_hash,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,username,'child',user.id,name,await hashCode(env,username,accessCode),now),
      env.DB.prepare('INSERT INTO progress (user_id,data_json,revision,updated_at) VALUES (?,?,0,?)').bind(id,JSON.stringify(data),now)
    ]);
    return reply({id,name,username,accessCode,revision:0},201);
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
        env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(child.id),
        env.DB.prepare('DELETE FROM progress WHERE user_id=?').bind(child.id),
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
  if(url.pathname.startsWith('/api/')){
    try{return await api(request,env,url)}catch(e){if(e?.message==='Dữ liệu quá lớn.'||e?.message==='Dữ liệu không hợp lệ.')return error(e.message,400);return error('Máy chủ chưa xử lý được yêu cầu.',500)}
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  const path=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  if(path.includes('..')||!Object.hasOwn(ASSETS,path))return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:ASSETS[path],{headers:{'content-type':assetType(path),'cache-control':path==='index.html'?'no-store':'public, max-age=3600','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex'}});
}};

