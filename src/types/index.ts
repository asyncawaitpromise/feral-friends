// TypeScript Type Definitions

// Basic game types for future use
export interface Position {
  x: number;
  y: number;
}

export interface GridPosition extends Position {
  // Grid-specific position data
}

export interface Player {
  id: string;
  position: Position;
  name: string;
}

export interface Animal {
  id: string;
  species: string;
  position: Position;
  tameness: number;
  discovered: boolean;
}

export interface GameState {
  player: Player;
  animals: Animal[];
  currentMap: string;
  isPaused: boolean;
}

// UI Types
export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Game Constants Types
export type TerrainType = 'grass' | 'water' | 'stone' | 'forest' | 'cave';
export type AnimalSpecies = 'rabbit' | 'bird' | 'squirrel' | 'fox' | 'deer';
export type BiomeType = 'meadow' | 'forest' | 'stream' | 'hills' | 'cave';