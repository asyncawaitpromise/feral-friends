// Habitat System
// Manages biome-specific animal spawning, behavior, and environmental interactions

import { Animal, AnimalSpecies, isPositionSuitableForSpecies } from './Animal';
import { Position } from '../types/game';
import { RARE_VARIANTS, shouldSpawnRareVariant, createRareAnimal } from './RareAnimals';

export type BiomeType = 
  | 'temperate' | 'forest' | 'meadow' | 'grassland' | 'mountain' 
  | 'water' | 'river' | 'swamp' | 'cave' | 'flower' | 'desert' | 'tundra';

export type HabitatFeature = 
  | 'trees' | 'bushes' | 'rocks' | 'water_source' | 'flowers' 
  | 'tall_grass' | 'caves' | 'cliffs' | 'streams' | 'ponds';

export interface BiomeData {
  type: BiomeType;
  name: string;
  description: string;
  
  // Environmental conditions
  temperature: number; // -10 to 40 Celsius
  humidity: number; // 0-100%
  vegetation: number; // 0-100% coverage
  waterAvailability: number; // 0-100%
  
  // Features present in this biome
  features: HabitatFeature[];
  
  // Spawn modifiers for different animal types
  spawnModifiers: Record<AnimalSpecies, number>;
  
  // Maximum animals that can be supported
  carryingCapacity: Record<AnimalSpecies, number>;
  
  // Food availability affects happiness and spawning
  foodAvailability: Partial<Record<AnimalSpecies, number>>;
  
  // Shelter quality affects safety and weather resistance
  shelterQuality: number; // 0-100%
  
  // Seasonal variations
  seasonalModifiers: {
    spring: Partial<BiomeData>;
    summer: Partial<BiomeData>;
    autumn: Partial<BiomeData>;
    winter: Partial<BiomeData>;
  };
}

export interface HabitatZone {
  id: string;
  biome: BiomeType;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  features: HabitatFeature[];
  quality: number; // 0-100%, affects spawning and animal happiness
  disturbance: number; // 0-100%, human activity level
  resources: {
    food: number; // 0-100%
    water: number; // 0-100%
    shelter: number; // 0-100%
  };
  connectedZones: string[]; // IDs of adjacent zones for migration
}

