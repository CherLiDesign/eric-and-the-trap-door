/* ============================================================
   ASSET OVERRIDE SYSTEM
   ------------------------------------------------------------
   Supplied artwork is the source of truth. Every drawn element in
   this game asks ASSETS.has(key) first; if a real PNG has been
   dropped into /assets and registered below, it is used instead of
   the procedural placeholder drawing.

   To add real artwork for a scene:
     1. Drop the file in assets/<folder>/<name>.png  (transparent PNG)
     2. Add a line to MANIFEST below:  'eric.idle': 'characters/eric-idle.png'
     3. Reload. Nothing else changes — placement, animation, scale,
        map state and story flow all stay identical.

   Sprite sheets: give an object instead of a string —
     'eric.walk': { src:'characters/eric-walk.png', frames:6, fps:10 }
   ============================================================ */

const ASSETS = (() => {
  const MANIFEST = {
    // ---- CHARACTERS (transparent PNGs, feet at bottom edge) ----
    // Eric has one portrait; every mood points at it until moods are drawn.
    'eric.idle'      : 'characters/eric.png',
    'eric.worried'   : 'characters/eric.png',
    'eric.happy'     : 'characters/eric.png',
    'mom'            : 'characters/mom.png',
    'dad'            : 'characters/dad.png',
    'milo'           : 'characters/alex.png',      // the big brother — Alex
    'junie'          : 'characters/amy.png',       // the little sister — Amy
    'villain.tall'   : 'characters/heckater.png',
    'villain.round'  : 'characters/Stubby.png',
    'villain.boss'   : 'characters/ringleader.png',

    // ---- ENVIRONMENTS (full-bleed 1600x900 illustrations) ----
    'bg.cover'       : 'environments/jail.png',    // the title screen painting
    // 'bg.bedroom'     : 'environments/bedroom-night.png',
    // 'bg.hall'        : 'environments/hallway.png',
    // 'bg.cages'       : 'environments/cage-room.png',

    // ---- MEMORY CARDS (the picture door) ----
    // Drop the drawings in as PNG/JPG and uncomment. Card art is drawn
    // into a 124x172 box; the back fills the whole 144x192 card.
    // 'card.flower'    : 'props/cards/flower.png',
    // 'card.fish'      : 'props/cards/fish.png',
    // 'card.volcano'   : 'props/cards/volcano.png',
    // 'card.book'      : 'props/cards/book.png',
    // 'card.joker'     : 'props/cards/joker.png',
    // 'card.back'      : 'props/cards/back.png',

    // ---- PROPS / UI ----
    // 'prop.key'       : 'props/key.png',
    // 'ui.map'         : 'ui/folded-map.png',
  };

  const cache = {};
  const base = 'assets/';

  function entry(key){ return MANIFEST[key]; }
  function has(key){ return !!MANIFEST[key]; }
  function src(key){
    const e = entry(key); if(!e) return null;
    return base + (typeof e === 'string' ? e : e.src);
  }
  /** Returns an <image> SVG string sized into box {x,y,w,h}, or null. */
  function svgImage(key, x, y, w, h, extra){
    const s = src(key); if(!s) return null;
    return `<image href="${s}" x="${x}" y="${y}" width="${w}" height="${h}"
            preserveAspectRatio="xMidYMax meet" ${extra||''}/>`;
  }
  function preload(){
    Object.keys(MANIFEST).forEach(k=>{
      const s = src(k); if(!s || cache[k]) return;
      const i = new Image(); i.src = s; cache[k] = i;
    });
  }
  return { has, src, svgImage, preload, MANIFEST };
})();
