// Game Constants

// Grid and Rendering
export const TILE_SIZE = 32;
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 20;

// Game Settings
export const TARGET_FPS = 60;
export const MOBILE_TOUCH_TARGET_SIZE = 44; // Minimum touch target size in pixels

// Player Settings
export const PLAYER_SPEED = 4; // tiles per second
export const INTERACTION_RANGE = 1.5; // tiles

// Animal Settings
export const ANIMAL_SPAWN_DELAY = 5000; // milliseconds
export const MAX_ANIMALS_PER_MAP = 10;
export const ANIMAL_WANDER_RADIUS = 3; // tiles

// UI Constants
export const ANIMATION_DURATION = 300; // milliseconds
export const TOAST_DISPLAY_TIME = 3000; // milliseconds

// Storage Keys
export const STORAGE_KEYS = {
  GAME_SAVE: 'feral-friends-save',
  SETTINGS: 'feral-friends-settings',
  PROGRESS: 'feral-friends-progress'
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280
} as const;

// Colors (matching our design system)
export const COLORS = {
  PRIMARY: '#059669', // green-600
  PRIMARY_HOVER: '#047857', // green-700
  SECONDARY: '#3B82F6', // blue-600
  SUCCESS: '#10B981', // emerald-500
  WARNING: '#F59E0B', // amber-500
  ERROR: '#EF4444', // red-500
  BACKGROUND: '#F9FAFB', // gray-50
  SURFACE: '#FFFFFF', // white
  TEXT_PRIMARY: '#111827', // gray-900
  TEXT_SECONDARY: '#6B7280' // gray-500
} as const;

// Game Version
export const GAME_VERSION = '0.1.0';