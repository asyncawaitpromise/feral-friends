// Advanced Animal Behavior System
// Handles pack animals, nocturnal behaviors, migration patterns, and complex social dynamics

import { Animal, AnimalSpecies, Position, getDistanceToPosition, getAnimalsInRadius } from './Animal';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'foggy' | 'stormy';
export type MigrationStatus = 'settled' | 'preparing' | 'migrating' | 'arriving';

export interface PackData {
  id: string;
  leaderId: string;
  memberIds: string[];
  centerPosition: Position;
  packRadius: number;
  packSize: number;
  maxPackSize: number;
  cohesion: number; // 0-1, how closely pack stays together
  hierarchy: string[]; // Animal IDs in dominance order
  packType: 'family' | 'hunting' | 'protection' | 'social';
}

export interface MigrationData {
  species: AnimalSpecies;
  startSeason: string;
  endSeason: string;
  migrationRoute: Position[];
  currentWaypoint: number;
  migrationSpeed: number;
  groupSize: number;
  status: MigrationStatus;
}

export interface CircadianRhythm {
  species: AnimalSpecies;
  activeHours: TimeOfDay[];
  sleepHours: TimeOfDay[];
  activityPeaks: TimeOfDay[];
  energyByTime: Record<TimeOfDay, number>; // Energy multiplier for each time
}

export interface WeatherResponse {
  species: AnimalSpecies;
  weatherPreferences: Record<WeatherType, number>; // Activity modifier for each weather
  shelterBehavior: Record<WeatherType, 'normal' | 'seek_shelter' | 'hide' | 'migrate'>;
  weatherTolerances: Record<WeatherType, number>; // 0-1, how well they handle weather
}

// Pack behavior configurations
export const PACK_CONFIGS: Record<AnimalSpecies, Partial<PackData> | null> = {
  rabbit: null, // Solitary but may gather
  bird: {
    packType: 'social',
    maxPackSize: 8,
    packRadius: 5,
    cohesion: 0.7
  },
  squirrel: null, // Mostly solitary
  fox: null, // Solitary
  deer: {
    packType: 'family',
    maxPackSize: 6,
    packRadius: 8,
    cohesion: 0.8
  },
  butterfly: {
    packType: 'social',
    maxPackSize: 12,
    packRadius: 3,
    cohesion: 0.5
  },
  frog: {
    packType: 'social',
    maxPackSize: 4,
    packRadius: 2,
    cohesion: 0.6
  },
  turtle: null, // Solitary
  owl: null, // Solitary
  hawk: null, // Solitary
  mouse: {
    packType: 'family',
    maxPackSize: 8,
    packRadius: 4,
    cohesion: 0.9
  },
  raccoon: {
    packType: 'family',
    maxPackSize: 5,
    packRadius: 6,
    cohesion: 0.7
  },
  bear: null, // Solitary except family
  wolf: {
    packType: 'hunting',
    maxPackSize: 8,
    packRadius: 12,
    cohesion: 0.9
  },
  otter: {
    packType: 'social',
    maxPackSize: 10,
    packRadius: 8,
    cohesion: 0.8
  },
  hedgehog: null, // Solitary
  bat: {
    packType: 'social',
    maxPackSize: 15,
    packRadius: 6,
    cohesion: 0.8
  }
};

