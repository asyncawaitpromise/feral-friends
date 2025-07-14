// Animal AI System
// Handles basic AI behaviors: idle, wandering, fleeing from player, and returning to spawn area

import { Position } from '../types/game';
import { 
  Animal, 
  AnimalState, 
  getDistanceToPlayer, 
  getDistanceToPosition,
  setAnimalTarget,
  moveTowardsTarget,
  getRandomWanderPosition,
  shouldFleeFromPlayer,
  shouldBeAlert,
  canInteractWithPlayer,
  shouldReturnHome,
  getFleePosition,
  updateAnimalMemory,
  updateAnimalPosition
} from './Animal';

export interface AIContext {
  playerPosition: Position;
  currentTime: number;
  deltaTime: number;
  mapBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface AIBehaviorResult {
  stateChanged: boolean;
  newState?: AnimalState;
  targetReached: boolean;
  memoryUpdated: boolean;
  feedbackMessage?: string;
}

export class AnimalAI {
  private static readonly STATE_DURATIONS = {
    idle: { min: 3, max: 8 },       // 3-8 turns
    wandering: { min: 4, max: 12 },  // 4-12 turns
    fleeing: { min: 2, max: 6 },    // 2-6 turns
    returning: { min: 3, max: 10 },  // 3-10 turns
    feeding: { min: 5, max: 15 },    // 5-15 turns
    sleeping: { min: 8, max: 20 },  // 8-20 turns
    curious: { min: 2, max: 6 },    // 2-6 turns
    hiding: { min: 4, max: 15 },    // 4-15 turns
    alert: { min: 2, max: 5 }       // 2-5 turns
  };

  // Track turns instead of time for each animal
  private static animalTurnCounters: Map<string, number> = new Map();

  private static readonly MOVEMENT_SPEEDS = {
    idle: 0,
    wandering: 0.5,
    fleeing: 2.0,
    returning: 0.8,
    feeding: 0.2,
    sleeping: 0,
    curious: 0.3,
    hiding: 0.1,
    alert: 0.1
  };

  /**
   * Update animal AI behavior based on current context
   */
  static updateAI(animal: Animal, context: AIContext): AIBehaviorResult {
    const result: AIBehaviorResult = {
      stateChanged: false,
      targetReached: false,
      memoryUpdated: false
    };

    // Check if current state duration has expired
    const stateDuration = context.currentTime - animal.ai.lastStateChange;
    const shouldChangeState = this.shouldChangeState(animal, stateDuration, context);

    if (shouldChangeState) {
      const newState = this.selectNewState(animal, context);
      if (newState !== animal.ai.currentState) {
        this.changeState(animal, newState, context);
        result.stateChanged = true;
        result.newState = newState;
      }
    }

    // Execute current state behavior
    const behaviorResult = this.executeBehavior(animal, context);
    Object.assign(result, behaviorResult);

    // Update position based on movement
    updateAnimalPosition(animal, context.deltaTime);

    // Update last update time
    animal.lastUpdate = context.currentTime;

    return result;
  }

  /**
   * Check if animal should change from current state (turn-based)
   */
  private static shouldChangeState(animal: Animal, stateDuration: number, context: AIContext): boolean {
    const currentState = animal.ai.currentState;
    
    // Emergency state changes (override normal duration) - more conservative for turn-based
    if (shouldFleeFromPlayer(animal, context.playerPosition) && currentState !== 'fleeing') {
      return true;
    }

    // Alert state change when player approaches
    if (shouldBeAlert(animal, context.playerPosition) && currentState !== 'alert' && currentState !== 'fleeing') {
      return true;
    }

    if (shouldReturnHome(animal) && currentState !== 'returning') {
      return true;
    }

    // Get or initialize turn counter for this animal
    const animalId = animal.id;
    if (!this.animalTurnCounters.has(animalId)) {
      this.animalTurnCounters.set(animalId, 0);
    }

    // Increment turn counter
    const currentTurns = this.animalTurnCounters.get(animalId)! + 1;
    this.animalTurnCounters.set(animalId, currentTurns);

    // Check if state duration (in turns) has been exceeded
    const durations = this.STATE_DURATIONS[currentState];
    const maxTurns = durations.min + Math.floor(Math.random() * (durations.max - durations.min));
    
    return currentTurns >= maxTurns;
  }

