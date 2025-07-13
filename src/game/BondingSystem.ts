import { Animal } from './Animal';
import { PersonalityProfile } from './AnimalPersonality';

export type BondLevel = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'companion' | 'soul_mate';

export interface BondingProgress {
  animalId: string;
  currentBondLevel: BondLevel;
  bondPoints: number; // 0-1000 points
  bondLevelNumber: number; // 0-5 for easier calculations
  timeSpentTogether: number; // milliseconds
  sharedExperiences: SharedExperience[];
  bondingMilestones: BondingMilestone[];
  companionshipDate?: number; // timestamp when became companion
  lastBondingActivity: number; // timestamp
  bondDecayRate: number; // how fast bond decays without interaction
  specialAbilities: string[];
  bondingPreferences: {
    preferredActivities: string[];
    favoriteInteractions: string[];
    bondingStyle: 'slow_steady' | 'activity_based' | 'emotional' | 'trust_based';
  };
  relationshipHistory: RelationshipEvent[];
}

export interface SharedExperience {
  id: string;
  type: 'exploration' | 'play' | 'learning' | 'challenge' | 'comfort' | 'adventure';
  description: string;
  timestamp: number;
  bondValueGained: number;
  emotionalImpact: 'low' | 'medium' | 'high' | 'profound';
  location?: string;
  participants?: string[]; // Other animals involved
}

export interface BondingMilestone {
  id: string;
  name: string;
  description: string;
  bondLevelRequired: BondLevel;
  achieved: boolean;
  achievedDate?: number;
  requirements: BondingRequirement[];
  rewards: BondingReward[];
  isSpecial: boolean; // Rare or unique milestones
}

export interface BondingRequirement {
  type: 'time_spent' | 'shared_experiences' | 'trust_level' | 'activities_completed' | 'special_event';
  value: number;
  description: string;
  currentProgress: number;
  completed: boolean;
}

export interface BondingReward {
  type: 'ability' | 'interaction' | 'privilege' | 'knowledge' | 'item' | 'access';
  id: string;
  name: string;
  description: string;
  permanent: boolean;
}

export interface RelationshipEvent {
  timestamp: number;
  type: 'bond_increase' | 'bond_decrease' | 'milestone_achieved' | 'ability_unlocked' | 'conflict' | 'reconciliation';
  description: string;
  bondImpact: number;
  significance: 'minor' | 'moderate' | 'major' | 'life_changing';
}

export interface CompanionAbility {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'triggered';
  bondLevelRequired: BondLevel;
  cooldown?: number; // for active abilities
  energyCost?: number;
  effects: AbilityEffect[];
  requirements?: string[];
}

export interface AbilityEffect {
  type: 'stat_boost' | 'skill_enhancement' | 'special_action' | 'environmental' | 'social';
  target: 'player' | 'companion' | 'both' | 'environment';
  value: number;
  duration?: number; // milliseconds, undefined for permanent
  description: string;
}

