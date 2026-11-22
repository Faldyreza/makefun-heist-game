// main.js — boot and the one loop: input in, rules forward, renderer paints.
// The game moves between four modes: start, playing, won, lost. A ?shot=
// scene freezes the rules so a screenshot stages one exact moment.
import {
  ALARM_CAMERA_RATE,
  ALARM_DECAY_RATE,
  ALARM_GUARD_RATE,
  ALARM_MAX,
  CATCH_RADIUS,
  LOCKDOWN_SECONDS,
  LOOT_ALARM_BUMP,
  LOOT_GRAB_RADIUS,
  THIEF_RADIUS,
  THIEF_SPEED,
} from './config.js';
import { createCameras, createGuards } from './guards.js';
import { createInput } from './input.js';
import { VaultAudio } from './audio.js';
import { drawGame } from './render.js';
import { applyShotPreset, readShotFromUrl } from './shots.js';
import {
  LOOT_SPOT,
  LOOT_VITRINE,
  clampToRoom,
  moveCircleWithCollision,
  thiefAtExit,
  thiefSpawnPoint,
} from './world.js';

// Surface any runtime error on the page itself, so a headless playtest can
// prove zero console errors by reading the DOM instead of guessing.
window.addEventListener('error', (event) => {
  document.body.dataset.gameError = String(event.message ?? event.error ?? 'unknown error');
});
window.addEventListener('unhandledrejection', (event) => {
  document.body.dataset.gameError = String(event.reason?.message ?? event.reason ?? 'unhandled rejection');
});

function createFreshState() {
  const spawn = thiefSpawnPoint();
  return {
    mode: 'start', // 'start' | 'playing' | 'won' | 'lost'
    time: 0, // wall-clock seconds since load (drives pulses and sparkles)
    elapsed: 0, // seconds spent playing this attempt
    alarm: 0,
    peakAlarm: 0,
    alarmMode: false,
    lockdown: 0,
    nearLoot: false,
    exitHint: false,
    lostReason: null, // 'caught' | 'lockdown'
    thief: { x: spawn.x, y: spawn.y, angle: -Math.PI / 2, radius: THIEF_RADIUS, hasLoot: false },
    guards: createGuards(),
    cameras: createCameras(),
    clickTarget: null,
  };
}

function thiefNearLoot(thief) {
  return Math.hypot(thief.x - LOOT_SPOT.x, thief.y - LOOT_SPOT.y) <= LOOT_GRAB_RADIUS;
}

function tryGrabLoot(state, audio) {
  if (state.thief.hasLoot) return;
  if (!thiefNearLoot(state.thief)) return;
  state.thief.hasLoot = true;
  state.alarm = Math.min(ALARM_MAX, state.alarm + LOOT_ALARM_BUMP);
  state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
  audio.playGrab();
}

function updatePlaying(state, input, audio, dt) {
  state.elapsed += dt;
  const thief = state.thief;

  // Movement: keys first, click-to-walk second.
  const dir = input.moveDirection();
  if (dir.x !== 0 || dir.y !== 0) {
    state.clickTarget = null;
    thief.angle = Math.atan2(dir.y, dir.x);
    moveCircleWithCollision(thief, dir.x * THIEF_SPEED * dt, dir.y * THIEF_SPEED * dt);
  } else if (state.clickTarget) {
    const dx = state.clickTarget.x - thief.x;
    const dy = state.clickTarget.y - thief.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      state.clickTarget = null;
    } else {
      thief.angle = Math.atan2(dy, dx);
      const step = Math.min(THIEF_SPEED * dt, dist);
      moveCircleWithCollision(thief, (dx / dist) * step, (dy / dist) * step);
    }
  }

  // Clicks: on the vitrine while close = grab; anywhere else = walk there.
  const click = input.takeClick();
  if (click) {
    const onVitrine =
      click.x >= LOOT_VITRINE.x - 20 && click.x <= LOOT_VITRINE.x + LOOT_VITRINE.width + 20 &&
      click.y >= LOOT_VITRINE.y - 20 && click.y <= LOOT_VITRINE.y + LOOT_VITRINE.height + 20;
    if (onVitrine && thiefNearLoot(thief)) {
      tryGrabLoot(state, audio);
    } else {
      const clamped = clampToRoom(click.x, click.y, THIEF_RADIUS);
      state.clickTarget = { x: clamped.x, y: clamped.y };
    }
  }
  if (input.takePressed('KeyE')) tryGrabLoot(state, audio);

  state.nearLoot = thiefNearLoot(thief) && !thief.hasLoot;
  state.exitHint = thiefAtExit(thief.x, thief.y) && !thief.hasLoot;

  // Watchers move, then look.
  for (const guard of state.guards) guard.update(dt, thief, state.alarmMode);
  for (const camera of state.cameras) camera.update(dt, state.elapsed);
  let seenByGuard = false;
  let seenByCamera = false;
  for (const guard of state.guards) if (guard.canSee(thief)) seenByGuard = true;
  for (const camera of state.cameras) if (camera.canSee(thief)) seenByCamera = true;

  // The alarm meter: climbs while seen, cools while hidden.
  if (!state.alarmMode) {
    if (seenByGuard) state.alarm += ALARM_GUARD_RATE * dt;
    if (seenByCamera) state.alarm += ALARM_CAMERA_RATE * dt;
    if (!seenByGuard && !seenByCamera) state.alarm -= ALARM_DECAY_RATE * dt;
    state.alarm = Math.max(0, Math.min(ALARM_MAX, state.alarm));
    state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
    if (state.alarm >= ALARM_MAX) {
      state.alarmMode = true;
      state.lockdown = LOCKDOWN_SECONDS;
      audio.playAlarm();
    }
  } else {
    // Full alarm pins the meter and starts the lockdown countdown.
    state.alarm = ALARM_MAX;
    state.lockdown -= dt;
    if (Math.ceil(state.lockdown) !== Math.ceil(state.lockdown + dt)) audio.playAlarm();
    if (state.lockdown <= 0) {
      state.mode = 'lost';
      state.lostReason = 'lockdown';
      audio.playLose();
      return;
    }
  }

  // Caught: a guard closes the distance.
  for (const guard of state.guards) {
    if (Math.hypot(guard.x - thief.x, guard.y - thief.y) <= CATCH_RADIUS) {
      state.mode = 'lost';
      state.lostReason = 'caught';
      audio.playLose();
      return;
    }
  }

  // The getaway: diamond in hand and back through the green door.
  if (thiefAtExit(thief.x, thief.y) && thief.hasLoot) {
    state.mode = 'won';
    audio.playWin();
  }
}

function startGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const input = createInput(canvas);
  const audio = new VaultAudio();
  let state = createFreshState();

  // Debug handle for headless playtests: window.__midnightVault.state
  // always reads the live state. It changes nothing about the game.
  window.__midnightVault = { get state() { return state; } };

  // Screenshot scenes (?shot=start|play|alarm|win) freeze the rules and
  // stage one exact moment; normal play never sets this.
  const shotStaged = applyShotPreset(state, readShotFromUrl());

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    state.time += dt;

    if (!shotStaged) {
      if (state.mode === 'start') {
        if (input.takePressed('Enter') || input.takePressed('NumpadEnter') || input.takeClick()) {
          audio.ensure();
          state.mode = 'playing';
        }
      } else if (state.mode === 'playing') {
        updatePlaying(state, input, audio, dt);
      } else if (input.takePressed('KeyR') || input.takeClick()) {
        state = createFreshState();
      }
      // Drain stale one-shot presses so they never leak into the next mode.
      input.takePressed('KeyE');
    }

    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

startGame();