// Circadian rhythm configurations
export const CIRCADIAN_RHYTHMS: Record<AnimalSpecies, CircadianRhythm> = {
  rabbit: {
    species: 'rabbit',
    activeHours: ['dawn', 'dusk'],
    sleepHours: ['day', 'night'],
    activityPeaks: ['dawn', 'dusk'],
    energyByTime: { dawn: 1.2, day: 0.8, dusk: 1.2, night: 0.6 }
  },
  bird: {
    species: 'bird',
    activeHours: ['dawn', 'day'],
    sleepHours: ['night'],
    activityPeaks: ['dawn'],
    energyByTime: { dawn: 1.3, day: 1.0, dusk: 0.8, night: 0.3 }
  },
  squirrel: {
    species: 'squirrel',
    activeHours: ['day'],
    sleepHours: ['night'],
    activityPeaks: ['day'],
    energyByTime: { dawn: 0.8, day: 1.2, dusk: 0.9, night: 0.4 }
  },
  fox: {
    species: 'fox',
    activeHours: ['dusk', 'night', 'dawn'],
    sleepHours: ['day'],
    activityPeaks: ['dusk', 'night'],
    energyByTime: { dawn: 1.0, day: 0.5, dusk: 1.3, night: 1.2 }
  },
  deer: {
    species: 'deer',
    activeHours: ['dawn', 'dusk'],
    sleepHours: ['day', 'night'],
    activityPeaks: ['dawn', 'dusk'],
    energyByTime: { dawn: 1.2, day: 0.7, dusk: 1.2, night: 0.6 }
  },
  butterfly: {
    species: 'butterfly',
    activeHours: ['day'],
    sleepHours: ['night'],
    activityPeaks: ['day'],
    energyByTime: { dawn: 0.6, day: 1.3, dusk: 0.8, night: 0.2 }
  },
  frog: {
    species: 'frog',
    activeHours: ['dusk', 'night'],
    sleepHours: ['day'],
    activityPeaks: ['dusk'],
    energyByTime: { dawn: 0.7, day: 0.4, dusk: 1.3, night: 1.1 }
  },
  turtle: {
    species: 'turtle',
    activeHours: ['day', 'dusk'],
    sleepHours: ['night'],
    activityPeaks: ['day'],
    energyByTime: { dawn: 0.8, day: 1.0, dusk: 0.9, night: 0.5 }
  },
  owl: {
    species: 'owl',
    activeHours: ['night', 'dawn'],
    sleepHours: ['day'],
    activityPeaks: ['night'],
    energyByTime: { dawn: 1.0, day: 0.3, dusk: 0.8, night: 1.4 }
  },
  hawk: {
    species: 'hawk',
    activeHours: ['day'],
    sleepHours: ['night'],
    activityPeaks: ['day'],
    energyByTime: { dawn: 0.9, day: 1.3, dusk: 0.8, night: 0.3 }
  },
  mouse: {
    species: 'mouse',
    activeHours: ['night', 'dawn'],
    sleepHours: ['day'],
    activityPeaks: ['night'],
    energyByTime: { dawn: 1.1, day: 0.4, dusk: 0.9, night: 1.3 }
  },
  raccoon: {
    species: 'raccoon',
    activeHours: ['night', 'dusk'],
    sleepHours: ['day'],
    activityPeaks: ['night'],
    energyByTime: { dawn: 0.8, day: 0.4, dusk: 1.1, night: 1.3 }
  },
  bear: {
    species: 'bear',
    activeHours: ['dawn', 'day', 'dusk'],
    sleepHours: ['night'],
    activityPeaks: ['dawn', 'dusk'],
    energyByTime: { dawn: 1.2, day: 1.0, dusk: 1.1, night: 0.6 }
  },
  wolf: {
    species: 'wolf',
    activeHours: ['dusk', 'night', 'dawn'],
    sleepHours: ['day'],
    activityPeaks: ['dusk', 'night'],
    energyByTime: { dawn: 1.0, day: 0.6, dusk: 1.2, night: 1.3 }
  },
  otter: {
    species: 'otter',
    activeHours: ['day', 'dusk'],
    sleepHours: ['night'],
    activityPeaks: ['day'],
    energyByTime: { dawn: 0.9, day: 1.2, dusk: 1.0, night: 0.5 }
  },
  hedgehog: {
    species: 'hedgehog',
    activeHours: ['night', 'dusk'],
    sleepHours: ['day'],
    activityPeaks: ['night'],
    energyByTime: { dawn: 0.8, day: 0.3, dusk: 1.0, night: 1.3 }
  },
  bat: {
    species: 'bat',
    activeHours: ['night'],
    sleepHours: ['day'],
    activityPeaks: ['night'],
    energyByTime: { dawn: 0.6, day: 0.2, dusk: 0.9, night: 1.4 }
  }
};

