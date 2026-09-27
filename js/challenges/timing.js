/* ============================================================
   SHARED CHALLENGE PLUMBING + CHALLENGE 1 — THE PRESSURE METER
   A machine in the Boiler Room. Stop the needle in the green.
   Three good stops and the gears turn the corridor door open.
   ============================================================ */

const Chal = {
  /* an SVG layer over the room; the room stays visible behind it */
  layer(){
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('class','chal-layer');
    s.setAttribute('viewBox','0 0 1600 900');
    s.setAttribute('preserveAspectRatio','xMidYMid meet');
    document.getElementById('scene').appendChild(s);
    return s;
  },
  dim(el, o=.62){
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('width','1600'); r.setAttribute('height','900');
    r.setAttribute('fill','#07060a'); r.setAttribute('opacity','0');
    el.appendChild(r);
    requestAnimationFrame(()=>{ r.style.transition='opacity .5s ease'; r.setAttribute('opacity',o); });
    return r;
  },
  async close(el){ el.style.transition='opacity .45s ease'; el.style.opacity='0'; await UI.wait(460); el.remove(); },
  shake(el){ el.classList.add('shake'); setTimeout(()=>el.classList.remove('shake'), 340); },
  /* a small "Eric leans in" line — teaching by showing, never a paragraph */
  hint(text){ return UI.say(text, null, 2200); },
};

const ChallengeTiming = (() => {
  async function run(){
    const L = Chal.layer(); Chal.dim(L, .55);
    let stopped = false, wins = 0, raf = null;
    const NEED = 3;

    const zoneW = () => 150 - wins*26;            // gets a little tighter, never unfair
    let pos = 0, dir = 1, speed = 7.5;
    let zoneX = 725;

    L.insertAdjacentHTML('beforeend', `
      <g id="machine" transform="translate(800 470)" filter="url(#wobble2)">
        <path d="M-470 -240 q470 -60 940 0 l30 470 q-500 70 -1000 0z" fill="#2f2a30" stroke="#1b1a22" stroke-width="7"/>
        <rect x="-400" y="-140" width="800" height="120" rx="16" fill="#161520" stroke="#1b1a22" stroke-width="6"/>
        <g id="zone"></g>
        <g id="needle"><rect x="-7" y="-152" width="14" height="144" fill="#d8503f" stroke="#1b1a22" stroke-width="4"/>
          <circle cx="0" cy="-152" r="12" fill="#f3cd8a" stroke="#1b1a22" stroke-width="4"/></g>
        ${[0,1,2].map(i=>`<g id="bulb${i}"><circle cx="${-120+i*120}" cy="90" r="34" fill="#3a3340" stroke="#1b1a22" stroke-width="5"/></g>`).join('')}
        <g id="gears">
          <g transform="translate(-330,110)"><circle r="56" fill="none" stroke="#7a7268" stroke-width="14" stroke-dasharray="14 12"/><circle r="16" fill="#7a7268"/></g>
          <g transform="translate(330,110)"><circle r="42" fill="none" stroke="#7a7268" stroke-width="12" stroke-dasharray="12 10"/><circle r="13" fill="#7a7268"/></g>
        </g>
        <text y="196" text-anchor="middle" font-size="26" fill="#8b8272" font-family="inherit">PRESSURE — DO NOT LET IT DROP</text>
      </g>
      <g id="tapzone"><rect width="1600" height="900" fill="transparent" style="cursor:pointer"/></g>`);

    const needle = L.querySelector('#needle');
    const zoneG  = L.querySelector('#zone');

    function placeZone(){
      const w = zoneW();
      zoneX = -360 + Math.random()*(720 - w);
      zoneG.innerHTML = `<rect x="${zoneX}" y="-138" width="${w}" height="116" fill="#6b8a4a" opacity=".55"/>
        <rect x="${zoneX}" y="-138" width="${w}" height="116" fill="none" stroke="#a9c47a" stroke-width="4"/>`;
    }
    placeZone();

    let last = performance.now(), tickAcc = 0;
    function frame(t){
      const dt = Math.min(40, t-last); last = t;
      if(!stopped){
        pos += dir*speed*(dt/16);
        if(pos > 380){ pos = 380; dir = -1; }
        if(pos < -380){ pos = -380; dir = 1; }
        needle.setAttribute('transform', `translate(${pos} 0)`);
        tickAcc += dt; if(tickAcc > 110){ tickAcc = 0; SFX.tick(); }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    await Chal.hint('Stop it in the green.');

    return new Promise(resolve=>{
      L.querySelector('#tapzone').addEventListener('click', tryStop);
      const keyer = e => { if(e.code==='Space' || e.code==='Enter'){ e.preventDefault(); tryStop(); } };
      window.addEventListener('keydown', keyer);

      async function tryStop(){
        if(stopped) return;
        stopped = true;
        const w = zoneW();
        const hit = pos > zoneX && pos < zoneX + w;
        const machine = L.querySelector('#machine');
        if(hit){
          SFX.metal(); SFX.gear();
          wins++;
          const bulb = L.querySelector('#bulb'+(wins-1)+' circle');
          bulb.setAttribute('fill','#f3cd8a'); bulb.parentElement.classList.add('pulse-good');
          L.querySelector('#gears').style.transition='transform .6s ease';
          L.querySelector('#gears').style.transform = `rotate(${wins*40}deg)`;
          machine.classList.add('pulse-good');
          setTimeout(()=>machine.classList.remove('pulse-good'), 620);
          if(wins >= NEED){
            cancelAnimationFrame(raf);
            window.removeEventListener('keydown', keyer);
            SFX.great();
            await UI.wait(500);
            // the world reacts: the machine wakes up, and a key drops out of it
            L.insertAdjacentHTML('beforeend',
              `<g id="drop" transform="translate(800 660)" opacity="0">${ART.key(90,'#d9b64a')}</g>`);
            const drop = L.querySelector('#drop');
            // independent translate/rotate so the group's own transform survives
            drop.style.transition = 'translate .8s cubic-bezier(.3,1.4,.5,1), rotate .8s ease, opacity .3s';
            requestAnimationFrame(()=>{ drop.setAttribute('opacity','1');
              drop.style.translate = '0 120px'; drop.style.rotate = '220deg'; });
            SFX.keydrop();
            await UI.say('The whole room shakes. Something heavy slides open, far away.', null, 2600);
            await UI.say('A key. Warm from the machine.', 'Eric', 2200);
            await Chal.close(L);
            resolve(true);
            return;
          }
          await UI.say(['Good.','Again.','One more.'][wins-1] , null, 1200);
        } else {
          SFX.oops(); Chal.shake(machine);
          const s = document.createElementNS('http://www.w3.org/2000/svg','g');
          s.innerHTML = `<text x="800" y="300" text-anchor="middle" font-size="34" fill="#d8503f" font-family="inherit">pfffft</text>`;
          L.appendChild(s); setTimeout(()=>s.remove(), 800);
        }
        await UI.wait(650);
        placeZone();
        speed = 6.6 + wins*1.1;
        dir = Math.random()<.5?1:-1;
        stopped = false;
      }
    });
  }
  return { run };
})();
