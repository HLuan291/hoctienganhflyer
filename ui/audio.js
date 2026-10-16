// Short feedback sounds, synthesized locally after a user gesture.
window.QUEST_SFX = (() => {
  let context;
  function play(kind){
    if(!data.sound)return;
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return;
    try{
      context??=new AudioContextClass();
      if(context.state==='suspended')context.resume().catch(()=>{});
      const notes={correct:[[523,0,.09],[659,.10,.10],[784,.21,.17]],wrong:[[392,0,.13],[294,.14,.22]],start:[[440,0,.08],[554,.10,.08],[659,.20,.12]],finish:[[523,0,.10],[659,.12,.10],[784,.24,.10],[1047,.38,.25]]}[kind]||[];
      const now=context.currentTime;
      notes.forEach(([frequency,delay,length])=>{
        const oscillator=context.createOscillator(),gain=context.createGain();
        oscillator.type=kind==='wrong'?'triangle':'sine';
        oscillator.frequency.setValueAtTime(frequency,now+delay);
        gain.gain.setValueAtTime(.0001,now+delay);
        gain.gain.exponentialRampToValueAtTime(kind==='wrong'?.045:.075,now+delay+.018);
        gain.gain.exponentialRampToValueAtTime(.0001,now+delay+length);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(now+delay);oscillator.stop(now+delay+length+.02);
      });
    }catch(_){/* Sound is optional; the visible feedback always remains. */}
  }
  return {play};
})();

