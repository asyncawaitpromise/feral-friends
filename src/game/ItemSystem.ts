import { InventoryItem, ItemEffect, ItemRequirement } from './InventorySystem';
import { Animal } from './Animal';

export type ItemCategory = 'tool' | 'toy' | 'treat' | 'craft' | 'special' | 'collectible';
export type ToolType = 'net' | 'rope' | 'whistle' | 'mirror' | 'brush' | 'camera' | 'lantern';
export type ToyType = 'ball' | 'stick' | 'feather' | 'puzzle' | 'music_box' | 'treats_dispenser';
export type CraftMaterial = 'wood' | 'string' | 'metal' | 'fabric' | 'stone' | 'crystal';

export interface Tool extends InventoryItem {
  type: 'tool';
  toolType: ToolType;
  durability: number;
  maxDurability: number;
  effectiveness: number; // 1-100
  skillRequirement: number;
  specialAbilities: ToolAbility[];
  maintenanceRequired: boolean;
  lastUsed: number;
}

export interface Toy extends InventoryItem {
  type: 'toy';
  toyType: ToyType;
  entertainmentValue: number; // 1-100
  durability: number;
  maxDurability: number;
  animalPreferences: Record<string, number>; // species -> preference
  playStyles: PlayStyle[];
  unlockRequirements: ItemRequirement[];
}

export interface CraftItem extends InventoryItem {
  type: 'craft';
  materials: CraftMaterial[];
  craftingTime: number; // seconds
  craftingDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  recipe: CraftingRecipe;
  unlockLevel: number;
}

export interface SpecialItem extends InventoryItem {
  type: 'special';
  uniqueAbilities: SpecialAbility[];
  questItem: boolean;
  legendary: boolean;
  unlockConditions: UnlockCondition[];
}

export interface ToolAbility {
  name: string;
  description: string;
  cooldown: number; // seconds
  effectRadius: number;
  successRate: number; // 0-100
  animalTypes: string[]; // which animals it works on
}

export interface PlayStyle {
  name: string;
  description: string;
  energyRequired: number;
  happinessGain: number;
  bondingBonus: number;
  duration: number; // seconds
}

export interface CraftingRecipe {
  id: string;
  name: string;
  ingredients: { itemId: string; quantity: number }[];
  tools: ToolType[];
  result: { itemId: string; quantity: number };
  experience: number;
}

export interface SpecialAbility {
  name: string;
  description: string;
  type: 'passive' | 'active' | 'triggered';
  effect: ItemEffect;
  conditions: string[];
}

export interface UnlockCondition {
  type: 'achievement' | 'bond_level' | 'animal_count' | 'location' | 'time';
  value: any;
  description: string;
}

export interface ItemUseContext {
  targetAnimal?: Animal;
  location?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'stormy';
  companions?: string[]; // animal IDs
}

export interface ItemUseResult {
  success: boolean;
  message: string;
  effects: ItemEffect[];
  durabilityLoss: number;
  experienceGained: number;
  specialEvents: string[];
  itemConsumed: boolean;
  cooldownApplied: number; // seconds
  criticalSuccess?: boolean; // For critical hits/successes
}