// Bond level definitions with requirements and unlocks
export const BOND_LEVELS: Record<BondLevel, {
  level: number;
  name: string;
  description: string;
  pointsRequired: number;
  timeRequired: number; // minimum time in milliseconds
  specialRequirements: string[];
  unlocks: string[];
  abilities: string[];
  privileges: string[];
}> = {
  stranger: {
    level: 0,
    name: 'Stranger',
    description: 'You are unknown to this animal',
    pointsRequired: 0,
    timeRequired: 0,
    specialRequirements: [],
    unlocks: ['basic_observation', 'cautious_approach'],
    abilities: [],
    privileges: []
  },
  acquaintance: {
    level: 1,
    name: 'Acquaintance',
    description: 'The animal recognizes and tolerates you',
    pointsRequired: 100,
    timeRequired: 300000, // 5 minutes
    specialRequirements: ['successful_interactions:3'],
    unlocks: ['gentle_interaction', 'food_offering', 'name_assignment'],
    abilities: ['recognize_player'],
    privileges: ['approach_tolerance']
  },
  friend: {
    level: 2,
    name: 'Friend',
    description: 'The animal enjoys your company',
    pointsRequired: 300,
    timeRequired: 900000, // 15 minutes
    specialRequirements: ['trust_level:50', 'shared_experiences:2'],
    unlocks: ['play_interactions', 'basic_tricks', 'emotional_support'],
    abilities: ['follow_player', 'simple_commands'],
    privileges: ['priority_attention', 'protective_behavior']
  },
  close_friend: {
    level: 3,
    name: 'Close Friend',
    description: 'You have formed a meaningful bond',
    pointsRequired: 600,
    timeRequired: 1800000, // 30 minutes
    specialRequirements: ['trust_level:75', 'shared_experiences:5', 'milestone_achievements:2'],
    unlocks: ['advanced_tricks', 'emotional_communication', 'cooperative_activities'],
    abilities: ['empathetic_response', 'skill_assistance', 'mood_synchronization'],
    privileges: ['exclusive_interactions', 'special_locations']
  },
  companion: {
    level: 4,
    name: 'Companion',
    description: 'This animal is your loyal companion',
    pointsRequired: 850,
    timeRequired: 3600000, // 1 hour
    specialRequirements: ['trust_level:90', 'shared_experiences:10', 'milestone_achievements:5', 'special_bond_event'],
    unlocks: ['companionship_privileges', 'advanced_cooperation', 'telepathic_connection'],
    abilities: ['intuitive_assistance', 'emotional_healing', 'enhanced_abilities'],
    privileges: ['permanent_companionship', 'shared_adventures', 'mutual_growth']
  },
  soul_mate: {
    level: 5,
    name: 'Soul Mate',
    description: 'You and this animal share an unbreakable bond',
    pointsRequired: 1000,
    timeRequired: 7200000, // 2 hours
    specialRequirements: ['trust_level:100', 'shared_experiences:20', 'milestone_achievements:10', 'legendary_bond_event'],
    unlocks: ['soul_bond_abilities', 'perfect_harmony', 'transcendent_connection'],
    abilities: ['soul_synchronization', 'shared_consciousness', 'miraculous_abilities'],
    privileges: ['eternal_bond', 'legendary_status', 'unique_experiences']
  }
};

// Predefined companion abilities
export const COMPANION_ABILITIES: Record<string, CompanionAbility> = {
  recognize_player: {
    id: 'recognize_player',
    name: 'Player Recognition',
    description: 'The animal can recognize and remember you',
    type: 'passive',
    bondLevelRequired: 'acquaintance',
    effects: [
      {
        type: 'social',
        target: 'companion',
        value: 1,
        description: 'Animal approaches you more readily'
      }
    ]
  },
  
  follow_player: {
    id: 'follow_player',
    name: 'Following',
    description: 'The animal will follow you around',
    type: 'active',
    bondLevelRequired: 'friend',
    cooldown: 5000,
    effects: [
      {
        type: 'special_action',
        target: 'companion',
        value: 1,
        description: 'Animal follows within 2 tiles of player'
      }
    ]
  },
  
  simple_commands: {
    id: 'simple_commands',
    name: 'Simple Commands',
    description: 'The animal responds to basic commands',
    type: 'active',
    bondLevelRequired: 'friend',
    cooldown: 3000,
    effects: [
      {
        type: 'skill_enhancement',
        target: 'companion',
        value: 1,
        description: 'Animal can perform sit, stay, come commands'
      }
    ]
  },
  
  empathetic_response: {
    id: 'empathetic_response',
    name: 'Empathetic Response',
    description: 'The animal responds to your emotional state',
    type: 'triggered',
    bondLevelRequired: 'close_friend',
    effects: [
      {
        type: 'stat_boost',
        target: 'player',
        value: 10,
        duration: 30000,
        description: 'Provides comfort when player is stressed'
      }
    ]
  },
  
  skill_assistance: {
    id: 'skill_assistance',
    name: 'Skill Assistance',
    description: 'The animal helps you with various tasks',
    type: 'active',
    bondLevelRequired: 'close_friend',
    cooldown: 15000,
    energyCost: 5,
    effects: [
      {
        type: 'skill_enhancement',
        target: 'player',
        value: 20,
        duration: 60000,
        description: 'Improves success rate of interactions'
      }
    ]
  },
  
  intuitive_assistance: {
    id: 'intuitive_assistance',
    name: 'Intuitive Assistance',
    description: 'The animal anticipates your needs',
    type: 'passive',
    bondLevelRequired: 'companion',
    effects: [
      {
        type: 'stat_boost',
        target: 'player',
        value: 15,
        description: 'Reduces energy cost of all actions'
      }
    ]
  },
  
  emotional_healing: {
    id: 'emotional_healing',
    name: 'Emotional Healing',
    description: 'The animal can heal emotional wounds',
    type: 'active',
    bondLevelRequired: 'companion',
    cooldown: 60000,
    energyCost: 10,
    effects: [
      {
        type: 'stat_boost',
        target: 'player',
        value: 50,
        duration: 300000,
        description: 'Significantly reduces stress and increases happiness'
      }
    ]
  },
  
  soul_synchronization: {
    id: 'soul_synchronization',
    name: 'Soul Synchronization',
    description: 'Your souls are perfectly synchronized',
    type: 'passive',
    bondLevelRequired: 'soul_mate',
    effects: [
      {
        type: 'stat_boost',
        target: 'both',
        value: 25,
        description: 'All stats boosted when together'
      }
    ]
  }
};

