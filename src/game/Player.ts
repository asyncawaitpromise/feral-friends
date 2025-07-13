// Player Entity System
// Handles player position, sprite representation, movement, and bounds checking

import { Position } from '../types/game';
import { Grid } from './Grid';

export interface PlayerConfig {
  initialPosition?: Position;
  moveSpeed?: number;
  size?: number;
  color?: string;
  maxX?: number;
  maxY?: number;
  minX?: number;
  minY?: number;
  grid?: Grid;
  snapToGrid?: boolean;
}

export interface PlayerSprite {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  scale: number;
}

export interface PlayerMovement {
  isMoving: boolean;
  direction: 'up' | 'down' | 'left' | 'right' | null;
  speed: number;
  targetPosition?: Position;
  interpolationProgress: number;
}

export interface PlayerState {
  position: Position;
  previousPosition: Position;
  sprite: PlayerSprite;
  movement: PlayerMovement;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export class Player {
  private state: PlayerState;
  private readonly config: Required<Omit<PlayerConfig, 'grid' | 'snapToGrid'>> & { 
    grid?: Grid; 
    snapToGrid: boolean; 
  };
  
  // Animation properties
  private animationTime: number = 0;
  private idleAnimationOffset: number = 0;
  private walkCycleOffset: number = 0;
  
  // Grid integration
  private grid?: Grid;
  
  constructor(config: PlayerConfig = {}) {
    this.config = {
      initialPosition: config.initialPosition ?? { x: 10, y: 10 },
      moveSpeed: config.moveSpeed ?? 4, // tiles per second
      size: config.size ?? 16,
      color: config.color ?? '#10b981', // emerald-500
      maxX: config.maxX ?? 50,
      maxY: config.maxY ?? 50,
      minX: config.minX ?? 0,
      minY: config.minY ?? 0,
      grid: config.grid,
      snapToGrid: config.snapToGrid ?? true,
    };
    
    this.grid = config.grid;
    
    this.state = {
      position: { ...this.config.initialPosition },
      previousPosition: { ...this.config.initialPosition },
      sprite: {
        x: this.config.initialPosition.x,
        y: this.config.initialPosition.y,
        size: this.config.size,
        color: this.config.color,
        rotation: 0,
        scale: 1,
      },
      movement: {
        isMoving: false,
        direction: null,
        speed: this.config.moveSpeed,
        interpolationProgress: 0,
      },
      bounds: {
        minX: this.config.minX,
        maxX: this.config.maxX,
        minY: this.config.minY,
        maxY: this.config.maxY,
      }
    };
  }
  
  /**
   * Update player logic (called every fixed timestep)
   */
  public update(deltaTime: number): void {
    this.animationTime += deltaTime;
    
    // Update movement interpolation
    if (this.state.movement.isMoving && this.state.movement.targetPosition) {
      this.updateMovementInterpolation(deltaTime);
    } else {
      // Update idle animation
      this.updateIdleAnimation();
    }
    
    // Update sprite position based on current position
    this.updateSpritePosition();
  }
  
  /**
   * Render player (called every frame with interpolation)
   */
  public render(ctx: CanvasRenderingContext2D, interpolation: number, tileSize: number): void {
    // Calculate interpolated position for smooth movement
    const renderX = this.state.sprite.x * tileSize + (tileSize / 2);
    const renderY = this.state.sprite.y * tileSize + (tileSize / 2);
    
    // Apply animation offsets
    const bounce = this.idleAnimationOffset;
    const walkOffset = this.walkCycleOffset;
    
    // Save context for transformations
    ctx.save();
    
    // Move to player position
    ctx.translate(renderX, renderY);
    ctx.scale(this.state.sprite.scale, this.state.sprite.scale);
    ctx.rotate(this.state.sprite.rotation);
    
    // Draw shadow
    this.drawShadow(ctx, tileSize);
    
    // Draw player body
    this.drawBody(ctx, bounce + walkOffset);
    
    // Draw player eyes
    this.drawEyes(ctx, bounce + walkOffset);
    
    // Restore context
    ctx.restore();
  }
  
  /**
   * Move player to a specific position (with bounds checking)
   */
  public moveTo(position: Position, smooth: boolean = true): boolean {
    let targetPosition = position;
    
    // Grid-aware movement
    if (this.grid && this.config.snapToGrid) {
      // Check if target position is walkable
      if (!this.grid.isWalkable(position.x, position.y)) {
        console.debug('Player: Cannot move to non-walkable tile:', position);
        return false;
      }
      
      // Ensure position is valid in grid
      if (!this.grid.isValidPosition(position.x, position.y)) {
        console.debug('Player: Cannot move to invalid grid position:', position);
        return false;
      }
    }
    
    const clampedPosition = this.clampToBounds(targetPosition);
    
    // Check if position actually changed
    if (clampedPosition.x === this.state.position.x && clampedPosition.y === this.state.position.y) {
      return false;
    }
    
    this.state.previousPosition = { ...this.state.position };
    
    if (smooth) {
      // Start smooth movement
      this.state.movement.targetPosition = clampedPosition;
      this.state.movement.isMoving = true;
      this.state.movement.interpolationProgress = 0;
      this.updateMovementDirection(this.state.position, clampedPosition);
    } else {
      // Instant movement
      this.state.position = clampedPosition;
      this.state.movement.isMoving = false;
      this.state.movement.targetPosition = undefined;
      this.state.movement.direction = null;
    }
    
    return true;
  }
  
  /**
   * Move player in a direction by one tile
   */
  public moveInDirection(direction: 'up' | 'down' | 'left' | 'right', smooth: boolean = true): boolean {
    const currentPos = this.state.position;
    let newPosition: Position;
    
    switch (direction) {
      case 'up':
        newPosition = { x: currentPos.x, y: currentPos.y - 1 };
        break;
      case 'down':
        newPosition = { x: currentPos.x, y: currentPos.y + 1 };
        break;
      case 'left':
        newPosition = { x: currentPos.x - 1, y: currentPos.y };
        break;
      case 'right':
        newPosition = { x: currentPos.x + 1, y: currentPos.y };
        break;
    }
    
    return this.moveTo(newPosition, smooth);
  }
  
  /**
   * Get current player position
   */
  public getPosition(): Position {
    return { ...this.state.position };
  }
  
  /**
   * Get previous player position
   */
  public getPreviousPosition(): Position {
    return { ...this.state.previousPosition };
  }
  
  /**
   * Check if player is currently moving
   */
  public isMoving(): boolean {
    return this.state.movement.isMoving;
  }
  
  /**
   * Get current movement direction
   */
  public getMovementDirection(): 'up' | 'down' | 'left' | 'right' | null {
    return this.state.movement.direction;
  }
  
  /**
   * Set player bounds for movement
   */
  public setBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.state.bounds = { minX, maxX, minY, maxY };
  }
  
