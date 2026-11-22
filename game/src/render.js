// render.js — drawing only: the vault, the cones, the people, the HUD and
// the start / win / loss panels. State in, pixels out. Nothing here moves
// the game or reads input.
import {
  ALARM_MAX,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  HUD_HEIGHT,
  LOCKDOWN_SECONDS,
  ROOM,
  WALL,
} from './config.js';
import { EXIT_DOOR, LOOT_SPOT, LOOT_VITRINE, OBSTACLES } from './world.js';

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floorDark;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  // Marble checker.
  const tile = 64;
  for (let y = ROOM.top; y < ROOM.bottom; y += tile) {
    for (let x = ROOM.left; x < ROOM.right; x += tile) {
      const odd = ((x - ROOM.left) / tile + (y - ROOM.top) / tile) % 2 === 0;
      ctx.fillStyle = odd ? COLORS.floorLight : COLORS.floorDark;
      ctx.fillRect(x, y, Math.min(tile, ROOM.right - x), Math.min(tile, ROOM.bottom - y));
    }
  }
  // Faint gold carpet runner from the door to the vitrine — the thief's road.
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.18)';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.moveTo(102, 566);
  ctx.lineTo(102, 470);
  ctx.lineTo(480, 470);
  ctx.lineTo(480, 340);
  ctx.lineTo(823, 340);
  ctx.lineTo(823, 172);
  ctx.stroke();
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = ROOM.left; x <= ROOM.right; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, ROOM.top); ctx.lineTo(x, ROOM.bottom); ctx.stroke();
  }
  for (let y = ROOM.top; y <= ROOM.bottom; y += tile) {
    ctx.beginPath(); ctx.moveTo(ROOM.left, y); ctx.lineTo(ROOM.right, y); ctx.stroke();
  }
}

function drawWalls(ctx, time) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, WALL);
  ctx.fillRect(0, CANVAS_HEIGHT - WALL, CANVAS_WIDTH, WALL);
  ctx.fillRect(0, HUD_HEIGHT, WALL, CANVAS_HEIGHT - HUD_HEIGHT);
  ctx.fillRect(CANVAS_WIDTH - WALL, HUD_HEIGHT, WALL, CANVAS_HEIGHT - HUD_HEIGHT);
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(WALL / 2 + 1, HUD_HEIGHT + WALL / 2 + 1, CANVAS_WIDTH - WALL - 2, CANVAS_HEIGHT - HUD_HEIGHT - WALL - 2);
  // Exit doorway: green glowing gap in the bottom wall.
  const pulse = 0.55 + 0.35 * Math.sin(time * 3);
  ctx.fillStyle = COLORS.exitDark;
  ctx.fillRect(EXIT_DOOR.x, EXIT_DOOR.y, EXIT_DOOR.width, EXIT_DOOR.height);
  ctx.fillStyle = `rgba(47, 212, 122, ${pulse})`;
  ctx.fillRect(EXIT_DOOR.x + 4, EXIT_DOOR.y + 2, EXIT_DOOR.width - 8, 6);
  ctx.fillStyle = COLORS.exitGreen;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', EXIT_DOOR.x + EXIT_DOOR.width / 2, EXIT_DOOR.y - 12);
}

