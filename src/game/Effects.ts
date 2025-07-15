import { TILE_SIZE } from '../constants';

export interface Effect {
  id: string;
  type: EffectType;
  position: { x: number; y: number };
  startTime: number;
  duration: number;
  properties: EffectProperties;
  isActive: boolean;
}

export type EffectType = 
  | 'sparkle'
  | 'ripple'
  | 'falling_leaf'
  | 'floating_heart'
  | 'puff_smoke'
  | 'trust_up'
  | 'fear_down'
  | 'energy_restore'
  | 'screen_shake'
  | 'interaction_glow'
  | 'item_pickup'
  | 'dialogue_appear';

export interface EffectProperties {
  color?: string;
  secondaryColor?: string;
  scale?: number;
  opacity?: number;
  rotation?: number;
  velocity?: { x: number; y: number };
  gravity?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  pulse?: boolean;
  intensity?: number;
  duration?: number;
  particles?: ParticleEffect[];
}

export interface ParticleEffect {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export class EffectsSystem {
  private effects: Map<string, Effect> = new Map();
  private nextEffectId: number = 1;
  private screenShake: { x: number; y: number; intensity: number; duration: number } = { x: 0, y: 0, intensity: 0, duration: 0 };

  constructor() {
    this.effects = new Map();
  }

  // Core effect creation
  createEffect(type: EffectType, position: { x: number; y: number }, properties: Partial<EffectProperties> = {}): string {
    const effectId = `effect_${this.nextEffectId++}`;
    const defaultProperties = this.getDefaultProperties(type);
    
    const effect: Effect = {
      id: effectId,
      type,
      position: { ...position },
      startTime: Date.now(),
      duration: this.getDefaultDuration(type),
      properties: { ...defaultProperties, ...properties },
      isActive: true
    };

    this.effects.set(effectId, effect);
    return effectId;
  }

  // Predefined effect creators
  createSparkleEffect(position: { x: number; y: number }, color: string = '#fbbf24'): string {
    return this.createEffect('sparkle', position, {
      color,
      scale: 0.5,
      fadeIn: true,
      fadeOut: true,
      particles: this.generateSparkleParticles(position, color)
    });
  }

  createRippleEffect(position: { x: number; y: number }, color: string = '#3b82f6'): string {
    return this.createEffect('ripple', position, {
      color,
      scale: 0.1,
      opacity: 0.8,
      fadeOut: true
    });
  }

  createTrustUpEffect(position: { x: number; y: number }): string {
    return this.createEffect('trust_up', position, {
      color: '#22c55e',
      velocity: { x: 0, y: -2 },
      fadeIn: true,
      fadeOut: true,
      pulse: true
    });
  }

  createFloatingHeartEffect(position: { x: number; y: number }): string {
    return this.createEffect('floating_heart', position, {
      color: '#ec4899',
      velocity: { x: (Math.random() - 0.5) * 2, y: -1.5 },
      gravity: -0.1,
      fadeIn: true,
      fadeOut: true,
      scale: 0.8
    });
  }

  createItemPickupEffect(position: { x: number; y: number }, itemColor: string = '#fbbf24'): string {
    return this.createEffect('item_pickup', position, {
      color: itemColor,
      velocity: { x: 0, y: -3 },
      scale: 1.2,
      fadeIn: true,
      fadeOut: true,
      particles: this.generatePickupParticles(position, itemColor)
    });
  }

  createInteractionGlowEffect(position: { x: number; y: number }, intensity: number = 1): string {
    return this.createEffect('interaction_glow', position, {
      color: '#06b6d4',
      scale: 1 + intensity * 0.5,
      opacity: 0.6,
      pulse: true,
      intensity
    });
  }

  createFallingLeafEffect(position: { x: number; y: number }): string {
    const leafColors = ['#22c55e', '#16a34a', '#15803d', '#166534'];
    return this.createEffect('falling_leaf', position, {
      color: leafColors[Math.floor(Math.random() * leafColors.length)],
      velocity: { 
        x: (Math.random() - 0.5) * 1.5, 
        y: Math.random() * 0.5 + 0.5 
      },
      gravity: 0.02,
      rotation: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.4
    });
  }

