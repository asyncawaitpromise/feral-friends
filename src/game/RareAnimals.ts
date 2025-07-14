// Rare Animal System
// Handles special variants, seasonal animals, and legendary creatures

import { Animal, AnimalSpecies, createAnimal } from './Animal';
import { Position } from '../types/game';

export type RarityLevel = 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'foggy' | 'stormy';

export interface RareAnimalVariant {
  id: string;
  baseSpecies: AnimalSpecies;
  name: string;
  description: string;
  rarity: RarityLevel;
  
  // Appearance modifiers
  colorOverride?: string;
  secondaryColorOverride?: string;
  patternOverride?: 'solid' | 'striped' | 'spotted' | 'gradient';
  sizeModifier?: number; // 0.5 to 2.0 scale
  glowEffect?: boolean;
  sparkleEffect?: boolean;
  
  // Stat modifiers (multipliers)
  healthModifier?: number;
  energyModifier?: number;
  trustModifier?: number;
  curiosityModifier?: number;
  
  // Spawn conditions
  seasons?: Season[];
  weatherConditions?: WeatherCondition[];
  timeOfDay?: ('day' | 'night' | 'dawn' | 'dusk')[];
  requiredBiomes?: string[];
  minPlayerLevel?: number;
  
  // Spawn rates (0-1, multiplied by base spawn rate)
  spawnChance: number;
  
  // Special abilities or behaviors
  specialAbilities?: string[];
  behaviorModifiers?: {
    fleeDistanceModifier?: number;
    activityLevelModifier?: number;
    socialLevelModifier?: number;
  };
}

