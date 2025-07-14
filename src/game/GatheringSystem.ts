import { InventoryItem } from './InventorySystem';
import { ITEM_DATABASE } from './ItemSystem';
import { Animal } from './Animal';

export type ResourceType = 'mineral' | 'plant' | 'artifact' | 'craft_material' | 'rare_find';
export type GatheringMethod = 'mining' | 'foraging' | 'excavation' | 'collection' | 'hunting';
export type EnvironmentType = 'forest' | 'meadow' | 'stream' | 'cave' | 'mountain' | 'beach' | 'ruins';

export interface GatheringResource {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: ResourceType;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseValue: number;
  environments: EnvironmentType[];
  gatheringMethods: GatheringMethod[];
  seasonality: string[];
  timeOfDay: ('morning' | 'afternoon' | 'evening' | 'night')[];
  weatherRequirements: string[];
  toolRequirements: string[];
  skillRequirements: { skill: string; level: number }[];
  companionBonuses: { species: string; bonus: number }[];
}

export interface GatheringNode {
  id: string;
  name: string;
  description: string;
  location: { x: number; y: number };
  environment: EnvironmentType;
  resources: GatheringNodeResource[];
  respawnTime: number; // milliseconds
  lastGathered: number;
  totalYield: number;
  currentYield: number;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'extreme';
  discovered: boolean;
  permanentNode: boolean;
  seasonalNode: boolean;
  activeSeasons: string[];
  degradation: number; // 0-100, higher = more depleted
  specialProperties: NodeProperty[];
}

export interface GatheringNodeResource {
  resourceId: string;
  probability: number; // 0-100
  minQuantity: number;
  maxQuantity: number;
  qualityModifier: number; // affects rarity chance
  depletionRate: number; // how much this affects node degradation
}

export interface NodeProperty {
  type: 'magical' | 'unstable' | 'rich' | 'protected' | 'cursed' | 'blessed';
  effect: string;
  magnitude: number;
  duration?: number; // for temporary properties
}

export interface GatheringAttempt {
  nodeId: string;
  method: GatheringMethod;
  duration: number; // seconds
  toolsUsed: string[];
  companionsPresent: string[];
  weatherConditions: string;
  timeOfDay: string;
  playerSkill: number;
  startTime: number;
}

export interface GatheringResult {
  success: boolean;
  itemsGathered: GatheredItem[];
  experienceGained: number;
  skillImprovement: { skill: string; improvement: number }[];
  nodeStateChange: {
    yieldDecrease: number;
    degradationIncrease: number;
    specialEvents: string[];
  };
  timeSpent: number;
  efficiency: number; // 0-100
  criticalSuccess: boolean;
  discoveredResources: string[];
  message: string;
  warnings: string[];
}

export interface GatheredItem {
  resourceId: string;
  quantity: number;
  quality: 'poor' | 'normal' | 'good' | 'excellent' | 'perfect';
  specialProperties: string[];
  gatheringBonus: number;
}

export interface GatheringSkill {
  name: string;
  level: number;
  experience: number;
  experienceToNext: number;
  bonuses: SkillBonus[];
  unlocks: SkillUnlock[];
}

export interface SkillBonus {
  type: 'efficiency' | 'yield' | 'quality' | 'discovery' | 'speed';
  value: number;
  description: string;
}

export interface SkillUnlock {
  requirement: number; // skill level required
  name: string;
  description: string;
  type: 'method' | 'location' | 'resource' | 'ability';
}

