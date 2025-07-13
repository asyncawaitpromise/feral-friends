import { Animal } from './Animal';
import { PersonalityProfile, animalPersonality } from './AnimalPersonality';
import { InventoryItem, ITEM_DATABASE } from './InventorySystem';

export type FoodType = 'fruit' | 'vegetable' | 'nut' | 'seed' | 'herb' | 'flower' | 'meat' | 'insect' | 'special';
export type FoodRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type GatheringLocation = 'forest' | 'meadow' | 'stream' | 'cave' | 'mountain' | 'garden';

export interface FoodItem extends InventoryItem {
  foodType: FoodType;
  nutritionalValue: number; // 1-100
  tastiness: number; // 1-100
  rarity: FoodRarity;
  gatheringLocations: GatheringLocation[];
  seasonality: string[]; // seasons when available
  specialEffects: FoodEffect[];
  personalityPreferences: Record<string, number>; // personality -> preference modifier
}

export interface FoodEffect {
  type: 'energy' | 'happiness' | 'trust' | 'health' | 'bond' | 'temporary_ability';
  value: number;
  duration?: number; // milliseconds for temporary effects
  description: string;
}

export interface AnimalFoodPreferences {
  animalId: string;
  species: string;
  personality: string;
  preferences: {
    favoriteTypes: FoodType[];
    dislikedTypes: FoodType[];
    favoriteItems: string[]; // specific food IDs
    dislikedItems: string[]; // specific food IDs
    preferredTastiness: number; // 1-100
    preferredNutrition: number; // 1-100
  };
  discoveredFoods: string[]; // food IDs the animal has tried
  foodMemories: FoodMemory[];
  dietaryRestrictions: string[];
  currentCravings: string[]; // food IDs currently craved
  lastFed: number; // timestamp
  hungerLevel: number; // 0-100
}

export interface FoodMemory {
  foodId: string;
  firstTried: number; // timestamp
  timesTried: number;
  lastReaction: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated';
  associatedMoods: string[];
  trustGained: number;
  bondingMoments: number; // times this food created special bonding
}

export interface GatheringSpot {
  id: string;
  name: string;
  location: GatheringLocation;
  description: string;
  availableFoods: string[]; // food IDs
  respawnTime: number; // milliseconds
  lastGathered: number; // timestamp
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: GatheringRequirement[];
  seasonalAvailability: string[];
  discovered: boolean;
  gatheringAttempts: number;
  successfulGatherings: number;
}

export interface GatheringRequirement {
  type: 'tool' | 'skill' | 'time_of_day' | 'weather' | 'companion';
  value: string | number;
  description: string;
}

export interface GatheringResult {
  success: boolean;
  itemsFound: { foodId: string; quantity: number }[];
  experience: number;
  message: string;
  specialFinds: string[];
  timeSpent: number;
}

