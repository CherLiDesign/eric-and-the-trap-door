/* ============================================================
   CHALLENGE 2 — THE PICTURE DOOR (memory matching)
   Nine shutters on the door: four matching pairs, and one JOKER
   who is on nobody's side. Match all four pairs and the great lock
   swings open. Turn up the JOKER and he laughs, shuffles the whole
   door, and you start again.
   ============================================================ */

const ChallengeMemory = (() => {

  /* the four pairs, plus the one card that ruins everything.
     Each has a hand-drawn PNG if one has been dropped into
     assets/props/cards/ — otherwise the placeholder below is drawn. */
  /* Everything on a card is drawn the way the originals were: a fat
     wobbly marker outline, and the colour laid down underneath it,
     slightly off-register — the way a kid colours past the line. */
  const INKC = '#17161c';

  /* a marker stroke: the colour blob first, nudged off-centre, then the
     black outline on top of it */
  function mark(d, fill, w=7, dx=2, dy=3){
    return `${fill ? `<path d="${d}" fill="${fill}" transform="translate(${dx} ${dy})" opacity=".95"/>` : ''}
            <path d="${d}" fill="${fill?'none':'none'}" stroke="${INKC}" stroke-width="${w}"
                  stroke-linejoin="round" stroke-linecap="round"/>`;
  }

  const ICONS = {
    flower:  { label:'a blue flower', d:()=>`
      ${mark('M0 62 q-5 -34 -2 -74 q1 -14 3 -22', null, 9)}
      <path d="M-4 62 q-5 -36 -2 -76" stroke="#6aa84f" stroke-width="13" fill="none" stroke-linecap="round"/>
      ${mark('M-2 22 q-30 -6 -46 -30 q-2 -4 3 -4 q34 6 45 32z', '#7cb85c', 6, -3, 3)}
      ${mark('M4 34 q30 -8 44 -32 q3 -5 -3 -4 q-32 6 -43 34z', '#7cb85c', 6, 3, 3)}
      ${mark('M-34 -50 q-10 -34 8 -44 q10 -6 14 4 q6 -10 15 -3 q11 -9 16 3 q14 12 5 42 q-3 16 -29 15 q-27 -1 -29 -17z', '#3b83c4', 8, -3, 4)}` },

    fish:    { label:'a red fish', d:()=>`
      ${mark('M-16 -14 q10 -22 16 -6 q4 10 2 14z', '#c0392b', 6, 2, -2)}
      ${mark('M4 16 q6 18 -10 16 q-8 -2 -4 -14z', '#c0392b', 6, 2, 3)}
      ${mark('M-24 0 l-26 -22 q-4 -3 -4 3 l2 38 q0 6 5 2z', '#c0392b', 6, -3, 2)}
      ${mark('M-26 2 q26 -34 56 -14 q14 9 16 14 q-12 20 -34 20 q-26 0 -38 -20z', '#c0392b', 7, 3, 3)}
      ${mark('M32 -2 q9 4 8 8 q-8 4 -12 -1 q-1 -6 4 -7z', '#d99a2b', 5, 1, 1)}` },

    volcano: { label:'a volcano', d:()=>`
      ${mark('M-52 40 q26 -44 38 -70 q4 -8 10 -1 q6 -8 10 1 q13 26 40 70 q-50 8 -98 0z', '#8a5a3c', 8, -3, 4)}
      ${mark('M-16 -28 q4 -14 8 -20 q3 12 7 4 q3 -10 6 2 q3 -8 7 4 q4 8 8 12 q-18 12 -36 -2z', '#d94f26', 6, 2, 3)}
      ${mark('M-2 -50 q-22 -2 -20 -18 q1 -13 14 -12 q4 -12 16 -8 q14 -6 18 8 q13 2 10 16 q-2 14 -20 14z', '#9aa6a2', 7, -3, -4)}` },

    book:    { label:'an open book', d:()=>`
      ${mark('M-48 -30 q22 -8 46 2 q24 -10 46 -2 q4 32 0 62 q-24 -8 -46 2 q-22 -10 -46 -2 q-4 -30 0 -62z', '#7cb85c', 8, 2, 4)}
      ${mark('M-42 -26 q20 -7 40 2 v52 q-20 -8 -40 -1z', '#f4f1e7', 6, 1, 2)}
      ${mark('M42 -26 q-20 -7 -40 2 v52 q20 -8 40 -1z', '#f4f1e7', 6, -1, 2)}
      ${[0,1,2,3,4].map(i=>`<path d="M-36 ${-14+i*13} q9 -4 15 1 q7 4 14 -1" stroke="${INKC}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
        <path d="M8 ${-14+i*13} q9 -4 15 1 q7 4 14 -1" stroke="${INKC}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`).join('')}` },

    joker:   { label:'JOKER', d:()=>`
      ${mark('M-30 -18 q-16 -20 -2 -26 q10 -4 16 8 q-8 8 -14 18z', '#c0392b', 6, -3, 2)}
      ${mark('M30 -18 q16 -20 2 -26 q-10 -4 -16 8 q8 8 14 18z', '#e8d04a', 6, 3, 2)}
      ${mark('M-14 -30 q-6 -28 6 -30 q14 -2 12 12 q-2 10 -4 18z', '#3b6fc4', 6, 0, -3)}
      ${mark('M-24 -22 q24 -12 48 0 q-4 12 -24 12 q-20 0 -24 -12z', '#c0392b', 6, 2, 2)}
      ${mark('M-20 -14 q20 -8 40 0 q2 22 -20 24 q-22 -2 -20 -24z', '#f0d08a', 6, 2, 3)}
      <path d="M-9 -6 q3 3 5 0M4 -6 q3 3 5 0" stroke="${INKC}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M-7 4 q7 6 14 0" stroke="${INKC}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      ${mark('M-22 14 q22 -8 44 0 q6 24 2 40 q-24 8 -48 0 q-4 -18 2 -40z', '#e8d04a', 7, 2, 4)}
      ${mark('M-22 16 q-14 8 -22 20', '#3b6fc4', 9)}
      ${mark('M22 16 q14 8 22 20', '#3b6fc4', 9)}` },
  };

  const PAIRS = ['flower','fish','volcano','book'];   // two of each
  const COLS = 3, CW = 240, CH = 250;                 // 3 x 3 board

  /* one card face — supplied artwork wins, placeholder otherwise */
  function faceArt(face){
    const key = 'card.' + face;
    if(ASSETS.has(key)) return ASSETS.svgImage(key, -62, -86, 124, 172);
    return `<g filter="url(#wobble)" transform="translate(0,-6) scale(1.15)">${ICONS[face].d()}</g>`;
  }

  /* the back of every card: blue, with two stars */
  function backArt(){
    if(ASSETS.has('card.back')) return ASSETS.svgImage('card.back', -72, -96, 144, 192);
    const star = (cx,cy,r,fill)=>{
      let p = '';
      for(let i=0;i<10;i++){
        const rr = i%2 ? r*0.45 : r, a = (i*36 - 90) * Math.PI/180;
        p += `${i?'L':'M'}${(cx + rr*Math.cos(a)).toFixed(1)} ${(cy + rr*Math.sin(a)).toFixed(1)}`;
      }
      return `<path d="${p}Z" fill="${fill}"/>`;
    };
    return `<g filter="url(#wobble)">
      <rect x="-72" y="-96" width="144" height="192" rx="10" fill="#2f8fb5" stroke="#17161c" stroke-width="7"/>
      <rect x="-72" y="-96" width="144" height="192" rx="10" fill="#0d3a4e" opacity=".16" filter="url(#grain)"/>
      ${star(-8, 16, 36, '#e88a3c')}${star(32, -42, 21, '#c6d94a')}
    </g>`;
  }

  function cardSVG(id, x, y, face){
    return `<g class="card" data-id="${id}" transform="translate(${x} ${y})"><g class="inner">
      <g class="back">${backArt()}</g>
      <g class="front" opacity="0">
        <rect x="-72" y="-96" width="144" height="192" rx="10" fill="#f2ece0" stroke="#17161c" stroke-width="7"/>
        <rect x="-72" y="-96" width="144" height="192" rx="10" fill="#8a7a5a" opacity=".13" filter="url(#grain)"/>
        ${faceArt(face)}
      </g>
    </g></g>`;
  }

  async function run(){
    const L = Chal.layer(); Chal.dim(L, .6);

    L.insertAdjacentHTML('beforeend', `
      <g filter="url(#wobble2)">
        <path d="M240 60 q560 -40 1130 0 l40 800 q-600 60 -1210 0z" fill="#332c3c" stroke="#1b1a22" stroke-width="8"/>
        <text x="800" y="140" text-anchor="middle" font-size="30" fill="#8b8272" font-family="inherit">TWO OF EACH. AND ONE OF HIM.</text>
      </g>
      <g id="cards"></g>
      <g id="doorlock" transform="translate(1330 470) scale(1.1)">${ART.bigLock(130,false)}</g>`);

    const board = L.querySelector('#cards');
    let faces = [], first = null, lock = false, done = 0, jokers = 0;

    return new Promise(async resolve=>{
    /* shuffle and lay out all nine, every one face down */
    function deal(){
      faces = [...PAIRS, ...PAIRS, 'joker'].sort(()=>Math.random()-.5);
      first = null; lock = false; done = 0;
      board.innerHTML = faces.map((f,i)=>{
        const col = i % COLS, row = Math.floor(i / COLS);
        return cardSVG(i, 800 + (col-1)*CW, 300 + row*CH, f);
      }).join('');
      board.querySelectorAll('.card').forEach(el=>el.addEventListener('click', ()=>pick(el)));
    }

      deal();
      await Chal.hint('Find the two that are the same. Do not wake the JOKER.');

      async function pick(el){
        if(lock || el.dataset.done || el === first) return;
        flip(el, true); SFX.click();
        const face = faces[+el.dataset.id];

        /* the JOKER. The first time he only grins — a warning, and you
           keep everything you have matched. The second time he shuffles
           the whole door and you start again. */
        if(face === 'joker'){
          lock = true;
          jokers++;
          if(jokers === 1){
            SFX.boing();
            el.classList.add('wrong');
            await UI.wait(700);
            await UI.say('The JOKER. He winks at Eric and turns himself back over.', null, 2400);
            el.classList.remove('wrong');
            flip(el, false);
            if(first){ flip(first, false); first = null; }   // that turn is spent
            await UI.wait(300);
            lock = false;
            return;
          }
          SFX.oops(); SFX.boing();
          el.classList.add('wrong');
          await UI.wait(700);
          await UI.say('The JOKER again. He laughs, and every shutter on the door spins at once.', null, 2800);
          Chal.shake(board);
          await UI.wait(400);
          jokers = 0;
          deal();
          return;
        }

        if(!first){ first = el; return; }
        lock = true;
        const second = el;
        const same = faces[+first.dataset.id] === faces[+second.dataset.id];
        await UI.wait(520);
        if(same){
          SFX.snap();
          [first, second].forEach(c=>{ c.dataset.done = 1; c.classList.add('matched'); });
          done++;
          first = null; lock = false;
          if(done === PAIRS.length){
            await UI.wait(400);
            SFX.great(); SFX.unlock();
            const lk = L.querySelector('#doorlock');
            lk.innerHTML = ART.bigLock(130, true);
            lk.classList.add('pulse-good');
            await UI.wait(500);
            SFX.lockOpen(); SFX.cageOpen();
            await UI.say('Every shutter clacks open at once. The door lets out a long, tired breath.', null, 2800);
            await Chal.close(L);
            resolve(true);
          }
        } else {
          SFX.boing();
          [first, second].forEach(c=>c.classList.add('wrong'));
          await UI.wait(480);
          [first, second].forEach(c=>{ c.classList.remove('wrong'); flip(c, false); });
          first = null; lock = false;
        }
      }

      /* the shutter turns edge-on, swaps, and turns back — a physical flip */
      function flip(el, up){
        const inner = el.querySelector('.inner');
        inner.style.transition = 'transform .16s ease-in';
        inner.style.transform = 'scaleX(0.06)';
        setTimeout(()=>{
          el.querySelector('.front').setAttribute('opacity', up?'1':'0');
          el.querySelector('.back').setAttribute('opacity', up?'0':'1');
          inner.style.transition = 'transform .18s cubic-bezier(.3,1.5,.5,1)';
          inner.style.transform = 'scaleX(1)';
        }, 165);
      }
    });
  }
  return { run };
})();
