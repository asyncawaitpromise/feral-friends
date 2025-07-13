// Map Manager System
// Handles map loading, transitions, state management, and caching

import { Position } from '../types/game';
import { GameMap, MapData, MapTransition, createMapMetadata } from './Map';
import { MapRenderer, createMapRenderer } from './MapRenderer';

export interface MapManagerConfig {
  cacheSize?: number;
  preloadRadius?: number;
  transitionDuration?: number;
  enableAutoSave?: boolean;
  compressionEnabled?: boolean;
}

export interface LoadedMap {
  map: GameMap;
  renderer: MapRenderer;
  lastAccessed: number;
  preloaded: boolean;
}

export interface MapTransitionContext {
  fromMapId: string;
  toMapId: string;
  fromPosition: Position;
  toPosition: Position;
  transitionType: MapTransition['transitionType'];
  playerData?: any;
  requirements?: MapTransition['requirements'];
}

export interface TransitionEffect {
  type: 'fade' | 'slide' | 'instant' | 'portal' | 'door';
  duration: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  color?: string;
  progress: number;
  active: boolean;
}

export interface MapLoadingState {
  isLoading: boolean;
  loadingMapId: string | null;
  progress: number;
  stage: 'downloading' | 'parsing' | 'initializing' | 'rendering' | 'complete';
  error: string | null;
}

export class MapManager {
  private config: Required<MapManagerConfig>;
  private loadedMaps: Map<string, LoadedMap> = new Map();
  private currentMapId: string | null = null;
  private mapDataCache: Map<string, MapData> = new Map();
  
  // Transition system
  private transitionQueue: MapTransitionContext[] = [];
  private currentTransition: MapTransitionContext | null = null;
  private transitionEffect: TransitionEffect | null = null;
  
  // Loading system
  private loadingState: MapLoadingState = {
    isLoading: false,
    loadingMapId: null,
    progress: 0,
    stage: 'complete',
    error: null,
  };
  
  // Callbacks
  private onMapLoaded?: (mapId: string, map: GameMap) => void;
  private onMapUnloaded?: (mapId: string) => void;
  private onTransitionStart?: (context: MapTransitionContext) => void;
  private onTransitionComplete?: (context: MapTransitionContext) => void;
  private onLoadingProgress?: (state: MapLoadingState) => void;
  
  // Map data sources
  private mapDataSources: Map<string, () => Promise<MapData>> = new Map();
  
  constructor(config: MapManagerConfig = {}) {
    this.config = {
      cacheSize: config.cacheSize ?? 10,
      preloadRadius: config.preloadRadius ?? 1,
      transitionDuration: config.transitionDuration ?? 1000,
      enableAutoSave: config.enableAutoSave ?? true,
      compressionEnabled: config.compressionEnabled ?? false,
    };
  }
  
  /**
   * Register map data source
   */
  public registerMapSource(mapId: string, dataSource: () => Promise<MapData>): void {
    this.mapDataSources.set(mapId, dataSource);
  }
  