// Food database with comprehensive food items
export const FOOD_DATABASE: Record<string, FoodItem> = {
  apple: {
    id: 'apple',
    type: 'food',
    name: 'Red Apple',
    description: 'A crisp, sweet apple that most animals enjoy',
    icon: '🍎',
    maxStack: 20,
    rarity: 'common',
    value: 8,
    usable: true,
    consumable: true,
    foodType: 'fruit',
    nutritionalValue: 70,
    tastiness: 80,
    gatheringLocations: ['forest', 'garden'],
    seasonality: ['autumn', 'late_summer'],
    effects: [
      {
        type: 'trust',
        value: 5,
        target: 'animal',
        description: 'Increases animal trust slightly'
      },
      {
        type: 'energy',
        value: 15,
        target: 'animal',
        description: 'Restores energy'
      }
    ],
    specialEffects: [
      {
        type: 'happiness',
        value: 10,
        description: 'Sweet taste brings joy'
      }
    ],
    personalityPreferences: {
      friendly: 2,
      playful: 1,
      shy: 1,
      aggressive: -1
    }
  },

  carrot: {
    id: 'carrot',
    type: 'food',
    name: 'Fresh Carrot',
    description: 'A crunchy orange carrot, beloved by rabbits',
    icon: '🥕',
    maxStack: 15,
    rarity: 'common',
    value: 6,
    usable: true,
    consumable: true,
    foodType: 'vegetable',
    nutritionalValue: 85,
    tastiness: 70,
    gatheringLocations: ['garden', 'meadow'],
    seasonality: ['spring', 'summer', 'autumn'],
    effects: [
      {
        type: 'trust',
        value: 8,
        target: 'animal',
        description: 'Greatly increases rabbit trust'
      },
      {
        type: 'health',
        value: 20,
        target: 'animal',
        description: 'Improves health and vitality'
      }
    ],
    specialEffects: [
      {
        type: 'energy',
        value: 25,
        description: 'High nutritional value provides sustained energy'
      }
    ],
    personalityPreferences: {
      patient: 2,
      lazy: 1,
      energetic: 1
    },
    requirements: [
      {
        type: 'animal_type',
        value: 'rabbit',
        description: 'Especially loved by rabbits'
      }
    ]
  },

  acorn: {
    id: 'acorn',
    type: 'food',
    name: 'Oak Acorn',
    description: 'A nutritious nut that squirrels adore',
    icon: '🌰',
    maxStack: 30,
    rarity: 'common',
    value: 4,
    usable: true,
    consumable: true,
    foodType: 'nut',
    nutritionalValue: 90,
    tastiness: 60,
    gatheringLocations: ['forest'],
    seasonality: ['autumn'],
    effects: [
      {
        type: 'energy',
        value: 30,
        target: 'animal',
        description: 'High-energy nut'
      }
    ],
    specialEffects: [
      {
        type: 'temporary_ability',
        value: 1,
        duration: 300000, // 5 minutes
        description: 'Increased agility and climbing ability'
      }
    ],
    personalityPreferences: {
      energetic: 3,
      playful: 2,
      restless: 2,
      patient: 1
    }
  },

  wildflower_nectar: {
    id: 'wildflower_nectar',
    type: 'food',
    name: 'Wildflower Nectar',
    description: 'Sweet nectar collected from wildflowers',
    icon: '🌸',
    maxStack: 10,
    rarity: 'uncommon',
    value: 15,
    usable: true,
    consumable: true,
    foodType: 'flower',
    nutritionalValue: 40,
    tastiness: 95,
    gatheringLocations: ['meadow', 'garden'],
    seasonality: ['spring', 'summer'],
    effects: [
      {
        type: 'happiness',
        value: 25,
        target: 'animal',
        description: 'Incredibly sweet and delightful'
      },
      {
        type: 'trust',
        value: 12,
        target: 'animal',
        description: 'Special treat builds strong trust'
      }
    ],
    specialEffects: [
      {
        type: 'bond',
        value: 15,
        description: 'Creates special bonding moment'
      }
    ],
    personalityPreferences: {
      curious: 3,
      friendly: 2,
      playful: 2,
      shy: 1
    }
  },

  salmon_berry: {
    id: 'salmon_berry',
    type: 'food',
    name: 'Salmon Berry',
    description: 'A rare, protein-rich berry found near streams',
    icon: '🫐',
    maxStack: 8,
    rarity: 'rare',
    value: 25,
    usable: true,
    consumable: true,
    foodType: 'fruit',
    nutritionalValue: 95,
    tastiness: 85,
    gatheringLocations: ['stream'],
    seasonality: ['summer'],
    effects: [
      {
        type: 'energy',
        value: 40,
        target: 'animal',
        description: 'Exceptional energy restoration'
      },
      {
        type: 'health',
        value: 30,
        target: 'animal',
        description: 'Powerful healing properties'
      }
    ],
    specialEffects: [
      {
        type: 'temporary_ability',
        value: 2,
        duration: 600000, // 10 minutes
        description: 'Enhanced swimming and fishing abilities'
      }
    ],
    personalityPreferences: {
      bold: 2,
      curious: 2,
      energetic: 1
    }
  },

  crystal_honey: {
    id: 'crystal_honey',
    type: 'food',
    name: 'Crystal Honey',
    description: 'Legendary honey with magical properties',
    icon: '🍯',
    maxStack: 3,
    rarity: 'legendary',
    value: 100,
    usable: true,
    consumable: true,
    foodType: 'special',
    nutritionalValue: 100,
    tastiness: 100,
    gatheringLocations: ['cave'],
    seasonality: ['all'],
    effects: [
      {
        type: 'trust',
        value: 50,
        target: 'animal',
        description: 'Creates instant deep trust'
      },
      {
        type: 'bond',
        value: 100,
        target: 'animal',
        description: 'Legendary bonding experience'
      }
    ],
    specialEffects: [
      {
        type: 'temporary_ability',
        value: 5,
        duration: 1800000, // 30 minutes
        description: 'Unlocks all abilities temporarily'
      }
    ],
    personalityPreferences: {
      // All personalities love this legendary food
      friendly: 5,
      curious: 5,
      playful: 5,
      shy: 5,
      aggressive: 5,
      lazy: 5,
      energetic: 5
    }
  }
};

