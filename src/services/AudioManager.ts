export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  enableAudio: boolean;
  enableMusic: boolean;
  enableSFX: boolean;
  muted: boolean;
}

export interface SoundOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  delay?: number;
  pitch?: number;
}

export interface AudioSource {
  id: string;
  url: string;
  type: 'music' | 'sfx' | 'ambient';
  preload: boolean;
  loop?: boolean;
  volume?: number;
}

interface LoadedAudio {
  element: HTMLAudioElement;
  isLoaded: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export class AudioManager {
  private config: AudioConfig;
  private audioSources: Map<string, AudioSource> = new Map();
  private loadedAudio: Map<string, LoadedAudio> = new Map();
  private activeAudio: Map<string, HTMLAudioElement> = new Map();
  private musicTrack: HTMLAudioElement | null = null;
  private ambientTrack: HTMLAudioElement | null = null;
  private isInitialized: boolean = false;
  private isMobile: boolean = false;
  private audioContext: AudioContext | null = null;
  private gainNodes: Map<string, GainNode> = new Map();

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = {
      masterVolume: 0.7,
      musicVolume: 0.6,
      sfxVolume: 0.8,
      enableAudio: true,
      enableMusic: true,
      enableSFX: true,
      muted: false,
      ...config
    };

    this.isMobile = this.detectMobile();
    this.initializeAudioSources();
  }

  // Initialization
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Web Audio API
      if (typeof AudioContext !== 'undefined') {
        this.audioContext = new AudioContext();
        this.createGainNodes();
      }

      // Load essential audio files
      await this.preloadAudio();
      
