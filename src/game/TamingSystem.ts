import { Animal } from './Animal';
import { Position } from '../types/game';

export interface TrustLevel {
  level: number; // 0-100
  name: string;
  description: string;
  requirements: number; // Minimum interactions needed
  unlocks: string[]; // What becomes available at this level
  color: string; // For UI display
}

export interface TamingInteraction {
  id: string;
  type: 'approach' | 'observe' | 'offer_food' | 'gentle_touch' | 'play' | 'speak_softly' | 'give_space';
  name: string;
  description: string;
  trustModifier: number; // Base trust change
  energyCost: number; // Player energy cost
  duration: number; // Time in milliseconds
  requirements?: {
    minTrustLevel?: number;
    maxTrustLevel?: number;
    requiredItems?: string[];
    personalityBonus?: Record<string, number>; // personality -> bonus modifier
    personalityPenalty?: Record<string, number>; // personality -> penalty modifier
  };
  cooldown?: number; // Milliseconds before can use again
  stressEffect?: number; // How much this stresses the animal (-10 to +10)
  icon: string;
}

export interface TamingSession {
  animalId: string;
  startTime: number;
  endTime?: number;
  interactions: TamingInteractionResult[];
  initialTrust: number;
  finalTrust?: number;
  successful: boolean;
  notes: string[];
}

export interface TamingInteractionResult {
  interactionId: string;
  timestamp: number;
  trustBefore: number;
  trustAfter: number;
  modifier: number;
  success: boolean;
  animalReaction: string;
  playerFeedback: string;
}

export interface TamingProgress {
  animalId: string;
  currentTrust: number;
  totalInteractions: number;
  successfulInteractions: number;
  lastInteraction: number;
  interactionHistory: TamingInteractionResult[];
  personalityLearned: boolean;
  bondLevel: number; // 0-5 (stranger to best friend)
  tamingStarted: number;
  tamingCompleted?: number;
  sessions: TamingSession[];
  preferences: {
    favoriteInteractions: string[];
    dislikedInteractions: string[];
    optimalApproachDistance: number;
    bestTimesOfDay: string[];
  };
}

// Trust level definitions
export const TRUST_LEVELS: TrustLevel[] = [
  {
    level: 0,
    name: 'Fearful',
    description: 'The animal is afraid and will flee from you',
    requirements: 0,
    unlocks: ['observe', 'give_space'],
    color: 'red'
  },
  {
    level: 15,
    name: 'Wary',
    description: 'The animal is cautious but aware of your presence',
    requirements: 3,
    unlocks: ['approach', 'speak_softly'],
    color: 'orange'
  },
  {
    level: 30,
    name: 'Curious',
    description: 'The animal shows interest in you',
    requirements: 8,
    unlocks: ['offer_food', 'gentle_touch'],
    color: 'yellow'
  },
  {
    level: 50,
    name: 'Accepting',
    description: 'The animal tolerates your presence',
    requirements: 15,
    unlocks: ['play'],
    color: 'blue'
  },
  {
    level: 75,
    name: 'Friendly',
    description: 'The animal enjoys your company',
    requirements: 25,
    unlocks: ['pet', 'teach_tricks'],
    color: 'green'
  },
  {
    level: 90,
    name: 'Bonded',
    description: 'You have formed a deep bond with this animal',
    requirements: 40,
    unlocks: ['companion_request', 'advanced_tricks'],
    color: 'purple'
  }
];

