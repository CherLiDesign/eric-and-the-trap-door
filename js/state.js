/* ============================================================
   STATE — one continuous journey. Everything the map, the HUD and
   the fast-travel rules read lives here.
   ============================================================ */

/* Where each of them ended up. Alex is the first one Eric finds — the
   brother who laughed at him — and he is sharing the cage room with a
   complete stranger nobody has bothered to explain. */
const FAMILY = {
  milo:  { name:'Alex',  note:'Didn\'t believe him either.', room:'cages',
           line:'Okay. Okay. You are officially the best brother.' },
  mom:   { name:'Mom',   note:'She left the kitchen light on.', room:'deep',
           line:'Oh, my brave boy. Oh, my brave, brave boy.' },
  dad:   { name:'Dad',   note:'"Go back to sleep, Eric."', room:'workshop',
           line:'You were right. You were right the whole time.' },
  junie: { name:'Amy',   note:'Took her drawing with her.', room:'vault',
           line:'I drew you a map too! Mine has a dragon.' },
};

/* not family — just some poor man who has been down here a while */
const STRANGER = {
  name:'Mr. Pockets',
  lines:[
    'Oh! Hello. I am the man who reads the water meter. I have been here since Tuesday.',
    'They took my sandwiches. They took my BICYCLE. I have made my peace with the bicycle.',
    'Your door, by the way, is not locked. Mine is. Life is like that.',
  ],
};

const ROOMS = {
  // ---- above ground ----
  bedroom:  { name:'My Room',        hand:'where it started', x:112, y:96,  amb:'night',  area:'house' },
  hallway:  { name:'Upstairs Hall',  hand:'creaky board!!',   x:268, y:96,  amb:'night',  area:'house' },
  parents:  { name:'Mom + Dad',      hand:'empty now',        x:424, y:78,  amb:'night',  area:'house' },
  sibs:     { name:'Alex + Amy',   hand:'empty now',        x:424, y:170, amb:'night',  area:'house' },
  kitchen:  { name:'Kitchen',        hand:'breakfast left out',x:112, y:214, amb:'house', area:'house' },
  basement: { name:'Basement',       hand:'I hid here',       x:112, y:322, amb:'night',  area:'house' },
  yard:     { name:'Back Yard',      hand:'footprints ->',    x:268, y:322, amb:'outside',area:'house' },
  trap:     { name:'The Trap Door',  hand:'under the leaves', x:424, y:322, amb:'outside',area:'house' },
  // ---- the secret base ----
  ladderroom:{name:'Bottom of Ladder',hand:'way out',         x:604, y:322, amb:'base',   area:'base' },
  corridor: { name:'Crooked Corridor',hand:'bends wrong',     x:604, y:214, amb:'base',   area:'base' },
  boiler:   { name:'Boiler Room',    hand:'the big meter',    x:604, y:110, amb:'base',   area:'base' },
  cages:    { name:'The Cage Room',  hand:'THEY ARE HERE',    x:790, y:214, amb:'base',   area:'base' },
  vault:    { name:'Card Door',      hand:'picture locks',    x:790, y:110, amb:'base',   area:'base' },
  workshop: { name:'Crate Workshop', hand:'dont step there',  x:960, y:110, amb:'base',   area:'base' },
  deep:     { name:'The Deep Works', hand:'?? ?? ??',         x:960, y:250, amb:'deep',   area:'base' },
};

const State = {
  data: null,

  fresh(){
    return {
      chapter: 'title',
      at: 'bedroom',
      // Eric already knows his own house — it is drawn on his map from the
      // first night. Everything under the ground he has to find himself.
      discovered: ['bedroom','hallway','parents','sibs','kitchen','basement'],
      rescued: [],
      found: [],                 // family members seen but not yet freed
      keys: [],                  // 'boiler','vault','workshop','final'
      challenges: {},            // completed challenge ids
      flags: {},                 // story beats
      night: false,              // night-rescue phase (changes lighting + ambience)
      mapSeen: false,
    };
  },
  load(){
    try{ const raw = localStorage.getItem('eric-trapdoor'); if(raw) this.data = JSON.parse(raw); }catch(e){}
    if(!this.data) this.data = this.fresh();
    return this.data;
  },
  save(){ try{ localStorage.setItem('eric-trapdoor', JSON.stringify(this.data)); }catch(e){} },
  reset(){ this.data = this.fresh(); this.save(); },

  get(k){ return this.data[k]; },
  flag(k, v){ if(v===undefined) return !!this.data.flags[k]; this.data.flags[k]=v; this.save(); },

  discover(room){
    if(this.data.discovered.includes(room)) return false;
    this.data.discovered.push(room); this.save();
    return true;                                  // true => map draws it in
  },
  isDiscovered(r){ return this.data.discovered.includes(r); },

  findFamily(who){
    if(this.data.found.includes(who) || this.data.rescued.includes(who)) return false;
    this.data.found.push(who); this.save(); return true;
  },
  rescue(who){
    if(this.data.rescued.includes(who)) return false;
    this.data.rescued.push(who);
    this.data.found = this.data.found.filter(f=>f!==who);
    this.save(); return true;
  },
  isRescued(w){ return this.data.rescued.includes(w); },
  isFound(w){ return this.data.found.includes(w); },
  allRescued(){ return Object.keys(FAMILY).every(w=>this.data.rescued.includes(w)); },

  addKey(k){ if(!this.data.keys.includes(k)){ this.data.keys.push(k); this.save(); } },
  hasKey(k){ return this.data.keys.includes(k); },

  finishChallenge(id){ this.data.challenges[id]=true; this.save(); },
  didChallenge(id){ return !!this.data.challenges[id]; },

  goto(room){ this.data.at = room; this.save(); },

  /* ---- fast travel rules ----
     1 discovered  2 currently safe  3 never skips story
     Rescues have no order: any room Eric has actually stood in, he can go
     back to, so he can start with Dad, or Mom, or whoever he likes. */
  canTravel(room){
    const d = this.data;
    if(room === d.at) return false;
    if(!this.isDiscovered(room)) return false;
    if(d.chapter === 'escape') return false;            // no wandering during the escape
    if(!d.night && ROOMS[room].area === 'base') return false;  // base is only re-enterable at night
    if(d.night && ROOMS[room].area === 'house' && room !== 'yard' && room !== 'trap') return false;
    return true;
  },
};