  /**
   * Get player sprite information for rendering
   */
  public getSprite(): PlayerSprite {
    return { ...this.state.sprite };
  }
  
  /**
   * Set player color
   */
  public setColor(color: string): void {
    this.state.sprite.color = color;
  }
  
  /**
   * Set player scale for effects
   */
  public setScale(scale: number): void {
    this.state.sprite.scale = scale;
  }
  
  /**
   * Set grid reference for collision detection
   */
  public setGrid(grid: Grid): void {
    this.grid = grid;
    this.config.grid = grid;
  }
  
  /**
   * Get current tile the player is standing on
   */
  public getCurrentTile(): any {
    if (!this.grid) return null;
    return this.grid.getTile(this.state.position.x, this.state.position.y);
  }
  
  /**
   * Check if player can move to a specific position
   */
  public canMoveTo(position: Position): boolean {
    if (!this.grid) {
      // Without grid, just check bounds
      const clampedPos = this.clampToBounds(position);
      return clampedPos.x === position.x && clampedPos.y === position.y;
    }
    
    return this.grid.isValidPosition(position.x, position.y) && 
           this.grid.isWalkable(position.x, position.y);
  }
  
  /**
   * Get tiles around the player
   */
  public getSurroundingTiles(): any[] {
    if (!this.grid) return [];
    return this.grid.getNeighbors(this.state.position.x, this.state.position.y);
  }
  
