// Map Objects System
// Handles interactive environment elements like trees, rocks, flowers, etc.

import { Position } from '../types/game';

export type ObjectType = 
  | 'tree' 
  | 'rock' 
  | 'flower' 
  | 'bush' 
  | 'water_source' 
  | 'landmark' 
  | 'decoration'
  | 'crystal'
  | 'log'
  | 'mushroom'
  | 'berry_bush'
  | 'ancient_stone';

export type InteractionType = 
  | 'examine'
  | 'harvest'
  | 'rest'
  | 'climb'
  | 'drink'
  | 'collect'
  | 'touch'
  | 'none';

export interface MapObject {
  id: string;
  type: ObjectType;
  position: Position;
  size: { width: number; height: number };
  walkable: boolean;
  interactable: boolean;
  sprite?: string;
  
  // Visual properties
  visual: {
    color: string;
    secondaryColor?: string;
    pattern?: 'solid' | 'striped' | 'dotted' | 'gradient';
    opacity?: number;
    zIndex?: number; // For depth sorting
    animation?: 'none' | 'sway' | 'pulse' | 'sparkle' | 'bob';
    size?: 'small' | 'medium' | 'large';
  };
  
  // Interaction properties
  interaction: {
    type: InteractionType;
    radius: number; // How close player needs to be
    prompt: string; // Text shown to player
    cooldown?: number; // Milliseconds between interactions
    requirements?: {
      level?: number;
      items?: string[];
      achievements?: string[];
    };
  };
  
  // Game mechanics
  mechanics: {
    blocksMovement: boolean;
    blocksVision?: boolean;
    providesShade?: boolean;
    spawnPoint?: boolean; // Can animals spawn near this?
    soundEffect?: string;
    particles?: string[];
  };
  
  // Metadata
  metadata: {
    name: string;
    description: string;
    lore?: string;
    discoverMessage?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
    biome?: string[];
    season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  };
}

export interface ObjectInteractionResult {
  success: boolean;
  message: string;
  rewards?: {
    experience?: number;
    items?: string[];
    discoveries?: string[];
  };
  effects?: {
    playerEffect?: string;
    worldEffect?: string;
    duration?: number;
  };
  cooldownUntil?: number;
}

