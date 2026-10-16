// Flashcards use browser Web Speech APIs. Recognition checks the transcribed word,
// not phoneme-level pronunciation quality. No voice recording is stored by this page.
window.QUEST_CARDS = (() => {
  const state = {deck:1,index:0,flipped:false,mode:'study',feedback:null,startedAt:0,recognition:null};
  const cardKey=(deck,index)=>`${deck}:${index}`;
  const getRecord=(deck,index)=>data.cards?.[cardKey(deck,index)]||{};
  const isMastered=(deck,index)=>Boolean(getRecord(deck,index).readPass&&getRecord(deck,index).writePass);
  const normalize=value=>String(value||'').toLowerCase().trim().replace(/[^a-z]/g,'');
  const duration=()=>Math.max(1,Math.round((Date.now()-state.startedAt)/1000));
  const scoreFor=time=>time<=5?10:time<=10?9.5:time<=20?9:time<=40?8.5:8;
  const displayTime=n=>`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
  const visibleDecks=()=>PACKS.filter(pack=>unlocked('vocab',pack.id));
  const totalKnown=()=>PACKS.reduce((sum,p)=>sum+p.words.filter((_,i)=>isMastered(p.id,i)).length,0);

  function cancelRecognition(){
    const current=state.recognition;
    state.recognition=null;
    if(current){try{current.abort();}catch(_){}}
  }
  function selectDeck(deck){
    if(!unlocked('vocab',deck))return;
    cancelRecognition();state.deck=deck;state.index=0;state.mode='study';state.flipped=false;state.feedback=null;draw();if(window.matchMedia('(max-width:760px)').matches)window.scrollTo({top:0,behavior:'smooth'});
  }
  function selectCard(index){
    cancelRecognition();state.index=index;state.mode='study';state.flipped=false;state.feedback=null;draw();
  }
  function setMode(mode){
    cancelRecognition();state.mode=mode;state.flipped=false;state.feedback=null;state.startedAt=Date.now();draw();
  }
  function move(step){
    const count=PACKS[state.deck-1].words.length;
    selectCard((state.index+step+count)%count);
  }
  function exampleFor(pack,word){
    const sentences=`${pack.story} ${pack.dialogue}`.match(/[^.!?]+[.!?]/g)||[];
    return sentences.map(s=>s.trim()).find(s=>new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(s))||'';
  }
  function deckTiles(){
    return PACKS.map(pack=>{
      const locked=!unlocked('vocab',pack.id),known=pack.words.filter((_,i)=>isMastered(pack.id,i)).length;
      return `<button class="deck-tile ${pack.id===state.deck?'active':''}" data-deck="${pack.id}" ${locked?'disabled':''} aria-label="${safe(pack.band)} cấp ${pack.id}, ${safe(pack.title)}, ${locked?'chưa mở':`${known} trên 8 từ đã nhớ`}">
        <span class="deck-symbol">${locked?'🔒':pack.icon}</span><span><strong>${safe(pack.title)}</strong><small>${pack.band} · ${locked?'Chưa mở':`${known}/8 từ đã nhớ`}</small></span>
      </button>`;
    }).join('');
  }
  function wordMap(pack){
    return pack.words.map((word,i)=>{
      const r=getRecord(pack.id,i),icon=isMastered(pack.id,i)?'✓':r.readPass?'◉':r.writePass?'✎':String(i+1);
      return `<button class="word-dot ${i===state.index?'active':''} ${isMastered(pack.id,i)?'mastered':''}" data-word="${i}" title="${safe(word[0])}" aria-label="Thẻ ${i+1}: ${safe(word[0])}, ${isMastered(pack.id,i)?'đã nhớ':'đang học'}">${icon}</button>`;
    }).join('');
  }
  function feedbackHtml(){
    if(!state.feedback)return '';
    const f=state.feedback;
    return `<div class="card-feedback ${f.ok===null?'processing':f.ok?'good':'needs-work'}" role="status"><strong>${f.ok===null?'Đang nghe':f.ok?'Tuyệt lắm!':'Mình thử lại nhé'}</strong><p>${safe(f.message)}</p>${f.score!=null?`<small>${f.score}/10 · ${displayTime(f.duration)} · Đã lưu kết quả</small>`:''}</div>`;
  }
  function activityHtml(pack,word){
    const record=getRecord(pack.id,state.index);
    if(state.mode==='read'){
      const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      return `<div class="flash-activity"><span class="activity-kicker">LUYỆN ĐỌC THÀNH TIẾNG</span><div class="read-target">${word[2]} <strong>${safe(word[0])}</strong></div><p>Nghe mẫu, sau đó bấm micro và đọc đúng một từ.</p><div class="card-actions"><button class="outline-btn" id="cardPlayWord">🔊 Nghe mẫu</button><button class="accent-btn" id="cardRead" ${Recognition?'':'disabled'}>🎙 Bắt đầu đọc</button></div>${Recognition?'':'<p class="card-caution">Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Bé vẫn có thể học thẻ và làm bài viết.</p>'}<p class="card-caution">Tính năng chỉ kiểm tra từ mà trình duyệt nghe được, không chấm chất lượng phát âm. Khi dùng micro, trình duyệt có thể xử lý âm thanh qua dịch vụ của họ. Web không lưu bản ghi âm.</p>${feedbackHtml()}<small class="attempt-note">Đã thử đọc: ${record.readAttempts||0} lần ${record.readPass?'· Đã nhận diện đúng ✓':''}</small></div>`;
    }
    if(state.mode==='write'){
      return `<div class="flash-activity"><span class="activity-kicker">LUYỆN VIẾT TỪ</span><div class="write-target">${word[2]} <strong>${safe(word[1])}</strong></div><p>Viết từ tiếng Anh tương ứng. Viết đúng và nhanh hơn sẽ được điểm cao hơn.</p><form id="cardWriteForm"><label class="sr-only" for="cardWriteInput">Từ tiếng Anh</label><input id="cardWriteInput" class="question-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ tiếng Anh..."><button class="accent-btn" type="submit">Kiểm tra chữ viết</button></form>${feedbackHtml()}<small class="attempt-note">Đã thử viết: ${record.writeAttempts||0} lần ${record.writePass?'· Đã viết đúng ✓':''}</small></div>`;
    }
    const example=exampleFor(pack,word[0]);
    const usage=window.QUEST_USAGE?.[pack.id]?.[state.index]||'';
    return `<button class="flashcard ${state.flipped?'flipped':''}" id="flipCard" aria-label="${state.flipped?'Mặt sau':'Mặt trước'} của thẻ ${safe(word[0])}, bấm để lật">
      <span class="flashcard-label">THẺ ${state.index+1} / ${pack.words.length} · ${pack.band.toUpperCase()}</span>
      <span class="flashcard-emoji">${word[2]}</span>
      ${state.flipped?`<strong class="flashcard-word">${safe(word[1])}</strong><span class="flashcard-example"><b>Dùng trong câu:</b> ${safe(usage)}</span>${example&&example.toLowerCase()!==usage.toLowerCase()?`<span class="flashcard-example"><b>Trong câu chuyện:</b> ${safe(example)}</span>`:''}`:`<strong class="flashcard-word">${safe(word[0])}</strong><span class="flashcard-sub">Nhìn từ, đoán nghĩa rồi lật thẻ</span>`}
      <span class="flip-hint">↻ ${state.flipped?'Xem mặt trước':'Lật thẻ xem nghĩa'}</span>
    </button><div class="card-actions centered"><button class="outline-btn" id="cardPlayWord">🔊 Nghe phát âm</button><button class="outline-btn" id="cardPlaySlow">🐢 Nghe chậm</button></div>`;
  }
  function render(){
    if(!unlocked('vocab',state.deck))state.deck=visibleDecks().at(-1)?.id||1;
    const pack=PACKS[state.deck-1],word=pack.words[state.index],record=getRecord(pack.id,state.index);
    const known=pack.words.filter((_,i)=>isMastered(pack.id,i)).length;
    return `<div class="cards-page"><div class="cards-heading"><div><span class="eyebrow">HỌC TỪ THEO THẺ</span><h1>Nhớ từ bằng nghe, đọc và viết ✨</h1><p>Học từ Movers trước, rồi mở dần các bộ Flyers theo lộ trình Từ vựng.</p></div><div class="cards-count"><strong>${totalKnown()}/${PACKS.length*8}</strong><span>Thẻ đã luyện đủ đọc + viết</span></div></div>
      <div class="deck-selector"><div class="section-head"><div><h2>Chọn bộ thẻ</h2><p>Các bộ tiếp theo mở khi bé vượt cấp Từ vựng tương ứng.</p></div></div><div class="deck-grid">${deckTiles()}</div></div>
      <div class="cards-workspace"><div class="card-study"><div class="study-top"><div><span class="phase-pill ${pack.band==='Flyers'?'flyers':''}">${pack.band.toUpperCase()}</span><h2>${pack.icon} ${safe(pack.title)}</h2><p>${known}/8 từ đã luyện đủ hai kỹ năng</p></div><button class="outline-btn" id="cardNextUnlearned">Ôn từ chưa nhớ →</button></div>
      <div class="word-map">${wordMap(pack)}</div>
      <div class="card-modes"><button class="mode-tab ${state.mode==='study'?'active':''}" data-mode="study">▧ Xem thẻ</button><button class="mode-tab ${state.mode==='read'?'active':''}" data-mode="read">◉ Đọc từ</button><button class="mode-tab ${state.mode==='write'?'active':''}" data-mode="write">✎ Viết từ</button></div>
      ${activityHtml(pack,word)}<div class="card-navigation"><button class="outline-btn" id="cardPrev">← Thẻ trước</button><span>Thẻ ${state.index+1} / ${pack.words.length}</span><button class="accent-btn" id="cardNext">Thẻ tiếp →</button></div></div>
      <aside class="card-tips"><div class="card tip-box"><div class="tip-icon">🎯</div><h3>Học theo 3 bước</h3><ol><li>Nhìn thẻ và đoán nghĩa.</li><li>Nghe mẫu, đọc thành tiếng.</li><li>Ẩn từ và viết lại thật đúng.</li></ol></div><div class="card tip-box"><div class="tip-icon">📈</div><h3>Tiến độ từ này</h3><div class="skill-check ${record.readPass?'done':''}"><span>${record.readPass?'✓':'◯'}</span> Đọc được nhận diện ${record.readAttempts?`· ${record.readLastScore}/10 · ${displayTime(record.readDuration)}`:''}</div><div class="skill-check ${record.writePass?'done':''}"><span>${record.writePass?'✓':'◯'}</span> Viết đúng chính tả ${record.writeAttempts?`· ${record.writeLastScore}/10 · ${displayTime(record.writeDuration)}`:''}</div><p>Hai dấu ✓ giúp phụ huynh biết từ nào cần ôn. Bé vẫn cần làm bài của lộ trình để vượt cấp.</p></div></aside></div>
      <div class="info-strip">Âm thanh dùng Web Speech API của trình duyệt. Phần đọc dùng nhận diện giọng nói để so khớp từ, nên có thể nhầm với giọng trẻ em hoặc tiếng ồn. Điểm luyện đọc không phải điểm phát âm Cambridge.</div></div>`;
  }
  function draw(){
    if(document.getElementById('mainContent') && currentView==='cards'){
      document.getElementById('mainContent').innerHTML=render();
      bind();
    }
  }
  function saveAttempt(kind,score,time){
    data.cards??={};const key=cardKey(state.deck,state.index),old=data.cards[key]||{};
    const date=new Date().toISOString();
    data.cards[key]={...old,
      [`${kind}Attempts`]:(old[`${kind}Attempts`]||0)+1,
      [`${kind}Score`]:Math.max(old[`${kind}Score`]||0,score),
      [`${kind}LastScore`]:score,
      [`${kind}Duration`]:time,
      [`${kind}Date`]:date,
      [`${kind}Pass`]:Boolean(old[`${kind}Pass`]||score>=8)
    };
    persist();
  }
  function writeCheck(event){
    event.preventDefault();
    const input=document.getElementById('cardWriteInput');const typed=input.value.trim();if(!typed){input.focus();return;}
    const expected=PACKS[state.deck-1].words[state.index][0];
    const correct=normalize(typed)===normalize(expected);
    const time=duration(),score=correct?scoreFor(time):0;saveAttempt('write',score,time);
    state.feedback={ok:correct,score,duration:time,message:correct?`Bé đã viết đúng “${expected}”.`:`Từ đúng là “${expected}”. Hãy nhìn kỹ rồi thử viết lại một lần nữa.`};
    state.startedAt=Date.now();draw();
  }
  function readCheck(){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition)return;
    cancelRecognition();
    state.startedAt=Date.now();
    const expected=PACKS[state.deck-1].words[state.index][0];
    const rec=new Recognition();rec.lang='en-GB';rec.interimResults=false;rec.maxAlternatives=5;rec.continuous=false;
    state.recognition=rec;state.feedback={ok:null,message:'Hãy đọc một từ rõ ràng.'};draw();
    rec.onresult=event=>{
      if(state.recognition!==rec)return;
      const alternatives=Array.from(event.results?.[0]||[]).map(x=>x.transcript?.trim()).filter(Boolean);
      const heard=alternatives[0]||'';
      const correct=alternatives.some(text=>normalize(text)===normalize(expected));
      const time=duration(),score=correct?10:0;saveAttempt('read',score,time);
      state.feedback={ok:correct,score,duration:time,message:correct?`Trình duyệt nhận diện được “${expected}”. Bé đã đọc đúng từ cần luyện.`:`Trình duyệt nghe được “${heard||'chưa rõ'}”; từ cần đọc là “${expected}”. Hãy nghe mẫu và thử lại.`};
      state.recognition=null;state.startedAt=Date.now();draw();
    };
    rec.onerror=event=>{
      if(state.recognition!==rec)return;
      const messages={'not-allowed':'Micro chưa được cho phép. Bé vẫn có thể dùng thẻ và luyện viết.','no-speech':'Chưa nghe thấy tiếng nói. Hãy thử ở nơi yên tĩnh.','network':'Dịch vụ nhận diện giọng nói chưa kết nối được.'};
      state.feedback={ok:false,message:messages[event.error]||'Chưa nhận diện được tiếng nói. Hãy thử lại.'};state.recognition=null;draw();
    };
    rec.onend=()=>{if(state.recognition===rec){state.recognition=null;draw();}};
    try{rec.start();}catch(_){state.recognition=null;state.feedback={ok:false,message:'Không thể bắt đầu nhận diện giọng nói trên trình duyệt này.'};draw();}
  }
  function bind(){
    const main=document.getElementById('mainContent');
    main.querySelectorAll('[data-deck]').forEach(el=>el.addEventListener('click',()=>selectDeck(Number(el.dataset.deck))));
    main.querySelectorAll('[data-word]').forEach(el=>el.addEventListener('click',()=>selectCard(Number(el.dataset.word))));
    main.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.mode)));
    main.querySelector('#flipCard')?.addEventListener('click',()=>{state.flipped=!state.flipped;draw();});
    main.querySelector('#cardPlayWord')?.addEventListener('click',()=>speak(PACKS[state.deck-1].words[state.index][0]));
    main.querySelector('#cardPlaySlow')?.addEventListener('click',()=>{
      const word=PACKS[state.deck-1].words[state.index][0];
      if(!data.sound)return;
      if(!window.speechSynthesis)return;
      speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(word);utterance.lang='en-GB';utterance.rate=.6;speechSynthesis.speak(utterance);
    });
    main.querySelector('#cardRead')?.addEventListener('click',readCheck);
    main.querySelector('#cardWriteForm')?.addEventListener('submit',writeCheck);
    main.querySelector('#cardPrev')?.addEventListener('click',()=>move(-1));
    main.querySelector('#cardNext')?.addEventListener('click',()=>move(1));
    main.querySelector('#cardNextUnlearned')?.addEventListener('click',()=>{
      const words=PACKS[state.deck-1].words;
      const next=words.findIndex((_,i)=>i>state.index&&!isMastered(state.deck,i));
      const fallback=words.findIndex((_,i)=>!isMastered(state.deck,i));
      selectCard(next>=0?next:fallback>=0?fallback:0);
    });
  }
  return {render,bind,cancelRecognition};
})();