// Resource database
export const GATHERING_RESOURCES: Record<string, GatheringResource> = {
  crystal_shard: {
    id: 'crystal_shard',
    name: 'Crystal Shard',
    description: 'A fragment of magical crystal that pulses with inner light',
    icon: '💎',
    type: 'mineral',
    rarity: 'rare',
    baseValue: 50,
    environments: ['cave', 'mountain'],
    gatheringMethods: ['mining', 'excavation'],
    seasonality: ['all'],
    timeOfDay: ['morning', 'afternoon', 'evening', 'night'],
    weatherRequirements: [],
    toolRequirements: ['mining_pick', 'crystal_detector'],
    skillRequirements: [{ skill: 'mining', level: 15 }],
    companionBonuses: [
      { species: 'mole', bonus: 25 },
      { species: 'crystal_sprite', bonus: 50 }
    ]
  },

  moonflower_petal: {
    id: 'moonflower_petal',
    name: 'Moonflower Petal',
    description: 'Delicate petals that only bloom under moonlight',
    icon: '🌙',
    type: 'plant',
    rarity: 'uncommon',
    baseValue: 25,
    environments: ['meadow', 'forest'],
    gatheringMethods: ['foraging', 'collection'],
    seasonality: ['summer', 'autumn'],
    timeOfDay: ['evening', 'night'],
    weatherRequirements: ['clear', 'cloudy'],
    toolRequirements: [],
    skillRequirements: [{ skill: 'herbalism', level: 8 }],
    companionBonuses: [
      { species: 'rabbit', bonus: 15 },
      { species: 'deer', bonus: 20 }
    ]
  },

  ancient_coin: {
    id: 'ancient_coin',
    name: 'Ancient Coin',
    description: 'A tarnished coin from a long-lost civilization',
    icon: '🪙',
    type: 'artifact',
    rarity: 'epic',
    baseValue: 150,
    environments: ['ruins', 'beach', 'cave'],
    gatheringMethods: ['excavation', 'collection'],
    seasonality: ['all'],
    timeOfDay: ['morning', 'afternoon', 'evening', 'night'],
    weatherRequirements: [],
    toolRequirements: ['metal_detector', 'excavation_tools'],
    skillRequirements: [{ skill: 'archaeology', level: 20 }],
    companionBonuses: [
      { species: 'crow', bonus: 30 },
      { species: 'fox', bonus: 15 }
    ]
  },

  starfall_essence: {
    id: 'starfall_essence',
    name: 'Starfall Essence',
    description: 'Concentrated starlight that fell to earth',
    icon: '⭐',
    type: 'rare_find',
    rarity: 'legendary',
    baseValue: 500,
    environments: ['mountain', 'meadow'],
    gatheringMethods: ['collection'],
    seasonality: ['all'],
    timeOfDay: ['night'],
    weatherRequirements: ['clear'],
    toolRequirements: ['star_collector'],
    skillRequirements: [{ skill: 'astral_gathering', level: 30 }],
    companionBonuses: [
      { species: 'owl', bonus: 40 },
      { species: 'wolf', bonus: 25 }
    ]
  },

  ironwood_bark: {
    id: 'ironwood_bark',
    name: 'Ironwood Bark',
    description: 'Incredibly durable bark from the rare ironwood tree',
    icon: '🟫',
    type: 'craft_material',
    rarity: 'uncommon',
    baseValue: 35,
    environments: ['forest'],
    gatheringMethods: ['foraging', 'collection'],
    seasonality: ['spring', 'summer', 'autumn'],
    timeOfDay: ['morning', 'afternoon'],
    weatherRequirements: [],
    toolRequirements: ['bark_stripper'],
    skillRequirements: [{ skill: 'woodcraft', level: 12 }],
    companionBonuses: [
      { species: 'squirrel', bonus: 20 },
      { species: 'woodpecker', bonus: 35 }
    ]
  },

  river_pearl: {
    id: 'river_pearl',
    name: 'River Pearl',
    description: 'A lustrous pearl found in freshwater streams',
    icon: '🔮',
    type: 'mineral',
    rarity: 'rare',
    baseValue: 80,
    environments: ['stream'],
    gatheringMethods: ['collection', 'hunting'],
    seasonality: ['spring', 'summer'],
    timeOfDay: ['morning', 'afternoon'],
    weatherRequirements: ['clear', 'rainy'],
    toolRequirements: ['diving_gear'],
    skillRequirements: [{ skill: 'aquatic_gathering', level: 18 }],
    companionBonuses: [
      { species: 'otter', bonus: 45 },
      { species: 'turtle', bonus: 30 }
    ]
  }
};