// Comprehensive item database
export const ITEM_DATABASE: Record<string, InventoryItem> = {
  // Tools
  animal_net: {
    id: 'animal_net',
    type: 'tool',
    name: 'Animal Net',
    description: 'A gentle net for safely catching small animals',
    icon: '🪤',
    quantity: 1,
    maxStack: 1,
    rarity: 'common',
    value: 50,
    usable: true,
    consumable: false,
    toolType: 'net',
    durability: 100,
    maxDurability: 100,
    effectiveness: 70,
    skillRequirement: 10,
    specialAbilities: [
      {
        name: 'Safe Capture',
        description: 'Captures animals without causing stress',
        cooldown: 30,
        effectRadius: 2,
        successRate: 85,
        animalTypes: ['rabbit', 'squirrel', 'bird']
      }
    ],
    maintenanceRequired: true,
    lastUsed: 0,
    effects: [
      {
        type: 'special',
        value: 1,
        target: 'animal',
        description: 'Enables gentle animal capture'
      }
    ]
  } as Tool,

  friendship_whistle: {
    id: 'friendship_whistle',
    type: 'tool',
    name: 'Friendship Whistle',
    description: 'A magical whistle that calls friendly animals',
    icon: '🎵',
    quantity: 1,
    maxStack: 1,
    rarity: 'uncommon',
    value: 120,
    usable: true,
    consumable: false,
    toolType: 'whistle',
    durability: 200,
    maxDurability: 200,
    effectiveness: 90,
    skillRequirement: 25,
    specialAbilities: [
      {
        name: 'Animal Call',
        description: 'Attracts nearby animals to your location',
        cooldown: 120,
        effectRadius: 10,
        successRate: 75,
        animalTypes: ['all']
      },
      {
        name: 'Calming Melody',
        description: 'Soothes aggressive or scared animals',
        cooldown: 60,
        effectRadius: 5,
        successRate: 90,
        animalTypes: ['all']
      }
    ],
    maintenanceRequired: false,
    lastUsed: 0,
    effects: [
      {
        type: 'attraction',
        value: 50,
        duration: 300,
        target: 'animal',
        description: 'Draws animals closer'
      }
    ]
  } as Tool,

  grooming_brush: {
    id: 'grooming_brush',
    type: 'tool',
    name: 'Grooming Brush',
    description: 'A soft brush for grooming animal companions',
    icon: '🪥',
    quantity: 1,
    maxStack: 1,
    rarity: 'common',
    value: 30,
    usable: true,
    consumable: false,
    toolType: 'brush',
    durability: 150,
    maxDurability: 150,
    effectiveness: 80,
    skillRequirement: 5,
    specialAbilities: [
      {
        name: 'Gentle Grooming',
        description: 'Increases bond and happiness through grooming',
        cooldown: 0,
        effectRadius: 1,
        successRate: 95,
        animalTypes: ['all']
      }
    ],
    maintenanceRequired: true,
    lastUsed: 0,
    effects: [
      {
        type: 'happiness',
        value: 20,
        target: 'animal',
        description: 'Makes animals happy and comfortable'
      },
      {
        type: 'trust',
        value: 10,
        target: 'animal',
        description: 'Builds trust through caring'
      }
    ]
  } as Tool,

  // Toys
  rainbow_ball: {
    id: 'rainbow_ball',
    type: 'toy',
    name: 'Rainbow Ball',
    description: 'A colorful, bouncy ball that animals love to chase',
    icon: '🌈',
    quantity: 1,
    maxStack: 3,
    rarity: 'common',
    value: 25,
    usable: true,
    consumable: false,
    toyType: 'ball',
    entertainmentValue: 70,
    durability: 100,
    maxDurability: 100,
    animalPreferences: {
      'dog': 3,
      'cat': 2,
      'rabbit': 1,
      'fox': 2
    },
    playStyles: [
      {
        name: 'Fetch',
        description: 'Throw and retrieve game',
        energyRequired: 20,
        happinessGain: 25,
        bondingBonus: 15,
        duration: 120
      },
      {
        name: 'Chase',
        description: 'Rolling ball chase game',
        energyRequired: 30,
        happinessGain: 20,
        bondingBonus: 10,
        duration: 90
      }
    ],
    unlockRequirements: [],
    effects: [
      {
        type: 'happiness',
        value: 25,
        duration: 300,
        target: 'animal',
        description: 'Provides fun and entertainment'
      }
    ]
  } as Toy,

  feather_wand: {
    id: 'feather_wand',
    type: 'toy',
    name: 'Feather Wand',
    description: 'A wand with colorful feathers that cats and birds love',
    icon: '🪶',
    quantity: 1,
    maxStack: 2,
    rarity: 'common',
    value: 15,
    usable: true,
    consumable: false,
    toyType: 'feather',
    entertainmentValue: 85,
    durability: 80,
    maxDurability: 80,
    animalPreferences: {
      'cat': 5,
      'bird': 4,
      'fox': 1
    },
    playStyles: [
      {
        name: 'Pounce',
        description: 'Encourage pouncing and jumping',
        energyRequired: 25,
        happinessGain: 30,
        bondingBonus: 20,
        duration: 100
      },
      {
        name: 'Flight Training',
        description: 'Help birds practice flying skills',
        energyRequired: 15,
        happinessGain: 35,
        bondingBonus: 25,
        duration: 150
      }
    ],
    unlockRequirements: [],
    effects: [
      {
        type: 'happiness',
        value: 30,
        duration: 200,
        target: 'animal',
        description: 'Stimulates hunting instincts playfully'
      }
    ]
  } as Toy,

  // Special Items
  crystal_pendant: {
    id: 'crystal_pendant',
    type: 'special',
    name: 'Crystal Pendant',
    description: 'A mysterious pendant that enhances animal communication',
    icon: '💎',
    quantity: 1,
    maxStack: 1,
    rarity: 'legendary',
    value: 500,
    usable: true,
    consumable: false,
    uniqueAbilities: [
      {
        name: 'Animal Telepathy',
        description: 'Understand animal thoughts and emotions clearly',
        type: 'passive',
        effect: {
          type: 'special',
          value: 100,
          target: 'both',
          description: 'Enhanced communication with all animals'
        },
        conditions: ['worn', 'bonded_animal_nearby']
      },
      {
        name: 'Trust Amplifier',
        description: 'All trust-building activities are more effective',
        type: 'passive',
        effect: {
          type: 'trust',
          value: 50,
          target: 'animal',
          description: 'Amplifies trust-building by 50%'
        },
        conditions: ['worn']
      }
    ],
    questItem: false,
    legendary: true,
    unlockConditions: [
      {
        type: 'achievement',
        value: 'master_communicator',
        description: 'Achieve maximum bond with 10 different animals'
      }
    ],
    effects: [
      {
        type: 'special',
        value: 100,
        target: 'both',
        description: 'Magical enhancement to animal interactions'
      }
    ]
  } as SpecialItem,

  // Collectibles
  golden_acorn: {
    id: 'golden_acorn',
    type: 'collectible',
    name: 'Golden Acorn',
    description: 'A rare, magical acorn that grants wishes',
    icon: '🥇',
    quantity: 1,
    maxStack: 5,
    rarity: 'epic',
    value: 200,
    usable: true,
    consumable: true,
    effects: [
      {
        type: 'special',
        value: 1,
        target: 'both',
        description: 'Grants a special wish or ability'
      },
      {
        type: 'trust',
        value: 100,
        target: 'animal',
        description: 'Instantly maximizes trust with target animal'
      }
    ],
    requirements: [
      {
        type: 'animal_type',
        value: 'squirrel',
        description: 'Most effective with squirrels'
      }
    ]
  },

  // Craft Materials
  silk_thread: {
    id: 'silk_thread',
    type: 'craft',
    name: 'Silk Thread',
    description: 'Strong, flexible thread spun by magical creatures',
    icon: '🧵',
    quantity: 1,
    maxStack: 50,
    rarity: 'uncommon',
    value: 8,
    usable: false,
    consumable: false,
    materials: ['fabric'],
    craftingTime: 0,
    craftingDifficulty: 'easy',
    recipe: {
      id: 'silk_thread_recipe',
      name: 'Silk Thread Creation',
      ingredients: [],
      tools: [],
      result: { itemId: 'silk_thread', quantity: 1 },
      experience: 5
    },
    unlockLevel: 1,
    effects: []
  } as CraftItem,

  enchanted_wood: {
    id: 'enchanted_wood',
    type: 'craft',
    name: 'Enchanted Wood',
    description: 'Wood imbued with natural magic, perfect for crafting',
    icon: '🪵',
    quantity: 1,
    maxStack: 20,
    rarity: 'rare',
    value: 25,
    usable: false,
    consumable: false,
    materials: ['wood'],
    craftingTime: 0,
    craftingDifficulty: 'medium',
    recipe: {
      id: 'enchanted_wood_recipe',
      name: 'Wood Enchantment',
      ingredients: [
        { itemId: 'regular_wood', quantity: 3 },
        { itemId: 'crystal_shard', quantity: 1 }
      ],
      tools: ['lantern'],
      result: { itemId: 'enchanted_wood', quantity: 1 },
      experience: 15
    },
    unlockLevel: 10,
    effects: []
  } as CraftItem
};

