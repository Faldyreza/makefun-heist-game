// world.js — the vault room itself: walls, cover, the exit door, the loot
// vitrine, and the geometry the rest of the game asks about (collision and
// line of sight). No drawing, no input, no game rules beyond the room.
// Rect obstacles are { x, y, w, h, kind }; pillars are { x, y, r, kind }.
import { ROOM, THIEF_SPAWN } from './config.js';

export const EXIT_DOOR = { x: 60, y: ROOM.bottom, width: 84, height: 18 };

export const LOOT_VITRINE = { x: 775, y: 108, width: 96, height: 64 };

export const LOOT_SPOT = {
  x: LOOT_VITRINE.x + LOOT_VITRINE.width / 2,
  y: LOOT_VITRINE.y + LOOT_VITRINE.height / 2,
};

export const OBSTACLES = [
  // Display cases — the main cover. Three routes run between them.
  { x: 300, y: 150, w: 120, h: 70, kind: 'case' },
  { x: 560, y: 300, w: 120, h: 70, kind: 'case' },
  { x: 300, y: 420, w: 120, h: 70, kind: 'case' },
  // Long oak table in the upper middle.
  { x: 600, y: 140, w: 150, h: 50, kind: 'table' },
  // The vault safe on the right wall.
  { x: 856, y: 300, w: 56, h: 92, kind: 'safe' },
  // Low planters near the bottom wall.
  { x: 150, y: 500, w: 64, h: 40, kind: 'planter' },
  { x: 740, y: 500, w: 64, h: 40, kind: 'planter' },
  // Marble pillars — round cover that breaks vision cones.
  { x: 480, y: 262, r: 26, kind: 'pillar' },
  { x: 480, y: 470, r: 26, kind: 'pillar' },
  { x: 180, y: 300, r: 22, kind: 'pillar' },
  // The loot vitrine itself blocks movement too.
  { x: LOOT_VITRINE.x, y: LOOT_VITRINE.y, w: LOOT_VITRINE.width, h: LOOT_VITRINE.height, kind: 'vitrine' },
];

function circleHitsRect(cx, cy, r, rect) {
  const nearX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < r * r;
}

function circleHitsCircle(cx, cy, r, pillar) {
  const dx = cx - pillar.x;
  const dy = cy - pillar.y;
  const rr = r + pillar.r;
  return dx * dx + dy * dy < rr * rr;
}

/** True when a circle at (x, y) with radius r overlaps a wall or an obstacle. */
export function circleHitsSolid(x, y, r) {
  if (x - r < ROOM.left || x + r > ROOM.right) return true;
  if (y - r < ROOM.top || y + r > ROOM.bottom) return true;
  for (const o of OBSTACLES) {
    if (o.r !== undefined) {
      if (circleHitsCircle(x, y, r, o)) return true;
    } else if (circleHitsRect(x, y, r, o)) {
      return true;
    }
  }
  return false;
}

/**
 * Move a circle entity by (dx, dy) with axis-separated collision, so it
 * slides along walls and cases instead of sticking on corners.
 */
export function moveCircleWithCollision(entity, dx, dy) {
  const nx = entity.x + dx;
  if (!circleHitsSolid(nx, entity.y, entity.radius)) entity.x = nx;
  const ny = entity.y + dy;
  if (!circleHitsSolid(entity.x, ny, entity.radius)) entity.y = ny;
}

/** Clamp a point inside the room interior. */
export function clampToRoom(x, y, r) {
  return {
    x: Math.max(ROOM.left + r, Math.min(ROOM.right - r, x)),
    y: Math.max(ROOM.top + r, Math.min(ROOM.bottom - r, y)),
  };
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const corners = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ax, ay, bx, by] of corners) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentHitsCircle(x1, y1, x2, y2, pillar) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > 0) t = Math.max(0, Math.min(1, ((pillar.x - x1) * dx + (pillar.y - y1) * dy) / lenSq));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const ox = pillar.x - px;
  const oy = pillar.y - py;
  return ox * ox + oy * oy < pillar.r * pillar.r;
}

/**
 * True when any wall, case, table, safe, planter or pillar stands between
 * the two points — vision cones never see through cover.
 */
export function lineOfSightBlocked(x1, y1, x2, y2) {
  for (const o of OBSTACLES) {
    if (o.r !== undefined) {
      if (segmentHitsCircle(x1, y1, x2, y2, o)) return true;
    } else if (segmentHitsRect(x1, y1, x2, y2, o)) {
      return true;
    }
  }
  return false;
}

/** True when the thief stands in the green exit doorway. */
export function thiefAtExit(x, y) {
  return (
    x >= EXIT_DOOR.x - 6 &&
    x <= EXIT_DOOR.x + EXIT_DOOR.width + 6 &&
    y >= ROOM.bottom - 34
  );
}

export function thiefSpawnPoint() {
  return { x: THIEF_SPAWN.x, y: THIEF_SPAWN.y };
}
