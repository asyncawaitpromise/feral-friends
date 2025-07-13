import { EffectsSystem } from './Effects';
import { Animal } from './Animal';

export interface FeedbackConfig {
  enableScreenShake: boolean;
  enableColorFlashes: boolean;
  enableHighlights: boolean;
  enableParticles: boolean;
  intensityMultiplier: number;
}

export interface ColorFlash {
  color: string;
  intensity: number;
  duration: number;
  startTime: number;
}

export interface Highlight {
  id: string;
  position: { x: number; y: number };
  color: string;
  radius: number;
  intensity: number;
  pulseSpeed: number;
  duration: number;
  startTime: number;
}

export class VisualFeedbackSystem {
  private effectsSystem: EffectsSystem;
  private config: FeedbackConfig;
  private colorFlashes: ColorFlash[] = [];
  private highlights: Map<string, Highlight> = new Map();
  private nextHighlightId: number = 1;

  constructor(effectsSystem: EffectsSystem, config: Partial<FeedbackConfig> = {}) {
    this.effectsSystem = effectsSystem;
    this.config = {
      enableScreenShake: true,
      enableColorFlashes: true,
      enableHighlights: true,
      enableParticles: true,
      intensityMultiplier: 1.0,
      ...config
    };
  }

  // Interaction feedback methods
  onSuccessfulInteraction(animal: Animal, interactionType: string): void {
    const position = animal.position;
    
    if (this.config.enableParticles) {
      // Create appropriate effect based on interaction type
      switch (interactionType) {
        case 'pet':
          this.effectsSystem.createFloatingHeartEffect(position);
          this.triggerColorFlash('#ec4899', 0.3, 400);
          break;
        
        case 'feed':
          this.effectsSystem.createSparkleEffect(position, '#fbbf24');
          this.triggerColorFlash('#f59e0b', 0.2, 300);
          break;
        
        case 'play':
          this.effectsSystem.createSparkleEffect(position, '#8b5cf6');
          if (this.config.enableScreenShake) {
            this.effectsSystem.triggerScreenShake(3, 150);
          }
          break;
        
        case 'talk':
          this.effectsSystem.createEffect('dialogue_appear', position);
          this.triggerColorFlash('#06b6d4', 0.2, 200);
          break;
        
        default:
          this.effectsSystem.createTrustUpEffect(position);
          this.triggerColorFlash('#22c55e', 0.2, 300);
      }
    }

    // Add highlight to show interaction success
    if (this.config.enableHighlights) {
      this.addHighlight(position, '#22c55e', 25, 0.6, 2, 1000);
    }
  }

  onFailedInteraction(animal: Animal, reason: string): void {
    const position = animal.position;
    
    if (this.config.enableParticles) {
      // Create failure effect
      this.effectsSystem.createEffect('puff_smoke', position, {
        color: '#ef4444',
        velocity: { x: 0, y: -1 },
        fadeOut: true
      });
    }

    // Red flash for failure
    if (this.config.enableColorFlashes) {
      this.triggerColorFlash('#ef4444', 0.4, 300);
    }

    // Screen shake for major failures
    if (this.config.enableScreenShake && reason.includes('scared')) {
      this.effectsSystem.triggerScreenShake(4, 200);
    }

    // Warning highlight
    if (this.config.enableHighlights) {
      this.addHighlight(position, '#ef4444', 20, 0.5, 3, 800);
    }
  }

  onAnimalStateChange(animal: Animal, newState: string, oldState: string): void {
    const position = animal.position;
    
    // Visual feedback for important state changes
    switch (newState) {
      case 'fleeing':
        if (this.config.enableParticles) {
          this.effectsSystem.createEffect('puff_smoke', position, {
            color: '#6b7280',
            velocity: { x: 0, y: -0.5 }
          });
        }
        if (this.config.enableColorFlashes) {
          this.triggerColorFlash('#fbbf24', 0.3, 200);
        }
        break;
      
      case 'curious':
        if (this.config.enableHighlights) {
          this.addHighlight(position, '#06b6d4', 30, 0.4, 1.5, 2000);
        }
        break;
      
      case 'feeding':
        if (this.config.enableParticles) {
          this.effectsSystem.createSparkleEffect(position, '#22c55e');
        }
        break;
      
      case 'sleeping':
        if (this.config.enableParticles) {
          // Gentle floating effects for sleeping
          this.effectsSystem.createEffect('floating_heart', position, {
            color: '#8b5cf6',
            velocity: { x: 0, y: -0.5 },
            scale: 0.6
          });
        }
        break;
    }
  }

