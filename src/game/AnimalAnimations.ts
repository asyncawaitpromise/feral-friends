import { Animal } from './Animal';
import { TILE_SIZE } from '../constants';

export interface AnimalAnimationState {
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  isMoving: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  animationProgress: number;
  lastMoveTime: number;
  behaviorAnimation: string;
  emotionIntensity: number;
  idleAnimationTime: number;
}

export interface AnimatedAnimalData {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  offset: { x: number; y: number };
  opacity: number;
  emotion: {
    intensity: number;
    type: string;
    color?: string;
  };
}

export class AnimalAnimations {
  private animationStates: Map<string, AnimalAnimationState> = new Map();
  private speciesAnimationConfigs: Map<string, AnimalSpeciesConfig> = new Map();

  constructor() {
    this.initializeSpeciesConfigs();
  }

  private initializeSpeciesConfigs(): void {
    // Different animation configs for different animal types
    this.speciesAnimationConfigs.set('rabbit', {
      movementStyle: 'hop',
      idleAnimations: ['twitch_ears', 'look_around', 'groom'],
      emotionAnimations: ['happy_bounce', 'scared_freeze', 'curious_approach'],
      movementSpeed: 200, // Fast hops
      scale: { min: 0.9, max: 1.2 },
      floatAmplitude: 1
    });

    this.speciesAnimationConfigs.set('bird', {
      movementStyle: 'flutter',
      idleAnimations: ['preen', 'head_tilt', 'wing_stretch'],
      emotionAnimations: ['chirp_happy', 'ruffle_scared', 'peck_curious'],
      movementSpeed: 150, // Quick flutter
      scale: { min: 0.95, max: 1.1 },
      floatAmplitude: 3 // Birds float more
    });

    this.speciesAnimationConfigs.set('squirrel', {
      movementStyle: 'scurry',
      idleAnimations: ['tail_flick', 'sit_up', 'groom_tail'],
      emotionAnimations: ['excited_bounce', 'alert_stance', 'playful_spin'],
      movementSpeed: 180,
      scale: { min: 0.9, max: 1.15 },
      floatAmplitude: 0.5
    });

    this.speciesAnimationConfigs.set('fox', {
      movementStyle: 'prowl',
      idleAnimations: ['ear_swivel', 'sniff', 'stretch'],
      emotionAnimations: ['playful_pounce', 'wary_crouch', 'friendly_approach'],
      movementSpeed: 250, // Smooth and deliberate
      scale: { min: 0.95, max: 1.1 },
      floatAmplitude: 0.8
    });

    this.speciesAnimationConfigs.set('deer', {
      movementStyle: 'graceful',
      idleAnimations: ['graze', 'alert_ears', 'gentle_step'],
      emotionAnimations: ['cautious_ready', 'peaceful_lower', 'graceful_bow'],
      movementSpeed: 300, // Slow and graceful
      scale: { min: 0.98, max: 1.05 },
      floatAmplitude: 0.3
    });

    this.speciesAnimationConfigs.set('butterfly', {
      movementStyle: 'flutter',
      idleAnimations: ['wing_flutter', 'rest', 'spiral'],
      emotionAnimations: ['excited_dance', 'gentle_hover', 'playful_spiral'],
      movementSpeed: 120, // Light and airy
      scale: { min: 0.9, max: 1.3 },
      floatAmplitude: 5 // Most floating movement
    });

    this.speciesAnimationConfigs.set('frog', {
      movementStyle: 'hop',
      idleAnimations: ['throat_puff', 'blink', 'sit'],
      emotionAnimations: ['happy_croak', 'startled_jump', 'content_sit'],
      movementSpeed: 220,
      scale: { min: 0.9, max: 1.2 },
      floatAmplitude: 0.5
    });

    this.speciesAnimationConfigs.set('turtle', {
      movementStyle: 'slow',
      idleAnimations: ['head_extend', 'shell_adjust', 'slow_blink'],
      emotionAnimations: ['content_extend', 'scared_retract', 'curious_peek'],
      movementSpeed: 400, // Very slow
      scale: { min: 0.98, max: 1.02 },
      floatAmplitude: 0.1
    });
  }