// Weather response configurations
export const WEATHER_RESPONSES: Record<AnimalSpecies, WeatherResponse> = {
  rabbit: {
    species: 'rabbit',
    weatherPreferences: { sunny: 1.0, rainy: 0.6, snowy: 0.4, foggy: 0.8, stormy: 0.3 },
    shelterBehavior: { sunny: 'normal', rainy: 'seek_shelter', snowy: 'seek_shelter', foggy: 'normal', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.7, snowy: 0.5, foggy: 0.9, stormy: 0.4 }
  },
  bird: {
    species: 'bird',
    weatherPreferences: { sunny: 1.2, rainy: 0.4, snowy: 0.3, foggy: 0.5, stormy: 0.2 },
    shelterBehavior: { sunny: 'normal', rainy: 'seek_shelter', snowy: 'seek_shelter', foggy: 'seek_shelter', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.5, snowy: 0.4, foggy: 0.6, stormy: 0.2 }
  },
  squirrel: {
    species: 'squirrel',
    weatherPreferences: { sunny: 1.1, rainy: 0.5, snowy: 0.6, foggy: 0.8, stormy: 0.3 },
    shelterBehavior: { sunny: 'normal', rainy: 'seek_shelter', snowy: 'normal', foggy: 'normal', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.6, snowy: 0.8, foggy: 0.9, stormy: 0.3 }
  },
  fox: {
    species: 'fox',
    weatherPreferences: { sunny: 0.9, rainy: 0.8, snowy: 1.2, foggy: 1.1, stormy: 0.6 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'normal', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 1.0, rainy: 0.9, snowy: 1.0, foggy: 1.0, stormy: 0.7 }
  },
  deer: {
    species: 'deer',
    weatherPreferences: { sunny: 1.0, rainy: 0.7, snowy: 0.5, foggy: 0.6, stormy: 0.3 },
    shelterBehavior: { sunny: 'normal', rainy: 'seek_shelter', snowy: 'seek_shelter', foggy: 'seek_shelter', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.8, snowy: 0.6, foggy: 0.7, stormy: 0.4 }
  },
  butterfly: {
    species: 'butterfly',
    weatherPreferences: { sunny: 1.5, rainy: 0.1, snowy: 0.0, foggy: 0.3, stormy: 0.0 },
    shelterBehavior: { sunny: 'normal', rainy: 'hide', snowy: 'hide', foggy: 'seek_shelter', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.2, snowy: 0.0, foggy: 0.4, stormy: 0.0 }
  },
  frog: {
    species: 'frog',
    weatherPreferences: { sunny: 0.8, rainy: 1.3, snowy: 0.2, foggy: 1.1, stormy: 0.9 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'hide', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 0.8, rainy: 1.0, snowy: 0.3, foggy: 1.0, stormy: 0.8 }
  },
  turtle: {
    species: 'turtle',
    weatherPreferences: { sunny: 1.2, rainy: 0.9, snowy: 0.3, foggy: 0.8, stormy: 0.5 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'hide', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 1.0, rainy: 1.0, snowy: 0.4, foggy: 0.9, stormy: 0.6 }
  },
  owl: {
    species: 'owl',
    weatherPreferences: { sunny: 0.8, rainy: 1.0, snowy: 1.1, foggy: 1.2, stormy: 0.7 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'normal', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 0.9, rainy: 1.0, snowy: 1.0, foggy: 1.0, stormy: 0.8 }
  },
  hawk: {
    species: 'hawk',
    weatherPreferences: { sunny: 1.3, rainy: 0.4, snowy: 0.6, foggy: 0.5, stormy: 0.2 },
    shelterBehavior: { sunny: 'normal', rainy: 'seek_shelter', snowy: 'seek_shelter', foggy: 'seek_shelter', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.5, snowy: 0.7, foggy: 0.6, stormy: 0.3 }
  },
  mouse: {
    species: 'mouse',
    weatherPreferences: { sunny: 0.9, rainy: 0.8, snowy: 0.6, foggy: 1.0, stormy: 0.4 },
    shelterBehavior: { sunny: 'normal', rainy: 'seek_shelter', snowy: 'seek_shelter', foggy: 'normal', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.8, snowy: 0.7, foggy: 1.0, stormy: 0.5 }
  },
  raccoon: {
    species: 'raccoon',
    weatherPreferences: { sunny: 0.9, rainy: 1.1, snowy: 0.7, foggy: 1.0, stormy: 0.6 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'seek_shelter', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 1.0, rainy: 1.0, snowy: 0.8, foggy: 1.0, stormy: 0.7 }
  },
  bear: {
    species: 'bear',
    weatherPreferences: { sunny: 1.0, rainy: 0.8, snowy: 1.1, foggy: 0.9, stormy: 0.6 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'normal', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 1.0, rainy: 0.9, snowy: 1.0, foggy: 1.0, stormy: 0.8 }
  },
  wolf: {
    species: 'wolf',
    weatherPreferences: { sunny: 0.9, rainy: 1.0, snowy: 1.2, foggy: 1.1, stormy: 0.8 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'normal', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 1.0, rainy: 1.0, snowy: 1.0, foggy: 1.0, stormy: 0.9 }
  },
  otter: {
    species: 'otter',
    weatherPreferences: { sunny: 1.1, rainy: 1.2, snowy: 0.4, foggy: 0.9, stormy: 0.5 },
    shelterBehavior: { sunny: 'normal', rainy: 'normal', snowy: 'seek_shelter', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 1.0, rainy: 1.0, snowy: 0.5, foggy: 0.9, stormy: 0.6 }
  },
  hedgehog: {
    species: 'hedgehog',
    weatherPreferences: { sunny: 0.8, rainy: 0.6, snowy: 0.4, foggy: 0.9, stormy: 0.3 },
    shelterBehavior: { sunny: 'normal', rainy: 'seek_shelter', snowy: 'hide', foggy: 'normal', stormy: 'hide' },
    weatherTolerances: { sunny: 1.0, rainy: 0.7, snowy: 0.5, foggy: 0.9, stormy: 0.4 }
  },
  bat: {
    species: 'bat',
    weatherPreferences: { sunny: 0.6, rainy: 1.0, snowy: 0.5, foggy: 1.2, stormy: 0.4 },
    shelterBehavior: { sunny: 'seek_shelter', rainy: 'normal', snowy: 'seek_shelter', foggy: 'normal', stormy: 'seek_shelter' },
    weatherTolerances: { sunny: 0.7, rainy: 1.0, snowy: 0.6, foggy: 1.0, stormy: 0.5 }
  }
};