  /**
   * Load map by ID
   */
  public async loadMap(mapId: string, forceReload: boolean = false): Promise<GameMap> {
    // Check if map is already loaded
    if (!forceReload && this.loadedMaps.has(mapId)) {
      const loadedMap = this.loadedMaps.get(mapId)!;
      loadedMap.lastAccessed = Date.now();
      return loadedMap.map;
    }
    
    // Set loading state
    this.setLoadingState({
      isLoading: true,
      loadingMapId: mapId,
      progress: 0,
      stage: 'downloading',
      error: null,
    });
    
    try {
      // Get map data
      let mapData: MapData;
      
      if (this.mapDataCache.has(mapId) && !forceReload) {
        mapData = this.mapDataCache.get(mapId)!;
        this.updateLoadingProgress(50, 'parsing');
      } else {
        // Load from source
        const dataSource = this.mapDataSources.get(mapId);
        if (!dataSource) {
          throw new Error(`No data source registered for map: ${mapId}`);
        }
        
        mapData = await dataSource();
        this.mapDataCache.set(mapId, mapData);
        this.updateLoadingProgress(30, 'parsing');
      }
      
      // Create map instance
      this.updateLoadingProgress(60, 'initializing');
      const map = new GameMap(mapData);
      
      // Create renderer
      this.updateLoadingProgress(80, 'rendering');
      const renderer = createMapRenderer(map, {
        tileSize: 32,
        enableTileAnimations: true,
        enableWeatherEffects: true,
        qualityLevel: 'medium',
      });
      
      // Store loaded map
      const loadedMap: LoadedMap = {
        map,
        renderer,
        lastAccessed: Date.now(),
        preloaded: false,
      };
      
      this.loadedMaps.set(mapId, loadedMap);
      
      // Manage cache size
      this.enforceCache();
      
      // Complete loading
      this.updateLoadingProgress(100, 'complete');
      this.setLoadingState({
        isLoading: false,
        loadingMapId: null,
        progress: 100,
        stage: 'complete',
        error: null,
      });
      
      // Trigger callback
      if (this.onMapLoaded) {
        this.onMapLoaded(mapId, map);
      }
      
      console.log(`Map "${mapId}" loaded successfully`);
      return map;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setLoadingState({
        isLoading: false,
        loadingMapId: null,
        progress: 0,
        stage: 'complete',
        error: errorMessage,
      });
      
      console.error(`Failed to load map "${mapId}":`, error);
      throw error;
    }
  }
  
  /**
   * Unload map from memory
   */
  public unloadMap(mapId: string): boolean {
    if (mapId === this.currentMapId) {
      console.warn('Cannot unload current map');
      return false;
    }
    
    const success = this.loadedMaps.delete(mapId);
    
    if (success && this.onMapUnloaded) {
      this.onMapUnloaded(mapId);
    }
    
    return success;
  }
  
  /**
   * Set current map
   */
  public async setCurrentMap(mapId: string): Promise<void> {
    if (this.currentMapId === mapId) {
      return;
    }
    
    // Load map if not already loaded
    await this.loadMap(mapId);
    
    this.currentMapId = mapId;
    
    // Preload adjacent maps
    this.preloadAdjacentMaps(mapId);
  }
  
  /**
   * Get current map
   */
  public getCurrentMap(): GameMap | null {
    if (!this.currentMapId) return null;
    
    const loadedMap = this.loadedMaps.get(this.currentMapId);
    return loadedMap ? loadedMap.map : null;
  }
  
  /**
   * Get current map renderer
   */
  public getCurrentMapRenderer(): MapRenderer | null {
    if (!this.currentMapId) return null;
    
    const loadedMap = this.loadedMaps.get(this.currentMapId);
    return loadedMap ? loadedMap.renderer : null;
  }
  
  /**
   * Get map by ID
   */
  public getMap(mapId: string): GameMap | null {
    const loadedMap = this.loadedMaps.get(mapId);
    if (loadedMap) {
      loadedMap.lastAccessed = Date.now();
      return loadedMap.map;
    }
    return null;
  }
  
  /**
   * Check if map is loaded
   */
  public isMapLoaded(mapId: string): boolean {
    return this.loadedMaps.has(mapId);
  }
  
  /**
   * Initiate map transition
   */
  public async transitionToMap(
    toMapId: string, 
    toPosition: Position, 
    transitionType: MapTransition['transitionType'] = 'edge',
    requirements?: MapTransition['requirements']
  ): Promise<void> {
    if (!this.currentMapId) {
      throw new Error('No current map set');
    }
    
    // Check requirements
    if (requirements && !this.checkTransitionRequirements(requirements)) {
      throw new Error('Transition requirements not met');
    }
    
    const context: MapTransitionContext = {
      fromMapId: this.currentMapId,
      toMapId,
      fromPosition: { x: 0, y: 0 }, // Will be set by caller
      toPosition,
      transitionType,
      requirements,
    };
    
    // Queue transition if one is already in progress
    if (this.currentTransition) {
      this.transitionQueue.push(context);
      return;
    }
    
    await this.executeTransition(context);
  }
  