  initializeAnimal(animal: Animal): void {
    this.animationStates.set(animal.id, {
      position: { ...animal.position },
      targetPosition: { ...animal.position },
      isMoving: false,
      direction: 'idle',
      animationProgress: 0,
      lastMoveTime: Date.now(),
      behaviorAnimation: 'idle',
      emotionIntensity: 0,
      idleAnimationTime: Date.now() + Math.random() * 3000 // Random idle timing
    });
  }

  updateAnimalMovement(animal: Animal): void {
    const state = this.animationStates.get(animal.id);
    if (!state) {
      this.initializeAnimal(animal);
      return;
    }

    // Check if animal has moved to a new position
    const currentTarget = state.targetPosition;
    if (animal.position.x !== currentTarget.x || animal.position.y !== currentTarget.y) {
      this.startMovement(animal.id, animal.position, animal.species);
    }

    // Update behavior animation based on AI state
    this.updateBehaviorAnimation(animal.id, animal.ai.currentState, animal.species);
  }

  private startMovement(animalId: string, targetPosition: { x: number; y: number }, species: string): void {
    const state = this.animationStates.get(animalId);
    if (!state) return;

    state.targetPosition = { ...targetPosition };
    state.isMoving = true;
    state.animationProgress = 0;
    state.lastMoveTime = Date.now();
    state.direction = this.calculateDirection(state.position, targetPosition);
  }

  private updateBehaviorAnimation(animalId: string, aiState: string, species: string): void {
    const state = this.animationStates.get(animalId);
    if (!state) return;

    // Map AI states to animation behaviors
    const behaviorMap: Record<string, string> = {
      idle: 'idle',
      wandering: 'casual',
      feeding: 'focused',
      fleeing: 'scared',
      hiding: 'cautious',
      sleeping: 'rest',
      curious: 'interested',
      following: 'friendly'
    };

    state.behaviorAnimation = behaviorMap[aiState] || 'idle';
    
    // Update emotion intensity based on behavior
    switch (aiState) {
      case 'fleeing':
        state.emotionIntensity = 1.0;
        break;
      case 'curious':
        state.emotionIntensity = 0.7;
        break;
      case 'feeding':
        state.emotionIntensity = 0.5;
        break;
      default:
        state.emotionIntensity = 0.2;
    }
  }

  getAnimatedData(animal: Animal): AnimatedAnimalData {
    const state = this.animationStates.get(animal.id);
    if (!state) {
      this.initializeAnimal(animal);
      return this.getDefaultAnimatedData(animal);
    }

    const config = this.speciesAnimationConfigs.get(animal.species);
    if (!config) {
      return this.getDefaultAnimatedData(animal);
    }

    // Update movement animation
    this.updateMovementAnimation(state, config);

    // Calculate current position
    const animatedPosition = this.calculateAnimatedPosition(state, config);
    
    // Calculate scale effects
    const scale = this.calculateScale(state, config, animal);
    
    // Calculate rotation
    const rotation = this.calculateRotation(state, config);
    
    // Calculate floating offset
    const offset = this.calculateFloatingOffset(state, config);
    
    // Calculate emotion effects
    const emotion = this.calculateEmotion(state, animal);

    return {
      position: {
        x: animatedPosition.x * TILE_SIZE,
        y: animatedPosition.y * TILE_SIZE
      },
      scale,
      rotation,
      offset,
      opacity: this.calculateOpacity(state, animal),
      emotion
    };
  }

  private updateMovementAnimation(state: AnimalAnimationState, config: AnimalSpeciesConfig): void {
    if (!state.isMoving) return;

    const elapsed = Date.now() - state.lastMoveTime;
    state.animationProgress = Math.min(1, elapsed / config.movementSpeed);

    if (state.animationProgress >= 1) {
      state.position = { ...state.targetPosition };
      state.isMoving = false;
      state.direction = 'idle';
      state.animationProgress = 0;
    }
  }

