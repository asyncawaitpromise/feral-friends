// Player-Animal Interaction System
// Handles basic player-animal interactions with approach detection and touch-based interactions

import { Position } from '../types/game';
import { Animal, canInteractWithPlayer, getDistanceToPlayer } from './Animal';
import { AnimalAI } from './AnimalAI';
import { dialogueSystem } from './DialogueSystem';

export type InteractionType = 'observe' | 'approach' | 'interact' | 'feed' | 'pet' | 'play' | 'talk';

export interface InteractionAttempt {
  type: InteractionType;
  animal: Animal;
  playerPosition: Position;
  timestamp: number;
  success: boolean;
  reason?: string;
}

export interface InteractionResult {
  success: boolean;
  type: InteractionType;
  animal: Animal;
  message: string;
  effects?: {
    trustChange?: number;
    fearChange?: number;
    happinessChange?: number;
    energyChange?: number;
  };
  unlocks?: string[];
  cooldownTime?: number;
}

export interface InteractionZone {
  animal: Animal;
  distance: number;
  availableInteractions: InteractionType[];
  recommendedAction: string;
  confidence: number; // 0-1 chance of success
  requirements?: string[];
  warnings?: string[];
}

export class InteractionSystem {
  private interactionHistory: Map<string, InteractionAttempt[]> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private callbacks: {
    onInteractionAttempt?: (attempt: InteractionAttempt) => void;
    onInteractionSuccess?: (result: InteractionResult) => void;
    onInteractionFailed?: (result: InteractionResult) => void;
    onZoneEntered?: (zone: InteractionZone) => void;
    onZoneExited?: (animalId: string) => void;
  } = {};

  constructor() {
    this.interactionHistory = new Map();
    this.cooldowns = new Map();
  }

