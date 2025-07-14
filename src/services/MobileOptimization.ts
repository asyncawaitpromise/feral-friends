// Mobile Optimization System
// Dynamic quality adjustment, efficient asset loading, memory management, and battery optimization

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory: number;
  connectionType: string;
  batteryLevel?: number;
  isCharging?: boolean;
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  maxTextureSize: number;
  supportedFormats: string[];
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: {
    used: number;
    total: number;
    textures: number;
    geometries: number;
    programs: number;
  };
  batteryUsage: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  networkUsage: number;
  lastUpdate: number;
}

export interface OptimizationSettings {
  targetFPS: number;
  maxMemoryUsage: number;
  enableDynamicQuality: boolean;
  enableLOD: boolean;
  enableFrustumCulling: boolean;
  enableOcclusion: boolean;
  enableBatching: boolean;
  maxParticles: number;
  maxAnimatedObjects: number;
  textureCompression: boolean;
  audioBitrate: number;
  preloadDistance: number;
  cullingDistance: number;
}

export interface QualityPreset {
  name: string;
  description: string;
  targetDevices: string[];
  settings: {
    renderScale: number;
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
    particleCount: number;
    animationQuality: 'low' | 'medium' | 'high';
    textureQuality: 'low' | 'medium' | 'high';
    audioQuality: 'low' | 'medium' | 'high';
    effectsEnabled: boolean;
    antiAliasing: boolean;
    bloom: boolean;
    motionBlur: boolean;
  };
}

export interface AssetLoadingStrategy {
  preloadCritical: string[];
  preloadNearby: string[];
  lazyLoad: string[];
  compressionLevels: Record<string, number>;
  cachingStrategy: 'aggressive' | 'conservative' | 'minimal';
  maxCacheSize: number;
  priorityLevels: Record<string, number>;
}

export interface MemoryPool {
  type: 'textures' | 'geometries' | 'audio' | 'animations';
  maxSize: number;
  currentSize: number;
  items: Map<string, { data: any; lastUsed: number; size: number }>;
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
}

export interface BatteryOptimization {
  enablePowerSaving: boolean;
  reducedFrameRate: number;
  suspendAnimations: boolean;
  reduceParticles: boolean;
  dimScreen: boolean;
  pauseAudio: boolean;
  batteryThresholds: {
    warning: number; // 20%
    critical: number; // 10%
    emergency: number; // 5%
  };
}

// Quality presets for different device classes
export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  ultra: {
    name: 'Ultra',
    description: 'Maximum quality for high-end devices',
    targetDevices: ['desktop', 'high-end-mobile'],
    settings: {
      renderScale: 1.0,
      shadowQuality: 'high',
      particleCount: 200,
      animationQuality: 'high',
      textureQuality: 'high',
      audioQuality: 'high',
      effectsEnabled: true,
      antiAliasing: true,
      bloom: true,
      motionBlur: true
    }
  },

  high: {
    name: 'High',
    description: 'High quality for modern devices',
    targetDevices: ['desktop', 'modern-mobile'],
    settings: {
      renderScale: 1.0,
      shadowQuality: 'high',
      particleCount: 150,
      animationQuality: 'high',
      textureQuality: 'high',
      audioQuality: 'high',
      effectsEnabled: true,
      antiAliasing: true,
      bloom: true,
      motionBlur: false
    }
  },

  medium: {
    name: 'Medium',
    description: 'Balanced quality and performance',
    targetDevices: ['mid-range-mobile', 'older-desktop'],
    settings: {
      renderScale: 0.9,
      shadowQuality: 'medium',
      particleCount: 100,
      animationQuality: 'medium',
      textureQuality: 'medium',
      audioQuality: 'medium',
      effectsEnabled: true,
      antiAliasing: false,
      bloom: true,
      motionBlur: false
    }
  },

  low: {
    name: 'Low',
    description: 'Performance optimized for older devices',
    targetDevices: ['low-end-mobile', 'very-old-desktop'],
    settings: {
      renderScale: 0.75,
      shadowQuality: 'low',
      particleCount: 50,
      animationQuality: 'low',
      textureQuality: 'low',
      audioQuality: 'low',
      effectsEnabled: false,
      antiAliasing: false,
      bloom: false,
      motionBlur: false
    }
  },

  potato: {
    name: 'Potato',
    description: 'Minimum viable quality for very old devices',
    targetDevices: ['ancient-mobile', 'potato-pc'],
    settings: {
      renderScale: 0.5,
      shadowQuality: 'off',
      particleCount: 20,
      animationQuality: 'low',
      textureQuality: 'low',
      audioQuality: 'low',
      effectsEnabled: false,
      antiAliasing: false,
      bloom: false,
      motionBlur: false
    }
  }
};