  /**
   * Select appropriate new state based on current situation
   */
  private static selectNewState(animal: Animal, context: AIContext): AnimalState {
    // Priority-based state selection
    
    // 1. Emergency: Flee if player is too close
    if (shouldFleeFromPlayer(animal, context.playerPosition)) {
      return 'fleeing';
    }

    // 2. Alert: Be cautious if player is approaching
    if (shouldBeAlert(animal, context.playerPosition)) {
      return 'alert';
    }

    // 3. Important: Return home if too far away
    if (shouldReturnHome(animal)) {
      return 'returning';
    }

    // 4. Energy-based states
    if (animal.stats.energy < 30) {
      return Math.random() < 0.7 ? 'sleeping' : 'idle';
    }

    // 5. Happiness-based states
    if (animal.stats.happiness > 80 && Math.random() < 0.3) {
      return 'feeding';
    }

    // 6. Curiosity-based states
    if (animal.stats.curiosity > 60 && Math.random() < 0.4) {
      const playerDistance = getDistanceToPlayer(animal, context.playerPosition);
      if (playerDistance > animal.behavior.fleeDistance && playerDistance < 8) {
        return 'curious';
      }
    }

    // 7. Default behavior based on activity level
    const activityRoll = Math.random();
    if (activityRoll < animal.behavior.activityLevel * 0.7) {
      return 'wandering';
    } else {
      return 'idle';
    }
  }

  /**
   * Change animal state and setup new behavior (turn-based)
   */
  private static changeState(animal: Animal, newState: AnimalState, context: AIContext): void {
    const oldState = animal.ai.currentState;
    
    animal.ai.currentState = newState;
    animal.ai.lastStateChange = context.currentTime;
    animal.ai.stateTimer = 0;

    // Reset turn counter when changing states
    this.animalTurnCounters.set(animal.id, 0);

    // Setup state-specific behavior
    switch (newState) {
      case 'idle':
        animal.velocity.x = 0;
        animal.velocity.y = 0;
        animal.ai.targetPosition = undefined;
        break;

      case 'wandering':
        const wanderTarget = getRandomWanderPosition(animal);
        setAnimalTarget(animal, wanderTarget);
        break;

      case 'fleeing':
        const fleeTarget = getFleePosition(animal, context.playerPosition);
        setAnimalTarget(animal, fleeTarget);
        updateAnimalMemory(animal, context.playerPosition, 'danger');
        break;

      case 'alert':
        // Stop movement and clear target when becoming alert
        animal.velocity.x = 0;
        animal.velocity.y = 0;
        animal.ai.targetPosition = undefined;
        // Remember player position but not as danger (yet)
        animal.ai.memory.lastPlayerPosition = { ...context.playerPosition };
        break;

      case 'returning':
        setAnimalTarget(animal, animal.ai.homePosition);
        break;

      case 'feeding':
        // Look for nearby food spots in memory
        const foodSpots = animal.ai.memory.foodSpots;
        if (foodSpots.length > 0) {
          const nearestFood = foodSpots.reduce((nearest, spot) => {
            const distance = getDistanceToPosition(animal, spot);
            const nearestDistance = getDistanceToPosition(animal, nearest);
            return distance < nearestDistance ? spot : nearest;
          });
          setAnimalTarget(animal, nearestFood);
        } else {
          // Find random spot near home to "feed"
          const feedSpot = getRandomWanderPosition(animal);
          setAnimalTarget(animal, feedSpot);
        }
        break;

      case 'curious':
        // Move slightly towards player but maintain safe distance
        const playerDistance = getDistanceToPlayer(animal, context.playerPosition);
        if (playerDistance > animal.behavior.fleeDistance + 1) {
          const direction = {
            x: (context.playerPosition.x - animal.position.x) / playerDistance,
            y: (context.playerPosition.y - animal.position.y) / playerDistance
          };
          
          const curiousTarget = {
            x: animal.position.x + direction.x * 2,
            y: animal.position.y + direction.y * 2
          };
          setAnimalTarget(animal, curiousTarget);
        }
        break;

      case 'hiding':
        // Find safe spot from memory or random spot away from danger
        const safeSpots = animal.ai.memory.safeSpots;
        if (safeSpots.length > 0) {
          const safestSpot = safeSpots[Math.floor(Math.random() * safeSpots.length)];
          setAnimalTarget(animal, safestSpot);
        } else {
          const hideTarget = getFleePosition(animal, context.playerPosition);
          setAnimalTarget(animal, hideTarget);
        }
        break;

      case 'sleeping':
        animal.velocity.x = 0;
        animal.velocity.y = 0;
        animal.ai.targetPosition = undefined;
        break;
    }

    // Visual feedback setup
    this.updateVisualFeedback(animal, newState, oldState);
  }

