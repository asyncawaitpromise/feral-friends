// Game-specific type definitions

export interface GameEntity {
  id: string;
  position: Position;
  created: Date;
  lastUpdated: Date;
}

export interface Position {
  x: number;
  y: number;
}

export interface GridPosition extends Position {
  gridX: number;
  gridY: number;
}

export interface Player extends GameEntity {
  name: string;
  level: number;
  experience: number;
  inventory: InventoryItem[];
  companions: CompanionAnimal[];
  discoveredMaps: string[];
  achievements: Achievement[];
}

export interface Animal extends GameEntity {
  species: AnimalSpecies;
  personality: AnimalPersonality;
  mood: AnimalMood;
  tameness: number;
  trustLevel: number;
  isWild: boolean;
  currentBehavior: AnimalBehavior;
  preferredTricks: string[];
  discoveredBy?: string;
  lastInteraction?: Date;
}

export interface CompanionAnimal extends Animal {
  bondLevel: number;
  knownTricks: LearnedTrick[];
  nickname?: string;
  tamingDate: Date;
}

export interface LearnedTrick {
  trickId: string;
  masteryLevel: number; // 0-100
  timesPerformed: number;
  learnedDate: Date;
}

export interface InventoryItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  quantity: number;
  rarity: ItemRarity;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedDate: Date;
  category: AchievementCategory;
}

// Enums and Union Types
export type AnimalSpecies = 
  | 'rabbit' 
  | 'squirrel' 
  | 'bird' 
  | 'fox' 
  | 'deer' 
  | 'turtle' 
  | 'frog' 
  | 'butterfly';

export type AnimalPersonality = 
  | 'shy' 
  | 'curious' 
  | 'playful' 
  | 'aggressive' 
  | 'friendly' 
  | 'lazy' 
  | 'energetic';

export type AnimalMood = 
  | 'happy' 
  | 'neutral' 
  | 'scared' 
  | 'angry' 
  | 'sleepy' 
  | 'excited' 
  | 'hungry';

export type AnimalBehavior = 
  | 'idle' 
  | 'wandering' 
  | 'fleeing' 
  | 'approaching' 
  | 'sleeping' 
  | 'eating' 
  | 'playing';

export type TerrainType = 
  | 'grass' 
  | 'water' 
  | 'stone' 
  | 'forest' 
  | 'cave' 
  | 'sand' 
  | 'flowers';

export type BiomeType = 
  | 'meadow' 
  | 'forest' 
  | 'stream' 
  | 'hills' 
  | 'cave' 
  | 'desert' 
  | 'garden';

export type ItemType = 
  | 'food' 
  | 'tool' 
  | 'treasure' 
  | 'material' 
  | 'special';

export type ItemRarity = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'epic' 
  | 'legendary';

export type AchievementCategory = 
  | 'discovery' 
  | 'bonding' 
  | 'mastery' 
  | 'exploration' 
  | 'collection' 
  | 'competition';

// Game State Types
export interface GameState {
  player: Player;
  currentMap: GameMap;
  animals: Animal[];
  gameTime: GameTime;
  weather: WeatherState;
  isPaused: boolean;
  settings: GameSettings;
}

export interface GameMap {
  id: string;
  name: string;
  biome: BiomeType;
  width: number;
  height: number;
  tiles: TerrainType[][];
  spawnPoints: Position[];
  exits: MapExit[];
}

export interface MapExit {
  position: Position;
  targetMapId: string;
  targetPosition: Position;
}

export interface GameTime {
  hour: number; // 0-23
  minute: number; // 0-59
  day: number;
  season: Season;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface WeatherState {
  type: WeatherType;
  intensity: number; // 0-100
  duration: number; // minutes remaining
}

export type WeatherType = 
  | 'clear' 
  | 'cloudy' 
  | 'rain' 
  | 'storm' 
  | 'snow' 
  | 'fog';

export interface GameSettings {
  audioEnabled: boolean;
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
  hapticFeedback: boolean;
  autoSave: boolean;
  showTutorials: boolean;
  accessibility: AccessibilitySettings;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largerText: boolean;
  screenReaderMode: boolean;
}