// Default optimization settings
export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  targetFPS: 60,
  maxMemoryUsage: 512, // MB
  enableDynamicQuality: true,
  enableLOD: true,
  enableFrustumCulling: true,
  enableOcclusion: false, // Expensive on mobile
  enableBatching: true,
  maxParticles: 100,
  maxAnimatedObjects: 50,
  textureCompression: true,
  audioBitrate: 128, // kbps
  preloadDistance: 100,
  cullingDistance: 500
};

// Mobile optimization state
export const optimizationState = {
  deviceCapabilities: null as DeviceCapabilities | null,
  currentPreset: 'medium' as keyof typeof QUALITY_PRESETS,
  performanceMetrics: {
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: { used: 0, total: 0, textures: 0, geometries: 0, programs: 0 },
    batteryUsage: 0,
    thermalState: 'nominal' as const,
    networkUsage: 0,
    lastUpdate: Date.now()
  } as PerformanceMetrics,
  settings: { ...DEFAULT_OPTIMIZATION_SETTINGS },
  memoryPools: new Map<string, MemoryPool>(),
  isOptimizing: false,
  lastOptimization: 0,
  frameHistory: [] as number[],
  batteryOptimization: {
    enablePowerSaving: false,
    reducedFrameRate: 30,
    suspendAnimations: false,
    reduceParticles: false,
    dimScreen: false,
    pauseAudio: false,
    batteryThresholds: { warning: 20, critical: 10, emergency: 5 }
  } as BatteryOptimization
};

/**
 * Initialize mobile optimization system
 */
export async function initializeMobileOptimization(): Promise<void> {
  // Detect device capabilities
  optimizationState.deviceCapabilities = await detectDeviceCapabilities();
  
  // Set initial quality preset based on device
  optimizationState.currentPreset = selectOptimalPreset(optimizationState.deviceCapabilities);
  
  // Initialize memory pools
  initializeMemoryPools();
  
  // Setup performance monitoring
  startPerformanceMonitoring();
  
  // Setup battery monitoring
  setupBatteryMonitoring();
  
  // Apply initial optimizations
  applyQualityPreset(optimizationState.currentPreset);
}

/**
 * Detect device capabilities
 */
async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  // Basic device info
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isLowEnd = isMobile && (navigator.hardwareConcurrency || 4) < 4;
  
  // Screen info
  const screenSize = {
    width: window.screen.width,
    height: window.screen.height
  };
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Hardware info
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  // Network info
  const connection = (navigator as any).connection || {};
  const connectionType = connection.effectiveType || 'unknown';
  
  // Battery info
  let batteryLevel: number | undefined;
  let isCharging: boolean | undefined;
  
  try {
    const battery = await (navigator as any).getBattery?.();
    if (battery) {
      batteryLevel = battery.level * 100;
      isCharging = battery.charging;
    }
  } catch (e) {
    // Battery API not supported
  }
  
  // WebGL capabilities
  const supportsWebGL = !!canvas.getContext('webgl');
  const supportsWebGL2 = !!canvas.getContext('webgl2');
  const maxTextureSize = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048;
  
  // Supported formats
  const supportedFormats: string[] = [];
  if (supportsWebGL) supportedFormats.push('webgl');
  if (supportsWebGL2) supportedFormats.push('webgl2');
  
  // Audio formats
  const audio = document.createElement('audio');
  if (audio.canPlayType('audio/ogg')) supportedFormats.push('ogg');
  if (audio.canPlayType('audio/mp3')) supportedFormats.push('mp3');
  if (audio.canPlayType('audio/wav')) supportedFormats.push('wav');
  
  const capabilities: DeviceCapabilities = {
    isMobile,
    isLowEnd,
    screenSize,
    pixelRatio,
    hardwareConcurrency,
    deviceMemory,
    connectionType,
    supportsWebGL,
    supportsWebGL2,
    maxTextureSize,
    supportedFormats
  };
  
  if (batteryLevel !== undefined) capabilities.batteryLevel = batteryLevel;
  if (isCharging !== undefined) capabilities.isCharging = isCharging;
  
  return capabilities;
}

