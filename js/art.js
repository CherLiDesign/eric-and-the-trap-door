/* ============================================================
   ART — procedural hand-drawn placeholders.
   Every drawing routine checks ASSETS first, so supplied artwork
   silently replaces these without touching gameplay code.

   House style rules encoded here:
     · ink outlines, never pure black (#1b1a22), uneven weight
     · everything passes through the #wobble displacement filter
     · adults are oversized, hunched, theatrical
     · Eric is small, red-sweatered, the only saturated red on screen
     · architecture is tilted; nothing is perfectly square
   All character groups are drawn with FEET AT y=0, facing right.
   ============================================================ */

const ART = (() => {
  const INK = '#1b1a22';
  const R = (n=1)=> (Math.random()*2-1)*n;

  /* wobbly line helper: a straight-ish hand-drawn segment */
  function hline(x1,y1,x2,y2,w=4,color=INK){
    const mx=(x1+x2)/2+R(6), my=(y1+y2)/2+R(6);
    return `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  }
  /* a hand-drawn rectangle (crooked on purpose) */
  function hrect(x,y,w,h,fill='none',stroke=INK,sw=4,jit=5){
    const p=[[x+R(jit),y+R(jit)],[x+w+R(jit),y+R(jit)],[x+w+R(jit),y+h+R(jit)],[x+R(jit),y+h+R(jit)]];
    return `<path d="M${p[0]} L${p[1]} L${p[2]} L${p[3]} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }

  /* ------------------------------------------------------------
     ERIC — small, red sweater, big eyes, cautious posture.
     mood: 'idle' | 'worried' | 'happy' | 'sneak'
     ------------------------------------------------------------ */
  function eric(mood='idle', h=150){
    const key = 'eric.' + (mood==='sneak'?'idle':mood);
    if(ASSETS.has(key)) return `<g class="ericArt">${ASSETS.svgImage(key, -h*0.32, -h, h*0.64, h)}</g>`;
    const s = h/150;
    const worry = mood==='worried', happy = mood==='happy', sneak = mood==='sneak';
    const browL = worry ? 'M-19 -104 L-7 -99' : happy ? 'M-19 -103 L-7 -106' : 'M-19 -102 L-7 -102';
    const browR = worry ? 'M7 -99 L19 -104'  : happy ? 'M7 -106 L19 -103'  : 'M7 -102 L19 -102';
    const mouth = happy ? 'M-9 -80 Q0 -71 9 -80' : worry ? 'M-8 -76 Q0 -81 8 -76' : 'M-7 -78 Q0 -75 7 -78';
    const lean  = sneak ? 'rotate(-6) translate(0,2)' : '';
    return `
    <g transform="scale(${s})" filter="url(#wobble)">
     <g transform="${lean}" class="breathe">
      <!-- legs -->
      <g class="leg-a" style="transform-origin:0px -46px">
        ${hline(-9,-46,-13,-4,11,'#3d3a4a')}<path d="M-20 -4 q10 -6 14 0 q-6 6 -14 0z" fill="${INK}"/>
      </g>
      <g class="leg-b" style="transform-origin:0px -46px">
        ${hline(9,-46,14,-4,11,'#474357')}<path d="M7 -4 q10 -6 15 0 q-7 6 -15 0z" fill="${INK}"/>
      </g>
      <!-- sweater -->
      <path d="M-26 -104 q26 -12 52 0 l6 44 q-32 12 -64 0 z" fill="var(--eric)" stroke="${INK}" stroke-width="4"/>
      <path d="M-24 -74 q24 8 48 0" stroke="#a83b2d" stroke-width="3" fill="none"/>
      <!-- arms -->
      <path d="M-26 -98 q-16 16 -12 38" stroke="var(--eric)" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M26 -98 q16 16 12 38" stroke="var(--eric)" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="-39" cy="-58" r="7" fill="#e8c39c" stroke="${INK}" stroke-width="3"/>
      <circle cx="39" cy="-58" r="7" fill="#e8c39c" stroke="${INK}" stroke-width="3"/>
      <!-- head (large, childlike) -->
      <g class="${worry?'':'sway'}" style="transform-origin:0px -104px">
        <path d="M-30 -104 q0 -46 30 -46 q30 0 30 46 q0 16 -30 16 q-30 0 -30 -16z" fill="#f0cda6" stroke="${INK}" stroke-width="4"/>
        <path d="M-31 -134 q10 -24 31 -22 q24 2 30 22 q-16 -10 -30 -6 q-18 5 -31 6z" fill="#5b3a22" stroke="${INK}" stroke-width="3.5"/>
        <g class="blink" style="transform-origin:-12px -112px"><ellipse cx="-12" cy="-112" rx="6.2" ry="7" fill="#fff" stroke="${INK}" stroke-width="2.6"/><circle cx="${worry?-10:-11}" cy="-111" r="3.2" fill="${INK}"/></g>
        <g class="blink" style="transform-origin:12px -112px"><ellipse cx="12" cy="-112" rx="6.2" ry="7" fill="#fff" stroke="${INK}" stroke-width="2.6"/><circle cx="${worry?14:13}" cy="-111" r="3.2" fill="${INK}"/></g>
        <path d="${browL}" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <path d="${browR}" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <path d="${mouth}" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <circle cx="-22" cy="-96" r="4.5" fill="#e59b8a" opacity=".55"/>
        <circle cx="22" cy="-96" r="4.5" fill="#e59b8a" opacity=".55"/>
      </g>
     </g>
    </g>`;
  }

  /* ------------------------------------------------------------
     FAMILY — recognisable silhouettes, warm colours, drawn caged
     or free depending on state.
     ------------------------------------------------------------ */
  const FAM_LOOK = {
    stranger:{ c:'#7a6a4a', hair:'#8d8578', h:200, hat:true, glasses:true, beard:true },
    dad:   { c:'#5c7a8c', hair:'#3b2b1e', h:210, beard:true,  glasses:true },
    mom:   { c:'#8a5a72', hair:'#4a2b1c', h:196, bun:true },
    milo:  { c:'#6f7a45', hair:'#2f2418', h:168, cap:true },
    junie: { c:'#c98a3c', hair:'#6b3b1e', h:138, pig:true },
  };
  function family(who, h){
    if(ASSETS.has(who)) return `<g>${ASSETS.svgImage(who, -h*0.34, -h, h*0.68, h)}</g>`;
    const L = FAM_LOOK[who]; const s = (h||L.h)/200;
    return `
    <g transform="scale(${s})" filter="url(#wobble)"><g class="breathe">
      <path d="M-16 -60 l-6 56 h14 l4 -52z" fill="#3a3644" stroke="${INK}" stroke-width="3.5"/>
      <path d="M16 -60 l6 56 h-14 l-4 -52z" fill="#3a3644" stroke="${INK}" stroke-width="3.5"/>
      <path d="M-34 -140 q34 -14 68 0 l8 82 q-42 14 -84 0z" fill="${L.c}" stroke="${INK}" stroke-width="4"/>
      <path d="M-34 -136 q-20 24 -16 62" stroke="${L.c}" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M34 -136 q20 24 16 62" stroke="${L.c}" stroke-width="15" fill="none" stroke-linecap="round"/>
      <circle cx="-50" cy="-72" r="8.5" fill="#eccba4" stroke="${INK}" stroke-width="3"/>
      <circle cx="50" cy="-72" r="8.5" fill="#eccba4" stroke="${INK}" stroke-width="3"/>
      <g class="sway" style="transform-origin:0px -140px">
        <path d="M-28 -140 q0 -44 28 -44 q28 0 28 44 q0 15 -28 15 q-28 0 -28 -15z" fill="#eccba4" stroke="${INK}" stroke-width="4"/>
        ${L.bun?`<circle cx="0" cy="-192" r="16" fill="${L.hair}" stroke="${INK}" stroke-width="3.5"/>`:''}
        ${L.pig?`<circle cx="-32" cy="-160" r="13" fill="${L.hair}" stroke="${INK}" stroke-width="3.5"/>
                 <circle cx="32" cy="-160" r="13" fill="${L.hair}" stroke="${INK}" stroke-width="3.5"/>`:''}
        <path d="M-29 -166 q12 -22 29 -20 q20 2 29 20 q-16 -9 -29 -6 q-18 4 -29 6z" fill="${L.hair}" stroke="${INK}" stroke-width="3.5"/>
        ${L.cap?`<path d="M-32 -170 q32 -22 64 -2 q-4 8 -64 6z" fill="#8c4a34" stroke="${INK}" stroke-width="3.5"/>`:''}
        ${L.hat?`<path d="M-46 -168 h92" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
                 <path d="M-26 -168 q0 -34 26 -34 q26 0 26 34z" fill="#4a4038" stroke="${INK}" stroke-width="4"/>`:''}
        <g class="blink" style="transform-origin:-11px -148px"><ellipse cx="-11" cy="-148" rx="5.4" ry="6" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="-10" cy="-147" r="2.8" fill="${INK}"/></g>
        <g class="blink" style="transform-origin:11px -148px"><ellipse cx="11" cy="-148" rx="5.4" ry="6" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="12" cy="-147" r="2.8" fill="${INK}"/></g>
        ${L.glasses?`<circle cx="-11" cy="-148" r="11" fill="none" stroke="${INK}" stroke-width="2.6"/><circle cx="11" cy="-148" r="11" fill="none" stroke="${INK}" stroke-width="2.6"/><path d="M0 -148 h0" stroke="${INK}" stroke-width="2.6"/>`:''}
        ${L.beard?`<path d="M-22 -132 q22 26 44 0 q-6 30 -22 30 q-16 0 -22 -30z" fill="${L.hair}" stroke="${INK}" stroke-width="3"/>`:
                  `<path d="M-9 -126 q9 8 18 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`}
      </g>
    </g></g>`;
  }

  /* ------------------------------------------------------------
     VILLAINS — huge, hunched, theatrical. Never gory; menace comes
     entirely from scale, posture and silhouette.
     kind: 'tall' | 'round'   state: 'sleep' | 'stand'
     ------------------------------------------------------------ */
  function villain(kind='tall', state='sleep', h=300){
    if(ASSETS.has('villain.'+kind)) return `<g>${ASSETS.svgImage('villain.'+kind, -h*0.45, -h, h*0.9, h)}</g>`;
    const s = h/300;
    if(state==='sleep'){
      const body = kind==='tall'
        ? `<path d="M-140 -6 q30 -80 96 -74 q70 6 140 12 q30 4 26 62 z" fill="#3f3a4e" stroke="${INK}" stroke-width="5"/>`
        : `<path d="M-130 -6 q10 -92 92 -88 q86 4 128 26 q28 16 20 62z" fill="#4a4038" stroke="${INK}" stroke-width="5"/>`;
      return `<g transform="scale(${s})" filter="url(#wobble2)"><g class="snore">
        ${body}
        <circle cx="-118" cy="-72" r="38" fill="#d9b593" stroke="${INK}" stroke-width="5"/>
        <path d="M-150 -96 q30 -26 62 -8 q-30 -2 -62 8z" fill="${kind==='tall'?'#2c2436':'#5a4a34'}" stroke="${INK}" stroke-width="4"/>
        <path d="M-136 -70 q10 -6 18 0" stroke="${INK}" stroke-width="4" fill="none"/>
        <path d="M-108 -70 q10 -6 18 0" stroke="${INK}" stroke-width="4" fill="none"/>
        <ellipse cx="-118" cy="-52" rx="12" ry="9" fill="#2a2230" stroke="${INK}" stroke-width="3.5"/>
        <g opacity=".75"><text x="-70" y="-118" font-size="34" fill="#cfc3a4" transform="rotate(-8)">z</text>
          <text x="-34" y="-146" font-size="46" fill="#cfc3a4" transform="rotate(-12)">Z</text></g>
      </g></g>`;
    }
    return `<g transform="scale(${s})" filter="url(#wobble2)"><g class="sway">
      <path d="M-26 -8 l-14 8 h40z" fill="${INK}"/><path d="M30 -8 l16 8 h-42z" fill="${INK}"/>
      <path d="M-56 -196 q56 -26 112 0 q16 96 6 190 q-62 20 -124 0 q-10 -96 6 -190z" fill="${kind==='tall'?'#3f3a4e':'#4a4038'}" stroke="${INK}" stroke-width="5"/>
      <path d="M-56 -190 q-40 60 -30 120" stroke="${kind==='tall'?'#3f3a4e':'#4a4038'}" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="M56 -190 q40 60 30 120" stroke="${kind==='tall'?'#3f3a4e':'#4a4038'}" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="M-46 -224 q46 -30 92 0 q6 26 -46 26 q-52 0 -46 -26z" fill="#d9b593" stroke="${INK}" stroke-width="5"/>
      <path d="M-52 -228 q52 -34 104 -2 q-26 -12 -52 -8 q-30 4 -52 10z" fill="${kind==='tall'?'#2c2436':'#5a4a34'}" stroke="${INK}" stroke-width="4"/>
      <circle cx="-18" cy="-216" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="-16" cy="-215" r="3.6" fill="${INK}"/>
      <circle cx="18" cy="-216" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="20" cy="-215" r="3.6" fill="${INK}"/>
      <path d="M-30 -230 l22 6M30 -230 l-22 6" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M-16 -198 q16 -8 32 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
    </g></g>`;
  }

  /* ---------------- PROPS ---------------- */
  function key(size=60, colour='#d9b64a', label=''){
    if(ASSETS.has('prop.key')) return ASSETS.svgImage('prop.key', -size/2, -size/2, size, size);
    const s = size/60;
    return `<g transform="scale(${s})" filter="url(#wobble)">
      <circle cx="-16" cy="0" r="13" fill="none" stroke="${colour}" stroke-width="7"/>
      <path d="M-3 0 h32" stroke="${colour}" stroke-width="7" stroke-linecap="round"/>
      <path d="M22 0 v11M29 0 v14" stroke="${colour}" stroke-width="6" stroke-linecap="round"/>
      ${label?`<text x="-16" y="5" font-size="13" fill="${INK}" text-anchor="middle">${label}</text>`:''}
    </g>`;
  }
  function bigLock(size=120, open=false){
    const s=size/120;
    return `<g transform="scale(${s})" filter="url(#wobble)">
      <path d="${open?'M-30 -30 q0 -52 34 -52 q30 0 30 44':'M-30 -30 q0 -48 30 -48 q30 0 30 48'}"
            fill="none" stroke="#8c8578" stroke-width="13" stroke-linecap="round"/>
      <path d="M-52 -30 h104 q8 0 8 12 v60 q0 12 -12 12 h-96 q-12 0 -12 -12 v-60 q0 -12 8 -12z"
            fill="#6f6a5e" stroke="${INK}" stroke-width="5"/>
      <circle cx="0" cy="16" r="12" fill="#2c2830" stroke="${INK}" stroke-width="4"/>
      <path d="M0 16 v18" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    </g>`;
  }
  /* how much of the cage height each occupant fills — grown-ups stand taller */
  const CAGE_FILL = { dad:0.9, stranger:0.86, mom:0.84, milo:0.72, junie:0.6 };
  function cage(w=230, h=300, occupant=null, opened=false, lock=true){
    const bars = [];
    for(let i=1;i<7;i++){ const x=-w/2 + (w/6)*i; bars.push(hline(x+R(2),-h,x+R(3),0,7,'#6d6455')); }
    return `<g>
      <rect x="${-w/2-8}" y="${-h-16}" width="${w+16}" height="16" fill="#5b5347" stroke="${INK}" stroke-width="4"/>
      <rect x="${-w/2-8}" y="-8" width="${w+16}" height="12" fill="#5b5347" stroke="${INK}" stroke-width="4"/>
      ${occupant?`<g transform="translate(0,-6)">${family(occupant, h*(CAGE_FILL[occupant]||0.72))}</g>`:''}
      <g style="${opened?'opacity:.25;transform:translateX(-38%) rotate(-14deg);transform-origin:left bottom;transition:1s ease':''}">
        ${bars.join('')}
        ${hline(-w/2,-h,w/2,-h,7,'#6d6455')}${hline(-w/2,0,w/2,0,7,'#6d6455')}
      </g>
      ${opened?'':`<g transform="translate(${w/2-6},${-h/2})">${bigLock(lock?78:66, !lock)}</g>`}
    </g>`;
  }
  function lamp(x,y,r=190,warm=true){
    return `<g class="flick"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#lampgrad)" opacity=".55"/>
      <circle cx="${x}" cy="${y}" r="14" fill="${warm?'var(--lamp-soft)':'#cfe0ea'}" filter="url(#softglow)"/></g>`;
  }
  function pipe(x1,y1,x2,y2,w=26,c='#5d5a50'){
    return `<g>${hline(x1,y1,x2,y2,w,c)}${hline(x1,y1,x2,y2,w-14,'#7a766a')}
      <circle cx="${x1}" cy="${y1}" r="${w/1.6}" fill="#4d4a42" stroke="${INK}" stroke-width="3"/>
      <circle cx="${x2}" cy="${y2}" r="${w/1.6}" fill="#4d4a42" stroke="${INK}" stroke-width="3"/></g>`;
  }
  /* The board grows with the words — a long sign like MIND THE CRATES used to
     run straight off its own 180-wide plank. 21px caps with 1px of tracking
     measure about 13.5px each, and 26px of board is left either side. */
  function sign(x,y,text,rot=-4){
    const w = Math.max(180, Math.round(text.length * 13.5) + 52);
    return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#wobble)">
      ${hrect(-w/2,-30,w,60,'#d8c9a2',INK,4)}
      <text x="0" y="8" text-anchor="middle" font-size="21" fill="#6b2f22"
        font-family="inherit" letter-spacing="1">${text}</text></g>`;
  }
  function trapdoor(open=false){
    return `<g filter="url(#wobble)">
      <ellipse cx="0" cy="0" rx="150" ry="46" fill="#25211d"/>
      ${open?`<ellipse cx="0" cy="4" rx="120" ry="34" fill="#0a0810"/>
        <g transform="translate(-40,-46) rotate(-52)">${hrect(-110,-14,220,26,'#6b5236',INK,5)}</g>`:
        `<g>${hrect(-124,-30,248,50,'#6b5236',INK,5)}
        ${hline(-110,-12,110,-12,4,'#4d3a26')}${hline(-110,4,110,4,4,'#4d3a26')}
        <circle cx="72" cy="-4" r="15" fill="none" stroke="#8c8578" stroke-width="7"/></g>`}
    </g>`;
  }
  function ladder(x,yTop,yBot){
    let rungs='';
    for(let y=yTop+30;y<yBot;y+=44) rungs += hline(x-34,y,x+34,y,8,'#7a6244');
    return `<g filter="url(#wobble)">${hline(x-34,yTop,x-34,yBot,10,'#6b5236')}
      ${hline(x+34,yTop,x+34,yBot,10,'#6b5236')}${rungs}</g>`;
  }

  return { INK, hline, hrect, eric, family, villain, key, bigLock, cage,
           lamp, pipe, sign, trapdoor, ladder, FAM_LOOK };
})();
