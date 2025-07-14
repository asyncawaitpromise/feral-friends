// Visual Enhancement System
// Handles improved graphics, terrain textures, animal sprites, UI polish, and visual effects

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';
export type VisualEffectType = 'particles' | 'shadows' | 'lighting' | 'bloom' | 'distortion';

export interface VisualSettings {
  overallQuality: QualityLevel;
  animalDetailLevel: QualityLevel;
  terrainQuality: QualityLevel;
  effectsQuality: QualityLevel;
  uiAnimations: boolean;
  particleCount: number;
  shadowQuality: QualityLevel;
  enableBloom: boolean;
  enableDistortion: boolean;
  frameRateLimit: number;
}

export interface TerrainTexture {
  biome: string;
  baseTexture: string;
  normalMap?: string;
  roughnessMap?: string;
  variants: string[];
  seasonalVariants: Record<string, string>;
  animationFrames?: string[];
  tileSize: number;
  quality: QualityLevel;
}

export interface AnimalSprite {
  species: string;
  variant?: string;
  states: Record<string, SpriteState>;
  qualityLevels: Record<QualityLevel, SpriteAssets>;
  shadowSprite?: string;
  glowEffect?: boolean;
  sparkleOverlay?: boolean;
}

export interface SpriteState {
  name: string;
  frames: string[];
  duration: number;
  loop: boolean;
  transitions: Record<string, string>;
}

export interface SpriteAssets {
  spriteSheet: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  filters?: string[];
}

export interface VisualEffect {
  id: string;
  name: string;
  type: VisualEffectType;
  intensity: number;
  duration: number;
  position?: { x: number; y: number };
  followTarget?: string;
  particleConfig?: ParticleConfig;
  shaderConfig?: ShaderConfig;
}

export interface ParticleConfig {
  count: number;
  lifetime: number;
  speed: { min: number; max: number };
  size: { min: number; max: number };
  color: { start: string; end: string };
  opacity: { start: number; end: number };
  gravity: number;
  emission: number;
  texture?: string;
  blendMode: 'normal' | 'add' | 'multiply' | 'screen';
}

export interface ShaderConfig {
  fragment: string;
  vertex?: string;
  uniforms: Record<string, any>;
  enabled: boolean;
}

export interface UIPolishConfig {
  buttonHoverEffects: boolean;
  modalAnimations: boolean;
  transitionDuration: number;
  easingFunction: string;
  microInteractions: boolean;
  tooltipAnimations: boolean;
  loadingAnimations: boolean;
}

// Default visual settings
export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  overallQuality: 'medium',
  animalDetailLevel: 'medium',
  terrainQuality: 'medium',
  effectsQuality: 'medium',
  uiAnimations: true,
  particleCount: 50,
  shadowQuality: 'medium',
  enableBloom: true,
  enableDistortion: false,
  frameRateLimit: 60
};

// Terrain texture definitions
export const TERRAIN_TEXTURES: Record<string, TerrainTexture> = {
  temperate: {
    biome: 'temperate',
    baseTexture: '/textures/terrain/temperate_grass.png',
    normalMap: '/textures/terrain/temperate_grass_normal.png',
    variants: [
      '/textures/terrain/temperate_grass_variant1.png',
      '/textures/terrain/temperate_grass_variant2.png'
    ],
    seasonalVariants: {
      spring: '/textures/terrain/temperate_spring.png',
      summer: '/textures/terrain/temperate_summer.png',
      autumn: '/textures/terrain/temperate_autumn.png',
      winter: '/textures/terrain/temperate_winter.png'
    },
    tileSize: 64,
    quality: 'high'
  },

  forest: {
    biome: 'forest',
    baseTexture: '/textures/terrain/forest_floor.png',
    normalMap: '/textures/terrain/forest_floor_normal.png',
    variants: [
      '/textures/terrain/forest_moss.png',
      '/textures/terrain/forest_leaves.png',
      '/textures/terrain/forest_rocks.png'
    ],
    seasonalVariants: {
      spring: '/textures/terrain/forest_spring.png',
      summer: '/textures/terrain/forest_summer.png',
      autumn: '/textures/terrain/forest_autumn.png',
      winter: '/textures/terrain/forest_winter.png'
    },
    tileSize: 64,
    quality: 'high'
  },

  water: {
    biome: 'water',
    baseTexture: '/textures/terrain/water_surface.png',
    variants: [
      '/textures/terrain/water_calm.png',
      '/textures/terrain/water_rippled.png',
      '/textures/terrain/water_deep.png'
    ],
    animationFrames: [
      '/textures/terrain/water_frame1.png',
      '/textures/terrain/water_frame2.png',
      '/textures/terrain/water_frame3.png',
      '/textures/terrain/water_frame4.png'
    ],
    seasonalVariants: {
      spring: '/textures/terrain/water_spring.png',
      summer: '/textures/terrain/water_summer.png',
      autumn: '/textures/terrain/water_autumn.png',
      winter: '/textures/terrain/water_frozen.png'
    },
    tileSize: 64,
    quality: 'high'
  },

  mountain: {
    biome: 'mountain',
    baseTexture: '/textures/terrain/mountain_rock.png',
    normalMap: '/textures/terrain/mountain_rock_normal.png',
    roughnessMap: '/textures/terrain/mountain_rock_roughness.png',
    variants: [
      '/textures/terrain/mountain_stone.png',
      '/textures/terrain/mountain_cliff.png',
      '/textures/terrain/mountain_snow.png'
    ],
    seasonalVariants: {
      spring: '/textures/terrain/mountain_spring.png',
      summer: '/textures/terrain/mountain_summer.png',
      autumn: '/textures/terrain/mountain_autumn.png',
      winter: '/textures/terrain/mountain_winter.png'
    },
    tileSize: 64,
    quality: 'high'
  }
};