// Gathering nodes throughout the world
export const GATHERING_NODES: GatheringNode[] = [
  {
    id: 'crystal_cavern',
    name: 'Crystal Cavern',
    description: 'A hidden cavern filled with glowing crystal formations',
    location: { x: 150, y: 200 },
    environment: 'cave',
    resources: [
      {
        resourceId: 'crystal_shard',
        probability: 60,
        minQuantity: 1,
        maxQuantity: 3,
        qualityModifier: 1.2,
        depletionRate: 5
      }
    ],
    respawnTime: 14400000, // 4 hours
    lastGathered: 0,
    totalYield: 100,
    currentYield: 100,
    difficulty: 'hard',
    discovered: false,
    permanentNode: true,
    seasonalNode: false,
    activeSeasons: ['all'],
    degradation: 0,
    specialProperties: [
      {
        type: 'magical',
        effect: 'Increases crystal quality by 20%',
        magnitude: 20
      }
    ]
  },

  {
    id: 'moonflower_grove',
    name: 'Moonflower Grove',
    description: 'A mystical grove where moonflowers bloom at night',
    location: { x: 75, y: 125 },
    environment: 'meadow',
    resources: [
      {
        resourceId: 'moonflower_petal',
        probability: 80,
        minQuantity: 2,
        maxQuantity: 5,
        qualityModifier: 1.0,
        depletionRate: 3
      }
    ],
    respawnTime: 7200000, // 2 hours
    lastGathered: 0,
    totalYield: 150,
    currentYield: 150,
    difficulty: 'medium',
    discovered: true,
    permanentNode: true,
    seasonalNode: true,
    activeSeasons: ['summer', 'autumn'],
    degradation: 0,
    specialProperties: [
      {
        type: 'blessed',
        effect: 'Only blooms under moonlight',
        magnitude: 100
      }
    ]
  },

  {
    id: 'ancient_ruins',
    name: 'Lost Temple Ruins',
    description: 'Crumbling ruins of an ancient civilization',
    location: { x: 300, y: 180 },
    environment: 'ruins',
    resources: [
      {
        resourceId: 'ancient_coin',
        probability: 25,
        minQuantity: 1,
        maxQuantity: 2,
        qualityModifier: 1.5,
        depletionRate: 8
      }
    ],
    respawnTime: 86400000, // 24 hours
    lastGathered: 0,
    totalYield: 50,
    currentYield: 50,
    difficulty: 'extreme',
    discovered: false,
    permanentNode: true,
    seasonalNode: false,
    activeSeasons: ['all'],
    degradation: 15,
    specialProperties: [
      {
        type: 'cursed',
        effect: 'Chance of encountering guardian spirits',
        magnitude: 30
      },
      {
        type: 'rich',
        effect: 'Higher chance of rare artifacts',
        magnitude: 25
      }
    ]
  },

  {
    id: 'starfall_peak',
    name: 'Starfall Peak',
    description: 'The highest mountain peak where stars touch the earth',
    location: { x: 400, y: 50 },
    environment: 'mountain',
    resources: [
      {
        resourceId: 'starfall_essence',
        probability: 10,
        minQuantity: 1,
        maxQuantity: 1,
        qualityModifier: 2.0,
        depletionRate: 15
      }
    ],
    respawnTime: 259200000, // 3 days
    lastGathered: 0,
    totalYield: 20,
    currentYield: 20,
    difficulty: 'extreme',
    discovered: false,
    permanentNode: true,
    seasonalNode: false,
    activeSeasons: ['all'],
    degradation: 0,
    specialProperties: [
      {
        type: 'magical',
        effect: 'Only accessible during clear nights',
        magnitude: 100
      },
      {
        type: 'blessed',
        effect: 'Starfall essence has enhanced properties',
        magnitude: 50
      }
    ]
  },

  {
    id: 'ironwood_forest',
    name: 'Ancient Ironwood Forest',
    description: 'A forest of rare ironwood trees with metallic bark',
    location: { x: 200, y: 300 },
    environment: 'forest',
    resources: [
      {
        resourceId: 'ironwood_bark',
        probability: 70,
        minQuantity: 1,
        maxQuantity: 4,
        qualityModifier: 1.1,
        depletionRate: 4
      }
    ],
    respawnTime: 10800000, // 3 hours
    lastGathered: 0,
    totalYield: 200,
    currentYield: 200,
    difficulty: 'medium',
    discovered: true,
    permanentNode: true,
    seasonalNode: true,
    activeSeasons: ['spring', 'summer', 'autumn'],
    degradation: 5,
    specialProperties: [
      {
        type: 'protected',
        effect: 'Forest spirits watch over this place',
        magnitude: 20
      }
    ]
  }
];

export class GatheringSystem {
  private gatheringNodes: GatheringNode[] = [...GATHERING_NODES];
  private activeGathering: GatheringAttempt | null = null;
  private gatheringSkills: Map<string, GatheringSkill> = new Map();
  private discoveries: Set<string> = new Set();
  private weatherConditions: string = 'clear';
  private timeOfDay: string = 'afternoon';
  
  private callbacks: {
    onGatheringComplete?: (result: GatheringResult) => void;
    onNodeDiscovered?: (nodeId: string) => void;
    onResourceDiscovered?: (resourceId: string) => void;
    onSkillImproved?: (skill: string, newLevel: number) => void;
    onSpecialEvent?: (event: string, context: any) => void;
  } = {};

  constructor() {
    this.initializeSkills();
    this.loadGatheringData();
    this.startNodeRegeneration();
  }