/**
 * Select optimal quality preset for device
 */
function selectOptimalPreset(capabilities: DeviceCapabilities): keyof typeof QUALITY_PRESETS {
  if (!capabilities.isMobile) {
    // Desktop devices
    if (capabilities.deviceMemory >= 8 && capabilities.hardwareConcurrency >= 8) {
      return 'ultra';
    } else if (capabilities.deviceMemory >= 4 && capabilities.hardwareConcurrency >= 4) {
      return 'high';
    } else {
      return 'medium';
    }
  } else {
    // Mobile devices
    if (capabilities.isLowEnd) {
      return capabilities.deviceMemory < 2 ? 'potato' : 'low';
    } else if (capabilities.deviceMemory >= 6 && capabilities.hardwareConcurrency >= 6) {
      return 'high';
    } else {
      return 'medium';
    }
  }
}

/**
 * Initialize memory pools
 */
function initializeMemoryPools(): void {
  const poolTypes: Array<MemoryPool['type']> = ['textures', 'geometries', 'audio', 'animations'];
  
  poolTypes.forEach(type => {
    const maxSize = getMemoryPoolSize(type);
    const pool: MemoryPool = {
      type,
      maxSize,
      currentSize: 0,
      items: new Map(),
      evictionPolicy: 'lru'
    };
    
    optimizationState.memoryPools.set(type, pool);
  });
}

/**
 * Get appropriate memory pool size for type
 */
function getMemoryPoolSize(type: MemoryPool['type']): number {
  const device = optimizationState.deviceCapabilities;
  if (!device) return 64; // Default fallback
  
  const baseMemory = device.deviceMemory * 1024 * 1024; // Convert to bytes
  const mobileMultiplier = device.isMobile ? 0.3 : 0.6; // Mobile uses less memory
  
  switch (type) {
    case 'textures':
      return Math.floor(baseMemory * mobileMultiplier * 0.4); // 40% for textures
    case 'geometries':
      return Math.floor(baseMemory * mobileMultiplier * 0.2); // 20% for geometry
    case 'audio':
      return Math.floor(baseMemory * mobileMultiplier * 0.2); // 20% for audio
    case 'animations':
      return Math.floor(baseMemory * mobileMultiplier * 0.2); // 20% for animations
    default:
      return Math.floor(baseMemory * mobileMultiplier * 0.1);
  }
}

/**
 * Apply quality preset
 */
export function applyQualityPreset(presetName: keyof typeof QUALITY_PRESETS): void {
  const preset = QUALITY_PRESETS[presetName];
  if (!preset) return;
  
  optimizationState.currentPreset = presetName;
  
  // Apply render settings
  updateRenderSettings(preset.settings);
  
  // Update optimization settings
  updateOptimizationSettings(preset.settings);
  
  // Clear caches to force reload with new quality
  clearMemoryPools();
}

/**
 * Update render settings
 */