  /**
   * Execute behavior for current state
   */
  private static executeBehavior(animal: Animal, context: AIContext): Partial<AIBehaviorResult> {
    const result: Partial<AIBehaviorResult> = {};
    const state = animal.ai.currentState;
    const speed = this.MOVEMENT_SPEEDS[state];

    // Update state timer
    animal.ai.stateTimer += context.deltaTime;

    switch (state) {
      case 'idle':
        // Occasionally look around or show small movements
        if (Math.random() < 0.01) { // 1% chance per frame
          animal.velocity.x = (Math.random() - 0.5) * 0.1;
          animal.velocity.y = (Math.random() - 0.5) * 0.1;
        } else {
          animal.velocity.x *= 0.9; // Gradual stop
          animal.velocity.y *= 0.9;
        }
        break;

      case 'wandering':
        // Only move every few turns for wandering animals
        const turnCount = this.animalTurnCounters.get(animal.id) || 0;
        if (turnCount % 3 === 0) { // Move every 3rd turn
          const reachedTarget = moveTowardsTarget(animal, speed);
          if (reachedTarget) {
            result.targetReached = true;
            // Add current position as safe spot
            updateAnimalMemory(animal, animal.position, 'safe');
            result.memoryUpdated = true;
          }
        }
        break;

      case 'fleeing':
        // Fleeing animals move every turn (urgent)
        const fleeDone = moveTowardsTarget(animal, speed);
        if (fleeDone) {
          result.targetReached = true;
          // Mark this as a safe spot after successful flee
          updateAnimalMemory(animal, animal.position, 'safe');
          result.memoryUpdated = true;
        }
        break;

      case 'alert':
        // Alert animals stand still and watch the player
        animal.velocity.x = 0;
        animal.velocity.y = 0;
        animal.ai.targetPosition = undefined;
        
        // Face towards player
        const playerDirection = getDistanceToPlayer(animal, context.playerPosition);
        
        // If player gets too close while alert, flee immediately
        if (shouldFleeFromPlayer(animal, context.playerPosition)) {
          result.feedbackMessage = `${animal.species} decides to flee!`;
        } else if (canInteractWithPlayer(animal, context.playerPosition)) {
          // If conditions are right for interaction, show positive feedback
          result.feedbackMessage = `${animal.species} seems calm and watchful`;
          // Slightly reduce fear over time if player isn't threatening
          animal.stats.fear = Math.max(0, animal.stats.fear - 1);
        } else {
          result.feedbackMessage = `${animal.species} is alert and watching you carefully`;
        }
        break;

      case 'returning':
        // Returning animals move every other turn
        const returnTurnCount = this.animalTurnCounters.get(animal.id) || 0;
        if (returnTurnCount % 2 === 0) {
          const returnDone = moveTowardsTarget(animal, speed);
          if (returnDone) {
            result.targetReached = true;
            // Restore energy when back home
            animal.stats.energy = Math.min(animal.stats.maxEnergy, animal.stats.energy + 10);
          }
        }
        break;

      case 'feeding':
        // Feeding animals move slowly, every 4th turn
        const feedTurnCount = this.animalTurnCounters.get(animal.id) || 0;
        if (feedTurnCount % 4 === 0) {
          const feedDone = moveTowardsTarget(animal, speed);
          if (feedDone) {
            result.targetReached = true;
            // Restore energy and happiness while feeding
            animal.stats.energy = Math.min(animal.stats.maxEnergy, animal.stats.energy + 5);
            animal.stats.happiness = Math.min(100, animal.stats.happiness + 2);
            
            // Mark feeding spot in memory
            updateAnimalMemory(animal, animal.position, 'food');
            result.memoryUpdated = true;
            result.feedbackMessage = `${animal.species} is feeding peacefully`;
          }
        }
        break;

      case 'curious':
        // Curious animals move every other turn
        const curiousTurnCount = this.animalTurnCounters.get(animal.id) || 0;
        if (curiousTurnCount % 2 === 0) {
          const curiousDone = moveTowardsTarget(animal, speed);
          if (curiousDone) {
            result.targetReached = true;
            // Increase curiosity satisfaction
            animal.stats.curiosity = Math.min(100, animal.stats.curiosity + 3);
            result.feedbackMessage = `${animal.species} looks curious about you`;
          }
        }
        break;

      case 'hiding':
        // Hiding animals move every other turn
        const hideTurnCount = this.animalTurnCounters.get(animal.id) || 0;
        if (hideTurnCount % 2 === 0) {
          const hideDone = moveTowardsTarget(animal, speed);
          if (hideDone) {
            result.targetReached = true;
            // Reduce fear while hidden
            animal.stats.fear = Math.max(0, animal.stats.fear - 5);
            updateAnimalMemory(animal, animal.position, 'safe');
            result.memoryUpdated = true;
          }
        }
        break;

      case 'sleeping':
        // Restore energy while sleeping
        animal.stats.energy = Math.min(animal.stats.maxEnergy, animal.stats.energy + 2);
        animal.velocity.x = 0;
        animal.velocity.y = 0;
        break;
    }

    // Natural stat changes over time
    this.updateStatsOverTime(animal, context.deltaTime);

    return result;
  }

