// Interaction System
// Handles player interactions with environment objects

import { Position } from '../types/game';
import { MapObject, ObjectInteractionResult, canInteractWithObject } from './MapObjects';

export interface InteractionState {
  activePrompts: InteractionPrompt[];
  lastInteraction?: {
    objectId: string;
    timestamp: number;
  };
  cooldowns: Map<string, number>; // objectId -> cooldown end timestamp
}

export interface InteractionPrompt {
  id: string;
  objectId: string;
  object: MapObject;
  position: Position;
  visible: boolean;
  distance: number;
  canInteract: boolean;
  reason?: string;
  timestamp: number;
}

export interface InteractionContext {
  playerPosition: Position;
  playerLevel: number;
  playerItems: string[];
  playerAchievements: string[];
  currentTime: number;
}

export class InteractionManager {
  private state: InteractionState;
  private callbacks: {
    onPromptShow?: (prompt: InteractionPrompt) => void;
    onPromptHide?: (promptId: string) => void;
    onInteractionStart?: (object: MapObject) => void;
    onInteractionComplete?: (object: MapObject, result: ObjectInteractionResult) => void;
  };

  constructor() {
    this.state = {
      activePrompts: [],
      cooldowns: new Map()
    };
    this.callbacks = {};
  }

  /**
   * Set callbacks for interaction events
   */
  setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update interaction state based on player position and nearby objects
   */
  updateInteractions(
    objects: MapObject[],
    context: InteractionContext
  ): InteractionPrompt[] {
    const newPrompts: InteractionPrompt[] = [];
    const currentTime = context.currentTime;

    // Clean up expired cooldowns
    this.cleanupCooldowns(currentTime);

    // Find nearby interactable objects
    const nearbyObjects = objects.filter(obj => {
      if (!obj.interactable) return false;
      
      const distance = this.calculateDistance(obj.position, context.playerPosition);
      return distance <= obj.interaction.radius + 1; // Add 1 for buffer
    });

    // Create prompts for nearby objects
    nearbyObjects.forEach(obj => {
      const distance = this.calculateDistance(obj.position, context.playerPosition);
      const interactionCheck = canInteractWithObject(
        obj,
        context.playerLevel,
        context.playerItems,
        context.playerAchievements
      );

      // Check cooldown
      const onCooldown = this.isOnCooldown(obj.id, currentTime);
      const canInteract = interactionCheck.canInteract && !onCooldown;
      const reason = onCooldown ? 'On cooldown' : interactionCheck.reason;

      const prompt: InteractionPrompt = {
        id: `prompt_${obj.id}`,
        objectId: obj.id,
        object: obj,
        position: obj.position,
        visible: distance <= obj.interaction.radius,
        distance,
        canInteract,
        reason,
        timestamp: currentTime
      };

      newPrompts.push(prompt);
    });

    // Update state and trigger callbacks
    this.updatePromptState(newPrompts);
    
    return this.state.activePrompts;
  }

  /**
   * Attempt to interact with an object
   */
  async interactWithObject(
    object: MapObject,
    context: InteractionContext
  ): Promise<ObjectInteractionResult> {
    // Check if interaction is possible
    const distance = this.calculateDistance(object.position, context.playerPosition);
    if (distance > object.interaction.radius) {
      return {
        success: false,
        message: 'Too far away to interact'
      };
    }

    // Check requirements and cooldown
    const interactionCheck = canInteractWithObject(
      object,
      context.playerLevel,
      context.playerItems,
      context.playerAchievements
    );

    if (!interactionCheck.canInteract) {
      return {
        success: false,
        message: interactionCheck.reason || 'Cannot interact'
      };
    }

    if (this.isOnCooldown(object.id, context.currentTime)) {
      const cooldownEnd = this.state.cooldowns.get(object.id) || 0;
      const timeLeft = Math.ceil((cooldownEnd - context.currentTime) / 1000);
      return {
        success: false,
        message: `Wait ${timeLeft} seconds before interacting again`
      };
    }

    // Trigger interaction start callback
    this.callbacks.onInteractionStart?.(object);

    // Process the interaction
    const result = await this.processInteraction(object, context);

    // Set cooldown if specified
    if (object.interaction.cooldown && result.success) {
      this.setCooldown(object.id, context.currentTime + object.interaction.cooldown);
    }

    // Update last interaction
    this.state.lastInteraction = {
      objectId: object.id,
      timestamp: context.currentTime
    };

    // Trigger completion callback
    this.callbacks.onInteractionComplete?.(object, result);

    return result;
  }