function updateRenderSettings(settings: QualityPreset['settings']): void {
  // This would interface with the actual rendering system
  // For now, we'll store the settings for other systems to use
  
  // Update canvas resolution
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const scale = settings.renderScale;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
  }
  
  // Update particle system
  optimizationState.settings.maxParticles = settings.particleCount;
  
  // Store settings for other systems
  (window as any).gameQualitySettings = settings;
}

/**
 * Update optimization settings based on quality preset
 */
function updateOptimizationSettings(settings: QualityPreset['settings']): void {
  optimizationState.settings.maxParticles = settings.particleCount;
  optimizationState.settings.textureCompression = settings.textureQuality !== 'high';
  optimizationState.settings.audioBitrate = settings.audioQuality === 'high' ? 192 : 
                                           settings.audioQuality === 'medium' ? 128 : 96;
  
  // Adjust culling distances based on quality
  const qualityMultiplier = settings.textureQuality === 'high' ? 1.2 : 
                           settings.textureQuality === 'medium' ? 1.0 : 0.8;
  
  optimizationState.settings.preloadDistance *= qualityMultiplier;
  optimizationState.settings.cullingDistance *= qualityMultiplier;
}

/**
 * Start performance monitoring
 */
function startPerformanceMonitoring(): void {
  let lastFrameTime = performance.now();
  
  function monitorFrame() {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTime;
    const fps = 1000 / frameTime;
    
    // Update frame history
    optimizationState.frameHistory.push(fps);
    if (optimizationState.frameHistory.length > 60) {
      optimizationState.frameHistory.shift();
    }
    
    // Update metrics
    optimizationState.performanceMetrics.fps = fps;
    optimizationState.performanceMetrics.frameTime = frameTime;
    optimizationState.performanceMetrics.lastUpdate = currentTime;
    
    // Check if optimization is needed
    const avgFPS = optimizationState.frameHistory.reduce((a, b) => a + b, 0) / optimizationState.frameHistory.length;
    if (avgFPS < optimizationState.settings.targetFPS * 0.8 && 
        optimizationState.settings.enableDynamicQuality) {
      scheduleOptimization();
    }
    
    lastFrameTime = currentTime;
    requestAnimationFrame(monitorFrame);
  }
  
  requestAnimationFrame(monitorFrame);
}

/**
 * Setup battery monitoring
 */
async function setupBatteryMonitoring(): Promise<void> {
  try {
    const battery = await (navigator as any).getBattery?.();
    if (!battery) return;
    
    const updateBatteryStatus = () => {
      const level = battery.level * 100;
      const isCharging = battery.charging;
      
      if (optimizationState.deviceCapabilities) {
        optimizationState.deviceCapabilities.batteryLevel = level;
        optimizationState.deviceCapabilities.isCharging = isCharging;
      }
      
      // Apply battery optimizations
      const thresholds = optimizationState.batteryOptimization.batteryThresholds;
      
      if (!isCharging) {
        if (level <= thresholds.emergency) {
          applyEmergencyBatteryOptimizations();
        } else if (level <= thresholds.critical) {
          applyCriticalBatteryOptimizations();
        } else if (level <= thresholds.warning) {
          applyWarningBatteryOptimizations();
        }
      } else {
        // Charging - can relax optimizations
        relaxBatteryOptimizations();
      }
    };
    
    battery.addEventListener('chargingchange', updateBatteryStatus);
    battery.addEventListener('levelchange', updateBatteryStatus);
    
    updateBatteryStatus();
  } catch (e) {
    // Battery API not supported
  }
}

/**
 * Schedule optimization run
 */
function scheduleOptimization(): void {
  const now = Date.now();
  if (optimizationState.isOptimizing || now - optimizationState.lastOptimization < 5000) {
    return; // Don't optimize too frequently
  }
  
  optimizationState.isOptimizing = true;
  optimizationState.lastOptimization = now;
  
  setTimeout(() => {
    performDynamicOptimization();
    optimizationState.isOptimizing = false;
  }, 100);
}

/**
 * Perform dynamic optimization
 */
