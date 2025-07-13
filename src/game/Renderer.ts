// 2D Renderer System
// Handles basic 2D rendering, camera management, and viewport control

import { Position } from '../types/game';
import { Player } from './Player';

export interface RendererConfig {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  tileSize?: number;
  backgroundColor?: string;
  gridColor?: string;
  showGrid?: boolean;
  enableSmoothing?: boolean;
  pixelPerfect?: boolean;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  followSpeed: number;
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  deltaTime: number;
  interpolation: number;
  screenWidth: number;
  screenHeight: number;
  tileSize: number;
}

export interface Layer {
  name: string;
  zIndex: number;
  visible: boolean;
  opacity: number;
  renderFunction: (context: RenderContext) => void;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<RendererConfig>;
  private camera: Camera;
  private layers: Map<string, Layer> = new Map();
  private sortedLayers: Layer[] = [];
  
  // Rendering state
  private backgroundColor: string;
  private lastRenderTime: number = 0;
  private frameCount: number = 0;
  private isDestroyed: boolean = false;
  
  // Performance tracking
  private renderTimes: number[] = [];
  private maxRenderTimeHistory = 30;
  
  constructor(config: RendererConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    
    if (!this.ctx) {
      throw new Error('Renderer: Unable to get 2D rendering context');
    }
    
    this.config = {
      canvas: config.canvas,
      width: config.width ?? 800,
      height: config.height ?? 600,
      tileSize: config.tileSize ?? 32,
      backgroundColor: config.backgroundColor ?? '#86efac',
      gridColor: config.gridColor ?? 'rgba(255, 255, 255, 0.1)',
      showGrid: config.showGrid ?? false,
      enableSmoothing: config.enableSmoothing ?? false,
      pixelPerfect: config.pixelPerfect ?? true,
    };
    
    this.backgroundColor = this.config.backgroundColor;
    
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
      targetX: 0,
      targetY: 0,
      followSpeed: 5, // How fast camera follows target
    };
    
