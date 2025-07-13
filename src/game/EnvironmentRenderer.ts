// Environment Renderer
// Handles visual rendering of environment objects with polish effects

import { Position } from '../types/game';
import { MapObject } from './MapObjects';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  cameraOffset: Position;
  tileSize: number;
  currentTime: number;
  playerPosition: Position;
  lightLevel: number; // 0-1, affects shadows and brightness
  weatherEffect?: 'none' | 'rain' | 'snow' | 'fog';
}

export interface ShadowConfig {
  enabled: boolean;
  offsetX: number;
  offsetY: number;
  blur: number;
  opacity: number;
  color: string;
}

export interface LightingConfig {
  ambientLight: number; // 0-1
  directionalLight: {
    angle: number; // degrees
    intensity: number; // 0-1
    color: string;
  };
  shadows: ShadowConfig;
}

export class EnvironmentRenderer {
  private lightingConfig: LightingConfig;
  private particleEffects: Map<string, ParticleSystem>;

  constructor() {
    this.lightingConfig = {
      ambientLight: 0.8,
      directionalLight: {
        angle: 135, // Top-left lighting
        intensity: 0.6,
        color: '#fff3cd'
      },
      shadows: {
        enabled: true,
        offsetX: 2,
        offsetY: 2,
        blur: 3,
        opacity: 0.3,
        color: '#000000'
      }
    };
    
    this.particleEffects = new Map();
  }

  /**
   * Render all environment objects with visual polish
   */
  renderEnvironmentObjects(
    objects: MapObject[],
    context: RenderContext
  ): void {
    // Sort objects by z-index for proper depth rendering
    const sortedObjects = [...objects].sort((a, b) => {
      const aZ = a.visual.zIndex || 1;
      const bZ = b.visual.zIndex || 1;
      
      // If same z-index, sort by Y position for depth illusion
      if (aZ === bZ) {
        return a.position.y - b.position.y;
      }
      
      return aZ - bZ;
    });

    // Render shadows first (bottom layer)
    if (this.lightingConfig.shadows.enabled) {
      sortedObjects.forEach(obj => {
        if (this.shouldRenderShadow(obj)) {
          this.renderObjectShadow(obj, context);
        }
      });
    }

    // Render objects
    sortedObjects.forEach(obj => {
      this.renderEnvironmentObject(obj, context);
    });

    // Render particle effects (top layer)
    this.renderParticleEffects(context);
  }

  /**
   * Render a single environment object
   */
  private renderEnvironmentObject(
    object: MapObject,
    context: RenderContext
  ): void {
    const { ctx, cameraOffset, tileSize, currentTime } = context;

    // Calculate screen position
    const screenX = (object.position.x * tileSize) - cameraOffset.x;
    const screenY = (object.position.y * tileSize) - cameraOffset.y;

    // Skip if object is off-screen
    if (this.isOffScreen(screenX, screenY, object.size, tileSize, ctx)) {
      return;
    }

    // Apply lighting effects
    this.applyLighting(object, context);

    // Render based on object type
    switch (object.type) {
      case 'tree':
        this.renderTree(object, screenX, screenY, tileSize, ctx, currentTime);
        break;
      
      case 'rock':
      case 'ancient_stone':
        this.renderRock(object, screenX, screenY, tileSize, ctx, currentTime);
        break;
      
      case 'flower':
        this.renderFlower(object, screenX, screenY, tileSize, ctx, currentTime);
        break;
      
      case 'bush':
      case 'berry_bush':
        this.renderBush(object, screenX, screenY, tileSize, ctx, currentTime);
        break;
      
      case 'water_source':
        this.renderWaterSource(object, screenX, screenY, tileSize, ctx, currentTime);
        break;
      
      case 'mushroom':
        this.renderMushroom(object, screenX, screenY, tileSize, ctx, currentTime);
        break;
      
      case 'log':
        this.renderLog(object, screenX, screenY, tileSize, ctx, currentTime);
        break;
      
      default:
        this.renderGenericObject(object, screenX, screenY, tileSize, ctx, currentTime);
    }

    // Add interaction highlight if player is nearby
    this.renderInteractionHighlight(object, context);

    // Update particle effects
    this.updateObjectParticles(object, screenX, screenY, currentTime);
  }

