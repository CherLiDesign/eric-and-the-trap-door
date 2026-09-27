/* ============================================================
   SOUND — quiet by default. Silence is part of the tension.
   All sound is synthesised, so the game ships with no audio files.
   Ambience layers per-room: pipes, drips, hum, distant machinery.
   ============================================================ */

const SFX = (() => {
  let ctx = null, master = null, ambGain = null, ambNodes = [], ready = false;
  let musicGain = null, musicTimer = null, musicNodes = [], musicName = null;
  let muted = false;

  function boot(){
    if(ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination);
    ambGain = ctx.createGain(); ambGain.gain.value = 0; ambGain.connect(master);

    /* the music goes through a long echo — a basement sings back at you */
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    const dly = ctx.createDelay(2); dly.delayTime.value = .42;
    const fb = ctx.createGain(); fb.gain.value = .34;
    const damp = ctx.createBiquadFilter(); damp.type='lowpass'; damp.frequency.value = 1500;
    musicGain.connect(dly); dly.connect(damp); damp.connect(fb); fb.connect(dly); damp.connect(master);
    ready = true;
  }
  document.addEventListener('pointerdown', ()=>{ boot(); if(ctx && ctx.state==='suspended') ctx.resume(); }, {once:false});
  document.addEventListener('keydown', ()=>{ boot(); if(ctx && ctx.state==='suspended') ctx.resume(); });

  const now = () => ctx ? ctx.currentTime : 0;

  function env(node, t0, a, d, peak){
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    node.connect(g); g.connect(master);
    return g;
  }
  function tone(freq, {type='sine', a=.005, d=.18, peak=.22, slide=0, delay=0}={}){
    if(!ready) return;
    const t0 = now() + delay;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide), t0+a+d);
    env(o, t0, a, d, peak * (muted?0:1));
    o.start(t0); o.stop(t0 + a + d + .05);
  }
  function noise(dur, {filter=900, q=1, type='lowpass', peak=.2, delay=0}={}){
    if(!ready) return;
    const t0 = now() + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = filter; f.Q.value = q;
    s.connect(f);
    env(f, t0, .01, dur, peak * (muted?0:1));
    s.start(t0);
  }

  /* ---------------- gameplay vocabulary ---------------- */
  const api = {
    click:      ()=>{ tone(880,{type:'square',a:.002,d:.05,peak:.10}); },
    step:       ()=>{ noise(.10,{filter:520,peak:.10}); },
    creak:      ()=>{ tone(180,{type:'sawtooth',a:.06,d:.55,peak:.07,slide:1.5}); noise(.5,{filter:1400,peak:.04}); },
    door:       ()=>{ tone(90,{type:'sawtooth',a:.1,d:.9,peak:.10,slide:.6}); noise(.7,{filter:700,peak:.07}); },
    drip:       ()=>{ tone(1400,{type:'sine',a:.002,d:.14,peak:.09,slide:.35}); },
    metal:      ()=>{ tone(320,{type:'square',a:.003,d:.32,peak:.09,slide:.55}); noise(.25,{filter:2600,type:'bandpass',q:6,peak:.06}); },
    tick:       ()=>{ tone(1600,{type:'square',a:.001,d:.02,peak:.05}); },
    gear:       ()=>{ for(let i=0;i<5;i++) tone(140+i*22,{type:'square',a:.004,d:.09,peak:.07,delay:i*.07}); },
    unlock:     ()=>{ tone(220,{type:'square',a:.004,d:.12,peak:.14}); tone(440,{type:'triangle',a:.01,d:.4,peak:.14,delay:.11});
                      tone(660,{type:'triangle',a:.01,d:.5,peak:.11,delay:.22}); },
    keydrop:    ()=>{ tone(1200,{type:'triangle',a:.003,d:.25,peak:.16}); tone(700,{a:.01,d:.5,peak:.12,delay:.12});
                      noise(.4,{filter:3000,type:'bandpass',q:4,peak:.06,delay:.1}); },
    good:       ()=>{ [523,659,784].forEach((f,i)=>tone(f,{type:'triangle',a:.01,d:.3,peak:.13,delay:i*.08})); },
    great:      ()=>{ [523,659,784,1046].forEach((f,i)=>tone(f,{type:'triangle',a:.01,d:.42,peak:.14,delay:i*.09})); },
    oops:       ()=>{ tone(240,{type:'sawtooth',a:.01,d:.28,peak:.10,slide:.5}); noise(.2,{filter:400,peak:.07}); },
    boing:      ()=>{ tone(300,{type:'sine',a:.01,d:.35,peak:.13,slide:2.6}); },
    snap:       ()=>{ noise(.07,{filter:3200,type:'bandpass',q:8,peak:.13}); tone(900,{type:'triangle',a:.002,d:.09,peak:.08}); },
    snore:      ()=>{ tone(78,{type:'sawtooth',a:.35,d:.7,peak:.07,slide:.75}); },
    alarm:      ()=>{ for(let i=0;i<6;i++){ tone(640,{type:'square',a:.02,d:.22,peak:.10,delay:i*.36});
                       tone(480,{type:'square',a:.02,d:.22,peak:.09,delay:i*.36+.18}); } },
    whoosh:     ()=>{ noise(.5,{filter:1200,type:'bandpass',q:1.2,peak:.10}); },
    pencil:     ()=>{ noise(.22,{filter:2600,type:'highpass',peak:.05}); },
    paper:      ()=>{ noise(.3,{filter:4200,type:'highpass',peak:.07}); },
    heart:      ()=>{ tone(62,{type:'sine',a:.02,d:.16,peak:.16}); tone(58,{type:'sine',a:.02,d:.2,peak:.13,delay:.24}); },
    hug:        ()=>{ [392,523,659].forEach((f,i)=>tone(f,{type:'sine',a:.05,d:.7,peak:.10,delay:i*.10})); },
    hammer:     ()=>{ noise(.12,{filter:260,peak:.18}); tone(150,{type:'square',a:.002,d:.12,peak:.10,slide:.5}); },

    /* --- doors, locks, arriving somewhere: the sounds you touch --- */
    // a handle turning, then the door coming off its frame
    doorOpen:   ()=>{ noise(.06,{filter:2400,type:'bandpass',q:7,peak:.10});
                      tone(210,{type:'square',a:.002,d:.07,peak:.07,delay:.05});
                      tone(84,{type:'sawtooth',a:.12,d:1.0,peak:.11,slide:.55,delay:.13});
                      noise(.8,{filter:600,peak:.07,delay:.13}); },
    // the door swinging shut behind you — you are committed now
    doorShut:   ()=>{ noise(.14,{filter:300,peak:.16,delay:.02});
                      tone(70,{type:'sine',a:.004,d:.5,peak:.13,delay:.03});
                      tone(1500,{type:'square',a:.001,d:.03,peak:.04,delay:.09}); },
    // stepping into a new room: air changes, one soft footfall
    arrive:     ()=>{ noise(.7,{filter:420,type:'lowpass',peak:.05});
                      noise(.10,{filter:520,peak:.08,delay:.35}); },
    // a padlock giving up: shackle pops, body swings, chain lets go
    lockOpen:   ()=>{ tone(240,{type:'square',a:.002,d:.09,peak:.13});
                      tone(1350,{type:'triangle',a:.002,d:.16,peak:.10,delay:.06});
                      noise(.35,{filter:3000,type:'bandpass',q:5,peak:.08,delay:.08});
                      [660,880,1100].forEach((f,i)=>tone(f,{type:'triangle',a:.01,d:.5,peak:.09,delay:.18+i*.07})); },
    // a heavy barred door opening — the cage, specifically
    cageOpen:   ()=>{ tone(112,{type:'sawtooth',a:.05,d:1.3,peak:.12,slide:.62});
                      for(let i=0;i<4;i++) noise(.18,{filter:1800,type:'bandpass',q:4,peak:.06,delay:.15+i*.22}); },
    // one tumbler falling into place — for the picking, per pin
    pin:        ()=>{ tone(1800,{type:'square',a:.001,d:.03,peak:.07});
                      tone(420,{type:'triangle',a:.002,d:.10,peak:.06,delay:.01}); },
  };

  /* ---------------- ambience beds ---------------- */
  const BEDS = {
    house:  { hum:52,  humGain:.020, drips:0,   creaks:9000, machines:0 },
    night:  { hum:44,  humGain:.024, drips:0,   creaks:7000, machines:0 },
    outside:{ hum:70,  humGain:.014, drips:0,   creaks:12000, machines:0 },
    base:   { hum:58,  humGain:.038, drips:5200, creaks:8000, machines:11000 },
    deep:   { hum:41,  humGain:.052, drips:3800, creaks:6500, machines:8000 },
    none:   null
  };
  let timers = [];
  function stopAmb(){
    ambNodes.forEach(n=>{ try{ n.stop ? n.stop() : n.disconnect(); }catch(e){} });
    ambNodes = []; timers.forEach(clearTimeout); timers = [];
    if(ambGain) ambGain.gain.setTargetAtTime(0, now(), .4);
  }
  function ambience(name){
    boot(); if(!ready) return;
    stopAmb();
    music(name);                       // the score follows the space
    const b = BEDS[name]; if(!b) return;
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value = b.hum;
    const o2 = ctx.createOscillator(); o2.type='triangle'; o2.frequency.value = b.hum*1.51;
    const g2 = ctx.createGain(); g2.gain.value = .28;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 260;
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(ambGain);
    o.start(); o2.start(); ambNodes.push(o,o2);
    ambGain.gain.setTargetAtTime(muted?0:b.humGain, now(), 1.5);

    const sched = (ms, fn) => { if(!ms) return;
      const t = setTimeout(function loop(){ fn(); timers.push(setTimeout(loop, ms*(.5+Math.random()))); },
        ms*(.4+Math.random())); timers.push(t); };
    sched(b.drips,    api.drip);
    sched(b.creaks,   api.creak);
    sched(b.machines, ()=>{ tone(96,{type:'sawtooth',a:.4,d:1.6,peak:.028,slide:.8}); });
  }
  /* ================= MUSIC =================================================
     A proper score, still fully synthesised. Every theme is the same little
     four-note idea in a minor key — Eric's tune — dressed differently per
     place, so the game sounds like one story and each room sounds like itself.
     ======================================================================== */

  /* a music-box note: bell-ish, plucked, dies away */
  function bell(freq, t0, dur, peak, detune=0){
    const o = ctx.createOscillator(); o.type='triangle';
    o.frequency.setValueAtTime(freq, t0); o.detune.setValueAtTime(detune, t0);
    const o2 = ctx.createOscillator(); o2.type='sine';
    o2.frequency.setValueAtTime(freq*2.01, t0);
    const g2 = ctx.createGain(); g2.gain.value = .22;
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak*(muted?0:1), t0+.012);
    g.gain.exponentialRampToValueAtTime(.0001, t0+dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(musicGain);
    o.start(t0); o2.start(t0); o.stop(t0+dur+.05); o2.stop(t0+dur+.05);
  }
  /* a bowed note: slow in, slow out — the dread underneath */
  function swell(freq, t0, dur, peak, type='sawtooth'){
    const o = ctx.createOscillator(); o.type=type; o.frequency.setValueAtTime(freq, t0);
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.setValueAtTime(300, t0);
    lp.frequency.linearRampToValueAtTime(900, t0+dur*.4);
    lp.frequency.linearRampToValueAtTime(240, t0+dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t0);
    g.gain.linearRampToValueAtTime(peak*(muted?0:1), t0+dur*.35);
    g.gain.linearRampToValueAtTime(.0001, t0+dur);
    o.connect(lp); lp.connect(g); g.connect(musicGain);
    o.start(t0); o.stop(t0+dur+.05);
  }

  // A minor-ish note table (Hz), so the themes read as notes, not numbers
  const N = { A2:110, C3:130.8, D3:146.8, E3:164.8, F3:174.6, G3:196,
              A3:220, B3:246.9, C4:261.6, D4:293.7, E4:329.6, F4:349.2,
              G4:392, A4:440, B4:493.9, C5:523.3, D5:587.3, E5:659.3 };

  /* each theme returns a bar of events; the scheduler loops it forever.
     [beat, kind, freq, dur, gain] — kind: 'b' bell, 's' swell             */
  const THEMES = {
    /* the house at night: a music box winding down, one note out of place */
    night: { beat:.62, bars:8, vol:.13, notes:[
      [0,'b',N.A4,1.6,.16],[1,'b',N.C5,1.4,.12],[2,'b',N.E5,1.8,.11],[3,'b',N.B4,1.6,.10],
      [4,'b',N.A4,1.4,.13],[5,'b',N.G4,1.6,.10],[6,'b',N.F4,2.2,.11],
      [0,'s',N.A2,5.0,.045],[4,'s',N.F3,4.4,.035],
    ]},
    /* daytime house: the same tune, kinder, slower, no dissonance */
    house: { beat:.78, bars:8, vol:.10, notes:[
      [0,'b',N.A4,1.8,.13],[2,'b',N.C5,1.8,.10],[4,'b',N.E5,2.0,.09],[6,'b',N.D5,2.4,.08],
      [0,'s',N.A2,6.0,.030],
    ]},
    /* outside: wind and a low horn, almost no melody — exposure */
    outside: { beat:.9, bars:8, vol:.11, notes:[
      [0,'s',N.A2,6.5,.055],[3,'s',N.E3,4.5,.030],
      [2,'b',N.A4,2.6,.07],[6,'b',N.G4,2.8,.06],
    ]},
    /* the base: the tune gone wrong — a minor second grinding under it */
    base: { beat:.54, bars:8, vol:.14, notes:[
      [0,'b',N.A4,1.3,.14],[1,'b',N.B4,1.1,.09],[2,'b',N.C5,1.5,.10],[3,'b',N.A4,1.2,.08],
      [5,'b',N.F4,1.8,.10],[6,'b',N.E4,2.0,.09],
      [0,'s',N.A2,4.6,.055],[0,'s',N.B3*.5,4.6,.028],     // the grinding half-step
      [4,'s',N.F3,4.0,.045],
    ]},
    /* the deep: barely music at all. A heartbeat and something tolling. */
    deep: { beat:1.05, bars:8, vol:.15, notes:[
      [0,'s',N.A2*.5,7.5,.075],[0,'s',N.A2*.505,7.5,.050],  // two drones, beating against each other
      [3,'b',N.A3,3.4,.09],[3.06,'b',N.A3*1.012,3.2,.06],   // detuned toll
      [6,'b',N.F3,3.8,.08],
    ]},
    none: null,
  };

  function stopMusic(){
    if(musicTimer){ clearTimeout(musicTimer); musicTimer = null; }
    musicNodes.forEach(n=>{ try{ n.stop(); }catch(e){} }); musicNodes = [];
  }
  /* fade the old theme out, start the new one under it — rooms bleed into
     each other instead of cutting, which is what makes it feel like a score */
  function music(name){
    boot(); if(!ready) return;
    if(name === musicName) return;
    musicName = name;
    const th = THEMES[name];
    if(!th){ musicGain.gain.setTargetAtTime(0, now(), .8); stopMusic(); return; }

    musicGain.gain.setTargetAtTime(0, now(), .35);
    setTimeout(()=>{
      if(musicName !== name) return;         // the player kept walking
      stopMusic();
      musicGain.gain.setTargetAtTime(muted?0:th.vol, now(), 1.6);
      const barLen = th.beat * th.bars;
      const playBar = ()=>{
        if(musicName !== name) return;
        const t0 = now() + .06;
        th.notes.forEach(([beat, kind, f, dur, peak])=>{
          // a little human drift, so it never sounds like a loop
          const t = t0 + beat*th.beat + (Math.random()-.5)*.05;
          const p = peak * (.85 + Math.random()*.3);
          if(kind==='b') bell(f, t, dur, p, (Math.random()-.5)*6);
          else swell(f, t, dur, p);
        });
        musicTimer = setTimeout(playBar, barLen*1000);
      };
      playBar();
    }, 380);
  }

  function mute(v){ muted = v;
    if(master) master.gain.setTargetAtTime(v?0:.5, now(), .2); }

  return Object.assign(api, { ambience, stopAmb, music, stopMusic, mute, boot });
})();
