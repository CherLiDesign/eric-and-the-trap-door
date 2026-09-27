/* ============================================================
   STORY — one continuous journey, told through the rooms.
   Chapters:  night1 → morning → firstvisit → home → night → escape → end
   ============================================================ */

const Story = (() => {
  const F = (k,v)=>State.flag(k,v);
  const ch = () => State.data.chapter;
  const setCh = c => { State.data.chapter = c; State.save(); };

  /* one cage, drawn according to who is in it and whether they are out yet */
  function cageArt(who, x, y, w, h){
    if(State.isRescued(who))
      return `<g transform="translate(${x} ${y})">${ART.cage(w,h,null,true)}</g>
              <text x="${x}" y="${y-h-40}" text-anchor="middle" font-size="22" fill="#6b8a4a" font-family="inherit">${FAMILY[who].name} — out</text>`;
    return `<g transform="translate(${x} ${y})">${ART.cage(w,h,who,false)}</g>
            <text x="${x}" y="${y-h-40}" text-anchor="middle" font-size="24" fill="#cfc3a4" font-family="inherit">${FAMILY[who].name}</text>`;
  }

  /* ---------------- props the chapters add to rooms ---------------- */
  const decorate = {
    parents: () => (ch()==='night1')
      ? `<g transform="translate(430 470) scale(.62)">${ART.family('mom',196)}</g>
         <g transform="translate(690 470) scale(.62)">${ART.family('dad',210)}</g>`
      : '',
    sibs: () => (ch()==='night1')
      ? `<g transform="translate(380 470) scale(.6)">${ART.family('milo',168)}</g>
         <g transform="translate(950 710) scale(.6)">${ART.family('junie',138)}</g>`
      : '',
    kitchen: () => (ch()==='morning')
      ? `<g transform="translate(1050 720)"><path d="M-40 0 q40 -70 80 0z" fill="#3b3a44" stroke="#1b1a22" stroke-width="4"/></g>`: '',
    trap: () => '',

    /* the cage room: Alex, and a total stranger in the next cage along */
    cages: () => {
      let g = cageArt('milo', 560, 790, 250, 330);
      // Mr Pockets — his cage door is not even locked. He has not noticed.
      g += `<g transform="translate(1120 790)">
              <g transform="translate(-10 -6)">${ART.family('stranger',238)}</g>
              ${ART.cage(250,330,null,false,false)}
            </g>
            <text x="1120" y="470" text-anchor="middle" font-size="22" fill="#8b8272" font-family="inherit">?</text>`;
      // the sleepers lie in the gaps between the cages, fully in frame
      if(ch()==='firstvisit'){
        g += `<g transform="translate(880 800)">${ART.villain('round','sleep',250)}</g>
              <g transform="translate(1360 800)">${ART.villain('tall','sleep',285)}</g>`;
      } else if(State.get('night')){
        g += `<g transform="translate(880 800)">${ART.villain('round','sleep',250)}</g>`;
      }
      return g;
    },
    vault:    () => World.R.vault    ? cageArt('junie', 560, 780, 250, 330) : '',
    workshop: () => cageArt('dad',    560, 800, 240, 320),
    deep:     () => cageArt('mom',    700, 800, 250, 330),
    boiler: () => State.didChallenge('timing')
      ? `<text x="690" y="250" text-anchor="middle" font-size="22" fill="#6b8a4a" font-family="inherit">(the meter is quiet now)</text>` : '',
  };

  /* ---------------- interactive things, per room, per chapter ------- */
  const spots = {
    bedroom: () => {
      const a = [];
      if(ch()==='night1' && !F('heardIt'))
        a.push({ x:975, y:700, w:200, h:400, label:'listen at the door', beckon:true, act: async ()=>{
          F('heardIt', true); SFX.creak();
          await UI.say('Feet. Quick ones. Going one way, then the other way.', null, 2600);
          await UI.say('That is not Dad walking.', 'Eric', 2000);
          await World.rebuild();
        }});
      return a;
    },

    parents: () => {
      if(ch()!=='night1' || F('warnedParents')) return [];
      return [{ x:560, y:710, w:420, h:300, label:'wake them up', beckon:true, act: async ()=>{
        SFX.creak();
        await UI.say('Someone is outside my door. Running. I heard them.', 'Eric', 2600);
        await UI.say('Mmm. It is the pipes, sweetheart. Houses are noisy.', 'Mom', 2600);
        await UI.say('Back to bed, Eric. It is the middle of the night.', 'Dad', 2600);
        F('warnedParents', true);
        await World.rebuild();
        await UI.say('It was not the pipes.', 'Eric', 1900);
        await bothIgnoredHim();
      }}];
    },

    sibs: () => {
      if(ch()!=='night1' || F('warnedSibs')) return [];
      return [{ x:520, y:710, w:420, h:300, label:'wake Alex and Amy', beckon:true, act: async ()=>{
        await UI.say('There is someone in the house. I am not making it up.', 'Eric', 2600);
        await UI.say('You are ALWAYS making it up. Go to sleep.', 'Alex', 2400);
        await UI.say('Is it a dragon? ...No? Then goodnight.', 'Amy', 2400);
        F('warnedSibs', true);
        await World.rebuild();
        await bothIgnoredHim();
      }}];
    },

    basement: () => {
      if(ch()!=='night1' || F('hid')) return [];
      return [{ x:1030, y:740, w:340, h:300, label:'hide behind the boxes', beckon:true, act: async ()=>{
        F('hid', true);
        await hideAndMorning();
      }}];
    },

    kitchen: () => {
      if(ch()!=='morning' || F('sawKitchen')) return [];
      return [{ x:300, y:720, w:260, h:240, label:'the table', beckon:true, act: async ()=>{
        F('sawKitchen', true); SFX.paper();
        await UI.note('The kitchen',
          'Four bowls. Nobody ate any of it.<br><br>Amy\'s spoon is still standing up in hers, the way she leaves it when she is called away in a hurry.',
          '(tap to put it back)');
        await UI.say('They did not leave. They were taken.', 'Eric', 2400);
        await World.rebuild();
      }}];
    },

    yard: () => {
      if(ch()!=='morning' || F('sawPrints')) return [];
      return [{ x:760, y:760, w:420, h:200, label:'the footprints', beckon:true, act: async ()=>{
        F('sawPrints', true); SFX.step();
        await UI.say('They go across the grass. Deep ones, like someone was carrying something heavy.', null, 3000);
        await UI.say('Four times. They came back four times.', 'Eric', 2400);
        GameMap.noteDraw('trap');
        await World.rebuild();
      }}];
    },

    trap: () => {
      const a = [];
      if(ch()==='morning' && !F('trapFound'))
        a.push({ x:760, y:780, w:340, h:200, label:'sweep the leaves away', beckon:true, act: async ()=>{
          await discoverTrapDoor();
        }});
      if(F('trapFound') && !F('trapOpen'))
        a.push({ x:760, y:780, w:340, h:200, label:'open it', beckon:true, act: async ()=>{
          await openTrapDoor();
        }});
      if(F('trapOpen'))
        a.push({ x:760, y:780, w:340, h:220, label:'climb down', beckon: ch()!=='morning' || true, act: async ()=>{
          SFX.creak();
          await UI.cinematic(true); await UI.wait(400);
          await UI.say('One rung. Then another. Then no more daylight.', null, 2400);
          UI.cinematic(false);
          await World.enter('ladderroom', {x:320});
        }});
      return a;
    },

    ladderroom: () => {
      const a = [];
      if(State.get('night') || ch()==='firstvisit' || ch()==='escape')
        a.push({ x:300, y:760, w:220, h:400, label:'climb back up', act: async ()=>{
          if(ch()==='firstvisit'){ await leaveBaseFirstTime(); return; }
          if(ch()==='escape'){ await finale(); return; }
          SFX.creak();
          await World.enter('trap', {x:760});
        }});
      return a;
    },

    boiler: () => {
      if(!State.get('night') || State.didChallenge('timing')) return [];
      return [{ x:690, y:780, w:520, h:420, label:'the big meter', beckon:true, act: async ()=>{
        const ok = await ChallengeTiming.run();
        if(!ok) return;
        State.finishChallenge('timing'); State.addKey('boiler');
        UI.refreshHud();
        GameMap.noteDraw('vault');
        State.discover('vault');
        await UI.say('Somewhere past the cages, a door with pictures on it has come alive.', null, 2800);
        await World.rebuild();
      }}];
    },

    vault: () => {
      const a = [];
      // Amy's cage IS the picture door — the card game opens it, no second puzzle here
      if(!State.isRescued('junie')) a.push(cageSpot('junie', 560, 'vault'));
      return a;
    },

    workshop: () => {
      const a = [];
      // getting to Dad IS the water crossing — no separate puzzle in this room
      if(!State.isRescued('dad'))
        a.push(cageSpot('dad', 560, 'workshop'));
      return a;
    },

    deep: () => {
      const a = [];
      // the pounding machine IS Mom's lock — no separate puzzle in this room
      if(!State.isRescued('mom'))
        a.push(cageSpot('mom', 700, 'deep'));
      return a;
    },

    cages: () => {
      const a = [];
      if(!State.isRescued('milo')) a.push(cageSpot('milo', 560, 'cages'));
      a.push({ x:1120, y:World.R.cages.ground, w:280, h:340, label:'the stranger', act: async ()=>{
        const n = (State.data.flags.pocketsTalk|0) % STRANGER.lines.length;
        State.flag('pocketsTalk', (n+1));
        SFX.click();
        await UI.say(STRANGER.lines[n], STRANGER.name, 3400);
        if(n===0) await UI.say('...Who ARE you?', 'Eric', 1900);
      }});
      return a;
    },
  };

  /* which key opens which cage — one per challenge, in the order you meet them */
  const KEY_FOR = { milo:'boiler', junie:'vault', dad:'workshop', mom:'final' };
  const KEYNAME = { boiler:'the warm key from the meter', vault:'the key off the picture door',
                    workshop:'the key from behind the secret wall', final:'the last key' };

  /* what each cage unlocks on the map once its lock is beaten — so the rooms
     beyond still open up in order, without sending Eric off to fetch a key first */
  const CAGE_OPENS = {
    milo:  { challenge:'timing', reveal:'vault'    },
    junie: { challenge:'memory', reveal:'workshop', game:'memory' },
    dad:   { challenge:'course', reveal:'deep', game:'course' },
    mom:   { challenge:'hammer', reveal:null, game:'hammer' },
  };

  function cageSpot(who, x, room){
    // wide enough that the padlock hanging off the cage door is inside the hit area
    const opens = CAGE_OPENS[who];
    // each cage has its own kind of lock — Amy's is the picture-card door
    const LABEL = { memory:'picture lock', course:'cage — across the water',
                    hammer:'cage — the pounding machine' };
    const label = `${FAMILY[who].name}'s ${(opens && LABEL[opens.game]) || 'lock'}`;
    return { x, y: World.R[room].ground, w:360, h:380, label, beckon:true,
      act: async ()=>{
        const need = KEY_FOR[who];
        // the game IS the lock — beat it and the key is yours
        const game = opens && opens.game;
        const opened = game==='memory' ? await ChallengeMemory.run()
                     : game==='course' ? await ChallengeCourse.run({passage:false})
                     : game==='hammer' ? await ChallengeHammer.run()
                     : await LockGame.run(who, need==='final' ? '#e8d27a' : '#d9b64a');
        if(!opened) return;
        if(game){ SFX.lockOpen(); await UI.wait(300); SFX.cageOpen(); }  // the lock game plays its own
        State.addKey(need);
        if(opens){
          if(!State.didChallenge(opens.challenge)) State.finishChallenge(opens.challenge);
          if(opens.reveal){ State.discover(opens.reveal); GameMap.noteDraw(opens.reveal); }
        }
        State.rescue(who);
        GameMap.noteRescue(who);
        await World.rebuild();
        SFX.hug();
        await UI.say(FAMILY[who].line, FAMILY[who].name, 3000);
        await UI.say('Shh. Not yet. Stay behind me.', 'Eric', 2200);
        UI.refreshHud();
        if(State.allRescued()) await startEscape();
        else await UI.say('(the map knows who is left)', null, 1800);
      }};
  }

  /* how many doors each room is from the ladder — used by the escape, which
     can now start from whichever cage Eric happened to open last */
  const TO_LADDER = { ladderroom:0, corridor:1, boiler:2, cages:2, deep:3, vault:3, workshop:4,
                      trap:0, yard:0, kitchen:0, basement:0, bedroom:0, hallway:0, parents:0, sibs:0 };

  /* ---------------- door rules per chapter ---------------- */
  function doorAllowed(from, to){
    const c = ch();
    const houseSide = ROOMS[to].area === 'house';
    if(c==='night1'){
      if(!houseSide) return false;
      if(to==='yard' || to==='trap') return false;
      if(to==='basement' && !(F('warnedParents') && F('warnedSibs'))) return false;
      return true;
    }
    if(c==='morning'){
      if(!houseSide) return false;
      return true;
    }
    if(c==='firstvisit'){
      // the whole base is walkable — each cage's own lock is the gate now
      return ROOMS[to].area === 'base';
    }
    if(c==='home'){ return houseSide; }
    if(c==='night'){
      if(houseSide) return to === 'trap';   // the only way back up is the ladder
      return true;
    }
    if(c==='escape'){
      // the last cage can be any of the four, so the way out is not one fixed
      // corridor — any door that gets them closer to the ladder is the way out
      return TO_LADDER[to] < TO_LADDER[from];
    }
    return true;
  }

  /* A door that is shut to Eric right now is still a door he can SEE and
     walk up to and touch — it just answers him. Only doors that belong to
     another chapter entirely are left out of the room. */
  function doorVisible(from, to){
    const c = ch();
    if(c==='night1' || c==='morning' || c==='home') return ROOMS[to].area === 'house';
    if(c==='firstvisit') return ROOMS[to].area === 'base';
    if(c==='night') return true;
    return false;   // during the escape, only the way out is drawn
  }

  function doorRefused(from, to){
    if(to==='basement') return 'Not yet. First somebody has to listen to me.';
    if(to==='yard')     return 'The front door is open a crack. I am not going out there in the dark.';
    if(to==='trap')     return 'Not in the dark. Not on my own.';
    if(ROOMS[to].area==='house' && State.get('night')) return 'No. Everyone I care about is down here.';
    return 'Not that way. Not now.';
  }

  /* Which doorway the story is pointing at right now. That door gets a
     warm pool of light and a slow bob — guidance without a tutorial. */
  function doorCalling(from, to){
    const c = ch();
    if(c==='night1'){
      if(!(F('warnedParents') && F('warnedSibs'))){
        if(from==='bedroom' && to==='hallway') return true;
        if(from==='hallway') return (to==='parents' && !F('warnedParents')) || (to==='sibs' && !F('warnedSibs'));
        return false;
      }
      // nobody believed him — every door now points at the basement
      if(from==='parents' || from==='sibs') return to==='hallway';
      if(from==='bedroom') return to==='hallway';
      if(from==='hallway') return to==='kitchen';
      if(from==='kitchen') return to==='basement';
      return false;
    }
    if(c==='morning'){
      if(!F('cameUpstairs')) return from==='basement' && to==='kitchen';
      if(!F('sawPrints'))    return from==='kitchen' && to==='yard' && F('sawKitchen');
      if(!F('trapOpen'))     return to==='trap';
      return false;
    }
    if(c==='firstvisit') return F('sawFamily') ? (to==='ladderroom' || to==='corridor') : (to==='corridor' || to==='cages');
    if(c==='escape') return true;
    return false;
  }

  async function beforeExit(from, to){
    if(ch()==='night1' && from==='hallway' && to==='kitchen' && !(F('warnedParents') && F('warnedSibs'))){
      // say exactly which door is left, and light it up
      const who = !F('warnedParents') ? 'Mom and Dad' : 'Alex and Amy';
      const door = !F('warnedParents') ? 'parents' : 'sibs';
      SFX.oops();
      await UI.say(`Wait. I have to tell ${who} first.`, 'Eric', 2400);
      await pointAtDoor(door);
      return false;
    }
    return true;
  }

  /* an unmissable nudge: the door swells with light and a hand-drawn
     arrow bounces over it for a few seconds */
  async function pointAtDoor(target){
    const svg = World.svg; if(!svg) return;
    const entry = (World.DOORS[World.room]||[]).find(d=>d[0]===target);
    if(!entry) return;
    const x = entry[1], y = World.R[World.room].ground;
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','beckon');
    g.setAttribute('style','pointer-events:none');
    g.innerHTML = `${ART.lamp(x, y-170, 300)}
      <g transform="translate(${x} ${y-380})">
        <path d="M0 -70 v96" stroke="#f3cd8a" stroke-width="9" stroke-linecap="round"/>
        <path d="M-24 0 L0 34 L24 0" stroke="#f3cd8a" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text y="-92" text-anchor="middle" font-size="27" fill="#f3cd8a" font-family="inherit">in here</text>
      </g>`;
    svg.appendChild(g);
    SFX.click();
    setTimeout(()=>{ g.style.transition='opacity .6s'; g.style.opacity='0'; setTimeout(()=>g.remove(),650); }, 3200);
  }

  /* ---------------- room entry beats ---------------- */
  async function onEnter(room, info){
    const c = ch();

    if(c==='night1'){
      if(room==='hallway' && !F('hallSeen')){ F('hallSeen',true);
        SFX.creak(); await UI.say('The hallway is longer at night. It always is.', null, 2400); }
      if(room==='basement' && !F('hid'))
        await UI.say('Down here it smells like coats and cold stone.', 'Eric', 2200);
      if(room==='kitchen' && !F('kitchNight')){ F('kitchNight',true);
        await UI.say('The front door is open. Just a little.', null, 2400);
        await UI.say('Not going out there. Going DOWN.', 'Eric', 2200); }
      return;
    }

    if(c==='morning'){
      if(room==='basement' && !F('mBase')){ F('mBase',true);
        await UI.say('The basement stairs. Up is the only way to find out.', null, 2600); }
      if(room==='kitchen' && !F('cameUpstairs')){ F('cameUpstairs',true);
        SFX.creak();
        await UI.say('Eric comes up the basement stairs one at a time, listening at every one.', null, 3200);
        await UI.say('Anybody? ...It is me. I am coming out now.', 'Eric', 3000);
        await UI.say('The house is empty. All of it. He can feel it from here.', null, 3000);
        State.discover('yard');
      }
      if(room==='parents' && !F('mEmpty1')){ F('mEmpty1',true); F('familyGone',true);
        await UI.say('Mom? ...Dad?', 'Eric', 1900);
        await UI.say('The bed is still warm.', null, 2200); }
      if(room==='sibs' && !F('mEmpty2')){ F('mEmpty2',true);
        await UI.say('Amy left her drawing behind. She never leaves her drawing behind.', 'Eric', 3000); }
      if(room==='yard' && !F('yardIn')){ F('yardIn',true);
        await UI.say('Cold morning. Nobody on the whole street.', null, 2400); }
      return;
    }

    if(c==='firstvisit'){
      if(room==='ladderroom' && info.firstTime){
        UI.cinematic(true);
        await UI.say('The ground has a downstairs.', 'Eric', 2400);
        await UI.say('Somebody built all of this under the garden.', null, 2600);
        UI.cinematic(false);
      }
      if(room==='corridor' && info.firstTime)
        await UI.say('The corridor bends the wrong way. Like it was drawn by somebody in a hurry.', null, 3000);
      if(room==='cages' && !F('sawFamily')) await seeFamily();
      return;
    }

    if(c==='night'){
      if(room==='ladderroom' && !F('nightIn')){ F('nightIn',true);
        await UI.say('Everything hums at night down here.', null, 2400);
        await UI.say('Four locks. Find four keys. Do not be seen.', 'Eric', 2600); }
      if(room==='vault' && !F('foundAmy')){ F('foundAmy',true);
        State.findFamily('junie'); GameMap.noteDraw('vault');
        SFX.heart();
        await UI.say('Amy! She is right here, behind the picture door.', 'Eric', 2800);
        await World.rebuild();
      }
      if(room==='workshop' && !F('foundDad')){ F('foundDad',true);
        State.findFamily('dad'); GameMap.noteDraw('workshop');
        await UI.say('Dad. In a crate cage, behind all this junk.', 'Eric', 2600);
        await World.rebuild();
      }
      if(room==='deep' && !F('foundMom')){ F('foundMom',true);
        State.findFamily('mom'); GameMap.noteDraw('deep');
        await UI.say('Mom is down here, in the dark, still trying to look calm for him.', null, 3000);
        await World.rebuild();
      }
      return;
    }

    if(c==='escape'){
      if(room==='ladderroom'){
        await UI.say('The ladder! Go, go, GO!', 'Eric', 2000);
      } else {
        await UI.say('Keep moving. Keep together.', 'Eric', 1500);
      }
    }
  }

  /* ---------------- long-form beats ---------------- */
  /* Nobody believed him. He is not going back to bed — he is going DOWN.
     This is the moment the basement becomes the goal. */
  async function bothIgnoredHim(){
    if(!(F('warnedParents') && F('warnedSibs')) || F('chosenBasement')) return;
    F('chosenBasement', true);
    await UI.say('Nobody believes me. Not one of them.', 'Eric', 2600);
    await UI.say('I am not going back to bed.', 'Eric', 2200);
    SFX.heart();
    await UI.say('Down. Through the kitchen, past the pantry, down to the basement — where nobody ever looks.', null, 3400);
  }

  /* The night in the basement. Eric hides, the house empties above him,
     and in the morning he wakes up down here and has to climb the stairs
     himself — the first thing the player does on day two. */
  async function hideAndMorning(){
    UI.cinematic(true);
    await UI.say('Eric folds himself in behind the boxes and makes himself very small.', null, 3000);
    await UI.fadeOut(true);
    SFX.stopAmb();
    await UI.say('Above him: footsteps. Heavy ones. Furniture moving.', null, 3000);
    SFX.creak();
    await UI.say('Something bumps down the hall. Somebody says a word he does not know.', null, 3200);
    SFX.doorOpen();
    await UI.say('A door. Then another door.', null, 2400);
    await UI.wait(700);
    await UI.say('Then nothing at all. For a very long time.', null, 3000);
    await UI.wait(1000);

    setCh('morning'); F('familyGone', true); F('wokeInBasement', false);
    // he wakes exactly where he hid
    await World.enter('basement', {x:1030, mood:'worried', noFade:true});
    await UI.fadeIn(true);
    UI.cinematic(false);
    SFX.ambience('house');
    await UI.say('Morning. A grey line of light under the basement door.', null, 3000);
    await UI.say('I fell asleep behind the boxes.', 'Eric', 2400);
    await UI.say('Hello? ...Mom?', 'Eric', 2400);
    await UI.say('Nobody answers. Not even the floorboards.', null, 2800);
    GameMap.noteDraw('basement');
    GameMap.open();
  }

  async function discoverTrapDoor(){
    UI.cinematic(true);
    SFX.step();
    await UI.say('Under the leaves, the ground is not ground.', null, 2600);
    SFX.metal();
    await UI.say('It is wood. With a handle.', null, 2200);
    F('trapFound', true);
    await World.rebuild();
    UI.cinematic(false);
    await UI.say('I could go home. I could go inside and lock the door and wait.', 'Eric', 3200);
    await UI.say('...But nobody is coming to look for them except me.', 'Eric', 3000);
  }

  async function openTrapDoor(){
    UI.cinematic(true);
    SFX.doorOpen(); SFX.creak();
    F('trapOpen', true);
    await World.rebuild();
    await UI.say('A ladder. Going down further than the light goes.', null, 3000);
    UI.cinematic(false);
    setCh('firstvisit');
    State.discover('ladderroom');
    GameMap.noteDraw('ladderroom');
  }

  async function seeFamily(){
    F('sawFamily', true);
    UI.cinematic(true);
    State.findFamily('milo');
    await World.rebuild();
    SFX.heart();
    await UI.say('Cages. Actual cages.', null, 2000);
    await UI.say('ALEX. He is alive — he is RIGHT THERE.', 'Eric', 2800);
    await UI.say('And in the next one along... some man in a hat. Eric has never seen him before in his life.', null, 3400);
    SFX.snore();
    await UI.say('And two somebodies asleep at the ends of the room. Big ones.', null, 2800);
    await UI.say('Not now. Not in daylight. Not with them awake.', 'Eric', 2800);
    UI.cinematic(false);
    GameMap.noteDraw('cages');
    await UI.say('(go back to the ladder)', null, 2000);
  }

  async function leaveBaseFirstTime(){
    UI.cinematic(true);
    await UI.fadeOut(true);
    SFX.stopAmb();
    await UI.say('Eric climbs out, closes the trap door gently, and walks home without running.', null, 3400);
    await UI.say('Running is how you get noticed.', null, 2400);
    await UI.say('He waits for the sky to go dark.', null, 2600);
    setCh('night');
    State.data.night = true; State.save();
    await World.enter('trap', {x:560, mood:'sneak', noFade:true});
    await UI.fadeIn(true);
    UI.cinematic(false);
    SFX.ambience('outside');
    await UI.say('Tonight, then.', 'Eric', 2000);
  }

  async function startEscape(){
    setCh('escape');
    SFX.alarm();
    UI.cinematic(true);
    const red = document.createElement('div');
    red.style.cssText = 'position:absolute;inset:0;z-index:45;pointer-events:none;background:radial-gradient(circle at 50% 40%,rgba(216,80,63,.28),rgba(120,20,14,.5));animation:fadeIn .4s both';
    UI.stage.appendChild(red);
    await UI.say('Every light in the base turns red at once.', null, 2600);
    await UI.say('Something enormous starts waking up in the next room.', null, 2600);
    await UI.say('RUN! To the ladder! Everybody hold on to somebody!', 'Eric', 3000);
    UI.cinematic(false);
    await World.rebuild();
  }

  async function finale(){
    UI.cinematic(true);
    await UI.fadeOut();
    SFX.stopAmb();
    UI.clearSay();
    await UI.say('Up. Rung after rung after rung. Amy first, because she is smallest.', null, 3200);
    await UI.say('Then Alex. Then Mom. Then Dad. Then Eric — last, like the captain of a ship.', null, 3400);
    SFX.doorOpen();
    await UI.say('The trap door slams shut behind them, and the garden is just a garden again.', null, 3400);
    endCard();
  }

  function endCard(){
    UI.clearScene();
    UI.hud(false);
    UI.cinematic(false);
    const el = document.getElementById('scene');
    el.innerHTML = `<svg class="bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <rect width="1600" height="900" fill="#1b2436"/>
      <!-- morning coming up behind the house -->
      <path d="M0 0 H1600 V620 H0 Z" fill="url(#dawn)"/>
      <defs><linearGradient id="dawn" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#f0b46a"/><stop offset=".45" stop-color="#7d7fa4"/>
        <stop offset="1" stop-color="#1b2436"/></linearGradient></defs>
      <circle cx="1240" cy="600" r="90" fill="#ffd79a" opacity=".9" filter="url(#softglow)"/>
      <path d="M0 600 Q800 545 1600 600 L1600 900 L0 900Z" fill="#28331f"/>
      <g transform="translate(1080 790)">${ART.trapdoor(true)}</g>
      <!-- everybody out, in the order they came up the ladder -->
      <g transform="translate(300 780) scale(.72)">${ART.family('junie',210)}</g>
      <g transform="translate(430 790) scale(.8)">${ART.family('milo',210)}</g>
      <g transform="translate(570 800) scale(.86)">${ART.family('mom',210)}</g>
      <g transform="translate(710 800) scale(.86)">${ART.family('dad',210)}</g>
      <g transform="translate(850 800)">${ART.eric('happy',210)}</g>
      </svg>`;
    const box = document.createElement('div');
    box.className = 'centerbox riseIn';
    box.innerHTML = `<div class="title-h">EVERYBODY OUT</div>
      <div class="title-s">Eric rescued his whole family</div>
      <div style="margin-top:1.2em"><span class="pbtn" id="again">play again</span></div>`;
    el.appendChild(box);
    document.getElementById('fade').classList.add('clear');
    SFX.ambience('outside'); SFX.great();
    box.querySelector('#again').onclick = ()=>{ State.reset(); location.reload(); };
  }

  /* ---------------- title ---------------- */
  function title(){
    UI.hud(false);
    const el = document.getElementById('scene');
    el.innerHTML = `<svg class="bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="coverfade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0b0d16" stop-opacity=".84"/>
        <stop offset="1" stop-color="#0b0d16" stop-opacity="0"/></linearGradient></defs>
      <rect width="1600" height="900" fill="#12131c"/>
      ${ASSETS.has('bg.cover')
        ? `<image href="${ASSETS.src('bg.cover')}" x="0" y="0" width="1600" height="900"
                  preserveAspectRatio="xMidYMid slice"/>
           <rect width="1600" height="520" fill="url(#coverfade)"/>`
        : `<g opacity=".55">${[...Array(30)].map(()=>`<circle cx="${Math.random()*1600}" cy="${Math.random()*420}" r="${1+Math.random()*2}" fill="#dfe9f2"/>`).join('')}</g>
           <circle cx="230" cy="150" r="58" fill="#e9f0f6" opacity=".85" filter="url(#softglow)"/>
           <path d="M0 560 Q800 500 1600 560 L1600 900 L0 900Z" fill="#1a2018"/>
           <g transform="translate(1080 760)">${ART.trapdoor(false)}</g>`}
      <!-- Eric, out front of the jail, small against it -->
      <ellipse cx="1236" cy="862" rx="86" ry="20" fill="#5a3f1e" opacity=".35"/>
      <g transform="translate(1230 858)">${ART.eric('worried',300)}</g>
      </svg>`;
    const box = document.createElement('div');
    box.className='centerbox';
    box.innerHTML = `<div class="title-h">ERIC<br>AND THE TRAP DOOR</div>
      <div class="title-s">nobody believed him</div>
      <div style="margin-top:1.4em">
        <span class="pbtn" id="start">begin</span>
        ${(State.data.chapter && State.data.chapter!=='title')?'<span class="pbtn" id="cont">continue</span>':''}
        <span class="pbtn" id="skip">skip to the cages</span>
      </div>`;
    el.appendChild(box);
    document.getElementById('fade').classList.add('clear');
    box.querySelector('#start').onclick = async ()=>{
      SFX.boot(); SFX.click(); State.reset();
      await UI.fadeOut(); box.remove();
      setCh('night1');
      await World.enter('bedroom', {x:420, mood:'worried', noFade:true});
      await UI.fadeIn();
      SFX.creak();
      await UI.say('Something is running around outside my door.', 'Eric', 2800);
      await UI.say('Back and forth. Back and forth.', null, 2400);
    };
    /* straight to the rescue — skips both nights at home and the first
       visit down the ladder, and drops Eric in front of Alex's cage */
    box.querySelector('#skip').onclick = async ()=>{
      SFX.boot(); SFX.click(); State.reset();
      await UI.fadeOut(); box.remove();
      setCh('night');
      State.data.night = true;
      // everything the intro would have taught him: the trap door, the way down,
      // and the fact that his family is in cages
      ['heardIt','warnedParents','warnedSibs','hid','cameUpstairs','sawKitchen',
       'sawPrints','trapFound','trapOpen','sawFamily'].forEach(f=>F(f, true));
      ['yard','trap','ladderroom','corridor','boiler','cages'].forEach(r=>State.discover(r));
      Object.keys(FAMILY).forEach(w=>State.findFamily(w));
      State.save();
      await World.enter('cages', {x:760, mood:'sneak', noFade:true});
      await UI.fadeIn();
      await UI.say('Alex. Right there, behind a lock bigger than his head.', 'Eric', 2800);
      await UI.say('(tap the lock)', null, 2200);
    };

    const cont = box.querySelector('#cont');
    if(cont) cont.onclick = async ()=>{
      SFX.boot(); SFX.click();
      await UI.fadeOut(); box.remove();
      await World.enter(State.data.at, {noFade:true});
      await UI.fadeIn();
    };
  }

  return { decorate, spots, doorAllowed, doorVisible, doorCalling, doorRefused,
           beforeExit, onEnter, title, endCard };
})();

/* ---------------- boot ---------------- */
window.addEventListener('load', ()=>{
  ASSETS.preload();
  State.load();
  Story.title();
  // Esc closes the map
  window.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ GameMap.isOpen ? GameMap.close() : null; }
    if(e.key==='m' || e.key==='M'){ GameMap.isOpen ? GameMap.close() : GameMap.open(); }
  });
});