// Migration routes (simplified)
export const MIGRATION_ROUTES: Record<AnimalSpecies, MigrationData | null> = {
  rabbit: null,
  bird: {
    species: 'bird',
    startSeason: 'autumn',
    endSeason: 'spring',
    migrationRoute: [
      { x: 0, y: 0 }, // Starting point
      { x: 5, y: -10 }, // Waypoint 1
      { x: 15, y: -25 }, // Waypoint 2
      { x: 30, y: -40 } // Destination
    ],
    currentWaypoint: 0,
    migrationSpeed: 2.0,
    groupSize: 8,
    status: 'settled'
  },
  squirrel: null,
  fox: null,
  deer: {
    species: 'deer',
    startSeason: 'winter',
    endSeason: 'spring',
    migrationRoute: [
      { x: 0, y: 0 },
      { x: -8, y: 5 },
      { x: -20, y: 15 }
    ],
    currentWaypoint: 0,
    migrationSpeed: 1.5,
    groupSize: 6,
    status: 'settled'
  },
  butterfly: {
    species: 'butterfly',
    startSeason: 'autumn',
    endSeason: 'spring',
    migrationRoute: [
      { x: 0, y: 0 },
      { x: 10, y: -15 },
      { x: 25, y: -35 },
      { x: 45, y: -60 }
    ],
    currentWaypoint: 0,
    migrationSpeed: 3.0,
    groupSize: 12,
    status: 'settled'
  },
  frog: null,
  turtle: null,
  owl: null,
  hawk: null,
  mouse: null,
  raccoon: null,
  bear: null,
  wolf: null,
  otter: null,
  hedgehog: null,
  bat: null
};