  private calculateAnimatedPosition(state: AnimalAnimationState, config: AnimalSpeciesConfig): { x: number; y: number } {
    if (!state.isMoving) {
      return state.position;
    }

    // Apply species-specific movement easing
    let easedProgress = state.animationProgress;
    
    switch (config.movementStyle) {
      case 'hop':
        // Bouncy hop movement
        easedProgress = this.hopEasing(state.animationProgress);
        break;
      case 'flutter':
        // Light, airy movement with slight oscillation
        easedProgress = this.flutterEasing(state.animationProgress);
        break;
      case 'prowl':
        // Smooth, predatory movement
        easedProgress = this.prowlEasing(state.animationProgress);
        break;
      case 'graceful':
        // Elegant, smooth movement
        easedProgress = this.gracefulEasing(state.animationProgress);
        break;
      case 'slow':
        // Very gradual, steady movement
        easedProgress = this.slowEasing(state.animationProgress);
        break;
      default:
        easedProgress = this.defaultEasing(state.animationProgress);
    }

    return {
      x: state.position.x + (state.targetPosition.x - state.position.x) * easedProgress,
      y: state.position.y + (state.targetPosition.y - state.position.y) * easedProgress
    };
  }

  private calculateScale(state: AnimalAnimationState, config: AnimalSpeciesConfig, animal: Animal): number {
    let baseScale = 1;

    // Movement scale effects
    if (state.isMoving) {
      switch (config.movementStyle) {
        case 'hop':
          // Squash and stretch for hops
          const hopPhase = Math.sin(state.animationProgress * Math.PI);
          baseScale += hopPhase * 0.15;
          break;
        case 'flutter':
          // Slight scale variation for wing movement
          baseScale += Math.sin(Date.now() / 100) * 0.05;
          break;
      }
    }

    // Emotion scale effects
    baseScale += state.emotionIntensity * 0.1;

    // Breathing/idle animation
    if (!state.isMoving) {
      const breathingCycle = Math.sin(Date.now() / 2000) * 0.02;
      baseScale += breathingCycle;
    }

    // Trust level affects size slightly
    const trustEffect = (animal.stats.trustLevel / 100) * 0.05;
    baseScale += trustEffect;

    return Math.max(config.scale.min, Math.min(config.scale.max, baseScale));
  }

  private calculateRotation(state: AnimalAnimationState, config: AnimalSpeciesConfig): number {
    if (!state.isMoving) return 0;

    // Direction-based rotation
    const directionRotation = {
      up: -2,
      down: 2,
      left: -3,
      right: 3,
      idle: 0
    }[state.direction];

    // Movement style affects rotation intensity
    const intensityMultiplier = {
      hop: 0.5,
      flutter: 1.5,
      prowl: 0.3,
      graceful: 0.2,
      slow: 0.1,
      scurry: 0.8
    }[config.movementStyle] || 0.5;

    return directionRotation * intensityMultiplier * Math.sin(state.animationProgress * Math.PI);
  }

  private calculateFloatingOffset(state: AnimalAnimationState, config: AnimalSpeciesConfig): { x: number; y: number } {
    const time = Date.now() / 1000;
    
    // Different floating patterns based on species
    let xOffset = 0;
    let yOffset = 0;

    if (config.movementStyle === 'flutter') {
      // Figure-8 pattern for flying creatures
      xOffset = Math.sin(time * 2) * config.floatAmplitude * 0.3;
      yOffset = Math.sin(time * 4) * config.floatAmplitude;
    } else {
      // Simple up-down floating for others
      yOffset = Math.sin(time * 1.5 + state.position.x + state.position.y) * config.floatAmplitude;
    }

    // Reduce floating when moving
    if (state.isMoving) {
      xOffset *= 0.3;
      yOffset *= 0.3;
    }

    return { x: xOffset, y: yOffset };
  }