// Enhanced animal sprites
export const ENHANCED_ANIMAL_SPRITES: Record<string, AnimalSprite> = {
  rabbit: {
    species: 'rabbit',
    states: {
      idle: {
        name: 'idle',
        frames: ['rabbit_idle_1', 'rabbit_idle_2', 'rabbit_idle_3'],
        duration: 2000,
        loop: true,
        transitions: { moving: 'hop', eating: 'feed' }
      },
      hop: {
        name: 'hop',
        frames: ['rabbit_hop_1', 'rabbit_hop_2', 'rabbit_hop_3', 'rabbit_hop_4'],
        duration: 600,
        loop: true,
        transitions: { idle: 'idle', eating: 'feed' }
      },
      feed: {
        name: 'feed',
        frames: ['rabbit_feed_1', 'rabbit_feed_2'],
        duration: 1500,
        loop: true,
        transitions: { idle: 'idle', moving: 'hop' }
      }
    },
    qualityLevels: {
      low: { spriteSheet: '/sprites/animals/rabbit_low.png', frameWidth: 32, frameHeight: 32, scale: 1.0 },
      medium: { spriteSheet: '/sprites/animals/rabbit_med.png', frameWidth: 48, frameHeight: 48, scale: 1.0 },
      high: { spriteSheet: '/sprites/animals/rabbit_high.png', frameWidth: 64, frameHeight: 64, scale: 1.0 },
      ultra: { spriteSheet: '/sprites/animals/rabbit_ultra.png', frameWidth: 96, frameHeight: 96, scale: 1.0, filters: ['bloom', 'shadow'] }
    },
    shadowSprite: '/sprites/animals/rabbit_shadow.png'
  },

  fox: {
    species: 'fox',
    states: {
      idle: {
        name: 'idle',
        frames: ['fox_idle_1', 'fox_idle_2', 'fox_idle_3', 'fox_idle_4'],
        duration: 2500,
        loop: true,
        transitions: { moving: 'walk', alert: 'alert' }
      },
      walk: {
        name: 'walk',
        frames: ['fox_walk_1', 'fox_walk_2', 'fox_walk_3', 'fox_walk_4'],
        duration: 800,
        loop: true,
        transitions: { idle: 'idle', running: 'run' }
      },
      run: {
        name: 'run',
        frames: ['fox_run_1', 'fox_run_2', 'fox_run_3', 'fox_run_4'],
        duration: 400,
        loop: true,
        transitions: { walking: 'walk', idle: 'idle' }
      },
      alert: {
        name: 'alert',
        frames: ['fox_alert_1', 'fox_alert_2'],
        duration: 1000,
        loop: false,
        transitions: { idle: 'idle', running: 'run' }
      }
    },
    qualityLevels: {
      low: { spriteSheet: '/sprites/animals/fox_low.png', frameWidth: 40, frameHeight: 32, scale: 1.0 },
      medium: { spriteSheet: '/sprites/animals/fox_med.png', frameWidth: 60, frameHeight: 48, scale: 1.0 },
      high: { spriteSheet: '/sprites/animals/fox_high.png', frameWidth: 80, frameHeight: 64, scale: 1.0 },
      ultra: { spriteSheet: '/sprites/animals/fox_ultra.png', frameWidth: 120, frameHeight: 96, scale: 1.0, filters: ['bloom', 'shadow'] }
    },
    shadowSprite: '/sprites/animals/fox_shadow.png'
  },

  butterfly: {
    species: 'butterfly',
    states: {
      flutter: {
        name: 'flutter',
        frames: ['butterfly_flutter_1', 'butterfly_flutter_2', 'butterfly_flutter_3', 'butterfly_flutter_4'],
        duration: 500,
        loop: true,
        transitions: { resting: 'rest' }
      },
      rest: {
        name: 'rest',
        frames: ['butterfly_rest_1', 'butterfly_rest_2'],
        duration: 3000,
        loop: true,
        transitions: { flying: 'flutter' }
      }
    },
    qualityLevels: {
      low: { spriteSheet: '/sprites/animals/butterfly_low.png', frameWidth: 24, frameHeight: 24, scale: 1.0 },
      medium: { spriteSheet: '/sprites/animals/butterfly_med.png', frameWidth: 32, frameHeight: 32, scale: 1.0 },
      high: { spriteSheet: '/sprites/animals/butterfly_high.png', frameWidth: 48, frameHeight: 48, scale: 1.0 },
      ultra: { spriteSheet: '/sprites/animals/butterfly_ultra.png', frameWidth: 64, frameHeight: 64, scale: 1.0, filters: ['bloom', 'sparkle'] }
    },
    sparkleOverlay: true
  }
};