// Gathering spots throughout the game world
export const GATHERING_SPOTS: GatheringSpot[] = [
  {
    id: 'apple_orchard',
    name: 'Old Apple Orchard',
    location: 'forest',
    description: 'An abandoned orchard with wild apple trees',
    availableFoods: ['apple'],
    respawnTime: 3600000, // 1 hour
    lastGathered: 0,
    difficulty: 'easy',
    requirements: [],
    seasonalAvailability: ['autumn', 'late_summer'],
    discovered: true,
    gatheringAttempts: 0,
    successfulGatherings: 0
  },
  
  {
    id: 'meadow_garden',
    name: 'Wildflower Meadow',
    location: 'meadow',
    description: 'A beautiful meadow filled with wildflowers and herbs',
    availableFoods: ['wildflower_nectar', 'carrot'],
    respawnTime: 1800000, // 30 minutes
    lastGathered: 0,
    difficulty: 'easy',
    requirements: [],
    seasonalAvailability: ['spring', 'summer'],
    discovered: true,
    gatheringAttempts: 0,
    successfulGatherings: 0
  },
  
  {
    id: 'oak_grove',
    name: 'Ancient Oak Grove',
    location: 'forest',
    description: 'A grove of ancient oak trees heavy with acorns',
    availableFoods: ['acorn'],
    respawnTime: 7200000, // 2 hours
    lastGathered: 0,
    difficulty: 'medium',
    requirements: [
      {
        type: 'companion',
        value: 'squirrel',
        description: 'Squirrel companion helps find the best acorns'
      }
    ],
    seasonalAvailability: ['autumn'],
    discovered: false,
    gatheringAttempts: 0,
    successfulGatherings: 0
  },
  
  {
    id: 'crystal_cave',
    name: 'Crystal Honey Cave',
    location: 'cave',
    description: 'A mysterious cave where magical bees create crystal honey',
    availableFoods: ['crystal_honey'],
    respawnTime: 86400000, // 24 hours
    lastGathered: 0,
    difficulty: 'hard',
    requirements: [
      {
        type: 'skill',
        value: 'cave_exploration',
        description: 'Requires cave exploration skills'
      },
      {
        type: 'companion',
        value: 'any',
        description: 'Must have a trusted companion'
      }
    ],
    seasonalAvailability: ['all'],
    discovered: false,
    gatheringAttempts: 0,
    successfulGatherings: 0
  }
];

export class FoodPreferences {
  private animalPreferences: Map<string, AnimalFoodPreferences> = new Map();
  private gatheringSpots: GatheringSpot[] = [...GATHERING_SPOTS];
  private activeGathering: { spotId: string; startTime: number } | null = null;
  
