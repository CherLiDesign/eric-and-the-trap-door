/* ============================================================
   ERIC'S MAP — a folded piece of paper he has been drawing on.
   Answers three questions in under two seconds:
      Where am I?   Who still needs rescuing?   Where do I go next?
   Also the fast-travel system.
   ============================================================ */

const GameMap = (() => {
  const ov = document.getElementById('overlay');
  let sheet = null, scrim = null, open_ = false;
  let pendingDraw = [];      // rooms to animate in next time the map opens
  let pendingRescue = [];

  /* connections drawn as pencil routes */
  const LINKS = [
    ['bedroom','hallway'],['hallway','parents'],['hallway','sibs'],['bedroom','kitchen'],
    ['kitchen','basement'],['kitchen','yard'],['yard','trap'],['trap','ladderroom'],
    ['ladderroom','corridor'],['corridor','boiler'],['corridor','cages'],['cages','vault'],
    ['vault','workshop'],['workshop','deep'],['deep','cages'],
  ];

  /* Eric writes on his map as he goes, so the notes only say what he
     actually knows yet — no room is labelled "empty" before he looks. */
  function handNote(id){
    const gone = State.flag('familyGone');
    switch(id){
      case 'bedroom':  return State.data.night ? 'my bed. miss it.' : 'where it started';
      case 'parents':  return State.flag('mEmpty1') ? 'EMPTY. bed still warm' : (gone ? 'nobody there?' : 'they did not listen');
      case 'sibs':     return State.flag('mEmpty2') ? 'EMPTY. Amy left her drawing' : (gone ? 'nobody there?' : 'they laughed at me');
      case 'kitchen':  return State.flag('sawKitchen') ? '4 bowls. nobody ate' : 'the cellar door is in here';
      case 'basement': return State.flag('hid') ? 'I hid here all night' : 'nobody ever looks here';
      case 'yard':     return State.flag('sawPrints') ? 'big footprints ->' : 'cold out there';
      case 'trap':     return State.flag('trapOpen') ? 'THE WAY DOWN' : 'the leaves were swept';
      default:         return ROOMS[id].hand;
    }
  }

  function noteDraw(room){ if(!pendingDraw.includes(room)) pendingDraw.push(room); }
  function noteRescue(who){ if(!pendingRescue.includes(who)) pendingRescue.push(who); }

  function build(){
    const d = State.data;
    const known = r => State.isDiscovered(r);
    let g = '';

    /* --- paper --- */
    g += `<rect x="0" y="0" width="1200" height="760" fill="#e9dfc2"/>
      <rect x="0" y="0" width="1200" height="760" fill="url(#paperfleck)" opacity=".5"/>
      <path d="M400 0 V760M800 0 V760" stroke="#c9ba99" stroke-width="2" opacity=".7"/>
      <path d="M0 380 H1200" stroke="#c9ba99" stroke-width="2" opacity=".7"/>
      <text x="46" y="58" font-size="34" fill="#46414d" font-family="inherit" transform="rotate(-1.5 46 58)">MY MAP — do not lose this</text>
      <text x="1150" y="726" font-size="16" fill="#8a7a5f" text-anchor="end" font-family="inherit">by Eric</text>`;

    /* --- scribbled unknown regions --- */
    if(!known('deep'))
      g += `<g opacity=".55"><path d="M940 320 q80 -40 150 30 q30 70 -50 100 q-90 20 -120 -50z" fill="none" stroke="#7a6a52" stroke-width="3" stroke-dasharray="9 8"/>
        <text x="1010" y="400" font-size="52" fill="#7a6a52" text-anchor="middle" font-family="inherit">? ?</text></g>`;
    if(!known('ladderroom'))
      g += `<g opacity=".45"><path d="M600 250 q120 -60 240 40 q40 120 -120 140 q-160 -10 -140 -110z" fill="#d5c6a2" stroke="#7a6a52" stroke-width="3" stroke-dasharray="7 9"/>
        <text x="720" y="360" font-size="30" fill="#7a6a52" text-anchor="middle" font-family="inherit">under the ground??</text></g>`;

    /* --- routes between known rooms --- */
    LINKS.forEach(([a,b])=>{
      if(!known(a) || !known(b)) return;
      const A=ROOMS[a], B=ROOMS[b];
      const mx=(A.x+B.x)/2 + (A.y===B.y? 0 : 22), my=(A.y+B.y)/2 - 14;
      g += `<path d="M${A.x} ${A.y} Q${mx} ${my} ${B.x} ${B.y}" stroke="#8b7a5e" stroke-width="3"
              fill="none" stroke-dasharray="8 7" opacity=".85"/>`;
    });

    /* --- rooms --- */
    Object.keys(ROOMS).forEach(id=>{
      const r = ROOMS[id];
      if(!known(id)) return;
      const here = d.at === id;
      const travel = State.canTravel(id);
      const isNew = pendingDraw.includes(id);
      const w = 132, h = 74;
      g += `<g class="map-room ${travel?'travelable':''}" data-room="${id}">
        <path class="roomshape ${isNew?'newroom':''}"
          d="M${r.x-w/2} ${r.y-h/2} L${r.x+w/2-4} ${r.y-h/2-5} L${r.x+w/2} ${r.y+h/2} L${r.x-w/2+5} ${r.y+h/2+4} Z"
          fill="${here?'#e6d9b4':'#efe6cd'}" stroke="#46414d" stroke-width="${here?4.5:3}"/>
        <text class="map-label" x="${r.x}" y="${r.y-2}" text-anchor="middle" font-family="inherit">${r.name}</text>
        <text class="map-hand" x="${r.x}" y="${r.y+18}" text-anchor="middle" font-family="inherit">${handNote(id)}</text>
        ${travel?`<text class="map-hand" x="${r.x}" y="${r.y+h/2+22}" text-anchor="middle" fill="#a4552f" font-family="inherit">go here</text>`:''}
      </g>`;
    });

    /* --- family members pinned where they are --- */
    Object.keys(FAMILY).forEach((who,i)=>{
      const f = FAMILY[who];
      const rescued = State.isRescued(who);
      const found   = State.isFound(who);
      if(!rescued && !found) return;
      const room = rescued ? null : ROOMS[f.room];
      const px = rescued ? 150 + i*88 : room.x - 46 + (i%2)*92;
      const py = rescued ? 668        : room.y + 62;
      const pop = pendingRescue.includes(who) ? 'rescue-pop' : '';
      g += `<g class="${pop}" transform="translate(${px} ${py})">
        <circle r="27" fill="${rescued?'#f3e6c4':'#cfc2a4'}" stroke="#46414d" stroke-width="3"/>
        <g transform="translate(0,20) scale(${rescued?0.9:0.85})" opacity="${rescued?1:.55}">
          ${miniFace(who)}
        </g>
        ${rescued
          ? `<path d="M-30 4 l10 14 l24 -30" stroke="#4f7a3a" stroke-width="6" fill="none" stroke-linecap="round"/>
             <text y="46" text-anchor="middle" font-size="15" fill="#4f7a3a" font-family="inherit">SAFE</text>`
          : `<g transform="translate(20,-20) scale(.34)">${ART.bigLock(90,false)}</g>
             <text y="46" text-anchor="middle" font-size="15" fill="#a4552f" font-family="inherit">${f.name} — locked</text>`}
      </g>`;
    });
    if(State.data.rescued.length)
      g += `<text x="90" y="712" font-size="18" fill="#4f7a3a" font-family="inherit" transform="rotate(-2 90 712)">out safe:</text>`;

    /* --- YOU ARE HERE --- */
    const me = ROOMS[d.at];
    if(me && known(d.at)){
      g += `<g class="you-pin" transform="translate(${me.x-64} ${me.y-56})">
        <g transform="scale(.30)">${ART.eric('idle',150)}</g>
        <text x="0" y="16" font-size="16" fill="#a4552f" text-anchor="middle" font-family="inherit">me</text>
        <path d="M14 -6 q26 10 34 30" stroke="#a4552f" stroke-width="3" fill="none"/>
      </g>`;
    }

    /* --- where to go next, in Eric's handwriting --- */
    const hint = nextHint();
    if(hint) g += `<text x="600" y="736" font-size="21" fill="#6b2f22" text-anchor="middle"
                    font-family="inherit" transform="rotate(-.8 600 736)">${hint}</text>`;

    return `<svg viewBox="0 0 1200 760">
      <defs><filter id="paperfleck"><feTurbulence baseFrequency=".7" numOctaves="3"/>
        <feColorMatrix type="matrix" values="0 0 0 0 .82 0 0 0 0 .76 0 0 0 0 .62 0 0 0 .13 0"/></filter></defs>
      <g filter="url(#wobble)">${g}</g></svg>`;
  }

  function miniFace(who){
    if(ASSETS.has(who)) return ASSETS.svgImage(who, -20, -46, 40, 46);
    const L = ART.FAM_LOOK[who];
    return `<circle cx="0" cy="-22" r="17" fill="#eccba4" stroke="#1b1a22" stroke-width="2.5"/>
      <path d="M-17 -30 q10 -16 18 -14 q12 2 16 14 q-10 -6 -18 -4 q-10 2 -16 4z" fill="${L.hair}"/>
      <circle cx="-6" cy="-24" r="2.6" fill="#1b1a22"/><circle cx="6" cy="-24" r="2.6" fill="#1b1a22"/>
      <path d="M-6 -15 q6 5 12 0" stroke="#1b1a22" stroke-width="2.2" fill="none"/>`;
  }

  function nextHint(){
    const d = State.data;
    if(d.chapter==='night1'){
      if(!State.flag('warnedParents')) return 'wake Mom and Dad — tell them';
      if(!State.flag('warnedSibs'))    return 'try Alex and Amy';
      return 'nobody believed me. hide in the BASEMENT';
    }
    if(d.chapter==='morning'){
      if(!State.flag('cameUpstairs'))  return 'go up the basement stairs';
      if(!State.flag('sawKitchen'))    return 'look at the kitchen table';
      if(!State.flag('sawPrints'))     return 'outside. check the grass';
      if(!State.flag('trapOpen'))      return 'those leaves were swept. look under them';
      return 'down the ladder';
    }
    if(d.chapter==='firstvisit') return State.flag('sawFamily') ? 'back to the ladder — come back at night' : 'find them';
    if(d.chapter==='escape') return 'RUN. get everyone to the ladder!';
    if(State.allRescued())   return 'everybody out — the ladder!';
    if(!d.night)             return 'come back tonight when they are asleep';
    /* no order any more — the map just says who is still locked up, and
       Eric picks. Rooms he has not found yet are named as questions. */
    const left = Object.keys(FAMILY).filter(w => !State.isRescued(w));
    if(!left.length)         return 'go and open the cages!';
    const names = left.length > 2
      ? left.map(w => FAMILY[w].name)
      : left.map(w => State.isDiscovered(FAMILY[w].room)
          ? `${FAMILY[w].name} — ${ROOMS[FAMILY[w].room].name}`
          : `${FAMILY[w].name} — somewhere down here`);
    return `still locked up: ${names.join(', ')}. Any order you like.`;
  }

  function open(){
    if(open_) return;
    open_ = true;
    State.data.mapSeen = true; State.save();
    scrim = document.createElement('div'); scrim.className='scrim';
    sheet = document.createElement('div'); sheet.id='mapsheet';
    sheet.innerHTML = build();
    ov.appendChild(scrim); ov.appendChild(sheet); ov.classList.add('on');
    requestAnimationFrame(()=>{ scrim.classList.add('on'); sheet.classList.add('on'); });
    if(pendingDraw.length) SFX.pencil();
    pendingDraw = []; pendingRescue = [];

    scrim.onclick = close;
    sheet.querySelectorAll('.map-room.travelable').forEach(el=>{
      el.onclick = (e)=>{ e.stopPropagation(); travel(el.dataset.room, el); };
    });
  }
  function close(){
    if(!open_) return;
    open_ = false; SFX.paper();
    scrim.classList.remove('on'); sheet.classList.remove('on');
    const s=scrim, sh=sheet;
    setTimeout(()=>{ s.remove(); sh.remove(); if(!ov.querySelector('#mapsheet,.note')) ov.classList.remove('on'); }, 380);
  }

  /* fast travel: Eric traces the route with his finger, the map folds
     away and the camera pushes into the sketch. Short, but not a cut. */
  async function travel(room, el){
    if(!State.canTravel(room)) return;
    SFX.pencil();
    const from = ROOMS[State.data.at], to = ROOMS[room];
    const svg = sheet.querySelector('svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', `M${from.x} ${from.y} Q${(from.x+to.x)/2} ${(from.y+to.y)/2 - 70} ${to.x} ${to.y}`);
    path.setAttribute('stroke','#a4552f'); path.setAttribute('stroke-width','6');
    path.setAttribute('fill','none'); path.setAttribute('class','route');
    path.setAttribute('stroke-linecap','round');
    svg.querySelector('g').appendChild(path);
    await UI.wait(430);
    SFX.whoosh();
    sheet.style.transition = 'transform .5s cubic-bezier(.5,0,.9,.4), opacity .5s ease';
    sheet.style.transformOrigin = `${(to.x/1200)*100}% ${(to.y/760)*100}%`;
    sheet.style.transform = 'translate(-50%,-50%) scale(2.4)';
    sheet.style.opacity = '0';
    scrim.classList.remove('on');
    await UI.wait(420);
    close();
    World.enter(room, {travelled:true});
  }

  return { open, close, noteDraw, noteRescue, nextHint, get isOpen(){return open_;} };
})();