  /**
   * Get currently active interaction prompts
   */
  getActivePrompts(): InteractionPrompt[] {
    return this.state.activePrompts.filter(prompt => prompt.visible);
  }

  /**
   * Get the best prompt to show (closest interactable object)
   */
  getBestPrompt(): InteractionPrompt | null {
    const visiblePrompts = this.getActivePrompts();
    if (visiblePrompts.length === 0) return null;

    // Sort by distance and interactability
    visiblePrompts.sort((a, b) => {
      // Prioritize interactable objects
      if (a.canInteract && !b.canInteract) return -1;
      if (!a.canInteract && b.canInteract) return 1;
      
      // Then by distance
      return a.distance - b.distance;
    });

    return visiblePrompts[0];
  }

  /**
   * Check if an object is on cooldown
   */
  isOnCooldown(objectId: string, currentTime: number): boolean {
    const cooldownEnd = this.state.cooldowns.get(objectId);
    return cooldownEnd ? currentTime < cooldownEnd : false;
  }

  /**
   * Get cooldown time remaining for an object
   */
  getCooldownRemaining(objectId: string, currentTime: number): number {
    const cooldownEnd = this.state.cooldowns.get(objectId);
    if (!cooldownEnd || currentTime >= cooldownEnd) return 0;
    return cooldownEnd - currentTime;
  }