// Biome definitions
export const BIOME_DATA: Record<BiomeType, BiomeData> = {
  temperate: {
    type: 'temperate',
    name: 'Temperate Zone',
    description: 'A balanced ecosystem with moderate climate and diverse vegetation.',
    temperature: 15,
    humidity: 60,
    vegetation: 70,
    waterAvailability: 60,
    features: ['trees', 'bushes', 'tall_grass', 'streams'],
    spawnModifiers: {
      rabbit: 1.0, bird: 1.0, squirrel: 1.0, fox: 1.0, deer: 1.0,
      butterfly: 1.0, frog: 0.8, turtle: 0.8, owl: 1.0, hawk: 1.0,
      mouse: 1.0, raccoon: 1.0, bear: 0.8, wolf: 0.8, otter: 0.6,
      hedgehog: 1.0, bat: 1.0
    },
    carryingCapacity: {
      rabbit: 8, bird: 12, squirrel: 6, fox: 3, deer: 4,
      butterfly: 15, frog: 4, turtle: 2, owl: 2, hawk: 2,
      mouse: 10, raccoon: 4, bear: 1, wolf: 2, otter: 2,
      hedgehog: 4, bat: 8
    },
    foodAvailability: {
      rabbit: 80, bird: 75, squirrel: 85, fox: 70, deer: 75,
      butterfly: 90, frog: 60, turtle: 65, owl: 70, hawk: 65,
      mouse: 85, raccoon: 80, bear: 60, wolf: 55, otter: 50,
      hedgehog: 70, bat: 75
    },
    shelterQuality: 70,
    seasonalModifiers: {
      spring: { temperature: 12, vegetation: 90, foodAvailability: { butterfly: 100 } },
      summer: { temperature: 22, humidity: 70, waterAvailability: 50 },
      autumn: { temperature: 10, vegetation: 60, foodAvailability: { squirrel: 95 } },
      winter: { temperature: 2, vegetation: 40, foodAvailability: { rabbit: 60 } }
    }
  },

  forest: {
    type: 'forest',
    name: 'Dense Forest',
    description: 'A thick woodland with towering trees and rich undergrowth.',
    temperature: 12,
    humidity: 80,
    vegetation: 95,
    waterAvailability: 70,
    features: ['trees', 'bushes', 'streams', 'caves'],
    spawnModifiers: {
      rabbit: 0.8, bird: 1.5, squirrel: 2.0, fox: 1.5, deer: 1.8,
      butterfly: 1.2, frog: 1.0, turtle: 0.5, owl: 2.0, hawk: 1.2,
      mouse: 1.3, raccoon: 1.8, bear: 2.0, wolf: 1.5, otter: 0.8,
      hedgehog: 1.5, bat: 1.8
    },
    carryingCapacity: {
      rabbit: 6, bird: 18, squirrel: 12, fox: 5, deer: 8,
      butterfly: 20, frog: 6, turtle: 1, owl: 4, hawk: 3,
      mouse: 15, raccoon: 8, bear: 3, wolf: 4, otter: 3,
      hedgehog: 8, bat: 15
    },
    foodAvailability: {
      rabbit: 70, bird: 95, squirrel: 100, fox: 85, deer: 90,
      butterfly: 85, frog: 70, turtle: 40, owl: 90, hawk: 80,
      mouse: 90, raccoon: 95, bear: 85, wolf: 75, otter: 60,
      hedgehog: 85, bat: 90
    },
    shelterQuality: 90,
    seasonalModifiers: {
      spring: { temperature: 8, vegetation: 100, foodAvailability: { bird: 100 } },
      summer: { temperature: 18, humidity: 85 },
      autumn: { temperature: 6, foodAvailability: { deer: 100, bear: 95 } },
      winter: { temperature: -2, vegetation: 70, foodAvailability: { owl: 95 } }
    }
  },

  meadow: {
    type: 'meadow',
    name: 'Open Meadow',
    description: 'A sunny grassland dotted with wildflowers and scattered trees.',
    temperature: 18,
    humidity: 50,
    vegetation: 60,
    waterAvailability: 40,
    features: ['tall_grass', 'flowers', 'bushes'],
    spawnModifiers: {
      rabbit: 2.0, bird: 1.3, squirrel: 0.6, fox: 1.0, deer: 1.5,
      butterfly: 3.0, frog: 0.3, turtle: 0.2, owl: 0.8, hawk: 1.8,
      mouse: 1.8, raccoon: 0.5, bear: 0.3, wolf: 0.7, otter: 0.2,
      hedgehog: 1.2, bat: 0.5
    },
    carryingCapacity: {
      rabbit: 15, bird: 20, squirrel: 3, fox: 4, deer: 10,
      butterfly: 30, frog: 1, turtle: 0, owl: 2, hawk: 4,
      mouse: 20, raccoon: 2, bear: 0, wolf: 2, otter: 0,
      hedgehog: 6, bat: 3
    },
    foodAvailability: {
      rabbit: 95, bird: 80, squirrel: 50, fox: 65, deer: 85,
      butterfly: 100, frog: 30, turtle: 20, owl: 60, hawk: 70,
      mouse: 90, raccoon: 40, bear: 30, wolf: 45, otter: 20,
      hedgehog: 60, bat: 50
    },
    shelterQuality: 40,
    seasonalModifiers: {
      spring: { temperature: 15, vegetation: 80, foodAvailability: { butterfly: 100, rabbit: 100 } },
      summer: { temperature: 25, humidity: 40, waterAvailability: 30 },
      autumn: { temperature: 12, vegetation: 45, foodAvailability: { mouse: 100 } },
      winter: { temperature: 0, vegetation: 20, foodAvailability: { rabbit: 70 } }
    }
  },

  water: {
    type: 'water',
    name: 'Aquatic Zone',
    description: 'Lakes, ponds, and wetlands rich with aquatic life.',
    temperature: 14,
    humidity: 100,
    vegetation: 40,
    waterAvailability: 100,
    features: ['water_source', 'ponds', 'tall_grass'],
    spawnModifiers: {
      rabbit: 0.3, bird: 1.8, squirrel: 0.1, fox: 0.8, deer: 1.2,
      butterfly: 1.5, frog: 3.0, turtle: 3.0, owl: 1.0, hawk: 1.5,
      mouse: 0.5, raccoon: 2.0, bear: 1.5, wolf: 1.0, otter: 4.0,
      hedgehog: 0.2, bat: 1.2
    },
    carryingCapacity: {
      rabbit: 2, bird: 15, squirrel: 0, fox: 2, deer: 3,
      butterfly: 18, frog: 20, turtle: 8, owl: 3, hawk: 3,
      mouse: 3, raccoon: 6, bear: 2, wolf: 2, otter: 12,
      hedgehog: 1, bat: 8
    },
    foodAvailability: {
      rabbit: 40, bird: 85, squirrel: 20, fox: 70, deer: 60,
      butterfly: 70, frog: 95, turtle: 90, owl: 75, hawk: 80,
      mouse: 50, raccoon: 90, bear: 80, wolf: 60, otter: 100,
      hedgehog: 30, bat: 80
    },
    shelterQuality: 60,
    seasonalModifiers: {
      spring: { temperature: 10, foodAvailability: { frog: 100, otter: 100 } },
      summer: { temperature: 20, waterAvailability: 100 },
      autumn: { temperature: 8, foodAvailability: { turtle: 100 } },
      winter: { temperature: 2, waterAvailability: 80, foodAvailability: { otter: 80 } }
    }
  },

  mountain: {
    type: 'mountain',
    name: 'Rocky Mountains',
    description: 'High altitude terrain with rocky outcrops and hardy vegetation.',
    temperature: 5,
    humidity: 40,
    vegetation: 30,
    waterAvailability: 30,
    features: ['rocks', 'cliffs', 'caves', 'streams'],
    spawnModifiers: {
      rabbit: 0.6, bird: 1.2, squirrel: 0.8, fox: 1.8, deer: 1.0,
      butterfly: 0.5, frog: 0.2, turtle: 0.1, owl: 1.8, hawk: 2.5,
      mouse: 1.0, raccoon: 0.8, bear: 2.5, wolf: 2.0, otter: 0.3,
      hedgehog: 0.8, bat: 1.5
    },
    carryingCapacity: {
      rabbit: 4, bird: 8, squirrel: 4, fox: 6, deer: 4,
      butterfly: 5, frog: 1, turtle: 0, owl: 6, hawk: 8,
      mouse: 8, raccoon: 3, bear: 4, wolf: 6, otter: 1,
      hedgehog: 3, bat: 10
    },
    foodAvailability: {
      rabbit: 50, bird: 60, squirrel: 45, fox: 75, deer: 55,
      butterfly: 40, frog: 20, turtle: 10, owl: 85, hawk: 90,
      mouse: 55, raccoon: 50, bear: 70, wolf: 80, otter: 30,
      hedgehog: 40, bat: 70
    },
    shelterQuality: 85,
    seasonalModifiers: {
      spring: { temperature: 2, vegetation: 40, foodAvailability: { hawk: 95 } },
      summer: { temperature: 12, humidity: 50 },
      autumn: { temperature: -1, foodAvailability: { bear: 85, wolf: 90 } },
      winter: { temperature: -8, vegetation: 15, foodAvailability: { owl: 90 } }
    }
  },

  cave: {
    type: 'cave',
    name: 'Underground Caves',
    description: 'Dark underground chambers providing shelter and unique ecosystems.',
    temperature: 8,
    humidity: 90,
    vegetation: 5,
    waterAvailability: 20,
    features: ['caves', 'rocks'],
    spawnModifiers: {
      rabbit: 0.2, bird: 0.1, squirrel: 0.1, fox: 0.8, deer: 0.1,
      butterfly: 0.0, frog: 0.5, turtle: 0.3, owl: 1.5, hawk: 0.1,
      mouse: 2.0, raccoon: 1.5, bear: 3.0, wolf: 0.8, otter: 0.2,
      hedgehog: 1.2, bat: 5.0
    },
    carryingCapacity: {
      rabbit: 1, bird: 0, squirrel: 0, fox: 2, deer: 0,
      butterfly: 0, frog: 2, turtle: 1, owl: 3, hawk: 0,
      mouse: 12, raccoon: 4, bear: 2, wolf: 2, otter: 1,
      hedgehog: 4, bat: 25
    },
    foodAvailability: {
      rabbit: 20, bird: 10, squirrel: 15, fox: 60, deer: 15,
      butterfly: 0, frog: 40, turtle: 30, owl: 70, hawk: 20,
      mouse: 70, raccoon: 60, bear: 40, wolf: 50, otter: 25,
      hedgehog: 50, bat: 90
    },
    shelterQuality: 100,
    seasonalModifiers: {
      spring: { temperature: 8, foodAvailability: { bat: 95 } },
      summer: { temperature: 8, humidity: 95 },
      autumn: { temperature: 8, foodAvailability: { bear: 60 } },
      winter: { temperature: 8, foodAvailability: { bat: 100 } }
    }
  },

  grassland: {
    type: 'grassland',
    name: 'Rolling Grasslands',
    description: 'Vast open plains with scattered shrubs and seasonal flowers.',
    temperature: 16,
    humidity: 45,
    vegetation: 50,
    waterAvailability: 35,
    features: ['tall_grass', 'bushes'],
    spawnModifiers: {
      rabbit: 1.8, bird: 1.5, squirrel: 0.3, fox: 1.2, deer: 2.0,
      butterfly: 2.0, frog: 0.2, turtle: 0.1, owl: 1.0, hawk: 2.0,
      mouse: 2.5, raccoon: 0.3, bear: 0.2, wolf: 1.5, otter: 0.1,
      hedgehog: 1.8, bat: 0.8
    },
    carryingCapacity: {
      rabbit: 20, bird: 25, squirrel: 2, fox: 6, deer: 15,
      butterfly: 35, frog: 1, turtle: 0, owl: 4, hawk: 8,
      mouse: 30, raccoon: 1, bear: 0, wolf: 4, otter: 0,
      hedgehog: 10, bat: 5
    },
    foodAvailability: {
      rabbit: 90, bird: 75, squirrel: 40, fox: 70, deer: 80,
      butterfly: 85, frog: 25, turtle: 15, owl: 65, hawk: 80,
      mouse: 95, raccoon: 35, bear: 25, wolf: 60, otter: 15,
      hedgehog: 70, bat: 55
    },
    shelterQuality: 25,
    seasonalModifiers: {
      spring: { temperature: 13, vegetation: 70, foodAvailability: { deer: 90, mouse: 100 } },
      summer: { temperature: 23, humidity: 35, waterAvailability: 25 },
      autumn: { temperature: 10, vegetation: 35, foodAvailability: { hawk: 90 } },
      winter: { temperature: -2, vegetation: 15, foodAvailability: { rabbit: 60 } }
    }
  },

  swamp: {
    type: 'swamp',
    name: 'Wetland Swamp',
    description: 'Murky wetlands with dense vegetation and abundant aquatic life.',
    temperature: 16,
    humidity: 95,
    vegetation: 80,
    waterAvailability: 90,
    features: ['water_source', 'tall_grass', 'bushes'],
    spawnModifiers: {
      rabbit: 0.4, bird: 1.2, squirrel: 0.2, fox: 0.6, deer: 0.5,
      butterfly: 1.8, frog: 4.0, turtle: 2.5, owl: 1.3, hawk: 0.8,
      mouse: 0.8, raccoon: 2.5, bear: 1.0, wolf: 0.5, otter: 3.0,
      hedgehog: 0.3, bat: 2.0
    },
    carryingCapacity: {
      rabbit: 3, bird: 12, squirrel: 1, fox: 2, deer: 2,
      butterfly: 25, frog: 30, turtle: 12, owl: 4, hawk: 2,
      mouse: 5, raccoon: 8, bear: 1, wolf: 1, otter: 15,
      hedgehog: 2, bat: 12
    },
    foodAvailability: {
      rabbit: 45, bird: 80, squirrel: 30, fox: 65, deer: 50,
      butterfly: 75, frog: 100, turtle: 95, owl: 80, hawk: 70,
      mouse: 60, raccoon: 85, bear: 70, wolf: 55, otter: 95,
      hedgehog: 40, bat: 85
    },
    shelterQuality: 70,
    seasonalModifiers: {
      spring: { temperature: 12, foodAvailability: { frog: 100, turtle: 100 } },
      summer: { temperature: 22, humidity: 100 },
      autumn: { temperature: 10, foodAvailability: { otter: 100 } },
      winter: { temperature: 4, waterAvailability: 70, foodAvailability: { frog: 80 } }
    }
  },

  flower: {
    type: 'flower',
    name: 'Flower Fields',
    description: 'Colorful meadows bursting with diverse wildflowers and pollinators.',
    temperature: 20,
    humidity: 55,
    vegetation: 85,
    waterAvailability: 50,
    features: ['flowers', 'tall_grass'],
    spawnModifiers: {
      rabbit: 1.5, bird: 2.0, squirrel: 0.8, fox: 0.8, deer: 1.2,
      butterfly: 5.0, frog: 0.5, turtle: 0.2, owl: 0.5, hawk: 1.0,
      mouse: 1.5, raccoon: 0.6, bear: 0.4, wolf: 0.3, otter: 0.3,
      hedgehog: 1.0, bat: 0.8
    },
    carryingCapacity: {
      rabbit: 12, bird: 30, squirrel: 4, fox: 3, deer: 6,
      butterfly: 50, frog: 2, turtle: 1, owl: 2, hawk: 3,
      mouse: 15, raccoon: 3, bear: 1, wolf: 1, otter: 1,
      hedgehog: 5, bat: 5
    },
    foodAvailability: {
      rabbit: 85, bird: 90, squirrel: 60, fox: 60, deer: 75,
      butterfly: 100, frog: 40, turtle: 30, owl: 55, hawk: 65,
      mouse: 80, raccoon: 50, bear: 40, wolf: 35, otter: 30,
      hedgehog: 65, bat: 60
    },
    shelterQuality: 30,
    seasonalModifiers: {
      spring: { temperature: 17, vegetation: 100, foodAvailability: { butterfly: 100, bird: 100 } },
      summer: { temperature: 26, humidity: 45, foodAvailability: { butterfly: 100 } },
      autumn: { temperature: 14, vegetation: 60, foodAvailability: { rabbit: 90 } },
      winter: { temperature: 2, vegetation: 20, foodAvailability: { butterfly: 20 } }
    }
  },

  river: {
    type: 'river',
    name: 'Flowing Rivers',
    description: 'Fast-flowing waterways with rocky banks and riparian vegetation.',
    temperature: 12,
    humidity: 85,
    vegetation: 60,
    waterAvailability: 100,
    features: ['water_source', 'streams', 'rocks'],
    spawnModifiers: {
      rabbit: 0.5, bird: 1.5, squirrel: 0.4, fox: 1.0, deer: 1.3,
      butterfly: 1.2, frog: 2.0, turtle: 1.8, owl: 1.2, hawk: 1.3,
      mouse: 0.8, raccoon: 2.8, bear: 2.0, wolf: 1.2, otter: 5.0,
      hedgehog: 0.5, bat: 1.5
    },
    carryingCapacity: {
      rabbit: 4, bird: 18, squirrel: 2, fox: 4, deer: 6,
      butterfly: 15, frog: 15, turtle: 8, owl: 4, hawk: 4,
      mouse: 6, raccoon: 10, bear: 3, wolf: 3, otter: 20,
      hedgehog: 3, bat: 10
    },
    foodAvailability: {
      rabbit: 50, bird: 85, squirrel: 40, fox: 75, deer: 70,
      butterfly: 70, frog: 90, turtle: 85, owl: 80, hawk: 85,
      mouse: 65, raccoon: 95, bear: 90, wolf: 70, otter: 100,
      hedgehog: 45, bat: 80
    },
    shelterQuality: 55,
    seasonalModifiers: {
      spring: { temperature: 8, foodAvailability: { otter: 100, bear: 95 } },
      summer: { temperature: 18, waterAvailability: 100 },
      autumn: { temperature: 6, foodAvailability: { raccoon: 100 } },
      winter: { temperature: 0, waterAvailability: 80, foodAvailability: { otter: 90 } }
    }
  },

  desert: {
    type: 'desert',
    name: 'Arid Desert',
    description: 'Hot, dry landscape with sparse vegetation and extreme conditions.',
    temperature: 30,
    humidity: 15,
    vegetation: 10,
    waterAvailability: 5,
    features: ['rocks'],
    spawnModifiers: {
      rabbit: 0.3, bird: 0.8, squirrel: 0.1, fox: 1.5, deer: 0.2,
      butterfly: 0.2, frog: 0.0, turtle: 0.1, owl: 1.2, hawk: 1.8,
      mouse: 1.5, raccoon: 0.2, bear: 0.1, wolf: 0.8, otter: 0.0,
      hedgehog: 0.5, bat: 0.8
    },
    carryingCapacity: {
      rabbit: 2, bird: 5, squirrel: 0, fox: 4, deer: 1,
      butterfly: 1, frog: 0, turtle: 0, owl: 3, hawk: 5,
      mouse: 8, raccoon: 1, bear: 0, wolf: 2, otter: 0,
      hedgehog: 2, bat: 4
    },
    foodAvailability: {
      rabbit: 30, bird: 40, squirrel: 20, fox: 60, deer: 25,
      butterfly: 15, frog: 0, turtle: 10, owl: 70, hawk: 80,
      mouse: 50, raccoon: 25, bear: 15, wolf: 55, otter: 0,
      hedgehog: 35, bat: 50
    },
    shelterQuality: 40,
    seasonalModifiers: {
      spring: { temperature: 25, humidity: 20, vegetation: 15 },
      summer: { temperature: 38, humidity: 10, waterAvailability: 2 },
      autumn: { temperature: 22, humidity: 18 },
      winter: { temperature: 15, humidity: 25, waterAvailability: 10 }
    }
  },

  tundra: {
    type: 'tundra',
    name: 'Arctic Tundra',
    description: 'Cold, treeless landscape with permafrost and hardy wildlife.',
    temperature: -5,
    humidity: 50,
    vegetation: 15,
    waterAvailability: 20,
    features: ['rocks'],
    spawnModifiers: {
      rabbit: 1.2, bird: 0.8, squirrel: 0.2, fox: 2.0, deer: 0.8,
      butterfly: 0.1, frog: 0.1, turtle: 0.0, owl: 2.0, hawk: 1.5,
      mouse: 1.8, raccoon: 0.3, bear: 1.8, wolf: 2.5, otter: 0.5,
      hedgehog: 0.2, bat: 0.3
    },
    carryingCapacity: {
      rabbit: 6, bird: 4, squirrel: 1, fox: 8, deer: 3,
      butterfly: 0, frog: 0, turtle: 0, owl: 6, hawk: 4,
      mouse: 12, raccoon: 1, bear: 3, wolf: 8, otter: 2,
      hedgehog: 1, bat: 2
    },
    foodAvailability: {
      rabbit: 40, bird: 35, squirrel: 25, fox: 70, deer: 35,
      butterfly: 5, frog: 5, turtle: 0, owl: 80, hawk: 75,
      mouse: 45, raccoon: 30, bear: 55, wolf: 75, otter: 40,
      hedgehog: 25, bat: 30
    },
    shelterQuality: 30,
    seasonalModifiers: {
      spring: { temperature: -2, vegetation: 25, waterAvailability: 30 },
      summer: { temperature: 8, humidity: 60, vegetation: 30 },
      autumn: { temperature: -8, vegetation: 10 },
      winter: { temperature: -15, humidity: 40, waterAvailability: 10 }
    }
  }
};

