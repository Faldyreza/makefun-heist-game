# makefun-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Faldyreza/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Faldyreza/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

MIDNIGHT VAULT — a top-down stealth heist game: sneak past patrolling guards and sweeping security cameras, grab the diamond from its glass vitrine, and slip out through the green EXIT before the alarm fills.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

## How to play

- **Move:** WASD or arrow keys, or click anywhere to walk there.
- **Grab the diamond:** stand by the glass vitrine and press **E** (or click it). Smashing the glass makes noise — the alarm jumps.
- **Stay out of sight:** yellow cones are guard vision, red cones are wall cameras. Being seen fills the **ALARM** meter in the HUD; hiding lets it cool down.
- **Full alarm = lockdown:** guards chase you and you have 6 seconds to reach the EXIT. Get caught and the run is over.
- **Win:** diamond in hand, back through the green EXIT door.
- **Restart:** press **R** after a win or a loss.

The vault has three routes between the display cases, pillars and planters for cover — read the patrols and the camera sweeps before you move.

## Structure

- `game/index.html` — the page and canvas.
- `game/src/config.js` — every tunable number (speeds, vision, alarm rates).
- `game/src/world.js` — the room: walls, cover, exit, loot vitrine, collision and line of sight.
- `game/src/guards.js` — guard patrols and vision cones, camera sweeps.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — synthesized WebAudio cues (no sound files).
- `game/src/render.js` — all canvas drawing: room, cones, HUD, panels.
- `game/src/shots.js` — the four staged screenshot scenes behind `?shot=`.
- `game/src/main.js` — boot, the game loop and the win/lose rules.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.

No network requests: every script, image and sound is a file under `game/` or synthesized in code.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rvk09evk&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