  /**
   * Render tree objects with swaying animation
   */
  private renderTree(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const size = this.getSizeMultiplier(object.visual.size);
    const width = tileSize * size;
    const height = tileSize * size * 1.2; // Trees are taller

    // Calculate sway animation
    const swayAmount = object.visual.animation === 'sway' ? 
      Math.sin(time * 0.001 + object.position.x * 0.1) * 2 : 0;

    // Draw trunk
    ctx.fillStyle = object.visual.secondaryColor || '#8b4513';
    const trunkWidth = width * 0.3;
    const trunkHeight = height * 0.6;
    ctx.fillRect(
      x + (tileSize - trunkWidth) / 2 + swayAmount * 0.3,
      y + tileSize - trunkHeight,
      trunkWidth,
      trunkHeight
    );

    // Draw foliage
    ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
    ctx.beginPath();
    ctx.ellipse(
      x + tileSize / 2 + swayAmount,
      y + (tileSize - height) / 2,
      width / 2,
      height / 3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Add highlight for different tree types
    if (object.visual.pattern === 'striped') {
      // Birch bark stripes
      ctx.strokeStyle = object.visual.secondaryColor || '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const stripeY = y + tileSize - trunkHeight + (i * trunkHeight / 3);
        ctx.beginPath();
        ctx.moveTo(x + (tileSize - trunkWidth) / 2, stripeY);
        ctx.lineTo(x + (tileSize + trunkWidth) / 2, stripeY);
        ctx.stroke();
      }
    }
  }