// Taming interaction definitions
export const TAMING_INTERACTIONS: TamingInteraction[] = [
  {
    id: 'observe',
    type: 'observe',
    name: 'Observe Quietly',
    description: 'Watch the animal from a safe distance to learn its behavior',
    trustModifier: 2,
    energyCost: 1,
    duration: 3000,
    requirements: {
      personalityBonus: { shy: 3, curious: 1 },
      personalityPenalty: { aggressive: -1 }
    },
    stressEffect: -2,
    icon: '👁️'
  },
  {
    id: 'approach_slow',
    type: 'approach',
    name: 'Approach Slowly',
    description: 'Move closer to the animal with careful, non-threatening movements',
    trustModifier: 3,
    energyCost: 2,
    duration: 4000,
    requirements: {
      minTrustLevel: 10,
      personalityBonus: { friendly: 2, curious: 2 },
      personalityPenalty: { shy: -2, aggressive: -1 }
    },
    cooldown: 10000,
    stressEffect: 1,
    icon: '🚶‍♂️'
  },
  {
    id: 'offer_food',
    type: 'offer_food',
    name: 'Offer Food',
    description: 'Present food to the animal to build trust',
    trustModifier: 8,
    energyCost: 3,
    duration: 5000,
    requirements: {
      minTrustLevel: 20,
      requiredItems: ['food'],
      personalityBonus: { friendly: 3, playful: 2 },
      personalityPenalty: { aggressive: -2 }
    },
    cooldown: 15000,
    stressEffect: -3,
    icon: '🍎'
  },
  {
    id: 'gentle_touch',
    type: 'gentle_touch',
    name: 'Gentle Touch',
    description: 'Slowly extend your hand for the animal to sniff or touch',
    trustModifier: 5,
    energyCost: 2,
    duration: 3500,
    requirements: {
      minTrustLevel: 25,
      personalityBonus: { friendly: 4, curious: 2 },
      personalityPenalty: { shy: -3, aggressive: -4 }
    },
    cooldown: 12000,
    stressEffect: 2,
    icon: '✋'
  },
  {
    id: 'play_gesture',
    type: 'play',
    name: 'Play Gesture',
    description: 'Make playful movements to engage the animal',
    trustModifier: 6,
    energyCost: 4,
    duration: 6000,
    requirements: {
      minTrustLevel: 40,
      personalityBonus: { playful: 5, curious: 3 },
      personalityPenalty: { shy: -2, aggressive: -1 }
    },
    cooldown: 20000,
    stressEffect: -1,
    icon: '🎾'
  },
  {
    id: 'speak_softly',
    type: 'speak_softly',
    name: 'Speak Softly',
    description: 'Use a calm, gentle voice to soothe the animal',
    trustModifier: 4,
    energyCost: 1,
    duration: 4000,
    requirements: {
      minTrustLevel: 10,
      personalityBonus: { shy: 3, friendly: 2 },
      personalityPenalty: { aggressive: -1 }
    },
    cooldown: 8000,
    stressEffect: -2,
    icon: '💬'
  },
  {
    id: 'give_space',
    type: 'give_space',
    name: 'Give Space',
    description: 'Step back to show you respect the animal\'s boundaries',
    trustModifier: 3,
    energyCost: 0,
    duration: 2000,
    requirements: {
      personalityBonus: { shy: 4, aggressive: 2 },
      personalityPenalty: { friendly: -1 }
    },
    stressEffect: -4,
    icon: '↩️'
  }
];

export class TamingSystem {
  private tamingProgress: Map<string, TamingProgress> = new Map();
  private activeSessions: Map<string, TamingSession> = new Map();
  private interactionCooldowns: Map<string, Map<string, number>> = new Map(); // animalId -> interactionId -> timestamp

  constructor() {
    this.loadTamingData();
  }

  // Start a taming session with an animal
  startTamingSession(animal: Animal, playerPosition: Position): TamingSession {
    const sessionId = `${animal.id}_${Date.now()}`;
    const currentTrust = this.getCurrentTrust(animal.id);
    
    const session: TamingSession = {
      animalId: animal.id,
      startTime: Date.now(),
      interactions: [],
      initialTrust: currentTrust,
      successful: false,
      notes: [`Started taming session with ${animal.species}`]
    };

    this.activeSessions.set(animal.id, session);
    
    // Initialize progress if this is the first time
    if (!this.tamingProgress.has(animal.id)) {
      this.initializeTamingProgress(animal);
    }

    return session;
  }

  // End a taming session
  endTamingSession(animalId: string): TamingSession | null {
    const session = this.activeSessions.get(animalId);
    if (!session) return null;

    session.endTime = Date.now();
    session.finalTrust = this.getCurrentTrust(animalId);
    session.successful = session.finalTrust! > session.initialTrust;

    // Update progress
    const progress = this.tamingProgress.get(animalId);
    if (progress) {
      progress.sessions.push(session);
      this.updateBondLevel(animalId);
    }

    this.activeSessions.delete(animalId);
    this.saveTamingData();

    return session;
  }

