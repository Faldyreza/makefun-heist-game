// guards.js — the watchers: patrolling guards with vision cones and
// wall cameras that sweep. One job: where they look, and whether they can
// see the thief. No drawing, no input.
import {
  CAMERA_HALF_ANGLE,
  CAMERA_RANGE,
  CAMERA_SWEEP_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_RADIUS,
  GUARD_TURN_SPEED,
  GUARD_VISION_HALF_ANGLE,
  GUARD_VISION_RANGE,
} from './config.js';
import { lineOfSightBlocked, moveCircleWithCollision } from './world.js';

/** Smallest signed turn from angle a to angle b, in (-PI, PI]. */
export function angleDifference(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(current, target, maxStep) {
  const d = angleDifference(current, target);
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

/**
 * Shared vision test for a watcher at (wx, wy) facing `facing`:
 * in range, inside the cone, and no cover between watcher and thief.
 */
export function watcherSeesThief(wx, wy, facing, range, halfAngle, thief) {
  const dx = thief.x - wx;
  const dy = thief.y - wy;
  const distSq = dx * dx + dy * dy;
  if (distSq > range * range) return false;
  const angleToThief = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(facing, angleToThief)) > halfAngle) return false;
  if (lineOfSightBlocked(wx, wy, thief.x, thief.y)) return false;
  return true;
}

export class PatrolGuard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.targetIndex = 1;
    this.angle = def.startAngle ?? 0;
    this.radius = GUARD_RADIUS;
    this.mode = 'patrol'; // 'patrol' | 'chase'
    this.seesThief = false;
  }

  /** Advance one frame; chases the thief while the alarm is full. */
  update(dt, thief, alarmFull) {
    if (alarmFull) this.mode = 'chase';
    else if (this.mode === 'chase') this.mode = 'patrol';

    if (this.mode === 'chase') {
      const targetAngle = Math.atan2(thief.y - this.y, thief.x - this.x);
      this.angle = turnToward(this.angle, targetAngle, GUARD_TURN_SPEED * dt);
      const step = GUARD_CHASE_SPEED * dt;
      moveCircleWithCollision(this, Math.cos(this.angle) * step, Math.sin(this.angle) * step);
      return;
    }

    const target = this.waypoints[this.targetIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      return;
    }
    const targetAngle = Math.atan2(dy, dx);
    this.angle = turnToward(this.angle, targetAngle, GUARD_TURN_SPEED * dt);
    const step = Math.min(GUARD_PATROL_SPEED * dt, dist);
    moveCircleWithCollision(this, Math.cos(this.angle) * step, Math.sin(this.angle) * step);
  }

  canSee(thief) {
    this.seesThief = watcherSeesThief(
      this.x, this.y, this.angle,
      GUARD_VISION_RANGE, GUARD_VISION_HALF_ANGLE, thief,
    );
    return this.seesThief;
  }

  cone() {
    return {
      x: this.x, y: this.y, angle: this.angle,
      range: GUARD_VISION_RANGE, halfAngle: GUARD_VISION_HALF_ANGLE,
    };
  }
}

export class SecurityCamera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep; // radians either side of baseAngle
    this.phase = def.phase ?? 0;
    this.angle = this.baseAngle;
    this.seesThief = false;
  }

  /** Sweep the cone back and forth along the wall. */
  update(dt, elapsed) {
    this.angle = this.baseAngle + Math.sin(elapsed * CAMERA_SWEEP_SPEED + this.phase) * this.sweep;
  }

  canSee(thief) {
    this.seesThief = watcherSeesThief(
      this.x, this.y, this.angle,
      CAMERA_RANGE, CAMERA_HALF_ANGLE, thief,
    );
    return this.seesThief;
  }

  cone() {
    return {
      x: this.x, y: this.y, angle: this.angle,
      range: CAMERA_RANGE, halfAngle: CAMERA_HALF_ANGLE,
    };
  }
}

/** The three guards and their fixed patrol routes through the vault. */
export function createGuards() {
  return [
    new PatrolGuard({
      waypoints: [
        { x: 200, y: 122 }, { x: 700, y: 122 },
        { x: 700, y: 222 }, { x: 200, y: 222 },
      ],
      startAngle: 0,
    }),
    new PatrolGuard({
      waypoints: [
        { x: 150, y: 520 }, { x: 500, y: 520 },
        { x: 500, y: 380 }, { x: 150, y: 380 },
      ],
      startAngle: 0,
    }),
    new PatrolGuard({
      waypoints: [
        { x: 850, y: 250 }, { x: 850, y: 520 },
        { x: 650, y: 520 }, { x: 650, y: 250 },
      ],
      startAngle: Math.PI,
    }),
  ];
}

/** The two wall cameras, one sweeping the top hall, one the right wall. */
export function createCameras() {
  return [
    new SecurityCamera({ x: 480, y: 76, baseAngle: Math.PI / 2, sweep: 0.85, phase: 0 }),
    new SecurityCamera({ x: 924, y: 320, baseAngle: Math.PI, sweep: 0.8, phase: 2.1 }),
  ];
}