// Visual effect templates
export const VISUAL_EFFECT_TEMPLATES: Record<string, Omit<VisualEffect, 'id'>> = {
  animalSparkle: {
    name: 'Animal Sparkle',
    type: 'particles',
    intensity: 0.7,
    duration: 2000,
    particleConfig: {
      count: 15,
      lifetime: 1500,
      speed: { min: 20, max: 40 },
      size: { min: 2, max: 6 },
      color: { start: '#FFD700', end: '#FFA500' },
      opacity: { start: 1.0, end: 0.0 },
      gravity: -10,
      emission: 8,
      texture: '/particles/sparkle.png',
      blendMode: 'add'
    }
  },

  trustHearts: {
    name: 'Trust Hearts',
    type: 'particles',
    intensity: 1.0,
    duration: 1500,
    particleConfig: {
      count: 8,
      lifetime: 2000,
      speed: { min: 15, max: 25 },
      size: { min: 8, max: 12 },
      color: { start: '#FF69B4', end: '#FFB6C1' },
      opacity: { start: 1.0, end: 0.0 },
      gravity: -5,
      emission: 4,
      texture: '/particles/heart.png',
      blendMode: 'normal'
    }
  },

  waterRipple: {
    name: 'Water Ripple',
    type: 'distortion',
    intensity: 0.5,
    duration: 1000,
    shaderConfig: {
      fragment: `
        uniform float time;
        uniform vec2 center;
        uniform float intensity;
        varying vec2 vUv;
        
        void main() {
          vec2 diff = vUv - center;
          float dist = length(diff);
          float ripple = sin(dist * 20.0 - time * 5.0) * intensity * (1.0 - dist);
          vec2 offset = normalize(diff) * ripple * 0.01;
          gl_FragColor = texture2D(uTexture, vUv + offset);
        }
      `,
      uniforms: {
        time: 0.0,
        center: [0.5, 0.5],
        intensity: 0.5
      },
      enabled: true
    }
  },

  leafFall: {
    name: 'Falling Leaves',
    type: 'particles',
    intensity: 0.6,
    duration: 5000,
    particleConfig: {
      count: 25,
      lifetime: 4000,
      speed: { min: 10, max: 30 },
      size: { min: 4, max: 8 },
      color: { start: '#8B4513', end: '#CD853F' },
      opacity: { start: 0.8, end: 0.0 },
      gravity: 15,
      emission: 5,
      texture: '/particles/leaf.png',
      blendMode: 'normal'
    }
  },

  magicAura: {
    name: 'Magic Aura',
    type: 'bloom',
    intensity: 1.2,
    duration: 3000,
    shaderConfig: {
      fragment: `
        uniform float time;
        uniform float intensity;
        uniform vec3 color;
        varying vec2 vUv;
        
        void main() {
          float pulse = sin(time * 3.0) * 0.5 + 0.5;
          float glow = pulse * intensity;
          vec4 original = texture2D(uTexture, vUv);
          gl_FragColor = original + vec4(color * glow, 0.0);
        }
      `,
      uniforms: {
        time: 0.0,
        intensity: 1.2,
        color: [0.5, 0.0, 1.0]
      },
      enabled: true
    }
  }
};

