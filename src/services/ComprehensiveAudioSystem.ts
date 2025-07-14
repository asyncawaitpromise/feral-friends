// Comprehensive Audio System
// Enhanced audio with species-specific sounds, environmental audio, and contextual music

import { AudioManager, AudioConfig, SoundOptions } from './AudioManager';

export interface AnimalSoundProfile {
  species: string;
  sounds: {
    idle: string[];
    happy: string[];
    scared: string[];
    eating: string[];
    sleeping: string[];
    calling: string[];
    playing: string[];
  };
  volumeRange: { min: number; max: number };
  pitchVariation: number;
  frequency: number; // How often they make sounds (lower = more frequent)
}

export interface EnvironmentalAudio {
  biome: string;
  ambientLoops: string[];
  weatherSounds: Record<string, string[]>;
  timeOfDaySounds: Record<string, string[]>;
  interactiveSounds: string[];
  volume: number;
  layering: boolean;
}

export interface MusicTrack {
  id: string;
  name: string;
  file: string;
  mood: 'peaceful' | 'adventurous' | 'mysterious' | 'exciting' | 'melancholy' | 'triumphant';
  biomes: string[];
  timeOfDay: string[];
  situations: string[];
  volume: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  loop: boolean;
}

export interface AudioCue {
  id: string;
  trigger: string;
  soundFile: string;
  volume: number;
  pitch?: number;
  delay?: number;
  interrupt?: boolean;
}

