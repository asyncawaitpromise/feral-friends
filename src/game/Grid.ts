// Grid System
// Handles grid-based world representation, tile management, and coordinate conversion

import { Position } from '../types/game';

export type TileType = 'grass' | 'water' | 'stone' | 'forest' | 'path' | 'flower' | 'empty';

export interface Tile {
  type: TileType;
  walkable: boolean;
  position: Position;
  variant?: number; // For visual variety
  metadata?: Record<string, any>; // For future extensibility
}

export interface GridConfig {
  width: number;
  height: number;
  tileSize: number;
  defaultTileType?: TileType;
  enableWrapping?: boolean;
}

export interface GridBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface TileVisualInfo {
  color: string;
  borderColor?: string;
  pattern?: 'solid' | 'dots' | 'stripes' | 'cross';
  opacity?: number;
}

export class Grid {
  private config: Required<GridConfig>;
  private tiles: Map<string, Tile> = new Map();
  private bounds: GridBounds;
  
  // Visual configuration for different tile types
  private readonly tileVisuals: Record<TileType, TileVisualInfo> = {
    grass: { color: '#22c55e', pattern: 'solid', opacity: 0.8 }, // green-500
    water: { color: '#3b82f6', pattern: 'solid', opacity: 0.7 }, // blue-500
    stone: { color: '#6b7280', pattern: 'solid', opacity: 0.9 }, // gray-500
    forest: { color: '#15803d', pattern: 'solid', opacity: 0.8 }, // green-700
    path: { color: '#a3a3a3', pattern: 'solid', opacity: 0.6 }, // neutral-400
    flower: { color: '#ec4899', pattern: 'dots', opacity: 0.7 }, // pink-500
    empty: { color: '#f3f4f6', pattern: 'solid', opacity: 0.3 }, // gray-100
  };
  
  // Walkability settings for each tile type
  private readonly tileWalkability: Record<TileType, boolean> = {
    grass: true,
    water: false,
    stone: true,
    forest: false,
    path: true,
    flower: true,
    empty: true,
  };
  
  constructor(config: GridConfig) {
    this.config = {
      width: config.width,
      height: config.height,
      tileSize: config.tileSize,
      defaultTileType: config.defaultTileType ?? 'grass',
      enableWrapping: config.enableWrapping ?? false,
    };
    
    this.bounds = {
      minX: 0,
      maxX: this.config.width - 1,
      minY: 0,
      maxY: this.config.height - 1,
    };
    
    this.initializeGrid();
  }
  
  /**
   * Get tile at specific grid position
   */
  public getTile(x: number, y: number): Tile | null {
    const key = this.positionToKey(x, y);
    return this.tiles.get(key) || null;
  }
  
  /**
   * Set tile at specific grid position
   */
  public setTile(x: number, y: number, type: TileType, variant?: number, metadata?: Record<string, any>): boolean {
    if (!this.isValidPosition(x, y)) {
      return false;
    }
    
    const tile: Tile = {
      type,
      walkable: this.tileWalkability[type],
      position: { x, y },
      variant,
      metadata,
    };
    
    const key = this.positionToKey(x, y);
    this.tiles.set(key, tile);
    return true;
  }
  