  // Private methods

  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + 
      Math.pow(pos1.y - pos2.y, 2)
    );
  }

  private updatePromptState(newPrompts: InteractionPrompt[]) {
    const oldPrompts = this.state.activePrompts;
    this.state.activePrompts = newPrompts;

    // Find new prompts
    const newPromptIds = new Set(newPrompts.map(p => p.id));
    const oldPromptIds = new Set(oldPrompts.map(p => p.id));

    // Trigger show callbacks for new prompts
    newPrompts.forEach(prompt => {
      if (!oldPromptIds.has(prompt.id) && prompt.visible) {
        this.callbacks.onPromptShow?.(prompt);
      }
    });

    // Trigger hide callbacks for removed prompts
    oldPrompts.forEach(prompt => {
      if (!newPromptIds.has(prompt.id) || !prompt.visible) {
        this.callbacks.onPromptHide?.(prompt.id);
      }
    });
  }

  private setCooldown(objectId: string, endTime: number) {
    this.state.cooldowns.set(objectId, endTime);
  }

  private cleanupCooldowns(currentTime: number) {
    for (const [objectId, endTime] of this.state.cooldowns.entries()) {
      if (currentTime >= endTime) {
        this.state.cooldowns.delete(objectId);
      }
    }
  }

  private async processInteraction(
    object: MapObject,
    context: InteractionContext
  ): Promise<ObjectInteractionResult> {
    const interactionType = object.interaction.type;
    
    // Process different types of interactions
    switch (interactionType) {
      case 'examine':
        return this.processExamine(object);
      
      case 'harvest':
        return this.processHarvest(object, context);
      
      case 'collect':
        return this.processCollect(object, context);
      
      case 'rest':
        return this.processRest(object, context);
      
      case 'drink':
        return this.processDrink(object, context);
      
      case 'touch':
        return this.processTouch(object, context);
      
      case 'climb':
        return this.processClimb(object, context);
      
      default:
        return {
          success: true,
          message: `You interact with the ${object.metadata.name}.`
        };
    }
  }

  private processExamine(object: MapObject): ObjectInteractionResult {
    const description = object.metadata.description;
    const lore = object.metadata.lore;
    const message = lore ? `${description}\n\n${lore}` : description;

    return {
      success: true,
      message,
      rewards: {
        experience: 1
      }
    };
  }

  private processHarvest(object: MapObject, context: InteractionContext): ObjectInteractionResult {
    const baseReward = object.type === 'berry_bush' ? 'berries' : 'plant_material';
    const experience = Math.floor(2 + context.playerLevel * 0.5);

    return {
      success: true,
      message: `You harvest from the ${object.metadata.name}.`,
      rewards: {
        experience,
        items: [baseReward]
      }
    };
  }

  private processCollect(object: MapObject, context: InteractionContext): ObjectInteractionResult {
    const collectible = object.type === 'flower' ? 'flowers' : 'natural_item';
    
    return {
      success: true,
      message: `You collect some ${collectible}.`,
      rewards: {
        experience: 1,
        items: [collectible]
      }
    };
  }

  private processRest(object: MapObject, context: InteractionContext): ObjectInteractionResult {
    return {
      success: true,
      message: `You rest peacefully by the ${object.metadata.name}.`,
      effects: {
        playerEffect: 'rested',
        duration: 60000 // 1 minute
      },
      rewards: {
        experience: 2
      }
    };
  }

  private processDrink(object: MapObject, context: InteractionContext): ObjectInteractionResult {
    return {
      success: true,
      message: 'The crystal-clear water refreshes you completely.',
      effects: {
        playerEffect: 'refreshed',
        duration: 120000 // 2 minutes
      },
      rewards: {
        experience: 3
      }
    };
  }

  private processTouch(object: MapObject, context: InteractionContext): ObjectInteractionResult {
    if (object.metadata.rarity === 'legendary') {
      return {
        success: true,
        message: 'The ancient stone pulses with mysterious energy...',
        effects: {
          playerEffect: 'mystical_insight',
          duration: 300000 // 5 minutes
        },
        rewards: {
          experience: 10,
          discoveries: ['ancient_magic']
        }
      };
    }

    return {
      success: true,
      message: `You touch the ${object.metadata.name}.`,
      rewards: {
        experience: 1
      }
    };
  }

  private processClimb(object: MapObject, context: InteractionContext): ObjectInteractionResult {
    if (context.playerLevel < 3) {
      return {
        success: false,
        message: 'You need more experience before attempting to climb this.'
      };
    }

    return {
      success: true,
      message: `You climb the ${object.metadata.name} and get a great view of the area!`,
      rewards: {
        experience: 5,
        discoveries: ['high_vantage_point']
      }
    };
  }
}

// Utility functions for common interaction patterns

/**
 * Create a simple interaction manager instance
 */
export function createInteractionManager(): InteractionManager {
  return new InteractionManager();
}

/**
 * Check if a position is within interaction range of any object
 */
export function isInInteractionRange(
  objects: MapObject[],
  position: Position,
  maxRange: number = 1
): boolean {
  return objects.some(obj => {
    if (!obj.interactable) return false;
    
    const distance = Math.sqrt(
      Math.pow(obj.position.x - position.x, 2) + 
      Math.pow(obj.position.y - position.y, 2)
    );
    
    return distance <= Math.min(obj.interaction.radius, maxRange);
  });
}

/**
 * Get the most relevant interaction for display
 */
export function getPrimaryInteraction(
  objects: MapObject[],
  position: Position
): MapObject | null {
  const interactableObjects = objects
    .filter(obj => obj.interactable)
    .map(obj => ({
      object: obj,
      distance: Math.sqrt(
        Math.pow(obj.position.x - position.x, 2) + 
        Math.pow(obj.position.y - position.y, 2)
      )
    }))
    .filter(({ object, distance }) => distance <= object.interaction.radius)
    .sort((a, b) => a.distance - b.distance);

  return interactableObjects.length > 0 ? interactableObjects[0].object : null;
}

export default InteractionManager;