// Animal sound profiles
export const ANIMAL_SOUND_PROFILES: Record<string, AnimalSoundProfile> = {
  rabbit: {
    species: 'rabbit',
    sounds: {
      idle: ['/audio/animals/rabbit/rabbit_idle1.ogg', '/audio/animals/rabbit/rabbit_idle2.ogg'],
      happy: ['/audio/animals/rabbit/rabbit_happy1.ogg', '/audio/animals/rabbit/rabbit_happy2.ogg'],
      scared: ['/audio/animals/rabbit/rabbit_scared1.ogg', '/audio/animals/rabbit/rabbit_scared2.ogg'],
      eating: ['/audio/animals/rabbit/rabbit_eating1.ogg', '/audio/animals/rabbit/rabbit_eating2.ogg'],
      sleeping: ['/audio/animals/rabbit/rabbit_sleeping.ogg'],
      calling: ['/audio/animals/rabbit/rabbit_call1.ogg', '/audio/animals/rabbit/rabbit_call2.ogg'],
      playing: ['/audio/animals/rabbit/rabbit_playing.ogg']
    },
    volumeRange: { min: 0.3, max: 0.7 },
    pitchVariation: 0.2,
    frequency: 8000 // 8 seconds average
  },

  fox: {
    species: 'fox',
    sounds: {
      idle: ['/audio/animals/fox/fox_idle1.ogg', '/audio/animals/fox/fox_idle2.ogg'],
      happy: ['/audio/animals/fox/fox_happy1.ogg', '/audio/animals/fox/fox_yip.ogg'],
      scared: ['/audio/animals/fox/fox_scared.ogg', '/audio/animals/fox/fox_whimper.ogg'],
      eating: ['/audio/animals/fox/fox_eating.ogg'],
      sleeping: ['/audio/animals/fox/fox_sleeping.ogg'],
      calling: ['/audio/animals/fox/fox_bark1.ogg', '/audio/animals/fox/fox_bark2.ogg'],
      playing: ['/audio/animals/fox/fox_playing.ogg']
    },
    volumeRange: { min: 0.4, max: 0.8 },
    pitchVariation: 0.3,
    frequency: 12000 // 12 seconds average
  },

  bird: {
    species: 'bird',
    sounds: {
      idle: ['/audio/animals/bird/bird_chirp1.ogg', '/audio/animals/bird/bird_chirp2.ogg', '/audio/animals/bird/bird_chirp3.ogg'],
      happy: ['/audio/animals/bird/bird_song1.ogg', '/audio/animals/bird/bird_song2.ogg'],
      scared: ['/audio/animals/bird/bird_alarm.ogg', '/audio/animals/bird/bird_flutter.ogg'],
      eating: ['/audio/animals/bird/bird_pecking.ogg'],
      sleeping: ['/audio/animals/bird/bird_sleeping.ogg'],
      calling: ['/audio/animals/bird/bird_call1.ogg', '/audio/animals/bird/bird_call2.ogg'],
      playing: ['/audio/animals/bird/bird_trill.ogg']
    },
    volumeRange: { min: 0.2, max: 0.6 },
    pitchVariation: 0.4,
    frequency: 5000 // 5 seconds average (birds are chatty)
  },

  wolf: {
    species: 'wolf',
    sounds: {
      idle: ['/audio/animals/wolf/wolf_idle1.ogg', '/audio/animals/wolf/wolf_breathing.ogg'],
      happy: ['/audio/animals/wolf/wolf_happy.ogg', '/audio/animals/wolf/wolf_playful.ogg'],
      scared: ['/audio/animals/wolf/wolf_whine.ogg', '/audio/animals/wolf/wolf_retreat.ogg'],
      eating: ['/audio/animals/wolf/wolf_eating.ogg'],
      sleeping: ['/audio/animals/wolf/wolf_sleeping.ogg'],
      calling: ['/audio/animals/wolf/wolf_howl1.ogg', '/audio/animals/wolf/wolf_howl2.ogg', '/audio/animals/wolf/wolf_bark.ogg'],
      playing: ['/audio/animals/wolf/wolf_playing.ogg']
    },
    volumeRange: { min: 0.6, max: 1.0 },
    pitchVariation: 0.2,
    frequency: 15000 // 15 seconds average
  },

  owl: {
    species: 'owl',
    sounds: {
      idle: ['/audio/animals/owl/owl_hoot1.ogg', '/audio/animals/owl/owl_hoot2.ogg'],
      happy: ['/audio/animals/owl/owl_content.ogg'],
      scared: ['/audio/animals/owl/owl_screech.ogg'],
      eating: ['/audio/animals/owl/owl_eating.ogg'],
      sleeping: ['/audio/animals/owl/owl_sleeping.ogg'],
      calling: ['/audio/animals/owl/owl_call1.ogg', '/audio/animals/owl/owl_call2.ogg'],
      playing: ['/audio/animals/owl/owl_playing.ogg']
    },
    volumeRange: { min: 0.4, max: 0.8 },
    pitchVariation: 0.15,
    frequency: 20000 // 20 seconds average (owls are mysterious)
  },

  butterfly: {
    species: 'butterfly',
    sounds: {
      idle: ['/audio/animals/butterfly/butterfly_flutter1.ogg', '/audio/animals/butterfly/butterfly_flutter2.ogg'],
      happy: ['/audio/animals/butterfly/butterfly_happy.ogg'],
      scared: ['/audio/animals/butterfly/butterfly_escape.ogg'],
      eating: ['/audio/animals/butterfly/butterfly_feeding.ogg'],
      sleeping: ['/audio/animals/butterfly/butterfly_rest.ogg'],
      calling: ['/audio/animals/butterfly/butterfly_flutter3.ogg'],
      playing: ['/audio/animals/butterfly/butterfly_dance.ogg']
    },
    volumeRange: { min: 0.1, max: 0.3 },
    pitchVariation: 0.1,
    frequency: 10000 // 10 seconds average
  }
};

