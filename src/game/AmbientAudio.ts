import { getAudioManager } from '../services/AudioManager';

export interface AmbientConfig {
  enableAmbientSounds: boolean;
  enableDynamicMixing: boolean;
  enableWeatherSounds: boolean;
  enableTimeOfDayChanges: boolean;
  crossfadeDuration: number; // milliseconds
  baseVolume: number;
  maxLayers: number;
}

export interface AmbientLayer {
  id: string;
  soundId: string;
  volume: number;
  isActive: boolean;
  fadeInTime: number;
  fadeOutTime: number;
  priority: number;
  conditions?: AmbientCondition[];
}

export interface AmbientCondition {
  type: 'mapType' | 'weather' | 'timeOfDay' | 'animalCount' | 'playerActivity';
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
  value: any;
}

export interface AmbientContext {
  currentMapType: string;
  weather: 'clear' | 'cloudy' | 'rainy' | 'windy' | 'snowy';
  timeOfDay: number; // 0-1, where 0 = midnight, 0.5 = noon
  animalCount: number;
  playerActivity: 'idle' | 'moving' | 'interacting';
  playerPosition: { x: number; y: number };
  nearbyAnimals: string[]; // Animal types near player
}

export class AmbientAudioSystem {
  private config: AmbientConfig;
  private audioManager = getAudioManager();
  private activeLayers: Map<string, AmbientLayer> = new Map();
  private availableLayers: AmbientLayer[] = [];
  private currentContext: AmbientContext;
  private updateInterval: number | null = null;
  private lastMusicTrack: string | null = null;

  constructor(config: Partial<AmbientConfig> = {}) {
    this.config = {
      enableAmbientSounds: true,
      enableDynamicMixing: true,
      enableWeatherSounds: true,
      enableTimeOfDayChanges: true,
      crossfadeDuration: 3000,
      baseVolume: 0.6,
      maxLayers: 4,
      ...config
    };

    this.currentContext = {
      currentMapType: 'meadow',
      weather: 'clear',
      timeOfDay: 0.5,
      animalCount: 0,
      playerActivity: 'idle',
      playerPosition: { x: 0, y: 0 },
      nearbyAnimals: []
    };

    this.initializeAmbientLayers();
  }

  private initializeAmbientLayers(): void {
    this.availableLayers = [
      // Base environmental sounds
      {
        id: 'forest_base',
        soundId: 'forest_ambient',
        volume: 0.8,
        isActive: false,
        fadeInTime: 2000,
        fadeOutTime: 2000,
        priority: 10,
        conditions: [
          { type: 'mapType', operator: 'equals', value: 'forest' }
        ]
      },
      {
        id: 'meadow_base',
        soundId: 'meadow_ambient',
        volume: 0.7,
        isActive: false,
        fadeInTime: 2000,
        fadeOutTime: 2000,
        priority: 10,
        conditions: [
          { type: 'mapType', operator: 'equals', value: 'meadow' }
        ]
      },
      {
        id: 'water_base',
        soundId: 'water_ambient',
        volume: 0.6,
        isActive: false,
        fadeInTime: 1500,
        fadeOutTime: 1500,
        priority: 8,
        conditions: [
          { type: 'mapType', operator: 'contains', value: 'water' }
        ]
      },

      // Weather layers
      {
        id: 'wind_layer',
        soundId: 'wind_ambient',
        volume: 0.4,
        isActive: false,
        fadeInTime: 3000,
        fadeOutTime: 3000,
        priority: 6,
        conditions: [
          { type: 'weather', operator: 'equals', value: 'windy' }
        ]
      },

      // Time-based layers
      {
        id: 'night_crickets',
        soundId: 'crickets_ambient',
        volume: 0.5,
        isActive: false,
        fadeInTime: 4000,
        fadeOutTime: 4000,
        priority: 4,
        conditions: [
          { type: 'timeOfDay', operator: 'lessThan', value: 0.25 }
        ]
      },
      {
        id: 'dawn_birds',
        soundId: 'birds_ambient',
        volume: 0.6,
        isActive: false,
        fadeInTime: 3000,
        fadeOutTime: 3000,
        priority: 5,
        conditions: [
          { type: 'timeOfDay', operator: 'greaterThan', value: 0.2 },
          { type: 'timeOfDay', operator: 'lessThan', value: 0.8 }
        ]
      },

      // Activity-based layers
      {
        id: 'peaceful_layer',
        soundId: 'peaceful_ambient',
        volume: 0.3,
        isActive: false,
        fadeInTime: 5000,
        fadeOutTime: 2000,
        priority: 2,
        conditions: [
          { type: 'playerActivity', operator: 'equals', value: 'idle' },
          { type: 'animalCount', operator: 'greaterThan', value: 2 }
        ]
      }
    ];
  }