// Active habitat zones in the game world
export const activeZones: Map<string, HabitatZone> = new Map();

/**
 * Create a new habitat zone
 */
export function createHabitatZone(
  id: string,
  biome: BiomeType,
  bounds: { x: number; y: number; width: number; height: number },
  quality: number = 75
): HabitatZone {
  const biomeData = BIOME_DATA[biome];
  
  const zone: HabitatZone = {
    id,
    biome,
    bounds,
    features: [...biomeData.features],
    quality,
    disturbance: 10, // Low disturbance by default
    resources: {
      food: biomeData.vegetation * (quality / 100),
      water: biomeData.waterAvailability * (quality / 100),
      shelter: biomeData.shelterQuality * (quality / 100)
    },
    connectedZones: []
  };

  activeZones.set(id, zone);
  return zone;
}

/**
 * Get the habitat zone for a given position
 */
export function getZoneAtPosition(position: Position): HabitatZone | null {
  for (const zone of activeZones.values()) {
    if (
      position.x >= zone.bounds.x &&
      position.x <= zone.bounds.x + zone.bounds.width &&
      position.y >= zone.bounds.y &&
      position.y <= zone.bounds.y + zone.bounds.height
    ) {
      return zone;
    }
  }
  return null;
}

/**
 * Calculate spawn probability for a species in a zone
 */