// Environmental audio configurations
export const ENVIRONMENTAL_AUDIO: Record<string, EnvironmentalAudio> = {
  forest: {
    biome: 'forest',
    ambientLoops: [
      '/audio/environment/forest/forest_ambient.ogg',
      '/audio/environment/forest/forest_birds.ogg',
      '/audio/environment/forest/forest_rustling.ogg'
    ],
    weatherSounds: {
      sunny: ['/audio/environment/forest/forest_sunny.ogg'],
      rainy: ['/audio/environment/forest/forest_rain.ogg', '/audio/environment/shared/rain_on_leaves.ogg'],
      stormy: ['/audio/environment/forest/forest_storm.ogg'],
      snowy: ['/audio/environment/forest/forest_snow.ogg'],
      foggy: ['/audio/environment/forest/forest_fog.ogg']
    },
    timeOfDaySounds: {
      dawn: ['/audio/environment/forest/forest_dawn.ogg'],
      day: ['/audio/environment/forest/forest_day.ogg'],
      dusk: ['/audio/environment/forest/forest_dusk.ogg'],
      night: ['/audio/environment/forest/forest_night.ogg']
    },
    interactiveSounds: [
      '/audio/environment/forest/branch_snap.ogg',
      '/audio/environment/forest/leaf_rustle.ogg',
      '/audio/environment/forest/footstep_leaves.ogg'
    ],
    volume: 0.4,
    layering: true
  },

  meadow: {
    biome: 'meadow',
    ambientLoops: [
      '/audio/environment/meadow/meadow_ambient.ogg',
      '/audio/environment/meadow/meadow_insects.ogg',
      '/audio/environment/meadow/meadow_wind.ogg'
    ],
    weatherSounds: {
      sunny: ['/audio/environment/meadow/meadow_sunny.ogg'],
      rainy: ['/audio/environment/meadow/meadow_rain.ogg'],
      stormy: ['/audio/environment/meadow/meadow_storm.ogg'],
      snowy: ['/audio/environment/meadow/meadow_snow.ogg'],
      foggy: ['/audio/environment/meadow/meadow_fog.ogg']
    },
    timeOfDaySounds: {
      dawn: ['/audio/environment/meadow/meadow_dawn.ogg'],
      day: ['/audio/environment/meadow/meadow_day.ogg'],
      dusk: ['/audio/environment/meadow/meadow_dusk.ogg'],
      night: ['/audio/environment/meadow/meadow_night.ogg']
    },
    interactiveSounds: [
      '/audio/environment/meadow/grass_footstep.ogg',
      '/audio/environment/meadow/flower_brush.ogg'
    ],
    volume: 0.3,
    layering: true
  },

  water: {
    biome: 'water',
    ambientLoops: [
      '/audio/environment/water/water_ambient.ogg',
      '/audio/environment/water/water_lapping.ogg',
      '/audio/environment/water/water_bubbles.ogg'
    ],
    weatherSounds: {
      sunny: ['/audio/environment/water/water_sunny.ogg'],
      rainy: ['/audio/environment/water/water_rain.ogg'],
      stormy: ['/audio/environment/water/water_storm.ogg'],
      snowy: ['/audio/environment/water/water_ice.ogg'],
      foggy: ['/audio/environment/water/water_fog.ogg']
    },
    timeOfDaySounds: {
      dawn: ['/audio/environment/water/water_dawn.ogg'],
      day: ['/audio/environment/water/water_day.ogg'],
      dusk: ['/audio/environment/water/water_dusk.ogg'],
      night: ['/audio/environment/water/water_night.ogg']
    },
    interactiveSounds: [
      '/audio/environment/water/splash.ogg',
      '/audio/environment/water/ripple.ogg',
      '/audio/environment/water/wade.ogg'
    ],
    volume: 0.5,
    layering: true
  },

  mountain: {
    biome: 'mountain',
    ambientLoops: [
      '/audio/environment/mountain/mountain_ambient.ogg',
      '/audio/environment/mountain/mountain_wind.ogg',
      '/audio/environment/mountain/mountain_echo.ogg'
    ],
    weatherSounds: {
      sunny: ['/audio/environment/mountain/mountain_sunny.ogg'],
      rainy: ['/audio/environment/mountain/mountain_rain.ogg'],
      stormy: ['/audio/environment/mountain/mountain_storm.ogg'],
      snowy: ['/audio/environment/mountain/mountain_blizzard.ogg'],
      foggy: ['/audio/environment/mountain/mountain_fog.ogg']
    },
    timeOfDaySounds: {
      dawn: ['/audio/environment/mountain/mountain_dawn.ogg'],
      day: ['/audio/environment/mountain/mountain_day.ogg'],
      dusk: ['/audio/environment/mountain/mountain_dusk.ogg'],
      night: ['/audio/environment/mountain/mountain_night.ogg']
    },
    interactiveSounds: [
      '/audio/environment/mountain/rock_slide.ogg',
      '/audio/environment/mountain/footstep_stone.ogg',
      '/audio/environment/mountain/echo_call.ogg'
    ],
    volume: 0.4,
    layering: true
  }
};

