# Eric and the Trap Door

A dark-whimsical illustrated rescue adventure. One continuous journey — no mini-game menu.
Open `index.html` in a browser (no build step, no dependencies).

## The journey as built

    bedroom (someone is running outside the door)
      → wake Mom + Dad (not believed)  → wake Milo + Junie (not believed)
      → basement, hide  → morning, the house is empty
      → kitchen (four uneaten bowls)  → yard (footprints)  → the trap door
      → climb down: the secret base  → see Mom and Dad in cages, leave before being seen
      → NIGHT RETURN
          Boiler Room     — CHALLENGE 1  pressure meter    → key + the picture door wakes up
          Card Door       — CHALLENGE 2  memory matching   → key + the crate workshop opens
          Crate Workshop  — CHALLENGE 3  cross the water (the crocodile lives in it) → key + the Deep Works opens
          Deep Works      — CHALLENGE 4  pounding machine  → the final key
      → unlock four cages (each family member reacts) → alarm → escape up the ladder

Every challenge sits physically in a room and physically changes the world when solved
(gears turn, a lock swings open, a wall rotates, a key falls out of a machine).

## Files

| file | what it holds |
|---|---|
| `js/main.js` | the story: chapter gating, room beats, cinematics, endings |
| `js/world.js` | the 15 rooms, doorways, gates, Eric's walking |
| `js/map.js` | Eric's hand-drawn map: discovery, rescue status, fast travel |
| `js/state.js` | rooms, family, keys, flags, save file, fast-travel rules |
| `js/art.js` | procedural placeholder illustration (Eric, family, villains, props) |
| `js/challenges/*.js` | the four challenges |
| `js/audio.js` | synthesised ambience + feedback — no audio files needed |
| `js/assets.js` | **the drop-in point for your artwork** |

## Adding your artwork

The procedural drawings are placeholders standing in for supplied art. To replace any of them:

1. Drop a transparent PNG into `assets/characters|environments|props|ui/`
2. Uncomment / add its line in `MANIFEST` at the top of `js/assets.js`, e.g.
   `'eric.idle': 'characters/eric-idle.png'`
3. Reload.

Nothing else changes — placement, scale, animation, map state, rescue state and story flow
all keep working. Characters are drawn feet-at-bottom, facing right.
Keys currently supported: `eric.idle`, `eric.worried`, `eric.happy`, `dad`, `mom`, `milo`,
`junie`, `villain.tall`, `villain.round`, `prop.key`, plus any `bg.*` environment you add.

## Controls

- Click a doorway or an object — Eric walks there and does the sensible thing
- `M` or the folded map in the corner — open Eric's map (also fast travel)
- Challenge 1: click / space. Challenge 3: arrow keys or WASD to run, space to jump (or the on-screen pad).
  The blue in the drawing is water — fall in and the crocodile gets him. The
  yellow square, the purple bar and the green swing are all solid to stand on.

## Notes for the next scenes

- New rooms go in `ROOMS` (`state.js`) + `World.R` + `DOORS` (`world.js`); the map draws
  them automatically the first time Eric walks in.
- Locked areas are declared in `World.GATE` — a door refuses, in Eric's voice, until its
  challenge is done, so fast travel can never skip progression.
- Progress saves to localStorage; the title screen offers *continue*.