// Active packs in the game world
export const activePacks: Map<string, PackData> = new Map();

/**
 * Update animal behavior based on time of day
 */
export function updateCircadianBehavior(animal: Animal, currentTime: TimeOfDay): void {
  const rhythm = CIRCADIAN_RHYTHMS[animal.species];
  if (!rhythm) return;

  const energyMultiplier = rhythm.energyByTime[currentTime];
  
  // Adjust activity based on circadian rhythm
  if (rhythm.activeHours.includes(currentTime)) {
    animal.behavior.activityLevel = Math.min(1.0, animal.behavior.activityLevel * energyMultiplier);
    
    // Animals are more responsive during active hours
    if (animal.ai.currentState === 'sleeping') {
      animal.ai.currentState = 'idle';
    }
  } else if (rhythm.sleepHours.includes(currentTime)) {
    animal.behavior.activityLevel = Math.max(0.1, animal.behavior.activityLevel * energyMultiplier);
    
    // Animals may go to sleep during sleep hours
    if (Math.random() < 0.3 && animal.ai.currentState === 'idle') {
      animal.ai.currentState = 'sleeping';
    }
  }

  // Peak activity times increase curiosity and reduce fear
  if (rhythm.activityPeaks.includes(currentTime)) {
    animal.stats.curiosity = Math.min(100, animal.stats.curiosity + 5);
    animal.stats.fear = Math.max(0, animal.stats.fear - 3);
  }
}

/**
 * Update animal behavior based on weather
 */
export function updateWeatherBehavior(animal: Animal, currentWeather: WeatherType): void {
  const response = WEATHER_RESPONSES[animal.species];
  if (!response) return;

  const weatherPreference = response.weatherPreferences[currentWeather];
  const shelterBehavior = response.shelterBehavior[currentWeather];
  const tolerance = response.weatherTolerances[currentWeather];

  // Adjust activity based on weather preference
  animal.behavior.activityLevel *= weatherPreference;

  // Handle shelter seeking behavior
  switch (shelterBehavior) {
    case 'seek_shelter':
      if (animal.ai.currentState === 'wandering') {
        animal.ai.currentState = 'returning'; // Head to safe area
      }
      animal.stats.fear = Math.min(100, animal.stats.fear + 10);
      break;
    
    case 'hide':
      animal.ai.currentState = 'hiding';
      animal.stats.fear = Math.min(100, animal.stats.fear + 20);
      animal.behavior.activityLevel *= 0.3;
      break;
    
    case 'migrate':
      // Trigger migration behavior (simplified)
      if (Math.random() < 0.1) {
        animal.ai.currentState = 'wandering';
        animal.behavior.wanderRadius *= 2; // Expand search area
      }
      break;
  }

  // Reduce happiness and energy in bad weather
  if (tolerance < 0.5) {
    animal.stats.happiness = Math.max(0, animal.stats.happiness - 5);
    animal.stats.energy = Math.max(0, animal.stats.energy - 2);
  }
}

/**
 * Create a new pack for social animals
 */