  // Core update methods
  start(): void {
    if (!this.config.enableAmbientSounds) return;

    this.updateAmbientSounds();
    
    // Set up periodic updates
    this.updateInterval = window.setInterval(() => {
      this.updateAmbientSounds();
    }, 2000); // Update every 2 seconds
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Fade out all active layers
    for (const layer of this.activeLayers.values()) {
      this.deactivateLayer(layer);
    }
  }

  updateContext(newContext: Partial<AmbientContext>): void {
    const oldContext = { ...this.currentContext };
    this.currentContext = { ...this.currentContext, ...newContext };

    // Check for significant changes that require immediate update
    const significantChanges = [
      'currentMapType',
      'weather',
      'playerActivity'
    ];

    const hasSignificantChange = significantChanges.some(
      key => oldContext[key as keyof AmbientContext] !== this.currentContext[key as keyof AmbientContext]
    );

    if (hasSignificantChange) {
      this.updateAmbientSounds();
    }
  }

  private updateAmbientSounds(): void {
    if (!this.config.enableAmbientSounds) return;

    // Determine which layers should be active
    const shouldBeActive = this.availableLayers.filter(layer => 
      this.shouldLayerBeActive(layer)
    );

    // Sort by priority (higher priority first)
    shouldBeActive.sort((a, b) => b.priority - a.priority);

    // Limit to max layers
    const targetLayers = shouldBeActive.slice(0, this.config.maxLayers);

    // Deactivate layers that should no longer be active
    for (const [id, layer] of this.activeLayers.entries()) {
      if (!targetLayers.find(l => l.id === id)) {
        this.deactivateLayer(layer);
      }
    }

    // Activate new layers
    for (const layer of targetLayers) {
      if (!this.activeLayers.has(layer.id)) {
        this.activateLayer(layer);
      } else {
        // Update volume if needed
        this.updateLayerVolume(layer);
      }
    }

    // Update music based on context
    this.updateBackgroundMusic();
  }

  private shouldLayerBeActive(layer: AmbientLayer): boolean {
    if (!layer.conditions) return false;

    return layer.conditions.every(condition => {
      return this.evaluateCondition(condition);
    });
  }