// Predefined object templates
export const OBJECT_TEMPLATES: Record<string, Partial<MapObject>> = {
  // Trees
  oak_tree: {
    type: 'tree',
    size: { width: 1, height: 1 },
    walkable: false,
    interactable: true,
    visual: {
      color: '#15803d',
      secondaryColor: '#92400e',
      pattern: 'solid',
      size: 'large',
      animation: 'sway',
      zIndex: 3
    },
    interaction: {
      type: 'examine',
      radius: 1,
      prompt: 'Examine the mighty oak tree'
    },
    mechanics: {
      blocksMovement: true,
      blocksVision: false,
      providesShade: true,
      spawnPoint: true,
      soundEffect: 'rustling_leaves'
    },
    metadata: {
      name: 'Ancient Oak',
      description: 'A sturdy oak tree with a thick trunk and sprawling branches.',
      lore: 'These ancient oaks have stood here for centuries, providing shelter for countless woodland creatures.',
      rarity: 'common',
      biome: ['temperate', 'forest'],
      season: 'all'
    }
  },

  birch_tree: {
    type: 'tree',
    size: { width: 1, height: 1 },
    walkable: false,
    interactable: true,
    visual: {
      color: '#f8fafc',
      secondaryColor: '#334155',
      pattern: 'striped',
      size: 'medium',
      animation: 'sway',
      zIndex: 3
    },
    interaction: {
      type: 'examine',
      radius: 1,
      prompt: 'Look at the elegant birch'
    },
    mechanics: {
      blocksMovement: true,
      providesShade: false,
      spawnPoint: true,
      soundEffect: 'gentle_rustle'
    },
    metadata: {
      name: 'Silver Birch',
      description: 'A graceful birch tree with distinctive white bark.',
      rarity: 'common',
      biome: ['temperate', 'meadow'],
      season: 'all'
    }
  },

  // Rocks and stones
  granite_boulder: {
    type: 'rock',
    size: { width: 1, height: 1 },
    walkable: true,
    interactable: true,
    visual: {
      color: '#6b7280',
      pattern: 'solid',
      size: 'medium',
      zIndex: 2
    },
    interaction: {
      type: 'rest',
      radius: 1,
      prompt: 'Rest on the smooth boulder'
    },
    mechanics: {
      blocksMovement: false,
      soundEffect: 'stone_tap'
    },
    metadata: {
      name: 'Granite Boulder',
      description: 'A smooth granite boulder, perfect for resting.',
      rarity: 'common',
      biome: ['mountain', 'hill'],
      season: 'all'
    }
  },

  ancient_stone: {
    type: 'ancient_stone',
    size: { width: 1, height: 1 },
    walkable: false,
    interactable: true,
    visual: {
      color: '#475569',
      secondaryColor: '#06d6a0',
      pattern: 'gradient',
      size: 'large',
      animation: 'pulse',
      zIndex: 4
    },
    interaction: {
      type: 'touch',
      radius: 1,
      prompt: 'Touch the mysterious stone',
      requirements: { level: 3 }
    },
    mechanics: {
      blocksMovement: true,
      particles: ['sparkle', 'mystical']
    },
    metadata: {
      name: 'Ancient Runestone',
      description: 'An ancient stone covered in mysterious runes.',
      lore: 'These stones are said to hold ancient magic from a forgotten civilization.',
      rarity: 'legendary',
      biome: ['mystical', 'ancient'],
      season: 'all'
    }
  },

  // Flowers and plants
  wildflower_patch: {
    type: 'flower',
    size: { width: 1, height: 1 },
    walkable: true,
    interactable: true,
    visual: {
      color: '#ec4899',
      secondaryColor: '#fbbf24',
      pattern: 'dotted',
      size: 'small',
      animation: 'bob',
      zIndex: 1
    },
    interaction: {
      type: 'collect',
      radius: 1,
      prompt: 'Pick beautiful wildflowers',
      cooldown: 60000 // 1 minute
    },
    mechanics: {
      blocksMovement: false,
      spawnPoint: true,
      particles: ['pollen']
    },
    metadata: {
      name: 'Wildflower Patch',
      description: 'A colorful patch of wildflowers swaying in the breeze.',
      rarity: 'common',
      biome: ['meadow', 'grassland'],
      season: 'spring'
    }
  },

  berry_bush: {
    type: 'berry_bush',
    size: { width: 1, height: 1 },
    walkable: false,
    interactable: true,
    visual: {
      color: '#16a34a',
      secondaryColor: '#dc2626',
      pattern: 'dotted',
      size: 'medium',
      zIndex: 2
    },
    interaction: {
      type: 'harvest',
      radius: 1,
      prompt: 'Harvest ripe berries',
      cooldown: 300000 // 5 minutes
    },
    mechanics: {
      blocksMovement: true,
      spawnPoint: true,
      soundEffect: 'bush_rustle'
    },
    metadata: {
      name: 'Berry Bush',
      description: 'A bush laden with plump, juicy berries.',
      discoverMessage: 'You found a berry bush! Animals love these treats.',
      rarity: 'uncommon',
      biome: ['forest', 'meadow'],
      season: 'summer'
    }
  },

  // Water features
  crystal_spring: {
    type: 'water_source',
    size: { width: 2, height: 2 },
    walkable: false,
    interactable: true,
    visual: {
      color: '#06b6d4',
      secondaryColor: '#f0f9ff',
      pattern: 'gradient',
      size: 'medium',
      animation: 'sparkle',
      zIndex: 1
    },
    interaction: {
      type: 'drink',
      radius: 1,
      prompt: 'Drink from the crystal spring'
    },
    mechanics: {
      blocksMovement: true,
      spawnPoint: true,
      soundEffect: 'water_babble',
      particles: ['water_sparkle']
    },
    metadata: {
      name: 'Crystal Spring',
      description: 'A clear spring with crystal-pure water.',
      lore: 'The animals of the forest gather here to drink from these pure waters.',
      rarity: 'rare',
      biome: ['forest', 'mountain'],
      season: 'all'
    }
  },

  // Decorative elements
  mushroom_ring: {
    type: 'mushroom',
    size: { width: 1, height: 1 },
    walkable: true,
    interactable: true,
    visual: {
      color: '#f59e0b',
      secondaryColor: '#fef3c7',
      pattern: 'dotted',
      size: 'small',
      animation: 'pulse',
      zIndex: 1
    },
    interaction: {
      type: 'examine',
      radius: 1,
      prompt: 'Study the fairy ring'
    },
    mechanics: {
      blocksMovement: false,
      particles: ['spores']
    },
    metadata: {
      name: 'Fairy Ring',
      description: 'A perfect circle of mushrooms - a fairy ring!',
      lore: 'Legend says these rings are doorways to the fairy realm.',
      rarity: 'rare',
      biome: ['forest', 'mystical'],
      season: 'fall'
    }
  },

  fallen_log: {
    type: 'log',
    size: { width: 2, height: 1 },
    walkable: true,
    interactable: true,
    visual: {
      color: '#92400e',
      pattern: 'solid',
      size: 'medium',
      zIndex: 1
    },
    interaction: {
      type: 'rest',
      radius: 1,
      prompt: 'Sit on the fallen log'
    },
    mechanics: {
      blocksMovement: false,
      spawnPoint: true,
      soundEffect: 'wood_creak'
    },
    metadata: {
      name: 'Fallen Log',
      description: 'A moss-covered log perfect for sitting.',
      rarity: 'common',
      biome: ['forest'],
      season: 'all'
    }
  }
};