  /**
   * Execute map transition
   */
  private async executeTransition(context: MapTransitionContext): Promise<void> {
    this.currentTransition = context;
    
    // Start transition effect
    this.transitionEffect = this.createTransitionEffect(context.transitionType);
    
    // Trigger start callback
    if (this.onTransitionStart) {
      this.onTransitionStart(context);
    }
    
    try {
      // Load target map
      await this.loadMap(context.toMapId);
      
      // Wait for transition effect to complete
      await this.waitForTransitionEffect();
      
      // Switch to new map
      this.currentMapId = context.toMapId;
      
      // Trigger complete callback
      if (this.onTransitionComplete) {
        this.onTransitionComplete(context);
      }
      
    } catch (error) {
      console.error('Transition failed:', error);
      this.transitionEffect = null;
      throw error;
    }
    
    this.currentTransition = null;
    this.transitionEffect = null;
    
    // Process next transition in queue
    if (this.transitionQueue.length > 0) {
      const nextTransition = this.transitionQueue.shift()!;
      await this.executeTransition(nextTransition);
    }
  }
  
  /**
   * Update transition effect
   */
  public updateTransition(deltaTime: number): void {
    if (!this.transitionEffect || !this.transitionEffect.active) return;
    
    this.transitionEffect.progress += deltaTime / this.transitionEffect.duration;
    this.transitionEffect.progress = Math.min(1, this.transitionEffect.progress);
    
    if (this.transitionEffect.progress >= 1) {
      this.transitionEffect.active = false;
    }
  }
  