  private callbacks: {
    onFoodDiscovered?: (animalId: string, foodId: string) => void;
    onSpecialReaction?: (animalId: string, foodId: string, reaction: string) => void;
    onGatheringComplete?: (result: GatheringResult) => void;
    onSpotDiscovered?: (spotId: string) => void;
  } = {};

  constructor() {
    this.loadFoodData();
  }

  /**
   * Initialize food preferences for an animal based on species and personality
   */
  initializePreferences(animal: Animal): AnimalFoodPreferences {
    const personality = animalPersonality.getPersonality(animal.id);
    const preferences = this.generateSpeciesPreferences(animal.species, personality);
    
    this.animalPreferences.set(animal.id, preferences);
    return preferences;
  }

  /**
   * Feed an animal and get their reaction
   */
  feedAnimal(
    animalId: string,
    foodId: string
  ): {
    success: boolean;
    reaction: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated';
    effects: FoodEffect[];
    trustChange: number;
    bondChange: number;
    message: string;
    firstTime: boolean;
  } {
    const preferences = this.animalPreferences.get(animalId);
    const food = FOOD_DATABASE[foodId];
    
    if (!preferences || !food) {
      return {
        success: false,
        reaction: 'neutral',
        effects: [],
        trustChange: 0,
        bondChange: 0,
        message: 'Invalid animal or food',
        firstTime: false
      };
    }

    // Check if first time trying this food
    const firstTime = !preferences.discoveredFoods.includes(foodId);
    if (firstTime) {
      preferences.discoveredFoods.push(foodId);
      this.callbacks.onFoodDiscovered?.(animalId, foodId);
    }

    // Calculate reaction based on preferences
    const reaction = this.calculateFoodReaction(preferences, food);
    
    // Calculate effects
    const effects = this.applyFoodEffects(food, reaction);
    
    // Calculate trust and bond changes
    const trustChange = this.calculateTrustChange(food, reaction, preferences);
    const bondChange = this.calculateBondChange(food, reaction, firstTime);
    
    // Update food memory
    this.updateFoodMemory(preferences, food, reaction, trustChange);
    
    // Update animal state
    preferences.lastFed = Date.now();
    preferences.hungerLevel = Math.max(0, preferences.hungerLevel - food.nutritionalValue);
    
    // Generate message
    const message = this.generateFeedingMessage(food, reaction, firstTime);
    
    // Trigger special reaction callback if significant
    if (reaction === 'loved' || (firstTime && reaction === 'liked')) {
      this.callbacks.onSpecialReaction?.(animalId, foodId, reaction);
    }
    
    this.saveFoodData();
    
    return {
      success: true,
      reaction,
      effects,
      trustChange,
      bondChange,
      message,
      firstTime
    };
  }

  /**
   * Start gathering at a specific spot
   */
  startGathering(spotId: string): {
    success: boolean;
    message: string;
    estimatedTime: number;
    requirements: string[];
  } {
    const spot = this.gatheringSpots.find(s => s.id === spotId);
    if (!spot) {
      return {
        success: false,
        message: 'Gathering spot not found',
        estimatedTime: 0,
        requirements: []
      };
    }

    if (!spot.discovered) {
      return {
        success: false,
        message: 'This gathering spot has not been discovered yet',
        estimatedTime: 0,
        requirements: []
      };
    }

    // Check if spot is ready for gathering
    const timeSinceLastGather = Date.now() - spot.lastGathered;
    if (timeSinceLastGather < spot.respawnTime) {
      const timeRemaining = spot.respawnTime - timeSinceLastGather;
      return {
        success: false,
        message: `Spot needs ${Math.ceil(timeRemaining / 60000)} more minutes to replenish`,
        estimatedTime: timeRemaining,
        requirements: []
      };
    }

    // Check requirements
    const unmetRequirements: string[] = [];
    spot.requirements.forEach(req => {
      // Simplified requirement checking
      unmetRequirements.push(req.description);
    });

    if (unmetRequirements.length > 0) {
      return {
        success: false,
        message: 'Requirements not met',
        estimatedTime: 0,
        requirements: unmetRequirements
      };
    }

    // Start gathering
    this.activeGathering = {
      spotId,
      startTime: Date.now()
    };

    const baseTime = this.getGatheringTime(spot.difficulty);
    
    return {
      success: true,
      message: `Started gathering at ${spot.name}`,
      estimatedTime: baseTime,
      requirements: []
    };
  }