export function getSpawnProbability(
  species: AnimalSpecies,
  zone: HabitatZone,
  currentPopulation: number,
  season: string = 'spring'
): number {
  const biomeData = BIOME_DATA[zone.biome];
  const baseModifier = biomeData.spawnModifiers[species] || 0;
  const carryingCapacity = biomeData.carryingCapacity[species] || 0;
  
  if (carryingCapacity === 0) return 0;
  
  // Population pressure reduces spawn rate
  const populationPressure = Math.max(0, 1 - (currentPopulation / carryingCapacity));
  
  // Zone quality affects spawning
  const qualityModifier = zone.quality / 100;
  
  // Disturbance reduces spawning
  const disturbanceModifier = Math.max(0.1, 1 - (zone.disturbance / 100));
  
  // Resource availability affects spawning
  const foodModifier = zone.resources.food / 100;
  const waterModifier = zone.resources.water / 100;
  const resourceModifier = (foodModifier + waterModifier) / 2;
  
  // Seasonal modifications (simplified)
  let seasonalModifier = 1.0;
  const seasonalData = biomeData.seasonalModifiers[season as keyof typeof biomeData.seasonalModifiers];
  if (seasonalData?.foodAvailability?.[species]) {
    seasonalModifier = seasonalData.foodAvailability[species] / 100;
  }

  return baseModifier * populationPressure * qualityModifier * disturbanceModifier * resourceModifier * seasonalModifier;
}