  onTrustLevelChange(animal: Animal, change: number): void {
    const position = animal.position;
    
    if (Math.abs(change) >= 5) { // Only show for significant changes
      if (change > 0) {
        // Trust increased
        if (this.config.enableParticles) {
          this.effectsSystem.createFloatingHeartEffect(position);
          
          // Extra sparkle for big trust gains
          if (change >= 10) {
            this.effectsSystem.createSparkleEffect(position, '#ec4899');
          }
        }
        
        if (this.config.enableColorFlashes) {
          this.triggerColorFlash('#22c55e', 0.2 + change * 0.02, 400);
        }
      } else {
        // Trust decreased
        if (this.config.enableParticles) {
          this.effectsSystem.createEffect('puff_smoke', position, {
            color: '#ef4444',
            opacity: 0.6
          });
        }
        
        if (this.config.enableColorFlashes) {
          this.triggerColorFlash('#ef4444', 0.3, 300);
        }
      }
    }
  }

  onItemPickup(position: { x: number; y: number }, itemType: string): void {
    if (this.config.enableParticles) {
      const itemColors: Record<string, string> = {
        berry: '#dc2626',
        nut: '#92400e',
        flower: '#ec4899',
        stick: '#78716c',
        treat: '#f59e0b'
      };
      
      const color = itemColors[itemType] || '#fbbf24';
      this.effectsSystem.createItemPickupEffect(position, color);
    }

    if (this.config.enableColorFlashes) {
      this.triggerColorFlash('#f59e0b', 0.2, 200);
    }

    if (this.config.enableScreenShake) {
      this.effectsSystem.triggerScreenShake(2, 100);
    }
  }