  // Attempt a taming interaction
  attemptInteraction(
    animalId: string, 
    interactionId: string, 
    playerItems: string[] = [],
    animalPersonality: string = 'neutral'
  ): TamingInteractionResult {
    const interaction = TAMING_INTERACTIONS.find(i => i.id === interactionId);
    if (!interaction) {
      throw new Error(`Unknown interaction: ${interactionId}`);
    }

    const progress = this.tamingProgress.get(animalId);
    if (!progress) {
      throw new Error(`No taming progress found for animal: ${animalId}`);
    }

    // Check cooldown
    if (this.isInteractionOnCooldown(animalId, interactionId)) {
      throw new Error(`Interaction ${interactionId} is on cooldown`);
    }

    // Check requirements
    const canPerform = this.canPerformInteraction(animalId, interaction, playerItems);
    if (!canPerform.allowed) {
      throw new Error(canPerform.reason);
    }

    // Calculate trust modifier based on personality and context
    let trustModifier = interaction.trustModifier;
    
    // Apply personality modifiers
    if (interaction.requirements?.personalityBonus?.[animalPersonality]) {
      trustModifier += interaction.requirements.personalityBonus[animalPersonality];
    }
    if (interaction.requirements?.personalityPenalty?.[animalPersonality]) {
      trustModifier += interaction.requirements.personalityPenalty[animalPersonality];
    }

    // Apply context modifiers
    trustModifier = this.applyContextModifiers(animalId, interaction, trustModifier);

    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(animalId, interaction, animalPersonality);
    const success = Math.random() < successProbability;

    // Apply success/failure modifier
    if (!success) {
      trustModifier = Math.floor(trustModifier * 0.3); // Reduced trust gain on failure
    }

    // Update trust
    const trustBefore = progress.currentTrust;
    const trustAfter = Math.max(0, Math.min(100, trustBefore + trustModifier));
    progress.currentTrust = trustAfter;
    progress.totalInteractions++;
    if (success) {
      progress.successfulInteractions++;
    }
    progress.lastInteraction = Date.now();

    // Generate reaction and feedback
    const animalReaction = this.generateAnimalReaction(interaction, success, animalPersonality, trustAfter);
    const playerFeedback = this.generatePlayerFeedback(interaction, success, trustModifier, trustAfter);

    // Create result
    const result: TamingInteractionResult = {
      interactionId,
      timestamp: Date.now(),
      trustBefore,
      trustAfter,
      modifier: trustModifier,
      success,
      animalReaction,
      playerFeedback
    };

    // Update progress and session
    progress.interactionHistory.push(result);
    
    const session = this.activeSessions.get(animalId);
    if (session) {
      session.interactions.push(result);
    }

    // Set cooldown
    if (interaction.cooldown) {
      this.setInteractionCooldown(animalId, interactionId, interaction.cooldown);
    }

    // Update preferences based on success
    this.updateAnimalPreferences(animalId, interaction, success);

    // Check for bond level updates
    this.updateBondLevel(animalId);

    this.saveTamingData();
    return result;
  }

  // Check if an interaction can be performed
  canPerformInteraction(
    animalId: string, 
    interaction: TamingInteraction, 
    playerItems: string[]
  ): { allowed: boolean; reason?: string } {
    const progress = this.tamingProgress.get(animalId);
    if (!progress) {
      return { allowed: false, reason: 'No taming progress found' };
    }

    // Check trust level requirements
    if (interaction.requirements?.minTrustLevel && 
        progress.currentTrust < interaction.requirements.minTrustLevel) {
      return { 
        allowed: false, 
        reason: `Requires trust level ${interaction.requirements.minTrustLevel}, current: ${progress.currentTrust}` 
      };
    }

    if (interaction.requirements?.maxTrustLevel && 
        progress.currentTrust > interaction.requirements.maxTrustLevel) {
      return { 
        allowed: false, 
        reason: `Trust level too high for this interaction` 
      };
    }

    // Check item requirements
    if (interaction.requirements?.requiredItems) {
      for (const requiredItem of interaction.requirements.requiredItems) {
        if (!playerItems.includes(requiredItem)) {
          return { 
            allowed: false, 
            reason: `Requires item: ${requiredItem}` 
          };
        }
      }
    }

    return { allowed: true };
  }

  // Get current trust level for an animal
  getCurrentTrust(animalId: string): number {
    const progress = this.tamingProgress.get(animalId);
    return progress?.currentTrust || 0;
  }