export class ItemSystem {
  private activeEffects: Map<string, { effect: ItemEffect; endTime: number }> = new Map();
  private itemCooldowns: Map<string, number> = new Map();
  private crafting: Map<string, { recipe: CraftingRecipe; startTime: number }> = new Map();
  
  private callbacks: {
    onItemUsed?: (itemId: string, result: ItemUseResult) => void;
    onToolBroken?: (toolId: string) => void;
    onSpecialEvent?: (event: string, context: any) => void;
    onCraftingComplete?: (recipeId: string, result: { itemId: string; quantity: number }) => void;
  } = {};

  constructor() {
    this.loadItemData();
    this.startEffectCleanup();
  }

  /**
   * Use an item with optional context
   */
  useItem(
    itemId: string,
    context: ItemUseContext = {}
  ): ItemUseResult {
    const item = ITEM_DATABASE[itemId];
    if (!item) {
      return {
        success: false,
        message: 'Item not found',
        effects: [],
        durabilityLoss: 0,
        experienceGained: 0,
        specialEvents: [],
        itemConsumed: false,
        cooldownApplied: 0
      };
    }

    if (!item.usable) {
      return {
        success: false,
        message: `${item.name} cannot be used`,
        effects: [],
        durabilityLoss: 0,
        experienceGained: 0,
        specialEvents: [],
        itemConsumed: false,
        cooldownApplied: 0
      };
    }

    // Check cooldown
    const cooldownEnd = this.itemCooldowns.get(itemId) || 0;
    if (Date.now() < cooldownEnd) {
      const remainingSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000);
      return {
        success: false,
        message: `${item.name} is on cooldown for ${remainingSeconds} more seconds`,
        effects: [],
        durabilityLoss: 0,
        experienceGained: 0,
        specialEvents: [],
        itemConsumed: false,
        cooldownApplied: 0
      };
    }

