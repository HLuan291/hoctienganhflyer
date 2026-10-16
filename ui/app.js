const PACKS = window.QUEST_PACKS;
const TRACKS = window.QUEST_TRACKS;
const STORE_KEY = 'english-quest-progress-v1';
const GIFTS = ['🌟','🦋','🌈','🐱','🎨','🧸','🪁','🦄','📚','🎵','🪐','🌻'];
const trackById = id => TRACKS.find(t => t.id === id);
const keyFor = (track, level) => `${track}-${level}`;
const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmtTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`;
const fmtDate = date => new Date(date).toLocaleDateString('vi-VN');
const round1 = n => Math.round(n * 10) / 10;

function loadData(){
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
    if (parsed && typeof parsed === 'object' && parsed.completed && Array.isArray(parsed.history)) {
      if(!parsed.cards || typeof parsed.cards!=='object' || Array.isArray(parsed.cards)) parsed.cards={};
      if(!parsed.games || typeof parsed.games!=='object' || Array.isArray(parsed.games)) parsed.games={};
      if(!parsed.placement || typeof parsed.placement!=='object') parsed.placement={done:true,results:{},starts:{}};
      parsed.placement.results??={};parsed.placement.starts??={};
      return parsed;
    }
  } catch (_) {}
  return {name:'Bé', completed:{}, history:[], cards:{}, games:{}, placement:{done:false,results:{},starts:{}}, sound:true, createdAt:new Date().toISOString()};
}
let data = loadData();
let currentView = 'home';
let currentTrack = 'vocab';
let lesson = null;
let audioBlobUrl = null;
let recorder = null;
let stream = null;
let profiles=[];
let activeProfile=null;
let accountError='';
let accountNotice='';
let session=null;
let setupNeeded=false;
let googleClientId='';
let syncPending=false;
let syncBusy=false;

function freshData(name='Bé'){return {name,completed:{},history:[],cards:{},games:{},placement:{done:false,results:{},starts:{}},sound:true,createdAt:new Date().toISOString()};}
function updateSync(label){const el=document.getElementById('syncState');if(el)el.textContent=label;}
async function accountApi(path,options={}){
  const response=await fetch(`/api/${path}`,{credentials:'same-origin',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(payload.error||`Lỗi ${response.status}`);error.status=response.status;throw error;}
  return payload;
}
function mergeProgress(remote,local){
  const out={...remote,name:local.name,sound:local.sound,completed:{...remote.completed},cards:{...remote.cards},games:{...remote.games}};
  for(const [k,v] of Object.entries(local.completed||{})){const old=out.completed[k];out.completed[k]=old&&Number(old.best)>Number(v.best)?old:v;}
  const history=new Map();for(const h of [...(remote.history||[]),...(local.history||[])])history.set(`${h.date}:${h.track}:${h.level}:${h.score}`,h);
  out.history=[...history.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-500);
  for(const [k,v] of Object.entries(local.cards||{})){const old=out.cards[k]||{};out.cards[k]={...old,...v,readPass:Boolean(old.readPass||v.readPass),writePass:Boolean(old.writePass||v.writePass),readScore:Math.max(old.readScore||0,v.readScore||0),writeScore:Math.max(old.writeScore||0,v.writeScore||0),readAttempts:Math.max(old.readAttempts||0,v.readAttempts||0),writeAttempts:Math.max(old.writeAttempts||0,v.writeAttempts||0)};}
  for(const [k,v] of Object.entries(local.games||{})){const old=out.games[k]||{};out.games[k]={...old,...v,best:Math.max(old.best||0,v.best||0),attempts:Math.max(old.attempts||0,v.attempts||0)};}
  out.placement=local.placement||remote.placement;
  return out;
}
async function flushProfile(){
  if(syncBusy||!activeProfile)return;
  syncBusy=true;
  while(syncPending&&activeProfile){
    syncPending=false;updateSync('Đang lưu…');
    try{
      const selected=activeProfile;
      const result=await accountApi(`profiles/${encodeURIComponent(selected.id)}`,{method:'PUT',body:JSON.stringify({revision:selected.revision,data})});
      selected.revision=result.revision;selected.name=data.name;
      const listed=profiles.find(p=>p.id===selected.id);if(listed)listed.name=data.name;
      if(!syncPending)localStorage.removeItem(`${STORE_KEY}:${selected.id}`);
      updateSync('Đã lưu');
    }catch(error){
      if(error.status===409){
        try{const latest=await accountApi(`profiles/${encodeURIComponent(activeProfile.id)}`);data=mergeProgress(latest.data,data);activeProfile.revision=latest.revision;syncPending=true;continue;}
        catch(_){}
      }
      syncPending=true;updateSync('Chưa đồng bộ');break;
    }
  }
  syncBusy=false;
}
function persist(){
  localStorage.setItem(activeProfile?`${STORE_KEY}:${activeProfile.id}`:STORE_KEY,JSON.stringify(data));
  if(activeProfile){syncPending=true;void flushProfile();}
}
async function selectProfile(id){
  if(syncBusy||syncPending){accountError='Tiến độ chưa đồng bộ. Hãy thử lưu lại trước khi mở hồ sơ.';setView('account');return;}
  try{
    const profile=await accountApi(`profiles/${encodeURIComponent(id)}`);
    activeProfile={id:profile.id,name:profile.name,revision:profile.revision};
    data=profile.data;
    try{const unsynced=JSON.parse(localStorage.getItem(`${STORE_KEY}:${profile.id}`));if(unsynced?.completed&&Array.isArray(unsynced.history)){data=mergeProgress(data,unsynced);syncPending=true;}}catch(_){}
    if(!data.placement)data.placement={done:Boolean(data.history?.length),results:{},starts:{}};
    data.placement.results??={};data.placement.starts??={};
    document.getElementById('profileToggle').textContent=profile.name.charAt(0).toUpperCase();
    updateSync(syncPending?'Đang lưu…':'Đã lưu');if(syncPending)void flushProfile();setView(data.placement.done||data.history?.length?'home':'assessment');
  }catch(error){accountError=error.message;setView('account');}
}
async function bootstrapAccount(){
  try{googleClientId=(await accountApi('google/config')).clientId||'';}catch(_){googleClientId='';}
  try{
    session=await accountApi('session');setupNeeded=false;
    document.querySelector('.sidebar .nav-item[data-view="parent"]').style.display=session.role==='child'?'none':'';
    const result=await accountApi('profiles');profiles=result.profiles;accountError='';
    if(profiles.length===1)await selectProfile(profiles[0].id);else setView('account');
  }catch(error){session=null;activeProfile=null;profiles=[];if(error.status===401){try{setupNeeded=(await accountApi('setup/status')).needed;accountError='';}catch(e){accountError=e.message;}}else accountError=`Không tải được tài khoản: ${error.message}`;setView('account');}
}
async function createProfile(){
  if(session?.role!=='parent')return;
  if(syncBusy||syncPending){accountError='Hãy lưu xong tiến độ hiện tại trước khi tạo hồ sơ khác.';setView('account');return;}
  const input=document.getElementById('newProfileName'),name=input?.value.trim(),googleEmail=document.getElementById('newProfileGoogleEmail')?.value.trim().toLowerCase();if(!name||!googleEmail){(name?document.getElementById('newProfileGoogleEmail'):input)?.focus();return;}
  const old=loadData(),hasOld=Object.keys(old.completed||{}).length||old.history?.length||Object.keys(old.cards||{}).length;
  const seed=hasOld&&document.getElementById('importOldProgress')?.checked?old:freshData(name);
  seed.name=name.slice(0,25);
  try{const created=await accountApi('profiles',{method:'POST',body:JSON.stringify({name:seed.name,googleEmail,data:seed})});profiles.push({id:created.id,name:created.name,username:created.username,google_pending:1});accountError='';accountNotice=`Đã thêm hồ sơ ${created.name}. Bé dùng đúng tài khoản Google vừa nhập để đăng nhập. Nếu nhập sai email, hãy sửa lời mời ở hồ sơ.`;setView('account');}
  catch(error){accountError=`Không tạo được hồ sơ: ${error.message}`;setView('account');}
}
async function login(){
  const username=document.getElementById('loginUsername')?.value.trim(),accessCode=document.getElementById('loginCode')?.value.trim();if(!username||!accessCode)return;
  try{await accountApi('login',{method:'POST',body:JSON.stringify({username,accessCode})});accountError='';accountNotice='';await bootstrapAccount();}
  catch(error){accountError=error.message;setView('account');}
}
async function googleLogin(credential){
  try{await accountApi('google/login',{method:'POST',body:JSON.stringify({credential})});accountError='';accountNotice='';await bootstrapAccount();}
  catch(error){accountError=error.message;setView('account');}
}
function renderGoogleButton(){
  if(!document.getElementById('googleSignIn')||!googleClientId)return;
  const draw=()=>{
    const container=document.getElementById('googleSignIn');if(!container||!window.google?.accounts?.id)return;
    window.google.accounts.id.initialize({client_id:googleClientId,callback:response=>void googleLogin(response.credential),auto_select:false});
    window.google.accounts.id.renderButton(container,{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'pill',width:280});
  };
  if(window.google?.accounts?.id){draw();return;}
  if(document.getElementById('googleIdentityScript'))return;
  const script=document.createElement('script');script.id='googleIdentityScript';script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.onload=draw;script.onerror=()=>{const el=document.getElementById('googleSignIn');if(el)el.textContent='Không tải được Google. Hãy kiểm tra mạng rồi tải lại trang.'};document.head.append(script);
}
async function updateGoogleInvite(id){
  const googleEmail=document.getElementById(`invite-${id}`)?.value.trim().toLowerCase();if(!googleEmail)return;
  try{await accountApi(`profiles/${encodeURIComponent(id)}/google-invite`,{method:'PUT',body:JSON.stringify({googleEmail})});const profile=profiles.find(p=>p.id===id);if(profile)profile.google_pending=1;accountError='';accountNotice='Đã cập nhật tài khoản Google của bé. Bé hãy đăng nhập bằng địa chỉ vừa nhập.';setView('account');}
  catch(error){accountError=error.message;setView('account');}
}
async function setupParent(){
  const setupKey=document.getElementById('setupKey')?.value.trim(),username=document.getElementById('setupUsername')?.value.trim(),name=document.getElementById('setupName')?.value.trim();
  if(!setupKey||!username||!name)return;
  try{const created=await accountApi('setup',{method:'POST',body:JSON.stringify({setupKey,username,name})});setupNeeded=false;accountError='';accountNotice=`Tài khoản phụ huynh: ${created.username}. Mã truy cập: ${created.accessCode}. Hãy lưu lại ngay; mã chỉ hiện một lần.`;setView('account');}
  catch(error){accountError=error.message;setView('account');}
}
async function recoverParent(){
  const username=document.getElementById('recoverUsername')?.value.trim(),setupKey=document.getElementById('recoverKey')?.value.trim();if(!username||!setupKey)return;
  try{const result=await accountApi('setup/recover',{method:'POST',body:JSON.stringify({username,setupKey})});accountError='';accountNotice=`Mã mới của phụ huynh ${result.username}: ${result.accessCode}. Mã cũ đã hết hiệu lực. Hãy lưu mã mới ngay.`;setView('account');}
  catch(error){accountError=error.message;setView('account');}
}
async function logout(){
  if(syncBusy){await new Promise(resolve=>{const timer=setInterval(()=>{if(!syncBusy){clearInterval(timer);resolve()}},50);setTimeout(()=>{clearInterval(timer);resolve()},3000)});}
  if(syncPending)await flushProfile();
  if(syncPending){accountError='Tiến độ chưa đồng bộ. Hãy thử lưu lại trước khi đăng xuất.';setView('account');return;}
  try{await accountApi('logout',{method:'POST',body:'{}'});}catch(error){accountError=`Chưa đăng xuất được: ${error.message}`;setView('account');return;}
  session=null;activeProfile=null;profiles=[];data=freshData();syncPending=false;accountNotice='';accountError='';document.getElementById('profileToggle').textContent='E';updateSync('');setView('account');
}
async function resetCode(id){
  try{const result=await accountApi(`profiles/${encodeURIComponent(id)}/code`,{method:'POST',body:'{}'});accountError='';accountNotice=`Mã mới của ${result.username}: ${result.accessCode}. Mã cũ và các phiên đăng nhập cũ đã hết hiệu lực. Hãy lưu mã mới ngay.`;setView('account');}
  catch(error){accountError=error.message;setView('account');}
}
async function deleteProfile(id){
  const selected=profiles.find(p=>p.id===id);if(!selected||!confirm(`Xóa tài khoản ${selected.name} và toàn bộ tiến độ? Việc này không thể hoàn tác nếu chưa tải bản sao.`))return;
  if(syncBusy){accountError='Đang lưu tiến độ. Hãy thử xóa lại sau khi lưu xong.';setView('account');return;}
  try{await accountApi(`profiles/${encodeURIComponent(id)}`,{method:'DELETE',body:'{}'});profiles=profiles.filter(p=>p.id!==id);localStorage.removeItem(`${STORE_KEY}:${id}`);if(activeProfile?.id===id){activeProfile=null;data=freshData();syncPending=false;document.getElementById('profileToggle').textContent='E';}accountError='';accountNotice=`Đã xóa tài khoản ${selected.name} và tiến độ trên máy chủ.`;setView('account');}
  catch(error){accountError=error.message;setView('account');}
}
function renderAccount(){
  const old=loadData(),hasOld=Object.keys(old.completed||{}).length||old.history?.length||Object.keys(old.cards||{}).length;
  const messages=`${accountError?`<div class="warning" role="alert">${safe(accountError)} <button id="retryAccounts" class="outline-btn">Thử tải lại</button></div>`:''}${accountNotice?`<div class="card guide-card" role="status"><strong>Thông tin đăng nhập — chỉ hiển thị lần này</strong><p class="credential-note">${safe(accountNotice)}</p></div>`:''}`;
  if(!session)return `<div class="assessment-head"><span class="eyebrow">TÀI KHOẢN RIÊNG</span><h1 class="page-title">Đăng nhập để tiếp tục</h1><p class="page-intro">Phụ huynh và bé dùng tài khoản Google riêng. Tiến độ của bé được giữ trong hồ sơ học tập.</p></div>${messages}
    ${googleClientId?`<div class="card guide-card profile-create"><h2>Đăng nhập bằng Google</h2><p>Phụ huynh dùng Google đã đăng ký; bé dùng Google được phụ huynh thêm vào hồ sơ.</p><div id="googleSignIn"></div><p>Trang chỉ lưu mã nhận dạng Google của tài khoản đã kết nối; email của bé không hiện trên hồ sơ công khai.</p></div>`:`<div class="card guide-card profile-create"><h2>Đăng nhập Google đang được thiết lập</h2><p>Hãy thử lại sau khi quản trị hoàn tất cấu hình.</p></div>`}
    <details class="card guide-card profile-create"><summary>Đăng nhập bằng mã cũ</summary><div class="login-fields"><input class="text-input" id="loginUsername" autocomplete="username" placeholder="Tên đăng nhập"><input class="text-input" id="loginCode" type="password" autocomplete="current-password" placeholder="Mã truy cập"><button class="accent-btn" id="loginAccount">Đăng nhập →</button></div></details>
    ${setupNeeded&&!googleClientId?`<details class="card guide-card profile-create"><summary>Thiết lập phụ huynh bằng mã cũ</summary><div class="login-fields"><input class="text-input" id="setupKey" type="password" placeholder="Mã thiết lập"><input class="text-input" id="setupUsername" autocomplete="username" placeholder="Tên đăng nhập phụ huynh"><input class="text-input" id="setupName" placeholder="Tên phụ huynh"><button class="accent-btn" id="setupParent">Tạo tài khoản phụ huynh</button></div></details>`:''}
    ${setupNeeded?'':`<details class="card guide-card profile-create"><summary>Phụ huynh quên mã cũ?</summary><div class="login-fields"><input class="text-input" id="recoverUsername" placeholder="Tên đăng nhập phụ huynh"><input class="text-input" id="recoverKey" type="password" placeholder="Mã thiết lập máy chủ"><button class="outline-btn" id="recoverParent">Tạo mã mới</button></div></details>`}`;
  if(session.role==='child')return `<div class="assessment-head"><span class="eyebrow">HỒ SƠ CỦA BÉ</span><h1 class="page-title">${safe(session.name)}</h1><p class="page-intro">Tiến độ của bé được đồng bộ khi đăng nhập tài khoản này trên thiết bị khác.</p></div>${messages}<div class="utility-row"><button class="accent-btn" id="backProfile">Tiếp tục học</button><button class="outline-btn" id="logoutAccount">Đăng xuất</button></div>`;
  return `<div class="assessment-head"><span class="eyebrow">QUẢN LÝ HỌC SINH</span><h1 class="page-title">Ai sẽ học hôm nay?</h1><p class="page-intro">Thêm tài khoản Google riêng của bé để bé đăng nhập trên nhiều thiết bị.</p></div>${messages}
    <div class="assessment-grid">${profiles.map(p=>`<div class="card profile-card"><button data-profile="${safe(p.id)}"><span class="profile-letter">${safe(p.name.charAt(0).toUpperCase())}</span><strong>${safe(p.name)}</strong><small>${p.google_pending?'Chờ bé đăng nhập Google':p.google_linked?'Đã nối Google':'Hồ sơ dùng mã cũ'} · Mở hành trình →</small></button>${!p.google_linked?`<div class="login-fields"><input class="text-input" id="invite-${safe(p.id)}" type="email" autocomplete="off" placeholder="Google của bé"><button class="subtle-link" data-google-invite="${safe(p.id)}">${p.google_pending?'Sửa tài khoản Google':'Nối tài khoản Google'}</button></div>`:''}<button class="subtle-link" data-delete-profile="${safe(p.id)}">Xóa tài khoản và tiến độ</button></div>`).join('')}</div>
    <div class="card guide-card profile-create"><h2>Thêm hồ sơ cho bé</h2><p>Nhập đúng email Google riêng của bé. Email chỉ dùng để nối tài khoản khi bé đăng nhập lần đầu; web không hiển thị email trong danh sách hồ sơ.</p><div class="login-fields"><input class="text-input" id="newProfileName" maxlength="25" placeholder="Tên của bé"><input class="text-input" id="newProfileGoogleEmail" type="email" autocomplete="off" placeholder="Tài khoản Google của bé"><button class="accent-btn" id="createProfile">Thêm hồ sơ →</button></div>${hasOld?'<label class="profile-import"><input type="checkbox" id="importOldProgress" checked> Chuyển tiến độ đang lưu trên thiết bị này vào tài khoản mới</label>':''}<p>Nếu đã học trên trang cũ, phụ huynh có thể tải bản sao ở trang cũ rồi nhập vào hồ sơ này.</p></div>
    <div class="utility-row">${activeProfile?`<button class="outline-btn" id="backProfile">Quay lại bài học</button>${syncPending?'<button class="accent-btn" id="retrySync">Thử đồng bộ lại</button>':''}`:''}<button class="outline-btn" id="logoutAccount">Đăng xuất</button></div>`;
}
function completion(track, level){return data.completed[keyFor(track,level)];}
function passed(track, level){return Boolean(completion(track,level));}
function unlocked(track, level){return level <= (data.placement?.starts?.[track]||1) || passed(track,level-1);}
function countDone(track){return PACKS.filter(p => passed(track,p.id)).length;}
function totalDone(){return TRACKS.reduce((sum,t) => sum + countDone(t.id),0);}
function nextLevel(track){return PACKS.find(p => p.id >= (data.placement?.starts?.[track]||1) && !passed(track,p.id))?.id || 12;}
function reviewsDue(){
  const now=Date.now(),latest=new Map();
  data.history.forEach(h=>{const k=keyFor(h.track,h.level);if(!latest.has(k)||new Date(h.date)>new Date(latest.get(k).date))latest.set(k,h);});
  return TRACKS.flatMap(t=>PACKS.filter(p=>passed(t.id,p.id)).map(p=>({track:t.id,level:p.id,last:latest.get(keyFor(t.id,p.id))})))
    .filter(item=>item.last && now-new Date(item.last.date).getTime()>=((item.last.score<9?1:3)*86400000))
    .sort((a,b)=>new Date(a.last.date)-new Date(b.last.date)).slice(0,3);
}
function getNext(){
  const order = [...TRACKS].sort((a,b) => countDone(a.id)-countDone(b.id));
  const t = order[0]; return {track:t.id,level:nextLevel(t.id)};
}
function setView(view, track){
  if(!activeProfile&&view!=='account')view='account';
  if(session?.role==='child'&&view==='parent')view='home';
  if(currentView==='cards' && view!=='cards') window.QUEST_CARDS.cancelRecognition();
  if(currentView==='game' && view!=='game') window.QUEST_GAME.leave();
  currentView = view;
  if (track) currentTrack=track;
  document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.toggle('active',b.dataset.view===view));
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded','false');
  const titles={home:'Tổng quan',paths:'Lộ trình học',cards:'Thẻ từ vựng',game:'Đường đua tình huống',rewards:'Bộ sưu tập',parent:'Góc phụ huynh',about:'Về chương trình',assessment:'Kiểm tra đầu vào',account:'Hồ sơ học sinh'};
  document.getElementById('crumb').innerHTML=`${titles[view] || 'Tổng quan'} <span>/ English Quest</span>`;
  const renderers={home:renderHome,paths:renderPaths,cards:window.QUEST_CARDS.render,game:window.QUEST_GAME.render,rewards:renderRewards,parent:renderParent,about:renderAbout,assessment:renderAssessment,account:renderAccount};
  document.getElementById('mainContent').innerHTML=(renderers[view]||renderHome)();
  bindView();
  if(view==='account')renderGoogleButton();
  if(view==='cards') window.QUEST_CARDS.bind();
  if(view==='game') window.QUEST_GAME.bind();
  window.scrollTo({top:0,behavior:'smooth'});
}
function trackCard(t){
  const done=countDone(t.id), level=nextLevel(t.id), pct=done/12*100;
  return `<button class="track-card" data-track="${t.id}" aria-label="Mở lộ trình ${safe(t.name)}, đã hoàn thành ${done} trên 12 cấp">
    <span class="track-icon" style="background:${t.color}1f;color:${t.color}">${t.icon}</span><h3>${safe(t.name)}</h3><p>${safe(t.subtitle)}</p>
    <div class="track-bottom"><span>${done}/12 cấp</span><span>${done===12?'Hoàn thành':`Cấp ${level}`}</span></div><div class="mini-bar"><div style="width:${pct}%;background:${t.color}"></div></div>
  </button>`;
}
function renderHome(){
  const next=getNext(), pack=PACKS[next.level-1], t=trackById(next.track), n=totalDone();
  const reviews=reviewsDue();
  return `<section class="hero"><div class="hero-copy"><div class="hero-kicker">CHẶNG ĐƯỜNG MOVERS → FLYERS · ${safe(data.name)}</div><h1>Hôm nay mình khám phá gì?</h1><p>Chọn một kỹ năng, vượt từng trạm nhỏ và mở khóa hành trình Flyers.</p><button class="primary-btn" data-open="${next.track}:${next.level}">Tiếp tục chặng ${safe(t.name)} <span aria-hidden="true">↗</span></button></div><div class="hero-art" aria-hidden="true"><img src="./assets/explorer.svg" alt=""></div></section>
    ${!data.placement?.done?`<div class="info-strip"><strong>Chưa hoàn thành kiểm tra đầu vào.</strong> Làm các bài ngắn để gợi ý điểm bắt đầu cho từng kỹ năng. <button class="subtle-link" data-view="assessment">Kiểm tra ngay →</button></div>`:''}
    <div class="stats"><div class="stat-card"><span class="stat-icon">✦</span><div><strong>${n}/60</strong><span>Cấp đã chinh phục</span></div></div><div class="stat-card"><span class="stat-icon">◇</span><div><strong>${n}</strong><span>Danh hiệu đã nhận</span></div></div><div class="stat-card"><span class="stat-icon">☷</span><div><strong>${data.history.length}</strong><span>Lượt luyện tập</span></div></div></div>
    <div class="section-head"><div><h2>5 lộ trình của bé</h2><p>Mỗi kỹ năng đi từ Movers đến Flyers theo tiến độ riêng.</p></div><button class="subtle-link" data-view="paths">Xem tất cả →</button></div>
    <div class="track-grid">${TRACKS.map(trackCard).join('')}</div>
    <div class="section-head"><div><h2>Tiếp tục hành trình</h2><p>Một bước nhỏ hôm nay giúp bé nhớ lâu hơn.</p></div></div>
    <div class="two-col"><div class="card next-card"><div class="next-medal">${pack.icon}</div><div class="next-copy"><small>${pack.band.toUpperCase()} · ${safe(t.name.toUpperCase())} · CẤP ${next.level}</small><h3>${safe(pack.title)}</h3><p>${next.level<=6?'Ôn nền tảng Movers':'Vận dụng kỹ năng Flyers'} qua trò chơi ngắn.</p><button class="accent-btn" data-open="${next.track}:${next.level}">Vào bài học →</button></div></div><div class="card daily-card"><span class="daily-icons">🔊 🎙 ✎</span><strong>Học từ bằng thẻ</strong><p>Nghe phát âm, đọc thành tiếng và viết lại từng từ. Bộ thẻ Movers và Flyers mở theo lộ trình Từ vựng.</p><button class="outline-btn" data-view="cards">Mở thẻ từ vựng →</button></div></div>
    <div class="game-home-cta"><div class="game-home-icon" aria-hidden="true">↗</div><div><small>TRÒ CHƠI CÓ NGỮ CẢNH</small><h2>Đường đua tình huống</h2><p>Hiểu nghĩa, nghe từ, điền câu và đọc chuyện ngắn để vượt các trạm.</p></div><button class="primary-btn" data-view="game">Chơi ngay →</button></div>
    ${reviews.length?`<div class="section-head"><div><h2>Đến lúc ôn lại</h2><p>Các cấp đã học được nhắc lại sau vài ngày.</p></div></div><div class="level-grid">${reviews.map(r=>`<button class="level-card available" data-open="${r.track}:${r.level}"><span class="num">ÔN LẠI · ${safe(trackById(r.track).name.toUpperCase())}</span><span class="level-symbol">↻</span><h3>${safe(PACKS[r.level-1].title)}</h3><p>Lần gần nhất: ${Number(r.last.score).toFixed(1)}/10</p><span class="level-status">Luyện lại →</span></button>`).join('')}</div>`:''}
    <p class="footer-note">Bài tập do English Quest biên soạn; không phải đề thi hoặc sản phẩm chính thức của Cambridge English.</p>`;
}
function renderAssessment(){
  const tracks=TRACKS.filter(t=>t.id!=='speaking');
  const done=tracks.filter(t=>data.placement?.results?.[t.id]).length;
  return `<div class="assessment-head"><span class="eyebrow">BƯỚC KHỞI ĐẦU</span><h1 class="page-title">Tìm điểm bắt đầu phù hợp</h1><p class="page-intro">Mỗi kỹ năng có 3–9 câu ngắn. Chỉ khi làm đúng trọn một vòng, bé mới thử vòng khó hơn. Đây là gợi ý học tập, không phải xếp loại Cambridge.</p></div>
    <div class="card guide-card assessment-name"><label for="assessmentName"><strong>Tên học sinh</strong></label><div class="form-row"><input id="assessmentName" class="text-input" maxlength="25" value="${safe(data.name)}"><button id="saveAssessmentName" class="accent-btn">Lưu tên</button></div></div>
    <div class="section-head"><div><h2>Kiểm tra từng kỹ năng</h2><p>Đã hoàn thành ${done}/4. Nói bắt đầu ở Movers 1 vì web không thể tự xác nhận chất lượng nói.</p></div></div>
    <div class="assessment-grid">${tracks.map(t=>{const r=data.placement?.results?.[t.id];return `<div class="card assessment-card"><span class="track-icon">${t.icon}</span><h3>${safe(t.name)}</h3><p>${r?`Gợi ý bắt đầu ở cấp ${r.startLevel}. Bé vẫn có thể học lại cấp thấp hơn.`:'Chưa kiểm tra. Nếu chưa sẵn sàng, bé có thể bắt đầu từ cấp 1.'}</p><button class="${r?'outline-btn':'accent-btn'}" data-assess="${t.id}">${r?'Kiểm tra lại':'Bắt đầu kiểm tra'} →</button>${r?'':`<button class="subtle-link" data-assess-skip="${t.id}">Bắt đầu từ cấp 1</button>`}</div>`}).join('')}</div>
    <div class="info-strip">Điểm đầu vào không tặng danh hiệu và không tính là đã hoàn thành bài học. Với Viết câu và Nói, phụ huynh nên xem trực tiếp bài làm của bé.</div>
    <button class="outline-btn" data-view="home">${done===4?'Vào hành trình học':'Để sau, bắt đầu ở cấp 1'} →</button>`;
}
const PLACEMENT_PACKS=[2,5,7];
const PLACEMENT_STARTS=[1,3,6,8];
function startPlacement(track){
  if(!['vocab','listening','reading','writing'].includes(track))return;
  const pack=PACKS[PLACEMENT_PACKS[0]-1];
  stopAudio();stopRecord();
  lesson={mode:'placement',track,level:pack.id,pack,tier:0,questions:questionsFor(track,pack).slice(0,3),index:0,answers:[],startedAt:Date.now(),selected:null,checked:false};
  document.getElementById('lessonOverlay').classList.remove('hidden');document.body.style.overflow='hidden';
  document.getElementById('lessonBand').textContent=`KIỂM TRA ĐẦU VÀO · ${trackById(track).name}`;
  document.getElementById('lessonTitle').textContent='Vòng Movers 1/3';renderQuestion();
  clearInterval(window.questTimer);window.questTimer=setInterval(updateTimer,1000);
}
function finishPlacement(perfect){
  stopAudio();clearInterval(window.questTimer);
  const {track,tier,answers,startedAt}=lesson;
  const startLevel=PLACEMENT_STARTS[tier+(perfect?1:0)];
  const score=round1(answers.reduce((n,a)=>n+a.credit,0)/answers.length*10);
  data.placement??={done:false,results:{},starts:{}};
  data.placement.results[track]={startLevel,score,questions:answers.length,date:new Date().toISOString()};
  data.placement.starts[track]=startLevel;
  data.placement.done=['vocab','listening','reading','writing'].every(id=>data.placement.results[id]);
  persist();
  document.getElementById('lessonStepLabel').textContent='Đã xong';
  document.getElementById('lessonProgressFill').style.width='100%';
  document.getElementById('lessonBody').innerHTML=`<div class="result-center"><div class="result-icon">🧭</div><h3>Gợi ý bắt đầu ${safe(trackById(track).name)} ở cấp ${startLevel}</h3><p>Kết quả ${score.toFixed(1)}/10 qua ${answers.length} câu. Bé có thể ôn mọi cấp trước đó; bài kiểm tra đầu vào không cấp quà.</p></div>`;
  document.getElementById('lessonFooter').innerHTML='<button class="accent-btn" id="placementClose">Xem các kỹ năng →</button>';
  document.getElementById('placementClose').onclick=()=>{closeLesson();setView('assessment')};
}
function renderPaths(){
  const t=trackById(currentTrack),done=countDone(t.id);
  const cards=PACKS.map(p=>{
    const state=passed(t.id,p.id)?'completed':unlocked(t.id,p.id)?'available':'locked';
    const result=completion(t.id,p.id);
    return `<button class="level-card ${state}" ${state==='locked'?'disabled':''} data-open="${t.id}:${p.id}" aria-label="${safe(t.name)} cấp ${p.id}, ${safe(p.title)}, ${state==='completed'?'đã hoàn thành':state==='locked'?'chưa mở khóa':'có thể học'}">
      <span class="num">CẤP ${String(p.id).padStart(2,'0')}</span><span class="level-symbol">${state==='completed'?'✅':state==='locked'?'🔒':p.icon}</span><h3>${safe(p.title)}</h3><p>${p.band==='Movers'?'Củng cố kỹ năng Movers':'Nâng kỹ năng lên Flyers'}</p><span class="level-status">${state==='completed'?`Đã vượt · ${result.best.toFixed(1)}/10`:state==='locked'?'Hoàn thành cấp trước để mở':'Bắt đầu học →'}</span>
    </button>`;
  });
  return `<div class="path-header"><div class="big-icon" style="background:${t.color}22;color:${t.color}">${t.icon}</div><div><h1>Lộ trình ${safe(t.name)}</h1><p>${done}/12 cấp đã hoàn thành · ${safe(t.subtitle)} · Gợi ý bắt đầu cấp ${data.placement?.starts?.[t.id]||1}</p></div></div>
  <div class="path-picker">${TRACKS.map(x=>`<button class="path-tab ${x.id===t.id?'active':''}" data-track="${x.id}">${x.icon} ${safe(x.name)} <span>${countDone(x.id)}/12</span></button>`).join('')}</div>
  <div class="info-strip">Mỗi kỹ năng có 6 cấp Movers và 6 cấp Flyers. Kiểm tra đầu vào chỉ gợi ý cấp bắt đầu; bé vẫn có thể ôn bài cũ. ${!passed(t.id,nextLevel(t.id))&&['vocab','listening','reading'].includes(t.id)?`<button class="accent-btn" data-skip="${t.id}:${nextLevel(t.id)}">Kiểm tra vượt cấp ${nextLevel(t.id)} · 11–12 câu</button>`:'Với Viết và Nói, người lớn cần xem câu trả lời trước khi quyết định bỏ qua bài.'}</div>
  <div class="band-label"><span class="phase-pill">A1 MOVERS</span> Củng cố nền tảng</div><div class="level-grid">${cards.slice(0,6).join('')}</div>
  <div class="band-label"><span class="phase-pill flyers">A2 FLYERS</span> Nâng cao và vận dụng</div><div class="level-grid">${cards.slice(6).join('')}</div>
  <p class="footer-note">Nội dung tham chiếu dạng kỹ năng Cambridge; câu hỏi trong web là nội dung mới.</p>`;
}
function renderRewards(){
  const earned=[];TRACKS.forEach(t=>PACKS.forEach(p=>{const c=completion(t.id,p.id);if(c)earned.push({t,p,c});}));
  earned.sort((a,b)=>new Date(b.c.date)-new Date(a.c.date));
  return `<h1 class="page-title">Bộ sưu tập của ${safe(data.name)} ✨</h1><p class="page-intro">Mỗi cấp nhỏ vượt qua tặng một danh hiệu và một món quà ảo, chỉ nhận một lần.</p>
  <div class="stats"><div class="stat-card"><span class="stat-icon">🏅</span><div><strong>${earned.length}</strong><span>Danh hiệu</span></div></div><div class="stat-card"><span class="stat-icon">🎁</span><div><strong>${earned.length}</strong><span>Quà ảo đã nhận</span></div></div><div class="stat-card"><span class="stat-icon">🗺️</span><div><strong>${TRACKS.filter(t=>countDone(t.id)===12).length}/5</strong><span>Lộ trình hoàn thành</span></div></div></div>
  <div class="section-head"><div><h2>Danh hiệu và quà</h2><p>Các phần thưởng mới nhất hiện trước.</p></div></div>
  ${earned.length?`<div class="reward-grid">${earned.map(({t,p,c})=>`<div class="card reward-card"><span class="gift-emoji">${GIFTS[(p.id-1)%GIFTS.length]}</span><strong>${safe(c.badge)}</strong><small>${safe(t.name)} · Cấp ${p.id} · ${fmtDate(c.date)}</small></div>`).join('')}</div>`:`<div class="empty">Chưa có quà nào. Hãy vượt cấp đầu tiên để mở bộ sưu tập! 🎁</div>`}`;
}
function renderParent(){
  const rows=[...data.history].reverse().slice(0,40);
  const cardRecords=Object.values(data.cards||{});
  const readCount=cardRecords.filter(r=>r.readPass).length,writeCount=cardRecords.filter(r=>r.writePass).length,bothCount=cardRecords.filter(r=>r.readPass&&r.writePass).length;
  const games=Object.entries(data.games||{}).filter(([key])=>key.startsWith('context-')).map(([,game])=>game),gameAttempts=games.reduce((sum,g)=>sum+(Number(g.attempts)||0),0),gameBest=games.reduce((best,g)=>Math.max(best,Number(g.best)||0),0);
  return `<h1 class="page-title">Góc phụ huynh</h1><p class="page-intro">Theo dõi điểm, thời gian và mức độ tiến bộ của bé theo từng kỹ năng.</p>
    <div class="section-head"><div><h2>Hồ sơ học tập</h2><p>Tiến độ của ${safe(data.name)} được lưu trong tài khoản riêng của học sinh.</p></div></div>
    <div class="card guide-card"><div class="form-row"><label for="learnerName"><strong>Tên hiển thị của bé</strong></label><input id="learnerName" class="text-input" maxlength="25" value="${safe(data.name)}"><button id="saveName" class="accent-btn">Lưu tên</button></div><div class="utility-row"><button class="outline-btn" data-view="account">Đổi hồ sơ</button><button class="outline-btn" data-view="assessment">Kiểm tra lại đầu vào</button><button id="exportData" class="outline-btn">↓ Tải bản sao tiến độ</button><label class="outline-btn" for="importData">↑ Nhập bản sao</label><input id="importData" type="file" accept="application/json" class="hidden"></div><p>Khi đang trực tuyến, thay đổi được đồng bộ vào tài khoản của bé. Bản tải xuống giúp phụ huynh giữ thêm một bản sao.</p></div>
    <div class="section-head"><div><h2>Tiến độ theo kỹ năng</h2><p>Điểm /10 là điểm luyện tập trong web, không phải điểm thi Cambridge.</p></div></div>
    <div class="track-grid">${TRACKS.map(trackCard).join('')}</div>
    <div class="section-head"><div><h2>Thẻ từ vựng</h2><p>Kết quả nhận diện lời đọc và kiểm tra chính tả từng từ.</p></div><button class="subtle-link" data-view="cards">Mở bộ thẻ →</button></div><div class="stats"><div class="stat-card"><span class="stat-icon">🎙</span><div><strong>${readCount}/96</strong><span>Từ được nhận diện đúng</span></div></div><div class="stat-card"><span class="stat-icon">✎</span><div><strong>${writeCount}/96</strong><span>Từ viết đúng</span></div></div><div class="stat-card"><span class="stat-icon">✓</span><div><strong>${bothCount}/96</strong><span>Từ luyện đủ hai cách</span></div></div></div>
    <div class="section-head"><div><h2>Đường đua tình huống</h2><p>Trò chơi ôn từ vựng trong câu, điểm và thời gian lưu theo từng bộ từ.</p></div><button class="subtle-link" data-view="game">Vào trò chơi →</button></div><div class="stats"><div class="stat-card"><span class="stat-icon">🎮</span><div><strong>${gameAttempts}</strong><span>Lượt chơi</span></div></div><div class="stat-card"><span class="stat-icon">⭐</span><div><strong>${gameBest.toFixed(1)}/10</strong><span>Điểm cao nhất</span></div></div><div class="stat-card"><span class="stat-icon">🏁</span><div><strong>${games.filter(g=>g.best>=8).length}/12</strong><span>Bộ từ đạt từ 8 điểm</span></div></div></div>
    <div class="section-head"><div><h2>Lịch sử làm bài</h2><p>Hiển thị tối đa 40 lượt gần nhất.</p></div></div>
    ${rows.length?`<div class="table-wrap"><table><thead><tr><th>Ngày</th><th>Kỹ năng</th><th>Cấp</th><th>Điểm</th><th>Thời gian</th><th>Kết quả</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${safe(trackById(r.track)?.name||r.track)}</td><td>${safe(r.level)} · ${safe(PACKS[Number(r.level)-1]?.title||'')}</td><td><strong>${Number(r.score).toFixed(1)}/10</strong></td><td>${fmtTime(r.duration)}</td><td>${r.passed?'Đạt':'Cần ôn'}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">Chưa có lượt học nào. Kết quả sẽ xuất hiện sau bài đầu tiên.</div>`}
    <div class="section-head"><div><h2>Khung học 5 tháng</h2></div></div>
    <div class="guide-grid"><div class="card guide-card"><h3>Tháng 1–2 · Nền Movers</h3><p>Kiểm tra đầu vào qua các cấp nhỏ, học lại từ chưa chắc, nghe và đọc tình huống quen thuộc.</p></div><div class="card guide-card"><h3>Tháng 3 · Bắt đầu Flyers</h3><p>Kỹ năng nào đã hoàn thành Movers sẽ mở cấp Flyers của chính kỹ năng đó. Tiếp tục ôn từ cũ xen kẽ.</p></div><div class="card guide-card"><h3>Tháng 4 · Dùng tiếng Anh</h3><p>Tăng bài kể chuyện, hỏi đáp, đọc đoạn dài và viết câu. Phụ huynh nghe bé nói, xem bài viết mở.</p></div><div class="card guide-card"><h3>Tháng 5 · Chuẩn bị thi</h3><p>Ôn theo lỗi, làm đề mẫu chính thức trên giấy và tập nói trực tiếp với người thật.</p></div></div>
    <p class="footer-note">Bài nói và viết mở dùng tự đánh giá có hướng dẫn; phụ huynh nên kiểm tra lại.</p>`;
}
function renderAbout(){return `<h1 class="page-title">Về English Quest</h1><p class="page-intro">Một hành trình thực hành tiếng Anh từ Movers lên Flyers dành cho học sinh lớp 5.</p>
  <div class="section-head"><div><h2>Cách chương trình hoạt động</h2></div></div><div class="guide-grid">
  <div class="card guide-card"><h3>5 lộ trình độc lập</h3><p>Từ vựng, nghe, đọc, viết và nói. Mỗi lộ trình có 12 cấp nhỏ: 6 Movers và 6 Flyers. Bài kiểm tra đầu vào ngắn gợi ý điểm bắt đầu riêng cho từng kỹ năng; không thay thế đánh giá của giáo viên.</p></div>
  <div class="card guide-card"><h3>Điểm rõ ràng</h3><p>Câu hỏi đúng được quy ra thang 10. Thời gian được ghi riêng để bé không bị khuyến khích đoán vội. Đạt từ 8/10 để mở cấp tiếp theo.</p></div>
  <div class="card guide-card"><h3>Thưởng khi vượt cấp</h3><p>Một danh hiệu và một món quà ảo được ghi nhận ở lần vượt cấp đầu tiên. Làm lại để ôn và cải thiện điểm mà không phát quà trùng.</p></div>
  <div class="card guide-card"><h3>Thẻ từ vựng và trường hợp dùng</h3><p>Mỗi từ có câu ví dụ trong tình huống. Bé nghe phát âm, lật thẻ xem nghĩa, đọc thành tiếng và viết từ. Nhận diện giọng nói chỉ so khớp từ được nghe, không chấm phát âm theo âm vị; trình duyệt có thể chuyển âm thanh tới dịch vụ nhận diện của họ. Web không lưu bản ghi âm.</p></div>
  <div class="card guide-card"><h3>Đường đua tình huống</h3><p>Trò chơi xen kẽ hiểu nghĩa, điền từ, nghe từ và đọc chuyện ngắn. Điểm tính theo độ đúng, thời gian chỉ được ghi lại. Trò chơi không thay thế bài học chính.</p></div>
  <div class="card guide-card"><h3>Kiểm tra vượt cấp</h3><p>Ở Từ vựng, Nghe và Đọc, bé có thể làm 11–12 câu ngắn thay cho bài đầy đủ. Chỉ đúng toàn bộ mới mở cấp tiếp theo. Viết và Nói cần người lớn xem sản phẩm thật nên không tự động vượt cấp qua câu hỏi ngắn.</p></div>
  <div class="card guide-card"><h3>Ranh giới đánh giá</h3><p>Bài nghe dùng giọng đọc của trình duyệt. Bài nói và viết mở có phần tự đánh giá; chúng không thay thế người dạy hoặc giám khảo.</p></div></div>
  <div class="section-head"><div><h2>Dữ liệu học tập</h2></div></div><div class="card guide-card"><p>Trang lưu tên hiển thị, mã nhận dạng Google và tiến độ trên máy chủ; khi chưa đồng bộ, trình duyệt giữ bản tạm. Email của bé chỉ được giữ dưới dạng giá trị băm trong lúc chờ đăng nhập lần đầu. Phiên đăng nhập dùng cookie chỉ máy chủ đọc. Phụ huynh có thể tải bản sao hoặc xóa tài khoản và tiến độ trong mục Hồ sơ. Bản ghi âm chỉ dùng để nghe lại trong buổi học; nhận diện lời đọc có thể gửi âm thanh tới dịch vụ của trình duyệt.</p></div>
  <div class="section-head"><div><h2>Tài liệu tham chiếu</h2></div></div><div class="card guide-card source-links"><p>Nội dung câu hỏi, hội thoại và truyện trên web được viết mới. Cấu trúc kỹ năng tham chiếu từ:</p><ul><li><a href="https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/movers/format/" target="_blank" rel="noopener">Cambridge English · A1 Movers exam format</a></li><li><a href="https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/flyers/format/" target="_blank" rel="noopener">Cambridge English · A2 Flyers exam format</a></li><li><a href="https://www.cambridgeenglish.org/exams-and-tests/qualifications/young-learners/paper/flyers/preparation/" target="_blank" rel="noopener">Cambridge English · Flyers preparation resources</a></li></ul><p>English Quest không liên kết, được chứng nhận hay bảo trợ bởi Cambridge English.</p></div>`;}

function optionsFor(answer, pool, count=4){
  const unique=[answer,...pool.filter(x=>x!==answer)];
  const seed=answer.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const distractors=unique.slice(1).sort((a,b)=>((a.length*17+seed)%37)-((b.length*17+seed)%37)).slice(0,count-1);
  const out=[answer,...distractors];
  const move=seed%out.length;return [...out.slice(move),...out.slice(0,move)];
}
function questionsFor(track, pack){
  const words=pack.words;
  if(track==='vocab'){
    const pool=words.map(w=>w[1]);
    const mc=words.slice(0,6).map((w,i)=>({kind:'choice',label:`Từ vựng · Câu ${i+1}`,text:`${w[2]} “${w[0]}” có nghĩa là gì?`,options:optionsFor(w[1],pool),answer:w[1],audio:w[0]}));
    return [...mc,...words.slice(6,8).map((w,i)=>({kind:'input',label:`Viết từ · Câu ${i+7}`,text:`Viết từ tiếng Anh cho “${w[1]}” ${w[2]}`,answer:w[0],hint:'Chú ý chính tả nhé!',audio:w[0]}))];
  }
  if(track==='listening'){
    const dialogue=pack.listen.map((row,i)=>({kind:'choice',label:`Nghe hội thoại · Câu ${i+1}`,text:row[0],options:row[2],answer:row[1],audio:pack.dialogue}));
    const chosen=[words[0],words[2],words[4]];
    const wordQs=chosen.map((w,i)=>({kind:'choice',label:`Nghe từ · Câu ${i+4}`,text:'Nghe rồi chọn từ được đọc.',options:optionsFor(w[0],words.map(v=>v[0])),answer:w[0],audio:w[0]}));
    return [...dialogue,...wordQs];
  }
  if(track==='reading'){
    const comprehension=pack.read.map((row,i)=>({kind:'choice',label:`Đọc hiểu · Câu ${i+1}`,text:row[0],options:row[2],answer:row[1],context:pack.story}));
    const matching=words.slice(0,3).map((w,i)=>({kind:'choice',label:`Hiểu từ trong câu · Câu ${i+4}`,text:`Trong chủ đề này, “${w[0]}” gần nghĩa nhất với ý nào?`,options:optionsFor(w[1],words.map(v=>v[1])),answer:w[1]}));
    return [...comprehension,...matching];
  }
  if(track==='writing'){
    const spell=words.slice(0,5).map((w,i)=>({kind:'input',label:`Chính tả · Câu ${i+1}`,text:`Viết từ tiếng Anh: ${w[1]} ${w[2]}`,answer:w[0],hint:'Viết đúng từng chữ cái.'}));
    return [...spell,{kind:'open',label:pack.band==='Flyers'?'Kể chuyện bằng 3 tranh · Câu 6':'Viết câu · Câu 6',text:pack.band==='Flyers'?`Nhìn 3 tranh gợi ý và viết một câu chuyện ngắn. ${pack.speak}`:`Viết 2–3 câu tiếng Anh theo gợi ý: ${pack.speak}`,model:pack.model,visual:pack.band==='Flyers'?words.slice(0,3).map(w=>w[2]):null}];
  }
  const compare=[1,4,7,10].includes(pack.id),story=[2,5,9,11].includes(pack.id);
  return [{kind:'speaking',label:compare?'So sánh hai tranh':story?'Kể chuyện theo tranh':'Hỏi đáp',text:compare?`Nhìn hai hình và nói điều khác nhau. Sau đó thử thêm: ${pack.speak}`:story?`Kể một câu chuyện từ các hình gợi ý. ${pack.speak}`:pack.speak,model:compare?`In picture A, there is a ${words[2][0]}. In picture B, there is a ${words[3][0]}.`:pack.model,audio:pack.model,visual:compare?[words.slice(0,3).map(w=>w[2]).join(' '),[words[0],words[1],words[3]].map(w=>w[2]).join(' ')]:story?words.slice(0,4).map(w=>w[2]):null}];
}
function skipQuestionsFor(track,pack){
  const base=questionsFor(track,pack),words=pack.words;
  if(track==='vocab'){
    const uses=window.QUEST_USAGE?.[pack.id]||[];
    const context=[0,2,4,6].map(i=>({kind:'input',label:'Dùng từ trong câu',text:`Điền từ còn thiếu: ${uses[i]?.replace(new RegExp(`\\b${words[i][0]}\\b`,'i'),'_____')||words[i][1]}`,answer:words[i][0],hint:'Dùng đúng từ tiếng Anh trong ngữ cảnh.'}));
    return [...base,...context];
  }
  if(track==='listening')return [...base.slice(0,3),...words.map((w,i)=>({kind:'choice',label:`Nghe từ · Câu ${i+4}`,text:'Nghe rồi chọn từ được đọc.',options:optionsFor(w[0],words.map(v=>v[0])),answer:w[0],audio:w[0]}))];
  return [...base.slice(0,3),...words.map((w,i)=>({kind:'choice',label:`Hiểu từ trong câu · Câu ${i+4}`,text:`Trong chủ đề này, “${w[0]}” gần nghĩa nhất với ý nào?`,options:optionsFor(w[1],words.map(v=>v[1])),answer:w[1]}))];
}

function openLesson(track, level, mode='lesson'){
  if (!unlocked(track,level)) return;
  if(mode==='skip'&&!['vocab','listening','reading'].includes(track))return;
  const pack=PACKS[level-1];if(!pack)return;
  stopAudio();stopRecord();
  const questions=questionsFor(track,pack);
  lesson={mode,track,level,pack,questions:mode==='skip'?skipQuestionsFor(track,pack):questions,index:0,answers:[],startedAt:Date.now(),selected:null,checked:false};
  document.getElementById('lessonOverlay').classList.remove('hidden');
  document.body.style.overflow='hidden';
  document.getElementById('lessonBand').textContent=`${mode==='skip'?'KIỂM TRA VƯỢT CẤP · ':''}${pack.band} · ${trackById(track).name} · Cấp ${level}`;
  document.getElementById('lessonTitle').textContent=mode==='skip'?`Vượt cấp: ${pack.title}`:pack.title;
  renderQuestion();
  clearInterval(window.questTimer);window.questTimer=setInterval(updateTimer,1000);
}
function updateTimer(){if(lesson)document.getElementById('lessonTimer').textContent=fmtTime(Math.floor((Date.now()-lesson.startedAt)/1000));}
function stopAudio(){if('speechSynthesis' in window)window.speechSynthesis.cancel();}
function speak(text){
  if(!data.sound)return;
  if(!('speechSynthesis' in window)){alert('Trình duyệt này chưa hỗ trợ phát âm. Có thể dùng Chrome hoặc Edge để nghe bài.');return;}
  stopAudio();const utter=new SpeechSynthesisUtterance(text);utter.lang='en-GB';utter.rate=.83;
  const voices=speechSynthesis.getVoices();utter.voice=voices.find(v=>v.lang==='en-GB')||voices.find(v=>v.lang?.startsWith('en'))||null;
  speechSynthesis.speak(utter);
}
function renderQuestion(){
  const q=lesson.questions[lesson.index],total=lesson.questions.length;
  document.getElementById('lessonStepLabel').textContent=`Câu ${lesson.index+1}/${total}`;
  document.getElementById('lessonProgressFill').style.width=`${lesson.index/total*100}%`;
  updateTimer();
  const body=document.getElementById('lessonBody');
  const context=q.context?`<p><strong>Đọc đoạn văn:</strong><br>${safe(q.context)}</p>`:'';
  const visual=q.visual?`<div class="visual-strip">${q.visual.map((icons,i)=>`<div class="visual-frame"><span>${safe(icons)}</span><small>${q.visual.length===2?`Hình ${i===0?'A':'B'}`:`Tranh ${i+1}`}</small></div>`).join('')}</div>`:'';
  const audio=q.audio?`<button class="audio-btn" id="playAudio" type="button">▶ Nghe ${q.label.includes('hội thoại')?'hội thoại':'mẫu'}</button>`:'';
  const options=q.kind==='choice'?`<div class="option-grid">${q.options.map((option,i)=>`<button class="answer-option" data-option="${i}">${safe(option)}</button>`).join('')}</div>`:'';
  const input=q.kind==='input'?`<input id="answerInput" class="question-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ đáp án tiếng Anh..."><p style="font-size:11px;color:#a398ae">${safe(q.hint||'')}</p>`:'';
  const rubric=q.kind==='open'?`<textarea id="openInput" class="question-input" rows="4" placeholder="Viết câu của bé vào đây..."></textarea><div class="model-box"><strong>Gợi ý sau khi viết:</strong> <button class="subtle-link" id="showModel">Xem câu mẫu</button><div id="modelText" class="hidden">${safe(q.model)}</div></div><div class="rubric"><label><input type="checkbox" class="rubric-check"> Bé viết ít nhất 2 câu</label><label><input type="checkbox" class="rubric-check"> Câu có nội dung phù hợp tranh / gợi ý</label><label><input type="checkbox" class="rubric-check"> Từ chính được viết đúng</label><label><input type="checkbox" class="rubric-check"> Câu có động từ và dễ hiểu</label></div><p class="mic-status">Phần này do bé và phụ huynh tự đánh giá theo tiêu chí; web không chấm chất lượng câu tự động.</p>`:'';
  const speaking=q.kind==='speaking'?`<div class="model-box"><strong>Chuẩn bị:</strong> Hãy nói ít nhất 2–3 câu. <button class="subtle-link" id="showModel">Xem câu mẫu</button><div id="modelText" class="hidden">${safe(q.model)}</div></div><div class="utility-row"><button id="startRecord" class="outline-btn">● Ghi âm thử</button><button id="stopRecord" class="outline-btn" disabled>■ Dừng</button><button id="playRecord" class="outline-btn" disabled>▶ Nghe lại</button></div><p id="recordStatus" class="mic-status">Ghi âm chỉ dùng để nghe lại trong buổi học; web không lưu giọng nói.</p><div class="rubric"><label><input type="checkbox" class="rubric-check"> Bé đã nói thành tiếng</label><label><input type="checkbox" class="rubric-check"> Bé nói ít nhất 2 câu</label><label><input type="checkbox" class="rubric-check"> Bé dùng đúng từ trọng tâm</label><label><input type="checkbox" class="rubric-check"> Người nghe hiểu được ý chính</label></div><p class="mic-status">Điểm nói là điểm tự đánh giá có phụ huynh hỗ trợ, không phải điểm phát âm Cambridge.</p>`:'';
  body.innerHTML=`<span class="question-type">${safe(q.label)}</span><div class="question-card">${context}${visual}<h3>${safe(q.text)}</h3>${audio}</div>${options}${input}${rubric}${speaking}<div id="feedback" aria-live="polite"></div>`;
  document.getElementById('lessonFooter').innerHTML=`<button class="outline-btn" id="quitLesson">Thoát bài</button><button class="accent-btn ${q.kind==='choice'?'hidden':''}" id="checkAnswer">${q.kind==='open'||q.kind==='speaking'?'Hoàn thành':'Kiểm tra'}</button>`;
  body.querySelectorAll('.answer-option').forEach(b=>b.addEventListener('click',()=>{
    if(lesson.checked)return;
    b.classList.add('selected');lesson.selected=q.options[Number(b.dataset.option)];checkAnswer();
  }));
  body.querySelector('#playAudio')?.addEventListener('click',()=>speak(q.audio));
  body.querySelector('#showModel')?.addEventListener('click',()=>body.querySelector('#modelText').classList.toggle('hidden'));
  body.querySelector('#startRecord')?.addEventListener('click',startRecord);
  body.querySelector('#stopRecord')?.addEventListener('click',stopRecord);
  body.querySelector('#playRecord')?.addEventListener('click',()=>{if(audioBlobUrl)new Audio(audioBlobUrl).play();});
  document.getElementById('checkAnswer').onclick=checkAnswer;
  document.getElementById('quitLesson').onclick=closeLesson;
  body.querySelector('#answerInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer();});
}
async function startRecord(){
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){document.getElementById('recordStatus').textContent='Trình duyệt này chưa hỗ trợ ghi âm. Bé có thể nói to và tự đánh giá.';return;}
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});recorder=new MediaRecorder(stream);const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{if(audioBlobUrl)URL.revokeObjectURL(audioBlobUrl);audioBlobUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));const play=document.getElementById('playRecord');if(play)play.disabled=false;};recorder.start();document.getElementById('startRecord').disabled=true;document.getElementById('stopRecord').disabled=false;document.getElementById('recordStatus').textContent='Đang ghi âm…';}
  catch(_){document.getElementById('recordStatus').textContent='Không mở được micro. Bé vẫn có thể nói to và tự đánh giá.';}
}
function stopRecord(){if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());stream=null;const s=document.getElementById('recordStatus');if(s)s.textContent='Đã dừng ghi âm. Bé có thể nghe lại trước khi đánh giá.';const b=document.getElementById('stopRecord');if(b)b.disabled=true;const a=document.getElementById('startRecord');if(a)a.disabled=false;}
function normalized(s){return String(s).trim().toLowerCase().replace(/[.!?,]/g,'').replace(/\s+/g,' ');}
function checkAnswer(){
  if(!lesson||lesson.checked)return;
  const q=lesson.questions[lesson.index],body=document.getElementById('lessonBody');let value=null,credit=0;
  if(q.kind==='choice'){
    if(lesson.selected===null){body.querySelector('#feedback').innerHTML='<div class="feedback bad">Hãy chọn một đáp án trước nhé.</div>';return;}
    value=lesson.selected;credit=value===q.answer?1:0;
    body.querySelectorAll('.answer-option').forEach(b=>{const option=q.options[Number(b.dataset.option)];if(option===q.answer)b.classList.add('correct');else if(option===value)b.classList.add('wrong');b.disabled=true;});
  } else if(q.kind==='input'){
    value=body.querySelector('#answerInput').value;if(!normalized(value)){body.querySelector('#feedback').innerHTML='<div class="feedback bad">Hãy viết một đáp án trước nhé.</div>';return;}
    credit=normalized(value)===normalized(q.answer)?1:0;body.querySelector('#answerInput').disabled=true;
  } else if(q.kind==='open'){
    value=body.querySelector('#openInput').value.trim();if(value.length<15){body.querySelector('#feedback').innerHTML='<div class="feedback bad">Hãy viết ít nhất 2 câu ngắn trước nhé.</div>';return;}
    credit=[...body.querySelectorAll('.rubric-check')].filter(x=>x.checked).length/4;
    body.querySelector('#openInput').disabled=true;body.querySelectorAll('.rubric-check').forEach(x=>x.disabled=true);
  } else {
    const checked=[...body.querySelectorAll('.rubric-check')].filter(x=>x.checked).length;
    if(!checked){body.querySelector('#feedback').innerHTML='<div class="feedback bad">Hãy nói thành tiếng rồi đánh dấu tiêu chí đã làm được.</div>';return;}
    value=`${checked}/4 tiêu chí`;credit=checked/4;body.querySelectorAll('.rubric-check').forEach(x=>x.disabled=true);stopRecord();
  }
  lesson.answers.push({value,credit,answer:q.answer||null});lesson.checked=true;
  const correct=credit===1;
  if(q.kind==='choice'||q.kind==='input') window.QUEST_SFX.play(correct?'correct':'wrong');
  body.querySelector('#feedback').innerHTML=`<div class="feedback ${correct?'ok':'bad'}">${q.kind==='open'||q.kind==='speaking'?`Tự đánh giá: ${round1(credit*10)}/10 cho nhiệm vụ này.`:correct?'✓ Chính xác!':`✦ Chưa đúng. Đáp án là: ${safe(q.answer)}. Mình nhớ lại nhé!`}</div>`;
  document.getElementById('checkAnswer').classList.remove('hidden');
  const last=lesson.index===lesson.questions.length-1;
  document.getElementById('checkAnswer').textContent=last&&lesson.mode==='placement'?(lesson.answers.slice(-3).every(a=>a.credit===1)&&lesson.tier<2?'Sang vòng tiếp →':'Xem gợi ý cấp'):last?'Xem kết quả':'Tiếp tục →';
  document.getElementById('checkAnswer').onclick=nextQuestion;
}
function nextQuestion(){
  if(!lesson?.checked)return;
  if(lesson.index===lesson.questions.length-1){
    if(lesson.mode==='placement'){
      const round=lesson.answers.slice(-3),perfect=round.length===3&&round.every(a=>a.credit===1);
      if(perfect&&lesson.tier<2){lesson.tier++;const pack=PACKS[PLACEMENT_PACKS[lesson.tier]-1];lesson.pack=pack;lesson.level=pack.id;lesson.questions.push(...questionsFor(lesson.track,pack).slice(0,3));document.getElementById('lessonTitle').textContent=`Vòng ${pack.band} ${lesson.tier+1}/3`;}
      else{finishPlacement(perfect);return;}
    }else{finishLesson();return;}
  }
  lesson.index++;lesson.selected=null;lesson.checked=false;stopAudio();renderQuestion();
}
function finishLesson(){
  stopAudio();stopRecord();clearInterval(window.questTimer);
  const {track,level,pack,answers,startedAt,mode}=lesson;
  const duration=Math.max(1,Math.floor((Date.now()-startedAt)/1000));
  const score=round1(answers.reduce((sum,a)=>sum+a.credit,0)/answers.length*10);
  const didPass=mode==='skip'?score===10:score>=8;
  if(didPass)window.QUEST_SFX.play('finish');
  const id=keyFor(track,level), prior=data.completed[id];
  const date=new Date().toISOString();
  data.history.push({track,level,score,duration,date,passed:didPass,mode:mode||'lesson',answers:answers.map(a=>a.credit)});
  if(data.history.length>500)data.history=data.history.slice(-500);
  if(didPass){
    if(prior){prior.best=Math.max(prior.best,score);prior.last=score;prior.lastDuration=duration;prior.attempts++;}
    else data.completed[id]={first:score,best:score,last:score,time:duration,lastDuration:duration,attempts:1,date,badge:`${trackById(track).name} ${pack.band} · Cấp ${level}`,gift:GIFTS[(level-1)%GIFTS.length]};
  }
  persist();
  const isNew=didPass&&!prior;
  document.getElementById('lessonStepLabel').textContent='Hoàn thành';
  document.getElementById('lessonProgressFill').style.width='100%';
  document.getElementById('lessonTimer').textContent=fmtTime(duration);
  document.getElementById('lessonBody').innerHTML=`<div class="result-center"><div class="result-icon">${didPass?'🏅':'🌱'}</div><h3>${didPass?'Bé đã vượt cấp!':mode==='skip'?'Chưa vượt qua bài kiểm tra ngắn':'Mình luyện thêm một chút nhé'}</h3><div class="result-score">${score.toFixed(1)}<span style="font-size:22px;color:#ada1be">/10</span></div><div class="result-meta"><span>⏱ ${fmtTime(duration)}</span><span>✓ ${round1(answers.reduce((s,a)=>s+a.credit,0))}/${answers.length} điểm câu hỏi</span></div>${isNew?`<div class="result-gift"><strong>Danh hiệu mới: ${safe(data.completed[id].badge)}</strong><span>Quà: ${data.completed[id].gift} đã thêm vào bộ sưu tập!</span></div>`:didPass?'<div class="result-gift">Đã lưu điểm mới. Danh hiệu và quà chỉ nhận một lần.</div>':`<p class="warning">${mode==='skip'?'Cần đúng tất cả câu để vượt cấp nhanh. Bé có thể học trọn bài rồi đạt từ 8/10.':'Đạt từ 8/10 để mở cấp tiếp theo. Xem lại câu sai rồi thử lại nhé.'}</p>`}</div>`;
  document.getElementById('lessonFooter').innerHTML=`<button class="outline-btn" id="finishClose">Về lộ trình</button><button class="accent-btn" id="retryLesson">${didPass?'Học lại':'Thử lại'} →</button>`;
  document.getElementById('finishClose').onclick=()=>{closeLesson();setView('paths',track)};
  document.getElementById('retryLesson').onclick=()=>openLesson(track,level,mode);
}
function closeLesson(){stopAudio();stopRecord();if(audioBlobUrl)URL.revokeObjectURL(audioBlobUrl);audioBlobUrl=null;clearInterval(window.questTimer);lesson=null;document.getElementById('lessonOverlay').classList.add('hidden');document.body.style.overflow='';setView(currentView,currentTrack);}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='english-quest-tien-do.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importData(file){
  if(!file)return;
  try{
    if(file.size>2_000_000)throw Error('too large');
    const parsed=JSON.parse(await file.text());
    if(!parsed||typeof parsed.name!=='string'||!parsed.completed||typeof parsed.completed!=='object'||!Array.isArray(parsed.history))throw Error('invalid');
    const clean={name:activeProfile?.name||parsed.name.slice(0,25),completed:{},history:[],cards:{},games:{},placement:{done:false,results:{},starts:{}},sound:parsed.sound!==false,createdAt:typeof parsed.createdAt==='string'?parsed.createdAt:new Date().toISOString()};
    for(const t of TRACKS)for(const p of PACKS){const k=keyFor(t.id,p.id),c=parsed.completed[k];if(!c)continue;
      if(!Number.isFinite(c.best)||c.best<0||c.best>10||!Number.isFinite(c.first)||!Number.isFinite(c.last)||!Number.isFinite(c.time)||typeof c.date!=='string')throw Error('invalid');
      clean.completed[k]={first:c.first,best:c.best,last:c.last,time:c.time,lastDuration:Number(c.lastDuration)||c.time,attempts:Number(c.attempts)||1,date:c.date,badge:`${t.name} ${p.band} · Cấp ${p.id}`,gift:GIFTS[(p.id-1)%GIFTS.length]};
    }
    for(const h of parsed.history.slice(-500)){
      if(!TRACKS.some(t=>t.id===h.track)||!Number.isInteger(h.level)||h.level<1||h.level>12||!Number.isFinite(h.score)||h.score<0||h.score>10||!Number.isFinite(h.duration)||typeof h.date!=='string')throw Error('invalid');
      clean.history.push({track:h.track,level:h.level,score:h.score,duration:h.duration,date:h.date,passed:Boolean(h.passed),answers:Array.isArray(h.answers)?h.answers.map(Number).filter(Number.isFinite).slice(0,12):[]});
    }
    clean.placement.done=Boolean(parsed.placement?.done||clean.history.length);
    for(const t of TRACKS){const start=Number(parsed.placement?.starts?.[t.id]);if(Number.isInteger(start)&&start>=1&&start<=12)clean.placement.starts[t.id]=start;}
    if(parsed.cards && typeof parsed.cards==='object' && !Array.isArray(parsed.cards)){
      for(const p of PACKS)for(let i=0;i<p.words.length;i++){
        const k=`${p.id}:${i}`,r=parsed.cards[k];if(!r || typeof r!=='object')continue;
        const cleanRecord={};
        for(const kind of ['read','write']){
          const attempts=Number(r[`${kind}Attempts`])||0,score=Number(r[`${kind}Score`])||0,last=Number(r[`${kind}LastScore`])||0,seconds=Number(r[`${kind}Duration`])||0;
          if(attempts<0||attempts>100000||score<0||score>10||last<0||last>10||seconds<0||seconds>86400)throw Error('invalid');
          cleanRecord[`${kind}Attempts`]=Math.floor(attempts);cleanRecord[`${kind}Score`]=score;cleanRecord[`${kind}LastScore`]=last;cleanRecord[`${kind}Duration`]=Math.floor(seconds);
          cleanRecord[`${kind}Date`]=typeof r[`${kind}Date`]==='string'?r[`${kind}Date`].slice(0,40):'';
          cleanRecord[`${kind}Pass`]=Boolean(r[`${kind}Pass`] && score===10);
        }
        clean.cards[k]=cleanRecord;
      }
    }
    if(parsed.games && typeof parsed.games==='object' && !Array.isArray(parsed.games)){
      for(const p of PACKS)for(const key of [String(p.id),`context-${p.id}`]){const g=parsed.games[key];if(!g||typeof g!=='object')continue;
        const best=Number(g.best),last=Number(g.last),duration=Number(g.duration),attempts=Number(g.attempts),bestStreak=Number(g.bestStreak);
        if(![best,last,duration,attempts,bestStreak].every(Number.isFinite)||best<0||best>10||last<0||last>10||duration<0||duration>86400||attempts<0||attempts>100000||bestStreak<0||bestStreak>8)throw Error('invalid');
        clean.games[key]={best,last,duration:Math.floor(duration),attempts:Math.floor(attempts),bestStreak:Math.floor(bestStreak),lastMistakes:Array.isArray(g.lastMistakes)?g.lastMistakes.slice(0,8).map(m=>({prompt:String(m?.prompt||'').slice(0,300),context:String(m?.context||'').slice(0,500),answer:String(m?.answer||'').slice(0,100)})):[],date:typeof g.date==='string'?g.date.slice(0,40):''};
      }
    }
    if(!confirm('Nhập bản sao sẽ thay thế tiến độ trong tài khoản học sinh này. Tiếp tục?'))return;
    data=clean;persist();setView('parent');alert('Đã nhập tiến độ.');
  }catch(_){alert('Không đọc được tệp tiến độ hợp lệ.');}
}
function bindView(){
  const main=document.getElementById('mainContent');
  main.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  main.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>setView('paths',b.dataset.track)));
  main.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{const [track,level]=b.dataset.open.split(':');openLesson(track,Number(level));}));
  main.querySelectorAll('[data-skip]').forEach(b=>b.addEventListener('click',()=>{const [track,level]=b.dataset.skip.split(':');openLesson(track,Number(level),'skip');}));
  main.querySelectorAll('[data-assess]').forEach(b=>b.addEventListener('click',()=>startPlacement(b.dataset.assess)));
  main.querySelectorAll('[data-assess-skip]').forEach(b=>b.addEventListener('click',()=>{const track=b.dataset.assessSkip;data.placement.results[track]={startLevel:1,score:null,questions:0,date:new Date().toISOString()};data.placement.starts[track]=1;data.placement.done=['vocab','listening','reading','writing'].every(id=>data.placement.results[id]);persist();setView('assessment');}));
  main.querySelectorAll('[data-profile]').forEach(b=>b.addEventListener('click',()=>selectProfile(b.dataset.profile)));
  main.querySelectorAll('[data-reset-code]').forEach(b=>b.addEventListener('click',()=>resetCode(b.dataset.resetCode)));
  main.querySelectorAll('[data-google-invite]').forEach(b=>b.addEventListener('click',()=>updateGoogleInvite(b.dataset.googleInvite)));
  main.querySelectorAll('[data-delete-profile]').forEach(b=>b.addEventListener('click',()=>deleteProfile(b.dataset.deleteProfile)));
  document.getElementById('createProfile')?.addEventListener('click',createProfile);
  document.getElementById('loginAccount')?.addEventListener('click',login);
  document.getElementById('loginCode')?.addEventListener('keydown',e=>{if(e.key==='Enter')login()});
  document.getElementById('setupParent')?.addEventListener('click',setupParent);
  document.getElementById('recoverParent')?.addEventListener('click',recoverParent);
  document.getElementById('logoutAccount')?.addEventListener('click',logout);
  document.getElementById('retryAccounts')?.addEventListener('click',bootstrapAccount);
  document.getElementById('retrySync')?.addEventListener('click',()=>{accountError='';void flushProfile();setView('account');});
  document.getElementById('backProfile')?.addEventListener('click',()=>setView(data.placement?.done?'home':'assessment'));
  document.getElementById('saveAssessmentName')?.addEventListener('click',()=>{const name=document.getElementById('assessmentName').value.trim();if(!name)return;data.name=name.slice(0,25);persist();setView('assessment');});
  document.getElementById('saveName')?.addEventListener('click',()=>{const name=document.getElementById('learnerName').value.trim();if(!name)return;data.name=name.slice(0,25);document.getElementById('profileToggle').textContent=data.name.charAt(0).toUpperCase();persist();setView('parent');});
  document.getElementById('exportData')?.addEventListener('click',exportData);
  document.getElementById('importData')?.addEventListener('change',e=>importData(e.target.files[0]));
}
document.querySelectorAll('.sidebar [data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('menuToggle').addEventListener('click',()=>{const sidebar=document.querySelector('.sidebar');sidebar.classList.toggle('open');document.getElementById('menuToggle').setAttribute('aria-expanded',sidebar.classList.contains('open'));});
document.getElementById('closeLesson').addEventListener('click',closeLesson);
document.getElementById('soundToggle').addEventListener('click',()=>{data.sound=!data.sound;persist();updateSound();});
document.getElementById('profileToggle').addEventListener('click',()=>setView('account'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lesson)closeLesson();});
function updateSound(){const b=document.getElementById('soundToggle');b.textContent=data.sound?'♫':'♩';b.title=data.sound?'Tắt âm thanh':'Bật âm thanh';}
document.getElementById('todayLabel').textContent=new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long'});
updateSound();setView('account');void bootstrapAccount();