  /**
   * Start gathering at a specific node
   */
  startGathering(
    nodeId: string, 
    method: GatheringMethod,
    toolsUsed: string[] = [],
    companionsPresent: string[] = []
  ): {
    success: boolean;
    message: string;
    estimatedTime: number;
    requirements: string[];
    warnings: string[];
  } {
    if (this.activeGathering) {
      return {
        success: false,
        message: 'Already gathering at another location',
        estimatedTime: 0,
        requirements: [],
        warnings: []
      };
    }

    const node = this.gatheringNodes.find(n => n.id === nodeId);
    if (!node) {
      return {
        success: false,
        message: 'Gathering node not found',
        estimatedTime: 0,
        requirements: [],
        warnings: []
      };
    }

    if (!node.discovered) {
      return {
        success: false,
        message: 'This gathering location has not been discovered yet',
        estimatedTime: 0,
        requirements: [],
        warnings: []
      };
    }

    // Check if node is ready for gathering
    const timeSinceLastGather = Date.now() - node.lastGathered;
    if (timeSinceLastGather < node.respawnTime && node.currentYield <= 0) {
      const timeRemaining = node.respawnTime - timeSinceLastGather;
      return {
        success: false,
        message: `Location needs ${Math.ceil(timeRemaining / 3600000)} more hours to replenish`,
        estimatedTime: timeRemaining,
        requirements: [],
        warnings: []
      };
    }

    // Check requirements and generate warnings
    const requirements: string[] = [];
    const warnings: string[] = [];
    
    // Check if method is valid for node resources
    const validMethods = new Set<GatheringMethod>();
    node.resources.forEach(resource => {
      const resourceData = GATHERING_RESOURCES[resource.resourceId];
      if (resourceData) {
        resourceData.gatheringMethods.forEach(method => validMethods.add(method));
      }
    });

    if (!validMethods.has(method)) {
      requirements.push(`This location requires: ${Array.from(validMethods).join(', ')}`);
    }

    // Check tool requirements
    const requiredTools = new Set<string>();
    node.resources.forEach(resource => {
      const resourceData = GATHERING_RESOURCES[resource.resourceId];
      if (resourceData) {
        resourceData.toolRequirements.forEach(tool => requiredTools.add(tool));
      }
    });

    const missingTools = Array.from(requiredTools).filter(tool => !toolsUsed.includes(tool));
    if (missingTools.length > 0) {
      requirements.push(`Required tools: ${missingTools.join(', ')}`);
    }

    // Check skill requirements
    node.resources.forEach(resource => {
      const resourceData = GATHERING_RESOURCES[resource.resourceId];
      if (resourceData) {
        resourceData.skillRequirements.forEach(skillReq => {
          const skill = this.gatheringSkills.get(skillReq.skill);
          if (!skill || skill.level < skillReq.requirement) {
            requirements.push(`${skillReq.skill} level ${skillReq.requirement} required`);
          }
        });
      }
    });

    // Generate warnings
    if (node.degradation > 70) {
      warnings.push('This location is heavily depleted and may yield poor results');
    }

    const cursedProperty = node.specialProperties.find(p => p.type === 'cursed');
    if (cursedProperty) {
      warnings.push('This location has a cursed aura - proceed with caution');
    }

    if (node.difficulty === 'extreme') {
      warnings.push('This is an extremely difficult gathering location');
    }

    if (requirements.length > 0) {
      return {
        success: false,
        message: 'Requirements not met',
        estimatedTime: 0,
        requirements,
        warnings
      };
    }

    // Start gathering
    const baseTime = this.getGatheringTime(node.difficulty, method);
    const estimatedTime = this.calculateGatheringTime(baseTime, toolsUsed, companionsPresent);

    this.activeGathering = {
      nodeId,
      method,
      duration: estimatedTime,
      toolsUsed,
      companionsPresent,
      weatherConditions: this.weatherConditions,
      timeOfDay: this.timeOfDay,
      playerSkill: this.calculatePlayerSkill(node, method),
      startTime: Date.now()
    };

    return {
      success: true,
      message: `Started ${method} at ${node.name}`,
      estimatedTime,
      requirements: [],
      warnings
    };
  }