// Rare animal variants database
export const RARE_VARIANTS: Record<string, RareAnimalVariant> = {
  // Albino variants (very rare, all white)
  albinoRabbit: {
    id: 'albino_rabbit',
    baseSpecies: 'rabbit',
    name: 'Albino Rabbit',
    description: 'A beautiful white rabbit with pink eyes, extremely rare and gentle.',
    rarity: 'epic',
    colorOverride: '#FFFFFF',
    secondaryColorOverride: '#FFB6C1',
    glowEffect: true,
    healthModifier: 0.8,
    trustModifier: 1.5,
    spawnChance: 0.01, // 1% of normal rabbit spawns
    specialAbilities: ['lucky_encounter', 'trust_bonus'],
    behaviorModifiers: {
      fleeDistanceModifier: 0.8
    }
  },

  albinoFox: {
    id: 'albino_fox',
    baseSpecies: 'fox',
    name: 'Arctic Fox',
    description: 'A pristine white fox with incredible beauty and intelligence.',
    rarity: 'epic',
    colorOverride: '#FFFFFF',
    secondaryColorOverride: '#E6E6FA',
    glowEffect: true,
    seasons: ['winter'],
    weatherConditions: ['snowy'],
    healthModifier: 1.2,
    trustModifier: 0.8,
    spawnChance: 0.05,
    specialAbilities: ['cold_immunity', 'stealth_master'],
    behaviorModifiers: {
      activityLevelModifier: 1.2
    }
  },

  // Golden variants (rare, golden coloring)
  goldenSquirrel: {
    id: 'golden_squirrel',
    baseSpecies: 'squirrel',
    name: 'Golden Squirrel',
    description: 'A magnificent squirrel with golden fur that shimmers in sunlight.',
    rarity: 'rare',
    colorOverride: '#FFD700',
    secondaryColorOverride: '#FFA500',
    sparkleEffect: true,
    seasons: ['autumn'],
    timeOfDay: ['day'],
    weatherConditions: ['sunny'],
    trustModifier: 1.2,
    curiosityModifier: 1.3,
    spawnChance: 0.03,
    specialAbilities: ['treasure_finder', 'luck_boost'],
    behaviorModifiers: {
      socialLevelModifier: 1.5
    }
  },

  goldenButterfly: {
    id: 'golden_butterfly',
    baseSpecies: 'butterfly',
    name: 'Monarch Butterfly',
    description: 'A stunning butterfly with golden wings that bring good fortune.',
    rarity: 'rare',
    colorOverride: '#FFD700',
    secondaryColorOverride: '#FF8C00',
    sparkleEffect: true,
    seasons: ['spring', 'summer'],
    weatherConditions: ['sunny'],
    trustModifier: 1.4,
    spawnChance: 0.08,
    specialAbilities: ['pollinator', 'weather_predictor']
  },

  // Shadow variants (dark, mysterious)
  shadowWolf: {
    id: 'shadow_wolf',
    baseSpecies: 'wolf',
    name: 'Shadow Wolf',
    description: 'A mysterious wolf that seems to blend with darkness itself.',
    rarity: 'legendary',
    colorOverride: '#2F2F2F',
    secondaryColorOverride: '#4B0082',
    glowEffect: true,
    timeOfDay: ['night'],
    weatherConditions: ['foggy'],
    seasons: ['autumn', 'winter'],
    minPlayerLevel: 10,
    healthModifier: 1.5,
    trustModifier: 0.5,
    spawnChance: 0.005,
    specialAbilities: ['shadow_step', 'pack_leader', 'fear_immunity'],
    behaviorModifiers: {
      fleeDistanceModifier: 1.5,
      socialLevelModifier: 1.2
    }
  },

  shadowBat: {
    id: 'shadow_bat',
    baseSpecies: 'bat',
    name: 'Void Bat',
    description: 'A bat that seems to absorb light, leaving only glowing eyes visible.',
    rarity: 'epic',
    colorOverride: '#000000',
    secondaryColorOverride: '#8A2BE2',
    glowEffect: true,
    timeOfDay: ['night'],
    seasons: ['autumn'],
    weatherConditions: ['stormy'],
    trustModifier: 0.7,
    curiosityModifier: 1.5,
    spawnChance: 0.02,
    specialAbilities: ['echolocation_master', 'night_vision']
  },

  // Crystal variants (magical, translucent)
  crystalDeer: {
    id: 'crystal_deer',
    baseSpecies: 'deer',
    name: 'Crystal Deer',
    description: 'A majestic deer with crystalline antlers that refract rainbow light.',
    rarity: 'legendary',
    colorOverride: '#E0E0E0',
    secondaryColorOverride: '#FFFFFF',
    glowEffect: true,
    sparkleEffect: true,
    seasons: ['winter'],
    timeOfDay: ['dawn'],
    weatherConditions: ['snowy'],
    minPlayerLevel: 15,
    healthModifier: 2.0,
    trustModifier: 0.3,
    spawnChance: 0.001,
    specialAbilities: ['healing_presence', 'wisdom_keeper', 'magic_immunity'],
    behaviorModifiers: {
      fleeDistanceModifier: 2.0,
      activityLevelModifier: 0.8
    }
  },

  // Fire variants (warm colors, high energy)
  firebird: {
    id: 'fire_bird',
    baseSpecies: 'bird',
    name: 'Phoenix Chick',
    description: 'A young phoenix with feathers that seem to flicker like flames.',
    rarity: 'legendary',
    colorOverride: '#FF4500',
    secondaryColorOverride: '#FFD700',
    glowEffect: true,
    sparkleEffect: true,
    seasons: ['summer'],
    timeOfDay: ['day'],
    weatherConditions: ['sunny'],
    minPlayerLevel: 20,
    healthModifier: 1.5,
    energyModifier: 2.0,
    trustModifier: 0.4,
    spawnChance: 0.002,
    specialAbilities: ['fire_immunity', 'regeneration', 'flight_master'],
    behaviorModifiers: {
      activityLevelModifier: 1.8
    }
  },

  // Seasonal exclusives
  springRabbit: {
    id: 'spring_rabbit',
    baseSpecies: 'rabbit',
    name: 'Flower Rabbit',
    description: 'A rabbit adorned with spring flowers that bloom on its fur.',
    rarity: 'uncommon',
    colorOverride: '#98FB98',
    secondaryColorOverride: '#FFB6C1',
    sparkleEffect: true,
    seasons: ['spring'],
    weatherConditions: ['sunny', 'rainy'],
    trustModifier: 1.3,
    spawnChance: 0.15,
    specialAbilities: ['flower_growth', 'seasonal_blessing']
  },

  autumnHedgehog: {
    id: 'autumn_hedgehog',
    baseSpecies: 'hedgehog',
    name: 'Autumn Hedgehog',
    description: 'A hedgehog whose spines change color like autumn leaves.',
    rarity: 'uncommon',
    colorOverride: '#D2691E',
    secondaryColorOverride: '#FF8C00',
    seasons: ['autumn'],
    trustModifier: 1.2,
    spawnChance: 0.12,
    specialAbilities: ['leaf_camouflage', 'acorn_finder']
  },

  winterOwl: {
    id: 'winter_owl',
    baseSpecies: 'owl',
    name: 'Snowy Owl',
    description: 'A magnificent owl with pristine white feathers and piercing blue eyes.',
    rarity: 'rare',
    colorOverride: '#FFFFFF',
    secondaryColorOverride: '#87CEEB',
    seasons: ['winter'],
    weatherConditions: ['snowy'],
    timeOfDay: ['night', 'dawn'],
    healthModifier: 1.3,
    trustModifier: 0.9,
    spawnChance: 0.06,
    specialAbilities: ['cold_immunity', 'silent_flight', 'wisdom_keeper']
  }
};