  /**
   * Update visual feedback based on state changes
   */
  private static updateVisualFeedback(animal: Animal, newState: AnimalState, oldState: AnimalState): void {
    // Update emote icon based on state
    switch (newState) {
      case 'idle':
        animal.visual.emoteIcon = '😌';
        break;
      case 'wandering':
        animal.visual.emoteIcon = '🚶';
        break;
      case 'fleeing':
        animal.visual.emoteIcon = '😨';
        break;
      case 'returning':
        animal.visual.emoteIcon = '🏠';
        break;
      case 'feeding':
        animal.visual.emoteIcon = '🍃';
        break;
      case 'curious':
        animal.visual.emoteIcon = '🤔';
        break;
      case 'hiding':
        animal.visual.emoteIcon = '🫣';
        break;
      case 'sleeping':
        animal.visual.emoteIcon = '😴';
        break;
    }
  }

  /**
   * Update animal stats over time
   */
  private static updateStatsOverTime(animal: Animal, deltaTime: number): void {
    const timeMultiplier = deltaTime / 1000; // Convert to seconds

    // Energy decreases slowly over time (except when sleeping/feeding)
    if (animal.ai.currentState !== 'sleeping' && animal.ai.currentState !== 'feeding') {
      animal.stats.energy = Math.max(0, animal.stats.energy - 1 * timeMultiplier);
    }

    // Fear decreases slowly when not fleeing
    if (animal.ai.currentState !== 'fleeing') {
      animal.stats.fear = Math.max(0, animal.stats.fear - 2 * timeMultiplier);
    }

    // Happiness decreases very slowly
    animal.stats.happiness = Math.max(0, animal.stats.happiness - 0.5 * timeMultiplier);

    // Trust can increase very slowly when curious or idle near player
    if ((animal.ai.currentState === 'curious' || animal.ai.currentState === 'idle')) {
      animal.stats.trust = Math.min(100, animal.stats.trust + 0.5 * timeMultiplier);
    }
  }

  /**
   * Force a specific state change (for external events)
   */
  static forceStateChange(animal: Animal, newState: AnimalState, context: AIContext): void {
    this.changeState(animal, newState, context);
  }

  /**
   * Get current behavior description for debugging/UI
   */
  static getBehaviorDescription(animal: Animal): string {
    const state = animal.ai.currentState;
    const target = animal.ai.targetPosition;
    
    let description = `${state.charAt(0).toUpperCase() + state.slice(1)}`;
    
    if (target) {
      const distance = getDistanceToPosition(animal, target);
      description += ` (${distance.toFixed(1)}m to target)`;
    }

    return description;
  }

  /**
   * Check if animal can be interacted with based on current state
   */
  static canBeInteracted(animal: Animal): boolean {
    const nonInteractableStates: AnimalState[] = ['fleeing', 'hiding', 'sleeping'];
    return !nonInteractableStates.includes(animal.ai.currentState) && 
           animal.stats.fear < 80;
  }

  /**
   * Get recommended approach method for current animal state
   */
  static getRecommendedApproach(animal: Animal): {
    method: 'slow' | 'normal' | 'stop';
    reason: string;
  } {
    switch (animal.ai.currentState) {
      case 'curious':
        return { method: 'slow', reason: 'Animal is curious but still cautious' };
      case 'feeding':
        return { method: 'stop', reason: 'Don\'t disturb while feeding' };
      case 'sleeping':
        return { method: 'stop', reason: 'Animal is sleeping' };
      case 'fleeing':
      case 'hiding':
        return { method: 'stop', reason: 'Animal is scared' };
      case 'idle':
        return { method: 'slow', reason: 'Approach slowly to avoid startling' };
      default:
        return { method: 'normal', reason: 'Normal approach is fine' };
    }
  }
}

/**
 * Create AI context from game state
 */
export function createAIContext(
  playerPosition: Position,
  currentTime: number,
  deltaTime: number,
  mapBounds?: { minX: number; maxX: number; minY: number; maxY: number }
): AIContext {
  return {
    playerPosition,
    currentTime,
    deltaTime,
    mapBounds
  };
}

/**
 * Batch update multiple animals
 */
export function updateMultipleAnimals(
  animals: Animal[],
  context: AIContext
): Map<string, AIBehaviorResult> {
  const results = new Map<string, AIBehaviorResult>();

  for (const animal of animals) {
    if (!animal.isActive) continue;
    
    const result = AnimalAI.updateAI(animal, context);
    results.set(animal.id, result);
  }

  return results;
}

export default AnimalAI;