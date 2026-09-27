/* ============================================================
   OPENING A CAGE — the keyhole game
   The padlock hangs above a long slider. A red marker runs back and
   forth along it; somewhere on the bar is the notch the key sits in.
      1. the marker sweeps left and right, faster every time
      2. stop it inside the notch — one tumbler falls into place
      3. a miss knocks a tumbler loose again
      4. four tumblers and the shackle springs. CLUNK.
   The notch jumps somewhere new and shrinks after every hit, so the
   last one is the hard one. Missing is loud, harmless, funny.
   ============================================================ */

const LockGame = (() => {

  const BAR = { x: 150, y: 560, w: 1300, h: 150 };   // the slider, per the sketch
  const NEED = 4;                                    // tumblers to seat

  function run(who, keyColour){
    return new Promise(async resolve=>{
      const L = Chal.layer(); Chal.dim(L, .66);

      let seated = 0, pos = BAR.x + 40, dir = 1, speed = 6.5;
      let zoneX = 0, zoneW = 0;
      let busy = false, raf = null;

      L.insertAdjacentHTML('beforeend', `
        <!-- the padlock, sitting on top of the bar -->
        <g id="lockbody" transform="translate(800 400)" filter="url(#wobble2)">
          <path id="shackle" d="M-70 -40 q0 -112 70 -112 q70 0 70 112"
                fill="none" stroke="#2b2830" stroke-width="42" stroke-linecap="round"/>
          <path d="M-150 -44 h300 q30 0 30 34 v150 q0 34 -34 34 h-292 q-34 0 -34 -34 v-150 q0 -34 30 -34z"
                fill="#2b2830" stroke="#15141a" stroke-width="8"/>
          <g id="keyholecut" fill="#efe9dd">
            <circle cx="0" cy="52" r="30"/>
            <path d="M-13 66 L13 66 L22 138 L-22 138 Z"/>
          </g>
          <g id="litkey" opacity="0" transform="translate(0 92)">${ART.key(120, keyColour || '#d9b64a')}</g>
        </g>

        <!-- the four tumblers, cut into the underside of the lock -->
        <g id="tumblers">
          ${[0,1,2,3].map(i=>`<g transform="translate(${680+i*80} 300)">
            <rect id="tum${i}" x="-24" y="-17" width="48" height="34" rx="7"
                  fill="#3a3340" stroke="#15141a" stroke-width="5"/></g>`).join('')}
        </g>

        <!-- the slider bar -->
        <g id="barwrap" filter="url(#wobble)">
          <rect x="${BAR.x}" y="${BAR.y}" width="${BAR.w}" height="${BAR.h}"
                fill="#8b9aa2" stroke="#15141a" stroke-width="14"/>
          <g id="zone"></g>
          <g id="marker">
            <rect x="-26" y="${BAR.y - 12}" width="52" height="${BAR.h + 24}" fill="#15141a"/>
            <rect x="-15" y="${BAR.y - 2}" width="30" height="${BAR.h + 4}" fill="#d8503f"/>
          </g>
        </g>

        <text id="prompt" x="800" y="810" text-anchor="middle" font-size="30" fill="#efe4c9"
              font-family="inherit">stop the red line in the notch</text>
        <rect id="pad" width="1600" height="900" fill="transparent" style="cursor:pointer"/>`);

      const marker = L.querySelector('#marker');
      const zoneG  = L.querySelector('#zone');
      const prompt = L.querySelector('#prompt');
      const pad    = L.querySelector('#pad');
      const body   = L.querySelector('#lockbody');

      /* the notch: a pale gap in the bar, tighter every time it is hit */
      function placeZone(){
        zoneW = 190 - seated*34;
        do {
          zoneX = BAR.x + 30 + Math.random()*(BAR.w - 60 - zoneW);
        } while(Math.abs((zoneX + zoneW/2) - pos) < 260);   // never right under the marker
        zoneG.innerHTML =
          `<rect x="${zoneX}" y="${BAR.y}" width="${zoneW}" height="${BAR.h}" fill="#d8cfae"/>
           <rect x="${zoneX}" y="${BAR.y}" width="${zoneW}" height="${BAR.h}"
                 fill="none" stroke="#15141a" stroke-width="10"/>`;
      }
      placeZone();

      let last = performance.now(), tickAcc = 0;
      function frame(t){
        const dt = Math.min(40, t - last); last = t;
        if(!busy){
          pos += dir*speed*(dt/16);
          if(pos > BAR.x + BAR.w - 26){ pos = BAR.x + BAR.w - 26; dir = -1; }
          if(pos < BAR.x + 26){ pos = BAR.x + 26; dir = 1; }
          marker.setAttribute('transform', `translate(${pos} 0)`);
          tickAcc += dt; if(tickAcc > 140){ tickAcc = 0; SFX.tick(); }
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      async function tap(){
        if(busy) return;
        busy = true;
        if(pos > zoneX && pos < zoneX + zoneW){
          SFX.metal(); SFX.pin();
          const tum = L.querySelector('#tum'+seated);
          tum.setAttribute('fill','#f3cd8a');
          tum.parentElement.classList.add('pulse-good');
          seated++;
          if(seated >= NEED){ cancelAnimationFrame(raf); await open(); return; }
          prompt.textContent = ['one.','two.','one more — it is fighting you.'][seated-1];
          await UI.wait(520);
          speed = 6.5 + seated*2.4;             // the last tumbler is the hard one
          dir = Math.random() < .5 ? 1 : -1;
          placeZone();
        } else {
          SFX.oops(); Chal.shake(body);
          if(seated > 0){                        // a miss knocks one loose again
            seated--;
            const tum = L.querySelector('#tum'+seated);
            tum.setAttribute('fill','#3a3340');
            tum.parentElement.classList.remove('pulse-good');
          }
          const s = document.createElementNS('http://www.w3.org/2000/svg','g');
          s.innerHTML = `<text x="800" y="750" text-anchor="middle" font-size="34" fill="#d8503f" font-family="inherit">clack</text>`;
          L.appendChild(s); setTimeout(()=>s.remove(), 800);
          prompt.textContent = 'not there. wait for it.';
          await UI.wait(560);
          speed = Math.max(6, speed - 1.4);
          placeZone();
        }
        busy = false;
      }

      const keyer = e => { if(e.code==='Space' || e.code==='Enter'){ e.preventDefault(); tap(); } };

      async function open(){
        window.removeEventListener('keydown', keyer);
        pad.style.pointerEvents = 'none';
        prompt.textContent = '';
        SFX.lockOpen();
        // the key finally sits in the hole, and the shackle lets go
        const lit = L.querySelector('#litkey');
        lit.style.transition = 'opacity .3s ease';
        lit.setAttribute('opacity','1');
        const shackle = L.querySelector('#shackle');
        shackle.style.transition = 'translate .5s cubic-bezier(.3,1.6,.5,1), rotate .5s ease';
        shackle.style.translate = '-26px -40px';
        shackle.style.rotate = '-24deg';
        body.classList.add('pulse-good');
        SFX.great();
        await UI.wait(640);
        SFX.cageOpen();
        L.style.transition = 'opacity .5s ease, scale .5s ease';
        L.style.opacity = '0'; L.style.scale = '1.12';
        await UI.wait(520);
        L.remove();
        resolve(true);
      }

      pad.addEventListener('click', tap);
      window.addEventListener('keydown', keyer);

      await UI.say(FAMILY[who]
        ? `${FAMILY[who].name}’s lock. Four tumblers, and they will not hold still.`
        : 'Four tumblers, and they will not hold still.', null, 2600);
    });
  }
  return { run };
})();