  /**
   * Render transition effect
   */
  public renderTransition(ctx: CanvasRenderingContext2D): void {
    if (!this.transitionEffect || !this.transitionEffect.active) return;
    
    const { type, progress, color, direction } = this.transitionEffect;
    
    ctx.save();
    
    switch (type) {
      case 'fade':
        ctx.fillStyle = color || 'black';
        ctx.globalAlpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
        
      case 'slide':
        ctx.fillStyle = color || 'black';
        const slideDistance = ctx.canvas.width * progress;
        if (direction === 'left') {
          ctx.fillRect(ctx.canvas.width - slideDistance, 0, slideDistance, ctx.canvas.height);
        } else if (direction === 'right') {
          ctx.fillRect(0, 0, slideDistance, ctx.canvas.height);
        }
        break;
        
      case 'portal':
        // Circular transition effect
        ctx.fillStyle = color || 'black';
        const maxRadius = Math.sqrt(ctx.canvas.width ** 2 + ctx.canvas.height ** 2) / 2;
        const currentRadius = maxRadius * (progress < 0.5 ? 1 - progress * 2 : (progress - 0.5) * 2);
        
        ctx.beginPath();
        ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, currentRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * Get loading state
   */
  public getLoadingState(): MapLoadingState {
    return { ...this.loadingState };
  }
  
  /**
   * Get transition state
   */
  public getTransitionState(): { active: boolean; progress: number; type: string | null } {
    return {
      active: this.transitionEffect?.active ?? false,
      progress: this.transitionEffect?.progress ?? 0,
      type: this.transitionEffect?.type ?? null,
    };
  }
  
  /**
   * Set callbacks
   */
  public setCallbacks(callbacks: {
    onMapLoaded?: (mapId: string, map: GameMap) => void;
    onMapUnloaded?: (mapId: string) => void;
    onTransitionStart?: (context: MapTransitionContext) => void;
    onTransitionComplete?: (context: MapTransitionContext) => void;
    onLoadingProgress?: (state: MapLoadingState) => void;
  }): void {
    this.onMapLoaded = callbacks.onMapLoaded;
    this.onMapUnloaded = callbacks.onMapUnloaded;
    this.onTransitionStart = callbacks.onTransitionStart;
    this.onTransitionComplete = callbacks.onTransitionComplete;
    this.onLoadingProgress = callbacks.onLoadingProgress;
  }
  
  /**
   * Clear all loaded maps
   */
  public clearAll(): void {
    this.loadedMaps.clear();
    this.mapDataCache.clear();
    this.currentMapId = null;
    this.transitionQueue = [];
    this.currentTransition = null;
    this.transitionEffect = null;
  }
  
  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): {
    loadedMaps: number;
    cachedMapData: number;
    totalMemoryEstimate: string;
  } {
    const loadedMaps = this.loadedMaps.size;
    const cachedMapData = this.mapDataCache.size;
    
    // Rough memory estimate (this is approximation)
    const estimatedMemory = (loadedMaps * 5 + cachedMapData * 2) * 1024; // KB
    
    return {
      loadedMaps,
      cachedMapData,
      totalMemoryEstimate: `${Math.round(estimatedMemory / 1024)}MB`,
    };
  }
  
  /**
   * Preload maps adjacent to current map
   */
  private async preloadAdjacentMaps(mapId: string): Promise<void> {
    const currentMap = this.getMap(mapId);
    if (!currentMap) return;
    
    const transitions = currentMap.getTransitions();
    const adjacentMapIds = [...new Set(transitions.map(t => t.toMapId))];
    
    // Preload up to preloadRadius maps
    const mapsToPreload = adjacentMapIds.slice(0, this.config.preloadRadius);
    
    for (const adjacentMapId of mapsToPreload) {
      if (!this.isMapLoaded(adjacentMapId)) {
        try {
          const map = await this.loadMap(adjacentMapId);
          const loadedMap = this.loadedMaps.get(adjacentMapId);
          if (loadedMap) {
            loadedMap.preloaded = true;
          }
          console.log(`Preloaded adjacent map: ${adjacentMapId}`);
        } catch (error) {
          console.warn(`Failed to preload map ${adjacentMapId}:`, error);
        }
      }
    }
  }
  
  /**
   * Enforce cache size limits
   */
  private enforceCache(): void {
    if (this.loadedMaps.size <= this.config.cacheSize) return;
    
    // Sort by last accessed time and remove oldest
    const sortedMaps = Array.from(this.loadedMaps.entries())
      .filter(([mapId]) => mapId !== this.currentMapId) // Don't unload current map
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const mapsToRemove = sortedMaps.slice(0, this.loadedMaps.size - this.config.cacheSize);
    
    mapsToRemove.forEach(([mapId]) => {
      this.unloadMap(mapId);
      console.log(`Unloaded map from cache: ${mapId}`);
    });
  }
  
  /**
   * Check if transition requirements are met
   */
  private checkTransitionRequirements(requirements: MapTransition['requirements']): boolean {
    // This would check against player state in a real implementation
    // For now, return true (no requirements checking)
    return true;
  }
  
  /**
   * Create transition effect
   */
  private createTransitionEffect(transitionType: MapTransition['transitionType']): TransitionEffect {
    const baseEffect = {
      duration: this.config.transitionDuration,
      progress: 0,
      active: true,
    };
    
    switch (transitionType) {
      case 'edge':
        return { ...baseEffect, type: 'slide', direction: 'right' };
      case 'portal':
        return { ...baseEffect, type: 'portal', color: '#4c1d95' };
      case 'door':
        return { ...baseEffect, type: 'fade', color: '#000000' };
      case 'stairs':
        return { ...baseEffect, type: 'fade', color: '#1f2937' };
      default:
        return { ...baseEffect, type: 'instant', duration: 1 };
    }
  }
  
  /**
   * Wait for transition effect to complete
   */
  private async waitForTransitionEffect(): Promise<void> {
    return new Promise((resolve) => {
      const checkProgress = () => {
        if (!this.transitionEffect || !this.transitionEffect.active) {
          resolve();
        } else {
          requestAnimationFrame(checkProgress);
        }
      };
      checkProgress();
    });
  }
  
  /**
   * Set loading state
   */
  private setLoadingState(state: Partial<MapLoadingState>): void {
    Object.assign(this.loadingState, state);
    
    if (this.onLoadingProgress) {
      this.onLoadingProgress(this.loadingState);
    }
  }
  
  /**
   * Update loading progress
   */
  private updateLoadingProgress(progress: number, stage: MapLoadingState['stage']): void {
    this.setLoadingState({ progress, stage });
  }
}

// Utility function to create map manager
export function createMapManager(config: MapManagerConfig = {}): MapManager {
  return new MapManager(config);
}

// Export MapManager as default
export default MapManager;