/**
 * Calculate if a rare variant should spawn based on conditions
 */
export function shouldSpawnRareVariant(
  variant: RareAnimalVariant,
  currentSeason: Season,
  currentWeather: WeatherCondition,
  currentTimeOfDay: 'day' | 'night' | 'dawn' | 'dusk',
  currentBiome: string,
  playerLevel: number = 1
): boolean {
  // Check minimum player level
  if (variant.minPlayerLevel && playerLevel < variant.minPlayerLevel) {
    return false;
  }

  // Check season requirement
  if (variant.seasons && !variant.seasons.includes(currentSeason)) {
    return false;
  }

  // Check weather requirement
  if (variant.weatherConditions && !variant.weatherConditions.includes(currentWeather)) {
    return false;
  }

  // Check time of day requirement
  if (variant.timeOfDay && !variant.timeOfDay.includes(currentTimeOfDay)) {
    return false;
  }

  // Check biome requirement
  if (variant.requiredBiomes && !variant.requiredBiomes.includes(currentBiome)) {
    return false;
  }

  // Roll for spawn chance
  return Math.random() < variant.spawnChance;
}

/**
 * Create a rare animal variant
 */
export function createRareAnimal(
  id: string,
  variantId: string,
  position: Position
): Animal | null {
  const variant = RARE_VARIANTS[variantId];
  if (!variant) {
    console.warn(`Unknown rare variant: ${variantId}`);
    return null;
  }

  // Create base animal
  const animal = createAnimal(id, variant.baseSpecies, position);

  // Apply rare variant modifications
  animal.name = variant.name;

  // Visual modifications
  if (variant.colorOverride) {
    animal.visual.color = variant.colorOverride;
  }
  if (variant.secondaryColorOverride) {
    animal.visual.secondaryColor = variant.secondaryColorOverride;
  }
  if (variant.patternOverride) {
    animal.visual.pattern = variant.patternOverride;
  }

  // Stat modifications
  if (variant.healthModifier) {
    animal.stats.maxHealth = Math.round(animal.stats.maxHealth * variant.healthModifier);
    animal.stats.health = animal.stats.maxHealth;
  }
  if (variant.energyModifier) {
    animal.stats.maxEnergy = Math.round(animal.stats.maxEnergy * variant.energyModifier);
    animal.stats.energy = animal.stats.maxEnergy;
  }
  if (variant.trustModifier) {
    animal.stats.trust = Math.round(animal.stats.trust * variant.trustModifier);
  }
  if (variant.curiosityModifier) {
    animal.stats.curiosity = Math.round(animal.stats.curiosity * variant.curiosityModifier);
  }

  // Behavior modifications
  if (variant.behaviorModifiers) {
    const mods = variant.behaviorModifiers;
    if (mods.fleeDistanceModifier) {
      animal.behavior.fleeDistance *= mods.fleeDistanceModifier;
    }
    if (mods.activityLevelModifier) {
      animal.behavior.activityLevel = Math.min(1, animal.behavior.activityLevel * mods.activityLevelModifier);
    }
    if (mods.socialLevelModifier) {
      animal.behavior.socialLevel = Math.min(1, animal.behavior.socialLevel * mods.socialLevelModifier);
    }
  }

  // Add rare variant metadata
  (animal as any).rareVariant = {
    id: variantId,
    name: variant.name,
    description: variant.description,
    rarity: variant.rarity,
    specialAbilities: variant.specialAbilities || [],
    glowEffect: variant.glowEffect || false,
    sparkleEffect: variant.sparkleEffect || false
  };

  return animal;
}