  /**
   * Complete gathering and get results
   */
  completeGathering(): GatheringResult | null {
    if (!this.activeGathering) return null;
    
    const spot = this.gatheringSpots.find(s => s.id === this.activeGathering!.spotId);
    if (!spot) return null;
    
    const timeSpent = Date.now() - this.activeGathering.startTime;
    const expectedTime = this.getGatheringTime(spot.difficulty);
    
    // Calculate success based on time spent and spot difficulty
    const success = timeSpent >= expectedTime * 0.8; // Allow some leeway
    
    let itemsFound: { foodId: string; quantity: number }[] = [];
    let specialFinds: string[] = [];
    
    if (success) {
      // Generate items based on spot's available foods
      spot.availableFoods.forEach(foodId => {
        const food = FOOD_DATABASE[foodId];
        if (food) {
          const baseQuantity = this.getBaseGatheringQuantity(food.rarity);
          const quantity = Math.floor(baseQuantity * (0.5 + Math.random() * 0.5));
          
          if (quantity > 0) {
            itemsFound.push({ foodId, quantity });
          }
          
          // Chance for special finds
          if (food.rarity === 'rare' && Math.random() < 0.1) {
            specialFinds.push(`Exceptional quality ${food.name}`);
          }
        }
      });
      
      spot.successfulGatherings++;
      spot.lastGathered = Date.now();
    }
    
    spot.gatheringAttempts++;
    
    const experience = success ? spot.difficulty === 'easy' ? 10 : 
                                spot.difficulty === 'medium' ? 20 : 30 : 5;
    
    const result: GatheringResult = {
      success,
      itemsFound,
      experience,
      message: success ? 
        `Successfully gathered from ${spot.name}` : 
        `Gathering at ${spot.name} was not very successful`,
      specialFinds,
      timeSpent
    };
    
    this.activeGathering = null;
    this.callbacks.onGatheringComplete?.(result);
    this.saveFoodData();
    
    return result;
  }

  /**
   * Get animal's food preferences
   */
  getPreferences(animalId: string): AnimalFoodPreferences | null {
    return this.animalPreferences.get(animalId) || null;
  }

  /**
   * Get available gathering spots
   */
  getAvailableGatheringSpots(): GatheringSpot[] {
    return this.gatheringSpots.filter(spot => spot.discovered);
  }

  /**
   * Discover a new gathering spot
   */
  discoverGatheringSpot(spotId: string): boolean {
    const spot = this.gatheringSpots.find(s => s.id === spotId);
    if (spot && !spot.discovered) {
      spot.discovered = true;
      this.callbacks.onSpotDiscovered?.(spotId);
      this.saveFoodData();
      return true;
    }
    return false;
  }

  /**
   * Set food system callbacks
   */
  setCallbacks(callbacks: {
    onFoodDiscovered?: (animalId: string, foodId: string) => void;
    onSpecialReaction?: (animalId: string, foodId: string, reaction: string) => void;
    onGatheringComplete?: (result: GatheringResult) => void;
    onSpotDiscovered?: (spotId: string) => void;
  }): void {
    this.callbacks = callbacks;
  }

  // Private helper methods

