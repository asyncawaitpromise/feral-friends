export interface MapEffectConfig {
  enableWaterAnimation: boolean;
  enableGrassSwaying: boolean;
  enableCloudMovement: boolean;
  enableWeatherEffects: boolean;
  enableAmbientParticles: boolean;
  animationIntensity: number;
  performanceMode: 'high' | 'medium' | 'low';
}

export interface WaterTile {
  x: number;
  y: number;
  waveOffset: number;
  rippleStrength: number;
  lastRipple: number;
}

export interface GrassTile {
  x: number;
  y: number;
  swayOffset: number;
  windStrength: number;
  grassType: 'short' | 'medium' | 'tall';
}

export interface CloudElement {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  speed: number;
  cloudType: 'wispy' | 'fluffy' | 'storm';
}

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'pollen' | 'dust' | 'leaf' | 'sparkle' | 'snow';
}

export class MapEffectsSystem {
  private config: MapEffectConfig;
  private waterTiles: Map<string, WaterTile> = new Map();
  private grassTiles: Map<string, GrassTile> = new Map();
  private clouds: CloudElement[] = [];
  private ambientParticles: AmbientParticle[] = [];
  private windDirection: { x: number; y: number } = { x: 0.5, y: 0.1 };
  private windStrength: number = 1;
  private timeOfDay: number = 0.5; // 0 = midnight, 0.5 = noon, 1 = midnight
  private weather: 'clear' | 'cloudy' | 'rainy' | 'windy' | 'snowy' = 'clear';

  constructor(config: Partial<MapEffectConfig> = {}) {
    this.config = {
      enableWaterAnimation: true,
      enableGrassSwaying: true,
      enableCloudMovement: true,
      enableWeatherEffects: true,
      enableAmbientParticles: true,
      animationIntensity: 1.0,
      performanceMode: 'medium',
      ...config
    };

    this.initializeClouds();
  }

  // Initialization methods
  initializeMapEffects(mapData: any): void {
    this.waterTiles.clear();
    this.grassTiles.clear();
    this.ambientParticles = [];

    // Scan map for different terrain types
    if (mapData && mapData.terrain) {
      this.scanTerrainForEffects(mapData);
    }
  }