export function createPack(leaderId: string, animals: Animal[]): PackData | null {
  const leader = animals.find(a => a.id === leaderId);
  if (!leader) return null;

  const packConfig = PACK_CONFIGS[leader.species];
  if (!packConfig) return null;

  const packId = `pack_${leaderId}_${Date.now()}`;
  
  // Find nearby animals of the same species
  const nearbyAnimals = getAnimalsInRadius(animals, leader.position, packConfig.packRadius || 10)
    .filter(a => a.species === leader.species && a.id !== leaderId)
    .slice(0, (packConfig.maxPackSize || 5) - 1);

  const pack: PackData = {
    id: packId,
    leaderId,
    memberIds: [leaderId, ...nearbyAnimals.map(a => a.id)],
    centerPosition: { ...leader.position },
    packRadius: packConfig.packRadius || 10,
    packSize: nearbyAnimals.length + 1,
    maxPackSize: packConfig.maxPackSize || 5,
    cohesion: packConfig.cohesion || 0.7,
    hierarchy: [leaderId, ...nearbyAnimals.map(a => a.id)],
    packType: packConfig.packType || 'social'
  };

  activePacks.set(packId, pack);
  return pack;
}

/**
 * Update pack behavior and movement
 */
export function updatePackBehavior(pack: PackData, animals: Animal[]): void {
  const packMembers = animals.filter(a => pack.memberIds.includes(a.id));
  const leader = packMembers.find(a => a.id === pack.leaderId);
  
  if (!leader || packMembers.length === 0) {
    activePacks.delete(pack.id);
    return;
  }

  // Update pack center position
  const avgX = packMembers.reduce((sum, a) => sum + a.position.x, 0) / packMembers.length;
  const avgY = packMembers.reduce((sum, a) => sum + a.position.y, 0) / packMembers.length;
  pack.centerPosition = { x: avgX, y: avgY };

  // Apply pack cohesion behavior
  packMembers.forEach(animal => {
    if (animal.id === pack.leaderId) return; // Leader sets the pace

    const distanceFromCenter = getDistanceToPosition(animal, pack.centerPosition);
    
    // If animal is too far from pack, encourage it to return
    if (distanceFromCenter > pack.packRadius) {
      animal.ai.targetPosition = pack.centerPosition;
      animal.ai.currentState = 'returning';
    }
    
    // Apply pack bonuses
    animal.stats.happiness = Math.min(100, animal.stats.happiness + 1);
    animal.stats.fear = Math.max(0, animal.stats.fear - 2);
  });

  // Pack-specific behaviors
  switch (pack.packType) {
    case 'hunting':
      // Hunting packs move together and are more aggressive
      packMembers.forEach(animal => {
        animal.behavior.activityLevel = Math.min(1.0, animal.behavior.activityLevel * 1.2);
        animal.stats.fear = Math.max(0, animal.stats.fear - 5);
      });
      break;
      
    case 'protection':
      // Protection packs are more defensive
      packMembers.forEach(animal => {
        animal.behavior.fleeDistance *= 0.8; // Less likely to flee
        animal.stats.fear = Math.max(0, animal.stats.fear - 3);
      });
      break;
      
    case 'family':
      // Family packs boost happiness and trust
      packMembers.forEach(animal => {
        animal.stats.happiness = Math.min(100, animal.stats.happiness + 2);
        animal.stats.trust = Math.min(100, animal.stats.trust + 1);
      });
      break;
  }
}

/**
 * Check if an animal should join a pack
 */