  /**
   * Complete the current gathering attempt
   */
  completeGathering(): GatheringResult | null {
    if (!this.activeGathering) return null;

    const node = this.gatheringNodes.find(n => n.id === this.activeGathering!.nodeId);
    if (!node) return null;

    const timeSpent = Date.now() - this.activeGathering.startTime;
    const expectedTime = this.activeGathering.duration * 1000;
    
    // Calculate efficiency based on timing
    const efficiency = Math.min(100, Math.max(20, (timeSpent / expectedTime) * 100));
    const success = efficiency >= 60;

    let itemsGathered: GatheredItem[] = [];
    let experienceGained = 0;
    let skillImprovements: { skill: string; improvement: number }[] = [];
    let discoveredResources: string[] = [];
    let specialEvents: string[] = [];
    let criticalSuccess = false;

    if (success) {
      // Generate gathered items
      const gatheringResults = this.processGathering(node, this.activeGathering, efficiency);
      itemsGathered = gatheringResults.items;
      experienceGained = gatheringResults.experience;
      skillImprovements = gatheringResults.skillImprovements;
      discoveredResources = gatheringResults.discoveredResources;
      specialEvents = gatheringResults.specialEvents;
      criticalSuccess = gatheringResults.criticalSuccess;

      // Update node state
      const yieldDecrease = this.calculateYieldDecrease(node, this.activeGathering);
      const degradationIncrease = this.calculateDegradationIncrease(node, this.activeGathering);
      
      node.currentYield = Math.max(0, node.currentYield - yieldDecrease);
      node.degradation = Math.min(100, node.degradation + degradationIncrease);
      node.lastGathered = Date.now();

      // Apply skill improvements
      skillImprovements.forEach(improvement => {
        this.improveSkill(improvement.skill, improvement.improvement);
      });

      // Handle discoveries
      discoveredResources.forEach(resourceId => {
        if (!this.discoveries.has(resourceId)) {
          this.discoveries.add(resourceId);
          this.callbacks.onResourceDiscovered?.(resourceId);
        }
      });
    }

    const result: GatheringResult = {
      success,
      itemsGathered,
      experienceGained,
      skillImprovement: skillImprovements,
      nodeStateChange: {
        yieldDecrease: success ? this.calculateYieldDecrease(node, this.activeGathering) : 0,
        degradationIncrease: success ? this.calculateDegradationIncrease(node, this.activeGathering) : 0,
        specialEvents
      },
      timeSpent,
      efficiency,
      criticalSuccess,
      discoveredResources,
      message: this.generateGatheringMessage(success, efficiency, node, criticalSuccess),
      warnings: this.generateGatheringWarnings(node)
    };

    this.activeGathering = null;
    this.callbacks.onGatheringComplete?.(result);
    this.saveGatheringData();

    return result;
  }

  /**
   * Discover a new gathering node
   */
  discoverNode(nodeId: string): boolean {
    const node = this.gatheringNodes.find(n => n.id === nodeId);
    if (node && !node.discovered) {
      node.discovered = true;
      this.callbacks.onNodeDiscovered?.(nodeId);
      this.saveGatheringData();
      return true;
    }
    return false;
  }

  /**
   * Get available gathering nodes
   */
  getAvailableNodes(): GatheringNode[] {
    return this.gatheringNodes.filter(node => node.discovered);
  }

  /**
   * Get gathering skills
   */
  getGatheringSkills(): GatheringSkill[] {
    return Array.from(this.gatheringSkills.values());
  }

  /**
   * Get active gathering attempt
   */
  getActiveGathering(): GatheringAttempt | null {
    return this.activeGathering;
  }

  /**
   * Update environment conditions
   */
  updateConditions(weather: string, timeOfDay: string): void {
    this.weatherConditions = weather;
    this.timeOfDay = timeOfDay;
  }

  /**
   * Set gathering system callbacks
   */
  setCallbacks(callbacks: {
    onGatheringComplete?: (result: GatheringResult) => void;
    onNodeDiscovered?: (nodeId: string) => void;
    onResourceDiscovered?: (resourceId: string) => void;
    onSkillImproved?: (skill: string, newLevel: number) => void;
    onSpecialEvent?: (event: string, context: any) => void;
  }): void {
    this.callbacks = callbacks;
  }

  // Private methods