  /**
   * Find path to target position using simple pathfinding
   */
  public findPathTo(target: Position): Position[] {
    if (!this.grid || !this.canMoveTo(target)) {
      return [];
    }
    
    // Simple A* pathfinding implementation
    const path: Position[] = [];
    const current = { ...this.state.position };
    
    // For now, use simple direct path (can be enhanced later)
    while (current.x !== target.x || current.y !== target.y) {
      if (current.x < target.x && this.grid.isWalkable(current.x + 1, current.y)) {
        current.x++;
      } else if (current.x > target.x && this.grid.isWalkable(current.x - 1, current.y)) {
        current.x--;
      } else if (current.y < target.y && this.grid.isWalkable(current.x, current.y + 1)) {
        current.y++;
      } else if (current.y > target.y && this.grid.isWalkable(current.x, current.y - 1)) {
        current.y--;
      } else {
        // Can't find direct path
        break;
      }
      
      path.push({ ...current });
      
      // Prevent infinite loops
      if (path.length > 100) {
        console.warn('Player: Pathfinding exceeded maximum steps');
        break;
      }
    }
    
    return path;
  }
  
  /**
   * Enable or disable grid snapping
   */
  public setGridSnapping(enabled: boolean): void {
    this.config.snapToGrid = enabled;
  }
  
  /**
   * Update movement interpolation
   */
  private updateMovementInterpolation(deltaTime: number): void {
    if (!this.state.movement.targetPosition) return;
    
    const moveSpeed = this.state.movement.speed;
    const progressDelta = (deltaTime / 1000) * moveSpeed; // Convert to tiles per second
    
    this.state.movement.interpolationProgress += progressDelta;
    
    if (this.state.movement.interpolationProgress >= 1) {
      // Movement complete
      this.state.position = { ...this.state.movement.targetPosition };
      this.state.movement.isMoving = false;
      this.state.movement.targetPosition = undefined;
      this.state.movement.direction = null;
      this.state.movement.interpolationProgress = 0;
      this.walkCycleOffset = 0;
    } else {
      // Update walk animation
      this.walkCycleOffset = Math.sin(this.animationTime * 0.015) * 2;
    }
  }
  
  /**
   * Update idle animation
   */
  private updateIdleAnimation(): void {
    this.idleAnimationOffset = Math.sin(this.animationTime * 0.003) * 3;
    this.walkCycleOffset = 0;
  }
  
  /**
   * Update sprite position based on current position and interpolation
   */
  private updateSpritePosition(): void {
    if (this.state.movement.isMoving && this.state.movement.targetPosition) {
      // Interpolate between current and target position
      const progress = this.state.movement.interpolationProgress;
      const start = this.state.previousPosition;
      const end = this.state.movement.targetPosition;
      
      this.state.sprite.x = start.x + (end.x - start.x) * progress;
      this.state.sprite.y = start.y + (end.y - start.y) * progress;
    } else {
      // Use exact position
      this.state.sprite.x = this.state.position.x;
      this.state.sprite.y = this.state.position.y;
    }
  }
  
  /**
   * Update movement direction based on target
   */
  private updateMovementDirection(from: Position, to: Position): void {
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.state.movement.direction = deltaX > 0 ? 'right' : 'left';
    } else {
      this.state.movement.direction = deltaY > 0 ? 'down' : 'up';
    }
  }
  
  /**
   * Clamp position to bounds
   */
  private clampToBounds(position: Position): Position {
    return {
      x: Math.max(this.state.bounds.minX, Math.min(this.state.bounds.maxX, position.x)),
      y: Math.max(this.state.bounds.minY, Math.min(this.state.bounds.maxY, position.y))
    };
  }
  
  /**
   * Draw player shadow
   */
  private drawShadow(ctx: CanvasRenderingContext2D, tileSize: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Draw player body
   */
  private drawBody(ctx: CanvasRenderingContext2D, animationOffset: number): void {
    ctx.fillStyle = this.state.sprite.color;
    ctx.beginPath();
    ctx.arc(0, animationOffset, this.state.sprite.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * Draw player eyes
   */
  private drawEyes(ctx: CanvasRenderingContext2D, animationOffset: number): void {
    // White eye background
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-5, -5 + animationOffset, 3, 0, Math.PI * 2);
    ctx.arc(5, -5 + animationOffset, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Black pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-5, -5 + animationOffset, 1.5, 0, Math.PI * 2);
    ctx.arc(5, -5 + animationOffset, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Utility function to create a player with common configuration
export function createPlayer(config: PlayerConfig = {}): Player {
  return new Player(config);
}

// Export Player class as default
export default Player;