  private scanTerrainForEffects(mapData: any): void {
    const { width, height, terrain } = mapData;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileIndex = y * width + x;
        const terrainType = terrain[tileIndex];
        
        switch (terrainType) {
          case 'water':
            this.addWaterTile(x, y);
            break;
          case 'grass':
          case 'forest':
            this.addGrassTile(x, y, this.getGrassType(terrainType));
            break;
        }
      }
    }
  }

  private addWaterTile(x: number, y: number): void {
    const key = `${x},${y}`;
    this.waterTiles.set(key, {
      x,
      y,
      waveOffset: Math.random() * Math.PI * 2,
      rippleStrength: 0,
      lastRipple: 0
    });
  }

  private addGrassTile(x: number, y: number, grassType: 'short' | 'medium' | 'tall'): void {
    const key = `${x},${y}`;
    this.grassTiles.set(key, {
      x,
      y,
      swayOffset: Math.random() * Math.PI * 2,
      windStrength: 0.5 + Math.random() * 0.5,
      grassType
    });
  }

  private getGrassType(terrainType: string): 'short' | 'medium' | 'tall' {
    switch (terrainType) {
      case 'forest': return 'tall';
      case 'grass': return Math.random() < 0.7 ? 'short' : 'medium';
      default: return 'short';
    }
  }

  private initializeClouds(): void {
    if (!this.config.enableCloudMovement) return;

    const cloudCount = this.config.performanceMode === 'high' ? 8 : 
                      this.config.performanceMode === 'medium' ? 5 : 3;

    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        x: Math.random() * 2000 - 500, // Start some clouds off-screen
        y: Math.random() * 200 + 50,
        width: 80 + Math.random() * 120,
        height: 40 + Math.random() * 60,
        opacity: 0.3 + Math.random() * 0.4,
        speed: 0.1 + Math.random() * 0.3,
        cloudType: Math.random() < 0.6 ? 'fluffy' : Math.random() < 0.8 ? 'wispy' : 'storm'
      });
    }
  }

  // Update methods
  update(deltaTime: number, gameTime: number): void {
    this.updateTimeAndWeather(gameTime);
    
    if (this.config.enableWaterAnimation) {
      this.updateWaterEffects(deltaTime);
    }
    
    if (this.config.enableGrassSwaying) {
      this.updateGrassEffects(deltaTime);
    }
    
    if (this.config.enableCloudMovement) {
      this.updateClouds(deltaTime);
    }
    
    if (this.config.enableAmbientParticles) {
      this.updateAmbientParticles(deltaTime);
      this.spawnAmbientParticles();
    }

    this.updateWind(deltaTime);
  }

  private updateTimeAndWeather(gameTime: number): void {
    // Simple day/night cycle (could be expanded)
    this.timeOfDay = (gameTime * 0.0001) % 1;
    
    // Simple weather changes
    if (Math.random() < 0.001) { // Rare weather changes
      const weathers: typeof this.weather[] = ['clear', 'cloudy', 'windy'];
      this.weather = weathers[Math.floor(Math.random() * weathers.length)];
    }
  }

  private updateWaterEffects(deltaTime: number): void {
    const time = Date.now() * 0.001;
    
    for (const water of this.waterTiles.values()) {
      // Update wave animation
      water.waveOffset = (time * 2 + water.x * 0.1 + water.y * 0.05) % (Math.PI * 2);
      
      // Decay ripples
      if (water.rippleStrength > 0) {
        water.rippleStrength -= deltaTime * 0.002;
        water.rippleStrength = Math.max(0, water.rippleStrength);
      }
    }
  }

  private updateGrassEffects(deltaTime: number): void {
    const time = Date.now() * 0.001;
    
    for (const grass of this.grassTiles.values()) {
      // Wind-based swaying
      const windEffect = this.windStrength * grass.windStrength;
      grass.swayOffset = Math.sin(time * 1.5 + grass.x * 0.1) * windEffect * this.config.animationIntensity;
    }
  }

  private updateClouds(deltaTime: number): void {
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * this.windDirection.x * deltaTime * 0.1;
      cloud.y += cloud.speed * this.windDirection.y * deltaTime * 0.05;
      
      // Wrap clouds around screen
      if (cloud.x > 1200) {
        cloud.x = -cloud.width;
        cloud.y = Math.random() * 200 + 50;
      }
    }
  }

  private updateAmbientParticles(deltaTime: number): void {
    for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
      const particle = this.ambientParticles[i];
      
      // Update position
      particle.x += particle.vx * deltaTime * 0.1;
      particle.y += particle.vy * deltaTime * 0.1;
      
      // Apply wind
      particle.vx += this.windDirection.x * this.windStrength * deltaTime * 0.001;
      particle.vy += this.windDirection.y * this.windStrength * deltaTime * 0.001;
      
      // Update life
      particle.life -= deltaTime;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.ambientParticles.splice(i, 1);
      }
    }
  }

  private spawnAmbientParticles(): void {
    if (this.ambientParticles.length >= this.getMaxParticles()) return;
    
    if (Math.random() < this.getParticleSpawnRate()) {
      const particleType = this.getRandomParticleType();
      const particle = this.createAmbientParticle(particleType);
      this.ambientParticles.push(particle);
    }
  }

  private updateWind(deltaTime: number): void {
    // Gradually change wind direction and strength
    const time = Date.now() * 0.0001;
    this.windDirection.x = Math.sin(time) * 0.5 + 0.5;
    this.windDirection.y = Math.cos(time * 0.7) * 0.2;
    
    // Weather affects wind strength
    switch (this.weather) {
      case 'windy':
        this.windStrength = 1.5 + Math.sin(time * 5) * 0.5;
        break;
      case 'clear':
        this.windStrength = 0.5 + Math.sin(time * 2) * 0.3;
        break;
      default:
        this.windStrength = 0.8 + Math.sin(time * 3) * 0.2;
    }
  }

  // Rendering methods
  renderWaterEffects(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, tileSize: number): void {
    if (!this.config.enableWaterAnimation) return;
    
    ctx.save();
    
    for (const water of this.waterTiles.values()) {
      const screenX = water.x * tileSize - camera.x;
      const screenY = water.y * tileSize - camera.y;
      
      // Skip off-screen tiles
      if (screenX < -tileSize || screenX > ctx.canvas.width || 
          screenY < -tileSize || screenY > ctx.canvas.height) {
        continue;
      }
      
      this.renderWaterTile(ctx, screenX, screenY, tileSize, water);
    }
    
    ctx.restore();
  }

  private renderWaterTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, water: WaterTile): void {
    // Base water color
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x, y, size, size);
    
    // Wave effect
    const waveHeight = Math.sin(water.waveOffset) * 3 * this.config.animationIntensity;
    
    // Lighter water surface
    ctx.fillStyle = `rgba(96, 165, 250, ${0.6 + Math.sin(water.waveOffset) * 0.1})`;
    ctx.fillRect(x, y + waveHeight, size, size - Math.abs(waveHeight));
    
    // Ripples
    if (water.rippleStrength > 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${water.rippleStrength})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.3 * water.rippleStrength, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderGrassEffects(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, tileSize: number): void {
    if (!this.config.enableGrassSwaying) return;
    
    ctx.save();
    
    for (const grass of this.grassTiles.values()) {
      const screenX = grass.x * tileSize - camera.x;
      const screenY = grass.y * tileSize - camera.y;
      
      // Skip off-screen tiles
      if (screenX < -tileSize || screenX > ctx.canvas.width || 
          screenY < -tileSize || screenY > ctx.canvas.height) {
        continue;
      }
      
      this.renderGrassTile(ctx, screenX, screenY, tileSize, grass);
    }
    
    ctx.restore();
  }

  private renderGrassTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, grass: GrassTile): void {
    // Base grass color
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x, y, size, size);
    
    // Swaying grass blades
    const bladeCount = grass.grassType === 'tall' ? 8 : grass.grassType === 'medium' ? 5 : 3;
    const maxHeight = grass.grassType === 'tall' ? size * 0.8 : grass.grassType === 'medium' ? size * 0.5 : size * 0.3;
    
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < bladeCount; i++) {
      const bladeX = x + (i + 1) * (size / (bladeCount + 1));
      const swayAmount = grass.swayOffset * (i * 0.5 + 1) * this.config.animationIntensity;
      
      ctx.beginPath();
      ctx.moveTo(bladeX, y + size);
      ctx.lineTo(bladeX + swayAmount, y + size - maxHeight);
      ctx.stroke();
    }
  }

  renderClouds(ctx: CanvasRenderingContext2D): void {
    if (!this.config.enableCloudMovement) return;
    
    ctx.save();
    
    for (const cloud of this.clouds) {
      this.renderCloud(ctx, cloud);
    }
    
    ctx.restore();
  }

  private renderCloud(ctx: CanvasRenderingContext2D, cloud: CloudElement): void {
    ctx.save();
    ctx.globalAlpha = cloud.opacity * this.config.animationIntensity;
    
    const gradient = ctx.createRadialGradient(
      cloud.x + cloud.width / 2, cloud.y + cloud.height / 2, 0,
      cloud.x + cloud.width / 2, cloud.y + cloud.height / 2, cloud.width / 2
    );
    
    switch (cloud.cloudType) {
      case 'fluffy':
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, 'rgba(248, 250, 252, 0)');
        break;
      case 'wispy':
        gradient.addColorStop(0, 'rgba(241, 245, 249, 0.8)');
        gradient.addColorStop(1, 'rgba(241, 245, 249, 0)');
        break;
      case 'storm':
        gradient.addColorStop(0, '#64748b');
        gradient.addColorStop(1, 'rgba(100, 116, 139, 0)');
        break;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
    
    ctx.restore();
  }

  renderAmbientParticles(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }): void {
    if (!this.config.enableAmbientParticles) return;
    
    ctx.save();
    
    for (const particle of this.ambientParticles) {
      const screenX = particle.x - camera.x;
      const screenY = particle.y - camera.y;
      
      // Skip off-screen particles
      if (screenX < -10 || screenX > ctx.canvas.width + 10 || 
          screenY < -10 || screenY > ctx.canvas.height + 10) {
        continue;
      }
      
      this.renderAmbientParticle(ctx, particle, screenX, screenY);
    }
    
    ctx.restore();
  }

  private renderAmbientParticle(ctx: CanvasRenderingContext2D, particle: AmbientParticle, x: number, y: number): void {
    const alpha = particle.life / particle.maxLife;
    
    ctx.save();
    ctx.globalAlpha = alpha * this.config.animationIntensity;
    ctx.fillStyle = particle.color;
    
    switch (particle.type) {
      case 'pollen':
      case 'dust':
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'leaf':
        ctx.beginPath();
        ctx.ellipse(x, y, particle.size, particle.size * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'sparkle':
        // Simple star shape
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const radius = i % 2 === 0 ? particle.size : particle.size * 0.5;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }

  // Utility methods
  private getMaxParticles(): number {
    switch (this.config.performanceMode) {
      case 'high': return 100;
      case 'medium': return 50;
      case 'low': return 20;
      default: return 50;
    }
  }

  private getParticleSpawnRate(): number {
    const baseRate = 0.02;
    const weatherMultiplier = this.weather === 'windy' ? 2 : 1;
    const intensityMultiplier = this.config.animationIntensity;
    
    return baseRate * weatherMultiplier * intensityMultiplier;
  }

  private getRandomParticleType(): AmbientParticle['type'] {
    const types: AmbientParticle['type'][] = ['pollen', 'dust', 'leaf'];
    
    // Add sparkles rarely
    if (Math.random() < 0.1) {
      types.push('sparkle');
    }
    
    return types[Math.floor(Math.random() * types.length)];
  }

  private createAmbientParticle(type: AmbientParticle['type']): AmbientParticle {
    const colors = {
      pollen: '#fbbf24',
      dust: '#d1d5db',
      leaf: '#22c55e',
      sparkle: '#f472b6',
      snow: '#f8fafc'
    };
    
    return {
      x: -50 + Math.random() * 100, // Start just off-screen
      y: Math.random() * 600,
      vx: 0.5 + Math.random() * 1,
      vy: -0.2 + Math.random() * 0.4,
      life: 10000 + Math.random() * 20000, // 10-30 seconds
      maxLife: 20000,
      size: type === 'dust' ? 1 + Math.random() : 2 + Math.random() * 3,
      color: colors[type],
      type
    };
  }

  // Public interaction methods
  createWaterRipple(x: number, y: number, strength: number = 1): void {
    const key = `${Math.floor(x)},${Math.floor(y)}`;
    const water = this.waterTiles.get(key);
    
    if (water) {
      water.rippleStrength = Math.min(1, strength);
      water.lastRipple = Date.now();
    }
  }

  setWeather(weather: typeof this.weather): void {
    this.weather = weather;
  }

  setTimeOfDay(time: number): void {
    this.timeOfDay = Math.max(0, Math.min(1, time));
  }

  updateConfig(newConfig: Partial<MapEffectConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MapEffectConfig {
    return { ...this.config };
  }

  // Cleanup
  cleanup(): void {
    this.waterTiles.clear();
    this.grassTiles.clear();
    this.clouds = [];
    this.ambientParticles = [];
  }
}

// Factory function
export function createMapEffectsSystem(config?: Partial<MapEffectConfig>): MapEffectsSystem {
  return new MapEffectsSystem(config);
}