  private generateSpeciesPreferences(species: string, personality: PersonalityProfile | null): AnimalFoodPreferences {
    const basePreferences: AnimalFoodPreferences = {
      animalId: '',
      species,
      personality: personality?.primary || 'neutral',
      preferences: {
        favoriteTypes: [],
        dislikedTypes: [],
        favoriteItems: [],
        dislikedItems: [],
        preferredTastiness: 50,
        preferredNutrition: 50
      },
      discoveredFoods: [],
      foodMemories: [],
      dietaryRestrictions: [],
      currentCravings: [],
      lastFed: 0,
      hungerLevel: 50
    };

    // Set species-specific preferences
    switch (species) {
      case 'rabbit':
        basePreferences.preferences.favoriteTypes = ['vegetable', 'fruit'];
        basePreferences.preferences.dislikedTypes = ['meat'];
        basePreferences.preferences.favoriteItems = ['carrot'];
        basePreferences.preferences.preferredNutrition = 80;
        break;
      case 'squirrel':
        basePreferences.preferences.favoriteTypes = ['nut', 'seed'];
        basePreferences.preferences.favoriteItems = ['acorn'];
        basePreferences.preferences.preferredTastiness = 60;
        break;
      case 'bird':
        basePreferences.preferences.favoriteTypes = ['seed', 'insect', 'fruit'];
        basePreferences.preferences.preferredTastiness = 70;
        break;
      case 'fox':
        basePreferences.preferences.favoriteTypes = ['meat', 'fruit'];
        basePreferences.preferences.dislikedTypes = ['vegetable'];
        basePreferences.preferences.preferredNutrition = 90;
        break;
      default:
        basePreferences.preferences.favoriteTypes = ['fruit'];
        basePreferences.preferences.preferredTastiness = 60;
        basePreferences.preferences.preferredNutrition = 60;
    }

    // Modify based on personality
    if (personality) {
      switch (personality.primary) {
        case 'playful':
          basePreferences.preferences.preferredTastiness += 20;
          break;
        case 'lazy':
          basePreferences.preferences.preferredNutrition += 15;
          break;
        case 'energetic':
          basePreferences.preferences.preferredNutrition += 25;
          break;
        case 'shy':
          basePreferences.preferences.preferredTastiness -= 10;
          break;
      }
    }

    return basePreferences;
  }

  private calculateFoodReaction(
    preferences: AnimalFoodPreferences,
    food: FoodItem
  ): 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated' {
    let score = 0;

    // Base score from food type preferences
    if (preferences.preferences.favoriteTypes.includes(food.foodType)) {
      score += 30;
    }
    if (preferences.preferences.dislikedTypes.includes(food.foodType)) {
      score -= 30;
    }

    // Specific item preferences
    if (preferences.preferences.favoriteItems.includes(food.id)) {
      score += 40;
    }
    if (preferences.preferences.dislikedItems.includes(food.id)) {
      score -= 40;
    }

    // Tastiness preference match
    const tastinessDiff = Math.abs(food.tastiness - preferences.preferences.preferredTastiness);
    score += Math.max(0, 20 - tastinessDiff);

    // Nutrition preference match
    const nutritionDiff = Math.abs(food.nutritionalValue - preferences.preferences.preferredNutrition);
    score += Math.max(0, 15 - nutritionDiff);

    // Personality modifiers
    const personalityMod = food.personalityPreferences[preferences.personality] || 0;
    score += personalityMod * 10;