  /**
   * Set callback functions for interaction events
   */
  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get all available interaction zones for the player
   */
  getInteractionZones(animals: Animal[], playerPosition: Position): InteractionZone[] {
    const zones: InteractionZone[] = [];
    const currentTime = Date.now();

    for (const animal of animals) {
      if (!animal.isActive) continue;

      const distance = getDistanceToPlayer(animal, playerPosition);
      const maxInteractionDistance = 8; // Maximum range for any interaction

      if (distance <= maxInteractionDistance) {
        const zone = this.evaluateInteractionZone(animal, distance, currentTime);
        if (zone.availableInteractions.length > 0) {
          zones.push(zone);
        }
      }
    }

    // Sort by distance (closest first)
    return zones.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Attempt an interaction with an animal
   */
  async attemptInteraction(
    type: InteractionType,
    animal: Animal,
    playerPosition: Position
  ): Promise<InteractionResult> {
    const currentTime = Date.now();
    const distance = getDistanceToPlayer(animal, playerPosition);

    // Check cooldown
    const cooldownKey = `${animal.id}_${type}`;
    const lastInteraction = this.cooldowns.get(cooldownKey) || 0;
    const cooldownDuration = this.getInteractionCooldown(type);

    if (currentTime - lastInteraction < cooldownDuration) {
      const remainingCooldown = Math.ceil((cooldownDuration - (currentTime - lastInteraction)) / 1000);
      return this.createFailureResult(type, animal, `Wait ${remainingCooldown}s before trying again`);
    }

    // Validate interaction requirements
    const validation = this.validateInteraction(type, animal, distance);
    if (!validation.valid) {
      return this.createFailureResult(type, animal, validation.reason!);
    }

    // Calculate success chance
    const successChance = this.calculateSuccessChance(type, animal, distance);
    const success = Math.random() < successChance;

    // Create interaction attempt record
    const attempt: InteractionAttempt = {
      type,
      animal,
      playerPosition,
      timestamp: currentTime,
      success
    };

    // Record attempt
    this.recordInteractionAttempt(attempt);

    // Set cooldown
    this.cooldowns.set(cooldownKey, currentTime);

    // Execute interaction
    if (success) {
      return this.executeSuccessfulInteraction(type, animal, distance);
    } else {
      return this.executeFailedInteraction(type, animal, distance);
    }
  }

  /**
   * Get the closest animal that can be interacted with
   */
  getClosestInteractableAnimal(animals: Animal[], playerPosition: Position): Animal | null {
    let closest: { animal: Animal; distance: number } | null = null;

    for (const animal of animals) {
      if (!animal.isActive) continue;

      const distance = getDistanceToPlayer(animal, playerPosition);
      if (distance <= 8 && canInteractWithPlayer(animal, playerPosition)) {
        if (!closest || distance < closest.distance) {
          closest = { animal, distance };
        }
      }
    }

    return closest?.animal || null;
  }

  /**
   * Check if an animal is currently interactable
   */
  canInteractWithAnimal(animal: Animal, playerPosition: Position): {
    canInteract: boolean;
    reason?: string;
    distance: number;
  } {
    const distance = getDistanceToPlayer(animal, playerPosition);

    if (!animal.isActive) {
      return { canInteract: false, reason: 'Animal is not active', distance };
    }

    if (distance > 3) {
      return { canInteract: false, reason: 'Too far away - get closer', distance };
    }

    if (!AnimalAI.canBeInteracted(animal)) {
      return { 
        canInteract: false, 
        reason: `Animal is ${animal.ai.currentState} and cannot be interacted with`, 
        distance 
      };
    }

    if (animal.stats.fear > 80) {
      return { canInteract: false, reason: 'Animal is too scared', distance };
    }

    return { canInteract: true, distance };
  }

  // Private methods

  private evaluateInteractionZone(animal: Animal, distance: number, currentTime: number): InteractionZone {
    const availableInteractions: InteractionType[] = [];
    const requirements: string[] = [];
    const warnings: string[] = [];

    // Determine available interactions based on distance and animal state
    if (distance <= 8) {
      availableInteractions.push('observe');
    }

    if (distance <= 5) {
      availableInteractions.push('approach');
    }

    if (distance <= 3 && AnimalAI.canBeInteracted(animal)) {
      availableInteractions.push('interact');
      
      if (animal.stats.trust > 20) {
        availableInteractions.push('talk');
      }
      
      if (animal.stats.trust > 30) {
        availableInteractions.push('pet');
      }

      if (animal.stats.energy < 50) {
        availableInteractions.push('feed');
      }

      if (animal.stats.happiness > 60 && animal.stats.trust > 50) {
        availableInteractions.push('play');
      }
    }

    // Add requirements
    if (animal.stats.fear > 70) {
      requirements.push('Animal needs to be less scared');
      warnings.push('Approach slowly to avoid startling');
    }

    if (animal.ai.currentState === 'feeding') {
      warnings.push('Don\'t disturb while feeding');
    }

    if (animal.ai.currentState === 'sleeping') {
      warnings.push('Animal is sleeping');
    }

    // Calculate confidence and recommendation
    const confidence = this.calculateZoneConfidence(animal, distance, availableInteractions);
    const recommendedAction = this.getRecommendedAction(animal, distance, availableInteractions);

    return {
      animal,
      distance,
      availableInteractions,
      recommendedAction,
      confidence,
      requirements: requirements.length > 0 ? requirements : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private validateInteraction(
    type: InteractionType,
    animal: Animal,
    distance: number
  ): { valid: boolean; reason?: string } {
    const maxDistances: Record<InteractionType, number> = {
      observe: 8,
      approach: 5,
      interact: 3,
      feed: 2,
      pet: 2,
      play: 3,
      talk: 3
    };

    if (distance > maxDistances[type]) {
      return { valid: false, reason: `Too far away for ${type}` };
    }

    switch (type) {
      case 'observe':
        return { valid: true };

      case 'approach':
        if (animal.stats.fear > 90) {
          return { valid: false, reason: 'Animal is too scared to approach' };
        }
        return { valid: true };

      case 'interact':
        if (!AnimalAI.canBeInteracted(animal)) {
          return { valid: false, reason: `Animal is ${animal.ai.currentState}` };
        }
        return { valid: true };

      case 'feed':
        if (animal.stats.energy > 80) {
          return { valid: false, reason: 'Animal is not hungry' };
        }
        return { valid: true };

      case 'pet':
        if (animal.stats.trust < 30) {
          return { valid: false, reason: 'Animal doesn\'t trust you enough' };
        }
        if (animal.stats.fear > 60) {
          return { valid: false, reason: 'Animal is too scared to be petted' };
        }
        return { valid: true };

      case 'play':
        if (animal.stats.energy < 40) {
          return { valid: false, reason: 'Animal is too tired to play' };
        }
        if (animal.stats.trust < 50) {
          return { valid: false, reason: 'Animal doesn\'t trust you enough to play' };
        }
        return { valid: true };

      case 'talk':
        if (animal.stats.trust < 20) {
          return { valid: false, reason: 'Animal doesn\'t trust you enough to talk' };
        }
        if (animal.stats.fear > 70) {
          return { valid: false, reason: 'Animal is too scared to talk' };
        }
        return { valid: true };

      default:
        return { valid: false, reason: 'Unknown interaction type' };
    }
  }

  private calculateSuccessChance(type: InteractionType, animal: Animal, distance: number): number {
    let baseChance = 0.5;

    // Base success rates by interaction type
    const baseRates: Record<InteractionType, number> = {
      observe: 0.95,
      approach: 0.8,
      interact: 0.6,
      feed: 0.7,
      pet: 0.5,
      play: 0.4,
      talk: 0.8
    };

    baseChance = baseRates[type];

    // Adjust based on animal stats
    baseChance += (animal.stats.trust / 100) * 0.3;
    baseChance -= (animal.stats.fear / 100) * 0.4;
    baseChance += (animal.stats.happiness / 100) * 0.2;

    // Adjust based on distance (closer is usually better for most interactions)
    if (type !== 'observe') {
      const optimalDistance = type === 'approach' ? 3 : 1.5;
      const distanceFactor = Math.max(0, 1 - Math.abs(distance - optimalDistance) * 0.2);
      baseChance *= distanceFactor;
    }

    // Adjust based on animal state
    switch (animal.ai.currentState) {
      case 'curious':
        baseChance += 0.2;
        break;
      case 'idle':
        baseChance += 0.1;
        break;
      case 'feeding':
        baseChance -= 0.3;
        break;
      case 'fleeing':
      case 'hiding':
        baseChance -= 0.5;
        break;
    }

    // Consider interaction history
    const history = this.interactionHistory.get(animal.id) || [];
    const recentSuccesses = history.filter(h => 
      h.timestamp > Date.now() - 300000 && h.success // Last 5 minutes
    ).length;
    baseChance += recentSuccesses * 0.1;

    return Math.max(0.05, Math.min(0.95, baseChance));
  }

  private executeSuccessfulInteraction(
    type: InteractionType,
    animal: Animal,
    distance: number
  ): InteractionResult {
    const effects: InteractionResult['effects'] = {};
    let message = '';
    const unlocks: string[] = [];

    switch (type) {
      case 'observe':
        message = `You quietly observe the ${animal.species}. It seems ${animal.ai.currentState}.`;
        effects.trustChange = 1;
        break;

      case 'approach':
        message = `You carefully approach the ${animal.species}. It watches you curiously.`;
        effects.trustChange = 2;
        effects.fearChange = -1;
        break;

      case 'interact':
        message = `You have a gentle interaction with the ${animal.species}. It seems to like you!`;
        effects.trustChange = 5;
        effects.happinessChange = 3;
        effects.fearChange = -2;
        if (animal.stats.trust + 5 >= 50 && animal.stats.trust < 50) {
          unlocks.push('petting');
        }
        break;

      case 'feed':
        message = `You offer food to the ${animal.species}. It eagerly accepts your gift!`;
        effects.trustChange = 8;
        effects.happinessChange = 5;
        effects.energyChange = 20;
        effects.fearChange = -3;
        break;

      case 'pet':
        message = `You gently pet the ${animal.species}. It enjoys your touch and relaxes.`;
        effects.trustChange = 10;
        effects.happinessChange = 8;
        effects.fearChange = -5;
        if (animal.stats.trust + 10 >= 70 && animal.stats.trust < 70) {
          unlocks.push('playing');
        }
        break;

      case 'play':
        message = `You play with the ${animal.species}! It's having so much fun with you.`;
        effects.trustChange = 15;
        effects.happinessChange = 15;
        effects.energyChange = -10;
        effects.fearChange = -8;
        if (animal.stats.trust + 15 >= 90 && animal.stats.trust < 90) {
          unlocks.push('companionship');
        }
        break;

      case 'talk':
        const dialogueStarted = dialogueSystem.startDialogue(animal);
        if (dialogueStarted) {
          message = `You start a conversation with the ${animal.species}.`;
          effects.trustChange = 3;
          effects.fearChange = -1;
        } else {
          message = `The ${animal.species} doesn't seem interested in talking right now.`;
        }
        break;
    }

    // Apply effects to animal
    this.applyEffectsToAnimal(animal, effects);

    const result: InteractionResult = {
      success: true,
      type,
      animal,
      message,
      effects,
      unlocks: unlocks.length > 0 ? unlocks : undefined,
      cooldownTime: this.getInteractionCooldown(type)
    };

    this.callbacks.onInteractionSuccess?.(result);
    return result;
  }

  private executeFailedInteraction(
    type: InteractionType,
    animal: Animal,
    distance: number
  ): InteractionResult {
    const effects: InteractionResult['effects'] = {};
    let message = '';

    switch (type) {
      case 'observe':
        message = `The ${animal.species} notices you watching and becomes wary.`;
        effects.fearChange = 1;
        break;

      case 'approach':
        message = `The ${animal.species} backs away as you approach too quickly.`;
        effects.fearChange = 3;
        effects.trustChange = -1;
        break;

      case 'interact':
        message = `The ${animal.species} is not ready for interaction yet.`;
        effects.fearChange = 2;
        break;

      case 'feed':
        message = `The ${animal.species} is suspicious of your food offering.`;
        effects.fearChange = 1;
        break;

      case 'pet':
        message = `The ${animal.species} pulls away from your touch.`;
        effects.fearChange = 4;
        effects.trustChange = -2;
        break;

      case 'play':
        message = `The ${animal.species} is not in the mood to play right now.`;
        effects.fearChange = 2;
        break;

      case 'talk':
        message = `The ${animal.species} doesn't want to talk right now.`;
        effects.fearChange = 1;
        break;
    }

    // Apply negative effects
    this.applyEffectsToAnimal(animal, effects);

    const result: InteractionResult = {
      success: false,
      type,
      animal,
      message,
      effects,
      cooldownTime: this.getInteractionCooldown(type)
    };

    this.callbacks.onInteractionFailed?.(result);
    return result;
  }

  private applyEffectsToAnimal(animal: Animal, effects: InteractionResult['effects']): void {
    if (!effects) return;

    if (effects.trustChange) {
      animal.stats.trust = Math.max(0, Math.min(100, animal.stats.trust + effects.trustChange));
    }
    if (effects.fearChange) {
      animal.stats.fear = Math.max(0, Math.min(100, animal.stats.fear + effects.fearChange));
    }
    if (effects.happinessChange) {
      animal.stats.happiness = Math.max(0, Math.min(100, animal.stats.happiness + effects.happinessChange));
    }
    if (effects.energyChange) {
      animal.stats.energy = Math.max(0, Math.min(animal.stats.maxEnergy, animal.stats.energy + effects.energyChange));
    }

    // Update interaction count
    animal.interactionCount++;
    animal.lastInteraction = Date.now();
  }

  private getInteractionCooldown(type: InteractionType): number {
    const cooldowns: Record<InteractionType, number> = {
      observe: 2000,    // 2 seconds
      approach: 3000,   // 3 seconds
      interact: 5000,   // 5 seconds
      feed: 10000,      // 10 seconds
      pet: 8000,        // 8 seconds
      play: 15000,      // 15 seconds
      talk: 1000        // 1 second
    };
    return cooldowns[type];
  }

  private calculateZoneConfidence(
    animal: Animal,
    distance: number,
    availableInteractions: InteractionType[]
  ): number {
    if (availableInteractions.length === 0) return 0;

    let confidence = 0.5;
    confidence += (animal.stats.trust / 100) * 0.3;
    confidence -= (animal.stats.fear / 100) * 0.4;
    confidence += (animal.stats.happiness / 100) * 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  private getRecommendedAction(
    animal: Animal,
    distance: number,
    availableInteractions: InteractionType[]
  ): string {
    if (availableInteractions.length === 0) {
      return 'Get closer to interact';
    }

    if (distance > 3) {
      return 'Move closer to interact';
    }

    if (animal.stats.fear > 70) {
      return 'Move slowly to avoid scaring';
    }

    if (animal.stats.trust < 30) {
      return 'Try gentle interactions to build trust';
    }

    if (animal.stats.energy < 50) {
      return 'Offer food to help the animal';
    }

    if (animal.stats.trust > 50) {
      return 'Try petting or playing';
    }

    return 'Interact gently with the animal';
  }

  private createFailureResult(type: InteractionType, animal: Animal, reason: string): InteractionResult {
    return {
      success: false,
      type,
      animal,
      message: reason
    };
  }

  private recordInteractionAttempt(attempt: InteractionAttempt): void {
    const history = this.interactionHistory.get(attempt.animal.id) || [];
    history.push(attempt);

    // Keep only last 20 attempts per animal
    if (history.length > 20) {
      history.shift();
    }

    this.interactionHistory.set(attempt.animal.id, history);
    this.callbacks.onInteractionAttempt?.(attempt);
  }

  /**
   * Get interaction history for an animal
   */
  getInteractionHistory(animalId: string): InteractionAttempt[] {
    return this.interactionHistory.get(animalId) || [];
  }

  /**
   * Clear all interaction history and cooldowns
   */
  clearHistory(): void {
    this.interactionHistory.clear();
    this.cooldowns.clear();
  }
}

/**
 * Create a new interaction system
 */
export function createInteractionSystem(): InteractionSystem {
  return new InteractionSystem();
}

export default InteractionSystem;