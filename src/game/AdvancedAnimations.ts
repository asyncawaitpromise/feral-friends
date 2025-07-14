// Advanced Animation System
// Complex animal behaviors, weather effects, seasonal transitions, and interaction feedback

export type AnimationType = 'movement' | 'behavior' | 'weather' | 'seasonal' | 'interaction' | 'ui';
export type EasingFunction = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic' | 'back';

export interface AnimationConfig {
  id: string;
  type: AnimationType;
  duration: number;
  easing: EasingFunction;
  loop: boolean;
  autoReverse: boolean;
  delay: number;
  priority: number;
}

export interface KeyFrame {
  time: number; // 0-1
  properties: Record<string, any>;
  easing?: EasingFunction;
}

export interface ComplexAnimation {
  config: AnimationConfig;
  keyframes: KeyFrame[];
  onStart?: () => void;
  onUpdate?: (progress: number, properties: Record<string, any>) => void;
  onComplete?: () => void;
  isActive: boolean;
  startTime: number;
  currentTime: number;
}

export interface AnimalBehaviorAnimation {
  species: string;
  behavior: string;
  animations: {
    enter: ComplexAnimation;
    loop: ComplexAnimation;
    exit: ComplexAnimation;
  };
  triggers: string[];
  cooldown: number;
  lastPlayed: number;
}

export interface WeatherEffect {
  weatherType: string;
  particles: ParticleAnimation[];
  environmentChanges: ComplexAnimation[];
  intensity: number;
  coverage: number;
}

export interface ParticleAnimation {
  id: string;
  count: number;
  lifetime: number;
  spawnRate: number;
  physics: {
    gravity: number;
    wind: { x: number; y: number };
    friction: number;
    bounce: number;
  };
  appearance: {
    size: { min: number; max: number };
    color: { start: string; end: string };
    opacity: { start: number; end: number };
    rotation: { start: number; end: number; speed: number };
  };
  movement: {
    speed: { min: number; max: number };
    direction: { min: number; max: number }; // degrees
    acceleration: number;
    turbulence: number;
  };
}

export interface SeasonalTransition {
  fromSeason: string;
  toSeason: string;
  duration: number;
  effects: {
    colorShifts: Array<{ from: string; to: string; target: string }>;
    particleChanges: ParticleAnimation[];
    animationChanges: ComplexAnimation[];
  };
}

// Easing functions
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  bounce: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  elastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
  },
  back: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }
};