    // Convert score to reaction
    if (score >= 60) return 'loved';
    if (score >= 30) return 'liked';
    if (score >= -10) return 'neutral';
    if (score >= -40) return 'disliked';
    return 'hated';
  }

  private applyFoodEffects(food: FoodItem, reaction: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated'): FoodEffect[] {
    const effects = [...food.specialEffects];
    
    // Modify effects based on reaction
    const reactionMultiplier = {
      loved: 1.5,
      liked: 1.2,
      neutral: 1.0,
      disliked: 0.5,
      hated: 0.2
    }[reaction];

    return effects.map(effect => ({
      ...effect,
      value: Math.floor(effect.value * reactionMultiplier)
    }));
  }

  private calculateTrustChange(
    food: FoodItem,
    reaction: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated',
    preferences: AnimalFoodPreferences
  ): number {
    const baseChange = {
      loved: 15,
      liked: 8,
      neutral: 3,
      disliked: -2,
      hated: -8
    }[reaction];

    // Bonus for rare foods
    const rarityBonus = {
      common: 0,
      uncommon: 2,
      rare: 5,
      epic: 10,
      legendary: 20
    }[food.rarity];

    return baseChange + rarityBonus;
  }

  private calculateBondChange(
    food: FoodItem,
    reaction: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated',
    firstTime: boolean
  ): number {
    let bondChange = 0;

    if (reaction === 'loved') {
      bondChange = firstTime ? 10 : 5;
    } else if (reaction === 'liked') {
      bondChange = firstTime ? 5 : 2;
    }

    // Special foods provide extra bonding
    if (food.foodType === 'special') {
      bondChange *= 2;
    }

    return bondChange;
  }

  private updateFoodMemory(
    preferences: AnimalFoodPreferences,
    food: FoodItem,
    reaction: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated',
    trustGained: number
  ): void {
    let memory = preferences.foodMemories.find(m => m.foodId === food.id);
    
    if (!memory) {
      memory = {
        foodId: food.id,
        firstTried: Date.now(),
        timesTried: 0,
        lastReaction: reaction,
        associatedMoods: [],
        trustGained: 0,
        bondingMoments: 0
      };
      preferences.foodMemories.push(memory);
    }
    
    memory.timesTried++;
    memory.lastReaction = reaction;
    memory.trustGained += trustGained;
    
    if (reaction === 'loved') {
      memory.bondingMoments++;
    }
  }

  private generateFeedingMessage(
    food: FoodItem,
    reaction: 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated',
    firstTime: boolean
  ): string {
    const messages = {
      loved: [
        `Absolutely loves the ${food.name}! Their eyes light up with pure joy.`,
        `This ${food.name} is clearly their favorite! They're so happy.`,
        `The ${food.name} brings them incredible happiness!`
      ],
      liked: [
        `Enjoys the ${food.name} and seems quite pleased.`,
        `The ${food.name} is well-received and appreciated.`,
        `They like the ${food.name} and eat it happily.`
      ],
      neutral: [
        `Accepts the ${food.name} without much enthusiasm.`,
        `Eats the ${food.name} but doesn't seem particularly excited.`,
        `The ${food.name} is okay, nothing special.`
      ],
      disliked: [
        `Doesn't seem to enjoy the ${food.name} very much.`,
        `Takes the ${food.name} reluctantly.`,
        `The ${food.name} isn't really to their taste.`
      ],
      hated: [
        `Really dislikes the ${food.name} and turns away.`,
        `The ${food.name} is clearly not appreciated at all.`,
        `They refuse to eat more of the ${food.name}.`
      ]
    };

    let message = messages[reaction][Math.floor(Math.random() * messages[reaction].length)];
    
    if (firstTime) {
      message = `First time trying ${food.name}! ` + message;
    }
    
    return message;
  }

  private getGatheringTime(difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
      case 'easy': return 30000; // 30 seconds
      case 'medium': return 60000; // 1 minute
      case 'hard': return 120000; // 2 minutes
      default: return 30000;
    }
  }

  private getBaseGatheringQuantity(rarity: FoodRarity): number {
    switch (rarity) {
      case 'common': return 3;
      case 'uncommon': return 2;
      case 'rare': return 1;
      case 'epic': return 1;
      case 'legendary': return 1;
      default: return 1;
    }
  }

  private loadFoodData(): void {
    try {
      const saved = localStorage.getItem('feralFriends_foodData');
      if (saved) {
        const data = JSON.parse(saved);
        this.animalPreferences = new Map(data.animalPreferences || []);
        this.gatheringSpots = data.gatheringSpots || [...GATHERING_SPOTS];
      }
    } catch (error) {
      console.warn('Failed to load food data:', error);
    }
  }

  private saveFoodData(): void {
    try {
      const data = {
        animalPreferences: Array.from(this.animalPreferences.entries()),
        gatheringSpots: this.gatheringSpots
      };
      localStorage.setItem('feralFriends_foodData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save food data:', error);
    }
  }
}

// Export singleton instance
export const foodPreferences = new FoodPreferences(); 