function performDynamicOptimization(): void {
  const avgFPS = optimizationState.frameHistory.reduce((a, b) => a + b, 0) / optimizationState.frameHistory.length;
  const targetFPS = optimizationState.settings.targetFPS;
  
  if (avgFPS < targetFPS * 0.6) {
    // Severe performance issues - aggressive optimization
    reduceQualityLevel(2);
  } else if (avgFPS < targetFPS * 0.8) {
    // Moderate performance issues - minor optimization
    reduceQualityLevel(1);
  } else if (avgFPS > targetFPS * 1.1) {
    // Good performance - can increase quality
    increaseQualityLevel(1);
  }
}

/**
 * Reduce quality level
 */
function reduceQualityLevel(steps: number): void {
  const presets = Object.keys(QUALITY_PRESETS);
  const currentIndex = presets.indexOf(optimizationState.currentPreset);
  const newIndex = Math.min(presets.length - 1, currentIndex + steps);
  
  if (newIndex !== currentIndex) {
    applyQualityPreset(presets[newIndex] as keyof typeof QUALITY_PRESETS);
  } else {
    // Already at lowest preset, apply micro-optimizations
    applyMicroOptimizations();
  }
}

/**
 * Increase quality level
 */
function increaseQualityLevel(steps: number): void {
  const presets = Object.keys(QUALITY_PRESETS);
  const currentIndex = presets.indexOf(optimizationState.currentPreset);
  const newIndex = Math.max(0, currentIndex - steps);
  
  if (newIndex !== currentIndex) {
    applyQualityPreset(presets[newIndex] as keyof typeof QUALITY_PRESETS);
  }
}

/**
 * Apply micro-optimizations
 */
function applyMicroOptimizations(): void {
  // Reduce particle count
  optimizationState.settings.maxParticles = Math.max(10, 
    Math.floor(optimizationState.settings.maxParticles * 0.8));
  
  // Reduce animation objects
  optimizationState.settings.maxAnimatedObjects = Math.max(5,
    Math.floor(optimizationState.settings.maxAnimatedObjects * 0.9));
  
  // Increase culling distance
  optimizationState.settings.cullingDistance *= 0.9;
  
  // Clear some memory
  performMemoryCleanup();
}

/**
 * Memory management
 */
export function addToMemoryPool(
  type: MemoryPool['type'], 
  key: string, 
  data: any, 
  size: number
): boolean {
  const pool = optimizationState.memoryPools.get(type);
  if (!pool) return false;
  
  // Check if we need to make space
  if (pool.currentSize + size > pool.maxSize) {
    evictFromMemoryPool(pool, size);
  }
  
  // Add to pool
  pool.items.set(key, {
    data,
    lastUsed: Date.now(),
    size
  });
  
  pool.currentSize += size;
  return true;
}

/**
 * Get from memory pool
 */
export function getFromMemoryPool(type: MemoryPool['type'], key: string): any {
  const pool = optimizationState.memoryPools.get(type);
  if (!pool) return null;
  
  const item = pool.items.get(key);
  if (!item) return null;
  
  // Update last used time
  item.lastUsed = Date.now();
  return item.data;
}

/**
 * Evict items from memory pool
 */
function evictFromMemoryPool(pool: MemoryPool, spaceNeeded: number): void {
  const items = Array.from(pool.items.entries());
  
  // Sort by eviction policy
  if (pool.evictionPolicy === 'lru') {
    items.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  }
  
  let freedSpace = 0;
  for (const [key, item] of items) {
    pool.items.delete(key);
    pool.currentSize -= item.size;
    freedSpace += item.size;
    
    if (freedSpace >= spaceNeeded) break;
  }
}

/**
 * Clear all memory pools
 */
function clearMemoryPools(): void {
  optimizationState.memoryPools.forEach(pool => {
    pool.items.clear();
    pool.currentSize = 0;
  });
}

/**
 * Perform memory cleanup
 */