// Music tracks
export const MUSIC_TRACKS: Record<string, MusicTrack> = {
  peaceful_meadow: {
    id: 'peaceful_meadow',
    name: 'Peaceful Meadow',
    file: '/audio/music/peaceful_meadow.ogg',
    mood: 'peaceful',
    biomes: ['meadow', 'grassland'],
    timeOfDay: ['day', 'dawn'],
    situations: ['exploration', 'taming'],
    volume: 0.6,
    fadeInDuration: 3000,
    fadeOutDuration: 2000,
    loop: true
  },

  forest_mystery: {
    id: 'forest_mystery',
    name: 'Forest Mystery',
    file: '/audio/music/forest_mystery.ogg',
    mood: 'mysterious',
    biomes: ['forest'],
    timeOfDay: ['dusk', 'night'],
    situations: ['exploration', 'rare_encounter'],
    volume: 0.5,
    fadeInDuration: 4000,
    fadeOutDuration: 3000,
    loop: true
  },

  mountain_adventure: {
    id: 'mountain_adventure',
    name: 'Mountain Adventure',
    file: '/audio/music/mountain_adventure.ogg',
    mood: 'adventurous',
    biomes: ['mountain'],
    timeOfDay: ['day'],
    situations: ['exploration', 'challenge'],
    volume: 0.7,
    fadeInDuration: 2000,
    fadeOutDuration: 2000,
    loop: true
  },

  competition_excitement: {
    id: 'competition_excitement',
    name: 'Competition Theme',
    file: '/audio/music/competition_excitement.ogg',
    mood: 'exciting',
    biomes: [],
    timeOfDay: [],
    situations: ['competition', 'challenge'],
    volume: 0.8,
    fadeInDuration: 1000,
    fadeOutDuration: 1000,
    loop: true
  },

  bonding_moment: {
    id: 'bonding_moment',
    name: 'Bonding Moment',
    file: '/audio/music/bonding_moment.ogg',
    mood: 'peaceful',
    biomes: [],
    timeOfDay: [],
    situations: ['bonding', 'achievement'],
    volume: 0.5,
    fadeInDuration: 2000,
    fadeOutDuration: 3000,
    loop: false
  },

  triumph: {
    id: 'triumph',
    name: 'Moment of Triumph',
    file: '/audio/music/triumph.ogg',
    mood: 'triumphant',
    biomes: [],
    timeOfDay: [],
    situations: ['victory', 'achievement', 'level_up'],
    volume: 0.9,
    fadeInDuration: 500,
    fadeOutDuration: 2000,
    loop: false
  }
};