// UI Polish configuration
export const UI_POLISH_CONFIG: UIPolishConfig = {
  buttonHoverEffects: true,
  modalAnimations: true,
  transitionDuration: 300,
  easingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  microInteractions: true,
  tooltipAnimations: true,
  loadingAnimations: true
};

// Visual enhancement state
export const visualEnhancementState = {
  currentSettings: { ...DEFAULT_VISUAL_SETTINGS },
  loadedTextures: new Map<string, any>(),
  activeEffects: new Map<string, VisualEffect>(),
  performanceMetrics: {
    fps: 60,
    drawCalls: 0,
    memoryUsage: 0,
    lastUpdate: Date.now()
  }
};

/**
 * Initialize visual enhancement system
 */
export function initializeVisualEnhancements(): void {
  // Auto-detect device capabilities
  const deviceCapabilities = detectDeviceCapabilities();
  
  // Set appropriate quality based on device
  visualEnhancementState.currentSettings = getOptimalSettings(deviceCapabilities);
  
  // Preload essential textures
  preloadCriticalAssets();
}

/**
 * Detect device capabilities for optimal settings
 */
export function detectDeviceCapabilities(): {
  isMobile: boolean;
  isLowEnd: boolean;
  supportsWebGL2: boolean;
  maxTextureSize: number;
  availableMemory: number;
} {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEnd = isMobile && (navigator.hardwareConcurrency || 4) < 4;
  
  return {
    isMobile,
    isLowEnd,
    supportsWebGL2: !!canvas.getContext('webgl2'),
    maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048,
    availableMemory: (navigator as any).deviceMemory || 4
  };
}

/**
 * Get optimal settings based on device capabilities
 */
export function getOptimalSettings(capabilities: ReturnType<typeof detectDeviceCapabilities>): VisualSettings {
  if (capabilities.isLowEnd) {
    return {
      overallQuality: 'low',
      animalDetailLevel: 'low',
      terrainQuality: 'low',
      effectsQuality: 'low',
      uiAnimations: false,
      particleCount: 10,
      shadowQuality: 'low',
      enableBloom: false,
      enableDistortion: false,
      frameRateLimit: 30
    };
  } else if (capabilities.isMobile) {
    return {
      overallQuality: 'medium',
      animalDetailLevel: 'medium',
      terrainQuality: 'medium',
      effectsQuality: 'medium',
      uiAnimations: true,
      particleCount: 30,
      shadowQuality: 'medium',
      enableBloom: true,
      enableDistortion: false,
      frameRateLimit: 60
    };
  } else {
    return {
      overallQuality: 'high',
      animalDetailLevel: 'high',
      terrainQuality: 'high',
      effectsQuality: 'high',
      uiAnimations: true,
      particleCount: 100,
      shadowQuality: 'high',
      enableBloom: true,
      enableDistortion: true,
      frameRateLimit: 60
    };
  }
}

/**
 * Preload critical visual assets
 */
export function preloadCriticalAssets(): void {
  const criticalTextures = [
    '/textures/terrain/temperate_grass.png',
    '/sprites/animals/rabbit_med.png',
    '/sprites/animals/fox_med.png',
    '/particles/sparkle.png',
    '/particles/heart.png'
  ];

  criticalTextures.forEach(async (texturePath) => {
    try {
      const texture = await loadTexture(texturePath);
      visualEnhancementState.loadedTextures.set(texturePath, texture);
    } catch (error) {
      console.warn(`Failed to preload texture: ${texturePath}`, error);
    }
  });
}

/**
 * Load texture with quality adjustment
 */
export async function loadTexture(path: string, quality?: QualityLevel): Promise<any> {
  const effectiveQuality = quality || visualEnhancementState.currentSettings.overallQuality;
  
  // Adjust path based on quality
  let adjustedPath = path;
  if (effectiveQuality === 'low') {
    adjustedPath = path.replace('.png', '_low.png');
  } else if (effectiveQuality === 'ultra') {
    adjustedPath = path.replace('.png', '_ultra.png');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = adjustedPath;
  });
}

/**
 * Create visual effect
 */
export function createVisualEffect(
  effectType: string,
  position: { x: number; y: number },
  customConfig?: Partial<VisualEffect>
): string {
  const template = VISUAL_EFFECT_TEMPLATES[effectType];
  if (!template) {
    console.warn(`Unknown visual effect: ${effectType}`);
    return '';
  }

  const effectId = `${effectType}_${Date.now()}_${Math.random()}`;
  
  const effect: VisualEffect = {
    id: effectId,
    name: template.name,
    type: template.type,
    intensity: template.intensity,
    duration: template.duration,
    position,
    ...customConfig
  };
  
  if (template.followTarget) effect.followTarget = template.followTarget;
  if (template.particleConfig) effect.particleConfig = template.particleConfig;
  if (template.shaderConfig) effect.shaderConfig = template.shaderConfig;

  visualEnhancementState.activeEffects.set(effectId, effect);
  
  // Auto-remove after duration
  setTimeout(() => {
    visualEnhancementState.activeEffects.delete(effectId);
  }, effect.duration || 1000);

  return effectId;
}

