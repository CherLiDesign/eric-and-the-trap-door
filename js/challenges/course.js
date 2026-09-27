/* ============================================================
   CHALLENGE 3 — ACROSS THE WATER  (Dad's cage lock)
   The stage is Emma's drawing itself: assets/environments/dad-stage.png.
   The ground Eric walks on is sampled straight out of that picture
   (js/challenges/course-map.js), so he stands on the ledges she drew,
   and the red pool is hot.
   Arrow keys / WASD to run, space or up to jump.
   ============================================================ */

const ChallengeCourse = (() => {
  const W = 1600, H = 900;
  const M = COURSE_MAP;                 // ground line baked from the drawing
  const COLW = W / M.cols;
  const G = 0.72, JUMP = -16.4, RUN = 6.4;
  const COYOTE = 6;                     // frames of grace after running off a ledge
  const ERIC_H = 48;                    // small — the drawing's ledges are low
  /* He comes OUT OF THE LITTLE DOOR on the left, not off the roof. The door
     is drawn at x 5–53 and its threshold is the shelf at y 429. */
  const START = { x: 48 };
  const DOOR  = { x1: 5, x2: 53, y: 429 };

  /* The sampler read the picture's top border as ground for the whole left
     end, which put Eric up on the roof. The shelf the door opens onto is
     the real floor there, so it is patched back in by hand. */
  const GROUND_FIX = [{ x1: 0, x2: 133, y: 429 }];
  const KEY_X = 1506;

  const PAPER = '#fcf9f2';

  /* The last obstacle: the rocks on their lines go straight UP AND DOWN,
     like pistons. HI is high enough to run clean underneath, LO is low
     enough to be a wall. Neighbours are out of step, so a gap travels
     along the row and you run through on the beat.
     The drawn ones are painted over so only these actually move. */
  const PIVOT_Y = 212;                  // the ceiling they hang from
  const ROCK_HI = 228, ROCK_LO = 336;   // top and bottom of the travel
  /* ROCK_HI is set so the bottom of a raised rock sits well clear of the top
     of Eric's head (ground there is ~338, he is 48 tall, so his head is ~290):
     228 + r20 = 248, a good 40px of daylight. Any lower and he cannot get
     under it at a run, which is the whole obstacle. */
  const ROCK_GAP = 80;                  // as she drew them, seven in a row
  /* ONE AT A TIME, AND SLOWLY. They used to all swing together on a fast
     cycle, which read as a wall of moving rock. Now exactly one rock is ever
     down: it takes its turn, comes down, sits there, goes back up, and only
     then does its neighbour on the right begin. You can stand and watch the
     whole row take its turns before you decide to go. */
  const ROCK_CYCLE = 2000;              // ms for one rock's whole turn
  const ROCK_DROP  = 0.30;              // of the turn spent coming down
  const ROCK_HOLD  = 0.24;              //   ... sitting at the bottom
  const ROCK_RISE  = 0.30;              //   ... going back up (rest: a pause)
  const STONES = [0,1,2,3,4,5,6].map(i=>({ px: 912 + i*ROCK_GAP, r: 20 }));
  /* 0 at the top, 1 at the bottom — where rock `i` is at time `t` */
  function rockK(i, t){
    const turn = Math.floor((t % (ROCK_CYCLE * STONES.length)) / ROCK_CYCLE);
    if(turn !== i) return 0;            // not its turn: it stays up out of the way
    const u = (t % ROCK_CYCLE) / ROCK_CYCLE;
    if(u < ROCK_DROP)                 return 0.5 - 0.5*Math.cos(Math.PI * (u / ROCK_DROP));
    if(u < ROCK_DROP + ROCK_HOLD)     return 1;
    if(u < ROCK_DROP + ROCK_HOLD + ROCK_RISE)
      return 0.5 + 0.5*Math.cos(Math.PI * ((u - ROCK_DROP - ROCK_HOLD) / ROCK_RISE));
    return 0;
  }

  /* The blue in Emma's drawing is WATER. Anything below this line is the
     deep pit on the left. Falling in is the end of the run. */
  const WATER_Y = 520;

  /* The crocodile used to live here. He is gone — the pit is just water now.
     The spring and the row of grey teeth are part of Emma's drawing, so they
     are painted over with the pool's own blue and the pit reads as one pool.
     Measured off the artwork: px 155–252 across, 336–424 down. */
  const PIT_PATCH = { x: 164, y: 556, w: 104, h: 89 };
  const POOL_BLUE = '#2a7dab';

  /* The little ledges she drew floating over the water and the hot pool —
     the yellow square, the purple bar, the green swing. Sampled off the
     artwork, so Eric stands on the shapes that are actually painted there. */
  const PLATFORMS = [
    { x1: 234, x2: 252, y: 441 },   // the small yellow square, over the water
    { x1: 359, x2: 443, y: 430 },   // the purple bar, at the lip of the hot pool
    { x1: 519, x2: 587, y: 312 },   // the green swing, hanging from the ceiling
  ];

  /* The red pool, measured straight off the drawing. The sampled `lava`
     column data has holes in it — half the pool came out cold — so the
     pool is treated as the one solid stretch it is painted as. */
  const HOT = { x1: 411, x2: 617 };

  const col      = x => Math.max(0, Math.min(M.cols-1, Math.round(x / COLW)));
  const groundAt = x => {
    for(const f of GROUND_FIX) if(x >= f.x1 && x <= f.x2) return f.y;
    return M.ground[col(x)];
  };
  const lavaAt   = x => (x > HOT.x1 && x < HOT.x2) || !!M.lava[col(x)];
  /* which ledge, if any, Eric would land on falling from prevY to y at x */
  function platformAt(x, prevY, y){
    for(const p of PLATFORMS)
      if(x > p.x1 - 24 && x < p.x2 + 24 && prevY <= p.y + 2 && y >= p.y) return p;
    return null;
  }

  async function run(){
    const L = Chal.layer();
    let done = false, raf = null, t = 0, falls = 0;
    const keys = {};
    let ex = START.x, ey = groundAt(START.x), vx = 0, vy = 0, onGround = true, face = 1, coyote = 0;

    let stoneArt = '';
    STONES.forEach((s,i)=> stoneArt += `<g id="st${i}">
      <line id="ln${i}" x1="${s.px}" y1="${PIVOT_Y}" x2="${s.px}" y2="${ROCK_HI}" stroke="#14131b" stroke-width="3"/>
      <ellipse id="rk${i}" cx="${s.px}" cy="${ROCK_HI}" rx="${s.r}" ry="${s.r*0.9}"
               fill="#cdd6cb" stroke="#14131b" stroke-width="5"/>
    </g>`);

    L.insertAdjacentHTML('beforeend', `
      <rect width="${W}" height="${H}" fill="${PAPER}"/>
      <image href="assets/environments/dad-stage.png" x="0" y="${M.stageY}"
             width="${W}" height="${M.stageH}" preserveAspectRatio="none"/>
      <!-- the drawn stones are painted out; the moving ones below take their place -->
      <rect x="870" y="206" width="545" height="132" fill="${PAPER}"/>
      <g id="stones">${stoneArt}</g>
      <g id="goalkey" class="beckon" transform="translate(${KEY_X} ${groundAt(KEY_X)-72})">
        ${ART.key(58,'#e8c53f')}
      </g>
      <text x="${KEY_X}" y="${groundAt(KEY_X)-118}" text-anchor="middle" font-size="20"
            fill="#8a6a1e" font-family="inherit">Dad's key</text>
      <!-- the spring and the grey teeth, painted out: the pit is all water -->
      <rect x="${PIT_PATCH.x}" y="${PIT_PATCH.y}" width="${PIT_PATCH.w}" height="${PIT_PATCH.h}"
            fill="${POOL_BLUE}"/>
      <path d="M${PIT_PATCH.x} ${PIT_PATCH.y} h${PIT_PATCH.w}"
            stroke="#14131b" stroke-width="5" fill="none"/>
      <g id="eric" transform="translate(${ex} ${ey})">${ART.eric('sneak',ERIC_H)}</g>
      <text x="800" y="120" text-anchor="middle" font-size="26" fill="#3d4552" font-family="inherit">
        get across to Dad's key — the blue is water — do not fall in. Watch the rocks.</text>
      <g id="pad" opacity=".92">
        <g class="btn" data-k="left"  transform="translate(140 ${H-110})"><circle r="44" fill="${PAPER}" stroke="#14131b" stroke-width="5"/><path d="M13 -17 L-15 0 L13 17Z" fill="#14131b"/></g>
        <g class="btn" data-k="right" transform="translate(256 ${H-110})"><circle r="44" fill="${PAPER}" stroke="#14131b" stroke-width="5"/><path d="M-13 -17 L15 0 L-13 17Z" fill="#14131b"/></g>
        <g class="btn" data-k="jump"  transform="translate(1460 ${H-110})"><circle r="50" fill="${PAPER}" stroke="#14131b" stroke-width="5"/><text y="9" text-anchor="middle" font-size="22" fill="#14131b" font-family="inherit">jump</text></g>
      </g>`);

    const eric = L.querySelector('#eric');
    const rockEls = STONES.map((s,i)=>L.querySelector('#rk'+i));
    const lineEls = STONES.map((s,i)=>L.querySelector('#ln'+i));
    await Chal.hint('Arrow keys to run. Space to jump. Do not land in the water.');

    return new Promise(resolve=>{
      const down = e=>{
        const k = e.key.toLowerCase();
        if(['arrowleft','a'].includes(k)) keys.left = true;
        else if(['arrowright','d'].includes(k)) keys.right = true;
        else if([' ','arrowup','w'].includes(k)) keys.jump = true;
        else return;
        e.preventDefault();
      };
      const up = e=>{
        const k = e.key.toLowerCase();
        if(['arrowleft','a'].includes(k)) keys.left = false;
        if(['arrowright','d'].includes(k)) keys.right = false;
        if([' ','arrowup','w'].includes(k)) keys.jump = false;
      };
      window.addEventListener('keydown', down);
      window.addEventListener('keyup', up);

      L.querySelectorAll('.btn').forEach(b=>{
        const k = b.dataset.k;
        const on  = e=>{ e.preventDefault(); keys[k] = true; };
        const off = e=>{ e.preventDefault(); keys[k] = false; };
        b.addEventListener('pointerdown', on);
        b.addEventListener('pointerup', off);
        b.addEventListener('pointerleave', off);
        b.addEventListener('pointercancel', off);
        b.style.cursor = 'pointer';
      });

      function cleanup(){
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
        cancelAnimationFrame(raf);
      }

      /* Falling in the water: he goes under with a splash and the run
         starts again. No crocodile any more — the pit is just deep. */
      async function splash(){
        SFX.whoosh();
        eric.style.transition = 'transform .3s ease-in, opacity .2s ease .18s';
        eric.setAttribute('transform', `translate(${ex} ${ey + 46}) scale(${face},1)`);
        eric.style.opacity = '0';
        await UI.wait(420);
        eric.style.transition = '';
        eric.style.opacity = '1';
      }

      async function restart(why, wet){
        if(done) return;
        done = true;
        if(wet) await splash();
        SFX.oops(); SFX.whoosh();
        falls++;
        await UI.say(falls === 1 ? why
                   : falls === 3 ? 'Dad is right there. Eric is not stopping.'
                   : 'Again.', 'Eric', 1500);
        ex = START.x; ey = groundAt(START.x); vx = 0; vy = 0; onGround = true;
        eric.setAttribute('transform', `translate(${ex} ${ey})`);
        done = false;
      }

      function tick(){
        raf = requestAnimationFrame(tick);
        t += 16;

        /* the rocks ride straight up and down their lines — one at a time */
        const pos = STONES.map((s,i)=>{
          const k = rockK(i, t);
          const y = ROCK_HI + (ROCK_LO - ROCK_HI) * k;
          rockEls[i].setAttribute('cy', y);
          lineEls[i].setAttribute('y2', y);
          return { x: s.px, y, r: s.r };
        });

        if(done) return;

        const want = (keys.right?1:0) - (keys.left?1:0);
        vx = want * RUN;
        if(want) face = want;
        /* a jump a few frames after he runs off an edge still counts — the
           difference between a game a seven-year-old finishes and one she doesn't */
        if(keys.jump && (onGround || coyote > 0)){ vy = JUMP; onGround = false; coyote = 0; SFX.step(); }

        /* walk — but a ledge taller than his knees is a wall.
           standing on one of the drawn ledges, he is free to walk off it */
        const onLedge = PLATFORMS.some(p => onGround && Math.abs(ey - p.y) < 2 && ex > p.x1-24 && ex < p.x2+24);
        const nx = Math.max(24, Math.min(W-24, ex + vx));
        const gn = groundAt(nx);
        if(onLedge || !(ey > gn && ey - gn > 44)) ex = nx;

        const prevY = ey;
        vy += G; ey += vy;

        /* the ground line straight out of the drawing */
        const g = groundAt(ex);
        onGround = false;
        if(ey >= g){ ey = g; vy = 0; onGround = true; }

        /* ...and the little ledges she drew floating above it */
        /* the drawn ledges are stone: standing on one, what is underneath
           him — water, the hot pool — cannot touch him */
        const p = vy >= 0 ? platformAt(ex, prevY, ey) : null;
        if(p && p.y < ey){ ey = p.y; vy = 0; onGround = true; }
        const onPlat = onGround && PLATFORMS.some(q =>
          Math.abs(ey - q.y) < 2 && ex > q.x1 - 24 && ex < q.x2 + 24);

        if(onGround) coyote = COYOTE; else if(coyote > 0) coyote--;

        eric.setAttribute('transform', `translate(${ex} ${ey}) scale(${face},1)`);

        if(onGround && !onPlat && lavaAt(ex)){ restart('HOT. Hot hot hot. Okay — again.'); return; }

        /* the water. Everything blue and low is deep. */
        if(onGround && !onPlat && ey > WATER_Y){
          restart('Straight into the water. He is not going that way.', true);
          return;
        }

        /* a rock coming down on any part of him, not just his head */
        for(const s of pos){
          const dx = Math.abs(s.x - ex);
          if(dx > s.r + 8) continue;     // leaves room to stand between two of them
          const nearestY = Math.max(ey - ERIC_H, Math.min(ey, s.y));   // his body, head to feet
          if(Math.abs(s.y - nearestY) < s.r + 4){
            restart('One of the rocks came straight down on him. Back to the door.'); return;
          }
        }

        if(onGround && Math.abs(ex - KEY_X) < 60){
          done = true;
          cleanup();
          SFX.great();
          (async ()=>{
            const gk = L.querySelector('#goalkey');
            gk.style.transition = 'transform .5s ease, opacity .5s ease';
            gk.style.opacity = '0';
            await UI.say('Got it. All the way across, and still in one piece.', 'Eric', 2200);
            await Chal.close(L);
            resolve(true);
          })();
        }
      }
      raf = requestAnimationFrame(tick);
    });
  }
  return { run };
})();