// Audio cues for interactions
export const AUDIO_CUES: Record<string, AudioCue> = {
  taming_success: {
    id: 'taming_success',
    trigger: 'animal_tamed',
    soundFile: '/audio/ui/taming_success.ogg',
    volume: 0.8,
    pitch: 1.0
  },

  trick_learned: {
    id: 'trick_learned',
    trigger: 'trick_mastered',
    soundFile: '/audio/ui/trick_learned.ogg',
    volume: 0.7,
    pitch: 1.1
  },

  rare_discovery: {
    id: 'rare_discovery',
    trigger: 'rare_animal_found',
    soundFile: '/audio/ui/rare_discovery.ogg',
    volume: 1.0,
    pitch: 1.0,
    interrupt: true
  },

  achievement_unlock: {
    id: 'achievement_unlock',
    trigger: 'achievement_completed',
    soundFile: '/audio/ui/achievement_unlock.ogg',
    volume: 0.9,
    pitch: 1.0
  },

  level_up: {
    id: 'level_up',
    trigger: 'player_level_up',
    soundFile: '/audio/ui/level_up.ogg',
    volume: 0.8,
    pitch: 1.0
  },

  competition_win: {
    id: 'competition_win',
    trigger: 'competition_victory',
    soundFile: '/audio/ui/competition_win.ogg',
    volume: 1.0,
    pitch: 1.0
  },

  item_pickup: {
    id: 'item_pickup',
    trigger: 'item_collected',
    soundFile: '/audio/ui/item_pickup.ogg',
    volume: 0.4,
    pitch: 1.2
  },

  interaction_positive: {
    id: 'interaction_positive',
    trigger: 'positive_interaction',
    soundFile: '/audio/ui/interaction_positive.ogg',
    volume: 0.5,
    pitch: 1.0
  },

  interaction_negative: {
    id: 'interaction_negative',
    trigger: 'negative_interaction',
    soundFile: '/audio/ui/interaction_negative.ogg',
    volume: 0.4,
    pitch: 0.8
  }
};

export class ComprehensiveAudioSystem {
  private audioManager: AudioManager;
  private currentBiome: string = 'temperate';
  private currentWeather: string = 'sunny';
  private currentTimeOfDay: string = 'day';
  private currentSituation: string = 'exploration';
  private activeAnimals: Set<string> = new Set();
  private animalSoundTimers: Map<string, number> = new Map();
  private currentMusicTrack: string | null = null;
  private environmentalLayers: Map<string, string> = new Map();

  constructor(audioConfig?: Partial<AudioConfig>) {
    this.audioManager = new AudioManager(audioConfig);
  }

  /**
   * Initialize the comprehensive audio system
   */
  async initialize(): Promise<void> {
    await this.audioManager.initialize();
    
    // Preload essential audio files
    await this.preloadEssentialAudio();
    
    // Start ambient audio
    this.updateEnvironmentalAudio();
  }

  /**
   * Preload critical audio files
   */
  private async preloadEssentialAudio(): Promise<void> {
    const essentialFiles = [
      // Common animal sounds
      '/audio/animals/rabbit/rabbit_idle1.ogg',
      '/audio/animals/fox/fox_idle1.ogg',
      '/audio/animals/bird/bird_chirp1.ogg',
      
      // UI sounds
      '/audio/ui/taming_success.ogg',
      '/audio/ui/interaction_positive.ogg',
      '/audio/ui/item_pickup.ogg',
      
      // Essential environmental
      '/audio/environment/forest/forest_ambient.ogg',
      '/audio/environment/meadow/meadow_ambient.ogg'
    ];

    for (const file of essentialFiles) {
      this.audioManager.registerSound(file.split('/').pop()!.replace('.ogg', ''), {
        id: file.split('/').pop()!.replace('.ogg', ''),
        url: file,
        type: 'sfx',
        preload: true
      });
    }
  }

  /**
   * Play animal sound based on species and emotion
   */
  playAnimalSound(species: string, emotion: string, animalId?: string): void {
    const profile = ANIMAL_SOUND_PROFILES[species];
    if (!profile || !profile.sounds[emotion as keyof typeof profile.sounds]) return;

    const sounds = profile.sounds[emotion as keyof typeof profile.sounds];
    const soundFile = sounds[Math.floor(Math.random() * sounds.length)];
    
    // Calculate volume with variation
    const volumeRange = profile.volumeRange;
    const volume = volumeRange.min + Math.random() * (volumeRange.max - volumeRange.min);
    
    // Add pitch variation
    const pitch = 1.0 + (Math.random() - 0.5) * profile.pitchVariation;
    
    this.audioManager.playSound(soundFile.split('/').pop()!.replace('.ogg', ''), {
      volume,
      pitch
    });

    // Set cooldown for this animal
    if (animalId) {
      this.animalSoundTimers.set(animalId, Date.now() + profile.frequency);
    }
  }

