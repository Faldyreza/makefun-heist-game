// config.js — every tunable number for MIDNIGHT VAULT in one place.
// One job: constants. No logic, no drawing, no input.
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;
export const HUD_HEIGHT = 48;
export const WALL = 16;

// Playable room interior (inside the gold-trimmed walls, below the HUD bar).
export const ROOM = { left: 32, top: 72, right: 928, bottom: 608 };

export const THIEF_SPEED = 175;
export const THIEF_RADIUS = 13;
export const THIEF_SPAWN = { x: 102, y: 566 };

export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 118;
export const GUARD_RADIUS = 14;
export const GUARD_VISION_RANGE = 205;
export const GUARD_VISION_HALF_ANGLE = Math.PI / 5.2; // about 35 degrees
export const GUARD_TURN_SPEED = 5.2; // radians per second

export const CAMERA_RANGE = 235;
export const CAMERA_HALF_ANGLE = Math.PI / 7; // about 26 degrees
export const CAMERA_SWEEP_SPEED = 0.55; // radians per second

export const ALARM_GUARD_RATE = 42; // alarm points per second while a guard sees the thief
export const ALARM_CAMERA_RATE = 30; // alarm points per second while a camera sees the thief
export const ALARM_DECAY_RATE = 7; // alarm points per second while hidden
export const ALARM_MAX = 100;
export const LOCKDOWN_SECONDS = 6; // seconds to escape once the alarm is full
export const LOOT_ALARM_BUMP = 10; // smashing the vitrine glass makes noise
export const LOOT_GRAB_RADIUS = 48;
export const CATCH_RADIUS = 24;

export const COLORS = {
  floorDark: '#141824',
  floorLight: '#1a2032',
  floorLine: '#232a3d',
  wall: '#0c0e16',
  wallTrim: '#c9a227',
  gold: '#e8c34a',
  goldDim: '#8a6d1f',
  glass: '#9fd8e8',
  exitGreen: '#2fd47a',
  exitDark: '#0e5c31',
  thief: '#2b2f3a',
  thiefHood: '#e8c34a',
  guard: '#31456e',
  guardCap: '#1d2c4d',
  coneGuard: 'rgba(232, 195, 74, 0.28)',
  coneGuardEdge: 'rgba(232, 195, 74, 0.55)',
  coneCamera: 'rgba(255, 84, 64, 0.26)',
  coneCameraEdge: 'rgba(255, 84, 64, 0.6)',
  diamond: '#aef3ff',
  diamondCore: '#ffffff',
  hudBg: '#0b0d14',
  hudText: '#f2ead2',
  hudMuted: '#9aa3b8',
  alarmLow: '#2fd47a',
  alarmMid: '#e8c34a',
  alarmHigh: '#ff5440',
  danger: '#ff5440',
  panel: 'rgba(8, 10, 18, 0.82)',
};
