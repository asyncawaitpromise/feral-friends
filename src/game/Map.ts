// Map System
// Handles map data structures, terrain types, and map management

import { Position } from '../types/game';
import { TileType, Tile } from './Grid';

export type TerrainType = 'grass' | 'water' | 'stone' | 'forest' | 'path' | 'flower' | 'sand' | 'dirt' | 'rock' | 'bush';

export interface MapTile extends Tile {
  terrainType: TerrainType;
  elevation?: number;
  temperature?: number;
  moisture?: number;
  biome?: string;
  objects?: MapObject[];
  spawners?: AnimalSpawner[];
}

export interface MapObject {
  id: string;
  type: 'tree' | 'rock' | 'flower' | 'bush' | 'water_source' | 'landmark' | 'decoration';
  position: Position;
  size: { width: number; height: number };
  walkable: boolean;
  interactable: boolean;
  sprite?: string;
  metadata?: Record<string, any>;
}

export interface AnimalSpawner {
  id: string;
  animalTypes: string[];
  spawnRate: number; // spawns per minute
  maxAnimals: number;
  spawnRadius: number;
  conditions?: {
    timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk';
    weather?: 'sunny' | 'rainy' | 'cloudy';
    season?: 'spring' | 'summer' | 'fall' | 'winter';
  };
}

export interface MapTransition {
  id: string;
  fromPosition: Position;
  toMapId: string;
  toPosition: Position;
  transitionType: 'edge' | 'portal' | 'door' | 'stairs';
  requirements?: {
    level?: number;
    items?: string[];
    achievements?: string[];
  };
  description?: string;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MapMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  biome: string;
  difficulty: 'easy' | 'normal' | 'hard';
  recommendedLevel: number;
  size: { width: number; height: number };
  spawnPoint: Position;
  bounds: MapBounds;
  weather: {
    default: 'sunny' | 'rainy' | 'cloudy';
    variations: string[];
  };
  ambientSound?: string;
  backgroundMusic?: string;
  version: string;
  created: string;
  lastModified: string;
}

export interface MapData {
  metadata: MapMetadata;
  tiles: MapTile[][];
  objects: MapObject[];
  transitions: MapTransition[];
  spawners: AnimalSpawner[];
  regions?: MapRegion[];
}

export interface MapRegion {
  id: string;
  name: string;
  bounds: MapBounds;
  type: 'safe' | 'dangerous' | 'peaceful' | 'active' | 'special';
  description?: string;
  effects?: {
    playerSpeedModifier?: number;
    animalBehaviorModifier?: string;
    soundscape?: string;
  };
}

export class GameMap {
  private data: MapData;
  private loadedObjects: Map<string, MapObject> = new Map();
  private activeSpawners: Map<string, AnimalSpawner> = new Map();
  private currentWeather: string;
  private timeOfDay: 'day' | 'night' | 'dawn' | 'dusk' = 'day';
  
  // Terrain visual configuration
  private readonly terrainVisuals: Record<TerrainType, {
    color: string;
    pattern?: 'solid' | 'dots' | 'stripes' | 'cross';
    opacity?: number;
    walkable: boolean;
  }> = {
    grass: { color: '#22c55e', pattern: 'solid', opacity: 0.8, walkable: true },
    water: { color: '#3b82f6', pattern: 'solid', opacity: 0.7, walkable: false },
    stone: { color: '#6b7280', pattern: 'solid', opacity: 0.9, walkable: true },
    forest: { color: '#15803d', pattern: 'solid', opacity: 0.8, walkable: false },
    path: { color: '#a3a3a3', pattern: 'solid', opacity: 0.6, walkable: true },
    flower: { color: '#ec4899', pattern: 'dots', opacity: 0.7, walkable: true },
    sand: { color: '#fbbf24', pattern: 'dots', opacity: 0.6, walkable: true },
    dirt: { color: '#92400e', pattern: 'solid', opacity: 0.7, walkable: true },
    rock: { color: '#374151', pattern: 'solid', opacity: 0.9, walkable: false },
    bush: { color: '#16a34a', pattern: 'cross', opacity: 0.8, walkable: false },
  };
  
  constructor(mapData: MapData) {
    this.data = mapData;
    this.currentWeather = mapData.metadata.weather.default;
    this.initializeMap();
  }
  
  /**
   * Get map metadata
   */
  public getMetadata(): MapMetadata {
    return { ...this.data.metadata };
  }
  