  onPlayerMovement(fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }): void {
    // Subtle dust effect when moving
    if (this.config.enableParticles && Math.random() < 0.3) {
      this.effectsSystem.createEffect('puff_smoke', fromPosition, {
        color: '#d1d5db',
        scale: 0.3,
        opacity: 0.4,
        velocity: { x: (Math.random() - 0.5) * 0.5, y: 0 },
        duration: 500
      });
    }
  }

  onEnvironmentalEvent(position: { x: number; y: number }, eventType: string): void {
    switch (eventType) {
      case 'water_splash':
        if (this.config.enableParticles) {
          this.effectsSystem.createRippleEffect(position, '#3b82f6');
        }
        break;
      
      case 'wind_gust':
        if (this.config.enableParticles) {
          // Create multiple falling leaves
          for (let i = 0; i < 3; i++) {
            const leafPosition = {
              x: position.x + (Math.random() - 0.5) * 2,
              y: position.y + (Math.random() - 0.5) * 2
            };
            this.effectsSystem.createFallingLeafEffect(leafPosition);
          }
        }
        break;
      
      case 'flower_bloom':
        if (this.config.enableParticles) {
          this.effectsSystem.createSparkleEffect(position, '#ec4899');
        }
        break;
    }
  }

  // Core feedback methods
  private triggerColorFlash(color: string, intensity: number, duration: number): void {
    if (!this.config.enableColorFlashes) return;
    
    const flash: ColorFlash = {
      color,
      intensity: intensity * this.config.intensityMultiplier,
      duration,
      startTime: Date.now()
    };
    
    this.colorFlashes.push(flash);
  }

  private addHighlight(
    position: { x: number; y: number }, 
    color: string, 
    radius: number, 
    intensity: number, 
    pulseSpeed: number, 
    duration: number
  ): string {
    if (!this.config.enableHighlights) return '';
    
    const id = `highlight_${this.nextHighlightId++}`;
    const highlight: Highlight = {
      id,
      position: { ...position },
      color,
      radius,
      intensity: intensity * this.config.intensityMultiplier,
      pulseSpeed,
      duration,
      startTime: Date.now()
    };
    
    this.highlights.set(id, highlight);
    return id;
  }

  // Interaction zone feedback
  addInteractionZoneHighlight(position: { x: number; y: number }, interactionType: string): string {
    const colors: Record<string, string> = {
      observe: '#3b82f6',
      approach: '#22c55e',
      interact: '#8b5cf6',
      feed: '#f59e0b',
      pet: '#ec4899',
      play: '#06b6d4',
      talk: '#10b981'
    };
    
    const color = colors[interactionType] || '#06b6d4';
    return this.addHighlight(position, color, 35, 0.3, 1, -1); // -1 duration means permanent until removed
  }

  removeHighlight(id: string): void {
    this.highlights.delete(id);
  }

  // Update and render methods
  update(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Update color flashes
    this.colorFlashes = this.colorFlashes.filter(flash => {
      return currentTime - flash.startTime < flash.duration;
    });
    
    // Update highlights
    for (const [id, highlight] of this.highlights.entries()) {
      if (highlight.duration > 0 && currentTime - highlight.startTime > highlight.duration) {
        this.highlights.delete(id);
      }
    }
  }

  renderOverlay(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    // Render color flashes
    this.renderColorFlashes(ctx, canvasWidth, canvasHeight);
  }

  renderHighlights(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, tileSize: number): void {
    if (!this.config.enableHighlights) return;
    
    const currentTime = Date.now();
    
    for (const highlight of this.highlights.values()) {
      const screenX = highlight.position.x * tileSize - camera.x;
      const screenY = highlight.position.y * tileSize - camera.y;
      
      // Calculate pulsing effect
      const elapsed = currentTime - highlight.startTime;
      const pulse = Math.sin(elapsed * highlight.pulseSpeed * 0.01) * 0.5 + 0.5;
      const opacity = highlight.intensity * pulse;
      
      // Create gradient
      const gradient = ctx.createRadialGradient(
        screenX + tileSize / 2, screenY + tileSize / 2, 0,
        screenX + tileSize / 2, screenY + tileSize / 2, highlight.radius
      );
      
      gradient.addColorStop(0, `${highlight.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX + tileSize / 2, screenY + tileSize / 2, highlight.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderColorFlashes(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.config.enableColorFlashes || this.colorFlashes.length === 0) return;
    
    const currentTime = Date.now();
    
    for (const flash of this.colorFlashes) {
      const elapsed = currentTime - flash.startTime;
      const progress = elapsed / flash.duration;
      
      if (progress >= 1) continue;
      
      // Fade out the flash
      const opacity = flash.intensity * (1 - progress);
      
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = `rgba(${this.hexToRgb(flash.color)}, ${opacity})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '255, 255, 255';
    
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): FeedbackConfig {
    return { ...this.config };
  }

  // Cleanup methods
  clearAllFeedback(): void {
    this.colorFlashes = [];
    this.highlights.clear();
  }

  reset(): void {
    this.clearAllFeedback();
  }
}

// Factory function
export function createVisualFeedbackSystem(effectsSystem: EffectsSystem, config?: Partial<FeedbackConfig>): VisualFeedbackSystem {
  return new VisualFeedbackSystem(effectsSystem, config);
}

// Utility functions for common feedback patterns
export function createInteractionFeedback(
  visualFeedback: VisualFeedbackSystem,
  animal: Animal,
  interactionType: string,
  success: boolean,
  trustChange?: number
): void {
  if (success) {
    visualFeedback.onSuccessfulInteraction(animal, interactionType);
    if (trustChange) {
      visualFeedback.onTrustLevelChange(animal, trustChange);
    }
  } else {
    visualFeedback.onFailedInteraction(animal, `Failed ${interactionType}`);
  }
}

export function createDiscoveryFeedback(
  visualFeedback: VisualFeedbackSystem,
  position: { x: number; y: number },
  discoveryType: 'animal' | 'location' | 'item'
): void {
  // Different effects based on what was discovered
  const colors = {
    animal: '#ec4899',
    location: '#8b5cf6',
    item: '#f59e0b'
  };
  
  // Create celebration effect
  const color = colors[discoveryType];
  visualFeedback['effectsSystem'].createSparkleEffect(position, color);
  visualFeedback['triggerColorFlash'](color, 0.3, 500);
}