function performMemoryCleanup(): void {
  optimizationState.memoryPools.forEach(pool => {
    const targetSize = pool.maxSize * 0.7; // Clean to 70% capacity
    if (pool.currentSize > targetSize) {
      evictFromMemoryPool(pool, pool.currentSize - targetSize);
    }
  });
  
  // Force garbage collection if available
  if ((window as any).gc) {
    (window as any).gc();
  }
}

/**
 * Battery optimization functions
 */
function applyEmergencyBatteryOptimizations(): void {
  optimizationState.batteryOptimization.enablePowerSaving = true;
  optimizationState.batteryOptimization.suspendAnimations = true;
  optimizationState.batteryOptimization.reduceParticles = true;
  optimizationState.batteryOptimization.pauseAudio = true;
  
  // Switch to potato quality
  applyQualityPreset('potato');
  
  // Reduce frame rate dramatically
  optimizationState.settings.targetFPS = 15;
}

function applyCriticalBatteryOptimizations(): void {
  optimizationState.batteryOptimization.enablePowerSaving = true;
  optimizationState.batteryOptimization.reduceParticles = true;
  
  // Switch to low quality
  if (optimizationState.currentPreset !== 'potato') {
    applyQualityPreset('low');
  }
  
  // Reduce frame rate
  optimizationState.settings.targetFPS = 30;
}

function applyWarningBatteryOptimizations(): void {
  optimizationState.batteryOptimization.enablePowerSaving = true;
  
  // Ensure we're not on high quality
  if (['ultra', 'high'].includes(optimizationState.currentPreset)) {
    applyQualityPreset('medium');
  }
}

function relaxBatteryOptimizations(): void {
  optimizationState.batteryOptimization.enablePowerSaving = false;
  optimizationState.batteryOptimization.suspendAnimations = false;
  optimizationState.batteryOptimization.reduceParticles = false;
  optimizationState.batteryOptimization.pauseAudio = false;
  
  // Restore normal frame rate
  optimizationState.settings.targetFPS = 60;
}

/**
 * Get optimization recommendations
 */
export function getOptimizationRecommendations(): string[] {
  const recommendations: string[] = [];
  const metrics = optimizationState.performanceMetrics;
  const device = optimizationState.deviceCapabilities;
  
  if (metrics.fps < 30) {
    recommendations.push('Consider reducing graphics quality for better performance');
  }
  
  if (metrics.memoryUsage.used > optimizationState.settings.maxMemoryUsage * 0.8) {
    recommendations.push('High memory usage detected - consider clearing cache');
  }
  
  if (device?.batteryLevel && device.batteryLevel < 20 && !device.isCharging) {
    recommendations.push('Low battery - enabling power saving mode');
  }
  
  if (device?.connectionType === 'slow-2g') {
    recommendations.push('Slow connection detected - reducing asset quality');
  }
  
  return recommendations;
}

/**
 * Get current optimization status
 */
export function getOptimizationStatus(): {
  preset: string;
  fps: number;
  memoryUsage: number;
  batteryLevel?: number;
  isOptimizing: boolean;
  recommendations: string[];
} {
  const status: {
    preset: string;
    fps: number;
    memoryUsage: number;
    batteryLevel?: number;
    isOptimizing: boolean;
    recommendations: string[];
  } = {
    preset: optimizationState.currentPreset,
    fps: optimizationState.performanceMetrics.fps,
    memoryUsage: optimizationState.performanceMetrics.memoryUsage.used,
    isOptimizing: optimizationState.isOptimizing,
    recommendations: getOptimizationRecommendations()
  };
  
  if (optimizationState.deviceCapabilities?.batteryLevel !== undefined) {
    status.batteryLevel = optimizationState.deviceCapabilities.batteryLevel;
  }
  
  return status;
}

export default {
  QUALITY_PRESETS,
  DEFAULT_OPTIMIZATION_SETTINGS,
  optimizationState,
  initializeMobileOptimization,
  applyQualityPreset,
  addToMemoryPool,
  getFromMemoryPool,
  performMemoryCleanup,
  getOptimizationRecommendations,
  getOptimizationStatus
};