  /**
   * Check if position is walkable
   */
  public isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.walkable : false;
  }
  
  /**
   * Check if position is within grid bounds
   */
  public isValidPosition(x: number, y: number): boolean {
    if (this.config.enableWrapping) {
      return true; // All positions are valid with wrapping
    }
    
    return x >= this.bounds.minX && x <= this.bounds.maxX &&
           y >= this.bounds.minY && y <= this.bounds.maxY;
  }
  
  /**
   * Convert screen coordinates to grid coordinates
   */
  public screenToGrid(screenX: number, screenY: number): Position {
    return {
      x: Math.floor(screenX / this.config.tileSize),
      y: Math.floor(screenY / this.config.tileSize),
    };
  }
  
  /**
   * Convert grid coordinates to screen coordinates (top-left of tile)
   */
  public gridToScreen(gridX: number, gridY: number): Position {
    return {
      x: gridX * this.config.tileSize,
      y: gridY * this.config.tileSize,
    };
  }
  
  /**
   * Convert grid coordinates to screen center coordinates
   */
  public gridToScreenCenter(gridX: number, gridY: number): Position {
    const halfTile = this.config.tileSize / 2;
    return {
      x: gridX * this.config.tileSize + halfTile,
      y: gridY * this.config.tileSize + halfTile,
    };
  }
  
  /**
   * Get tiles in a rectangular area
   */
  public getTilesInArea(startX: number, startY: number, width: number, height: number): Tile[] {
    const tiles: Tile[] = [];
    
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        const tile = this.getTile(x, y);
        if (tile) {
          tiles.push(tile);
        }
      }
    }
    
    return tiles;
  }
  
  /**
   * Get tiles in a radius around a center point
   */
  public getTilesInRadius(centerX: number, centerY: number, radius: number): Tile[] {
    const tiles: Tile[] = [];
    
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distance <= radius) {
          const tile = this.getTile(x, y);
          if (tile) {
            tiles.push(tile);
          }
        }
      }
    }
    
    return tiles;
  }
  
  /**
   * Get neighboring tiles (4-directional)
   */
  public getNeighbors(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];
    
    for (const dir of directions) {
      const tile = this.getTile(x + dir.x, y + dir.y);
      if (tile) {
        neighbors.push(tile);
      }
    }
    
    return neighbors;
  }
  
  /**
   * Get all neighboring tiles (8-directional)
   */
  public getAllNeighbors(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip center tile
        
        const tile = this.getTile(x + dx, y + dy);
        if (tile) {
          neighbors.push(tile);
        }
      }
    }
    
    return neighbors;
  }
  
  /**
   * Find all tiles of a specific type
   */
  public findTilesByType(type: TileType): Tile[] {
    const matchingTiles: Tile[] = [];
    
    this.tiles.forEach(tile => {
      if (tile.type === type) {
        matchingTiles.push(tile);
      }
    });
    
    return matchingTiles;
  }
  
  /**
   * Get visual information for a tile type
   */
  public getTileVisual(type: TileType): TileVisualInfo {
    return { ...this.tileVisuals[type] };
  }
  
  /**
   * Set custom visual for a tile type
   */
  public setTileVisual(type: TileType, visual: Partial<TileVisualInfo>): void {
    this.tileVisuals[type] = { ...this.tileVisuals[type], ...visual };
  }
  
  /**
   * Set walkability for a tile type
   */
  public setTileWalkability(type: TileType, walkable: boolean): void {
    this.tileWalkability[type] = walkable;
    
    // Update existing tiles of this type
    this.tiles.forEach(tile => {
      if (tile.type === type) {
        tile.walkable = walkable;
      }
    });
  }
  
  /**
   * Get grid configuration
   */
  public getConfig(): Required<GridConfig> {
    return { ...this.config };
  }
  
  /**
   * Get grid bounds
   */
  public getBounds(): GridBounds {
    return { ...this.bounds };
  }
  
  /**
   * Get grid dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height,
    };
  }
  
  /**
   * Get tile size
   */
  public getTileSize(): number {
    return this.config.tileSize;
  }
  
  /**
   * Clear all tiles and reset to default
   */
  public clear(): void {
    this.tiles.clear();
    this.initializeGrid();
  }
  
  /**
   * Generate a simple pattern for testing
   */
  public generateTestPattern(): void {
    // Create a simple test pattern with different tile types
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        let tileType: TileType = 'grass';
        
        // Create a path through the middle
        if (x === Math.floor(this.config.width / 2) || y === Math.floor(this.config.height / 2)) {
          tileType = 'path';
        }
        // Add some water features
        else if ((x + y) % 7 === 0) {
          tileType = 'water';
        }
        // Add some forest areas
        else if ((x * y) % 13 === 0) {
          tileType = 'forest';
        }
        // Add some stone tiles
        else if ((x + y) % 11 === 0) {
          tileType = 'stone';
        }
        // Add some flowers
        else if ((x + y) % 17 === 0) {
          tileType = 'flower';
        }
        
        this.setTile(x, y, tileType, Math.floor(Math.random() * 3));
      }
    }
  }
  
  /**
   * Render grid to canvas context
   */
  public render(ctx: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }, showGrid: boolean = true): void {
    const { tileSize } = this.config;
    
    // Calculate visible area
    const startX = Math.floor(-camera.x / tileSize) - 1;
    const endX = startX + Math.ceil(ctx.canvas.width / (tileSize * camera.zoom)) + 2;
    const startY = Math.floor(-camera.y / tileSize) - 1;
    const endY = startY + Math.ceil(ctx.canvas.height / (tileSize * camera.zoom)) + 2;
    
    // Render tiles
    for (let y = Math.max(startY, this.bounds.minY); y <= Math.min(endY, this.bounds.maxY); y++) {
      for (let x = Math.max(startX, this.bounds.minX); x <= Math.min(endX, this.bounds.maxX); x++) {
        const tile = this.getTile(x, y);
        if (tile) {
          this.renderTile(ctx, tile);
        }
      }
    }
    
    // Render grid lines if enabled
    if (showGrid) {
      this.renderGridLines(ctx, startX, endX, startY, endY);
    }
  }
  
  /**
   * Initialize grid with default tiles
   */
  private initializeGrid(): void {
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        this.setTile(x, y, this.config.defaultTileType);
      }
    }
  }
  
  /**
   * Convert position to string key for Map
   */
  private positionToKey(x: number, y: number): string {
    if (this.config.enableWrapping) {
      x = ((x % this.config.width) + this.config.width) % this.config.width;
      y = ((y % this.config.height) + this.config.height) % this.config.height;
    }
    return `${x},${y}`;
  }
  
  /**
   * Render a single tile
   */
  private renderTile(ctx: CanvasRenderingContext2D, tile: Tile): void {
    const { x, y } = tile.position;
    const screenPos = this.gridToScreen(x, y);
    const visual = this.tileVisuals[tile.type];
    
    ctx.save();
    ctx.globalAlpha = visual.opacity || 1;
    
    // Fill tile background
    ctx.fillStyle = visual.color;
    ctx.fillRect(screenPos.x, screenPos.y, this.config.tileSize, this.config.tileSize);
    
    // Add pattern if specified
    if (visual.pattern && visual.pattern !== 'solid') {
      this.renderTilePattern(ctx, screenPos, visual.pattern, visual.color);
    }
    
    // Add variant visual difference
    if (tile.variant) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        screenPos.x + tile.variant * 2,
        screenPos.y + tile.variant * 2,
        this.config.tileSize - tile.variant * 4,
        this.config.tileSize - tile.variant * 4
      );
    }
    
    ctx.restore();
  }
  
  /**
   * Render tile pattern
   */
  private renderTilePattern(ctx: CanvasRenderingContext2D, screenPos: Position, pattern: string, color: string): void {
    const { tileSize } = this.config;
    
    ctx.fillStyle = color;
    
    switch (pattern) {
      case 'dots':
        const dotSize = 2;
        const spacing = 8;
        for (let y = dotSize; y < tileSize; y += spacing) {
          for (let x = dotSize; x < tileSize; x += spacing) {
            ctx.beginPath();
            ctx.arc(screenPos.x + x, screenPos.y + y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      
      case 'stripes':
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        for (let i = 0; i < tileSize; i += 8) {
          ctx.beginPath();
          ctx.moveTo(screenPos.x + i, screenPos.y);
          ctx.lineTo(screenPos.x + i, screenPos.y + tileSize);
          ctx.stroke();
        }
        break;
      
      case 'cross':
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        const center = tileSize / 2;
        ctx.beginPath();
        ctx.moveTo(screenPos.x + center, screenPos.y + 4);
        ctx.lineTo(screenPos.x + center, screenPos.y + tileSize - 4);
        ctx.moveTo(screenPos.x + 4, screenPos.y + center);
        ctx.lineTo(screenPos.x + tileSize - 4, screenPos.y + center);
        ctx.stroke();
        break;
    }
  }
  
  /**
   * Render grid lines
   */
  private renderGridLines(ctx: CanvasRenderingContext2D, startX: number, endX: number, startY: number, endY: number): void {
    const { tileSize } = this.config;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, startY * tileSize);
      ctx.lineTo(x * tileSize, (endY + 1) * tileSize);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      ctx.beginPath();
      ctx.moveTo(startX * tileSize, y * tileSize);
      ctx.lineTo((endX + 1) * tileSize, y * tileSize);
      ctx.stroke();
    }
  }
}

// Utility function to create grid with common configuration
export function createGrid(width: number, height: number, tileSize: number = 32): Grid {
  return new Grid({ width, height, tileSize });
}

// Export Grid as default
export default Grid;