  /**
   * Update environmental audio based on current context
   */
  updateEnvironmentalAudio(): void {
    const envAudio = ENVIRONMENTAL_AUDIO[this.currentBiome];
    if (!envAudio) return;

    // Stop previous environmental layers
    this.environmentalLayers.forEach((soundId) => {
      this.audioManager.stopSound(soundId);
    });
    this.environmentalLayers.clear();

    // Play ambient loops
    envAudio.ambientLoops.forEach((loop, index) => {
      const soundId = `ambient_${this.currentBiome}_${index}`;
      this.audioManager.registerSound(soundId, {
        id: soundId,
        url: loop,
        type: 'ambient',
        preload: true,
        loop: true,
        volume: envAudio.volume
      });
      
      this.audioManager.playSound(soundId, { volume: envAudio.volume });
      this.environmentalLayers.set(`ambient_${index}`, soundId);
    });

    // Add weather layer
    const weatherSounds = envAudio.weatherSounds[this.currentWeather];
    if (weatherSounds) {
      weatherSounds.forEach((weatherSound, index) => {
        const soundId = `weather_${this.currentWeather}_${index}`;
        this.audioManager.registerSound(soundId, {
          id: soundId,
          url: weatherSound,
          type: 'ambient',
          preload: true,
          loop: true,
          volume: envAudio.volume * 0.7
        });
        
        this.audioManager.playSound(soundId, { volume: envAudio.volume * 0.7 });
        this.environmentalLayers.set(`weather_${index}`, soundId);
      });
    }

    // Add time of day layer
    const timeOfDaySounds = envAudio.timeOfDaySounds[this.currentTimeOfDay];
    if (timeOfDaySounds) {
      timeOfDaySounds.forEach((timeSound, index) => {
        const soundId = `time_${this.currentTimeOfDay}_${index}`;
        this.audioManager.registerSound(soundId, {
          id: soundId,
          url: timeSound,
          type: 'ambient',
          preload: true,
          loop: true,
          volume: envAudio.volume * 0.5
        });
        
        this.audioManager.playSound(soundId, { volume: envAudio.volume * 0.5 });
        this.environmentalLayers.set(`time_${index}`, soundId);
      });
    }
  }

  /**
   * Play contextual music
   */
  playContextualMusic(): void {
    const suitableTracks = Object.values(MUSIC_TRACKS).filter(track => {
      const biomeMatch = track.biomes.length === 0 || track.biomes.includes(this.currentBiome);
      const timeMatch = track.timeOfDay.length === 0 || track.timeOfDay.includes(this.currentTimeOfDay);
      const situationMatch = track.situations.includes(this.currentSituation);
      
      return biomeMatch && timeMatch && situationMatch;
    });

    if (suitableTracks.length === 0) return;

    // Select best matching track
    const selectedTrack = suitableTracks[Math.floor(Math.random() * suitableTracks.length)];
    
    if (this.currentMusicTrack === selectedTrack.id) return;

    // Fade out current track
    if (this.currentMusicTrack) {
      this.audioManager.stopMusic(2000);
    }

    // Play new track
    this.audioManager.registerSound(selectedTrack.id, {
      id: selectedTrack.id,
      url: selectedTrack.file,
      type: 'music',
      preload: true,
      loop: selectedTrack.loop,
      volume: selectedTrack.volume
    });

    this.audioManager.playMusic(selectedTrack.id, {
      fadeIn: selectedTrack.fadeInDuration,
      volume: selectedTrack.volume
    });

    this.currentMusicTrack = selectedTrack.id;
  }