/**
 * Create a map object from a template
 */
export function createMapObject(
  id: string,
  templateKey: string,
  position: Position,
  overrides: Partial<MapObject> = {}
): MapObject {
  const template = OBJECT_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Unknown object template: ${templateKey}`);
  }

  return {
    id,
    position,
    type: template.type || 'decoration',
    size: template.size || { width: 1, height: 1 },
    walkable: template.walkable ?? true,
    interactable: template.interactable ?? false,
    visual: {
      color: '#888888',
      pattern: 'solid',
      size: 'medium',
      animation: 'none',
      zIndex: 1,
      ...template.visual
    },
    interaction: {
      type: 'none',
      radius: 0,
      prompt: '',
      ...template.interaction
    },
    mechanics: {
      blocksMovement: false,
      ...template.mechanics
    },
    metadata: {
      name: 'Unknown Object',
      description: 'A mysterious object.',
      rarity: 'common',
      biome: ['all'],
      season: 'all',
      ...template.metadata
    },
    ...overrides
  } as MapObject;
}

/**
 * Get all objects within a certain radius of a position
 */
export function getObjectsInRadius(
  objects: MapObject[],
  center: Position,
  radius: number
): MapObject[] {
  return objects.filter(obj => {
    const distance = Math.sqrt(
      Math.pow(obj.position.x - center.x, 2) + 
      Math.pow(obj.position.y - center.y, 2)
    );
    return distance <= radius;
  });
}

/**
 * Check if a position intersects with any object
 */
export function getObjectAtPosition(
  objects: MapObject[],
  position: Position
): MapObject | null {
  return objects.find(obj => 
    position.x >= obj.position.x && 
    position.x < obj.position.x + obj.size.width &&
    position.y >= obj.position.y && 
    position.y < obj.position.y + obj.size.height
  ) || null;
}

/**
 * Get interactable objects near a position
 */
export function getInteractableObjectsNear(
  objects: MapObject[],
  position: Position,
  maxDistance: number = 2
): MapObject[] {
  return objects.filter(obj => {
    if (!obj.interactable) return false;
    
    const distance = Math.sqrt(
      Math.pow(obj.position.x - position.x, 2) + 
      Math.pow(obj.position.y - position.y, 2)
    );
    
    return distance <= Math.max(obj.interaction.radius, maxDistance);
  });
}

/**
 * Check if an object can be interacted with
 */
export function canInteractWithObject(
  object: MapObject,
  playerLevel: number = 1,
  playerItems: string[] = [],
  playerAchievements: string[] = []
): { canInteract: boolean; reason?: string } {
  if (!object.interactable) {
    return { canInteract: false, reason: 'Object is not interactable' };
  }

  const requirements = object.interaction.requirements;
  if (!requirements) {
    return { canInteract: true };
  }

  if (requirements.level && playerLevel < requirements.level) {
    return { 
      canInteract: false, 
      reason: `Requires level ${requirements.level}` 
    };
  }

  if (requirements.items) {
    const missingItems = requirements.items.filter(item => 
      !playerItems.includes(item)
    );
    if (missingItems.length > 0) {
      return { 
        canInteract: false, 
        reason: `Requires: ${missingItems.join(', ')}` 
      };
    }
  }

  if (requirements.achievements) {
    const missingAchievements = requirements.achievements.filter(achievement => 
      !playerAchievements.includes(achievement)
    );
    if (missingAchievements.length > 0) {
      return { 
        canInteract: false, 
        reason: `Missing achievement: ${missingAchievements[0]}` 
      };
    }
  }

  return { canInteract: true };
}

/**
 * Filter objects by biome compatibility
 */
export function getObjectsForBiome(
  biome: string,
  season: 'spring' | 'summer' | 'fall' | 'winter' = 'spring'
): string[] {
  return Object.keys(OBJECT_TEMPLATES).filter(key => {
    const template = OBJECT_TEMPLATES[key];
    const biomesMatch = template.metadata?.biome?.includes(biome) || 
                       template.metadata?.biome?.includes('all');
    const seasonMatch = template.metadata?.season === season || 
                       template.metadata?.season === 'all';
    return biomesMatch && seasonMatch;
  });
}

export default {
  createMapObject,
  getObjectsInRadius,
  getObjectAtPosition,
  getInteractableObjectsNear,
  canInteractWithObject,
  getObjectsForBiome,
  OBJECT_TEMPLATES
};