  // Get trust level information
  getTrustLevelInfo(trust: number): TrustLevel {
    for (let i = TRUST_LEVELS.length - 1; i >= 0; i--) {
      if (trust >= TRUST_LEVELS[i].level) {
        return TRUST_LEVELS[i];
      }
    }
    return TRUST_LEVELS[0];
  }

  // Get available interactions for current trust level
  getAvailableInteractions(animalId: string, playerItems: string[] = []): TamingInteraction[] {
    const trust = this.getCurrentTrust(animalId);
    return TAMING_INTERACTIONS.filter(interaction => {
      const canPerform = this.canPerformInteraction(animalId, interaction, playerItems);
      const notOnCooldown = !this.isInteractionOnCooldown(animalId, interaction.id);
      return canPerform.allowed && notOnCooldown;
    });
  }

  // Get taming progress for an animal
  getTamingProgress(animalId: string): TamingProgress | null {
    return this.tamingProgress.get(animalId) || null;
  }

  // Get all taming progress (for save/load)
  getAllTamingProgress(): Record<string, TamingProgress> {
    const result: Record<string, TamingProgress> = {};
    for (const [animalId, progress] of this.tamingProgress) {
      result[animalId] = progress;
    }
    return result;
  }

  // Load taming progress from saved data
  loadTamingProgress(data: Record<string, TamingProgress>): void {
    this.tamingProgress.clear();
    for (const [animalId, progress] of Object.entries(data)) {
      this.tamingProgress.set(animalId, progress);
    }
  }

  // Private helper methods

  private initializeTamingProgress(animal: Animal): void {
    const progress: TamingProgress = {
      animalId: animal.id,
      currentTrust: 0,
      totalInteractions: 0,
      successfulInteractions: 0,
      lastInteraction: 0,
      interactionHistory: [],
      personalityLearned: false,
      bondLevel: 0,
      tamingStarted: Date.now(),
      sessions: [],
      preferences: {
        favoriteInteractions: [],
        dislikedInteractions: [],
        optimalApproachDistance: 3,
        bestTimesOfDay: []
      }
    };

    this.tamingProgress.set(animal.id, progress);
  }

  private applyContextModifiers(animalId: string, interaction: TamingInteraction, baseModifier: number): number {
    const progress = this.tamingProgress.get(animalId);
    if (!progress) return baseModifier;

    let modifier = baseModifier;

    // Repeated interaction penalty
    const recentSameInteractions = progress.interactionHistory
      .filter(h => h.interactionId === interaction.id && Date.now() - h.timestamp < 60000)
      .length;
    
    if (recentSameInteractions > 2) {
      modifier = Math.floor(modifier * 0.7); // 30% penalty for repetition
    }

    // Successful interaction streak bonus
    const recentSuccesses = progress.interactionHistory
      .slice(-5)
      .filter(h => h.success)
      .length;
    
    if (recentSuccesses >= 3) {
      modifier = Math.floor(modifier * 1.2); // 20% bonus for success streak
    }

    return modifier;
  }

  private calculateSuccessProbability(animalId: string, interaction: TamingInteraction, personality: string): number {
    const progress = this.tamingProgress.get(animalId);
    if (!progress) return 0.5;

    let probability = 0.6; // Base success rate

    // Trust level affects success
    const trustLevel = this.getTrustLevelInfo(progress.currentTrust);
    probability += (trustLevel.level / 100) * 0.3; // Higher trust = higher success

    // Experience with this interaction type
    const experienceCount = progress.interactionHistory
      .filter(h => h.interactionId === interaction.id)
      .length;
    
    probability += Math.min(experienceCount * 0.05, 0.2); // Max 20% bonus from experience

    // Personality compatibility
    if (interaction.requirements?.personalityBonus?.[personality]) {
      probability += 0.1;
    }
    if (interaction.requirements?.personalityPenalty?.[personality]) {
      probability -= 0.15;
    }

    return Math.max(0.1, Math.min(0.95, probability));
  }