  /**
   * Render rock objects with texture
   */
  private renderRock(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const size = this.getSizeMultiplier(object.visual.size);
    const width = tileSize * size * 0.8;
    const height = tileSize * size * 0.6;

    // Pulsing animation for ancient stones
    const pulse = object.visual.animation === 'pulse' ? 
      1 + Math.sin(time * 0.002) * 0.1 : 1;

    ctx.save();
    ctx.translate(x + tileSize / 2, y + tileSize / 2);
    ctx.scale(pulse, pulse);

    // Draw main rock shape
    ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
    ctx.beginPath();
    ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Add texture based on pattern
    if (object.visual.pattern === 'gradient' || object.visual.secondaryColor) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width / 2);
      gradient.addColorStop(0, object.visual.secondaryColor || '#ffffff');
      gradient.addColorStop(1, object.visual.color);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, width / 3, height / 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Render flower objects with bobbing animation
   */
  private renderFlower(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const bobOffset = object.visual.animation === 'bob' ? 
      Math.sin(time * 0.003 + object.position.x * 0.2) * 1 : 0;

    const size = this.getSizeMultiplier(object.visual.size);
    const flowerSize = tileSize * size * 0.4;

    // Draw multiple flowers in a patch
    const flowerCount = object.visual.pattern === 'dotted' ? 5 : 3;
    
    for (let i = 0; i < flowerCount; i++) {
      const offsetX = (Math.random() - 0.5) * tileSize * 0.6;
      const offsetY = (Math.random() - 0.5) * tileSize * 0.6;
      const flowerX = x + tileSize / 2 + offsetX;
      const flowerY = y + tileSize / 2 + offsetY + bobOffset;

      // Draw flower petals
      ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, flowerSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw flower center
      if (object.visual.secondaryColor) {
        ctx.fillStyle = object.visual.secondaryColor;
        ctx.beginPath();
        ctx.arc(flowerX, flowerY, flowerSize / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Render bush objects
   */
  private renderBush(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const size = this.getSizeMultiplier(object.visual.size);
    const bushWidth = tileSize * size * 0.9;
    const bushHeight = tileSize * size * 0.7;

    // Draw main bush shape
    ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
    ctx.beginPath();
    
    // Create irregular bush shape
    const centerX = x + tileSize / 2;
    const centerY = y + tileSize * 0.7;
    
    for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
      const radius = (bushWidth / 2) * (0.8 + Math.sin(angle * 3) * 0.2);
      const pointX = centerX + Math.cos(angle) * radius;
      const pointY = centerY + Math.sin(angle) * radius * 0.6;
      
      if (angle === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Add berries if it's a berry bush
    if (object.type === 'berry_bush' && object.visual.secondaryColor) {
      ctx.fillStyle = object.visual.secondaryColor;
      
      for (let i = 0; i < 6; i++) {
        const berryX = centerX + (Math.random() - 0.5) * bushWidth * 0.6;
        const berryY = centerY + (Math.random() - 0.5) * bushHeight * 0.4;
        
        ctx.beginPath();
        ctx.arc(berryX, berryY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Render water source with sparkle animation
   */
  private renderWaterSource(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const width = tileSize * object.size.width;
    const height = tileSize * object.size.height;

    // Draw water base
    ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Add sparkle effect
    if (object.visual.animation === 'sparkle') {
      const sparkleCount = 8;
      for (let i = 0; i < sparkleCount; i++) {
        const sparklePhase = (time * 0.005 + i * 0.8) % (Math.PI * 2);
        const sparkleOpacity = (Math.sin(sparklePhase) + 1) / 2;
        
        if (sparkleOpacity > 0.5) {
          const sparkleX = x + width * (0.2 + 0.6 * Math.random());
          const sparkleY = y + height * (0.2 + 0.6 * Math.random());
          
          ctx.fillStyle = `rgba(255, 255, 255, ${sparkleOpacity * 0.8})`;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Add water reflection
    if (object.visual.secondaryColor) {
      const gradient = ctx.createRadialGradient(
        x + width / 2, y + height / 2, 0,
        x + width / 2, y + height / 2, width / 2
      );
      gradient.addColorStop(0, object.visual.secondaryColor);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(
        x + width / 2,
        y + height / 2,
        width / 3,
        height / 3,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  /**
   * Render mushroom with pulsing glow
   */
  private renderMushroom(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const size = this.getSizeMultiplier(object.visual.size);
    const mushroomSize = tileSize * size * 0.6;

    const pulse = object.visual.animation === 'pulse' ? 
      0.8 + Math.sin(time * 0.003) * 0.2 : 1;

    // Draw mushroom stem
    ctx.fillStyle = object.visual.secondaryColor || '#f5f5dc';
    const stemWidth = mushroomSize * 0.3;
    const stemHeight = mushroomSize * 0.6;
    ctx.fillRect(
      x + (tileSize - stemWidth) / 2,
      y + tileSize - stemHeight,
      stemWidth,
      stemHeight
    );

    // Draw mushroom cap
    ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
    ctx.beginPath();
    ctx.ellipse(
      x + tileSize / 2,
      y + tileSize - stemHeight,
      mushroomSize / 2 * pulse,
      mushroomSize / 3 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Add spots for dotted pattern
    if (object.visual.pattern === 'dotted') {
      ctx.fillStyle = object.visual.secondaryColor || '#ffffff';
      for (let i = 0; i < 5; i++) {
        const spotX = x + tileSize / 2 + (Math.random() - 0.5) * mushroomSize * 0.6;
        const spotY = y + tileSize - stemHeight + (Math.random() - 0.5) * mushroomSize * 0.3;
        
        ctx.beginPath();
        ctx.arc(spotX, spotY, 1 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Render fallen log
   */
  private renderLog(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const width = tileSize * object.size.width;
    const height = tileSize * object.size.height * 0.3; // Logs are flat

    // Draw log body
    ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
    ctx.fillRect(x, y + tileSize - height, width, height);

    // Add wood texture lines
    ctx.strokeStyle = this.adjustColorForLighting('#654321');
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 3; i++) {
      const lineY = y + tileSize - height + (i + 1) * height / 4;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + width, lineY);
      ctx.stroke();
    }
  }

  /**
   * Render generic objects
   */
  private renderGenericObject(
    object: MapObject,
    x: number,
    y: number,
    tileSize: number,
    ctx: CanvasRenderingContext2D,
    time: number
  ): void {
    const width = tileSize * object.size.width * 0.8;
    const height = tileSize * object.size.height * 0.8;

    ctx.fillStyle = this.adjustColorForLighting(object.visual.color);
    ctx.fillRect(
      x + (tileSize - width) / 2,
      y + (tileSize - height) / 2,
      width,
      height
    );
  }

  // Helper methods

  private getSizeMultiplier(size?: string): number {
    switch (size) {
      case 'small': return 0.6;
      case 'large': return 1.4;
      default: return 1.0;
    }
  }

  private adjustColorForLighting(color: string): string {
    // Simple lighting adjustment - could be enhanced with proper color mixing
    const lightLevel = this.lightingConfig.ambientLight;
    if (lightLevel >= 1) return color;
    
    // Darken the color based on light level
    const darkenFactor = lightLevel * 0.7 + 0.3; // Never go below 30% brightness
    
    // This is a simplified approach - in a real implementation you'd parse and adjust RGB values
    return color;
  }

  private shouldRenderShadow(object: MapObject): boolean {
    return object.visual.zIndex > 1 && object.visual.size !== 'small';
  }

  private renderObjectShadow(object: MapObject, context: RenderContext): void {
    const { ctx, cameraOffset, tileSize } = context;
    const shadows = this.lightingConfig.shadows;

    const screenX = (object.position.x * tileSize) - cameraOffset.x + shadows.offsetX;
    const screenY = (object.position.y * tileSize) - cameraOffset.y + shadows.offsetY;

    const width = tileSize * object.size.width * 0.8;
    const height = tileSize * object.size.height * 0.3; // Flat shadow

    ctx.save();
    ctx.globalAlpha = shadows.opacity;
    ctx.fillStyle = shadows.color;
    
    if (shadows.blur > 0) {
      ctx.filter = `blur(${shadows.blur}px)`;
    }

    ctx.fillRect(screenX, screenY + tileSize - height, width, height);
    ctx.restore();
  }

  private renderInteractionHighlight(object: MapObject, context: RenderContext): void {
    if (!object.interactable) return;

    const { ctx, cameraOffset, tileSize, playerPosition } = context;
    
    // Check if player is nearby
    const distance = Math.sqrt(
      Math.pow(object.position.x - playerPosition.x, 2) + 
      Math.pow(object.position.y - playerPosition.y, 2)
    );

    if (distance <= object.interaction.radius) {
      const screenX = (object.position.x * tileSize) - cameraOffset.x;
      const screenY = (object.position.y * tileSize) - cameraOffset.y;
      const width = tileSize * object.size.width;
      const height = tileSize * object.size.height;

      // Draw subtle highlight
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - 2, screenY - 2, width + 4, height + 4);
      ctx.restore();
    }
  }

  private isOffScreen(
    x: number,
    y: number,
    size: { width: number; height: number },
    tileSize: number,
    ctx: CanvasRenderingContext2D
  ): boolean {
    const objWidth = size.width * tileSize;
    const objHeight = size.height * tileSize;
    
    return x + objWidth < 0 || 
           x > ctx.canvas.width || 
           y + objHeight < 0 || 
           y > ctx.canvas.height;
  }

  private applyLighting(object: MapObject, context: RenderContext): void {
    // Placeholder for more advanced lighting effects
    // Could adjust object colors based on time of day, weather, etc.
  }

  private renderParticleEffects(context: RenderContext): void {
    // Render any active particle systems
    for (const [objectId, particleSystem] of this.particleEffects) {
      particleSystem.render(context.ctx);
    }
  }

  private updateObjectParticles(object: MapObject, x: number, y: number, time: number): void {
    // Update particle effects for objects that have them
    if (object.mechanics.particles) {
      // Implementation would depend on specific particle system
    }
  }
}

// Simple particle system for effects
class ParticleSystem {
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
  }> = [];

  addParticle(x: number, y: number, color: string = '#ffffff') {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      maxLife: 60, // frames
      color
    });
  }

  update() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1 / particle.maxLife;
      return particle.life > 0;
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

export default EnvironmentRenderer;