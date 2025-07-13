// Collision Detection System
// Handles collision detection, tile obstacles, and movement validation

import { Position } from '../types/game';
import { Grid, TileType } from './Grid';

export interface CollisionConfig {
  enableTileCollision?: boolean;
  enableEntityCollision?: boolean;
  enableBoundaryCollision?: boolean;
  collisionMargin?: number;
}

export interface CollisionResult {
  hasCollision: boolean;
  position?: Position;
  collidedWith?: 'tile' | 'entity' | 'boundary';
  tileType?: TileType;
  entityId?: string;
  normal?: { x: number; y: number }; // Collision normal for physics
}

export interface CollidableEntity {
  id: string;
  position: Position;
  size: { width: number; height: number };
  type: 'player' | 'animal' | 'object' | 'obstacle';
  solid: boolean;
  active: boolean;
}

export interface CollisionLayer {
  name: string;
  priority: number;
  checkFunction: (position: Position, entity?: CollidableEntity) => CollisionResult;
}

export class CollisionSystem {
  private grid?: Grid;
  private config: Required<CollisionConfig>;
  private entities: Map<string, CollidableEntity> = new Map();
  private layers: Map<string, CollisionLayer> = new Map();
  private sortedLayers: CollisionLayer[] = [];
  
  // Collision cache for performance
  private collisionCache: Map<string, CollisionResult> = new Map();
  private cacheMaxSize = 1000;
  private cacheTimeout = 5000; // 5 seconds
  
  constructor(config: CollisionConfig = {}, grid?: Grid) {
    this.config = {
      enableTileCollision: config.enableTileCollision ?? true,
      enableEntityCollision: config.enableEntityCollision ?? true,
      enableBoundaryCollision: config.enableBoundaryCollision ?? true,
      collisionMargin: config.collisionMargin ?? 0.1,
    };
    
    this.grid = grid;
    this.setupDefaultLayers();
  }
  
  /**
   * Set grid reference for tile collision detection
   */
  public setGrid(grid: Grid): void {
    this.grid = grid;
    this.clearCache(); // Clear cache when grid changes
  }
  
  /**
   * Add collidable entity to the system
   */
  public addEntity(entity: CollidableEntity): void {
    this.entities.set(entity.id, entity);
    this.clearCache(); // Clear cache when entities change
  }
  
  /**
   * Remove entity from the system
   */
  public removeEntity(entityId: string): void {
    this.entities.delete(entityId);
    this.clearCache();
  }
  