  private generateAnimalReaction(
    interaction: TamingInteraction, 
    success: boolean, 
    personality: string, 
    trustLevel: number
  ): string {
    const reactions = {
      success: {
        low: ['sniffs cautiously', 'takes a small step closer', 'tilts head curiously'],
        medium: ['wags tail slightly', 'makes eye contact', 'seems more relaxed'],
        high: ['approaches eagerly', 'shows clear happiness', 'nuzzles affectionately']
      },
      failure: {
        low: ['backs away nervously', 'shows signs of stress', 'becomes more alert'],
        medium: ['hesitates uncertainly', 'maintains distance', 'watches warily'],
        high: ['looks disappointed', 'seems confused', 'turns away briefly']
      }
    };

    const category = success ? 'success' : 'failure';
    const level = trustLevel < 30 ? 'low' : trustLevel < 70 ? 'medium' : 'high';
    const possibleReactions = reactions[category][level];
    
    return possibleReactions[Math.floor(Math.random() * possibleReactions.length)];
  }

  private generatePlayerFeedback(
    interaction: TamingInteraction, 
    success: boolean, 
    trustModifier: number, 
    newTrustLevel: number
  ): string {
    if (success && trustModifier > 5) {
      return `${interaction.name} was very effective! The animal seems much more trusting.`;
    } else if (success) {
      return `${interaction.name} worked well. You're making progress.`;
    } else if (trustModifier > 0) {
      return `${interaction.name} had some effect, but the animal is still cautious.`;
    } else {
      return `${interaction.name} didn't work as hoped. Try a different approach.`;
    }
  }

  private updateAnimalPreferences(animalId: string, interaction: TamingInteraction, success: boolean): void {
    const progress = this.tamingProgress.get(animalId);
    if (!progress) return;

    if (success && !progress.preferences.favoriteInteractions.includes(interaction.id)) {
      // Add to favorites if successful multiple times
      const successCount = progress.interactionHistory
        .filter(h => h.interactionId === interaction.id && h.success)
        .length;
      
      if (successCount >= 3) {
        progress.preferences.favoriteInteractions.push(interaction.id);
      }
    } else if (!success) {
      // Track consistently failed interactions
      const recentFailures = progress.interactionHistory
        .filter(h => h.interactionId === interaction.id && !h.success)
        .slice(-3);
      
      if (recentFailures.length >= 3 && !progress.preferences.dislikedInteractions.includes(interaction.id)) {
        progress.preferences.dislikedInteractions.push(interaction.id);
      }
    }
  }

  private updateBondLevel(animalId: string): void {
    const progress = this.tamingProgress.get(animalId);
    if (!progress) return;

    const trust = progress.currentTrust;
    const interactions = progress.totalInteractions;
    
    let newBondLevel = 0;
    
    if (trust >= 90 && interactions >= 40) newBondLevel = 5; // Best Friend
    else if (trust >= 75 && interactions >= 25) newBondLevel = 4; // Close Friend
    else if (trust >= 50 && interactions >= 15) newBondLevel = 3; // Friend
    else if (trust >= 30 && interactions >= 8) newBondLevel = 2; // Acquaintance
    else if (trust >= 15 && interactions >= 3) newBondLevel = 1; // Known
    
    if (newBondLevel > progress.bondLevel) {
      progress.bondLevel = newBondLevel;
      // Bond level up event could be triggered here
    }
  }

  private isInteractionOnCooldown(animalId: string, interactionId: string): boolean {
    const animalCooldowns = this.interactionCooldowns.get(animalId);
    if (!animalCooldowns) return false;
    
    const cooldownEnd = animalCooldowns.get(interactionId);
    if (!cooldownEnd) return false;
    
    return Date.now() < cooldownEnd;
  }

  private setInteractionCooldown(animalId: string, interactionId: string, duration: number): void {
    let animalCooldowns = this.interactionCooldowns.get(animalId);
    if (!animalCooldowns) {
      animalCooldowns = new Map();
      this.interactionCooldowns.set(animalId, animalCooldowns);
    }
    
    animalCooldowns.set(interactionId, Date.now() + duration);
  }

  private saveTamingData(): void {
    try {
      const data = this.getAllTamingProgress();
      localStorage.setItem('feral-friends-taming-progress', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save taming data:', error);
    }
  }

  private loadTamingData(): void {
    try {
      const saved = localStorage.getItem('feral-friends-taming-progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.loadTamingProgress(data);
      }
    } catch (error) {
      console.warn('Failed to load taming data:', error);
    }
  }
}

export default TamingSystem;