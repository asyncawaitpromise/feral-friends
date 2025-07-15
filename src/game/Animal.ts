// Animal Entity System
// Handles basic animal entities with species, AI states, and movement patterns

import { Position } from '../types/game';

export type AnimalSpecies = 'rabbit' | 'bird' | 'squirrel' | 'fox' | 'deer' | 'butterfly' | 'frog' | 'turtle' | 'owl' | 'hawk' | 'mouse' | 'raccoon' | 'bear' | 'wolf' | 'otter' | 'hedgehog' | 'bat';

export type AnimalState = 
  | 'idle' 
  | 'wandering' 
  | 'fleeing' 
  | 'returning' 
  | 'sleeping' 
  | 'feeding' 
  | 'curious' 
  | 'hiding'
  | 'alert';

export type AnimalSize = 'tiny' | 'small' | 'medium' | 'large';

export type MovementPattern = 'ground' | 'flying' | 'jumping' | 'swimming';

export interface AnimalStats {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  happiness: number;
  fear: number;
  curiosity: number;
  trust: number; // Player trust level
  trustLevel: number; // Additional trust level property
}

export interface AnimalBehavior {
  fleeDistance: number; // How close player can get before fleeing
  returnDistance: number; // How far from spawn before returning
  wanderRadius: number; // How far from spawn they'll wander
  restDuration: number; // How long they rest/idle
  activityLevel: number; // 0-1, how active they are
  socialLevel: number; // 0-1, how much they like other animals
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk' | 'any';
  rarity?: number; // 0-1, how rare this animal is
}

export interface AnimalVisual {
  color: string;
  secondaryColor?: string;
  size: AnimalSize;
  pattern?: 'solid' | 'striped' | 'spotted' | 'gradient';
  animation: 'hop' | 'walk' | 'fly' | 'swim' | 'dart';
  emoteIcon?: string; // For showing emotions
  emoji?: string; // Emoji representation
}

export interface AnimalAI {
  currentState: AnimalState;
  stateTimer: number; // How long in current state
  lastStateChange: number;
  targetPosition?: Position;
  pathToTarget: Position[];
  lastPlayerSighting?: {
    position: Position;
    timestamp: number;
  };
  homePosition: Position; // Where they spawned
  memory: {
    safeSpots: Position[];
    dangerSpots: Position[];
    foodSpots: Position[];
    lastPlayerPosition?: Position;
  };
}

export interface Animal {
  id: string;
  species: AnimalSpecies;
  type: AnimalSpecies; // Add type property for compatibility
  name?: string; // Optional custom name
  position: Position;
  velocity: { x: number; y: number };
  
  // Core properties
  stats: AnimalStats;
  behavior: AnimalBehavior;
  visual: AnimalVisual;
  ai: AnimalAI;
  
  // Game state
  isActive: boolean;
  lastUpdate: number;
  spawnTime: number;
  
  // Interaction state
  discoveredByPlayer: boolean;
  interactionCount: number;
  lastInteraction?: number;
  
  // Environment
  currentBiome?: string;
  weatherPreference?: string[];
  seasonActive?: string[];
}