  /**
   * Get tile at specific position
   */
  public getTile(x: number, y: number): MapTile | null {
    if (x < 0 || x >= this.data.metadata.size.width || 
        y < 0 || y >= this.data.metadata.size.height) {
      return null;
    }
    
    const tileData = this.data.tiles[y] ? this.data.tiles[y][x] : null;
    if (!tileData) return null;
    
    // Handle both string terrain types and full MapTile objects
    if (typeof tileData === 'string') {
      return {
        type: 'terrain',
        position: { x, y },
        walkable: this.terrainVisuals[tileData as TerrainType]?.walkable || false,
        terrainType: tileData as TerrainType
      } as unknown as MapTile;
    }
    
    return tileData as MapTile;
  }
  
  /**
   * Set tile at specific position
   */
  public setTile(x: number, y: number, tileData: Partial<MapTile>): boolean {
    const existingTile = this.getTile(x, y);
    if (!existingTile) {
      return false;
    }
    
    // Update tile properties
    Object.assign(existingTile, tileData);
    return true;
  }
  
  /**
   * Check if position is walkable
   */
  public isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    
    // Check base terrain walkability
    const terrainVisual = this.terrainVisuals[tile.terrainType];
    if (!terrainVisual || !terrainVisual.walkable) {
      return false;
    }
    
    // Check for blocking objects
    const objectsAtPosition = this.getObjectsAtPosition(x, y);
    return !objectsAtPosition.some(obj => !obj.walkable);
  }
  
  /**
   * Get objects at specific position
   */
  public getObjectsAtPosition(x: number, y: number): MapObject[] {
    return this.data.objects.filter(obj => {
      return x >= obj.position.x && 
             x < obj.position.x + obj.size.width &&
             y >= obj.position.y && 
             y < obj.position.y + obj.size.height;
    });
  }
  
  /**
   * Add object to map
   */
  public addObject(object: MapObject): void {
    this.data.objects.push(object);
    this.loadedObjects.set(object.id, object);
  }
  
  /**
   * Remove object from map
   */
  public removeObject(objectId: string): boolean {
    const index = this.data.objects.findIndex(obj => obj.id === objectId);
    if (index !== -1) {
      this.data.objects.splice(index, 1);
      this.loadedObjects.delete(objectId);
      return true;
    }
    return false;
  }
  
  /**
   * Get object by ID
   */
  public getObject(objectId: string): MapObject | undefined {
    return this.loadedObjects.get(objectId);
  }
  
  /**
   * Get all objects in area
   */
  public getObjectsInArea(startX: number, startY: number, width: number, height: number): MapObject[] {
    return this.data.objects.filter(obj => {
      const objEndX = obj.position.x + obj.size.width;
      const objEndY = obj.position.y + obj.size.height;
      const areaEndX = startX + width;
      const areaEndY = startY + height;
      
      return obj.position.x < areaEndX && objEndX > startX &&
             obj.position.y < areaEndY && objEndY > startY;
    });
  }
  
  /**
   * Get transitions from current position
   */
  public getTransitionsAtPosition(x: number, y: number): MapTransition[] {
    return this.data.transitions.filter(transition => 
      transition.fromPosition.x === x && transition.fromPosition.y === y
    );
  }
  
  /**
   * Get all available transitions
   */
  public getTransitions(): MapTransition[] {
    return [...this.data.transitions];
  }
  
  /**
   * Add transition to map
   */
  public addTransition(transition: MapTransition): void {
    this.data.transitions.push(transition);
  }
  
  /**
   * Get spawners in area
   */
  public getSpawnersInArea(centerX: number, centerY: number, radius: number): AnimalSpawner[] {
    return this.data.spawners.filter(spawner => {
      const distance = Math.sqrt(
        Math.pow(spawner.id.length - centerX, 2) + // Simplified distance calc
        Math.pow(spawner.spawnRate - centerY, 2)
      );
      return distance <= radius;
    });
  }
  
  /**
   * Get region at position
   */
  public getRegionAtPosition(x: number, y: number): MapRegion | null {
    if (!this.data.regions) return null;
    
    return this.data.regions.find(region => 
      x >= region.bounds.minX && x <= region.bounds.maxX &&
      y >= region.bounds.minY && y <= region.bounds.maxY
    ) || null;
  }
  
  /**
   * Get terrain type at specific position
   */
  public getTerrainAt(x: number, y: number): TerrainType | null {
    const tile = this.getTile(x, y);
    return tile ? tile.terrainType : null;
  }

  /**
   * Get terrain visual info
   */
  public getTerrainVisual(terrainType: TerrainType): any {
    return { ...this.terrainVisuals[terrainType] };
  }
  
  /**
   * Set current weather
   */
  public setWeather(weather: string): void {
    if (this.data.metadata.weather.variations.includes(weather)) {
      this.currentWeather = weather;
    }
  }
  
  /**
   * Get current weather
   */
  public getWeather(): string {
    return this.currentWeather;
  }
  
  /**
   * Set time of day
   */
  public setTimeOfDay(time: 'day' | 'night' | 'dawn' | 'dusk'): void {
    this.timeOfDay = time;
  }
  
  /**
   * Get time of day
   */
  public getTimeOfDay(): 'day' | 'night' | 'dawn' | 'dusk' {
    return this.timeOfDay;
  }
  
  /**
   * Get map dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return { ...this.data.metadata.size };
  }
  
  /**
   * Get map bounds
   */
  public getBounds(): MapBounds {
    return { ...this.data.metadata.bounds };
  }
  
  /**
   * Get spawn point
   */
  public getSpawnPoint(): Position {
    return { ...this.data.metadata.spawnPoint };
  }
  
  /**
   * Check if position is within map bounds
   */
  public isValidPosition(x: number, y: number): boolean {
    const bounds = this.data.metadata.bounds;
    return x >= bounds.minX && x <= bounds.maxX &&
           y >= bounds.minY && y <= bounds.maxY;
  }
  
  /**
   * Generate random walkable position
   */
  public getRandomWalkablePosition(): Position | null {
    const { width, height } = this.data.metadata.size;
    const maxAttempts = 100;
    
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      if (this.isWalkable(x, y)) {
        return { x, y };
      }
    }
    
    return null; // No walkable position found
  }
  
  /**
   * Export map data
   */
  public exportMapData(): MapData {
    return JSON.parse(JSON.stringify(this.data));
  }
  
  /**
   * Get statistics about the map
   */
  public getMapStats(): {
    totalTiles: number;
    walkableTiles: number;
    objectCount: number;
    transitionCount: number;
    spawnerCount: number;
    terrainDistribution: Record<TerrainType, number>;
  } {
    let totalTiles = 0;
    let walkableTiles = 0;
    const terrainDistribution: Record<TerrainType, number> = {} as any;
    
    // Initialize terrain distribution
    Object.keys(this.terrainVisuals).forEach(terrain => {
      terrainDistribution[terrain as TerrainType] = 0;
    });
    
    // Count tiles
    for (let y = 0; y < this.data.metadata.size.height; y++) {
      for (let x = 0; x < this.data.metadata.size.width; x++) {
        const tile = this.getTile(x, y);
        if (tile) {
          totalTiles++;
          terrainDistribution[tile.terrainType]++;
          
          if (this.isWalkable(x, y)) {
            walkableTiles++;
          }
        }
      }
    }
    
    return {
      totalTiles,
      walkableTiles,
      objectCount: this.data.objects.length,
      transitionCount: this.data.transitions.length,
      spawnerCount: this.data.spawners.length,
      terrainDistribution,
    };
  }
  
  /**
   * Initialize map systems
   */
  private initializeMap(): void {
    // Load all objects into quick-access map
    this.data.objects.forEach(obj => {
      this.loadedObjects.set(obj.id, obj);
    });
    
    // Initialize active spawners
    this.data.spawners.forEach(spawner => {
      this.activeSpawners.set(spawner.id, spawner);
    });
    
    console.log(`Map "${this.data.metadata.name}" loaded with ${this.data.objects.length} objects and ${this.data.spawners.length} spawners`);
  }
}

