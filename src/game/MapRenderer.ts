// Map Renderer System
// Handles rendering of maps, terrain, objects, and visual effects

import { Position } from '../types/game';
import { GameMap, MapObject, TerrainType } from './Map';
import { Camera } from './Renderer';

export interface MapRenderConfig {
  tileSize: number;
  enableTileAnimations?: boolean;
  enableWeatherEffects?: boolean;
  enableLighting?: boolean;
  showObjectShadows?: boolean;
  renderDistance?: number;
  qualityLevel?: 'low' | 'medium' | 'high';
}

export interface RenderLayer {
  name: string;
  zIndex: number;
  enabled: boolean;
  opacity: number;
  renderFunction: (ctx: CanvasRenderingContext2D, camera: Camera, deltaTime: number) => void;
}

export interface WeatherEffect {
  type: 'rain' | 'snow' | 'fog' | 'wind' | 'particles';
  intensity: number;
  particles: WeatherParticle[];
  active: boolean;
}

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export class MapRenderer {
  private map: GameMap;
  private config: Required<MapRenderConfig>;
  private layers: Map<string, RenderLayer> = new Map();
  private sortedLayers: RenderLayer[] = [];
  
  // Animation and effects
  private animationTime: number = 0;
  private weatherEffects: Map<string, WeatherEffect> = new Map();
  private lightingSources: Map<string, { position: Position; radius: number; color: string; intensity: number }> = new Map();
  
  // Rendering optimization
  private visibleTiles: Set<string> = new Set();
  private lastCameraPosition: Position = { x: 0, y: 0 };
  private tileBatch: Map<TerrainType, Position[]> = new Map();
  
  // Terrain texture patterns (for future sprite replacement)
  private terrainPatterns: Map<TerrainType, {
    colors: string[];
    pattern: 'solid' | 'noise' | 'gradient' | 'textured';
    animated?: boolean;
  }> = new Map([
    ['grass', { colors: ['#22c55e', '#16a34a', '#15803d'], pattern: 'noise', animated: true }],
    ['water', { colors: ['#3b82f6', '#1d4ed8', '#1e40af'], pattern: 'gradient', animated: true }],
    ['stone', { colors: ['#6b7280', '#4b5563', '#374151'], pattern: 'textured' }],
    ['forest', { colors: ['#15803d', '#166534', '#14532d'], pattern: 'noise' }],
    ['path', { colors: ['#a3a3a3', '#737373', '#525252'], pattern: 'solid' }],
    ['flower', { colors: ['#ec4899', '#db2777', '#be185d'], pattern: 'noise', animated: true }],
    ['sand', { colors: ['#fbbf24', '#f59e0b', '#d97706'], pattern: 'noise' }],
    ['dirt', { colors: ['#92400e', '#7c2d12', '#451a03'], pattern: 'textured' }],
    ['rock', { colors: ['#374151', '#1f2937', '#111827'], pattern: 'textured' }],
    ['bush', { colors: ['#16a34a', '#15803d', '#166534'], pattern: 'noise' }],
  ]);
  
  constructor(map: GameMap, config: MapRenderConfig) {
    this.map = map;
    this.config = {
      tileSize: config.tileSize,
      enableTileAnimations: config.enableTileAnimations ?? true,
      enableWeatherEffects: config.enableWeatherEffects ?? true,
      enableLighting: config.enableLighting ?? false,
      showObjectShadows: config.showObjectShadows ?? true,
      renderDistance: config.renderDistance ?? 20,
      qualityLevel: config.qualityLevel ?? 'medium',
    };
    
    this.setupDefaultLayers();
    this.initializeWeatherEffects();
  }
  
  /**
   * Main render method
   */
  public render(ctx: CanvasRenderingContext2D, camera: Camera, deltaTime: number): void {
    this.animationTime += deltaTime;
    
    // Update visible tiles if camera moved significantly
    if (Math.abs(camera.x - this.lastCameraPosition.x) > this.config.tileSize ||
        Math.abs(camera.y - this.lastCameraPosition.y) > this.config.tileSize) {
      this.updateVisibleTiles(camera);
      this.lastCameraPosition = { x: camera.x, y: camera.y };
    }
    
    // Update weather effects
    if (this.config.enableWeatherEffects) {
      this.updateWeatherEffects(deltaTime);
    }
    
    // Render all layers in order
    for (const layer of this.sortedLayers) {
      if (!layer.enabled) continue;
      
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      
      try {
        layer.renderFunction(ctx, camera, deltaTime);
      } catch (error) {
        console.error(`Error rendering layer ${layer.name}:`, error);
      }
      
      ctx.restore();
    }
  }
  
  /**
   * Set map reference
   */
  public setMap(map: GameMap): void {
    this.map = map;
    this.visibleTiles.clear();
    this.tileBatch.clear();
  }
  
  /**
   * Add or update render layer
   */
  public setLayer(name: string, zIndex: number, renderFunction: RenderLayer['renderFunction'], enabled: boolean = true, opacity: number = 1): void {
    this.layers.set(name, {
      name,
      zIndex,
      enabled,
      opacity,
      renderFunction,
    });
    
    this.sortLayers();
  }
  
  /**
   * Remove render layer
   */
  public removeLayer(name: string): void {
    this.layers.delete(name);
    this.sortLayers();
  }
  
  /**
   * Set layer visibility
   */
  public setLayerEnabled(name: string, enabled: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.enabled = enabled;
    }
  }
  
  /**
   * Set layer opacity
   */
  public setLayerOpacity(name: string, opacity: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }
  
  /**
   * Add weather effect
   */
  public addWeatherEffect(type: WeatherEffect['type'], intensity: number = 0.5): void {
    const effect: WeatherEffect = {
      type,
      intensity,
      particles: [],
      active: true,
    };
    
    // Initialize particles based on type
    this.initializeWeatherParticles(effect);
    this.weatherEffects.set(type, effect);
  }
  
  /**
   * Remove weather effect
   */
  public removeWeatherEffect(type: WeatherEffect['type']): void {
    this.weatherEffects.delete(type);
  }
  
  /**
   * Add lighting source
   */
  public addLight(id: string, position: Position, radius: number, color: string = '#ffffff', intensity: number = 1): void {
    this.lightingSources.set(id, { position, radius, color, intensity });
  }
  
  /**
   * Remove lighting source
   */
  public removeLight(id: string): void {
    this.lightingSources.delete(id);
  }
  
  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MapRenderConfig>): void {
    Object.assign(this.config, config);
  }
  
  /**
   * Get render statistics
   */
  public getRenderStats(): {
    visibleTiles: number;
    activeLayers: number;
    weatherEffects: number;
    lightSources: number;
  } {
    return {
      visibleTiles: this.visibleTiles.size,
      activeLayers: this.sortedLayers.filter(layer => layer.enabled).length,
      weatherEffects: Array.from(this.weatherEffects.values()).filter(effect => effect.active).length,
      lightSources: this.lightingSources.size,
    };
  }
  
  /**
   * Setup default rendering layers
   */
  private setupDefaultLayers(): void {
    // Terrain layer (bottom)
    this.setLayer('terrain', 0, (ctx, camera, deltaTime) => {
      this.renderTerrain(ctx, camera, deltaTime);
    });
    
    // Objects layer
    this.setLayer('objects', 10, (ctx, camera, deltaTime) => {
      this.renderObjects(ctx, camera, deltaTime);
    });
    
    // Lighting layer
    if (this.config.enableLighting) {
      this.setLayer('lighting', 90, (ctx, camera, deltaTime) => {
        this.renderLighting(ctx, camera);
      });
    }
    
    // Weather effects layer (top)
    if (this.config.enableWeatherEffects) {
      this.setLayer('weather', 100, (ctx, camera, deltaTime) => {
        this.renderWeatherEffects(ctx, camera, deltaTime);
      });
    }
  }
  
  /**
   * Render terrain tiles
   */
  private renderTerrain(ctx: CanvasRenderingContext2D, camera: Camera, deltaTime: number): void {
    const { tileSize } = this.config;
    
    // Calculate visible area
    const startX = Math.floor(-camera.x / tileSize) - 2;
    const endX = startX + Math.ceil(ctx.canvas.width / (tileSize * camera.zoom)) + 4;
    const startY = Math.floor(-camera.y / tileSize) - 2;
    const endY = startY + Math.ceil(ctx.canvas.height / (tileSize * camera.zoom)) + 4;
    
    // Batch tiles by terrain type for efficient rendering
    this.tileBatch.clear();
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = this.map.getTile(x, y);
        if (!tile) continue;
        
        const terrainType = tile.terrainType;
        if (!this.tileBatch.has(terrainType)) {
          this.tileBatch.set(terrainType, []);
        }
        this.tileBatch.get(terrainType)!.push({ x, y });
      }
    }
    
    // Render each terrain type in batches
    this.tileBatch.forEach((positions, terrainType) => {
      this.renderTerrainBatch(ctx, terrainType, positions, deltaTime);
    });
  }
  
  /**
   * Render a batch of tiles of the same terrain type
   */
  private renderTerrainBatch(ctx: CanvasRenderingContext2D, terrainType: TerrainType, positions: Position[], deltaTime: number): void {
    const { tileSize } = this.config;
    const terrainPattern = this.terrainPatterns.get(terrainType);
    
    if (!terrainPattern) return;
    
    const baseColor = terrainPattern.colors[0];
    const isAnimated = terrainPattern.animated && this.config.enableTileAnimations;
    
    // Set up rendering style
    ctx.fillStyle = baseColor;
    
    // Render each tile
    positions.forEach(({ x, y }) => {
      const screenX = x * tileSize;
      const screenY = y * tileSize;
      
      // Apply animation offset if enabled
      let animationOffset = 0;
      if (isAnimated) {
        animationOffset = Math.sin(this.animationTime * 0.001 + x * 0.1 + y * 0.1) * 2;
      }
      
      // Base tile
      ctx.fillRect(screenX, screenY + animationOffset, tileSize, tileSize);
      
      // Add pattern details based on terrain type
      this.renderTerrainPattern(ctx, terrainType, screenX, screenY + animationOffset, tileSize, terrainPattern);
    });
  }
  
  /**
   * Render terrain pattern details
   */
  private renderTerrainPattern(ctx: CanvasRenderingContext2D, terrainType: TerrainType, x: number, y: number, size: number, pattern: any): void {
    const { colors } = pattern;
    
    switch (pattern.pattern) {
      case 'noise':
        // Add random color variations
        if (colors.length > 1) {
          ctx.fillStyle = colors[1];
          const noiseCount = 3 + Math.floor(Math.random() * 3);
          for (let i = 0; i < noiseCount; i++) {
            const nx = x + Math.random() * size;
            const ny = y + Math.random() * size;
            const nsize = 2 + Math.random() * 4;
            ctx.fillRect(nx, ny, nsize, nsize);
          }
        }
        break;
        
      case 'gradient':
        if (colors.length > 1) {
          const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, size, size);
        }
        break;
        
      case 'textured':
        // Add texture-like details
        ctx.strokeStyle = colors[1] || colors[0];
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + Math.random() * size, y + Math.random() * size);
          ctx.lineTo(x + Math.random() * size, y + Math.random() * size);
          ctx.stroke();
        }
        break;
    }
    
    // Special terrain effects
    if (terrainType === 'water' && this.config.enableTileAnimations) {
      // Water ripple effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      const ripple = Math.sin(this.animationTime * 0.003 + x * 0.01) * 5;
      ctx.beginPath();
      ctx.moveTo(x, y + size / 2 + ripple);
      ctx.lineTo(x + size, y + size / 2 + ripple);
      ctx.stroke();
    }
  }
  
  /**
   * Render map objects
   */
  private renderObjects(ctx: CanvasRenderingContext2D, camera: Camera, deltaTime: number): void {
    const { tileSize } = this.config;
    
    // Calculate visible area
    const viewStartX = -camera.x - tileSize;
    const viewEndX = -camera.x + ctx.canvas.width + tileSize;
    const viewStartY = -camera.y - tileSize;
    const viewEndY = -camera.y + ctx.canvas.height + tileSize;
    
    // Get objects in visible area
    const startGridX = Math.floor(viewStartX / tileSize);
    const endGridX = Math.ceil(viewEndX / tileSize);
    const startGridY = Math.floor(viewStartY / tileSize);
    const endGridY = Math.ceil(viewEndY / tileSize);
    
    const visibleObjects = this.map.getObjectsInArea(
      startGridX, startGridY, 
      endGridX - startGridX, 
      endGridY - startGridY
    );
    
    // Sort objects by y-position for proper depth ordering
    visibleObjects.sort((a, b) => (a.position.y + a.size.height) - (b.position.y + b.size.height));
    
    // Render each object
    visibleObjects.forEach(obj => {
      this.renderObject(ctx, obj, deltaTime);
    });
  }
  
  /**
   * Render a single map object
   */
  private renderObject(ctx: CanvasRenderingContext2D, object: MapObject, deltaTime: number): void {
    const { tileSize } = this.config;
    const screenX = object.position.x * tileSize;
    const screenY = object.position.y * tileSize;
    const width = object.size.width * tileSize;
    const height = object.size.height * tileSize;
    
    // Render shadow if enabled
    if (this.config.showObjectShadows && object.type !== 'decoration') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(screenX + width / 2, screenY + height + 5, width / 3, height / 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Render object based on type
    this.renderObjectByType(ctx, object, screenX, screenY, width, height, deltaTime);
    
    // Render interaction indicator if interactable
    if (object.interactable) {
      const pulse = Math.sin(this.animationTime * 0.005) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - 2, screenY - 2, width + 4, height + 4);
    }
  }
  
  /**
   * Render object based on its type
   */
  private renderObjectByType(ctx: CanvasRenderingContext2D, object: MapObject, x: number, y: number, width: number, height: number, deltaTime: number): void {
    switch (object.type) {
      case 'tree':
        // Tree trunk
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + width * 0.3, y + height * 0.6, width * 0.4, height * 0.4);
        // Tree foliage
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.4, width * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'rock':
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Add texture
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(x + width * 0.2, y + height * 0.2, width * 0.6, height * 0.1);
        break;
        
      case 'flower':
        // Stem
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y + height);
        ctx.lineTo(x + width / 2, y + height * 0.3);
        ctx.stroke();
        // Flower
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.2, width * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'bush':
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        // Multiple overlapping circles for bush effect
        for (let i = 0; i < 3; i++) {
          const offsetX = (i - 1) * width * 0.2;
          const offsetY = Math.sin(i) * height * 0.1;
          ctx.arc(x + width / 2 + offsetX, y + height / 2 + offsetY, width * 0.3, 0, Math.PI * 2);
        }
        ctx.fill();
        break;
        
      case 'water_source':
        // Water pool
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Water animation
        if (this.config.enableTileAnimations) {
          const ripple = Math.sin(this.animationTime * 0.004) * 3;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, width / 4 + ripple, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
        
      case 'landmark':
        // Simple monument/marker
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x + width * 0.4, y, width * 0.2, height);
        ctx.fillRect(x + width * 0.2, y + height * 0.1, width * 0.6, height * 0.2);
        break;
        
      case 'decoration':
      default:
        // Generic decoration
        ctx.fillStyle = '#a3a3a3';
        ctx.fillRect(x, y, width, height);
        break;
    }
  }
  
  /**
   * Render lighting effects
   */
  private renderLighting(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (this.lightingSources.size === 0) return;
    
    // Create lighting overlay
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(0, 0, 50, 0.7)'; // Dark blue tint
    ctx.fillRect(-camera.x, -camera.y, ctx.canvas.width, ctx.canvas.height);
    
    // Add light sources
    ctx.globalCompositeOperation = 'lighter';
    this.lightingSources.forEach(light => {
      const screenX = light.position.x * this.config.tileSize - camera.x;
      const screenY = light.position.y * this.config.tileSize - camera.y;
      
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, light.radius);
      gradient.addColorStop(0, `${light.color}${Math.floor(light.intensity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, light.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }
  
  /**
   * Render weather effects
   */
  private renderWeatherEffects(ctx: CanvasRenderingContext2D, camera: Camera, deltaTime: number): void {
    this.weatherEffects.forEach(effect => {
      if (!effect.active) return;
      
      switch (effect.type) {
        case 'rain':
          this.renderRain(ctx, effect, camera);
          break;
        case 'snow':
          this.renderSnow(ctx, effect, camera);
          break;
        case 'fog':
          this.renderFog(ctx, effect, camera);
          break;
      }
    });
  }
  
  /**
   * Render rain effect
   */
  private renderRain(ctx: CanvasRenderingContext2D, effect: WeatherEffect, camera: Camera): void {
    ctx.strokeStyle = `rgba(173, 216, 230, ${effect.intensity})`;
    ctx.lineWidth = 1;
    
    effect.particles.forEach(particle => {
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x + particle.vx * 5, particle.y + particle.vy * 5);
      ctx.stroke();
    });
  }
  
  /**
   * Render snow effect
   */
  private renderSnow(ctx: CanvasRenderingContext2D, effect: WeatherEffect, camera: Camera): void {
    ctx.fillStyle = `rgba(255, 255, 255, ${effect.intensity})`;
    
    effect.particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  /**
   * Render fog effect
   */
  private renderFog(ctx: CanvasRenderingContext2D, effect: WeatherEffect, camera: Camera): void {
    ctx.fillStyle = `rgba(200, 200, 200, ${effect.intensity * 0.3})`;
    ctx.fillRect(-camera.x, -camera.y, ctx.canvas.width, ctx.canvas.height);
  }
  
  /**
   * Update visible tiles based on camera position
   */
  private updateVisibleTiles(camera: Camera): void {
    this.visibleTiles.clear();
    
    const { tileSize, renderDistance } = this.config;
    const centerX = Math.floor(-camera.x / tileSize);
    const centerY = Math.floor(-camera.y / tileSize);
    
    for (let y = centerY - renderDistance; y <= centerY + renderDistance; y++) {
      for (let x = centerX - renderDistance; x <= centerX + renderDistance; x++) {
        if (this.map.isValidPosition(x, y)) {
          this.visibleTiles.add(`${x},${y}`);
        }
      }
    }
  }
  
  /**
   * Initialize weather effects
   */
  private initializeWeatherEffects(): void {
    const currentWeather = this.map.getWeather();
    
    if (currentWeather === 'rainy') {
      this.addWeatherEffect('rain', 0.7);
    } else if (currentWeather === 'cloudy') {
      this.addWeatherEffect('fog', 0.3);
    }
  }
  
  /**
   * Initialize weather particles
   */
  private initializeWeatherParticles(effect: WeatherEffect): void {
    const particleCount = Math.floor(effect.intensity * 100);
    
    for (let i = 0; i < particleCount; i++) {
      const particle: WeatherParticle = {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        vx: effect.type === 'rain' ? -2 : (Math.random() - 0.5) * 2,
        vy: effect.type === 'rain' ? 8 : effect.type === 'snow' ? 2 : 0.5,
        size: effect.type === 'snow' ? 1 + Math.random() * 3 : 1,
        opacity: 0.5 + Math.random() * 0.5,
        life: Math.random() * 1000,
        maxLife: 1000 + Math.random() * 2000,
      };
      
      effect.particles.push(particle);
    }
  }
  
  /**
   * Update weather particle systems
   */
  private updateWeatherEffects(deltaTime: number): void {
    this.weatherEffects.forEach(effect => {
      if (!effect.active) return;
      
      effect.particles.forEach(particle => {
        // Update position
        particle.x += particle.vx * deltaTime * 0.1;
        particle.y += particle.vy * deltaTime * 0.1;
        
        // Update life
        particle.life += deltaTime;
        
        // Reset particle if it's off screen or dead
        if (particle.life > particle.maxLife || particle.y > 1000) {
          particle.x = Math.random() * 1000;
          particle.y = -10;
          particle.life = 0;
        }
      });
    });
  }
  
  /**
   * Sort layers by z-index
   */
  private sortLayers(): void {
    this.sortedLayers = Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
  }
}

// Utility function to create map renderer
export function createMapRenderer(map: GameMap, config: MapRenderConfig): MapRenderer {
  return new MapRenderer(map, config);
}

// Export MapRenderer as default
export default MapRenderer;