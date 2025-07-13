import { TILE_SIZE } from '../constants';

export interface PlayerAnimationState {
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  isMoving: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  animationProgress: number;
  lastMoveTime: number;
}

export interface AnimatedPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export class PlayerAnimations {
  private animationState: PlayerAnimationState;
  private callbacks: {
    onMovementComplete?: () => void;
    onAnimationUpdate?: (position: AnimatedPosition) => void;
  } = {};

  constructor(initialPosition: { x: number; y: number }) {
    this.animationState = {
      position: { ...initialPosition },
      targetPosition: { ...initialPosition },
      isMoving: false,
      direction: 'idle',
      animationProgress: 0,
      lastMoveTime: Date.now()
    };
  }

  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  startMovement(targetPosition: { x: number; y: number }): void {
    this.animationState.targetPosition = { ...targetPosition };
    this.animationState.isMoving = true;
    this.animationState.animationProgress = 0;
    this.animationState.lastMoveTime = Date.now();
    this.animationState.direction = this.calculateDirection(
      this.animationState.position,
      targetPosition
    );
  }

  update(deltaTime: number): AnimatedPosition {
    if (!this.animationState.isMoving) {
      return this.getIdleAnimation();
    }

    // Update animation progress
    const moveDuration = 300; // 300ms per tile
    this.animationState.animationProgress = Math.min(
      1,
      (Date.now() - this.animationState.lastMoveTime) / moveDuration
    );

    // Calculate current animated position
    const animatedPosition = this.interpolatePosition(
      this.animationState.position,
      this.animationState.targetPosition,
      this.animationState.animationProgress
    );

    // Check if movement is complete
    if (this.animationState.animationProgress >= 1) {
      this.completeMovement();
    }

    // Add movement effects
    const result: AnimatedPosition = {
      x: animatedPosition.x * TILE_SIZE,
      y: animatedPosition.y * TILE_SIZE,
      scale: this.getMovementScale(),
      rotation: this.getMovementRotation()
    };

    this.callbacks.onAnimationUpdate?.(result);
    return result;
  }

  private calculateDirection(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): 'up' | 'down' | 'left' | 'right' | 'idle' {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      return dy > 0 ? 'down' : 'up';
    }

    return 'idle';
  }

  private interpolatePosition(
    from: { x: number; y: number },
    to: { x: number; y: number },
    progress: number
  ): { x: number; y: number } {
    // Use easing function for smooth movement
    const easedProgress = this.easeInOutCubic(progress);

    return {
      x: from.x + (to.x - from.x) * easedProgress,
      y: from.y + (to.y - from.y) * easedProgress
    };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  private getMovementScale(): number {
    if (!this.animationState.isMoving) return 1;

    // Slight scale effect during movement for visual interest
    const progress = this.animationState.animationProgress;
    const scaleEffect = Math.sin(progress * Math.PI) * 0.05; // Max 5% scale change
    return 1 + scaleEffect;
  }

  private getMovementRotation(): number {
    if (!this.animationState.isMoving) return 0;

    // Slight rotation based on direction for visual feedback
    const baseRotation = {
      up: -2,
      down: 2,
      left: -1,
      right: 1,
      idle: 0
    }[this.animationState.direction];

    const progress = this.animationState.animationProgress;
    const rotationIntensity = Math.sin(progress * Math.PI) * 0.5;
    
    return baseRotation * rotationIntensity;
  }

  private getIdleAnimation(): AnimatedPosition {
    // Gentle breathing/floating animation when idle
    const time = Date.now() / 1000;
    const breathingEffect = Math.sin(time * 2) * 0.02; // Very subtle scale change
    const floatingEffect = Math.sin(time * 1.5) * 0.5; // 0.5px floating

    return {
      x: this.animationState.position.x * TILE_SIZE,
      y: this.animationState.position.y * TILE_SIZE + floatingEffect,
      scale: 1 + breathingEffect,
      rotation: 0
    };
  }

  private completeMovement(): void {
    this.animationState.position = { ...this.animationState.targetPosition };
    this.animationState.isMoving = false;
    this.animationState.direction = 'idle';
    this.animationState.animationProgress = 0;
    
    this.callbacks.onMovementComplete?.();
  }

  // Public methods for external control
  getPosition(): { x: number; y: number } {
    return { ...this.animationState.position };
  }

  getTargetPosition(): { x: number; y: number } {
    return { ...this.animationState.targetPosition };
  }

  isMoving(): boolean {
    return this.animationState.isMoving;
  }

  getDirection(): string {
    return this.animationState.direction;
  }

  forceComplete(): void {
    if (this.animationState.isMoving) {
      this.animationState.animationProgress = 1;
      this.completeMovement();
    }
  }

  teleport(position: { x: number; y: number }): void {
    this.animationState.position = { ...position };
    this.animationState.targetPosition = { ...position };
    this.animationState.isMoving = false;
    this.animationState.direction = 'idle';
    this.animationState.animationProgress = 0;
  }

  // Get animation data for rendering
  getAnimationFrame(): {
    position: AnimatedPosition;
    direction: string;
    isMoving: boolean;
    progress: number;
  } {
    return {
      position: this.update(16), // Assume 60fps
      direction: this.animationState.direction,
      isMoving: this.animationState.isMoving,
      progress: this.animationState.animationProgress
    };
  }
}

// Factory function
export function createPlayerAnimations(initialPosition: { x: number; y: number }): PlayerAnimations {
  return new PlayerAnimations(initialPosition);
}

// Utility functions for animation calculations
export function calculateMovementDuration(distance: number): number {
  // Base duration per tile, with slight scaling for longer distances
  const baseDuration = 300; // 300ms per tile
  const maxDuration = 800; // Cap maximum duration
  
  return Math.min(baseDuration * distance, maxDuration);
}

export function getDirectionFromMovement(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else if (dy !== 0) {
    return dy > 0 ? 'down' : 'up';
  }

  return 'idle';
}

export function interpolateValue(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function createBounceEasing(intensity = 1): (t: number) => number {
  return (t: number) => {
    if (t < 0.5) {
      return 4 * t * t * t * intensity;
    } else {
      return (t - 1) * (2 * t - 2) * (2 * t - 2) * intensity + 1;
    }
  };
}