/**
 * Update zone resources based on animal population and activity
 */
export function updateZoneResources(zone: HabitatZone, animals: Animal[]): void {
  const animalsInZone = animals.filter(animal => {
    const animalZone = getZoneAtPosition(animal.position);
    return animalZone?.id === zone.id;
  });

  // Calculate resource consumption
  let foodConsumption = 0;
  let waterConsumption = 0;
  
  animalsInZone.forEach(animal => {
    const biomeData = BIOME_DATA[zone.biome];
    const baseFood = biomeData.foodAvailability[animal.species] || 0;
    
    // Larger animals consume more resources
    const sizeMultiplier = animal.visual.size === 'large' ? 2 : 
                          animal.visual.size === 'medium' ? 1.5 : 1;
    
    foodConsumption += (baseFood / 100) * sizeMultiplier * 0.1;
    waterConsumption += sizeMultiplier * 0.05;
  });

  // Natural regeneration
  const baseRegenRate = 0.02; // 2% per update
  const qualityRegenRate = baseRegenRate * (zone.quality / 100);
  
  // Update resources
  zone.resources.food = Math.max(0, zone.resources.food - foodConsumption);
  zone.resources.water = Math.max(0, zone.resources.water - waterConsumption);
  
  // Regenerate resources
  zone.resources.food = Math.min(100, zone.resources.food + qualityRegenRate * 100);
  zone.resources.water = Math.min(100, zone.resources.water + qualityRegenRate * 80);
  
  // Update zone quality based on resource availability
  const avgResources = (zone.resources.food + zone.resources.water + zone.resources.shelter) / 3;
  zone.quality = Math.max(10, Math.min(100, avgResources * 0.8 + zone.quality * 0.2));
}

