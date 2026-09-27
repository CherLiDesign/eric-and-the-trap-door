/* ============================================================
   UI — deliberately thin. Anything that can be a physical object
   in the world is one; this file only handles the few things that
   genuinely float above the illustration.
   ============================================================ */

const UI = (() => {
  const stage    = document.getElementById('stage');
  const sceneEl  = document.getElementById('scene');
  const capEl    = document.getElementById('caption');
  const hudEl    = document.getElementById('hud');
  const ovEl     = document.getElementById('overlay');
  const fadeEl   = document.getElementById('fade');

  let capTimer = null, capQueue = [], capRunning = false;

  /* ---------------- caption / short dialogue ---------------- */
  function say(text, who, hold){
    return new Promise(res=>{
      capQueue.push({text, who, hold: hold || Math.max(1500, text.length*58), res});
      if(!capRunning) pump();
    });
  }
  function pump(){
    if(!capQueue.length){ capRunning=false; capEl.classList.remove('show'); return; }
    capRunning = true;
    const {text, who, hold, res} = capQueue.shift();
    capEl.innerHTML = `<div class="line">${who?`<span class="who">${who}</span>`:''}${text}</div>`;
    capEl.classList.add('show');
    clearTimeout(capTimer);
    capTimer = setTimeout(()=>{
      if(!capQueue.length) capEl.classList.remove('show');
      res(); pump();
    }, hold);
  }
  function clearSay(){ capQueue.length=0; clearTimeout(capTimer); capEl.classList.remove('show'); capRunning=false; }

  /* ---------------- transitions ---------------- */
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  async function fadeOut(slow){ fadeEl.classList.toggle('slow', !!slow); fadeEl.classList.remove('clear'); await wait(slow?1200:560); }
  async function fadeIn(slow){ fadeEl.classList.toggle('slow', !!slow); fadeEl.classList.add('clear'); await wait(slow?1200:560); }

  /* ---------------- cinematic letterbox ---------------- */
  let cine = null;
  function cinematic(on){
    if(!cine){ cine = document.createElement('div'); cine.className='cine';
      cine.innerHTML='<div class="bar top"></div><div class="bar bot"></div>'; ovEl.appendChild(cine); }
    requestAnimationFrame(()=>cine.classList.toggle('on', on));
  }

  /* ---------------- paper note (all "popups" are paper) ---------------- */
  function note(title, body, hint){
    return new Promise(res=>{
      SFX.paper();
      const scrim = document.createElement('div'); scrim.className='scrim';
      const n = document.createElement('div'); n.className='note';
      n.innerHTML = `<div class="tape"></div><h3>${title}</h3><div>${body}</div>
                     <div class="hint">${hint||'(tap the note to put it back)'}</div>`;
      ovEl.appendChild(scrim); ovEl.appendChild(n); ovEl.classList.add('on');
      requestAnimationFrame(()=>{ scrim.classList.add('on'); n.classList.add('on'); });
      const close = ()=>{
        SFX.paper(); scrim.classList.remove('on'); n.classList.remove('on');
        setTimeout(()=>{ scrim.remove(); n.remove(); if(!ovEl.children.length||!ovEl.querySelector('.note,#mapsheet')) ovEl.classList.remove('on'); res(); }, 320);
      };
      scrim.onclick = close; n.onclick = close;
    });
  }

  /* ---------------- HUD: key ring + folded map ---------------- */
  const KEYORDER = ['boiler','vault','workshop','final'];
  function hud(show){
    hudEl.innerHTML = '';
    if(!show) return;
    const ring = document.createElement('div'); ring.className='hud-keys';
    KEYORDER.forEach(k=>{
      const have = State.hasKey(k);
      const d = document.createElement('div'); d.className = 'keyslot'+(have?' have':'');
      d.innerHTML = `<svg viewBox="-40 -30 90 60">${ART.key(56, k==='final' ? '#e8d27a' : '#d9b64a')}</svg>`;
      ring.appendChild(d);
    });
    hudEl.appendChild(ring);

    const mb = document.createElement('div'); mb.className='mapbtn';
    mb.innerHTML = `<svg viewBox="0 0 120 90">
      <g filter="url(#wobble)">
        <path d="M6 14 L44 6 L80 16 L114 8 L112 78 L78 86 L42 76 L8 84 Z" fill="#e0d3ae" stroke="#1b1a22" stroke-width="4"/>
        <path d="M44 6 L42 76M80 16 L78 86" stroke="#9d8f70" stroke-width="3" stroke-dasharray="6 5"/>
        <path d="M20 60 q16 -22 34 -12 q20 12 40 -14" stroke="#a4552f" stroke-width="3.5" fill="none" stroke-dasharray="5 6"/>
        <circle cx="94" cy="34" r="5" fill="#d8503f"/>
        <text x="16" y="30" font-size="15" fill="#46414d" font-family="inherit">MY MAP</text>
      </g></svg>`;
    mb.title = 'Eric\'s map';
    mb.onclick = ()=>{ SFX.paper(); GameMap.open(); };
    if(!State.get('mapSeen')) mb.classList.add('nudge');
    hudEl.appendChild(mb);
  }
  function refreshHud(){ if(hudEl.children.length) hud(true); }

  /* ---------------- helpers for scene building ---------------- */
  function svgScene(inner, cls){
    sceneEl.innerHTML = `<svg class="bg ${cls||''}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
    return sceneEl.querySelector('svg');
  }
  function clearScene(){ sceneEl.innerHTML=''; }

  return { stage, sceneEl, ovEl, say, clearSay, wait, fadeOut, fadeIn, cinematic,
           note, hud, refreshHud, svgScene, clearScene };
})();