  private evaluateCondition(condition: AmbientCondition): boolean {
    const contextValue = this.currentContext[condition.type as keyof AmbientContext];

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      
      case 'greaterThan':
        return Number(contextValue) > Number(condition.value);
      
      case 'lessThan':
        return Number(contextValue) < Number(condition.value);
      
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      
      default:
        return false;
    }
  }

  private async activateLayer(layer: AmbientLayer): Promise<void> {
    try {
      const volume = this.calculateLayerVolume(layer);
      
      await this.audioManager.playAmbient(layer.soundId, {
        volume,
        fadeIn: layer.fadeInTime,
        loop: true
      });

      layer.isActive = true;
      this.activeLayers.set(layer.id, layer);
      
      console.log(`Activated ambient layer: ${layer.id}`);
    } catch (error) {
      console.warn(`Failed to activate ambient layer: ${layer.id}`, error);
    }
  }

  private async deactivateLayer(layer: AmbientLayer): Promise<void> {
    if (!layer.isActive) return;

    try {
      await this.audioManager.stopAmbient(layer.fadeOutTime);
      
      layer.isActive = false;
      this.activeLayers.delete(layer.id);
      
      console.log(`Deactivated ambient layer: ${layer.id}`);
    } catch (error) {
      console.warn(`Failed to deactivate ambient layer: ${layer.id}`, error);
    }
  }

  private updateLayerVolume(layer: AmbientLayer): void {
    // Volume updates would need direct audio element access
    // For now, this is a placeholder for future enhancement
  }

  private calculateLayerVolume(layer: AmbientLayer): number {
    let volume = layer.volume * this.config.baseVolume;

    // Adjust volume based on context
    switch (this.currentContext.playerActivity) {
      case 'interacting':
        volume *= 0.7; // Quieter during interactions
        break;
      case 'moving':
        volume *= 0.9;
        break;
    }

    // Time of day adjustments
    if (this.currentContext.timeOfDay < 0.3 || this.currentContext.timeOfDay > 0.7) {
      volume *= 1.1; // Slightly louder at night/evening
    }

    return Math.max(0, Math.min(1, volume));
  }

  // Music management
  private updateBackgroundMusic(): void {
    const musicTrack = this.selectAppropriateMusic();
    
    if (musicTrack !== this.lastMusicTrack) {
      this.changeBackgroundMusic(musicTrack);
      this.lastMusicTrack = musicTrack;
    }
  }

  private selectAppropriateMusic(): string {
    // Select music based on context
    if (this.currentContext.animalCount >= 3 && this.currentContext.playerActivity === 'interacting') {
      return 'peaceful_music';
    }

    switch (this.currentContext.currentMapType) {
      case 'forest':
        return 'exploration_music';
      case 'meadow':
        return 'peaceful_music';
      default:
        return 'main_theme';
    }
  }

  private async changeBackgroundMusic(newTrack: string): Promise<void> {
    try {
      // Crossfade to new music
      await this.audioManager.stopMusic(this.config.crossfadeDuration / 2);
      
      setTimeout(() => {
        this.audioManager.playMusic(newTrack, {
          fadeIn: this.config.crossfadeDuration / 2,
          volume: 0.8
        });
      }, this.config.crossfadeDuration / 4);
      
    } catch (error) {
      console.warn('Failed to change background music:', error);
    }
  }

  // Public convenience methods
  setMapType(mapType: string): void {
    this.updateContext({ currentMapType: mapType });
  }

  setWeather(weather: AmbientContext['weather']): void {
    this.updateContext({ weather });
  }

  setTimeOfDay(timeOfDay: number): void {
    this.updateContext({ timeOfDay: Math.max(0, Math.min(1, timeOfDay)) });
  }

  setPlayerActivity(activity: AmbientContext['playerActivity']): void {
    this.updateContext({ playerActivity: activity });
  }

  setPlayerPosition(position: { x: number; y: number }): void {
    this.updateContext({ playerPosition: position });
  }

  setNearbyAnimals(animalTypes: string[]): void {
    this.updateContext({ 
      nearbyAnimals: animalTypes,
      animalCount: animalTypes.length 
    });
  }

  // Special event sounds
  playEnvironmentalSound(eventType: string, position?: { x: number; y: number }): void {
    // Calculate volume based on distance from player if position provided
    let volume = 0.7;
    
    if (position) {
      const distance = Math.sqrt(
        Math.pow(position.x - this.currentContext.playerPosition.x, 2) +
        Math.pow(position.y - this.currentContext.playerPosition.y, 2)
      );
      
      // Reduce volume with distance
      volume = Math.max(0.1, 0.7 - (distance * 0.1));
    }

    switch (eventType) {
      case 'wind_gust':
        this.audioManager.playSound('wind_gust', { volume });
        break;
      case 'water_splash':
        this.audioManager.playSound('water_splash', { volume });
        break;
      case 'leaves_rustle':
        this.audioManager.playSound('leaves_rustle', { volume });
        break;
      case 'animal_call':
        // Play appropriate animal sound based on nearby animals
        if (this.currentContext.nearbyAnimals.length > 0) {
          const randomAnimal = this.currentContext.nearbyAnimals[
            Math.floor(Math.random() * this.currentContext.nearbyAnimals.length)
          ];
          this.audioManager.playAnimalSound(randomAnimal);
        }
        break;
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<AmbientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (!this.config.enableAmbientSounds) {
      this.stop();
    } else if (this.updateInterval === null) {
      this.start();
    }
  }

  getConfig(): AmbientConfig {
    return { ...this.config };
  }

  getCurrentContext(): AmbientContext {
    return { ...this.currentContext };
  }

  getActiveLayers(): string[] {
    return Array.from(this.activeLayers.keys());
  }

  // Cleanup
  dispose(): void {
    this.stop();
    this.activeLayers.clear();
    this.availableLayers = [];
  }
}

// Global ambient audio system
let ambientAudioInstance: AmbientAudioSystem | null = null;

export function getAmbientAudio(): AmbientAudioSystem {
  if (!ambientAudioInstance) {
    ambientAudioInstance = new AmbientAudioSystem();
  }
  return ambientAudioInstance;
}

// Convenience functions
export function initializeAmbientAudio(config?: Partial<AmbientConfig>): void {
  const ambient = getAmbientAudio();
  if (config) {
    ambient.updateConfig(config);
  }
  ambient.start();
}

export function setAmbientMapType(mapType: string): void {
  getAmbientAudio().setMapType(mapType);
}

export function setAmbientWeather(weather: AmbientContext['weather']): void {
  getAmbientAudio().setWeather(weather);
}

export function setAmbientTimeOfDay(timeOfDay: number): void {
  getAmbientAudio().setTimeOfDay(timeOfDay);
}

export function setPlayerActivity(activity: AmbientContext['playerActivity']): void {
  getAmbientAudio().setPlayerActivity(activity);
}

export function updatePlayerPosition(position: { x: number; y: number }): void {
  getAmbientAudio().setPlayerPosition(position);
}

export function updateNearbyAnimals(animalTypes: string[]): void {
  getAmbientAudio().setNearbyAnimals(animalTypes);
}

export function playEnvironmentalSound(eventType: string, position?: { x: number; y: number }): void {
  getAmbientAudio().playEnvironmentalSound(eventType, position);
}