      this.isInitialized = true;
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      // Continue without audio
      this.config.enableAudio = false;
    }
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private initializeAudioSources(): void {
    // Define all audio sources (URLs would point to actual audio files)
    const sources: AudioSource[] = [
      // UI Sounds
      { id: 'button_click', url: '/audio/ui/button_click.mp3', type: 'sfx', preload: true },
      { id: 'button_hover', url: '/audio/ui/button_hover.mp3', type: 'sfx', preload: true },
      { id: 'menu_open', url: '/audio/ui/menu_open.mp3', type: 'sfx', preload: true },
      { id: 'menu_close', url: '/audio/ui/menu_close.mp3', type: 'sfx', preload: true },
      { id: 'success', url: '/audio/ui/success.mp3', type: 'sfx', preload: true },
      { id: 'error', url: '/audio/ui/error.mp3', type: 'sfx', preload: true },
      
      // Interaction Sounds
      { id: 'pet_success', url: '/audio/interactions/pet_success.mp3', type: 'sfx', preload: true },
      { id: 'feed_success', url: '/audio/interactions/feed_success.mp3', type: 'sfx', preload: true },
      { id: 'play_success', url: '/audio/interactions/play_success.mp3', type: 'sfx', preload: true },
      { id: 'trust_up', url: '/audio/interactions/trust_up.mp3', type: 'sfx', preload: true },
      { id: 'animal_scared', url: '/audio/interactions/animal_scared.mp3', type: 'sfx', preload: true },
      { id: 'dialogue_appear', url: '/audio/interactions/dialogue_appear.mp3', type: 'sfx', preload: true },
      
      // Animal Sounds
      { id: 'cat_meow', url: '/audio/animals/cat_meow.mp3', type: 'sfx', preload: false },
      { id: 'dog_bark', url: '/audio/animals/dog_bark.mp3', type: 'sfx', preload: false },
      { id: 'rabbit_squeak', url: '/audio/animals/rabbit_squeak.mp3', type: 'sfx', preload: false },
      { id: 'bird_chirp', url: '/audio/animals/bird_chirp.mp3', type: 'sfx', preload: false },
      
      // Ambient Sounds
      { id: 'forest_ambient', url: '/audio/ambient/forest.mp3', type: 'ambient', preload: false, loop: true },
      { id: 'meadow_ambient', url: '/audio/ambient/meadow.mp3', type: 'ambient', preload: false, loop: true },
      { id: 'water_ambient', url: '/audio/ambient/water.mp3', type: 'ambient', preload: false, loop: true },
      { id: 'wind_ambient', url: '/audio/ambient/wind.mp3', type: 'ambient', preload: false, loop: true },
      
      // Music
      { id: 'main_theme', url: '/audio/music/main_theme.mp3', type: 'music', preload: false, loop: true },
      { id: 'exploration_music', url: '/audio/music/exploration.mp3', type: 'music', preload: false, loop: true },
      { id: 'peaceful_music', url: '/audio/music/peaceful.mp3', type: 'music', preload: false, loop: true }
    ];

    sources.forEach(source => {
      this.audioSources.set(source.id, source);
    });
  }

  private createGainNodes(): void {
    if (!this.audioContext) return;

    // Create gain nodes for different audio types
    const masterGain = this.audioContext.createGain();
    const musicGain = this.audioContext.createGain();
    const sfxGain = this.audioContext.createGain();
    const ambientGain = this.audioContext.createGain();

    masterGain.connect(this.audioContext.destination);
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    ambientGain.connect(masterGain);

    this.gainNodes.set('master', masterGain);
    this.gainNodes.set('music', musicGain);
    this.gainNodes.set('sfx', sfxGain);
    this.gainNodes.set('ambient', ambientGain);

    this.updateGainNodes();
  }

  private updateGainNodes(): void {
    if (!this.audioContext) return;

    const masterGain = this.gainNodes.get('master');
    const musicGain = this.gainNodes.get('music');
    const sfxGain = this.gainNodes.get('sfx');
    const ambientGain = this.gainNodes.get('ambient');

    if (masterGain) {
      masterGain.gain.value = this.config.muted ? 0 : this.config.masterVolume;
    }
    if (musicGain) {
      musicGain.gain.value = this.config.enableMusic ? this.config.musicVolume : 0;
    }
    if (sfxGain) {
      sfxGain.gain.value = this.config.enableSFX ? this.config.sfxVolume : 0;
    }
    if (ambientGain) {
      ambientGain.gain.value = this.config.enableSFX ? this.config.sfxVolume * 0.7 : 0; // Ambient quieter than SFX
    }
  }

  // Audio loading
  private async preloadAudio(): Promise<void> {
    const preloadPromises: Promise<void>[] = [];

    for (const [id, source] of this.audioSources.entries()) {
      if (source.preload) {
        preloadPromises.push(this.loadAudio(id));
      }
    }

    await Promise.allSettled(preloadPromises);
  }

  private async loadAudio(id: string): Promise<void> {
    const source = this.audioSources.get(id);
    if (!source || this.loadedAudio.has(id)) return;

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      // Handle mobile audio restrictions
      if (this.isMobile) {
        audio.preload = 'none';
      }

      audio.addEventListener('canplaythrough', () => {
        this.loadedAudio.set(id, {
          element: audio,
          isLoaded: true,
          isPlaying: false,
          currentTime: 0,
          duration: audio.duration
        });
        resolve();
      });

      audio.addEventListener('error', (error) => {
        console.warn(`Failed to load audio: ${id}`, error);
        // Create silent placeholder
        this.loadedAudio.set(id, {
          element: audio,
          isLoaded: false,
          isPlaying: false,
          currentTime: 0,
          duration: 0
        });
        resolve(); // Don't reject, just continue without this audio
      });

      // Set audio properties
      audio.loop = source.loop || false;
      audio.volume = this.calculateVolume(source.type, source.volume);
      audio.src = source.url;

      // Start loading
      if (!this.isMobile) {
        audio.load();
      }
    });
  }

  // Sound playback
  async playSound(id: string, options: SoundOptions = {}): Promise<void> {
    if (!this.config.enableAudio || !this.config.enableSFX || this.config.muted) {
      return;
    }

    const source = this.audioSources.get(id);
    if (!source) {
      console.warn(`Audio source not found: ${id}`);
      return;
    }

    // Load audio if not already loaded
    if (!this.loadedAudio.has(id)) {
      await this.loadAudio(id);
    }

    const loadedAudio = this.loadedAudio.get(id);
    if (!loadedAudio?.isLoaded) {
      return;
    }

    try {
      // Clone audio element for overlapping sounds
      const audio = loadedAudio.element.cloneNode() as HTMLAudioElement;
      
      // Apply options
      audio.volume = this.calculateVolume(source.type, options.volume || source.volume);
      audio.loop = options.loop ?? source.loop ?? false;
      
      if (options.pitch && this.audioContext) {
        // Pitch shifting would require more complex Web Audio API setup
        // For now, we'll skip pitch modification
      }

      // Handle delay
      if (options.delay) {
        setTimeout(() => {
          this.playAudioElement(audio, id, options);
        }, options.delay);
      } else {
        this.playAudioElement(audio, id, options);
      }

    } catch (error) {
      console.warn(`Failed to play sound: ${id}`, error);
    }
  }

  private async playAudioElement(audio: HTMLAudioElement, id: string, options: SoundOptions): Promise<void> {
    try {
      // Reset audio to start
      audio.currentTime = 0;

      // Handle fade in
      if (options.fadeIn) {
        const originalVolume = audio.volume;
        audio.volume = 0;
        await audio.play();
        this.fadeVolume(audio, 0, originalVolume, options.fadeIn);
      } else {
        await audio.play();
      }

      // Track active audio
      const trackingId = `${id}_${Date.now()}`;
      this.activeAudio.set(trackingId, audio);

      // Handle fade out and cleanup
      audio.addEventListener('ended', () => {
        this.activeAudio.delete(trackingId);
      });

      if (options.fadeOut && !options.loop) {
        setTimeout(() => {
          this.fadeVolume(audio, audio.volume, 0, options.fadeOut!).then(() => {
            audio.pause();
            this.activeAudio.delete(trackingId);
          });
        }, (audio.duration - options.fadeOut / 1000) * 1000);
      }

    } catch (error) {
      // Handle autoplay restrictions
      if (error.name === 'NotAllowedError') {
        console.log('Audio autoplay blocked - will play after user interaction');
      } else {
        console.warn(`Audio playback failed: ${id}`, error);
      }
    }
  }

  // Music control
  async playMusic(id: string, options: SoundOptions = {}): Promise<void> {
    if (!this.config.enableAudio || !this.config.enableMusic || this.config.muted) {
      return;
    }

    // Stop current music
    if (this.musicTrack) {
      await this.stopMusic();
    }

    const source = this.audioSources.get(id);
    if (!source || source.type !== 'music') {
      console.warn(`Music source not found: ${id}`);
      return;
    }

    // Load if needed
    if (!this.loadedAudio.has(id)) {
      await this.loadAudio(id);
    }

    const loadedAudio = this.loadedAudio.get(id);
    if (!loadedAudio?.isLoaded) {
      return;
    }

    try {
      this.musicTrack = loadedAudio.element.cloneNode() as HTMLAudioElement;
      this.musicTrack.volume = this.calculateVolume('music', options.volume);
      this.musicTrack.loop = true;

      if (options.fadeIn) {
        const originalVolume = this.musicTrack.volume;
        this.musicTrack.volume = 0;
        await this.musicTrack.play();
        this.fadeVolume(this.musicTrack, 0, originalVolume, options.fadeIn);
      } else {
        await this.musicTrack.play();
      }

    } catch (error) {
      console.warn(`Music playback failed: ${id}`, error);
      this.musicTrack = null;
    }
  }

  async stopMusic(fadeOut: number = 1000): Promise<void> {
    if (!this.musicTrack) return;

    if (fadeOut > 0) {
      await this.fadeVolume(this.musicTrack, this.musicTrack.volume, 0, fadeOut);
    }

    this.musicTrack.pause();
    this.musicTrack = null;
  }

  // Ambient audio
  async playAmbient(id: string, options: SoundOptions = {}): Promise<void> {
    if (!this.config.enableAudio || !this.config.enableSFX || this.config.muted) {
      return;
    }

    // Stop current ambient
    if (this.ambientTrack) {
      await this.stopAmbient();
    }

    const source = this.audioSources.get(id);
    if (!source || source.type !== 'ambient') {
      console.warn(`Ambient source not found: ${id}`);
      return;
    }

    // Load if needed
    if (!this.loadedAudio.has(id)) {
      await this.loadAudio(id);
    }

    const loadedAudio = this.loadedAudio.get(id);
    if (!loadedAudio?.isLoaded) {
      return;
    }

    try {
      this.ambientTrack = loadedAudio.element.cloneNode() as HTMLAudioElement;
      this.ambientTrack.volume = this.calculateVolume('ambient', options.volume);
      this.ambientTrack.loop = true;

      if (options.fadeIn) {
        const originalVolume = this.ambientTrack.volume;
        this.ambientTrack.volume = 0;
        await this.ambientTrack.play();
        this.fadeVolume(this.ambientTrack, 0, originalVolume, options.fadeIn);
      } else {
        await this.ambientTrack.play();
      }

    } catch (error) {
      console.warn(`Ambient playback failed: ${id}`, error);
      this.ambientTrack = null;
    }
  }

  async stopAmbient(fadeOut: number = 2000): Promise<void> {
    if (!this.ambientTrack) return;

    if (fadeOut > 0) {
      await this.fadeVolume(this.ambientTrack, this.ambientTrack.volume, 0, fadeOut);
    }

    this.ambientTrack.pause();
    this.ambientTrack = null;
  }

  // Utility methods
  private calculateVolume(type: 'music' | 'sfx' | 'ambient', customVolume?: number): number {
    let baseVolume: number;
    
    switch (type) {
      case 'music':
        baseVolume = this.config.musicVolume;
        break;
      case 'ambient':
        baseVolume = this.config.sfxVolume * 0.7; // Ambient quieter
        break;
      default:
        baseVolume = this.config.sfxVolume;
    }

    const volume = (customVolume ?? 1) * baseVolume * this.config.masterVolume;
    return this.config.muted ? 0 : Math.max(0, Math.min(1, volume));
  }

  private async fadeVolume(audio: HTMLAudioElement, fromVolume: number, toVolume: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const volumeDiff = toVolume - fromVolume;

      const updateVolume = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        audio.volume = fromVolume + volumeDiff * progress;

        if (progress < 1) {
          requestAnimationFrame(updateVolume);
        } else {
          resolve();
        }
      };

      updateVolume();
    });
  }

  // Configuration methods
  updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateGainNodes();
    
    // Update all active audio volumes
    if (this.musicTrack) {
      this.musicTrack.volume = this.calculateVolume('music');
    }
    if (this.ambientTrack) {
      this.ambientTrack.volume = this.calculateVolume('ambient');
    }
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  // State methods
  mute(): void {
    this.updateConfig({ muted: true });
  }

  unmute(): void {
    this.updateConfig({ muted: false });
  }

  setMasterVolume(volume: number): void {
    this.updateConfig({ masterVolume: Math.max(0, Math.min(1, volume)) });
  }

  setMusicVolume(volume: number): void {
    this.updateConfig({ musicVolume: Math.max(0, Math.min(1, volume)) });
  }

  setSFXVolume(volume: number): void {
    this.updateConfig({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  }

  // Cleanup
  stopAllAudio(): void {
    // Stop all active sounds
    for (const audio of this.activeAudio.values()) {
      audio.pause();
    }
    this.activeAudio.clear();

    // Stop music and ambient
    if (this.musicTrack) {
      this.musicTrack.pause();
      this.musicTrack = null;
    }
    if (this.ambientTrack) {
      this.ambientTrack.pause();
      this.ambientTrack = null;
    }
  }

  dispose(): void {
    this.stopAllAudio();
    this.loadedAudio.clear();
    this.audioSources.clear();
    this.gainNodes.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // Quick access methods for common sounds
  playButtonClick(): void {
    this.playSound('button_click');
  }

  playButtonHover(): void {
    this.playSound('button_hover', { volume: 0.5 });
  }

  playSuccess(): void {
    this.playSound('success');
  }

  playError(): void {
    this.playSound('error');
  }

  playMenuOpen(): void {
    this.playSound('menu_open');
  }

  playMenuClose(): void {
    this.playSound('menu_close');
  }

  // Animal-specific sounds
  playAnimalSound(animalType: string): void {
    const soundMap: Record<string, string> = {
      cat: 'cat_meow',
      dog: 'dog_bark',
      rabbit: 'rabbit_squeak',
      bird: 'bird_chirp'
    };

    const soundId = soundMap[animalType];
    if (soundId) {
      this.playSound(soundId, { volume: 0.7 });
    }
  }

  // Interaction sounds
  playInteractionSound(interactionType: string, success: boolean): void {
    if (success) {
      switch (interactionType) {
        case 'pet':
          this.playSound('pet_success');
          break;
        case 'feed':
          this.playSound('feed_success');
          break;
        case 'play':
          this.playSound('play_success');
          break;
        case 'talk':
          this.playSound('dialogue_appear');
          break;
        default:
          this.playSuccess();
      }
    } else {
      this.playError();
    }
  }
}

// Global audio manager instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}

// Convenience functions
export function initializeAudio(config?: Partial<AudioConfig>): Promise<void> {
  const manager = getAudioManager();
  if (config) {
    manager.updateConfig(config);
  }
  return manager.initialize();
}

export function playSound(id: string, options?: SoundOptions): void {
  getAudioManager().playSound(id, options);
}

export function playMusic(id: string, options?: SoundOptions): void {
  getAudioManager().playMusic(id, options);
}

export function stopMusic(fadeOut?: number): void {
  getAudioManager().stopMusic(fadeOut);
}

export function playAmbient(id: string, options?: SoundOptions): void {
  getAudioManager().playAmbient(id, options);
}

export function stopAmbient(fadeOut?: number): void {
  getAudioManager().stopAmbient(fadeOut);
}