  private calculateEmotion(state: AnimalAnimationState, animal: Animal): { intensity: number; type: string; color?: string } {
    const emotionMap: Record<string, { type: string; color: string }> = {
      idle: { type: 'neutral', color: '#94a3b8' },
      casual: { type: 'content', color: '#22c55e' },
      focused: { type: 'concentrated', color: '#3b82f6' },
      scared: { type: 'fear', color: '#ef4444' },
      cautious: { type: 'wary', color: '#f59e0b' },
      rest: { type: 'peaceful', color: '#8b5cf6' },
      interested: { type: 'curious', color: '#06b6d4' },
      friendly: { type: 'happy', color: '#ec4899' }
    };

    const emotionData = emotionMap[state.behaviorAnimation] || emotionMap.idle;
    
    return {
      intensity: state.emotionIntensity,
      type: emotionData.type,
      color: emotionData.color
    };
  }

  private calculateOpacity(state: AnimalAnimationState, animal: Animal): number {
    let opacity = 1;

    // Fade effect when hiding
    if (state.behaviorAnimation === 'cautious') {
      opacity = 0.8;
    }

    // Trust level affects visibility slightly
    const trustEffect = animal.stats.trustLevel / 100;
    opacity = Math.max(0.7, opacity * (0.8 + trustEffect * 0.2));

    return opacity;
  }

  // Easing functions for different movement styles
  private hopEasing(t: number): number {
    // Bouncy hop with pause at peak
    if (t < 0.4) return 2.5 * t * t;
    if (t < 0.6) return 1 - 2.5 * (0.6 - t) * (0.6 - t);
    return 1 - 2.5 * (1 - t) * (1 - t);
  }

  private flutterEasing(t: number): number {
    // Light, wavy movement
    return t + Math.sin(t * Math.PI * 4) * 0.1;
  }

  private prowlEasing(t: number): number {
    // Smooth predatory movement
    return t * t * (3 - 2 * t);
  }

  private gracefulEasing(t: number): number {
    // Very smooth, elegant curve
    return Math.sin(t * Math.PI / 2);
  }

  private slowEasing(t: number): number {
    // Linear but very gradual
    return t;
  }

  private defaultEasing(t: number): number {
    // Standard ease-in-out
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private calculateDirection(from: { x: number; y: number }, to: { x: number; y: number }): 'up' | 'down' | 'left' | 'right' | 'idle' {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      return dy > 0 ? 'down' : 'up';
    }

    return 'idle';
  }

  private getDefaultAnimatedData(animal: Animal): AnimatedAnimalData {
    return {
      position: {
        x: animal.position.x * TILE_SIZE,
        y: animal.position.y * TILE_SIZE
      },
      scale: 1,
      rotation: 0,
      offset: { x: 0, y: 0 },
      opacity: 1,
      emotion: {
        intensity: 0,
        type: 'neutral',
        color: '#94a3b8'
      }
    };
  }

  // Cleanup method
  removeAnimal(animalId: string): void {
    this.animationStates.delete(animalId);
  }

  // Get all animated animals
  getAllAnimatedData(animals: Animal[]): Map<string, AnimatedAnimalData> {
    const result = new Map<string, AnimatedAnimalData>();
    
    for (const animal of animals) {
      if (animal.isActive) {
        this.updateAnimalMovement(animal);
        result.set(animal.id, this.getAnimatedData(animal));
      }
    }

    return result;
  }
}

interface AnimalSpeciesConfig {
  movementStyle: 'hop' | 'flutter' | 'scurry' | 'prowl' | 'graceful' | 'slow';
  idleAnimations: string[];
  emotionAnimations: string[];
  movementSpeed: number; // milliseconds per tile
  scale: { min: number; max: number };
  floatAmplitude: number; // pixels
}

// Factory function
export function createAnimalAnimations(): AnimalAnimations {
  return new AnimalAnimations();
}