/**
 * Get suitable zones for a species
 */
export function getSuitableZones(species: AnimalSpecies): HabitatZone[] {
  return Array.from(activeZones.values()).filter(zone => {
    const biomeData = BIOME_DATA[zone.biome];
    return (biomeData.spawnModifiers[species] || 0) > 0.5;
  });
}

/**
 * Calculate animal happiness modifier based on habitat
 */
export function getHabitatHappinessModifier(animal: Animal, zone: HabitatZone): number {
  const biomeData = BIOME_DATA[zone.biome];
  const baseModifier = biomeData.spawnModifiers[animal.species] || 0.5;
  const foodAvailability = biomeData.foodAvailability[animal.species] || 50;
  const qualityModifier = zone.quality / 100;
  
  // Animals are happier in their preferred habitats
  return baseModifier * (foodAvailability / 100) * qualityModifier;
}

/**
 * Check if rare animals should spawn in zone
 */
export function shouldSpawnRareInZone(
  zone: HabitatZone,
  _species: AnimalSpecies,
  _season: string,
  _weather: string,
  _timeOfDay: string
): boolean {
  // Higher quality zones have better chance for rare spawns
  const qualityBonus = zone.quality / 100;
  const lowDisturbanceBonus = Math.max(0, (100 - zone.disturbance) / 100);
  
  const rareChance = 0.01 * qualityBonus * lowDisturbanceBonus;
  
  return Math.random() < rareChance;
}