    // Check requirements
    const requirementCheck = this.checkRequirements(item, context);
    if (!requirementCheck.success) {
      return {
        success: false,
        message: requirementCheck.message,
        effects: [],
        durabilityLoss: 0,
        experienceGained: 0,
        specialEvents: [],
        itemConsumed: false,
        cooldownApplied: 0
      };
    }

    // Use item based on type
    let result: ItemUseResult;
    
    switch (item.type) {
      case 'tool':
        result = this.useTool(item as Tool, context);
        break;
      case 'toy':
        result = this.useToy(item as Toy, context);
        break;
      case 'special':
        result = this.useSpecialItem(item as SpecialItem, context);
        break;
      default:
        result = this.useGenericItem(item, context);
    }

    // Apply effects
    if (result.success) {
      this.applyItemEffects(result.effects, context);
      
      // Apply cooldown if any
      if (result.cooldownApplied > 0) {
        this.itemCooldowns.set(itemId, Date.now() + (result.cooldownApplied * 1000));
      }

      // Trigger callback
      this.callbacks.onItemUsed?.(itemId, result);
    }

    this.saveItemData();
    return result;
  }

  /**
   * Start crafting an item
   */
  startCrafting(recipeId: string): {
    success: boolean;
    message: string;
    estimatedTime: number;
    requirements: string[];
  } {
    // Find item with this recipe
    const craftItem = Object.values(ITEM_DATABASE).find(item => 
      item.type === 'craft' && (item as CraftItem).recipe.id === recipeId
    ) as CraftItem;

    if (!craftItem) {
      return {
        success: false,
        message: 'Recipe not found',
        estimatedTime: 0,
        requirements: []
      };
    }

    const recipe = craftItem.recipe;
    
    // Check if already crafting
    if (this.crafting.has(recipeId)) {
      return {
        success: false,
        message: 'Already crafting this item',
        estimatedTime: 0,
        requirements: []
      };
    }

    // Check ingredients (simplified - assumes player has inventory system)
    const missingIngredients: string[] = [];
    recipe.ingredients.forEach(ingredient => {
      const requiredItem = ITEM_DATABASE[ingredient.itemId];
      if (requiredItem) {
        missingIngredients.push(`${ingredient.quantity}x ${requiredItem.name}`);
      }
    });

    if (missingIngredients.length > 0) {
      return {
        success: false,
        message: 'Missing ingredients',
        estimatedTime: 0,
        requirements: missingIngredients
      };
    }

    // Start crafting
    this.crafting.set(recipeId, {
      recipe,
      startTime: Date.now()
    });

    return {
      success: true,
      message: `Started crafting ${recipe.name}`,
      estimatedTime: craftItem.craftingTime,
      requirements: []
    };
  }

  /**
   * Complete crafting process
   */
  completeCrafting(recipeId: string): {
    success: boolean;
    result: { itemId: string; quantity: number } | null;
    experienceGained: number;
    message: string;
  } {
    const craftingProcess = this.crafting.get(recipeId);
    if (!craftingProcess) {
      return {
        success: false,
        result: null,
        experienceGained: 0,
        message: 'No active crafting process found'
      };
    }

    const craftItem = Object.values(ITEM_DATABASE).find(item => 
      item.type === 'craft' && (item as CraftItem).recipe.id === recipeId
    ) as CraftItem;

    if (!craftItem) {
      return {
        success: false,
        result: null,
        experienceGained: 0,
        message: 'Crafting item not found'
      };
    }

    const timeSpent = Date.now() - craftingProcess.startTime;
    const requiredTime = craftItem.craftingTime * 1000;

    if (timeSpent < requiredTime * 0.9) { // Allow some leeway
      return {
        success: false,
        result: null,
        experienceGained: 0,
        message: `Crafting needs ${Math.ceil((requiredTime - timeSpent) / 1000)} more seconds`
      };
    }

    // Complete crafting
    this.crafting.delete(recipeId);
    
    const result = craftingProcess.recipe.result;
    const experience = craftingProcess.recipe.experience;

    this.callbacks.onCraftingComplete?.(recipeId, result);

    return {
      success: true,
      result,
      experienceGained: experience,
      message: `Successfully crafted ${result.quantity}x ${ITEM_DATABASE[result.itemId]?.name || result.itemId}`
    };
  }

  /**
   * Get active item effects
   */
  getActiveEffects(): Array<{ effect: ItemEffect; timeRemaining: number }> {
    const now = Date.now();
    const effects: Array<{ effect: ItemEffect; timeRemaining: number }> = [];
    
    this.activeEffects.forEach((data, id) => {
      if (data.endTime > now) {
        effects.push({
          effect: data.effect,
          timeRemaining: Math.ceil((data.endTime - now) / 1000)
        });
      }
    });
    
    return effects;
  }

  /**
   * Get item cooldowns
   */
  getItemCooldowns(): Record<string, number> {
    const now = Date.now();
    const cooldowns: Record<string, number> = {};
    
    this.itemCooldowns.forEach((endTime, itemId) => {
      if (endTime > now) {
        cooldowns[itemId] = Math.ceil((endTime - now) / 1000);
      }
    });
    
    return cooldowns;
  }

  /**
   * Get active crafting processes
   */
  getActiveCrafting(): Array<{ recipeId: string; timeRemaining: number; progress: number }> {
    const now = Date.now();
    const processes: Array<{ recipeId: string; timeRemaining: number; progress: number }> = [];
    
    this.crafting.forEach((data, recipeId) => {
      const craftItem = Object.values(ITEM_DATABASE).find(item => 
        item.type === 'craft' && (item as CraftItem).recipe.id === recipeId
      ) as CraftItem;
      
      if (craftItem) {
        const elapsed = now - data.startTime;
        const total = craftItem.craftingTime * 1000;
        const progress = Math.min(100, (elapsed / total) * 100);
        const timeRemaining = Math.max(0, Math.ceil((total - elapsed) / 1000));
        
        processes.push({
          recipeId,
          timeRemaining,
          progress
        });
      }
    });
    
    return processes;
  }

  /**
   * Set item system callbacks
   */
  setCallbacks(callbacks: {
    onItemUsed?: (itemId: string, result: ItemUseResult) => void;
    onToolBroken?: (toolId: string) => void;
    onSpecialEvent?: (event: string, context: any) => void;
    onCraftingComplete?: (recipeId: string, result: { itemId: string; quantity: number }) => void;
  }): void {
    this.callbacks = callbacks;
  }

  // Private methods

  private useTool(tool: Tool, context: ItemUseContext): ItemUseResult {
    const baseSuccess = tool.effectiveness / 100;
    const skillBonus = 0.1; // Simplified skill system
    const successRate = Math.min(0.95, baseSuccess + skillBonus);
    
    const success = Math.random() < successRate;
    const durabilityLoss = success ? 5 : 2;
    
    // Update tool durability
    tool.durability = Math.max(0, tool.durability - durabilityLoss);
    tool.lastUsed = Date.now();
    
    if (tool.durability <= 0) {
      this.callbacks.onToolBroken?.(tool.id);
    }

    const effects = success && tool.effects ? [...tool.effects] : [];
    const experienceGained = success ? 10 : 3;
    const cooldown = tool.specialAbilities[0]?.cooldown || 0;

    return {
      success,
      message: success ? 
        `Successfully used ${tool.name}` : 
        `${tool.name} wasn't very effective this time`,
      effects,
      durabilityLoss,
      experienceGained,
      specialEvents: success && tool.rarity === 'legendary' ? ['legendary_tool_success'] : [],
      itemConsumed: false,
      cooldownApplied: cooldown
    };
  }

  private useToy(toy: Toy, context: ItemUseContext): ItemUseResult {
    if (!context.targetAnimal) {
      return {
        success: false,
        message: 'Need to select an animal to play with',
        effects: [],
        durabilityLoss: 0,
        experienceGained: 0,
        specialEvents: [],
        itemConsumed: false,
        cooldownApplied: 0
      };
    }

    const animalPreference = toy.animalPreferences[context.targetAnimal.species] || 1;
    const successRate = (toy.entertainmentValue / 100) * animalPreference * 0.2;
    const success = Math.random() < successRate;
    
    const durabilityLoss = 3;
    toy.durability = Math.max(0, toy.durability - durabilityLoss);

    const effects = success && toy.effects ? [...toy.effects] : [];
    const experienceGained = success ? 15 : 5;

    return {
      success,
      message: success ?
        `${context.targetAnimal.species} loves playing with the ${toy.name}!` :
        `${context.targetAnimal.species} isn't interested in the ${toy.name} right now`,
      effects,
      durabilityLoss,
      experienceGained,
      specialEvents: success && animalPreference >= 4 ? ['perfect_toy_match'] : [],
      itemConsumed: false,
      cooldownApplied: 0
    };
  }

  private useSpecialItem(item: SpecialItem, context: ItemUseContext): ItemUseResult {
    const activeAbilities = item.uniqueAbilities.filter(ability => 
      ability.type === 'active'
    );

    if (activeAbilities.length === 0) {
      return {
        success: false,
        message: `${item.name} has no active abilities`,
        effects: [],
        durabilityLoss: 0,
        experienceGained: 0,
        specialEvents: [],
        itemConsumed: false,
        cooldownApplied: 0
      };
    }

    const ability = activeAbilities[0]; // Use first active ability
    const effects = [ability.effect];
    const specialEvents = [ability.name.toLowerCase().replace(/\s+/g, '_')];

    this.callbacks.onSpecialEvent?.(ability.name, context);

    return {
      success: true,
      message: `Activated ${ability.name}: ${ability.description}`,
      effects,
      durabilityLoss: 0,
      experienceGained: 25,
      specialEvents,
      itemConsumed: item.consumable,
      cooldownApplied: 300 // 5 minutes for special items
    };
  }

  private useGenericItem(item: InventoryItem, context: ItemUseContext): ItemUseResult {
    const effects = item.effects || [];
    const experienceGained = item.rarity === 'legendary' ? 20 : 
                           item.rarity === 'epic' ? 15 :
                           item.rarity === 'rare' ? 10 : 5;

    return {
      success: true,
      message: `Used ${item.name}`,
      effects,
      durabilityLoss: 0,
      experienceGained,
      specialEvents: [],
      itemConsumed: item.consumable,
      cooldownApplied: 0
    };
  }

  private checkRequirements(item: InventoryItem, context: ItemUseContext): { success: boolean; message: string } {
    if (!item.requirements) return { success: true, message: '' };

    for (const req of item.requirements) {
      switch (req.type) {
        case 'animal_type':
          if (!context.targetAnimal || context.targetAnimal.species !== req.value) {
            return {
              success: false,
              message: `Requires ${req.value} animal type`
            };
          }
          break;
        case 'location':
          if (!context.location || context.location !== req.value) {
            return {
              success: false,
              message: `Must be used in ${req.value}`
            };
          }
          break;
      }
    }

    return { success: true, message: '' };
  }

  private applyItemEffects(effects: ItemEffect[], context: ItemUseContext): void {
    effects.forEach(effect => {
      if (effect.duration) {
        const endTime = Date.now() + (effect.duration * 1000);
        const effectId = `${effect.type}_${Date.now()}`;
        this.activeEffects.set(effectId, { effect, endTime });
      }
    });
  }

  private startEffectCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredEffects: string[] = [];
      
      this.activeEffects.forEach((data, id) => {
        if (data.endTime <= now) {
          expiredEffects.push(id);
        }
      });
      
      expiredEffects.forEach(id => this.activeEffects.delete(id));
      
      // Also clean up expired cooldowns
      const expiredCooldowns: string[] = [];
      this.itemCooldowns.forEach((endTime, itemId) => {
        if (endTime <= now) {
          expiredCooldowns.push(itemId);
        }
      });
      
      expiredCooldowns.forEach(id => this.itemCooldowns.delete(id));
      
    }, 1000); // Check every second
  }

  private loadItemData(): void {
    try {
      const saved = localStorage.getItem('feralFriends_itemData');
      if (saved) {
        const data = JSON.parse(saved);
        this.activeEffects = new Map(data.activeEffects || []);
        this.itemCooldowns = new Map(data.itemCooldowns || []);
        this.crafting = new Map(data.crafting || []);
      }
    } catch (error) {
      console.warn('Failed to load item data:', error);
    }
  }

  private saveItemData(): void {
    try {
      const data = {
        activeEffects: Array.from(this.activeEffects.entries()),
        itemCooldowns: Array.from(this.itemCooldowns.entries()),
        crafting: Array.from(this.crafting.entries())
      };
      localStorage.setItem('feralFriends_itemData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save item data:', error);
    }
  }
}

// Export singleton instance
export const itemSystem = new ItemSystem();