  /**
   * Update entity position
   */
  public updateEntity(entityId: string, position: Position): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.position = position;
      this.clearCache();
    }
  }
  
  /**
   * Get entity by ID
   */
  public getEntity(entityId: string): CollidableEntity | undefined {
    return this.entities.get(entityId);
  }
  
  /**
   * Get all entities in area
   */
  public getEntitiesInArea(startX: number, startY: number, width: number, height: number): CollidableEntity[] {
    const entitiesInArea: CollidableEntity[] = [];
    
    this.entities.forEach(entity => {
      if (!entity.active) return;
      
      const entityEndX = entity.position.x + entity.size.width;
      const entityEndY = entity.position.y + entity.size.height;
      const areaEndX = startX + width;
      const areaEndY = startY + height;
      
      // Check for overlap
      if (entity.position.x < areaEndX && entityEndX > startX &&
          entity.position.y < areaEndY && entityEndY > startY) {
        entitiesInArea.push(entity);
      }
    });
    
    return entitiesInArea;
  }
  
  /**
   * Check if position is valid (no collisions)
   */
  public isValidPosition(position: Position, entityId?: string): boolean {
    const result = this.checkCollision(position, entityId);
    return !result.hasCollision;
  }
  
  /**
   * Check collision at specific position
   */
  public checkCollision(position: Position, entityId?: string): CollisionResult {
    const cacheKey = `${position.x},${position.y},${entityId || 'none'}`;
    
    // Check cache first
    const cached = this.collisionCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    let result: CollisionResult = { hasCollision: false };
    const entity = entityId ? this.entities.get(entityId) : undefined;
    
    // Check all collision layers in priority order
    for (const layer of this.sortedLayers) {
      const layerResult = layer.checkFunction(position, entity);
      if (layerResult.hasCollision) {
        result = layerResult;
        break; // First collision wins
      }
    }
    
    // Cache the result
    this.cacheResult(cacheKey, result);
    
    return result;
  }
  
  /**
   * Check collision in a direction from current position
   */
  public checkMovement(from: Position, to: Position, entityId?: string): CollisionResult {
    // Check destination first
    const destinationResult = this.checkCollision(to, entityId);
    if (destinationResult.hasCollision) {
      return destinationResult;
    }
    
    // For more advanced collision, we could check intermediate points
    // For now, just check the destination
    return { hasCollision: false, position: to };
  }
  
  /**
   * Find nearest valid position from given position
   */
  public findNearestValidPosition(position: Position, maxDistance: number = 5, entityId?: string): Position | null {
    // If current position is valid, return it
    if (this.isValidPosition(position, entityId)) {
      return position;
    }
    
    // Search in expanding squares
    for (let distance = 1; distance <= maxDistance; distance++) {
      // Check positions in square pattern
      for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
          // Only check the perimeter of the current square
          if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) {
            continue;
          }
          
          const testPosition = {
            x: position.x + dx,
            y: position.y + dy
          };
          
          if (this.isValidPosition(testPosition, entityId)) {
            return testPosition;
          }
        }
      }
    }
    
    return null; // No valid position found
  }
  
  /**
   * Get all entities at specific position
   */
  public getEntitiesAtPosition(position: Position): CollidableEntity[] {
    const entitiesAtPosition: CollidableEntity[] = [];
    
    this.entities.forEach(entity => {
      if (!entity.active) return;
      
      // Check if position is within entity bounds
      if (position.x >= entity.position.x && 
          position.x < entity.position.x + entity.size.width &&
          position.y >= entity.position.y && 
          position.y < entity.position.y + entity.size.height) {
        entitiesAtPosition.push(entity);
      }
    });
    
    return entitiesAtPosition;
  }
  
  /**
   * Add custom collision layer
   */
  public addCollisionLayer(name: string, priority: number, checkFunction: (position: Position, entity?: CollidableEntity) => CollisionResult): void {
    this.layers.set(name, {
      name,
      priority,
      checkFunction
    });
    
    this.sortLayers();
    this.clearCache();
  }
  
  /**
   * Remove collision layer
   */
  public removeCollisionLayer(name: string): void {
    this.layers.delete(name);
    this.sortLayers();
    this.clearCache();
  }
  
  /**
   * Enable or disable collision layer
   */
  public setLayerEnabled(name: string, enabled: boolean): void {
    if (!enabled) {
      this.removeCollisionLayer(name);
    } else {
      // Layer would need to be re-added with its original function
      // This is a limitation of the current design
      console.warn('CollisionSystem: Cannot re-enable layer without original function');
    }
  }
  
  /**
   * Clear collision cache
   */
  public clearCache(): void {
    this.collisionCache.clear();
  }
  
  /**
   * Get collision statistics
   */
  public getStats(): { entityCount: number; layerCount: number; cacheSize: number } {
    return {
      entityCount: this.entities.size,
      layerCount: this.layers.size,
      cacheSize: this.collisionCache.size,
    };
  }
  
  /**
   * Debug: Get collision info for position
   */
  public debugPosition(position: Position): any {
    const result = this.checkCollision(position);
    const tile = this.grid?.getTile(position.x, position.y);
    const entities = this.getEntitiesAtPosition(position);
    
    return {
      position,
      collision: result,
      tile,
      entities: entities.map(e => ({ id: e.id, type: e.type, solid: e.solid })),
      isValid: this.isValidPosition(position),
    };
  }
  
  /**
   * Setup default collision layers
   */
  private setupDefaultLayers(): void {
    // Boundary collision layer (highest priority)
    if (this.config.enableBoundaryCollision) {
      this.addCollisionLayer('boundary', 0, (position) => {
        if (!this.grid) return { hasCollision: false };
        
        const bounds = this.grid.getBounds();
        if (position.x < bounds.minX || position.x > bounds.maxX ||
            position.y < bounds.minY || position.y > bounds.maxY) {
          return {
            hasCollision: true,
            position,
            collidedWith: 'boundary',
            normal: this.calculateBoundaryNormal(position, bounds)
          };
        }
        
        return { hasCollision: false };
      });
    }
    
    // Tile collision layer
    if (this.config.enableTileCollision) {
      this.addCollisionLayer('tile', 10, (position) => {
        if (!this.grid) return { hasCollision: false };
        
        const tile = this.grid.getTile(position.x, position.y);
        if (tile && !tile.walkable) {
          return {
            hasCollision: true,
            position,
            collidedWith: 'tile',
            tileType: tile.type,
            normal: { x: 0, y: 0 } // Could be calculated based on tile geometry
          };
        }
        
        return { hasCollision: false };
      });
    }
    
    // Entity collision layer (lowest priority)
    if (this.config.enableEntityCollision) {
      this.addCollisionLayer('entity', 20, (position, currentEntity) => {
        const entitiesAtPosition = this.getEntitiesAtPosition(position);
        
        for (const entity of entitiesAtPosition) {
          // Don't collide with self
          if (currentEntity && entity.id === currentEntity.id) {
            continue;
          }
          
          // Only solid entities cause collisions
          if (entity.solid) {
            return {
              hasCollision: true,
              position,
              collidedWith: 'entity',
              entityId: entity.id,
              normal: this.calculateEntityNormal(position, entity)
            };
          }
        }
        
        return { hasCollision: false };
      });
    }
  }
  
  /**
   * Sort collision layers by priority
   */
  private sortLayers(): void {
    this.sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Cache collision result with timeout
   */
  private cacheResult(key: string, result: CollisionResult): void {
    // Implement simple cache size limit
    if (this.collisionCache.size >= this.cacheMaxSize) {
      // Remove oldest entries (simple approach)
      const keysToRemove = Array.from(this.collisionCache.keys()).slice(0, this.cacheMaxSize / 4);
      keysToRemove.forEach(k => this.collisionCache.delete(k));
    }
    
    this.collisionCache.set(key, result);
    
    // Set timeout to clear this cache entry
    setTimeout(() => {
      this.collisionCache.delete(key);
    }, this.cacheTimeout);
  }
  
  /**
   * Calculate collision normal for boundary collision
   */
  private calculateBoundaryNormal(position: Position, bounds: { minX: number; maxX: number; minY: number; maxY: number }): { x: number; y: number } {
    let normalX = 0;
    let normalY = 0;
    
    if (position.x < bounds.minX) normalX = 1;
    else if (position.x > bounds.maxX) normalX = -1;
    
    if (position.y < bounds.minY) normalY = 1;
    else if (position.y > bounds.maxY) normalY = -1;
    
    return { x: normalX, y: normalY };
  }
  
  /**
   * Calculate collision normal for entity collision
   */
  private calculateEntityNormal(position: Position, entity: CollidableEntity): { x: number; y: number } {
    const centerX = entity.position.x + entity.size.width / 2;
    const centerY = entity.position.y + entity.size.height / 2;
    
    const dx = position.x - centerX;
    const dy = position.y - centerY;
    
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      return { x: 0, y: -1 }; // Default upward normal
    }
    
    return {
      x: dx / length,
      y: dy / length
    };
  }
}

// Utility functions
export function createCollisionSystem(grid?: Grid, config: CollisionConfig = {}): CollisionSystem {
  return new CollisionSystem(config, grid);
}

export function createEntity(
  id: string, 
  position: Position, 
  size: { width: number; height: number }, 
  type: CollidableEntity['type'] = 'object',
  solid: boolean = true
): CollidableEntity {
  return {
    id,
    position,
    size,
    type,
    solid,
    active: true
  };
}

// Export CollisionSystem as default
export default CollisionSystem;