// Utility functions
export function createMapMetadata(
  id: string,
  name: string,
  width: number,
  height: number,
  spawnPoint: Position = { x: Math.floor(width / 2), y: Math.floor(height / 2) }
): MapMetadata {
  return {
    id,
    name,
    displayName: name,
    description: `A ${width}x${height} map in the world of Feral Friends`,
    biome: 'temperate',
    difficulty: 'normal',
    recommendedLevel: 1,
    size: { width, height },
    spawnPoint,
    bounds: { minX: 0, maxX: width - 1, minY: 0, maxY: height - 1 },
    weather: { default: 'sunny', variations: ['sunny', 'cloudy', 'rainy'] },
    version: '1.0.0',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
}

export function createMapObject(
  id: string,
  type: MapObject['type'],
  position: Position,
  size: { width: number; height: number } = { width: 1, height: 1 },
  walkable: boolean = true,
  interactable: boolean = false
): MapObject {
  return {
    id,
    type,
    position,
    size,
    walkable,
    interactable,
  };
}

export function createTransition(
  id: string,
  fromPosition: Position,
  toMapId: string,
  toPosition: Position,
  transitionType: MapTransition['transitionType'] = 'edge'
): MapTransition {
  return {
    id,
    fromPosition,
    toMapId,
    toPosition,
    transitionType,
  };
}

// Export GameMap as default
export default GameMap;