  private processGathering(
    node: GatheringNode, 
    attempt: GatheringAttempt, 
    efficiency: number
  ): {
    items: GatheredItem[];
    experience: number;
    skillImprovements: { skill: string; improvement: number }[];
    discoveredResources: string[];
    specialEvents: string[];
    criticalSuccess: boolean;
  } {
    const items: GatheredItem[] = [];
    const discoveredResources: string[] = [];
    const specialEvents: string[] = [];
    let experience = 0;
    let criticalSuccess = false;

    // Check for critical success
    const criticalChance = (efficiency / 100) * 0.1 + (attempt.playerSkill / 100) * 0.05;
    criticalSuccess = Math.random() < criticalChance;

    if (criticalSuccess) {
      specialEvents.push('critical_gathering_success');
      experience += 50;
    }

    // Process each resource in the node
    node.resources.forEach(nodeResource => {
      const resourceData = GATHERING_RESOURCES[nodeResource.resourceId];
      if (!resourceData) return;

      // Calculate success probability
      let successProbability = nodeResource.probability / 100;
      successProbability *= (efficiency / 100);
      successProbability *= this.getMethodEffectiveness(resourceData, attempt.method);
      successProbability *= this.getToolEffectiveness(resourceData, attempt.toolsUsed);
      successProbability *= this.getCompanionBonus(resourceData, attempt.companionsPresent);
      
      if (criticalSuccess) {
        successProbability *= 1.5;
      }

      if (Math.random() < successProbability) {
        // Determine quantity
        let quantity = Math.floor(
          Math.random() * (nodeResource.maxQuantity - nodeResource.minQuantity + 1) + 
          nodeResource.minQuantity
        );

        if (criticalSuccess) {
          quantity = Math.ceil(quantity * 1.5);
        }

        // Determine quality
        const qualityRoll = Math.random() * nodeResource.qualityModifier * (efficiency / 100);
        let quality: 'poor' | 'normal' | 'good' | 'excellent' | 'perfect';
        
        if (qualityRoll > 0.9) quality = 'perfect';
        else if (qualityRoll > 0.7) quality = 'excellent';
        else if (qualityRoll > 0.5) quality = 'good';
        else if (qualityRoll > 0.3) quality = 'normal';
        else quality = 'poor';

        // Check for first discovery
        if (!this.discoveries.has(nodeResource.resourceId)) {
          discoveredResources.push(nodeResource.resourceId);
          experience += 25;
          specialEvents.push('resource_first_discovery');
        }

        items.push({
          resourceId: nodeResource.resourceId,
          quantity,
          quality,
          specialProperties: this.generateSpecialProperties(resourceData, node, quality),
          gatheringBonus: Math.floor((efficiency - 60) / 10) * 5
        });

        // Calculate experience
        const baseExp = this.getBaseExperience(resourceData.rarity);
        const qualityMultiplier = { poor: 0.5, normal: 1, good: 1.2, excellent: 1.5, perfect: 2 }[quality];
        experience += Math.floor(baseExp * qualityMultiplier * quantity);
      }
    });

    // Calculate skill improvements
    const skillImprovements: { skill: string; improvement: number }[] = [];
    const relevantSkills = this.getRelevantSkills(node, attempt.method);
    
    relevantSkills.forEach(skillName => {
      const improvementChance = (efficiency / 100) * 0.3;
      if (Math.random() < improvementChance) {
        const improvement = Math.floor(Math.random() * 10) + 1;
        skillImprovements.push({ skill: skillName, improvement });
      }
    });

    return {
      items,
      experience,
      skillImprovements,
      discoveredResources,
      specialEvents,
      criticalSuccess
    };
  }

  private initializeSkills(): void {
    const skills = [
      'mining', 'herbalism', 'archaeology', 'astral_gathering', 
      'woodcraft', 'aquatic_gathering', 'foraging', 'excavation'
    ];

    skills.forEach(skillName => {
      this.gatheringSkills.set(skillName, {
        name: skillName,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        bonuses: this.getSkillBonuses(skillName, 1),
        unlocks: this.getSkillUnlocks(skillName)
      });
    });
  }

  private improveSkill(skillName: string, improvement: number): void {
    const skill = this.gatheringSkills.get(skillName);
    if (!skill) return;

    skill.experience += improvement;
    
    // Check for level up
    while (skill.experience >= skill.experienceToNext) {
      skill.experience -= skill.experienceToNext;
      skill.level++;
      skill.experienceToNext = Math.floor(skill.experienceToNext * 1.2);
      skill.bonuses = this.getSkillBonuses(skillName, skill.level);
      
      this.callbacks.onSkillImproved?.(skillName, skill.level);
    }
  }

  private getSkillBonuses(skillName: string, level: number): SkillBonus[] {
    const bonuses: SkillBonus[] = [];
    
    // Add level-based bonuses
    bonuses.push({
      type: 'efficiency',
      value: level * 2,
      description: `+${level * 2}% gathering efficiency`
    });

    if (level >= 5) {
      bonuses.push({
        type: 'yield',
        value: Math.floor(level / 5) * 10,
        description: `+${Math.floor(level / 5) * 10}% resource yield`
      });
    }

    if (level >= 10) {
      bonuses.push({
        type: 'quality',
        value: Math.floor(level / 10) * 15,
        description: `+${Math.floor(level / 10) * 15}% quality chance`
      });
    }

    return bonuses;
  }