function drawObstacles(ctx, time, lootTaken) {
  for (const o of OBSTACLES) {
    if (o.r !== undefined) {
      // Marble pillar with a gold ring.
      ctx.fillStyle = '#2a3145';
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLORS.goldDim;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r - 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3a435e';
      ctx.beginPath(); ctx.arc(o.x - 6, o.y - 6, 7, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    if (o.kind === 'vitrine') {
      // Glass vitrine; empty and cracked once the diamond is gone.
      ctx.fillStyle = '#20263a';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = lootTaken ? 'rgba(159, 216, 232, 0.10)' : 'rgba(159, 216, 232, 0.25)';
      ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      if (lootTaken) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(o.x + 20, o.y + 8); ctx.lineTo(o.x + 34, o.y + 30); ctx.lineTo(o.x + 26, o.y + 52);
        ctx.moveTo(o.x + 70, o.y + 10); ctx.lineTo(o.x + 58, o.y + 34); ctx.lineTo(o.x + 74, o.y + 54);
        ctx.stroke();
      }
      continue;
    }
    if (o.kind === 'case') {
      ctx.fillStyle = '#232a40';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = 'rgba(159, 216, 232, 0.16)';
      ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
      ctx.strokeStyle = COLORS.goldDim;
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      // Small treasures inside the case.
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath(); ctx.arc(o.x + 26, o.y + o.h / 2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x + o.w - 26, o.y + o.h / 2, 6, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    if (o.kind === 'table') {
      ctx.fillStyle = '#4a3421';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#5d4229';
      ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12);
      ctx.strokeStyle = COLORS.goldDim;
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      continue;
    }
    if (o.kind === 'safe') {
      ctx.fillStyle = '#39415a';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#39415a';
      ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 4, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    // Planter.
    ctx.fillStyle = '#22301f';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#2f6b2a';
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2 - 6, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x + 14, o.y + o.h / 2 + 4, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x + o.w - 14, o.y + o.h / 2 + 4, 10, 0, Math.PI * 2); ctx.fill();
  }
}

function drawLootDiamond(ctx, time, lootTaken) {
  if (lootTaken) return;
  const cx = LOOT_SPOT.x;
  const cy = LOOT_SPOT.y;
  const bob = Math.sin(time * 2.4) * 3;
  const glow = 0.5 + 0.3 * Math.sin(time * 3.1);
  const grad = ctx.createRadialGradient(cx, cy + bob, 4, cx, cy + bob, 46);
  grad.addColorStop(0, `rgba(174, 243, 255, ${glow})`);
  grad.addColorStop(1, 'rgba(174, 243, 255, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy + bob, 46, 0, Math.PI * 2); ctx.fill();
  // Faceted diamond.
  ctx.fillStyle = COLORS.diamond;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 16 + bob);
  ctx.lineTo(cx + 15, cy - 4 + bob);
  ctx.lineTo(cx, cy + 16 + bob);
  ctx.lineTo(cx - 15, cy - 4 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.diamondCore;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 16 + bob);
  ctx.lineTo(cx + 15, cy - 4 + bob);
  ctx.lineTo(cx - 15, cy - 4 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy - 16 + bob); ctx.lineTo(cx, cy + 16 + bob); ctx.stroke();
  // "DIAMOND" label so the target reads at a glance.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('◆ DIAMOND', cx, LOOT_VITRINE.y + LOOT_VITRINE.height + 16);
}

function drawCone(ctx, cone, fill, edge) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(cone.x, cone.y);
  ctx.arc(cone.x, cone.y, cone.range, cone.angle - cone.halfAngle, cone.angle + cone.halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cone.x, cone.y);
  ctx.lineTo(cone.x + Math.cos(cone.angle - cone.halfAngle) * cone.range, cone.y + Math.sin(cone.angle - cone.halfAngle) * cone.range);
  ctx.moveTo(cone.x, cone.y);
  ctx.lineTo(cone.x + Math.cos(cone.angle + cone.halfAngle) * cone.range, cone.y + Math.sin(cone.angle + cone.halfAngle) * cone.range);
  ctx.stroke();
}

function drawGuard(ctx, guard) {
  // Vision cone first (under the body).
  drawCone(ctx, guard.cone(), COLORS.coneGuard, COLORS.coneGuardEdge);
  // Body: navy uniform, cap, facing nose.
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0e1526';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2); ctx.fill();
  const nx = guard.x + Math.cos(guard.angle) * 18;
  const ny = guard.y + Math.sin(guard.angle) * 18;
  ctx.strokeStyle = guard.mode === 'chase' ? COLORS.danger : COLORS.gold;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(guard.x, guard.y); ctx.lineTo(nx, ny); ctx.stroke();
  if (guard.seesThief) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 22);
  }
}

function drawCamera(ctx, camera) {
  drawCone(ctx, camera.cone(), COLORS.coneCamera, COLORS.coneCameraEdge);
  // Wall mount + lens aimed along the cone.
  ctx.fillStyle = '#3a3f52';
  ctx.beginPath(); ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.danger;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(camera.x, camera.y, 9, 0, Math.PI * 2); ctx.stroke();
  const lx = camera.x + Math.cos(camera.angle) * 12;
  const ly = camera.y + Math.sin(camera.angle) * 12;
  ctx.fillStyle = camera.seesThief ? COLORS.danger : '#ff8a70';
  ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
}

function drawThief(ctx, thief, time) {
  // Soft shadow + gold outline so the thief reads against the dark floor.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath(); ctx.ellipse(thief.x, thief.y + 10, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath(); ctx.arc(thief.x, thief.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.thiefHood;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(thief.x, thief.y, 13, 0, Math.PI * 2); ctx.stroke();
  // Hood point in the facing direction.
  const hx = thief.x + Math.cos(thief.angle) * 10;
  const hy = thief.y + Math.sin(thief.angle) * 10;
  ctx.fillStyle = COLORS.thiefHood;
  ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill();
  if (thief.hasLoot) {
    const bob = Math.sin(time * 4) * 2;
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.moveTo(thief.x, thief.y - 22 + bob);
    ctx.lineTo(thief.x + 7, thief.y - 14 + bob);
    ctx.lineTo(thief.x, thief.y - 6 + bob);
    ctx.lineTo(thief.x - 7, thief.y - 14 + bob);
    ctx.closePath();
    ctx.fill();
  }
}

