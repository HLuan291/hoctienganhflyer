// Vocabulary obstacle course. Graphics and particles use browser-native CSS/Canvas.
window.QUEST_GAME = (() => {
  const state={deck:1,phase:'ready',questions:[],index:0,correct:0,streak:0,bestStreak:0,
    startedAt:0,selected:-1,feedback:'',feedbackCorrect:false,
    timerFrame:0,particleFrame:0,nextTimeout:0,hiddenAt:0,pausedMs:0,feedbackAt:0,mistakes:[]};
  const shuffle=items=>[...items].sort(()=>Math.random()-.5);
  const gameKey=()=>`context-${state.deck}`;
  const best=()=>data.games?.[gameKey()]||null;
  const scoreNow=()=>state.questions.length?Math.round(state.correct/state.questions.length*100)/10:0;
  const seconds=n=>`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
  const elapsed=()=>Math.max(0,Date.now()-state.startedAt-state.pausedMs-(state.hiddenAt?Date.now()-state.hiddenAt:0)-(state.phase==='feedback'&&state.feedbackAt?Date.now()-state.feedbackAt:0));
  const avatar=`<svg viewBox="0 0 86 106" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="42" cy="99" rx="29" ry="6" fill="#25454b" opacity=".18"/>
    <path d="M28 72L23 91l13 3 8-17m13-5 6 19-13 3-7-17" fill="#3d7782" stroke="#25454b" stroke-width="3"/>
    <path d="M19 91h20v8H17c-3-3-2-6 2-8Zm31 0h20c4 2 5 5 2 8H50Z" fill="#f9a35f"/>
    <rect x="22" y="51" width="42" height="30" rx="15" fill="#eb775c" stroke="#25454b" stroke-width="3"/>
    <path d="M22 59 12 72m52-13 10 13" stroke="#eb775c" stroke-width="11" stroke-linecap="round"/>
    <circle cx="11" cy="74" r="6" fill="#ffd0ae"/><circle cx="75" cy="74" r="6" fill="#ffd0ae"/>
    <path d="M58 21q21 2 17 23-3 13-13 13l-7-21Z" fill="#293c42"/>
    <circle cx="43" cy="31" r="27" fill="#293c42"/>
    <ellipse cx="43" cy="35" rx="21" ry="23" fill="#ffd7b9"/>
    <path d="M22 31Q19 5 43 4q24-2 25 27-9-12-20-14-7 11-26 14Z" fill="#293c42"/>
    <circle cx="36" cy="37" r="2" fill="#3d3156"/><circle cx="52" cy="37" r="2" fill="#3d3156"/>
    <path d="M38 46q6 5 12 0" fill="none" stroke="#d57276" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="27" cy="43" r="4" fill="#f8a6a1" opacity=".55"/><circle cx="60" cy="43" r="4" fill="#f8a6a1" opacity=".55"/>
    <path d="M25 12 21 6m39 6 4-7" stroke="#ffd25c" stroke-width="5" stroke-linecap="round"/>
    <path d="m43 57 4 7-4 7-4-7Z" fill="#ffd466"/>
  </svg>`;
  function stopMotion(){
    cancelAnimationFrame(state.timerFrame);cancelAnimationFrame(state.particleFrame);
    clearTimeout(state.nextTimeout);state.timerFrame=0;state.particleFrame=0;state.nextTimeout=0;
  }
  function leave(){stopMotion();state.phase='ready';state.feedback='';state.streak=0;state.hiddenAt=0;}
  function selectDeck(deck){
    if(!unlocked('vocab',deck))return;
    leave();state.deck=deck;draw();
  }
  function makeQuestions(){
    const pack=PACKS[state.deck-1],words=pack.words,order=shuffle(words.map((word,index)=>({word,index})));
    const questions=order.slice(0,7).map(({word,index},i)=>{
      const usage=window.QUEST_USAGE?.[pack.id]?.[index]||'';
      if(i%3===0)return {kind:'meaning',word,prompt:`“${word[0]}” trong câu này có nghĩa gì?`,context:usage,
        options:shuffle([word[1],...shuffle(words.filter(w=>w!==word).map(w=>w[1])).slice(0,2)]),answer:word[1]};
      const distractors=shuffle(words.filter(w=>w!==word).map(w=>w[0])).slice(0,2);
      return {kind:i%3===1?'context':'listen',word,
        prompt:i%3===1?'Chọn từ điền vào chỗ trống.':'Nghe từ rồi chọn từ phù hợp với câu.',
        context:usage.replace(new RegExp(`\\b${word[0]}\\b`,'i'),'_____'),audio:i%3===2?word[0]:null,
        options:shuffle([word[0],...distractors]),answer:word[0]};
    });
    const story=pack.read[Math.floor(Math.random()*pack.read.length)];
    questions.splice(4,0,{kind:'story',word:words[0],prompt:story[0],context:pack.story,options:shuffle(story[2]),answer:story[1]});
    return questions;
  }
  function start(){
    stopMotion();state.questions=makeQuestions();state.index=0;state.correct=0;
    state.streak=0;state.bestStreak=0;state.startedAt=Date.now();state.feedback='';state.hiddenAt=0;state.pausedMs=0;state.feedbackAt=0;state.mistakes=[];
    window.QUEST_SFX.play('start');nextRound();
    document.querySelector('.game-main')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function nextRound(){
    if(state.feedbackAt){state.pausedMs+=Date.now()-state.feedbackAt;state.feedbackAt=0;}
    if(state.index>=state.questions.length){finish();return;}
    state.phase='playing';state.selected=-1;
    draw();state.timerFrame=requestAnimationFrame(tick);
  }
  function tick(now){
    if(state.phase!=='playing'||currentView!=='game')return;
    const label=document.getElementById('gameTime');
    if(label)label.textContent=seconds(Math.floor(elapsed()/1000));
    state.timerFrame=requestAnimationFrame(tick);
  }
  function choose(lane){
    if(state.phase!=='playing')return;
    cancelAnimationFrame(state.timerFrame);state.timerFrame=0;
    const question=state.questions[state.index],correct=lane>=0&&question.options[lane]===question.answer;
    state.phase='feedback';state.feedbackAt=Date.now();state.selected=lane;state.feedbackCorrect=correct;
    if(correct){
      state.correct++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);
      state.feedback=state.streak>=3?`Đúng ${state.streak} lần liên tiếp!`:'Đúng rồi, đi tiếp nào!';
    }else{state.streak=0;state.mistakes.push({prompt:question.prompt,context:question.context,answer:question.answer});state.feedback=`Đáp án đúng: “${question.answer}”. ${question.kind==='story'?'Đọc lại câu chuyện nhé.':window.QUEST_USAGE?.[state.deck]?.[question.word?PACKS[state.deck-1].words.indexOf(question.word):0]||''}`;}
    window.QUEST_SFX.play(correct?'correct':'wrong');draw();
    if(lane>=0)requestAnimationFrame(()=>{if(state.phase==='feedback')document.querySelector('.run-stage')?.classList.add(`lane-${lane}`);});
    if(correct)burst();
    if(correct)state.nextTimeout=setTimeout(()=>{state.index++;nextRound();},1450);
  }
  function finish(){
    stopMotion();state.phase='result';
    const score=scoreNow(),duration=Math.max(1,Math.round(elapsed()/1000));
    data.games??={};const previous=best();
    data.games[gameKey()]={best:Math.max(previous?.best||0,score),last:score,duration,attempts:(previous?.attempts||0)+1,
      bestStreak:Math.max(previous?.bestStreak||0,state.bestStreak),lastMistakes:state.mistakes,date:new Date().toISOString()};
    persist();draw();if(score>=8){window.QUEST_SFX.play('finish');burst();}
  }
  function burst(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const canvas=document.getElementById('gameFx');if(!canvas)return;
    const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2),ctx=canvas.getContext('2d');
    canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);ctx.scale(ratio,ratio);
    const colors=['#f7ca64','#eb775c','#9bcdb1','#63aaa5','#fff'];
    const particles=Array.from({length:42},()=>({x:rect.width/2,y:rect.height*.44,vx:(Math.random()-.5)*7,
      vy:-Math.random()*7-2,life:50+Math.random()*25,size:3+Math.random()*5,color:colors[Math.floor(Math.random()*colors.length)]}));
    const frame=()=>{
      ctx.clearRect(0,0,rect.width,rect.height);let alive=false;
      particles.forEach(p=>{if(p.life<=0)return;alive=true;p.x+=p.vx;p.y+=p.vy;p.vy+=.17;p.life--;
        ctx.globalAlpha=Math.min(1,p.life/18);ctx.fillStyle=p.color;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*.05);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();});
      ctx.globalAlpha=1;if(alive)state.particleFrame=requestAnimationFrame(frame);
    };frame();
  }
  function stage(){
    const question=state.questions[state.index],active=state.phase==='playing'||state.phase==='feedback';
    const options=active?question.options:['Đoán nghĩa','Chọn cổng','Vượt đường đua'];
    return `<div class="run-stage ${state.phase==='feedback'?(state.feedbackCorrect?'is-win':'is-bump'):''}">
      <div class="run-sun"></div><div class="run-cloud cloud-one"></div><div class="run-cloud cloud-two"></div>
      <div class="run-hill hill-one"></div><div class="run-hill hill-two"></div><div class="run-stars">✦ · ✦ · ✦</div>
      <div class="run-road"><div class="road-stripe"></div><div class="road-stripe"></div><div class="road-stripe"></div></div>
      <div class="run-avatar">${avatar}</div>
      <div class="gate-row">${options.map((meaning,i)=>{
        const won=state.phase==='feedback'&&meaning===question.answer,missed=state.phase==='feedback'&&i===state.selected&&!state.feedbackCorrect;
        return `<button class="word-gate ${won?'gate-correct':''} ${missed?'gate-wrong':''}" data-lane="${i}" ${state.phase==='playing'?'':'disabled'} aria-label="Cổng ${i+1}: ${safe(meaning)}"><span class="gate-top">${won?'⭐':missed?'💥':'✦'}</span><span class="gate-label">${safe(meaning)}</span><small>PHÍM ${i+1}</small></button>`;
      }).join('')}</div>
      <canvas id="gameFx" class="run-fx" aria-hidden="true"></canvas>
      ${state.phase==='feedback'?`<div class="run-feedback ${state.feedbackCorrect?'good':'bad'}" role="status">${safe(state.feedback)}</div>`:''}
    </div>`;
  }
  function render(){
    if(!unlocked('vocab',state.deck))state.deck=1;
    const pack=PACKS[state.deck-1],record=best(),active=state.phase==='playing'||state.phase==='feedback';
    const q=state.questions[state.index];
    return `<div class="game-heading"><div><span class="eyebrow">NHIỆM VỤ ÔN TỪ</span><h1>Đường đua tình huống</h1><p>Vượt 8 trạm bằng cách hiểu nghĩa, nghe từ, điền câu và đọc chuyện ngắn.</p></div><div class="game-mark">↗</div></div>
      <div class="section-head"><div><h2>Chọn đường đua</h2><p>Chặng mới mở theo lộ trình Từ vựng và kết quả kiểm tra đầu vào.</p></div></div>
      <div class="game-decks">${PACKS.map(p=>`<button data-game-deck="${p.id}" class="game-deck ${p.id===state.deck?'active':''}" ${unlocked('vocab',p.id)?'':'disabled'}>${unlocked('vocab',p.id)?p.icon:'🔒'} <span>${safe(p.title)}</span><small>${p.band} · ${p.id}</small></button>`).join('')}</div>
      <div class="game-layout"><div class="game-main">
      <div class="game-topline"><div><span class="phase-pill ${pack.band==='Flyers'?'flyers':''}">${pack.band.toUpperCase()}</span><h2>${safe(pack.title)}</h2></div><div class="game-hud"><span>⭐ ${state.correct}/8</span><span>🔥 ${state.streak}</span><span>⏱ <b id="gameTime">${active?seconds(Math.floor(elapsed()/1000)):'0:00'}</b></span></div></div>
      ${active?`<div class="game-prompt"><span>${q.kind==='story'?'▤':q.kind==='listen'?'♫':q.kind==='context'?'✎':'?'}</span><div><small>TRẠM ${state.index+1}/8 · ${q.kind==='story'?'ĐỌC HIỂU':q.kind==='listen'?'NGHE TỪ':q.kind==='context'?'ĐIỀN CÂU':'HIỂU NGHĨA'}</small><strong>${safe(q.prompt)}</strong>${q.context?`<p class="game-context">${safe(q.context)}</p>`:''}</div>${q.audio?`<button id="gameAudio" aria-label="Nghe từ cần điền">🔊</button>`:''}</div>`:
        state.phase==='result'?`<div class="game-result-head"><span>🏆</span><h3>${scoreNow()>=8?'Cô bé đã về đích!':'Mình đã luyện thêm được nhiều từ!'}</h3><strong>${scoreNow().toFixed(1)}/10</strong><p>${state.correct}/8 cổng đúng · ${seconds(data.games[gameKey()].duration)} · Chuỗi dài nhất ${state.bestStreak}</p></div>`:
        `<div class="game-intro"><strong>Hiểu rồi mới chọn cổng</strong><span>Mỗi trạm có một tình huống khác nhau. Bé có thể nghe lại và suy nghĩ; điểm tính theo số câu đúng, thời gian chỉ để theo dõi.</span></div>`}
      ${stage()}
      ${state.phase==='result'&&state.mistakes.length?`<div class="card game-review"><h3>Câu cần ôn lại</h3>${state.mistakes.map(item=>`<p><strong>${safe(item.prompt)}</strong><br>${safe(item.context||'')}<br><b>Đáp án: ${safe(item.answer)}</b></p>`).join('')}</div>`:''}
      <div class="game-bottom">${state.phase==='ready'?`<button class="accent-btn game-start" id="gamePlay">▶ Bắt đầu đường đua</button>`:state.phase==='result'?`<button class="accent-btn game-start" id="gamePlay">↻ Chơi lại</button>`:state.phase==='feedback'&&!state.feedbackCorrect?`<button class="accent-btn game-start" id="gameContinue">Đã hiểu, đi tiếp →</button>`:`<span>Chọn cổng bằng chuột, cảm ứng hoặc phím 1–3</span>`}<small>Điểm trò chơi là điểm ôn luyện, không phải điểm thi Cambridge.</small></div>
      </div><aside class="game-side"><div class="card game-guide"><span>🗺️</span><h3>Nhiệm vụ của bé</h3><p>Đọc câu, nghe từ khi cần và chọn cổng đúng. Mỗi câu đúng được 1 sao.</p><div class="game-rule"><b>✓ Đúng</b><span>Nhận sao, tiếp tục hành trình</span></div><div class="game-rule"><b>✕ Sai</b><span>Xem đáp án và ví dụ trước trạm kế tiếp</span></div></div><div class="card game-guide best-guide"><span>🏅</span><h3>Kỷ lục chặng này</h3><strong>${record?Number(record.best).toFixed(1):'—'}${record?'/10':''}</strong><p>${record?`${record.attempts} lượt chơi · Chuỗi dài nhất ${record.bestStreak}`:'Chơi lần đầu để ghi lại kỷ lục.'}</p></div></aside></div>
      <p class="footer-note">Điểm trò chơi chỉ dùng để ôn tập, không tự mở khóa cấp học.</p>`;
  }
  function draw(){
    if(currentView!=='game')return;
    const main=document.getElementById('mainContent');main.innerHTML=render();bind();
  }
  function bind(){
    const main=document.getElementById('mainContent');
    main.querySelectorAll('[data-game-deck]').forEach(b=>b.addEventListener('click',()=>selectDeck(Number(b.dataset.gameDeck))));
    main.querySelectorAll('[data-lane]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.lane))));
    main.querySelector('#gamePlay')?.addEventListener('click',start);
    main.querySelector('#gameContinue')?.addEventListener('click',()=>{if(state.phase==='feedback'&&!state.feedbackCorrect){state.index++;nextRound()}});
    main.querySelector('#gameAudio')?.addEventListener('click',()=>speak(state.questions[state.index].audio));
  }
  document.addEventListener('keydown',event=>{
    if(currentView!=='game'||state.phase!=='playing'||event.altKey||event.ctrlKey||event.metaKey)return;
    if(['1','2','3'].includes(event.key)){event.preventDefault();choose(Number(event.key)-1);}
  });
  document.addEventListener('visibilitychange',()=>{if(state.phase!=='playing')return;if(document.hidden)state.hiddenAt=Date.now();else if(state.hiddenAt){state.pausedMs+=Date.now()-state.hiddenAt;state.hiddenAt=0;}});
  return {render,bind,leave};
})();