  private getSkillUnlocks(skillName: string): SkillUnlock[] {
    const unlocks: SkillUnlock[] = [];
    
    // Add skill-specific unlocks
    switch (skillName) {
      case 'mining':
        unlocks.push(
          { requirement: 5, name: 'Crystal Detection', description: 'Can detect crystal nodes', type: 'ability' },
          { requirement: 15, name: 'Deep Mining', description: 'Access to deep cave systems', type: 'location' },
          { requirement: 25, name: 'Gem Identification', description: 'Identify rare gems accurately', type: 'ability' }
        );
        break;
      case 'herbalism':
        unlocks.push(
          { requirement: 5, name: 'Flower Preservation', description: 'Preserve delicate flowers', type: 'method' },
          { requirement: 15, name: 'Night Blooms', description: 'Gather night-blooming plants', type: 'resource' },
          { requirement: 25, name: 'Magical Plants', description: 'Access to magical plant varieties', type: 'resource' }
        );
        break;
    }

    return unlocks;
  }

  private getBaseExperience(rarity: string): number {
    switch (rarity) {
      case 'common': return 5;
      case 'uncommon': return 10;
      case 'rare': return 20;
      case 'epic': return 40;
      case 'legendary': return 80;
      default: return 5;
    }
  }

  private getGatheringTime(difficulty: string, method: GatheringMethod): number {
    const baseTimes = {
      trivial: 15,
      easy: 30,
      medium: 60,
      hard: 120,
      extreme: 300
    };

    const methodMultipliers = {
      collection: 0.8,
      foraging: 1.0,
      mining: 1.5,
      excavation: 2.0,
      hunting: 1.2
    };

    return (baseTimes[difficulty] || 60) * (methodMultipliers[method] || 1.0);
  }

  private calculateGatheringTime(baseTime: number, tools: string[], companions: string[]): number {
    let timeModifier = 1.0;
    
    // Tool bonuses
    if (tools.includes('efficiency_tools')) timeModifier *= 0.8;
    if (tools.includes('advanced_gear')) timeModifier *= 0.7;
    
    // Companion bonuses
    timeModifier *= Math.max(0.5, 1.0 - (companions.length * 0.1));
    
    return Math.floor(baseTime * timeModifier);
  }

  private calculatePlayerSkill(node: GatheringNode, method: GatheringMethod): number {
    const relevantSkills = this.getRelevantSkills(node, method);
    
    let totalSkill = 0;
    relevantSkills.forEach(skillName => {
      const skill = this.gatheringSkills.get(skillName);
      if (skill) {
        totalSkill += skill.level;
      }
    });
    
    return Math.min(100, totalSkill);
  }

  private getRelevantSkills(node: GatheringNode, method: GatheringMethod): string[] {
    const skills: string[] = [];
    
    // Add method-based skills
    switch (method) {
      case 'mining': skills.push('mining'); break;
      case 'foraging': skills.push('herbalism', 'foraging'); break;
      case 'excavation': skills.push('archaeology', 'excavation'); break;
      case 'collection': skills.push('foraging'); break;
      case 'hunting': skills.push('aquatic_gathering'); break;
    }
    
    // Add environment-based skills
    switch (node.environment) {
      case 'cave': skills.push('mining'); break;
      case 'forest': skills.push('woodcraft'); break;
      case 'stream': skills.push('aquatic_gathering'); break;
      case 'ruins': skills.push('archaeology'); break;
      case 'mountain': skills.push('astral_gathering'); break;
    }
    
    return [...new Set(skills)];
  }

  private getMethodEffectiveness(resource: GatheringResource, method: GatheringMethod): number {
    return resource.gatheringMethods.includes(method) ? 1.0 : 0.3;
  }

  private getToolEffectiveness(resource: GatheringResource, tools: string[]): number {
    const requiredTools = resource.toolRequirements;
    const hasAllTools = requiredTools.every(tool => tools.includes(tool));
    
    if (hasAllTools) return 1.2;
    
    const hasAnyTool = requiredTools.some(tool => tools.includes(tool));
    return hasAnyTool ? 1.0 : 0.7;
  }

  private getCompanionBonus(resource: GatheringResource, companions: string[]): number {
    let bonus = 1.0;
    
    resource.companionBonuses.forEach(companionBonus => {
      if (companions.includes(companionBonus.species)) {
        bonus *= (1 + companionBonus.bonus / 100);
      }
    });
    
    return Math.min(2.0, bonus);
  }