  // Screen shake effect
  triggerScreenShake(intensity: number = 5, duration: number = 200): void {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  getScreenShakeOffset(): { x: number; y: number } {
    if (this.screenShake.duration <= 0) {
      return { x: 0, y: 0 };
    }

    const intensity = this.screenShake.intensity * (this.screenShake.duration / 200);
    return {
      x: (Math.random() - 0.5) * intensity,
      y: (Math.random() - 0.5) * intensity
    };
  }

  // Update all effects
  update(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Update screen shake
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      const progress = Math.max(0, this.screenShake.duration / 200);
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * progress;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * progress;
    }

    // Update individual effects
    for (const [id, effect] of this.effects.entries()) {
      if (!effect.isActive) continue;

      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(1, elapsed / effect.duration);

      // Update effect properties based on type
      this.updateEffectProperties(effect, progress, deltaTime);

      // Remove completed effects
      if (progress >= 1) {
        this.effects.delete(id);
      }
    }
  }

  private updateEffectProperties(effect: Effect, progress: number, deltaTime: number): void {
    const props = effect.properties;

    // Update position with velocity and gravity
    if (props.velocity) {
      effect.position.x += props.velocity.x * deltaTime / 16; // Normalize to 60fps
      effect.position.y += props.velocity.y * deltaTime / 16;
      
      if (props.gravity) {
        props.velocity.y += props.gravity * deltaTime / 16;
      }
    }

    // Update rotation
    if (props.rotation !== undefined) {
      props.rotation += deltaTime * 0.1; // Slow rotation
    }

    // Update opacity based on fade settings
    if (props.fadeIn && progress < 0.3) {
      props.opacity = progress / 0.3;
    } else if (props.fadeOut && progress > 0.7) {
      props.opacity = 1 - ((progress - 0.7) / 0.3);
    }

    // Update scale for certain effects
    switch (effect.type) {
      case 'ripple':
        props.scale = progress * 3;
        props.opacity = 1 - progress;
        break;
      
      case 'sparkle':
        props.scale = 0.5 + Math.sin(progress * Math.PI) * 0.3;
        break;
        
      case 'interaction_glow':
        if (props.pulse) {
          const pulseProgress = (Date.now() / 1000) % 2;
          props.scale = (props.intensity || 1) * (1 + Math.sin(pulseProgress * Math.PI) * 0.2);
        }
        break;
    }

    // Update particles
    if (props.particles) {
      this.updateParticles(props.particles, deltaTime);
    }
  }

  private updateParticles(particles: ParticleEffect[], deltaTime: number): void {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update position
      particle.position.x += particle.velocity.x * deltaTime / 16;
      particle.position.y += particle.velocity.y * deltaTime / 16;
      
      // Update life
      particle.life -= deltaTime;
      particle.alpha = particle.life / particle.maxLife;
      
      // Remove dead particles
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // Render all effects
  render(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }): void {
    ctx.save();
    
    // Apply screen shake
    const shakeOffset = this.getScreenShakeOffset();
    ctx.translate(shakeOffset.x, shakeOffset.y);

    for (const effect of this.effects.values()) {
      if (!effect.isActive) continue;
      this.renderEffect(ctx, effect, camera);
    }

    ctx.restore();
  }

  private renderEffect(ctx: CanvasRenderingContext2D, effect: Effect, camera: { x: number; y: number }): void {
    const screenX = effect.position.x * TILE_SIZE - camera.x;
    const screenY = effect.position.y * TILE_SIZE - camera.y;
    const props = effect.properties;

    ctx.save();
    ctx.translate(screenX, screenY);
    
    if (props.scale) {
      ctx.scale(props.scale, props.scale);
    }
    
    if (props.rotation) {
      ctx.rotate(props.rotation * Math.PI / 180);
    }
    
    if (props.opacity !== undefined) {
      ctx.globalAlpha = props.opacity;
    }

    // Render based on effect type
    switch (effect.type) {
      case 'sparkle':
        this.renderSparkle(ctx, props);
        break;
      case 'ripple':
        this.renderRipple(ctx, props);
        break;
      case 'floating_heart':
        this.renderHeart(ctx, props);
        break;
      case 'trust_up':
        this.renderTrustUp(ctx, props);
        break;
      case 'falling_leaf':
        this.renderLeaf(ctx, props);
        break;
      case 'interaction_glow':
        this.renderGlow(ctx, props);
        break;
      case 'item_pickup':
        this.renderItemPickup(ctx, props);
        break;
    }

    // Render particles
    if (props.particles) {
      this.renderParticles(ctx, props.particles);
    }

    ctx.restore();
  }