export class BondingSystem {
  private bondingProgress: Map<string, BondingProgress> = new Map();
  private activeBonds: Set<string> = new Set();
  private bondingCallbacks: {
    onBondLevelUp?: (animalId: string, newLevel: BondLevel) => void;
    onMilestoneAchieved?: (animalId: string, milestone: BondingMilestone) => void;
    onAbilityUnlocked?: (animalId: string, ability: CompanionAbility) => void;
    onBondDecay?: (animalId: string, decayAmount: number) => void;
  } = {};

  constructor() {
    this.loadBondingData();
    this.startBondMaintenanceLoop();
  }

  /**
   * Initialize bonding progress for an animal
   */
  initializeBonding(animal: Animal, personality: PersonalityProfile): BondingProgress {
    const progress: BondingProgress = {
      animalId: animal.id,
      currentBondLevel: 'stranger',
      bondPoints: 0,
      bondLevelNumber: 0,
      timeSpentTogether: 0,
      sharedExperiences: [],
      bondingMilestones: this.createInitialMilestones(animal.id),
      lastBondingActivity: Date.now(),
      bondDecayRate: this.calculateBondDecayRate(personality),
      specialAbilities: [],
      bondingPreferences: this.determineBondingPreferences(personality),
      relationshipHistory: [
        {
          timestamp: Date.now(),
          type: 'bond_increase',
          description: 'First meeting - relationship begins',
          bondImpact: 0,
          significance: 'minor'
        }
      ]
    };

    this.bondingProgress.set(animal.id, progress);
    return progress;
  }

  /**
   * Add bond points and check for level ups
   */
  addBondPoints(
    animalId: string,
    points: number,
    reason: string,
    experienceType?: 'exploration' | 'play' | 'learning' | 'challenge' | 'comfort' | 'adventure'
  ): {
    levelUp: boolean;
    newLevel?: BondLevel;
    milestonesAchieved: BondingMilestone[];
    abilitiesUnlocked: CompanionAbility[];
  } {
    const progress = this.bondingProgress.get(animalId);
    if (!progress) {
      throw new Error(`No bonding progress found for animal: ${animalId}`);
    }

    const oldPoints = progress.bondPoints;
    const oldLevel = progress.currentBondLevel;
    
    // Add points with bonding preference modifiers
    const modifiedPoints = this.applyBondingPreferences(progress, points, experienceType);
    progress.bondPoints = Math.min(1000, progress.bondPoints + modifiedPoints);
    progress.lastBondingActivity = Date.now();

    // Add to relationship history
    progress.relationshipHistory.push({
      timestamp: Date.now(),
      type: 'bond_increase',
      description: reason,
      bondImpact: modifiedPoints,
      significance: modifiedPoints > 20 ? 'major' : modifiedPoints > 10 ? 'moderate' : 'minor'
    });

    // Check for level up
    const newLevel = this.calculateBondLevel(progress.bondPoints, progress.timeSpentTogether);
    const levelUp = newLevel !== oldLevel;
    
    if (levelUp) {
      progress.currentBondLevel = newLevel;
      progress.bondLevelNumber = BOND_LEVELS[newLevel].level;
      
      // Add level up to history
      progress.relationshipHistory.push({
        timestamp: Date.now(),
        type: 'milestone_achieved',
        description: `Bond level increased to ${newLevel}`,
        bondImpact: 0,
        significance: 'major'
      });
    }

    // Check for milestone achievements
    const milestonesAchieved = this.checkMilestoneAchievements(progress);
    
    // Check for ability unlocks
    const abilitiesUnlocked = this.checkAbilityUnlocks(progress);

    // Update special abilities list
    progress.specialAbilities = this.getAvailableAbilities(progress.currentBondLevel);

    // Trigger callbacks
    if (levelUp) {
      this.bondingCallbacks.onBondLevelUp?.(animalId, newLevel);
    }
    
    milestonesAchieved.forEach(milestone => {
      this.bondingCallbacks.onMilestoneAchieved?.(animalId, milestone);
    });
    
    abilitiesUnlocked.forEach(ability => {
      this.bondingCallbacks.onAbilityUnlocked?.(animalId, ability);
    });

    this.saveBondingData();

    return {
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      milestonesAchieved,
      abilitiesUnlocked
    };
  }