  private calculateYieldDecrease(node: GatheringNode, attempt: GatheringAttempt): number {
    let decrease = 5; // Base decrease
    
    // Modify based on method
    switch (attempt.method) {
      case 'mining': decrease += 3; break;
      case 'excavation': decrease += 5; break;
      case 'foraging': decrease += 1; break;
    }
    
    // Modify based on node properties
    const protectedProperty = node.specialProperties.find(p => p.type === 'protected');
    if (protectedProperty) {
      decrease = Math.floor(decrease * 0.5);
    }
    
    return decrease;
  }

  private calculateDegradationIncrease(node: GatheringNode, attempt: GatheringAttempt): number {
    let degradation = 2; // Base degradation
    
    // Heavy methods cause more degradation
    switch (attempt.method) {
      case 'mining': degradation += 3; break;
      case 'excavation': degradation += 4; break;
      case 'hunting': degradation += 2; break;
    }
    
    // Protected nodes resist degradation
    const protectedProperty = node.specialProperties.find(p => p.type === 'protected');
    if (protectedProperty) {
      degradation = Math.floor(degradation * 0.3);
    }
    
    return degradation;
  }

  private generateSpecialProperties(
    resource: GatheringResource, 
    node: GatheringNode, 
    quality: string
  ): string[] {
    const properties: string[] = [];
    
    // Quality-based properties
    if (quality === 'perfect') {
      properties.push('flawless');
    } else if (quality === 'excellent') {
      properties.push('pristine');
    }
    
    // Node-based properties
    const magicalProperty = node.specialProperties.find(p => p.type === 'magical');
    if (magicalProperty && Math.random() < 0.3) {
      properties.push('magically_enhanced');
    }
    
    const blessedProperty = node.specialProperties.find(p => p.type === 'blessed');
    if (blessedProperty && Math.random() < 0.2) {
      properties.push('blessed');
    }
    
    return properties;
  }

  private generateGatheringMessage(
    success: boolean, 
    efficiency: number, 
    node: GatheringNode, 
    criticalSuccess: boolean
  ): string {
    if (criticalSuccess) {
      return `Amazing success at ${node.name}! You've found exceptional resources!`;
    }
    
    if (!success) {
      return `Your gathering attempt at ${node.name} wasn't very successful.`;
    }
    
    if (efficiency >= 90) {
      return `Excellent gathering session at ${node.name}!`;
    } else if (efficiency >= 70) {
      return `Good results from ${node.name}.`;
    } else {
      return `Modest success at ${node.name}.`;
    }
  }

  private generateGatheringWarnings(node: GatheringNode): string[] {
    const warnings: string[] = [];
    
    if (node.currentYield < 20) {
      warnings.push('This location is nearly depleted');
    }
    
    if (node.degradation > 80) {
      warnings.push('Severe environmental damage detected');
    }
    
    return warnings;
  }

  private startNodeRegeneration(): void {
    setInterval(() => {
      this.gatheringNodes.forEach(node => {
        const timeSinceGather = Date.now() - node.lastGathered;
        
        // Regenerate yield over time
        if (timeSinceGather > node.respawnTime && node.currentYield < node.totalYield) {
          const regenRate = Math.max(1, Math.floor(node.totalYield / 20));
          node.currentYield = Math.min(node.totalYield, node.currentYield + regenRate);
        }
        
        // Slowly heal degradation over time
        if (timeSinceGather > node.respawnTime * 2 && node.degradation > 0) {
          node.degradation = Math.max(0, node.degradation - 1);
        }
      });
      
      this.saveGatheringData();
    }, 300000); // Every 5 minutes
  }

  private loadGatheringData(): void {
    try {
      const saved = localStorage.getItem('feralFriends_gatheringData');
      if (saved) {
        const data = JSON.parse(saved);
        this.gatheringNodes = data.gatheringNodes || [...GATHERING_NODES];
        this.gatheringSkills = new Map(data.gatheringSkills || []);
        this.discoveries = new Set(data.discoveries || []);
        this.weatherConditions = data.weatherConditions || 'clear';
        this.timeOfDay = data.timeOfDay || 'afternoon';
      }
    } catch (error) {
      console.warn('Failed to load gathering data:', error);
    }
  }

  private saveGatheringData(): void {
    try {
      const data = {
        gatheringNodes: this.gatheringNodes,
        gatheringSkills: Array.from(this.gatheringSkills.entries()),
        discoveries: Array.from(this.discoveries),
        weatherConditions: this.weatherConditions,
        timeOfDay: this.timeOfDay
      };
      localStorage.setItem('feralFriends_gatheringData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save gathering data:', error);
    }
  }
}

// Export singleton instance
export const gatheringSystem = new GatheringSystem();