  private renderSparkle(ctx: CanvasRenderingContext2D, props: EffectProperties): void {
    ctx.fillStyle = props.color || '#fbbf24';
    
    // Star shape
    const spikes = 8;
    const outerRadius = 12;
    const innerRadius = 6;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderRipple(ctx: CanvasRenderingContext2D, props: EffectProperties): void {
    ctx.strokeStyle = props.color || '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderHeart(ctx: CanvasRenderingContext2D, props: EffectProperties): void {
    ctx.fillStyle = props.color || '#ec4899';
    
    // Simple heart shape
    const size = 8;
    ctx.beginPath();
    ctx.arc(-size/2, -size/3, size/2, 0, Math.PI * 2);
    ctx.arc(size/2, -size/3, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(size, 0);
    ctx.closePath();
    ctx.fill();
  }

  private renderTrustUp(ctx: CanvasRenderingContext2D, props: EffectProperties): void {
    ctx.fillStyle = props.color || '#22c55e';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+Trust', 0, 0);
  }

  private renderLeaf(ctx: CanvasRenderingContext2D, props: EffectProperties): void {
    ctx.fillStyle = props.color || '#22c55e';
    
    // Simple leaf shape
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Leaf vein
    ctx.strokeStyle = props.secondaryColor || '#16a34a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.stroke();
  }

  private renderGlow(ctx: CanvasRenderingContext2D, props: EffectProperties): void {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    gradient.addColorStop(0, props.color || '#06b6d4');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderItemPickup(ctx: CanvasRenderingContext2D, props: EffectProperties): void {
    ctx.fillStyle = props.color || '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine effect
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-3, -3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderParticles(ctx: CanvasRenderingContext2D, particles: ParticleEffect[]): void {
    for (const particle of particles) {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Particle generators
  private generateSparkleParticles(position: { x: number; y: number }, color: string): ParticleEffect[] {
    const particles: ParticleEffect[] = [];
    
    for (let i = 0; i < 8; i++) {
      particles.push({
        position: { x: 0, y: 0 },
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4
        },
        life: 1000 + Math.random() * 500,
        maxLife: 1500,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1
      });
    }
    
    return particles;
  }

  private generatePickupParticles(position: { x: number; y: number }, color: string): ParticleEffect[] {
    const particles: ParticleEffect[] = [];
    
    for (let i = 0; i < 6; i++) {
      particles.push({
        position: { x: 0, y: 0 },
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: -Math.random() * 3
        },
        life: 800 + Math.random() * 400,
        maxLife: 1200,
        size: 1 + Math.random() * 2,
        color,
        alpha: 1
      });
    }
    
    return particles;
  }

  // Helper methods
  private getDefaultProperties(type: EffectType): EffectProperties {
    const defaults: Record<EffectType, EffectProperties> = {
      sparkle: { color: '#fbbf24', scale: 1, opacity: 1 },
      ripple: { color: '#3b82f6', scale: 0.1, opacity: 0.8 },
      falling_leaf: { color: '#22c55e', scale: 1, opacity: 1, gravity: 0.02 },
      floating_heart: { color: '#ec4899', scale: 1, opacity: 1 },
      puff_smoke: { color: '#9ca3af', scale: 1, opacity: 0.7 },
      trust_up: { color: '#22c55e', scale: 1, opacity: 1 },
      fear_down: { color: '#3b82f6', scale: 1, opacity: 1 },
      energy_restore: { color: '#f59e0b', scale: 1, opacity: 1 },
      screen_shake: { intensity: 5 },
      interaction_glow: { color: '#06b6d4', scale: 1, opacity: 0.6 },
      item_pickup: { color: '#fbbf24', scale: 1, opacity: 1 },
      dialogue_appear: { color: '#8b5cf6', scale: 0.8, opacity: 0, fadeIn: true }
    };
    
    return defaults[type] || { scale: 1, opacity: 1 };
  }

  private getDefaultDuration(type: EffectType): number {
    const durations: Record<EffectType, number> = {
      sparkle: 1500,
      ripple: 800,
      falling_leaf: 3000,
      floating_heart: 2000,
      puff_smoke: 1200,
      trust_up: 1500,
      fear_down: 1500,
      energy_restore: 1200,
      screen_shake: 200,
      interaction_glow: 2000,
      item_pickup: 1000,
      dialogue_appear: 500
    };
    
    return durations[type] || 1000;
  }

  // Cleanup
  clearAllEffects(): void {
    this.effects.clear();
  }

  removeEffect(id: string): void {
    this.effects.delete(id);
  }

  getActiveEffectsCount(): number {
    return this.effects.size;
  }
}

// Factory function
export function createEffectsSystem(): EffectsSystem {
  return new EffectsSystem();
}