/**
 * Get all possible rare variants for a species
 */
export function getRareVariantsForSpecies(species: AnimalSpecies): RareAnimalVariant[] {
  return Object.values(RARE_VARIANTS).filter(variant => variant.baseSpecies === species);
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: RarityLevel): string {
  switch (rarity) {
    case 'uncommon': return '#32CD32'; // Lime green
    case 'rare': return '#4169E1'; // Royal blue
    case 'epic': return '#9932CC'; // Dark orchid
    case 'legendary': return '#FFD700'; // Gold
    default: return '#FFFFFF'; // White
  }
}

/**
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: RarityLevel): string {
  switch (rarity) {
    case 'uncommon': return 'Uncommon';
    case 'rare': return 'Rare';
    case 'epic': return 'Epic';
    case 'legendary': return 'Legendary';
    default: return 'Common';
  }
}

/**
 * Calculate rare variant spawn rate modifiers based on player progress
 */
export function getSpawnRateModifier(playerLevel: number, discoveredRareCount: number): number {
  // Base modifier starts at 0.5x and increases with player progress
  let modifier = 0.5 + (playerLevel * 0.02); // +2% per level

  // Bonus for discovering rare animals (encourages continued exploration)
  modifier += discoveredRareCount * 0.01; // +1% per rare discovered

  // Cap at 2x normal spawn rate
  return Math.min(2.0, modifier);
}

/**
 * Check if animal is a rare variant
 */
export function isRareAnimal(animal: Animal): boolean {
  return !!(animal as any).rareVariant;
}

/**
 * Get rare variant info from animal
 */
export function getRareVariantInfo(animal: Animal): any {
  return (animal as any).rareVariant || null;
}

/**
 * Get seasonal spawn bonuses
 */
export function getSeasonalSpawnBonus(season: Season): Record<string, number> {
  switch (season) {
    case 'spring':
      return {
        springRabbit: 2.0,
        goldenButterfly: 1.5,
        firebird: 0.5
      };
    case 'summer':
      return {
        goldenButterfly: 2.0,
        firebird: 3.0,
        crystalDeer: 0.2
      };
    case 'autumn':
      return {
        goldenSquirrel: 3.0,
        autumnHedgehog: 2.5,
        shadowWolf: 1.5,
        shadowBat: 2.0
      };
    case 'winter':
      return {
        albinoFox: 4.0,
        crystalDeer: 2.0,
        winterOwl: 3.0,
        springRabbit: 0.1
      };
    default:
      return {};
  }
}

export default {
  RARE_VARIANTS,
  shouldSpawnRareVariant,
  createRareAnimal,
  getRareVariantsForSpecies,
  getRarityColor,
  getRarityDisplayName,
  getSpawnRateModifier,
  isRareAnimal,
  getRareVariantInfo,
  getSeasonalSpawnBonus
};