  /**
   * Add a shared experience
   */
  addSharedExperience(
    animalId: string,
    experience: Omit<SharedExperience, 'id' | 'timestamp'>
  ): void {
    const progress = this.bondingProgress.get(animalId);
    if (!progress) return;

    const sharedExperience: SharedExperience = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...experience
    };

    progress.sharedExperiences.push(sharedExperience);
    
    // Shared experiences add bond points
    this.addBondPoints(
      animalId,
      sharedExperience.bondValueGained,
      `Shared experience: ${sharedExperience.description}`,
      sharedExperience.type
    );
  }

  /**
   * Update time spent together
   */
  updateTimeSpentTogether(animalId: string, timeElapsed: number): void {
    const progress = this.bondingProgress.get(animalId);
    if (!progress) return;

    progress.timeSpentTogether += timeElapsed;
    
    // Time spent together slowly builds bond
    const timeBonus = Math.floor(timeElapsed / 60000); // 1 point per minute
    if (timeBonus > 0) {
      this.addBondPoints(animalId, timeBonus, 'Quality time together');
    }
  }

  /**
   * Get bonding progress for an animal
   */
  getBondingProgress(animalId: string): BondingProgress | null {
    return this.bondingProgress.get(animalId) || null;
  }

  /**
   * Get available abilities for a bond level
   */
  getAvailableAbilities(bondLevel: BondLevel): string[] {
    return Object.values(COMPANION_ABILITIES)
      .filter(ability => {
        const requiredLevel = BOND_LEVELS[ability.bondLevelRequired].level;
        const currentLevel = BOND_LEVELS[bondLevel].level;
        return currentLevel >= requiredLevel;
      })
      .map(ability => ability.id);
  }

  /**
   * Check if an ability is available for an animal
   */
  canUseAbility(animalId: string, abilityId: string): boolean {
    const progress = this.bondingProgress.get(animalId);
    if (!progress) return false;

    const ability = COMPANION_ABILITIES[abilityId];
    if (!ability) return false;

    const requiredLevel = BOND_LEVELS[ability.bondLevelRequired].level;
    return progress.bondLevelNumber >= requiredLevel;
  }

  /**
   * Use a companion ability
   */
  useAbility(animalId: string, abilityId: string): {
    success: boolean;
    effects: AbilityEffect[];
    cooldownUntil?: number;
    energyCost?: number;
    message: string;
  } {
    const progress = this.bondingProgress.get(animalId);
    const ability = COMPANION_ABILITIES[abilityId];
    
    if (!progress || !ability) {
      return {
        success: false,
        effects: [],
        message: 'Ability not available'
      };
    }

    if (!this.canUseAbility(animalId, abilityId)) {
      return {
        success: false,
        effects: [],
        message: 'Bond level too low for this ability'
      };
    }

    // Apply ability effects
    const effects = ability.effects;
    let message = `${ability.name} activated: ${ability.description}`;

    // Add to relationship history
    progress.relationshipHistory.push({
      timestamp: Date.now(),
      type: 'ability_unlocked',
      description: `Used ability: ${ability.name}`,
      bondImpact: 1,
      significance: 'minor'
    });

    return {
      success: true,
      effects,
      cooldownUntil: ability.cooldown ? Date.now() + ability.cooldown : undefined,
      energyCost: ability.energyCost,
      message
    };
  }

  /**
   * Set bonding callbacks
   */
  setBondingCallbacks(callbacks: {
    onBondLevelUp?: (animalId: string, newLevel: BondLevel) => void;
    onMilestoneAchieved?: (animalId: string, milestone: BondingMilestone) => void;
    onAbilityUnlocked?: (animalId: string, ability: CompanionAbility) => void;
    onBondDecay?: (animalId: string, decayAmount: number) => void;
  }): void {
    this.bondingCallbacks = callbacks;
  }

  private calculateBondLevel(points: number, timeSpent: number): BondLevel {
    // Check each level in order
    const levels: BondLevel[] = ['soul_mate', 'companion', 'close_friend', 'friend', 'acquaintance', 'stranger'];
    
    for (const level of levels) {
      const requirements = BOND_LEVELS[level];
      if (points >= requirements.pointsRequired && timeSpent >= requirements.timeRequired) {
        return level;
      }
    }
    
    return 'stranger';
  }

  private applyBondingPreferences(
    progress: BondingProgress,
    points: number,
    experienceType?: string
  ): number {
    let modifiedPoints = points;

    // Apply bonding style modifiers
    switch (progress.bondingPreferences.bondingStyle) {
      case 'slow_steady':
        modifiedPoints = Math.floor(points * 0.8); // Slower but more stable
        break;
      case 'activity_based':
        if (experienceType === 'play' || experienceType === 'adventure') {
          modifiedPoints = Math.floor(points * 1.3);
        }
        break;
      case 'emotional':
        if (experienceType === 'comfort' || experienceType === 'learning') {
          modifiedPoints = Math.floor(points * 1.2);
        }
        break;
      case 'trust_based':
        // Consistent small bonuses
        modifiedPoints = Math.floor(points * 1.1);
        break;
    }

    return modifiedPoints;
  }

  private createInitialMilestones(animalId: string): BondingMilestone[] {
    return [
      {
        id: 'first_interaction',
        name: 'First Contact',
        description: 'Successfully interact with the animal for the first time',
        bondLevelRequired: 'stranger',
        achieved: false,
        requirements: [
          {
            type: 'activities_completed',
            value: 1,
            description: 'Complete first interaction',
            currentProgress: 0,
            completed: false
          }
        ],
        rewards: [
          {
            type: 'knowledge',
            id: 'animal_info',
            name: 'Animal Information',
            description: 'Learn basic information about this animal',
            permanent: true
          }
        ],
        isSpecial: false
      },
      {
        id: 'trusted_friend',
        name: 'Trusted Friend',
        description: 'Gain the animal\'s complete trust',
        bondLevelRequired: 'friend',
        achieved: false,
        requirements: [
          {
            type: 'trust_level',
            value: 75,
            description: 'Reach 75% trust level',
            currentProgress: 0,
            completed: false
          }
        ],
        rewards: [
          {
            type: 'ability',
            id: 'follow_player',
            name: 'Following',
            description: 'Animal will follow you around',
            permanent: true
          }
        ],
        isSpecial: false
      },
      {
        id: 'lifelong_companion',
        name: 'Lifelong Companion',
        description: 'Form an unbreakable bond',
        bondLevelRequired: 'companion',
        achieved: false,
        requirements: [
          {
            type: 'shared_experiences',
            value: 10,
            description: 'Share 10 meaningful experiences',
            currentProgress: 0,
            completed: false
          },
          {
            type: 'time_spent',
            value: 3600000, // 1 hour
            description: 'Spend 1 hour together',
            currentProgress: 0,
            completed: false
          }
        ],
        rewards: [
          {
            type: 'privilege',
            id: 'permanent_companionship',
            name: 'Permanent Companionship',
            description: 'This animal will never leave your side',
            permanent: true
          }
        ],
        isSpecial: true
      }
    ];
  }

  private checkMilestoneAchievements(progress: BondingProgress): BondingMilestone[] {
    const achieved: BondingMilestone[] = [];
    
    progress.bondingMilestones.forEach(milestone => {
      if (milestone.achieved) return;
      
      // Check if bond level requirement is met
      const currentLevelNumber = BOND_LEVELS[progress.currentBondLevel].level;
      const requiredLevelNumber = BOND_LEVELS[milestone.bondLevelRequired].level;
      
      if (currentLevelNumber < requiredLevelNumber) return;
      
      // Check all requirements
      let allRequirementsMet = true;
      milestone.requirements.forEach(req => {
        switch (req.type) {
          case 'trust_level':
            // This would need to be passed from the taming system
            break;
          case 'shared_experiences':
            req.currentProgress = progress.sharedExperiences.length;
            req.completed = req.currentProgress >= req.value;
            break;
          case 'time_spent':
            req.currentProgress = progress.timeSpentTogether;
            req.completed = req.currentProgress >= req.value;
            break;
          case 'activities_completed':
            req.currentProgress = progress.relationshipHistory.filter(e => e.type === 'bond_increase').length;
            req.completed = req.currentProgress >= req.value;
            break;
        }
        
        if (!req.completed) {
          allRequirementsMet = false;
        }
      });
      
      if (allRequirementsMet) {
        milestone.achieved = true;
        milestone.achievedDate = Date.now();
        achieved.push(milestone);
      }
    });
    
    return achieved;
  }

  private checkAbilityUnlocks(progress: BondingProgress): CompanionAbility[] {
    const unlocked: CompanionAbility[] = [];
    const currentLevelNumber = BOND_LEVELS[progress.currentBondLevel].level;
    
    Object.values(COMPANION_ABILITIES).forEach(ability => {
      const requiredLevelNumber = BOND_LEVELS[ability.bondLevelRequired].level;
      
      if (currentLevelNumber >= requiredLevelNumber && 
          !progress.specialAbilities.includes(ability.id)) {
        unlocked.push(ability);
      }
    });
    
    return unlocked;
  }

  private calculateBondDecayRate(personality: PersonalityProfile): number {
    // Animals with different personalities have different bond decay rates
    switch (personality.primary) {
      case 'friendly':
        return 0.1; // Very slow decay
      case 'shy':
        return 0.5; // Faster decay, needs consistent interaction
      case 'aggressive':
        return 0.7; // Fast decay without respect
      case 'playful':
        return 0.3; // Moderate decay
      case 'lazy':
        return 0.2; // Slow decay
      default:
        return 0.3;
    }
  }

  private determineBondingPreferences(personality: PersonalityProfile): BondingProgress['bondingPreferences'] {
    const preferences: BondingProgress['bondingPreferences'] = {
      preferredActivities: [],
      favoriteInteractions: personality.preferredInteractions || [],
      bondingStyle: 'trust_based'
    };

    // Determine bonding style based on personality
    switch (personality.primary) {
      case 'playful':
        preferences.bondingStyle = 'activity_based';
        preferences.preferredActivities = ['play', 'games', 'adventures'];
        break;
      case 'shy':
        preferences.bondingStyle = 'slow_steady';
        preferences.preferredActivities = ['quiet_time', 'gentle_interaction'];
        break;
      case 'friendly':
        preferences.bondingStyle = 'emotional';
        preferences.preferredActivities = ['social_time', 'affection', 'communication'];
        break;
      case 'curious':
        preferences.bondingStyle = 'activity_based';
        preferences.preferredActivities = ['exploration', 'learning', 'discovery'];
        break;
      default:
        preferences.bondingStyle = 'trust_based';
        preferences.preferredActivities = ['consistent_interaction', 'routine'];
    }

    return preferences;
  }

  private startBondMaintenanceLoop(): void {
    setInterval(() => {
      this.processBondDecay();
    }, 60000); // Check every minute
  }

  private processBondDecay(): void {
    const now = Date.now();
    const decayThreshold = 300000; // 5 minutes without interaction
    
    this.bondingProgress.forEach((progress, animalId) => {
      const timeSinceLastActivity = now - progress.lastBondingActivity;
      
      if (timeSinceLastActivity > decayThreshold) {
        const decayAmount = Math.floor(progress.bondDecayRate * (timeSinceLastActivity / 60000));
        
        if (decayAmount > 0) {
          progress.bondPoints = Math.max(0, progress.bondPoints - decayAmount);
          progress.lastBondingActivity = now;
          
          // Check for level down
          const newLevel = this.calculateBondLevel(progress.bondPoints, progress.timeSpentTogether);
          if (newLevel !== progress.currentBondLevel) {
            progress.currentBondLevel = newLevel;
            progress.bondLevelNumber = BOND_LEVELS[newLevel].level;
            
            // Add to relationship history
            progress.relationshipHistory.push({
              timestamp: now,
              type: 'bond_decrease',
              description: `Bond level decreased to ${newLevel} due to lack of interaction`,
              bondImpact: -decayAmount,
              significance: 'moderate'
            });
          }
          
          this.bondingCallbacks.onBondDecay?.(animalId, decayAmount);
        }
      }
    });
  }

  private loadBondingData(): void {
    try {
      const saved = localStorage.getItem('feralFriends_bondingData');
      if (saved) {
        const data = JSON.parse(saved);
        this.bondingProgress = new Map(data.bondingProgress || []);
        this.activeBonds = new Set(data.activeBonds || []);
      }
    } catch (error) {
      console.warn('Failed to load bonding data:', error);
    }
  }

  private saveBondingData(): void {
    try {
      const data = {
        bondingProgress: Array.from(this.bondingProgress.entries()),
        activeBonds: Array.from(this.activeBonds)
      };
      localStorage.setItem('feralFriends_bondingData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save bonding data:', error);
    }
  }
}

// Export singleton instance
export const bondingSystem = new BondingSystem(); 