function alarmColor(alarm) {
  if (alarm < 40) return COLORS.alarmLow;
  if (alarm < 75) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MIDNIGHT VAULT', 14, HUD_HEIGHT / 2 + 1);

  // Alarm meter: label + wide bar, centre-top.
  const barX = 300;
  const barY = 14;
  const barW = 300;
  const barH = 20;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', barX - 62, HUD_HEIGHT / 2 + 1);
  ctx.fillStyle = '#1c2233';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(barX, barY, (barW * Math.min(state.alarm, ALARM_MAX)) / ALARM_MAX, barH);
  ctx.strokeStyle = COLORS.goldDim;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barW, barH);
  if (state.alarmMode) {
    const blink = Math.sin(state.time * 10) > 0;
    ctx.fillStyle = blink ? COLORS.danger : COLORS.hudText;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`LOCKDOWN ${Math.ceil(state.lockdown)}s`, barX + barW + 12, HUD_HEIGHT / 2 + 1);
  }

  // Loot status + timer, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = state.thief.hasLoot ? COLORS.diamond : COLORS.hudMuted;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(state.thief.hasLoot ? '◆ DIAMOND SECURED' : '◇ DIAMOND: NOT TAKEN', 830, HUD_HEIGHT / 2 - 8);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`TIME ${formatTime(state.elapsed)}`, 830, HUD_HEIGHT / 2 + 11);
  // "Grab" hint when the thief stands by the vitrine without the loot.
  if (state.mode === 'playing' && !state.thief.hasLoot && state.nearLoot) {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Press E (or click) to grab the diamond!', CANVAS_WIDTH / 2, HUD_HEIGHT + 22);
  }
  // Reminder when the thief reaches the exit empty-handed.
  if (state.mode === 'playing' && state.exitHint) {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.exitGreen;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('You need the diamond first — grab it, then come back!', CANVAS_WIDTH / 2, HUD_HEIGHT + 44);
  }
}

function drawPanel(ctx, title, titleColor, lines, footer) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const pw = 620;
  const ph = 300;
  const px = (CANVAS_WIDTH - pw) / 2;
  const py = (CANVAS_HEIGHT - ph) / 2;
  ctx.fillStyle = '#12151f';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, CANVAS_WIDTH / 2, py + 62);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '16px system-ui, sans-serif';
  let y = py + 112;
  for (const line of lines) {
    ctx.fillText(line, CANVAS_WIDTH / 2, y);
    y += 26;
  }
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(footer, CANVAS_WIDTH / 2, py + ph - 34);
}

/** Paint one frame of the whole game. */
export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawFloor(ctx);
  drawObstacles(ctx, state.time, state.thief.hasLoot);
  drawLootDiamond(ctx, state.time, state.thief.hasLoot);
  for (const camera of state.cameras) drawCamera(ctx, camera);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawThief(ctx, state.thief, state.time);
  drawWalls(ctx, state.time);
  drawHud(ctx, state);

  // Red alarm vignette while the meter is full.
  if (state.alarmMode) {
    const pulse = 0.10 + 0.06 * Math.sin(state.time * 8);
    ctx.fillStyle = `rgba(255, 40, 30, ${pulse})`;
    ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('! ALARM — RUN FOR THE EXIT !', CANVAS_WIDTH / 2, HUD_HEIGHT + 34);
  }

  if (state.mode === 'start') {
    // Translucent title panel: the whole room stays visible behind it.
    ctx.fillStyle = 'rgba(8, 10, 18, 0.62)';
    ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.fillText('MIDNIGHT VAULT', CANVAS_WIDTH / 2, 170);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('One thief. One diamond. Three guards, two cameras, one alarm.', CANVAS_WIDTH / 2, 214);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Sneak past the yellow vision cones and the red camera sweeps.', CANVAS_WIDTH / 2, 246);
    ctx.fillText('Grab the diamond, then slip out through the green EXIT — before the alarm fills.', CANVAS_WIDTH / 2, 272);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('WASD / Arrow keys to move  ·  Click to walk  ·  E to grab the diamond', CANVAS_WIDTH / 2, 320);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px system-ui, sans-serif';
    const blink = Math.sin(state.time * 4) > -0.2;
    if (blink) ctx.fillText('— CLICK OR PRESS ENTER TO START —', CANVAS_WIDTH / 2, 372);
  } else if (state.mode === 'won') {
    drawPanel(
      ctx, 'ESCAPED!', COLORS.exitGreen,
      [
        'The diamond is yours. The vault never saw you coming.',
        `Clean getaway in ${formatTime(state.elapsed)} — alarm peaked at ${Math.round(state.peakAlarm)}%.`,
        'Guards are still checking the empty vitrine.',
      ],
      'Press R to play again',
    );
  } else if (state.mode === 'lost') {
    drawPanel(
      ctx, state.lostReason === 'caught' ? 'CAUGHT!' : 'LOCKDOWN!',
      COLORS.danger,
      state.lostReason === 'caught'
        ? ['A guard got his hands on you in the vault.', 'The diamond stays behind the glass tonight.', `You lasted ${formatTime(state.elapsed)}.`]
        : ['The alarm stayed full and the vault sealed itself.', 'The diamond stays behind the glass tonight.', `You lasted ${formatTime(state.elapsed)}.`],
      'Press R to try again',
    );
  }
}