// Animal behavior animations
export const ANIMAL_BEHAVIOR_ANIMATIONS: Record<string, AnimalBehaviorAnimation> = {
  rabbit_alert: {
    species: 'rabbit',
    behavior: 'alert',
    animations: {
      enter: {
        config: {
          id: 'rabbit_alert_enter',
          type: 'behavior',
          duration: 300,
          easing: 'easeOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 3
        },
        keyframes: [
          { time: 0, properties: { scaleY: 1.0, rotation: 0 } },
          { time: 0.5, properties: { scaleY: 1.2, rotation: 5 } },
          { time: 1, properties: { scaleY: 1.1, rotation: 0 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      loop: {
        config: {
          id: 'rabbit_alert_loop',
          type: 'behavior',
          duration: 2000,
          easing: 'easeInOut',
          loop: true,
          autoReverse: true,
          delay: 0,
          priority: 2
        },
        keyframes: [
          { time: 0, properties: { earRotation: 0, headTilt: 0 } },
          { time: 0.5, properties: { earRotation: 15, headTilt: 5 } },
          { time: 1, properties: { earRotation: -10, headTilt: -3 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      exit: {
        config: {
          id: 'rabbit_alert_exit',
          type: 'behavior',
          duration: 500,
          easing: 'easeIn',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 3
        },
        keyframes: [
          { time: 0, properties: { scaleY: 1.1, tension: 1.0 } },
          { time: 1, properties: { scaleY: 1.0, tension: 0.0 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    },
    triggers: ['player_approach', 'loud_noise', 'predator_nearby'],
    cooldown: 5000,
    lastPlayed: 0
  },

  fox_hunting: {
    species: 'fox',
    behavior: 'hunting',
    animations: {
      enter: {
        config: {
          id: 'fox_hunting_enter',
          type: 'behavior',
          duration: 800,
          easing: 'easeOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 4
        },
        keyframes: [
          { time: 0, properties: { posture: 'normal', focus: 0 } },
          { time: 0.3, properties: { posture: 'crouch', focus: 0.5 } },
          { time: 1, properties: { posture: 'stalk', focus: 1.0 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      loop: {
        config: {
          id: 'fox_hunting_loop',
          type: 'behavior',
          duration: 3000,
          easing: 'linear',
          loop: true,
          autoReverse: false,
          delay: 0,
          priority: 3
        },
        keyframes: [
          { time: 0, properties: { headBob: 0, tailSwish: 0 } },
          { time: 0.25, properties: { headBob: 0.3, tailSwish: 0.2 } },
          { time: 0.5, properties: { headBob: 0, tailSwish: 0.5 } },
          { time: 0.75, properties: { headBob: -0.2, tailSwish: 0.3 } },
          { time: 1, properties: { headBob: 0, tailSwish: 0 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      exit: {
        config: {
          id: 'fox_hunting_exit',
          type: 'behavior',
          duration: 600,
          easing: 'easeInOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 4
        },
        keyframes: [
          { time: 0, properties: { posture: 'stalk', intensity: 1.0 } },
          { time: 1, properties: { posture: 'normal', intensity: 0.0 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    },
    triggers: ['prey_spotted', 'hunger_high'],
    cooldown: 10000,
    lastPlayed: 0
  },

  butterfly_dance: {
    species: 'butterfly',
    behavior: 'dance',
    animations: {
      enter: {
        config: {
          id: 'butterfly_dance_enter',
          type: 'behavior',
          duration: 500,
          easing: 'easeOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 2
        },
        keyframes: [
          { time: 0, properties: { wingSpeed: 1.0, altitude: 0 } },
          { time: 1, properties: { wingSpeed: 1.5, altitude: 0.2 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      loop: {
        config: {
          id: 'butterfly_dance_loop',
          type: 'behavior',
          duration: 4000,
          easing: 'easeInOut',
          loop: true,
          autoReverse: false,
          delay: 0,
          priority: 2
        },
        keyframes: [
          { time: 0, properties: { x: 0, y: 0, rotation: 0 } },
          { time: 0.25, properties: { x: 0.3, y: 0.2, rotation: 45 } },
          { time: 0.5, properties: { x: 0, y: 0.4, rotation: 90 } },
          { time: 0.75, properties: { x: -0.3, y: 0.2, rotation: 180 } },
          { time: 1, properties: { x: 0, y: 0, rotation: 360 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      exit: {
        config: {
          id: 'butterfly_dance_exit',
          type: 'behavior',
          duration: 400,
          easing: 'easeIn',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 2
        },
        keyframes: [
          { time: 0, properties: { wingSpeed: 1.5, altitude: 0.2 } },
          { time: 1, properties: { wingSpeed: 1.0, altitude: 0 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    },
    triggers: ['flower_nearby', 'sunny_weather', 'happy_mood'],
    cooldown: 15000,
    lastPlayed: 0
  },

  wolf_howl: {
    species: 'wolf',
    behavior: 'howl',
    animations: {
      enter: {
        config: {
          id: 'wolf_howl_enter',
          type: 'behavior',
          duration: 1000,
          easing: 'easeOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 5
        },
        keyframes: [
          { time: 0, properties: { headTilt: 0, chestExpansion: 0 } },
          { time: 0.7, properties: { headTilt: 45, chestExpansion: 0.3 } },
          { time: 1, properties: { headTilt: 60, chestExpansion: 0.5 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      loop: {
        config: {
          id: 'wolf_howl_loop',
          type: 'behavior',
          duration: 3000,
          easing: 'easeInOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 5
        },
        keyframes: [
          { time: 0, properties: { headTilt: 60, intensity: 0 } },
          { time: 0.1, properties: { headTilt: 65, intensity: 0.3 } },
          { time: 0.8, properties: { headTilt: 70, intensity: 1.0 } },
          { time: 1, properties: { headTilt: 65, intensity: 0.7 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      },
      exit: {
        config: {
          id: 'wolf_howl_exit',
          type: 'behavior',
          duration: 800,
          easing: 'easeIn',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 5
        },
        keyframes: [
          { time: 0, properties: { headTilt: 65, chestExpansion: 0.5 } },
          { time: 1, properties: { headTilt: 0, chestExpansion: 0 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    },
    triggers: ['night_time', 'pack_communication', 'territorial_call'],
    cooldown: 30000,
    lastPlayed: 0
  }
};

// Weather effects
export const WEATHER_EFFECTS: Record<string, WeatherEffect> = {
  rain: {
    weatherType: 'rain',
    intensity: 0.8,
    coverage: 1.0,
    particles: [
      {
        id: 'raindrops',
        count: 150,
        lifetime: 2000,
        spawnRate: 75,
        physics: {
          gravity: 200,
          wind: { x: -20, y: 0 },
          friction: 0.02,
          bounce: 0.1
        },
        appearance: {
          size: { min: 1, max: 3 },
          color: { start: '#87CEEB', end: '#4682B4' },
          opacity: { start: 0.8, end: 0.2 },
          rotation: { start: 0, end: 0, speed: 0 }
        },
        movement: {
          speed: { min: 100, max: 200 },
          direction: { min: 260, max: 280 },
          acceleration: 50,
          turbulence: 0.1
        }
      }
    ],
    environmentChanges: [
      {
        config: {
          id: 'rain_color_shift',
          type: 'weather',
          duration: 5000,
          easing: 'easeInOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 1
        },
        keyframes: [
          { time: 0, properties: { brightness: 1.0, saturation: 1.0 } },
          { time: 1, properties: { brightness: 0.7, saturation: 0.8 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    ]
  },

  snow: {
    weatherType: 'snow',
    intensity: 0.6,
    coverage: 1.0,
    particles: [
      {
        id: 'snowflakes',
        count: 100,
        lifetime: 5000,
        spawnRate: 20,
        physics: {
          gravity: 30,
          wind: { x: 10, y: 0 },
          friction: 0.98,
          bounce: 0
        },
        appearance: {
          size: { min: 2, max: 6 },
          color: { start: '#FFFFFF', end: '#E6E6FA' },
          opacity: { start: 0.9, end: 0.3 },
          rotation: { start: 0, end: 360, speed: 30 }
        },
        movement: {
          speed: { min: 20, max: 60 },
          direction: { min: 260, max: 280 },
          acceleration: 5,
          turbulence: 0.5
        }
      }
    ],
    environmentChanges: [
      {
        config: {
          id: 'snow_color_shift',
          type: 'weather',
          duration: 8000,
          easing: 'easeInOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 1
        },
        keyframes: [
          { time: 0, properties: { brightness: 1.0, temperature: 0 } },
          { time: 1, properties: { brightness: 1.2, temperature: -0.3 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    ]
  },

  wind: {
    weatherType: 'wind',
    intensity: 0.4,
    coverage: 1.0,
    particles: [
      {
        id: 'leaves',
        count: 50,
        lifetime: 3000,
        spawnRate: 15,
        physics: {
          gravity: 40,
          wind: { x: 120, y: -10 },
          friction: 0.95,
          bounce: 0.3
        },
        appearance: {
          size: { min: 3, max: 8 },
          color: { start: '#8FBC8F', end: '#228B22' },
          opacity: { start: 0.8, end: 0.1 },
          rotation: { start: 0, end: 720, speed: 180 }
        },
        movement: {
          speed: { min: 80, max: 150 },
          direction: { min: 45, max: 135 },
          acceleration: 20,
          turbulence: 0.8
        }
      }
    ],
    environmentChanges: [
      {
        config: {
          id: 'wind_sway',
          type: 'weather',
          duration: 2000,
          easing: 'easeInOut',
          loop: true,
          autoReverse: true,
          delay: 0,
          priority: 1
        },
        keyframes: [
          { time: 0, properties: { sway: 0, rustleIntensity: 0 } },
          { time: 1, properties: { sway: 0.1, rustleIntensity: 0.7 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    ]
  },

  fog: {
    weatherType: 'fog',
    intensity: 0.7,
    coverage: 1.0,
    particles: [
      {
        id: 'fogmist',
        count: 80,
        lifetime: 8000,
        spawnRate: 10,
        physics: {
          gravity: -5,
          wind: { x: 15, y: -5 },
          friction: 0.99,
          bounce: 0
        },
        appearance: {
          size: { min: 20, max: 50 },
          color: { start: '#F5F5F5', end: '#DCDCDC' },
          opacity: { start: 0.3, end: 0.0 },
          rotation: { start: 0, end: 90, speed: 5 }
        },
        movement: {
          speed: { min: 10, max: 30 },
          direction: { min: 0, max: 360 },
          acceleration: 2,
          turbulence: 0.3
        }
      }
    ],
    environmentChanges: [
      {
        config: {
          id: 'fog_visibility',
          type: 'weather',
          duration: 10000,
          easing: 'easeInOut',
          loop: false,
          autoReverse: false,
          delay: 0,
          priority: 1
        },
        keyframes: [
          { time: 0, properties: { visibility: 1.0, contrast: 1.0 } },
          { time: 1, properties: { visibility: 0.3, contrast: 0.6 } }
        ],
        isActive: false,
        startTime: 0,
        currentTime: 0
      }
    ]
  }
};

// Seasonal transitions
export const SEASONAL_TRANSITIONS: Record<string, SeasonalTransition> = {
  spring_to_summer: {
    fromSeason: 'spring',
    toSeason: 'summer',
    duration: 15000,
    effects: {
      colorShifts: [
        { from: '#90EE90', to: '#32CD32', target: 'grass' },
        { from: '#FFB6C1', to: '#FF69B4', target: 'flowers' },
        { from: '#98FB98', to: '#00FF00', target: 'leaves' }
      ],
      particleChanges: [
        {
          id: 'pollen',
          count: 30,
          lifetime: 4000,
          spawnRate: 8,
          physics: { gravity: -10, wind: { x: 5, y: -2 }, friction: 0.98, bounce: 0 },
          appearance: {
            size: { min: 1, max: 3 },
            color: { start: '#FFD700', end: '#FFA500' },
            opacity: { start: 0.6, end: 0.0 },
            rotation: { start: 0, end: 180, speed: 45 }
          },
          movement: {
            speed: { min: 15, max: 40 },
            direction: { min: 60, max: 120 },
            acceleration: 5,
            turbulence: 0.4
          }
        }
      ],
      animationChanges: []
    }
  },

  summer_to_autumn: {
    fromSeason: 'summer',
    toSeason: 'autumn',
    duration: 20000,
    effects: {
      colorShifts: [
        { from: '#32CD32', to: '#DAA520', target: 'leaves' },
        { from: '#228B22', to: '#8B4513', target: 'grass' },
        { from: '#87CEEB', to: '#4682B4', target: 'sky' }
      ],
      particleChanges: [
        {
          id: 'falling_leaves',
          count: 60,
          lifetime: 6000,
          spawnRate: 15,
          physics: { gravity: 25, wind: { x: 20, y: 0 }, friction: 0.95, bounce: 0.2 },
          appearance: {
            size: { min: 4, max: 10 },
            color: { start: '#FF8C00', end: '#8B4513' },
            opacity: { start: 0.8, end: 0.1 },
            rotation: { start: 0, end: 360, speed: 90 }
          },
          movement: {
            speed: { min: 30, max: 80 },
            direction: { min: 210, max: 330 },
            acceleration: 10,
            turbulence: 0.6
          }
        }
      ],
      animationChanges: []
    }
  },

  autumn_to_winter: {
    fromSeason: 'autumn',
    toSeason: 'winter',
    duration: 25000,
    effects: {
      colorShifts: [
        { from: '#DAA520', to: '#F5F5F5', target: 'ground' },
        { from: '#8B4513', to: '#696969', target: 'trees' },
        { from: '#4682B4', to: '#B0C4DE', target: 'sky' }
      ],
      particleChanges: [
        {
          id: 'frost_crystals',
          count: 40,
          lifetime: 3000,
          spawnRate: 12,
          physics: { gravity: 0, wind: { x: 0, y: 0 }, friction: 1.0, bounce: 0 },
          appearance: {
            size: { min: 2, max: 5 },
            color: { start: '#E6E6FA', end: '#FFFFFF' },
            opacity: { start: 0.0, end: 0.8 },
            rotation: { start: 0, end: 60, speed: 10 }
          },
          movement: {
            speed: { min: 0, max: 5 },
            direction: { min: 0, max: 360 },
            acceleration: 0,
            turbulence: 0.1
          }
        }
      ],
      animationChanges: []
    }
  },

  winter_to_spring: {
    fromSeason: 'winter',
    toSeason: 'spring',
    duration: 18000,
    effects: {
      colorShifts: [
        { from: '#F5F5F5', to: '#90EE90', target: 'ground' },
        { from: '#696969', to: '#8FBC8F', target: 'trees' },
        { from: '#B0C4DE', to: '#87CEEB', target: 'sky' }
      ],
      particleChanges: [
        {
          id: 'new_growth',
          count: 25,
          lifetime: 5000,
          spawnRate: 5,
          physics: { gravity: -15, wind: { x: 0, y: -10 }, friction: 0.97, bounce: 0 },
          appearance: {
            size: { min: 1, max: 4 },
            color: { start: '#98FB98', end: '#32CD32' },
            opacity: { start: 0.0, end: 0.9 },
            rotation: { start: 0, end: 45, speed: 15 }
          },
          movement: {
            speed: { min: 20, max: 50 },
            direction: { min: 80, max: 100 },
            acceleration: 8,
            turbulence: 0.2
          }
        }
      ],
      animationChanges: []
    }
  }
};

// Active animation state
export const animationState = {
  activeAnimations: new Map<string, ComplexAnimation>(),
  behaviorTimers: new Map<string, number>(),
  weatherEffects: new Map<string, WeatherEffect>(),
  seasonalTransition: null as SeasonalTransition | null,
  globalTime: 0,
  paused: false
};

/**
 * Start a complex animation
 */
export function startAnimation(animation: ComplexAnimation): string {
  const id = animation.config.id;
  animation.isActive = true;
  animation.startTime = Date.now();
  animation.currentTime = 0;

  animationState.activeAnimations.set(id, animation);

  if (animation.onStart) {
    animation.onStart();
  }

  return id;
}

/**
 * Stop an animation
 */
export function stopAnimation(animationId: string): void {
  const animation = animationState.activeAnimations.get(animationId);
  if (animation) {
    animation.isActive = false;
    if (animation.onComplete) {
      animation.onComplete();
    }
    animationState.activeAnimations.delete(animationId);
  }
}

/**
 * Update all active animations
 */
export function updateAnimations(deltaTime: number): void {
  if (animationState.paused) return;

  animationState.globalTime += deltaTime;

  // Update complex animations
  animationState.activeAnimations.forEach((animation, id) => {
    updateComplexAnimation(animation, deltaTime);
    
    if (!animation.isActive) {
      animationState.activeAnimations.delete(id);
    }
  });

  // Update weather effects
  updateWeatherEffects(deltaTime);

  // Update seasonal transition
  if (animationState.seasonalTransition) {
    updateSeasonalTransition(deltaTime);
  }
}

/**
 * Update a complex animation
 */
function updateComplexAnimation(animation: ComplexAnimation, deltaTime: number): void {
  animation.currentTime += deltaTime;
  const progress = Math.min(animation.currentTime / animation.config.duration, 1);

  // Apply easing
  const easedProgress = EASING_FUNCTIONS[animation.config.easing](progress);

  // Interpolate between keyframes
  const currentProperties = interpolateKeyframes(animation.keyframes, easedProgress);

  // Call update callback
  if (animation.onUpdate) {
    animation.onUpdate(easedProgress, currentProperties);
  }

  // Check if animation is complete
  if (progress >= 1) {
    if (animation.config.loop) {
      if (animation.config.autoReverse) {
        // Reverse keyframes and restart
        animation.keyframes.reverse();
        animation.currentTime = 0;
      } else {
        animation.currentTime = 0;
      }
    } else {
      animation.isActive = false;
      if (animation.onComplete) {
        animation.onComplete();
      }
    }
  }
}

/**
 * Interpolate between keyframes
 */
function interpolateKeyframes(keyframes: KeyFrame[], progress: number): Record<string, any> {
  if (keyframes.length === 0) return {};
  if (keyframes.length === 1) return keyframes[0].properties;

  // Find surrounding keyframes
  let fromFrame = keyframes[0];
  let toFrame = keyframes[keyframes.length - 1];
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
      fromFrame = keyframes[i];
      toFrame = keyframes[i + 1];
      break;
    }
  }

  // Calculate local progress between frames
  const frameProgress = (progress - fromFrame.time) / (toFrame.time - fromFrame.time);
  const easedFrameProgress = toFrame.easing ? 
    EASING_FUNCTIONS[toFrame.easing](frameProgress) : frameProgress;

  // Interpolate properties
  const result: Record<string, any> = {};
  const fromProps = fromFrame.properties;
  const toProps = toFrame.properties;

  Object.keys(fromProps).forEach(key => {
    if (typeof fromProps[key] === 'number' && typeof toProps[key] === 'number') {
      result[key] = fromProps[key] + (toProps[key] - fromProps[key]) * easedFrameProgress;
    } else {
      result[key] = easedFrameProgress > 0.5 ? toProps[key] : fromProps[key];
    }
  });

  return result;
}

/**
 * Trigger animal behavior animation
 */
export function triggerAnimalBehavior(
  animalId: string, 
  species: string, 
  behavior: string,
  trigger?: string
): boolean {
  const behaviorKey = `${species}_${behavior}`;
  const behaviorAnim = ANIMAL_BEHAVIOR_ANIMATIONS[behaviorKey];
  
  if (!behaviorAnim) return false;

  // Check cooldown
  const lastPlayed = animationState.behaviorTimers.get(animalId) || 0;
  if (Date.now() - lastPlayed < behaviorAnim.cooldown) return false;

  // Check if trigger is valid
  if (trigger && !behaviorAnim.triggers.includes(trigger)) return false;

  // Start behavior sequence
  const enterAnim = { ...behaviorAnim.animations.enter };
  enterAnim.config.id = `${animalId}_${enterAnim.config.id}`;
  
  const loopAnim = { ...behaviorAnim.animations.loop };
  loopAnim.config.id = `${animalId}_${loopAnim.config.id}`;
  
  const exitAnim = { ...behaviorAnim.animations.exit };
  exitAnim.config.id = `${animalId}_${exitAnim.config.id}`;

  // Chain animations
  enterAnim.onComplete = () => {
    startAnimation(loopAnim);
    
    // Schedule exit after loop duration
    setTimeout(() => {
      stopAnimation(loopAnim.config.id);
      startAnimation(exitAnim);
    }, loopAnim.config.duration);
  };

  startAnimation(enterAnim);
  animationState.behaviorTimers.set(animalId, Date.now());

  return true;
}

/**
 * Start weather effect
 */
export function startWeatherEffect(weatherType: string): void {
  const effect = WEATHER_EFFECTS[weatherType];
  if (!effect) return;

  // Stop previous weather
  animationState.weatherEffects.clear();

  // Start new weather
  animationState.weatherEffects.set(weatherType, effect);

  // Start environment change animations
  effect.environmentChanges.forEach(animation => {
    startAnimation(animation);
  });
}

/**
 * Stop weather effect
 */
export function stopWeatherEffect(weatherType: string): void {
  animationState.weatherEffects.delete(weatherType);
}

/**
 * Update weather effects
 */
function updateWeatherEffects(deltaTime: number): void {
  animationState.weatherEffects.forEach((effect) => {
    // Update particle systems
    effect.particles.forEach(particle => {
      updateParticleSystem(particle, deltaTime);
    });
  });
}

/**
 * Update particle system
 */
function updateParticleSystem(particle: ParticleAnimation, deltaTime: number): void {
  // This would update individual particles in the system
  // Implementation depends on the rendering system being used
}

/**
 * Start seasonal transition
 */
export function startSeasonalTransition(fromSeason: string, toSeason: string): void {
  const transitionKey = `${fromSeason}_to_${toSeason}`;
  const transition = SEASONAL_TRANSITIONS[transitionKey];
  
  if (!transition) return;

  animationState.seasonalTransition = { ...transition };
  
  // Start transition effects
  transition.effects.animationChanges.forEach(animation => {
    startAnimation(animation);
  });
}

/**
 * Update seasonal transition
 */
function updateSeasonalTransition(deltaTime: number): void {
  const transition = animationState.seasonalTransition;
  if (!transition) return;

  // Update transition progress
  // Implementation would handle color shifts and environment changes
}

/**
 * Create interaction feedback animation
 */
export function createInteractionFeedback(
  type: 'success' | 'failure' | 'neutral',
  position: { x: number; y: number }
): string {
  const feedbackAnimations = {
    success: {
      config: {
        id: `feedback_success_${Date.now()}`,
        type: 'interaction' as AnimationType,
        duration: 1000,
        easing: 'bounce' as EasingFunction,
        loop: false,
        autoReverse: false,
        delay: 0,
        priority: 10
      },
      keyframes: [
        { time: 0, properties: { scale: 0, opacity: 0, y: position.y } },
        { time: 0.3, properties: { scale: 1.2, opacity: 1, y: position.y - 20 } },
        { time: 1, properties: { scale: 1, opacity: 0, y: position.y - 40 } }
      ],
      isActive: false,
      startTime: 0,
      currentTime: 0
    },
    failure: {
      config: {
        id: `feedback_failure_${Date.now()}`,
        type: 'interaction' as AnimationType,
        duration: 800,
        easing: 'easeOut' as EasingFunction,
        loop: false,
        autoReverse: false,
        delay: 0,
        priority: 10
      },
      keyframes: [
        { time: 0, properties: { shake: 0, opacity: 1 } },
        { time: 0.2, properties: { shake: 10, opacity: 0.8 } },
        { time: 0.4, properties: { shake: -8, opacity: 0.6 } },
        { time: 0.6, properties: { shake: 6, opacity: 0.4 } },
        { time: 1, properties: { shake: 0, opacity: 0 } }
      ],
      isActive: false,
      startTime: 0,
      currentTime: 0
    },
    neutral: {
      config: {
        id: `feedback_neutral_${Date.now()}`,
        type: 'interaction' as AnimationType,
        duration: 600,
        easing: 'easeInOut' as EasingFunction,
        loop: false,
        autoReverse: false,
        delay: 0,
        priority: 5
      },
      keyframes: [
        { time: 0, properties: { scale: 1, opacity: 0.8 } },
        { time: 0.5, properties: { scale: 1.1, opacity: 1 } },
        { time: 1, properties: { scale: 1, opacity: 0 } }
      ],
      isActive: false,
      startTime: 0,
      currentTime: 0
    }
  };

  const animation = feedbackAnimations[type];
  return startAnimation(animation);
}

/**
 * Pause all animations
 */
export function pauseAnimations(): void {
  animationState.paused = true;
}

/**
 * Resume all animations
 */
export function resumeAnimations(): void {
  animationState.paused = false;
}

/**
 * Get animation system stats
 */
export function getAnimationStats(): {
  activeAnimations: number;
  behaviorTimers: number;
  weatherEffects: number;
  globalTime: number;
  paused: boolean;
} {
  return {
    activeAnimations: animationState.activeAnimations.size,
    behaviorTimers: animationState.behaviorTimers.size,
    weatherEffects: animationState.weatherEffects.size,
    globalTime: animationState.globalTime,
    paused: animationState.paused
  };
}

export default {
  EASING_FUNCTIONS,
  ANIMAL_BEHAVIOR_ANIMATIONS,
  WEATHER_EFFECTS,
  SEASONAL_TRANSITIONS,
  animationState,
  startAnimation,
  stopAnimation,
  updateAnimations,
  triggerAnimalBehavior,
  startWeatherEffect,
  stopWeatherEffect,
  startSeasonalTransition,
  createInteractionFeedback,
  pauseAnimations,
  resumeAnimations,
  getAnimationStats
};