/**
 * Get migration corridors between zones
 */
export function getMigrationCorridor(fromZoneId: string, toZoneId: string): Position[] {
  const fromZone = activeZones.get(fromZoneId);
  const toZone = activeZones.get(toZoneId);
  
  if (!fromZone || !toZone) return [];
  
  // Simple path between zone centers
  const fromCenter = {
    x: fromZone.bounds.x + fromZone.bounds.width / 2,
    y: fromZone.bounds.y + fromZone.bounds.height / 2
  };
  
  const toCenter = {
    x: toZone.bounds.x + toZone.bounds.width / 2,
    y: toZone.bounds.y + toZone.bounds.height / 2
  };
  
  // Create waypoints along the path
  const waypoints: Position[] = [];
  const steps = 5;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    waypoints.push({
      x: fromCenter.x + (toCenter.x - fromCenter.x) * t,
      y: fromCenter.y + (toCenter.y - fromCenter.y) * t
    });
  }
  
  return waypoints;
}

/**
 * Connect two zones for migration
 */
export function connectZones(zoneId1: string, zoneId2: string): void {
  const zone1 = activeZones.get(zoneId1);
  const zone2 = activeZones.get(zoneId2);
  
  if (zone1 && !zone1.connectedZones.includes(zoneId2)) {
    zone1.connectedZones.push(zoneId2);
  }
  
  if (zone2 && !zone2.connectedZones.includes(zoneId1)) {
    zone2.connectedZones.push(zoneId1);
  }
}

/**
 * Get zone statistics for debugging/monitoring
 */
export function getZoneStats(zoneId: string, animals: Animal[]): any {
  const zone = activeZones.get(zoneId);
  if (!zone) return null;
  
  const animalsInZone = animals.filter(animal => {
    const animalZone = getZoneAtPosition(animal.position);
    return animalZone?.id === zoneId;
  });
  
  const speciesCounts: Record<AnimalSpecies, number> = {} as any;
  animalsInZone.forEach(animal => {
    speciesCounts[animal.species] = (speciesCounts[animal.species] || 0) + 1;
  });
  
  return {
    zone,
    totalAnimals: animalsInZone.length,
    speciesCounts,
    resourceUtilization: {
      food: Math.max(0, 100 - zone.resources.food),
      water: Math.max(0, 100 - zone.resources.water)
    }
  };
}

export default {
  BIOME_DATA,
  activeZones,
  createHabitatZone,
  getZoneAtPosition,
  getSpawnProbability,
  updateZoneResources,
  getSuitableZones,
  getHabitatHappinessModifier,
  shouldSpawnRareInZone,
  getMigrationCorridor,
  connectZones,
  getZoneStats
};