    this.setupCanvas();
    this.setupDefaultLayers();
  }
  
  /**
   * Main render method called every frame
   */
  public render(deltaTime: number, interpolation: number = 0): void {
    if (this.isDestroyed) return;
    
    const startTime = performance.now();
    
    // Update camera
    this.updateCamera(deltaTime);
    
    // Setup render context
    const renderContext: RenderContext = {
      ctx: this.ctx,
      camera: this.camera,
      deltaTime,
      interpolation,
      screenWidth: this.config.width,
      screenHeight: this.config.height,
      tileSize: this.config.tileSize,
    };
    
    // Clear canvas
    this.clearCanvas();
    
    // Apply camera transformation
    this.applyCamera();
    
    // Render all layers in order
    this.renderLayers(renderContext);
    
    // Reset transformations
    this.resetCamera();
    
    // Render UI (not affected by camera)
    this.renderUI(renderContext);
    
    // Track performance
    this.trackRenderPerformance(performance.now() - startTime);
    
    this.frameCount++;
  }
  
  /**
   * Add or update a render layer
   */
  public setLayer(name: string, zIndex: number, renderFunction: (context: RenderContext) => void, visible: boolean = true, opacity: number = 1): void {
    const layer: Layer = {
      name,
      zIndex,
      visible,
      opacity,
      renderFunction,
    };
    
    this.layers.set(name, layer);
    this.sortLayers();
  }
  
  /**
   * Remove a render layer
   */
  public removeLayer(name: string): void {
    this.layers.delete(name);
    this.sortLayers();
  }
  
  /**
   * Set layer visibility
   */
  public setLayerVisible(name: string, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
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
   * Set camera position
   */
  public setCameraPosition(x: number, y: number): void {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.targetX = x;
    this.camera.targetY = y;
  }
  
  /**
   * Set camera target for smooth following
   */
  public setCameraTarget(x: number, y: number): void {
    this.camera.targetX = x;
    this.camera.targetY = y;
  }
  
  /**
   * Set camera zoom
   */
  public setCameraZoom(zoom: number): void {
    this.camera.zoom = Math.max(0.1, Math.min(5, zoom));
  }
  
  /**
   * Set camera bounds
   */
  public setCameraBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.camera.bounds = { minX, maxX, minY, maxY };
  }
  
  /**
   * Follow player with camera
   */
  public followPlayer(player: Player): void {
    const position = player.getPosition();
    this.setCameraTarget(
      position.x * this.config.tileSize,
      position.y * this.config.tileSize
    );
  }
  
  /**
   * Convert screen coordinates to world coordinates
   */
  public screenToWorld(screenX: number, screenY: number): Position {
    const worldX = (screenX - this.config.width / 2) / this.camera.zoom + this.camera.x;
    const worldY = (screenY - this.config.height / 2) / this.camera.zoom + this.camera.y;
    
    return {
      x: Math.floor(worldX / this.config.tileSize),
      y: Math.floor(worldY / this.config.tileSize),
    };
  }
  
  /**
   * Convert world coordinates to screen coordinates
   */
  public worldToScreen(worldX: number, worldY: number): Position {
    const screenX = (worldX - this.camera.x) * this.camera.zoom + this.config.width / 2;
    const screenY = (worldY - this.camera.y) * this.camera.zoom + this.config.height / 2;
    
    return { x: screenX, y: screenY };
  }
  
  /**
   * Set background color
   */
  public setBackgroundColor(color: string): void {
    this.backgroundColor = color;
  }
  
  /**
   * Get canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Get rendering context
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
  
  /**
   * Get camera information
   */
  public getCamera(): Camera {
    return { ...this.camera };
  }
  
  /**
   * Get render performance metrics
   */
  public getPerformanceMetrics(): { avgRenderTime: number; frameCount: number } {
    const avgRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
      : 0;
    
    return {
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      frameCount: this.frameCount,
    };
  }
  
  /**
   * Resize renderer
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.setupCanvas();
  }
  
  /**
   * Destroy renderer and cleanup
   */
  public destroy(): void {
    this.isDestroyed = true;
    this.layers.clear();
    this.sortedLayers = [];
    this.renderTimes = [];
    console.log('Renderer: Destroyed');
  }
  
  /**
   * Setup canvas properties
   */
  private setupCanvas(): void {
    // Set canvas size
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    
    // Set rendering properties
    this.ctx.imageSmoothingEnabled = this.config.enableSmoothing;
    
    if (this.config.pixelPerfect) {
      this.ctx.imageSmoothingQuality = 'high';
      // For pixel art, disable smoothing
      this.ctx.imageSmoothingEnabled = false;
    }
    
    // Set default text properties
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = '12px monospace';
  }
  
  /**
   * Setup default rendering layers
   */
  private setupDefaultLayers(): void {
    // Background layer
    this.setLayer('background', 0, (context) => {
      this.renderBackground(context);
    });
    
    // Grid layer
    this.setLayer('grid', 10, (context) => {
      if (this.config.showGrid) {
        this.renderGrid(context);
      }
    });
    
    // Game objects layer (placeholder)
    this.setLayer('objects', 50, (context) => {
      // Game objects will be rendered here
    });
    
    // Effects layer
    this.setLayer('effects', 100, (context) => {
      // Visual effects will be rendered here
    });
  }
  
  /**
   * Update camera position with smooth following
   */
  private updateCamera(deltaTime: number): void {
    const followSpeed = this.camera.followSpeed;
    const t = Math.min(1, (deltaTime / 1000) * followSpeed);
    
    // Smooth camera following
    this.camera.x += (this.camera.targetX - this.camera.x) * t;
    this.camera.y += (this.camera.targetY - this.camera.y) * t;
    
    // Apply camera bounds if set
    if (this.camera.bounds) {
      this.camera.x = Math.max(this.camera.bounds.minX, Math.min(this.camera.bounds.maxX, this.camera.x));
      this.camera.y = Math.max(this.camera.bounds.minY, Math.min(this.camera.bounds.maxY, this.camera.y));
    }
  }
  
  /**
   * Clear canvas
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
  }
  
  /**
   * Apply camera transformation
   */
  private applyCamera(): void {
    this.ctx.save();
    this.ctx.translate(this.config.width / 2, this.config.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }
  
  /**
   * Reset camera transformation
   */
  private resetCamera(): void {
    this.ctx.restore();
  }
  
  /**
   * Render all layers in order
   */
  private renderLayers(context: RenderContext): void {
    for (const layer of this.sortedLayers) {
      if (!layer.visible) continue;
      
      if (layer.opacity < 1) {
        this.ctx.save();
        this.ctx.globalAlpha = layer.opacity;
      }
      
      try {
        layer.renderFunction(context);
      } catch (error) {
        console.error(`Error rendering layer ${layer.name}:`, error);
      }
      
      if (layer.opacity < 1) {
        this.ctx.restore();
      }
    }
  }
  
  /**
   * Render UI elements (not affected by camera)
   */
  private renderUI(context: RenderContext): void {
    // UI rendering will be handled by React components
    // This method is available for immediate mode UI if needed
  }
  
  /**
   * Render background
   */
  private renderBackground(context: RenderContext): void {
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(
      -context.screenWidth / 2,
      -context.screenHeight / 2,
      context.screenWidth / 2,
      context.screenHeight / 2
    );
    gradient.addColorStop(0, '#86efac'); // green-300
    gradient.addColorStop(0.5, '#34d399'); // emerald-400
    gradient.addColorStop(1, '#06b6d4'); // cyan-500
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      -context.screenWidth / 2 - this.camera.x,
      -context.screenHeight / 2 - this.camera.y,
      context.screenWidth * 2,
      context.screenHeight * 2
    );
  }
  
  /**
   * Render grid
   */
  private renderGrid(context: RenderContext): void {
    const { ctx, tileSize, screenWidth, screenHeight } = context;
    
    ctx.strokeStyle = this.config.gridColor;
    ctx.lineWidth = 1;
    
    const startX = Math.floor(-this.camera.x / tileSize) * tileSize;
    const endX = startX + screenWidth + tileSize;
    const startY = Math.floor(-this.camera.y / tileSize) * tileSize;
    const endY = startY + screenHeight + tileSize;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }
  
  /**
   * Sort layers by z-index
   */
  private sortLayers(): void {
    this.sortedLayers = Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
  }
  
  /**
   * Track render performance
   */
  private trackRenderPerformance(renderTime: number): void {
    this.renderTimes.push(renderTime);
    
    if (this.renderTimes.length > this.maxRenderTimeHistory) {
      this.renderTimes.shift();
    }
    
    // Warn about performance issues
    if (renderTime > 16.67) { // More than one frame at 60fps
      console.debug(`Renderer: Slow frame detected - ${renderTime.toFixed(2)}ms`);
    }
  }
}

// Utility function to create renderer with common configuration
export function createRenderer(canvas: HTMLCanvasElement, config: Partial<RendererConfig> = {}): Renderer {
  return new Renderer({ canvas, ...config });
}

// Export Renderer as default
export default Renderer;