// Predefined animal species templates
export const ANIMAL_TEMPLATES: Record<AnimalSpecies, Partial<Animal>> = {
  rabbit: {
    species: 'rabbit',
    stats: {
      health: 30,
      maxHealth: 30,
      energy: 80,
      maxEnergy: 80,
      happiness: 70,
      fear: 45,
      curiosity: 60,
      trust: 30,
      trustLevel: 30
    },
    behavior: {
      fleeDistance: 3,
      returnDistance: 8,
      wanderRadius: 5,
      restDuration: 3000, // 3 seconds
      activityLevel: 0.7,
      socialLevel: 0.8,
      timeOfDay: 'day'
    },
    visual: {
      color: '#8B4513', // Brown
      secondaryColor: '#F5F5DC', // Beige belly
      size: 'small',
      pattern: 'solid',
      animation: 'hop'
    },
    ai: {
      currentState: 'idle',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  bird: {
    species: 'bird',
    stats: {
      health: 20,
      maxHealth: 20,
      energy: 100,
      maxEnergy: 100,
      happiness: 80,
      fear: 55,
      curiosity: 90,
      trust: 40,
      trustLevel: 40
    },
    behavior: {
      fleeDistance: 4,
      returnDistance: 10,
      wanderRadius: 8,
      restDuration: 2000,
      activityLevel: 0.9,
      socialLevel: 0.6,
      timeOfDay: 'dawn'
    },
    visual: {
      color: '#4169E1', // Royal blue
      secondaryColor: '#FFD700', // Gold
      size: 'tiny',
      pattern: 'solid',
      animation: 'fly'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  squirrel: {
    species: 'squirrel',
    stats: {
      health: 25,
      maxHealth: 25,
      energy: 90,
      maxEnergy: 90,
      happiness: 75,
      fear: 35,
      curiosity: 85,
      trust: 50,
      trustLevel: 50
    },
    behavior: {
      fleeDistance: 2,
      returnDistance: 6,
      wanderRadius: 4,
      restDuration: 2500,
      activityLevel: 0.8,
      socialLevel: 0.4,
      timeOfDay: 'day'
    },
    visual: {
      color: '#A0522D', // Sienna
      secondaryColor: '#F4A460', // Sandy brown
      size: 'small',
      pattern: 'solid',
      animation: 'dart'
    },
    ai: {
      currentState: 'curious',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  fox: {
    species: 'fox',
    stats: {
      health: 50,
      maxHealth: 50,
      energy: 70,
      maxEnergy: 70,
      happiness: 60,
      fear: 30,
      curiosity: 70,
      trust: 10,
      trustLevel: 10
    },
    behavior: {
      fleeDistance: 5,
      returnDistance: 12,
      wanderRadius: 10,
      restDuration: 4000,
      activityLevel: 0.6,
      socialLevel: 0.2,
      timeOfDay: 'dusk'
    },
    visual: {
      color: '#FF4500', // Orange red
      secondaryColor: '#FFFFFF', // White
      size: 'medium',
      pattern: 'solid',
      animation: 'walk'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  deer: {
    species: 'deer',
    stats: {
      health: 80,
      maxHealth: 80,
      energy: 60,
      maxEnergy: 60,
      happiness: 50,
      fear: 70,
      curiosity: 30,
      trust: 5,
      trustLevel: 5
    },
    behavior: {
      fleeDistance: 6,
      returnDistance: 15,
      wanderRadius: 12,
      restDuration: 5000,
      activityLevel: 0.4,
      socialLevel: 0.7,
      timeOfDay: 'dawn'
    },
    visual: {
      color: '#8B4513', // Saddle brown
      secondaryColor: '#F5DEB3', // Wheat
      size: 'large',
      pattern: 'solid',
      animation: 'walk'
    },
    ai: {
      currentState: 'feeding',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  butterfly: {
    species: 'butterfly',
    stats: {
      health: 10,
      maxHealth: 10,
      energy: 50,
      maxEnergy: 50,
      happiness: 90,
      fear: 65,
      curiosity: 75,
      trust: 60,
      trustLevel: 60
    },
    behavior: {
      fleeDistance: 1,
      returnDistance: 3,
      wanderRadius: 3,
      restDuration: 1500,
      activityLevel: 0.9,
      socialLevel: 0.5,
      timeOfDay: 'day'
    },
    visual: {
      color: '#FF69B4', // Hot pink
      secondaryColor: '#FFD700', // Gold
      size: 'tiny',
      pattern: 'gradient',
      animation: 'fly'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  frog: {
    species: 'frog',
    stats: {
      health: 15,
      maxHealth: 15,
      energy: 40,
      maxEnergy: 40,
      happiness: 60,
      fear: 70,
      curiosity: 50,
      trust: 35,
      trustLevel: 35
    },
    behavior: {
      fleeDistance: 2,
      returnDistance: 4,
      wanderRadius: 2,
      restDuration: 4000,
      activityLevel: 0.3,
      socialLevel: 0.6,
      timeOfDay: 'dusk'
    },
    visual: {
      color: '#228B22', // Forest green
      secondaryColor: '#ADFF2F', // Green yellow
      size: 'tiny',
      pattern: 'spotted',
      animation: 'hop'
    },
    ai: {
      currentState: 'idle',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  turtle: {
    species: 'turtle',
    stats: {
      health: 60,
      maxHealth: 60,
      energy: 30,
      maxEnergy: 30,
      happiness: 40,
      fear: 20,
      curiosity: 20,
      trust: 60,
      trustLevel: 60
    },
    behavior: {
      fleeDistance: 1,
      returnDistance: 3,
      wanderRadius: 2,
      restDuration: 8000,
      activityLevel: 0.1,
      socialLevel: 0.3,
      timeOfDay: 'any'
    },
    visual: {
      color: '#556B2F', // Dark olive green
      secondaryColor: '#8FBC8F', // Dark sea green
      size: 'small',
      pattern: 'solid',
      animation: 'walk'
    },
    ai: {
      currentState: 'idle',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  owl: {
    species: 'owl',
    stats: {
      health: 35,
      maxHealth: 35,
      energy: 90,
      maxEnergy: 90,
      happiness: 65,
      fear: 40,
      curiosity: 85,
      trust: 25,
      trustLevel: 25
    },
    behavior: {
      fleeDistance: 5,
      returnDistance: 12,
      wanderRadius: 8,
      restDuration: 6000,
      activityLevel: 0.8,
      socialLevel: 0.3,
      timeOfDay: 'night'
    },
    visual: {
      color: '#8B4513', // Saddle brown
      secondaryColor: '#F5F5DC', // Beige
      size: 'medium',
      pattern: 'spotted',
      animation: 'fly'
    },
    ai: {
      currentState: 'idle',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  hawk: {
    species: 'hawk',
    stats: {
      health: 45,
      maxHealth: 45,
      energy: 95,
      maxEnergy: 95,
      happiness: 50,
      fear: 25,
      curiosity: 60,
      trust: 15,
      trustLevel: 15
    },
    behavior: {
      fleeDistance: 8,
      returnDistance: 20,
      wanderRadius: 15,
      restDuration: 4000,
      activityLevel: 0.9,
      socialLevel: 0.1,
      timeOfDay: 'day'
    },
    visual: {
      color: '#8B4513', // Dark brown
      secondaryColor: '#D2691E', // Chocolate
      size: 'medium',
      pattern: 'striped',
      animation: 'fly'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  mouse: {
    species: 'mouse',
    stats: {
      health: 8,
      maxHealth: 8,
      energy: 70,
      maxEnergy: 70,
      happiness: 75,
      fear: 85,
      curiosity: 65,
      trust: 40,
      trustLevel: 40
    },
    behavior: {
      fleeDistance: 2,
      returnDistance: 4,
      wanderRadius: 3,
      restDuration: 2000,
      activityLevel: 0.9,
      socialLevel: 0.7,
      timeOfDay: 'night'
    },
    visual: {
      color: '#696969', // Dim gray
      secondaryColor: '#D3D3D3', // Light gray
      size: 'tiny',
      pattern: 'solid',
      animation: 'dart'
    },
    ai: {
      currentState: 'hiding',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  raccoon: {
    species: 'raccoon',
    stats: {
      health: 40,
      maxHealth: 40,
      energy: 80,
      maxEnergy: 80,
      happiness: 70,
      fear: 30,
      curiosity: 95,
      trust: 35,
      trustLevel: 35
    },
    behavior: {
      fleeDistance: 3,
      returnDistance: 8,
      wanderRadius: 6,
      restDuration: 3500,
      activityLevel: 0.7,
      socialLevel: 0.4,
      timeOfDay: 'night'
    },
    visual: {
      color: '#708090', // Slate gray
      secondaryColor: '#000000', // Black (mask)
      size: 'medium',
      pattern: 'striped',
      animation: 'walk'
    },
    ai: {
      currentState: 'curious',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  bear: {
    species: 'bear',
    stats: {
      health: 120,
      maxHealth: 120,
      energy: 50,
      maxEnergy: 50,
      happiness: 40,
      fear: 10,
      curiosity: 40,
      trust: 5,
      trustLevel: 5
    },
    behavior: {
      fleeDistance: 10,
      returnDistance: 25,
      wanderRadius: 20,
      restDuration: 8000,
      activityLevel: 0.3,
      socialLevel: 0.1,
      timeOfDay: 'dawn'
    },
    visual: {
      color: '#8B4513', // Saddle brown
      secondaryColor: '#654321', // Dark brown
      size: 'large',
      pattern: 'solid',
      animation: 'walk'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  wolf: {
    species: 'wolf',
    stats: {
      health: 70,
      maxHealth: 70,
      energy: 80,
      maxEnergy: 80,
      happiness: 55,
      fear: 20,
      curiosity: 50,
      trust: 8,
      trustLevel: 8
    },
    behavior: {
      fleeDistance: 8,
      returnDistance: 18,
      wanderRadius: 15,
      restDuration: 5000,
      activityLevel: 0.6,
      socialLevel: 0.9, // Pack animal
      timeOfDay: 'dusk'
    },
    visual: {
      color: '#696969', // Dim gray
      secondaryColor: '#FFFFFF', // White
      size: 'large',
      pattern: 'solid',
      animation: 'walk'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  otter: {
    species: 'otter',
    stats: {
      health: 30,
      maxHealth: 30,
      energy: 85,
      maxEnergy: 85,
      happiness: 95,
      fear: 40,
      curiosity: 80,
      trust: 70,
      trustLevel: 70
    },
    behavior: {
      fleeDistance: 4,
      returnDistance: 8,
      wanderRadius: 6,
      restDuration: 3000,
      activityLevel: 0.8,
      socialLevel: 0.8,
      timeOfDay: 'day'
    },
    visual: {
      color: '#8B4513', // Saddle brown
      secondaryColor: '#DEB887', // Burlywood
      size: 'medium',
      pattern: 'solid',
      animation: 'swim'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  hedgehog: {
    species: 'hedgehog',
    stats: {
      health: 25,
      maxHealth: 25,
      energy: 60,
      maxEnergy: 60,
      happiness: 60,
      fear: 60,
      curiosity: 45,
      trust: 45,
      trustLevel: 45
    },
    behavior: {
      fleeDistance: 2,
      returnDistance: 5,
      wanderRadius: 3,
      restDuration: 4000,
      activityLevel: 0.5,
      socialLevel: 0.2,
      timeOfDay: 'night'
    },
    visual: {
      color: '#8B4513', // Saddle brown
      secondaryColor: '#F5DEB3', // Wheat
      size: 'small',
      pattern: 'spotted',
      animation: 'walk'
    },
    ai: {
      currentState: 'idle',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  },

  bat: {
    species: 'bat',
    stats: {
      health: 12,
      maxHealth: 12,
      energy: 100,
      maxEnergy: 100,
      happiness: 65,
      fear: 75,
      curiosity: 70,
      trust: 30,
      trustLevel: 30
    },
    behavior: {
      fleeDistance: 4,
      returnDistance: 10,
      wanderRadius: 8,
      restDuration: 1000,
      activityLevel: 0.95,
      socialLevel: 0.6,
      timeOfDay: 'night'
    },
    visual: {
      color: '#2F4F4F', // Dark slate gray
      secondaryColor: '#696969', // Dim gray
      size: 'tiny',
      pattern: 'solid',
      animation: 'fly'
    },
    ai: {
      currentState: 'wandering',
      stateTimer: 0,
      lastStateChange: 0,
      pathToTarget: [],
      homePosition: { x: 0, y: 0 },
      memory: {
        safeSpots: [],
        dangerSpots: [],
        foodSpots: []
      }
    }
  }
};

/**
 * Create a new animal from a species template
 */
export function createAnimal(
  id: string,
  species: AnimalSpecies,
  position: Position,
  overrides: Partial<Animal> = {}
): Animal {
  const template = ANIMAL_TEMPLATES[species];
  if (!template) {
    throw new Error(`Unknown animal species: ${species}`);
  }

  const currentTime = Date.now();
  
  return {
    id,
    species,
    type: species, // Set type same as species for compatibility
    position: { ...position },
    velocity: { x: 0, y: 0 },
    isActive: true,
    lastUpdate: currentTime,
    spawnTime: currentTime,
    discoveredByPlayer: false,
    interactionCount: 0,
    
    // Apply template with overrides
    stats: { 
      ...template.stats!,
      trustLevel: template.stats?.trust || 0 // Set trustLevel from trust
    },
    behavior: { ...template.behavior! },
    visual: { ...template.visual! },
    ai: {
      ...template.ai!,
      homePosition: { ...position } // Set spawn position as home
    },
    
    // Apply any custom overrides
    ...overrides
  } as Animal;
}

/**
 * Update animal position based on velocity
 */
export function updateAnimalPosition(animal: Animal, deltaTime: number): void {
  // Apply velocity to position
  animal.position.x += animal.velocity.x * deltaTime;
  animal.position.y += animal.velocity.y * deltaTime;
  
  // Update last update time
  animal.lastUpdate = Date.now();
}

/**
 * Calculate distance between animal and target position
 */
export function getDistanceToPosition(animal: Animal, target: Position): number {
  return Math.sqrt(
    Math.pow(animal.position.x - target.x, 2) + 
    Math.pow(animal.position.y - target.y, 2)
  );
}

/**
 * Calculate distance between animal and player
 */
export function getDistanceToPlayer(animal: Animal, playerPosition: Position): number {
  return getDistanceToPosition(animal, playerPosition);
}

/**
 * Set animal's target position and calculate path
 */
export function setAnimalTarget(animal: Animal, target: Position): void {
  animal.ai.targetPosition = { ...target };
  
  // Simple path calculation (can be enhanced with proper pathfinding later)
  animal.ai.pathToTarget = [target];
}

/**
 * Move animal towards target position
 */
export function moveTowardsTarget(animal: Animal, speed: number = 1): boolean {
  const target = animal.ai.targetPosition;
  if (!target) return true; // No target, movement complete
  
  const distance = getDistanceToPosition(animal, target);
  
  // Close enough to target
  if (distance < 0.1) {
    animal.velocity.x = 0;
    animal.velocity.y = 0;
    animal.ai.targetPosition = undefined;
    animal.ai.pathToTarget = [];
    return true;
  }
  
  // Calculate direction to target
  const direction = {
    x: (target.x - animal.position.x) / distance,
    y: (target.y - animal.position.y) / distance
  };
  
  // Set velocity based on species and behavior
  const animalSpeed = speed * animal.behavior.activityLevel;
  animal.velocity.x = direction.x * animalSpeed;
  animal.velocity.y = direction.y * animalSpeed;
  
  return false; // Movement not complete
}

/**
 * Get random position within animal's wander radius
 */
export function getRandomWanderPosition(animal: Animal): Position {
  const radius = animal.behavior.wanderRadius;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * radius;
  
  return {
    x: animal.ai.homePosition.x + Math.cos(angle) * distance,
    y: animal.ai.homePosition.y + Math.sin(angle) * distance
  };
}

/**
 * Check if animal should flee from player
 */
export function shouldFleeFromPlayer(animal: Animal, playerPosition: Position): boolean {
  const distance = getDistanceToPlayer(animal, playerPosition);
  
  // More nuanced fleeing logic based on trust and interaction attempts
  const fleeThreshold = animal.behavior.fleeDistance * 0.5; // Animals now only flee at half their flee distance
  const fearThreshold = Math.max(50, 80 - (animal.stats.trust * 0.5)); // Higher trust = less likely to flee
  
  // Check if player is moving too quickly towards animal
  const playerMoving = animal.ai.memory.lastPlayerPosition ? 
    getDistanceToPosition({ position: playerPosition } as Animal, animal.ai.memory.lastPlayerPosition) > 0.5 : false;
  
  // If player is approaching slowly and animal has some trust, don't flee immediately
  if (animal.stats.trust > 20 && !playerMoving) {
    return false;
  }
  
  return distance <= fleeThreshold && animal.stats.fear > fearThreshold;
}

/**
 * Check if animal should be cautious/alert (before fleeing)
 */
export function shouldBeAlert(animal: Animal, playerPosition: Position): boolean {
  const distance = getDistanceToPlayer(animal, playerPosition);
  const alertDistance = animal.behavior.fleeDistance * 1.5; // Alert at 1.5x flee distance
  
  // Animal becomes alert when player approaches but before fleeing
  return distance <= alertDistance && distance > (animal.behavior.fleeDistance * 0.5) && animal.stats.fear > 30;
}

/**
 * Check if animal is comfortable with player proximity for interaction
 */
export function canInteractWithPlayer(animal: Animal, playerPosition: Position): boolean {
  const distance = getDistanceToPlayer(animal, playerPosition);
  const interactionDistance = Math.max(2, animal.behavior.fleeDistance * 0.8); // Can interact at 80% of flee distance
  
  // Check if conditions are right for interaction
  const lowFear = animal.stats.fear < 60;
  const someTrust = animal.stats.trust > 10;
  const goodDistance = distance <= interactionDistance && distance > 0.5; // Not too close, not too far
  
  return lowFear && someTrust && goodDistance;
}

/**
 * Check if animal should return to home area
 */
export function shouldReturnHome(animal: Animal): boolean {
  const distanceFromHome = getDistanceToPosition(animal, animal.ai.homePosition);
  return distanceFromHome > animal.behavior.returnDistance;
}

/**
 * Get flee position away from threat
 */
export function getFleePosition(animal: Animal, threatPosition: Position): Position {
  const distance = getDistanceToPosition(animal, threatPosition);
  
  // Calculate direction away from threat
  const direction = {
    x: (animal.position.x - threatPosition.x) / distance,
    y: (animal.position.y - threatPosition.y) / distance
  };
  
  // Flee distance based on animal's fear level
  const fleeDistance = animal.behavior.fleeDistance + (animal.stats.fear / 100) * 3;
  
  return {
    x: animal.position.x + direction.x * fleeDistance,
    y: animal.position.y + direction.y * fleeDistance
  };
}

/**
 * Update animal's memory with new information
 */
export function updateAnimalMemory(animal: Animal, position: Position, type: 'safe' | 'danger' | 'food'): void {
  const memory = animal.ai.memory;
  const memoryArray = type === 'safe' ? memory.safeSpots : 
                      type === 'danger' ? memory.dangerSpots : 
                      memory.foodSpots;
  
  // Add to memory if not already there
  const exists = memoryArray.some(pos => 
    Math.abs(pos.x - position.x) < 1 && Math.abs(pos.y - position.y) < 1
  );
  
  if (!exists) {
    memoryArray.push({ ...position });
    
    // Limit memory size
    if (memoryArray.length > 10) {
      memoryArray.shift(); // Remove oldest memory
    }
  }
}


/**
 * Get animal's current emotion based on stats
 */
export function getAnimalEmotion(animal: Animal): string {
  if (animal.stats.fear > 70) return '😨'; // Scared
  if (animal.stats.happiness > 80) return '😊'; // Happy
  if (animal.stats.trust > 60) return '🥰'; // Loving
  if (animal.stats.curiosity > 70) return '🤔'; // Curious
  if (animal.stats.energy < 30) return '😴'; // Tired
  if (animal.ai.currentState === 'feeding') return '🍃'; // Eating
  return '🙂'; // Neutral
}

/**
 * Get animals of a specific species within radius
 */
export function getAnimalsBySpecies(animals: Animal[], species: AnimalSpecies): Animal[] {
  return animals.filter(animal => animal.species === species && animal.isActive);
}

/**
 * Get animals within radius of position
 */
export function getAnimalsInRadius(animals: Animal[], center: Position, radius: number): Animal[] {
  return animals.filter(animal => {
    if (!animal.isActive) return false;
    
    const distance = Math.sqrt(
      Math.pow(animal.position.x - center.x, 2) + 
      Math.pow(animal.position.y - center.y, 2)
    );
    
    return distance <= radius;
  });
}

/**
 * Check if position is suitable for animal species
 */
export function isPositionSuitableForSpecies(
  position: Position, 
  species: AnimalSpecies, 
  biome: string = 'temperate'
): boolean {
  // Simple biome preferences - can be expanded
  const preferences: Record<AnimalSpecies, string[]> = {
    rabbit: ['meadow', 'grassland', 'temperate'],
    bird: ['forest', 'meadow', 'temperate', 'mountain'],
    squirrel: ['forest', 'temperate'],
    fox: ['forest', 'mountain', 'temperate'],
    deer: ['forest', 'meadow', 'temperate'],
    butterfly: ['meadow', 'flower', 'temperate'],
    frog: ['water', 'swamp', 'temperate'],
    turtle: ['water', 'swamp', 'temperate'],
    owl: ['forest', 'mountain', 'temperate'],
    hawk: ['mountain', 'forest', 'temperate'],
    mouse: ['grassland', 'forest', 'temperate'],
    raccoon: ['forest', 'water', 'temperate'],
    bear: ['forest', 'mountain', 'temperate'],
    wolf: ['forest', 'mountain', 'temperate'],
    otter: ['water', 'river', 'temperate'],
    hedgehog: ['forest', 'grassland', 'temperate'],
    bat: ['cave', 'forest', 'temperate']
  };
  
  return preferences[species]?.includes(biome) || false;
}

/**
 * Modify trust level of an animal
 */
export function modifyTrust(animal: Animal, amount: number): void {
  animal.stats.trust = Math.max(0, Math.min(100, animal.stats.trust + amount));
}

/**
 * Modify energy level of an animal
 */
export function modifyEnergy(animal: Animal, amount: number): void {
  animal.stats.energy = Math.max(0, Math.min(animal.stats.maxEnergy, animal.stats.energy + amount));
}

export default {
  createAnimal,
  updateAnimalPosition,
  getDistanceToPosition,
  getDistanceToPlayer,
  setAnimalTarget,
  moveTowardsTarget,
  getRandomWanderPosition,
  shouldFleeFromPlayer,
  shouldBeAlert,
  canInteractWithPlayer,
  shouldReturnHome,
  getFleePosition,
  updateAnimalMemory,
  getAnimalEmotion,
  getAnimalsBySpecies,
  getAnimalsInRadius,
  isPositionSuitableForSpecies,
  modifyTrust,
  modifyEnergy,
  ANIMAL_TEMPLATES
};