export function shouldJoinPack(animal: Animal, animals: Animal[]): boolean {
  const packConfig = PACK_CONFIGS[animal.species];
  if (!packConfig) return false;

  // Check if animal is already in a pack
  for (const pack of activePacks.values()) {
    if (pack.memberIds.includes(animal.id)) {
      return false;
    }
  }

  // Look for nearby packs of the same species
  const nearbyPacks = Array.from(activePacks.values()).filter(pack => {
    const packCenter = pack.centerPosition;
    const distance = getDistanceToPosition(animal, packCenter);
    return distance <= pack.packRadius * 1.5 && pack.packSize < pack.maxPackSize;
  });

  // Find animals of same species for potential pack formation
  const nearbyAnimals = getAnimalsInRadius(animals, animal.position, packConfig.packRadius || 10)
    .filter(a => a.species === animal.species && a.id !== animal.id);

  // High social animals are more likely to form/join packs
  const socialModifier = animal.behavior.socialLevel;
  const formPackChance = socialModifier * 0.1; // 10% chance for highly social animals

  return nearbyPacks.length > 0 || (nearbyAnimals.length >= 2 && Math.random() < formPackChance);
}

/**
 * Handle migration behavior for migratory species
 */
export function updateMigrationBehavior(animals: Animal[], currentSeason: string): void {
  Object.values(MIGRATION_ROUTES).forEach(migrationData => {
    if (!migrationData) return;

    const migratoryAnimals = animals.filter(a => a.species === migrationData.species);
    
    // Check if it's migration season
    if (currentSeason === migrationData.startSeason && migrationData.status === 'settled') {
      migrationData.status = 'preparing';
      
      // Start preparing animals for migration
      migratoryAnimals.forEach(animal => {
        animal.behavior.activityLevel = Math.min(1.0, animal.behavior.activityLevel * 1.3);
        animal.stats.energy = Math.min(animal.stats.maxEnergy, animal.stats.energy + 10);
        
        // Animals become restless before migration
        if (animal.ai.currentState === 'idle') {
          animal.ai.currentState = 'wandering';
        }
      });
    }
    
    // Handle active migration
    if (migrationData.status === 'migrating') {
      const currentWaypoint = migrationData.migrationRoute[migrationData.currentWaypoint];
      
      migratoryAnimals.forEach(animal => {
        animal.ai.targetPosition = currentWaypoint;
        animal.ai.currentState = 'wandering';
        animal.behavior.activityLevel = Math.min(1.0, animal.behavior.activityLevel * migrationData.migrationSpeed);
      });
    }
  });
}

/**
 * Get all animals in active packs
 */
export function getPackAnimals(animals: Animal[]): Animal[] {
  const packAnimalIds = new Set<string>();
  activePacks.forEach(pack => {
    pack.memberIds.forEach(id => packAnimalIds.add(id));
  });
  
  return animals.filter(animal => packAnimalIds.has(animal.id));
}

/**
 * Get pack info for an animal
 */
export function getAnimalPack(animalId: string): PackData | null {
  for (const pack of activePacks.values()) {
    if (pack.memberIds.includes(animalId)) {
      return pack;
    }
  }
  return null;
}

/**
 * Remove animal from all packs (e.g., when tamed)
 */
export function removeAnimalFromPacks(animalId: string): void {
  activePacks.forEach((pack, packId) => {
    const index = pack.memberIds.indexOf(animalId);
    if (index !== -1) {
      pack.memberIds.splice(index, 1);
      pack.packSize--;
      
      // If this was the leader, promote next in hierarchy
      if (pack.leaderId === animalId && pack.memberIds.length > 0) {
        pack.leaderId = pack.memberIds[0];
        pack.hierarchy = pack.hierarchy.filter(id => id !== animalId);
      }
      
      // Remove pack if empty or too small
      if (pack.memberIds.length < 2) {
        activePacks.delete(packId);
      }
    }
  });
}

export default {
  PACK_CONFIGS,
  CIRCADIAN_RHYTHMS,
  WEATHER_RESPONSES,
  MIGRATION_ROUTES,
  activePacks,
  updateCircadianBehavior,
  updateWeatherBehavior,
  createPack,
  updatePackBehavior,
  shouldJoinPack,
  updateMigrationBehavior,
  getPackAnimals,
  getAnimalPack,
  removeAnimalFromPacks
};