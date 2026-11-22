// shots.js — the screenshot scenes behind ?shot=start|play|alarm|win.
// Each preset stages a real game state (positions, alarm, loot, mode) so a
// still frame shows exactly what a played moment looks like. The game
// itself is unchanged: without ?shot= it starts on the title screen.
import { thiefSpawnPoint } from './world.js';

function placeThief(state, x, y, angle, hasLoot) {
  state.thief.x = x;
  state.thief.y = y;
  state.thief.angle = angle;
  state.thief.hasLoot = hasLoot;
}

/** Stage one of the four screenshot scenes on a fresh state. Returns true when a shot was staged. */
export function applyShotPreset(state, name) {
  if (name === 'start') {
    // Title screen over the full room: thief at the door, guards mid-patrol,
    // cameras mid-sweep, diamond glowing in its vitrine, alarm at zero.
    state.mode = 'start';
    state.alarm = 0;
    state.alarmMode = false;
    state.lockdown = 0;
    placeThief(state, 102, 566, -Math.PI / 2, false);
    state.guards[0].x = 420; state.guards[0].y = 122; state.guards[0].angle = 0;
    state.guards[1].x = 320; state.guards[1].y = 520; state.guards[1].angle = 0;
    state.guards[2].x = 850; state.guards[2].y = 380; state.guards[2].angle = Math.PI;
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[1].angle = Math.PI - 0.4;
    return true;
  }
  if (name === 'play') {
    // Mid-heist: thief crouched behind the middle case, a guard cone sweeping
    // close, alarm half full, diamond still in the glass.
    state.mode = 'playing';
    state.alarm = 55;
    state.alarmMode = false;
    state.lockdown = 0;
    state.elapsed = 47;
    placeThief(state, 470, 360, -Math.PI / 2, false);
    state.guards[0].x = 560; state.guards[0].y = 200; state.guards[0].angle = Math.PI / 2;
    state.guards[1].x = 300; state.guards[1].y = 430; state.guards[1].angle = Math.PI / 2;
    state.guards[2].x = 760; state.guards[2].y = 420; state.guards[2].angle = Math.PI;
    state.guards[0].seesThief = true;
    state.cameras[0].angle = Math.PI / 2 - 0.6;
    state.cameras[1].angle = Math.PI + 0.5;
    return true;
  }
  if (name === 'alarm') {
    // The caught moment: alarm full, lockdown ticking, a guard chasing the
    // thief who already has the diamond and is sprinting for the door.
    state.mode = 'playing';
    state.alarm = 100;
    state.alarmMode = true;
    state.lockdown = 4.2;
    state.elapsed = 96;
    state.peakAlarm = 100;
    placeThief(state, 250, 520, Math.PI, true);
    state.guards[0].x = 330; state.guards[0].y = 470; state.guards[0].angle = Math.PI * 0.85;
    state.guards[0].mode = 'chase';
    state.guards[0].seesThief = true;
    state.guards[1].x = 480; state.guards[1].y = 520; state.guards[1].angle = Math.PI;
    state.guards[1].mode = 'chase';
    state.guards[2].x = 700; state.guards[2].y = 420; state.guards[2].angle = Math.PI * 0.75;
    state.guards[2].mode = 'chase';
    state.cameras[0].angle = Math.PI / 2 + 0.7;
    state.cameras[1].angle = Math.PI - 0.7;
    return true;
  }
  if (name === 'win') {
    // The getaway: thief in the green exit doorway, diamond secured, the
    // ESCAPED panel up, alarm cooled back down.
    state.mode = 'won';
    state.alarm = 32;
    state.alarmMode = false;
    state.lockdown = 0;
    state.elapsed = 128;
    state.peakAlarm = 88;
    const spawn = thiefSpawnPoint();
    placeThief(state, spawn.x, spawn.y, Math.PI / 2, true);
    state.guards[0].x = 420; state.guards[0].y = 222; state.guards[0].angle = Math.PI;
    state.guards[1].x = 500; state.guards[1].y = 380; state.guards[1].angle = -Math.PI / 2;
    state.guards[2].x = 850; state.guards[2].y = 300; state.guards[2].angle = Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 - 0.4;
    state.cameras[1].angle = Math.PI + 0.3;
    return true;
  }
  return false;
}

/** Read ?shot= from the page URL, if one was given. */
export function readShotFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('shot') ?? '';
  } catch {
    return '';
  }
}