  /**
   * Play audio cue for specific event
   */
  playAudioCue(trigger: string, customOptions?: SoundOptions): void {
    const cue = Object.values(AUDIO_CUES).find(c => c.trigger === trigger);
    if (!cue) return;

    if (cue.interrupt && this.audioManager.isPlaying(cue.id)) {
      this.audioManager.stopSound(cue.id);
    }

    const options: SoundOptions = {
      volume: cue.volume,
      pitch: cue.pitch,
      delay: cue.delay,
      ...customOptions
    };

    this.audioManager.registerSound(cue.id, {
      id: cue.id,
      url: cue.soundFile,
      type: 'sfx',
      preload: true,
      volume: cue.volume
    });

    this.audioManager.playSound(cue.id, options);
  }

  /**
   * Update audio context
   */
  updateContext(context: {
    biome?: string;
    weather?: string;
    timeOfDay?: string;
    situation?: string;
  }): void {
    let environmentChanged = false;

    if (context.biome && context.biome !== this.currentBiome) {
      this.currentBiome = context.biome;
      environmentChanged = true;
    }

    if (context.weather && context.weather !== this.currentWeather) {
      this.currentWeather = context.weather;
      environmentChanged = true;
    }

    if (context.timeOfDay && context.timeOfDay !== this.currentTimeOfDay) {
      this.currentTimeOfDay = context.timeOfDay;
      environmentChanged = true;
    }

    if (context.situation && context.situation !== this.currentSituation) {
      this.currentSituation = context.situation;
      this.playContextualMusic();
    }

    if (environmentChanged) {
      this.updateEnvironmentalAudio();
    }
  }

  /**
   * Register active animal for periodic sounds
   */
  registerActiveAnimal(animalId: string, species: string): void {
    this.activeAnimals.add(animalId);
    
    // Start periodic sound generation
    const profile = ANIMAL_SOUND_PROFILES[species];
    if (profile) {
      const initialDelay = Math.random() * profile.frequency;
      setTimeout(() => this.scheduleAnimalSound(animalId, species), initialDelay);
    }
  }

  /**
   * Unregister active animal
   */
  unregisterActiveAnimal(animalId: string): void {
    this.activeAnimals.delete(animalId);
    this.animalSoundTimers.delete(animalId);
  }

  /**
   * Schedule next animal sound
   */
  private scheduleAnimalSound(animalId: string, species: string): void {
    if (!this.activeAnimals.has(animalId)) return;

    const profile = ANIMAL_SOUND_PROFILES[species];
    if (!profile) return;

    const now = Date.now();
    const lastSound = this.animalSoundTimers.get(animalId) || 0;

    if (now >= lastSound) {
      // 30% chance to make a sound when timer is up
      if (Math.random() < 0.3) {
        this.playAnimalSound(species, 'idle', animalId);
      }
    }

    // Schedule next check
    const nextCheck = profile.frequency * (0.5 + Math.random() * 0.5); // Randomize timing
    setTimeout(() => this.scheduleAnimalSound(animalId, species), nextCheck);
  }

  /**
   * Play interactive sound for environment
   */
  playInteractiveSound(soundType: string): void {
    const envAudio = ENVIRONMENTAL_AUDIO[this.currentBiome];
    if (!envAudio) return;

    const interactiveSound = envAudio.interactiveSounds.find(sound => 
      sound.includes(soundType)
    );

    if (interactiveSound) {
      const soundId = `interactive_${soundType}`;
      this.audioManager.registerSound(soundId, {
        id: soundId,
        url: interactiveSound,
        type: 'sfx',
        preload: false,
        volume: 0.6
      });

      this.audioManager.playSound(soundId, { volume: 0.6 });
    }
  }

  /**
   * Get current audio context
   */
  getAudioContext(): {
    biome: string;
    weather: string;
    timeOfDay: string;
    situation: string;
    currentTrack: string | null;
    activeAnimals: number;
  } {
    return {
      biome: this.currentBiome,
      weather: this.currentWeather,
      timeOfDay: this.currentTimeOfDay,
      situation: this.currentSituation,
      currentTrack: this.currentMusicTrack,
      activeAnimals: this.activeAnimals.size
    };
  }
}

export default ComprehensiveAudioSystem;