/**
 * Update visual settings
 */
export function updateVisualSettings(newSettings: Partial<VisualSettings>): void {
  visualEnhancementState.currentSettings = {
    ...visualEnhancementState.currentSettings,
    ...newSettings
  };

  // Reload assets if quality changed
  if (newSettings.overallQuality || newSettings.animalDetailLevel || newSettings.terrainQuality) {
    reloadAssetsForQuality();
  }
}

/**
 * Reload assets for new quality level
 */
export function reloadAssetsForQuality(): void {
  // Clear existing textures
  visualEnhancementState.loadedTextures.clear();
  
  // Reload with new quality
  preloadCriticalAssets();
}

/**
 * Get sprite configuration for animal
 */
export function getAnimalSpriteConfig(species: string, variant?: string): AnimalSprite | null {
  const key = variant ? `${species}_${variant}` : species;
  return ENHANCED_ANIMAL_SPRITES[key] || ENHANCED_ANIMAL_SPRITES[species] || null;
}

/**
 * Get terrain texture for biome
 */
export function getTerrainTexture(biome: string, season?: string): TerrainTexture | null {
  const texture = TERRAIN_TEXTURES[biome];
  if (!texture) return null;

  // Return seasonal variant if available
  if (season && texture.seasonalVariants[season]) {
    return {
      ...texture,
      baseTexture: texture.seasonalVariants[season]
    };
  }

  return texture;
}

/**
 * Apply UI polish effects
 */
export function applyUIPolish(element: HTMLElement, effectType: string): void {
  if (!UI_POLISH_CONFIG.microInteractions) return;

  const { transitionDuration, easingFunction } = UI_POLISH_CONFIG;

  switch (effectType) {
    case 'button_hover':
      element.style.transition = `transform ${transitionDuration}ms ${easingFunction}`;
      element.addEventListener('mouseenter', () => {
        element.style.transform = 'scale(1.05)';
      });
      element.addEventListener('mouseleave', () => {
        element.style.transform = 'scale(1.0)';
      });
      break;

    case 'modal_slide_in':
      element.style.transition = `transform ${transitionDuration * 2}ms ${easingFunction}`;
      element.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        element.style.transform = 'translateY(0)';
      }, 10);
      break;

    case 'fade_in':
      element.style.transition = `opacity ${transitionDuration}ms ${easingFunction}`;
      element.style.opacity = '0';
      setTimeout(() => {
        element.style.opacity = '1';
      }, 10);
      break;
  }
}

/**
 * Update performance metrics
 */
export function updatePerformanceMetrics(fps: number, drawCalls: number, memoryUsage: number): void {
  visualEnhancementState.performanceMetrics = {
    fps,
    drawCalls,
    memoryUsage,
    lastUpdate: Date.now()
  };

  // Auto-adjust quality if performance is poor
  if (fps < 30 && visualEnhancementState.currentSettings.overallQuality !== 'low') {
    autoReduceQuality();
  }
}

/**
 * Automatically reduce quality for better performance
 */
export function autoReduceQuality(): void {
  const current = visualEnhancementState.currentSettings;
  
  if (current.overallQuality === 'ultra') {
    updateVisualSettings({ overallQuality: 'high' });
  } else if (current.overallQuality === 'high') {
    updateVisualSettings({ overallQuality: 'medium', particleCount: 30 });
  } else if (current.overallQuality === 'medium') {
    updateVisualSettings({ 
      overallQuality: 'low', 
      particleCount: 10, 
      enableBloom: false,
      uiAnimations: false 
    });
  }
}

export default {
  DEFAULT_VISUAL_SETTINGS,
  TERRAIN_TEXTURES,
  ENHANCED_ANIMAL_SPRITES,
  VISUAL_EFFECT_TEMPLATES,
  UI_POLISH_CONFIG,
  visualEnhancementState,
  initializeVisualEnhancements,
  detectDeviceCapabilities,
  getOptimalSettings,
  loadTexture,
  createVisualEffect,
  updateVisualSettings,
  getAnimalSpriteConfig,
  getTerrainTexture,
  applyUIPolish,
  updatePerformanceMetrics
};