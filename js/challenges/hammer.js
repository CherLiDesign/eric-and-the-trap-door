/* ============================================================
   CHALLENGE 4 — THE POUNDING MACHINE (the last key)
   Bolts pop up out of the machine. Hammer the glowing bolts.
   Hammer the villain's little brass bell by mistake and something
   embarrassing happens. Every good hit pulls the key further out
   of the machine's belly until it finally drops.
   ============================================================ */

const ChallengeHammer = (() => {
  const HOLES = [
    [520,470],[800,430],[1080,470],
    [520,690],[800,650],[1080,690],
  ];
  const NEED = 5;

  async function run(){
    const L = Chal.layer(); Chal.dim(L,.5);
    let hits = 0, misses = 0, live = [], running = true;

    L.insertAdjacentHTML('beforeend', `
      <g filter="url(#wobble2)">
        <path d="M280 300 q520 -70 1050 0 l50 560 q-560 70 -1150 0z" fill="#332c30" stroke="#1b1a22" stroke-width="8"/>
        <text x="800" y="366" text-anchor="middle" font-size="27" fill="#8b8272" font-family="inherit">PROPERTY OF THE MANAGEMENT</text>
      </g>
      <text id="tally" x="330" y="374" font-size="36" fill="#f3cd8a" font-family="inherit"
        stroke="#1b1a22" stroke-width="2" paint-order="stroke">BOLTS 0 / ${NEED}</text>
      <g id="holes">${HOLES.map((h,i)=>`<g transform="translate(${h[0]} ${h[1]})">
        <ellipse rx="82" ry="30" fill="#1a1620" stroke="#1b1a22" stroke-width="5"/>
        <g id="pop${i}" class="pop" style="cursor:pointer"></g></g>`).join('')}</g>
      <!-- the key hangs above the machine, but it falls PAST the holes, so it
           is drawn after them — otherwise a hole swallows it on the way down -->
      <g id="keywin" transform="translate(800 210)">
        <rect x="-90" y="-10" width="180" height="120" fill="#151420" stroke="#1b1a22" stroke-width="6"/>
        <g id="thekey" transform="translate(0 -70)" opacity=".25">${ART.key(120,'#e8d27a')}</g>
      </g>
      <g id="fx" style="pointer-events:none"></g>
      <g id="hammer" transform="translate(1400 760)" style="pointer-events:none">
        <g id="hammerG" style="transform-origin:0px 0px">
        <ellipse cy="6" rx="70" ry="16" fill="#000" opacity=".22"/>
        <rect x="-14" y="-150" width="28" height="150" fill="#7a5a34" stroke="#1b1a22" stroke-width="5"/>
        <rect x="-64" y="-196" width="128" height="60" rx="10" fill="#6b6455" stroke="#1b1a22" stroke-width="5"/>
        <rect x="-64" y="-196" width="128" height="18" rx="9" fill="#8b8578" opacity=".7"/></g></g>
      <rect id="catch" width="1600" height="900" fill="transparent" style="pointer-events:none"/>`);
    L.style.cursor = 'none';

    const hammer = L.querySelector('#hammer'), hg = L.querySelector('#hammerG');
    const at = e => { const r = L.getBoundingClientRect();
      return [((e.clientX-r.left)/r.width)*1600, ((e.clientY-r.top)/r.height)*900]; };
    L.addEventListener('pointermove', e=>{
      const [x,y] = at(e);
      hammer.setAttribute('transform', `translate(${x} ${y+70})`);
    });
    /* a real swing: wind up and back, then SLAM down past level, then settle.
       resolves the moment the head lands, so hits/sparks/shake all fire together */
    let swinging = null;
    function swing(){
      if(swinging) return swinging;          // one swing at a time — a click on a
      return swinging = new Promise(done=>{  // bolt and the catch-all share it

        hg.animate([
          { transform:'rotate(-18deg)' },        // rest, cocked a little
          { transform:'rotate(-74deg)', offset:.34 },  // wind up, slow
          { transform:'rotate(14deg)',  offset:.5  },  // SLAM
          { transform:'rotate(6deg)',   offset:.62 },  // bounce off the metal
          { transform:'rotate(-18deg)' },              // back to rest
        ], { duration:340, easing:'ease-in-out', fill:'both' });
        setTimeout(done, 170);                       // impact frame
        setTimeout(()=>{ swinging = null; }, 340);   // ready again
      });
    }
    hg.style.transform = 'rotate(-18deg)';

    /* the bit you feel: dust ring, sparks, and the whole machine jolting */
    const fx = L.querySelector('#fx');
    function impact(x, y, bad){
      const c = bad ? '#e8c46a' : '#f3cd8a';
      const spark = [...Array(7)].map((_,k)=>{
        const a = -Math.PI + (k/6)*Math.PI, len = 34 + (k%3)*22;
        return `<line x1="0" y1="0" x2="${Math.cos(a)*len}" y2="${Math.sin(a)*len*.7}"
                  stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
      }).join('');
      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('transform', `translate(${x} ${y})`);
      g.innerHTML = `<ellipse rx="30" ry="11" fill="none" stroke="#cfc3a4" stroke-width="6" opacity=".8"/>
                     <g>${spark}</g>`;
      fx.appendChild(g);
      g.animate([{ transform:'scale(.4)', opacity:1 },{ transform:'scale(2.3)', opacity:0 }],
                { duration:320, easing:'ease-out' });
      setTimeout(()=>g.remove(), 330);
      // the whole room takes the blow — hard jolt, then rattle out
      L.animate([
        { transform:'translate(0px,0px)' },
        { transform:'translate(-9px,14px) rotate(.5deg)', offset:.12 },
        { transform:'translate(11px,-8px) rotate(-.4deg)', offset:.3 },
        { transform:'translate(-7px,6px)', offset:.5 },
        { transform:'translate(4px,-3px)', offset:.7 },
        { transform:'translate(0px,0px)' },
      ], { duration:330, easing:'ease-out' });
    }

    // swinging at nothing still swings — the hammer always answers
    /* you do not have to hit the bolt itself — anywhere near it counts.
       nearest live bolt inside REACH wins; otherwise it is just a swing at the floor */
    const REACH = 190, pending = {};   // hole index → "hit me"
    L.addEventListener('pointerdown', e=>{
      const [x,y] = at(e);
      let best = null, bestD = REACH*REACH;
      for(const i of live){
        const dx = x - HOLES[i][0], dy = (y - (HOLES[i][1]-30)) * 1.15;   // holes are wide, not tall
        const d = dx*dx + dy*dy;
        if(d < bestD){ bestD = d; best = i; }
      }
      if(best !== null && pending[best]) pending[best]();
      else { swing(); SFX.hammer(); }
    });

    const tally = L.querySelector('#tally');
    function showTally(){
      tally.textContent = `BOLTS ${hits} / ${NEED}`;
      tally.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],
                    {duration:260, easing:'ease-out'});
    }
    tally.style.transformOrigin = "330px 374px";

    await Chal.hint(`Hammer ${NEED} green bolts to shake the key loose. Not the bell.`);

    return new Promise(resolve=>{
      const spawn = ()=>{
        if(!running) return;
        const free = HOLES.map((_,i)=>i).filter(i=>!live.includes(i));
        if(free.length){
          const i = free[Math.floor(Math.random()*free.length)];
          const bell = Math.random() < .26;
          live.push(i);
          const g = L.querySelector('#pop'+i);
          g.innerHTML = bell
            ? `<g class="bad"><path d="M-34 6 q0 -52 34 -52 q34 0 34 52z" fill="#a8862c" stroke="#1b1a22" stroke-width="5"/>
                 <ellipse cy="8" rx="42" ry="10" fill="#c9a13c" stroke="#1b1a22" stroke-width="4"/></g>`
            : `<g class="good"><rect x="-28" y="-64" width="56" height="70" rx="8" fill="#7d8a5a" stroke="#1b1a22" stroke-width="5"/>
                 <circle cy="-64" r="27" fill="#a9c47a" stroke="#1b1a22" stroke-width="5"/>
                 <circle cy="-64" r="10" fill="#f3cd8a"/></g>`;
          g.style.transformOrigin='center'; g.style.transform='translateY(60px)'; g.style.opacity='0';
          g.style.transition='transform .18s cubic-bezier(.3,1.5,.5,1), opacity .12s';
          requestAnimationFrame(()=>{ g.style.transform='translateY(0)'; g.style.opacity='1'; });
          pending[i] = ()=>strike(i, bell, g);
          const dwell = Math.max(900, 1700 - hits*70);
          setTimeout(()=>{ if(live.includes(i)) retract(i,g); }, dwell);
        }
        setTimeout(spawn, Math.max(320, 900 - hits*45));
      };
      function retract(i,g){
        live = live.filter(v=>v!==i); delete pending[i];
        g.style.transform='translateY(60px)'; g.style.opacity='0';
        setTimeout(()=>{ if(!live.includes(i)) g.innerHTML=''; }, 200);
      }
      async function strike(i, bell, g){
        if(!running || !live.includes(i)) return;
        live = live.filter(v=>v!==i);           // claimed — but it stays up until the head lands
        delete pending[i];
        await swing();                          // the hit happens when the hammer arrives
        SFX.hammer();
        impact(HOLES[i][0], HOLES[i][1]-30, bell);
        // driven straight back down the hole: squashed flat from the top, knocked askew
        g.style.transformOrigin = '0px 0px';
        g.style.transition = 'none';
        g.animate([
          { transform:'translateY(0) scale(1,1)' },
          { transform:'translateY(6px) scale(1.5,.18) rotate(-4deg)', offset:.22 },  // FLAT
          { transform:'translateY(16px) scale(1.2,.4) rotate(3deg)',  offset:.45 },  // half-rebound
          { transform:'translateY(70px) scale(.9,.25)', opacity:0 },                 // gone down the hole
        ], { duration:260, easing:'ease-out', fill:'forwards' });
        setTimeout(()=>{ if(!live.includes(i)){ g.innerHTML=''; g.getAnimations().forEach(a=>a.cancel());
          g.style.transformOrigin='center'; g.style.opacity='0'; } }, 280);
        if(bell){
          misses++;
          SFX.boing();
          const t = document.createElementNS('http://www.w3.org/2000/svg','g');
          const gags = ['DONG.','ding-a-ling!','...BONG.','a-ding!'];
          t.innerHTML = `<text x="${HOLES[i][0]}" y="${HOLES[i][1]-120}" text-anchor="middle" font-size="42"
             fill="#e8c46a" font-family="inherit" transform="rotate(-6 ${HOLES[i][0]} ${HOLES[i][1]-120})">${gags[misses%4]}</text>`;
          L.appendChild(t); Chal.shake(L.querySelector('#holes'));
          setTimeout(()=>t.remove(), 900);
          if(misses % 2 === 0){
            SFX.snore();
            const s = document.createElementNS('http://www.w3.org/2000/svg','g');
            s.innerHTML = `<g transform="translate(190 880) scale(.55)">${ART.villain('tall','sleep',300)}</g>`;
            s.style.opacity='0'; s.style.transition='opacity .4s'; L.appendChild(s);
            requestAnimationFrame(()=>s.style.opacity='1');
            await UI.say('Somebody in the next room mutters and turns over.', null, 1700);
            setTimeout(()=>{ s.style.opacity='0'; setTimeout(()=>s.remove(),400); }, 1400);
          }
          return;
        }
        hits++;
        showTally();
        SFX.metal();
        const key = L.querySelector('#thekey');
        const p = hits/NEED;
        key.style.transition='translate .35s cubic-bezier(.3,1.4,.5,1), rotate .35s ease, opacity .3s';
        key.setAttribute('opacity', String(.25 + p*.75));
        key.style.translate = `0 ${p*46}px`; key.style.rotate = `${p*20}deg`;
        if(hits >= NEED){
          running = false;
          await UI.wait(450);
          SFX.gear(); SFX.keydrop();
          key.style.transition='translate 1s cubic-bezier(.4,.1,.6,1), rotate 1s ease-in';
          key.style.translate='0 560px'; key.style.rotate='400deg';
          await UI.wait(1000);
          SFX.metal();
          await UI.say('The machine coughs the last key onto the floor.', null, 2400);
          await UI.say('It is bigger than his whole hand.', 'Eric', 2200);
          await Chal.close(L);
          resolve(true);
        }
      }
      spawn();
    });
  }
  return { run };
})();
