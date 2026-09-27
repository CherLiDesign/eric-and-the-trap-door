/* ============================================================
   WORLD — the rooms themselves. One continuous space: every
   challenge sits physically inside a room, reached by walking.
   ============================================================ */

const World = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let svg = null, ericG = null, current = null, busy = false;
  let ericX = 800, ericMood = 'idle';

  /* ---------- shared scenery helpers ---------- */
  const K = ART.INK;
  function floor(y, c1='#2a2632', c2='#1a1720'){
    return `<path d="M0 ${y} Q800 ${y-18} 1600 ${y} L1600 900 L0 900 Z" fill="${c1}"/>
            <path d="M0 ${y+60} Q800 ${y+40} 1600 ${y+62}" stroke="${c2}" stroke-width="6" fill="none"/>`;
  }
  function wall(top='#221f2b', bot='#171420'){
    return `<rect width="1600" height="900" fill="${top}"/>
            <rect y="420" width="1600" height="480" fill="${bot}" opacity=".55"/>`;
  }
  /* a light-brown brick wall — tiled pattern, with a soft dark wash at the
     top and bottom so the lamps still pool light the way they did before */
  let brickN = 0;
  function brickWall(brick='#a07f5c', mortar='#6d573f', shade='#120f18'){
    const id = 'brick'+(++brickN);
    return `<defs>
      <pattern id="${id}" width="200" height="96" patternUnits="userSpaceOnUse">
        <rect width="200" height="96" fill="${mortar}"/>
        <rect x="3"   y="3"  width="94" height="42" rx="4" fill="${brick}"/>
        <rect x="103" y="3"  width="94" height="42" rx="4" fill="${brick}" opacity=".9"/>
        <rect x="-47" y="51" width="94" height="42" rx="4" fill="${brick}" opacity=".94"/>
        <rect x="53"  y="51" width="94" height="42" rx="4" fill="${brick}" opacity=".86"/>
        <rect x="153" y="51" width="94" height="42" rx="4" fill="${brick}"/>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="${brick}"/>
    <rect width="1600" height="900" fill="url(#${id})"/>
    <rect width="1600" height="260" fill="${shade}" opacity=".55"/>
    <rect y="260" width="1600" height="180" fill="${shade}" opacity=".28"/>
    <rect y="440" width="1600" height="460" fill="${shade}" opacity=".42"/>`;
  }
  function moonWindow(x,y,w=210,h=280){
    return `<g filter="url(#wobble)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2c3f57" stroke="${K}" stroke-width="7"/>
      <path d="M${x} ${y+h/2} h${w}M${x+w/2} ${y} v${h}" stroke="${K}" stroke-width="6"/>
      <circle cx="${x+w*0.66}" cy="${y+h*0.3}" r="34" fill="#e6eef5" opacity=".92" filter="url(#softglow)"/>
      <path d="M${x-30} ${y+h} L${x+w*1.5} ${y+h+240} L${x+w*2.4} ${y+h} Z" fill="#c9d7e4" opacity=".07"/>
    </g>`;
  }
  /* lampgrad + the wobble filters live in the page-level <defs> so the
     title card and the end card can use them too */
  function grad(){ return ''; }
  function pipesDeco(){
    return ART.pipe(-20,120,1620,150,30) + ART.pipe(180,150,180,520,20) + ART.pipe(1320,148,1320,430,22)
      + `<g class="drip" style="animation-delay:1.2s"><circle cx="182" cy="530" r="6" fill="#7fa0b5"/></g>`;
  }

  /* ---------- rooms ---------- */
  const R = {

  bedroom: { ground: 700, amb:'night',
    art: () => `${wall('#20222f','#14151f')}
      ${moonWindow(1140,180)}
      ${floor(700,'#2b2735')}
      <g filter="url(#wobble)">
        ${ART.hrect(120,430,420,270,'#3a3242',K,6)}
        <path d="M120 470 q210 -40 420 0" fill="#6d4a52" stroke="${K}" stroke-width="5"/>
        <path d="M150 440 q90 -34 170 0" fill="#cfc3a4" stroke="${K}" stroke-width="5"/>
        ${ART.hrect(600,560,150,140,'#4a3f36',K,5)}
        <circle cx="675" cy="540" r="26" fill="#f3cd8a" stroke="${K}" stroke-width="4"/>
      </g>
      ${ART.lamp(675,538,230)}
      <text x="1250" y="330" font-size="22" fill="#6c6478" font-family="inherit" transform="rotate(-3 1250 330)">...that is where the running was</text>`,
    spots: s => [] },

  hallway: { ground: 720, amb:'night',
    art: () => `${wall('#1d1e2a','#131320')}${floor(720,'#2a2733')}
      <g filter="url(#wobble)">
        ${ART.hline(0,760,1600,748,5,'#3a3446')}
        ${ART.hline(120,790,1500,782,4,'#3a3446')}
      </g>
      ${ART.lamp(800,180,300)}
      <text x="1300" y="230" font-size="20" fill="#6c6478" font-family="inherit" transform="rotate(2 1300 230)">something ran past here</text>`,
    spots: s => [] },

  parents: { ground: 710, amb:'night',
    art: () => `${wall('#232231','#151522')}${moonWindow(1180,200,190,250)}${floor(710,'#2d2937')}
      <g filter="url(#wobble)">
        ${ART.hrect(240,400,620,310,'#3d3345',K,6)}
        <path d="M240 450 q310 -46 620 0" fill="#5c4a63" stroke="${K}" stroke-width="5"/>
        ${State.get('night')||State.flag('familyGone')?'':`
          <ellipse cx="430" cy="440" rx="90" ry="30" fill="#cfc3a4" stroke="${K}" stroke-width="4"/>
          <ellipse cx="670" cy="440" rx="90" ry="30" fill="#cfc3a4" stroke="${K}" stroke-width="4"/>`}
        ${ART.hrect(1000,540,220,170,'#463a30',K,5)}
      </g>
      ${ART.lamp(1110,530,200)}`,
    spots: s => [] },

  sibs: { ground: 710, amb:'night',
    art: () => `${wall('#212430','#141620')}${floor(710,'#2c2a36')}
      <g filter="url(#wobble)">
        ${ART.hrect(180,340,400,370,'#39323f',K,6)}
        ${ART.hline(180,470,580,466,7,'#5a4a52')}
        ${ART.hrect(760,430,380,280,'#39323f',K,6)}
        ${ART.hrect(1230,470,250,240,'#443a2e',K,5)}
        <path d="M1250 500 h200 M1250 560 h200 M1250 620 h200" stroke="#6a5c48" stroke-width="6"/>
      </g>
      <g transform="translate(980,300) rotate(-6)" filter="url(#wobble)">
        ${ART.hrect(-90,-60,180,120,'#e0d3ae',K,4)}
        <path d="M-60 20 q30 -60 60 -10 q20 30 50 -20" stroke="#a4552f" stroke-width="4" fill="none"/>
        <text x="0" y="-24" font-size="17" fill="#46414d" text-anchor="middle" font-family="inherit">Amy's drawing</text>
      </g>
      ${ART.lamp(1360,430,180)}`,
    spots: s => [] },

  kitchen: { ground: 720, amb:'house',
    art: () => `${wall('#2a2a33','#1b1a22')}${moonWindow(1240,160,220,260)}${floor(720,'#33303a')}
      <g filter="url(#wobble)">
        ${ART.hrect(120,470,540,250,'#4a3d30',K,6)}
        ${ART.hline(120,540,660,536,6,'#5f5040')}
        <path d="M700 720 L700 300 L1070 288 L1070 720" fill="#211f28" stroke="${K}" stroke-width="6"/>
        <text x="885" y="266" text-anchor="middle" font-size="21" fill="#6c6478" font-family="inherit">the cellar stairs</text>
        <g transform="translate(300,440)">
          <ellipse cx="0" cy="0" rx="62" ry="20" fill="#d6c7a5" stroke="${K}" stroke-width="4"/>
          <path d="M-30 -6 q30 -22 60 0" stroke="#8a6a44" stroke-width="6" fill="none"/>
          <text x="0" y="-40" font-size="18" fill="#6c6478" text-anchor="middle" font-family="inherit">still warm?</text>
        </g>
      </g>
      ${ART.lamp(400,220,280)}`,
    spots: s => [] },

  /* The basement: where Eric spends the worst night of his life, and where
     he wakes up the next morning. Wooden stairs up to the kitchen on the
     left, a wall of old boxes on the right to fold himself in behind. */
  basement: { ground: 740, amb:'night',
    art: () => {
      const morning = State.data.chapter === 'morning';
      let stairs = '';
      for(let i=0;i<7;i++){
        const x = 60 + i*46, y = 300 + i*64;
        stairs += ART.hrect(x, y, 130, 26, '#54432c', K, 4);
      }
      return `${wall(morning?'#232028':'#191720', morning?'#16141c':'#101017')}${floor(740,'#241f28')}
      ${pipesDeco()}
      <g filter="url(#wobble)">
        ${stairs}
        ${ART.hline(40,290,400,760,9,'#3d3021')}
        ${ART.hrect(30,240,180,60,'#2b2630',K,5)}
        <text x="120" y="222" font-size="19" fill="#6c6478" text-anchor="middle" font-family="inherit">up to the kitchen</text>
      </g>
      ${morning ? `<path d="M40 250 L200 250 L470 760 L120 760 Z" fill="#e8dfc8" opacity=".10"/>` : ''}
      <g filter="url(#wobble)">
        ${ART.hrect(880,470,300,270,'#4a3d2c',K,5)}
        ${ART.hrect(1000,300,260,180,'#40342a',K,5)}
        ${ART.hrect(1210,520,250,220,'#3b332a',K,5)}
        <path d="M880 560 h300M1000 380 h260" stroke="#31281c" stroke-width="4"/>
        ${ART.hrect(620,600,190,140,'#332c25',K,5)}
      </g>
      <g transform="translate(1330,470)">${ART.hrect(-70,-40,140,80,'#2b2630',K,4)}</g>
      ${ART.lamp(700,170,300)}
      <text x="1055" y="270" font-size="20" fill="#6c6478" font-family="inherit" transform="rotate(-2 1055 270)">nobody ever looks back here</text>`;
    },
    spots: s => [] },

  yard: { ground: 760, amb:'outside',
    art: () => `<rect width="1600" height="900" fill="#1a2230"/>
      <path d="M0 0 H1600 V420 Q800 470 0 430Z" fill="#16202f"/>
      <circle cx="1290" cy="150" r="66" fill="#e9f0f6" opacity=".9" filter="url(#softglow)"/>
      <g opacity=".5">${[...Array(40)].map(()=>`<circle cx="${Math.random()*1600}" cy="${Math.random()*380}" r="${1+Math.random()*1.8}" fill="#dfe9f2"/>`).join('')}</g>
      <path d="M0 430 Q800 470 1600 430 L1600 900 L0 900Z" fill="#20291f"/>
      <g filter="url(#wobble2)">
        <path d="M120 470 q-40 -220 60 -300 q90 -60 120 40 q60 -30 70 60 q40 130 -70 200z" fill="#141c18" stroke="${K}" stroke-width="5"/>
        <path d="M170 470 q10 -140 40 -190" stroke="${K}" stroke-width="14" fill="none"/>
        <path d="M1380 480 q-50 -180 40 -260 q90 -50 110 60 q30 140 -60 200z" fill="#141c18" stroke="${K}" stroke-width="5"/>
      </g>
      <g opacity=".7">${[560,660,760,860,960].map((x,i)=>`<ellipse cx="${x}" cy="${700+i*22}" rx="26" ry="13" fill="#3a4636" transform="rotate(${-14+i*4} ${x} ${700+i*22})"/>`).join('')}</g>
      <text x="700" y="640" font-size="21" fill="#7b8a92" font-family="inherit" transform="rotate(-3 700 640)">big footprints. not Dad's.</text>`,
    spots: s => [] },

  trap: { ground: 780, amb:'outside',
    art: () => `<rect width="1600" height="900" fill="#161e2a"/>
      <circle cx="240" cy="130" r="54" fill="#e9f0f6" opacity=".85" filter="url(#softglow)"/>
      <path d="M0 400 Q800 450 1600 400 L1600 900 L0 900Z" fill="#1d251c"/>
      <g filter="url(#wobble2)"><path d="M1180 480 q-60 -200 40 -280 q100 -60 130 60 q40 150 -70 220z" fill="#131a16" stroke="${K}" stroke-width="5"/></g>
      <g transform="translate(760,700)">${ART.trapdoor(State.flag('trapOpen'))}</g>
      ${State.flag('trapOpen')?`<g opacity=".9">${ART.ladder(760,700,900)}</g>`:''}
      ${ART.sign(1200,560,'KEEP OUT',6)}
      <text x="420" y="620" font-size="20" fill="#7b8a92" font-family="inherit" transform="rotate(-2 420 620)">the leaves were swept away</text>`,
    spots: s => [] },

  /* ---------------- THE SECRET BASE ---------------- */

  ladderroom: { ground: 760, amb:'base',
    art: () => `${wall('#191b24','#0f1017')}
      ${ART.ladder(300,-40,700)}
      ${floor(760,'#242029')}
      ${pipesDeco()}
      ${ART.sign(560,300,'NO CHILDREN',-7)}
      ${ART.lamp(1070,220,300)}
      <g transform="translate(660,690)" filter="url(#wobble)">
        ${ART.hrect(-70,-60,140,60,'#4a4030',K,4)}
        <text x="0" y="-22" font-size="17" fill="#cfc3a4" text-anchor="middle" font-family="inherit">someone's boots</text>
      </g>`,
    spots: s => [] },

  corridor: { ground: 770, amb:'base',
    art: () => `${wall('#1b1a26','#101018')}
      <g filter="url(#wobble2)">
        <path d="M0 90 Q400 40 820 120 Q1200 190 1600 110 L1600 0 L0 0Z" fill="#15141d"/>
        <path d="M0 830 Q420 890 840 800 Q1200 730 1600 820 L1600 900 L0 900Z" fill="#15141d"/>
      </g>
      ${floor(770,'#232029')}
      ${ART.pipe(-20,200,1620,240,28)}
      ${ART.pipe(-20,300,900,340,16)}
      <g filter="url(#wobble)">
        <path d="M400 400 l0 -60 l70 0" stroke="#6b6455" stroke-width="6" fill="none"/>
      </g>
      ${ART.lamp(430,240,260)}${ART.lamp(1180,300,220)}
      <g class="drip"><circle cx="905" cy="360" r="6" fill="#7fa0b5"/></g>
      ${ART.sign(980,470,'THIS WAY (NO)',5)}`,
    spots: s => [] },

  boiler: { ground: 780, amb:'base',
    art: () => `${wall('#1d1a22','#111017')}${floor(780,'#26212a')}
      ${ART.pipe(-20,140,1620,170,34)}${ART.pipe(300,168,300,520,22)}${ART.pipe(1250,168,1250,470,18)}
      <g filter="url(#wobble2)">
        <path d="M420 780 q-30 -330 250 -350 q290 -20 300 340z" fill="#332c2a" stroke="${K}" stroke-width="6"/>
        <circle cx="690" cy="520" r="86" fill="#241f24" stroke="${K}" stroke-width="6"/>
        <circle cx="690" cy="520" r="52" fill="#7a3a24" opacity=".65" class="hum"/>
        ${[0,1,2].map(i=>`<circle cx="${560+i*130}" cy="700" r="20" fill="${['#8a4a3a','#7a7a4a','#4a6a7a'][i]}" stroke="${K}" stroke-width="4"/>`).join('')}
      </g>
      ${ART.lamp(690,300,300)}
      ${ART.sign(1330,600,'PRESSURE!!',-8)}`,
    spots: s => [] },

  cages: { ground: 790, amb:'base',
    art: () => `${brickWall()}${floor(790,'#3a3026','#241d16')}
      ${ART.pipe(-20,110,1620,140,30)}
      ${ART.lamp(300,240,320)}${ART.lamp(1250,260,300)}
      <g filter="url(#wobble)">${ART.hrect(60,300,150,480,'#221f2b',K,5)}</g>
      ${ART.sign(800,220,'QUIET PLEASE',-3)}`,
    spots: s => [] },

  vault: { ground: 780, amb:'base',
    art: () => `${wall('#1c1b28','#101019')}${floor(780,'#242130')}
      ${ART.pipe(-20,180,700,200,22)}
      <!-- the big padlock used to hang here, but the doorway through to the
           Crate Workshop stands at x 1400 and the lock sat right behind its
           nameplate. The panel stays; the lock is gone. -->
      <g filter="url(#wobble2)">
        ${ART.hrect(1120,240,420,540,'#2c2636',K,7)}
        <path d="M1330 240 v540" stroke="${K}" stroke-width="6"/>
      </g>
      ${ART.lamp(600,250,300)}
      ${ART.sign(320,520,'MATCH OR LEAVE',-5)}`,
    spots: s => [] },

  workshop: { ground: 800, amb:'base',
    art: () => `${wall('#1a1b21','#0f1015')}${floor(800,'#232128')}
      ${ART.pipe(-20,150,1620,180,26)}
      <g filter="url(#wobble)">
        ${ART.hrect(70,560,240,240,'#4a3d2c',K,5)}
        ${ART.hrect(1290,520,250,280,'#4a3d2c',K,5)}
        ${ART.hline(0,470,1600,462,6,'#332e28')}
      </g>
      ${ART.lamp(830,260,340)}
      ${ART.sign(240,420,'MIND THE CRATES',4)}`,
    spots: s => [] },

  deep: { ground: 800, amb:'deep',
    art: () => `${wall('#141520','#0a0b12')}${floor(800,'#1d1a24')}
      ${ART.pipe(-20,120,1620,160,36)}${ART.pipe(140,158,140,600,24)}${ART.pipe(1420,158,1420,560,20)}
      <g class="drip" style="animation-delay:.6s"><circle cx="143" cy="610" r="7" fill="#7fa0b5"/></g>
      <g filter="url(#wobble2)">
        ${ART.hrect(240,330,300,470,'#241f2c',K,5)}
        ${[0,1,2,3].map(i=>`<circle cx="${300+i*70}" cy="${400+ (i%2)*40}" r="17" fill="${['#7a4a3a','#6a7a4a','#4a5a7a','#7a6a3a'][i]}" stroke="${K}" stroke-width="4" class="hum"/>`).join('')}
      </g>
      ${ART.lamp(700,220,260)}
      ${ART.sign(1180,380,'DO NOT PLAY',-6)}`,
    spots: s => [] },
  };

  /* ---------- doorway links between rooms ---------- */
  const DOORS = {
    bedroom:   [['hallway',1210]],
    hallway:   [['bedroom',280],['parents',680],['sibs',1000],['kitchen',1390]],
    parents:   [['hallway',200]],
    sibs:      [['hallway',200]],
    kitchen:   [['hallway',180],['basement',880],['yard',1420]],
    basement:  [['kitchen',210]],
    yard:      [['kitchen',180],['trap',1400]],
    trap:      [['yard',200]],
    ladderroom:[['corridor',1070]],
    corridor:  [['ladderroom',195],['boiler',775],['cages',1375]],
    boiler:    [['corridor',180]],
    cages:     [['corridor',175],['vault',1465]],
    vault:     [['cages',180],['workshop',1400]],
    workshop:  [['vault',180],['deep',1400]],
    deep:      [['workshop',180],['cages',1400]],
  };
  /* gates: which challenge must be finished before a door opens.
     Nothing gates the base any more — every cage is its own lock, so Eric
     can go and get whoever he wants first. Left here for future rooms. */
  const GATE = {};

  /* ---------- Eric movement ---------- */
  function placeEric(x, mood){
    ericX = x; if(mood) ericMood = mood;
    if(!ericG) return;
    ericG.setAttribute('transform', `translate(${x} ${R[current].ground})`);
  }
  function drawEric(mood){
    ericMood = mood || ericMood;
    if(ericG) ericG.innerHTML = ART.eric(ericMood, 235);
  }
  function walkTo(x, mood){
    return new Promise(res=>{
      if(!ericG) return res();
      const dist = Math.abs(x - ericX);
      const dur = Math.min(1500, 320 + dist*1.05);
      ericG.style.transition = `transform ${dur}ms cubic-bezier(.35,.05,.4,1)`;
      ericG.classList.add('walking');
      const flip = x < ericX ? -1 : 1;
      ericG.querySelector('.ericArt, g') && (ericG.style.setProperty('--flip', flip));
      ericG.setAttribute('transform', `translate(${x} ${R[current].ground}) scale(${flip},1)`);
      ericX = x;
      let steps = Math.max(1, Math.round(dur/300));
      const iv = setInterval(()=>SFX.step(), 260);
      setTimeout(()=>{ clearInterval(iv); ericG.classList.remove('walking'); res(); }, dur);
    });
  }

  /* ------------------------------------------------------------
     VISIBLE DOORWAYS. Every exit is drawn as a real door standing in
     the room — never an invisible hotspot. Doors are oversized next
     to Eric, and each one is labelled in his own handwriting.
     ------------------------------------------------------------ */
  function doorArt(to, x, y){
    /* Eric lives in this house — he knows every room in it by name.
       Only the secret base is unknown until he has stood in it. */
    const known = ROOMS[to].area === 'house' || State.isDiscovered(to);
    let name    = known ? ROOMS[to].name : '???';
    // the trap door is not a place yet — just the far end of the garden
    if(to === 'trap' && !State.flag('trapFound')) name = 'down the garden';

    /* a nameplate hung on the door itself — big, warm, readable at a glance */
    const plate = (w, dy) => `<g transform="translate(0 ${dy}) rotate(-1.5)" filter="url(#wobble)">
      <path d="M${-w/2} -26 L${w/2} -30 L${w/2-3} 28 L${-w/2+2} 24 Z" fill="#d8c9a2" stroke="${K}" stroke-width="4"/>
      <path d="M${-w/2+14} -30 v-20M${w/2-14} -32 v-20" stroke="#8c8578" stroke-width="4"/>
      <text y="10" text-anchor="middle" font-size="26" fill="#5a2b20" font-family="inherit">${name}</text>
    </g>`;

    /* the basement: a squat cellar door with steps falling away into
       the dark, a hand-painted sign, and an arrow pointing DOWN */
    if(to === 'basement'){
      return `<g class="doorArt" transform="translate(${x} ${y})" filter="url(#wobble)">
        <path d="M-108 0 L-108 -230 Q0 -292 108 -230 L108 0 Z" fill="#2a2028" stroke="${K}" stroke-width="8"/>
        <path d="M-88 -6 L-88 -218 Q0 -272 88 -218 L88 -6 Z" fill="#100e16" stroke="${K}" stroke-width="5"/>
        ${[0,1,2,3].map(i=>`<path d="M${-70+i*9} ${-40-i*34} h${140-i*18}" stroke="#3f3527" stroke-width="${10-i*1.6}" opacity="${.9-i*.2}"/>`).join('')}
        <path d="M-88 -150 h176" stroke="#241d18" stroke-width="3" opacity=".5"/>
        <circle cx="70" cy="-118" r="12" fill="#b0a68e" stroke="${K}" stroke-width="4"/>
        <g transform="translate(0 -276) rotate(-3)">
          ${ART.hrect(-104,-38,208,58,'#d8c9a2',K,4)}
          <text x="0" y="1" text-anchor="middle" font-size="27" fill="#6b2f22" font-family="inherit" letter-spacing="2">BASEMENT</text>
        </g>
        <g transform="translate(0 -84)">
          <path d="M0 -26 v42" stroke="#9b8d70" stroke-width="6" stroke-linecap="round"/>
          <path d="M-14 4 L0 22 L14 4" stroke="#9b8d70" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <text y="52" text-anchor="middle" font-size="23" fill="#8b8272" font-family="inherit">down the stairs</text>
      </g>`;
    }

    /* the way outdoors */
    if(to === 'yard' || to === 'trap'){
      return `<g class="doorArt" transform="translate(${x} ${y})" filter="url(#wobble)">
        <path d="M-96 0 L-96 -280 Q0 -320 96 -280 L96 0 Z" fill="#1a2230" stroke="${K}" stroke-width="8"/>
        <path d="M-74 -8 L-74 -266 Q0 -302 74 -266 L74 -8 Z" fill="#2b3a4c" stroke="${K}" stroke-width="4"/>
        <path d="M-74 -170 h148" stroke="${K}" stroke-width="4"/>
        <circle cx="58" cy="-140" r="11" fill="#b0a68e" stroke="${K}" stroke-width="4"/>
        <path d="M-60 -250 q60 -26 120 0" stroke="#c9d7e4" stroke-width="4" fill="none" opacity=".4"/>
        ${plate(Math.max(150, name.length*17), -110)}
      </g>`;
    }

    /* ordinary crooked door, taller than Eric by a long way */
    const base = ROOMS[to].area === 'base' ? '#241f2c' : '#2c2735';
    return `<g class="doorArt" transform="translate(${x} ${y})" filter="url(#wobble)">
      <path d="M-92 0 L-98 -300 L98 -308 L92 0 Z" fill="${base}" stroke="${K}" stroke-width="8"/>
      <path d="M-72 -10 L-77 -284 L77 -291 L72 -10 Z" fill="#14121c" stroke="${K}" stroke-width="4"/>
      <path d="M-74 -160 h148" stroke="#2f2a38" stroke-width="4"/>
      <circle cx="56" cy="-136" r="11" fill="#b0a68e" stroke="${K}" stroke-width="4"/>
      ${plate(Math.max(150, name.length*17), -196)}
    </g>`;
  }

  /* ---------- hotspot factory ---------- */
  function hotspot({x, y, w=140, h=160, label, act, beckon}){
    const g = document.createElementNS(NS,'g');
    g.setAttribute('class','svhot'+(beckon?' beckon':''));
    g.setAttribute('transform',`translate(${x} ${y})`);
    g.dataset.x = x;                       // so the keyboard can find it
    g.innerHTML = `<ellipse class="halo" cx="0" cy="${-h/2}" rx="${w*0.8}" ry="${h*0.7}" fill="url(#lampgrad)" opacity="0"/>
      <rect x="${-w/2}" y="${-h}" width="${w}" height="${h}" fill="transparent"/>
      <g class="tagtext" opacity="0" ${label?'':'display="none"'}><rect x="${-label.length*5.6-10}" y="${-h-42}" width="${label.length*11.2+20}" height="34" rx="10" fill="rgba(11,10,14,.8)" stroke="rgba(232,223,200,.2)"/>
      <text x="0" y="${-h-18}" text-anchor="middle" font-size="21" fill="#efe4c9" font-family="inherit">${label}</text></g>`;
    g.addEventListener('pointerenter', ()=>{ g.querySelector('.halo').setAttribute('opacity','1'); g.querySelector('.tagtext').setAttribute('opacity','1'); });
    g.addEventListener('pointerleave', ()=>{ g.querySelector('.halo').setAttribute('opacity','0'); g.querySelector('.tagtext').setAttribute('opacity','0'); });
    g.addEventListener('click', async ()=>{
      if(busy) return; busy = true;
      SFX.click();
      try{ await act(g); } finally { busy = false; }
    });
    return g;
  }

  /* ---------- build & enter a room ---------- */
  async function enter(room, opts={}){
    opts = opts || {};
    current = room;
    State.goto(room);
    const def = R[room];
    const isNew = State.discover(room);
    if(isNew) GameMap.noteDraw(room);

    if(!opts.noFade) await UI.fadeOut();
    UI.clearSay();
    SFX.ambience(State.get('night') && def.amb==='house' ? 'night' : def.amb);

    svg = UI.svgScene(`${grad()}${def.art()}<g id="doors"></g><g id="props"></g><g id="spots"></g>
      <g id="ericG"></g>`);
    ericG = svg.querySelector('#ericG');
    near = null;                       // the old room's highlight is gone with it
    ericG.style.transition = 'none';
    drawEric(opts.mood || (State.get('night') ? 'sneak' : 'idle'));
    placeEric(opts.x !== undefined ? opts.x : (opts.fromRight ? 1380 : 240));
    requestAnimationFrame(()=>{ ericG.style.transition=''; });

    // story-specific props for this room, injected by main.js
    const propG = svg.querySelector('#props');
    const spotG = svg.querySelector('#spots');
    if(Story.decorate[room]) propG.innerHTML = Story.decorate[room]();

    // doorways — drawn into the room, then made clickable
    const doorG = svg.querySelector('#doors');
    (DOORS[room]||[]).forEach(([to, x])=>{
      const allowed = Story.doorAllowed(room, to);
      if(!allowed && !Story.doorVisible(room, to)) return;   // some doors truly aren't there yet
      const label = State.isDiscovered(to) ? ROOMS[to].name : '???';
      doorG.insertAdjacentHTML('beforeend', doorArt(to, x, def.ground));
      if(!allowed) doorG.lastElementChild.setAttribute('opacity','.62');
      // the door the story wants Eric to take gets a warm pool of light
      if(allowed && Story.doorCalling(room, to)){
        doorG.insertAdjacentHTML('beforeend',
          `<g class="beckon" style="pointer-events:none">${ART.lamp(x, def.ground-160, 250)}</g>`);
      }
      spotG.appendChild(hotspot({
        // the door already wears its name on a plate — no floating tag needed
        x, y: def.ground, w:230, h:320, label:'',
        act: async ()=>{
          await walkTo(x);
          if(!allowed){ SFX.oops(); await UI.say(Story.doorRefused(room, to), 'Eric'); return; }
          const gate = GATE[to];
          if(gate && !State.didChallenge(gate[0])){ SFX.oops(); await UI.say(gate[1], 'Eric'); return; }
          if(!(await Story.beforeExit(room, to))) return;
          SFX.doorOpen();
          await enter(to, { fromRight: (DOORS[to]||[]).some(d=>d[0]===room && d[1] > 800), travelled:true });
        }
      }));
    });

    // interactive things placed by the current chapter
    (Story.spots[room] ? Story.spots[room]() : []).forEach(sp=>{
      spotG.appendChild(hotspot(Object.assign({}, sp, {
        act: async (g)=>{ if(sp.walk!==false) await walkTo(sp.x + (sp.stand||0)); await sp.act(g); }
      })));
    });

    UI.hud(true); UI.refreshHud();
    await UI.fadeIn();
    // you hear the room close around you before you hear anything else
    if(opts.travelled){ SFX.doorShut(); SFX.arrive(); }
    if(isNew) { SFX.pencil(); }
    await Story.onEnter(room, {firstTime:isNew, travelled:opts.travelled});
  }

  function rebuild(){ return enter(current, {x:ericX, noFade:true}); }

  /* ------------------------------------------------------------
     KEYBOARD. Hold ← / → to walk Eric along the room. Whatever he
     is standing next to lights up; Enter / Space (or ↑) uses it.
     ------------------------------------------------------------ */
  const KEY = { left:false, right:false };
  const SPEED = 520;          // svg units per second
  const REACH = 150;          // how close Eric must stand to use a thing
  let facing = 1, near = null, lastT = 0, stepT = 0, rafOn = false;

  function keyBlocked(){
    // no walking during a scene, a challenge, an open map or a dialog box
    return busy || !ericG || !svg || !svg.isConnected ||
           (typeof GameMap !== 'undefined' && GameMap.isOpen) ||
           document.getElementById('overlay').classList.contains('on') ||
           !!document.querySelector('.centerbox');
  }

  function highlight(g, on){
    if(!g) return;
    const halo = g.querySelector('.halo'), tag = g.querySelector('.tagtext');
    if(halo) halo.setAttribute('opacity', on ? '1' : '0');
    if(tag)  tag.setAttribute('opacity',  on ? '1' : '0');
  }

  function nearest(){
    if(!svg) return null;
    let best = null, bd = REACH;
    svg.querySelectorAll('.svhot').forEach(g=>{
      const d = Math.abs((+g.dataset.x) - ericX);
      if(d < bd){ bd = d; best = g; }
    });
    return best;
  }

  function refreshNear(){
    const n = nearest();
    if(n !== near){ highlight(near, false); highlight(n, true); near = n; }
  }

  function tick(t){
    if(!KEY.left && !KEY.right){ rafOn = false; if(ericG) ericG.classList.remove('walking'); return; }
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - lastT)/1000 || 0); lastT = t;
    if(keyBlocked()){ if(ericG) ericG.classList.remove('walking'); return; }

    const dir = (KEY.right?1:0) - (KEY.left?1:0);
    if(!dir) return;
    facing = dir;
    ericX = Math.max(120, Math.min(1480, ericX + dir * SPEED * dt));
    ericG.style.transition = 'none';
    ericG.style.setProperty('--flip', facing);
    ericG.setAttribute('transform', `translate(${ericX} ${R[current].ground}) scale(${facing},1)`);
    ericG.classList.add('walking');
    if(t - stepT > 260){ stepT = t; SFX.step(); }
    refreshNear();
  }

  function startWalk(){
    if(rafOn) return;
    rafOn = true; lastT = performance.now();
    requestAnimationFrame(tick);
  }

  window.addEventListener('keydown', e=>{
    if(e.repeat) return;
    if(e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A'){ KEY.left  = true; startWalk(); e.preventDefault(); }
    if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){ KEY.right = true; startWalk(); e.preventDefault(); }
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp'){
      if(keyBlocked()) return;
      refreshNear();
      if(near){ e.preventDefault(); near.dispatchEvent(new MouseEvent('click', {bubbles:true})); }
    }
  });
  window.addEventListener('keyup', e=>{
    if(e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') KEY.left  = false;
    if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') KEY.right = false;
  });
  window.addEventListener('blur', ()=>{ KEY.left = KEY.right = false; });

  return { enter, rebuild, walkTo, drawEric, placeEric, hotspot,
           get svg(){return svg;}, get room(){return current;},
           get ericX(){return ericX;}, set busy(v){busy=v;}, get busy(){return busy;},
           R, DOORS, floor, wall, grad };
})();
