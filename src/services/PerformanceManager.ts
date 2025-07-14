// Performance Manager Service
// Mobile performance optimization with data lazy loading, image compression, 
// audio optimization, and memory management for long play sessions

export interface PerformanceConfig {
  memoryThreshold: number; // MB
  imageQuality: 'low' | 'medium' | 'high' | 'auto';
  audioQuality: 'low' | 'medium' | 'high' | 'auto';
  enableLazyLoading: boolean;
  enableImageCompression: boolean;
  enableAudioCompression: boolean;
  maxCacheSize: number; // MB
  gcInterval: number; // milliseconds
  monitoringEnabled: boolean;
  adaptiveQuality: boolean;
}

export interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  frameRate: {
    current: number;
    average: number;
    drops: number;
  };
  loadTimes: {
    averageAssetLoad: number;
    averageSceneLoad: number;
    totalAssets: number;
  };
  networkUsage: {
    bytesDownloaded: number;
    bytesUploaded: number;
    requestCount: number;
  };
  cacheEfficiency: {
    hitRate: number;
    missRate: number;
    size: number;
  };
  batteryImpact: 'low' | 'medium' | 'high';
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
}

export interface OptimizationSuggestion {
  type: 'memory' | 'graphics' | 'audio' | 'network' | 'battery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action?: () => void;
  autoApply?: boolean;
}

export interface AssetLoadOptions {
  priority: 'low' | 'medium' | 'high' | 'critical';
  lazy: boolean;
  compress: boolean;
  cache: boolean;
  timeout: number;
}

export class PerformanceManager {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private frameRateHistory: number[] = [];
  private memoryHistory: number[] = [];
  private lastGCTime: number = 0;
  private monitoringTimer: number | null = null;
  private assetCache: Map<string, any> = new Map();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private imageWorker: Worker | null = null;
  private audioContext: AudioContext | null = null;

  private callbacks: {
    onPerformanceIssue?: (suggestion: OptimizationSuggestion) => void;
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
    onOptimizationApplied?: (type: string, improvement: number) => void;
  } = {};

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      memoryThreshold: 50, // 50MB
      imageQuality: 'auto',
      audioQuality: 'auto',
      enableLazyLoading: true,
      enableImageCompression: true,
      enableAudioCompression: true,
      maxCacheSize: 25, // 25MB
      gcInterval: 60000, // 1 minute
      monitoringEnabled: true,
      adaptiveQuality: true,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.initializePerformanceManager();
  }

  /**
   * Initialize performance monitoring and optimization
   */
  private async initializePerformanceManager(): Promise<void> {
    try {
      // Detect device capabilities
      await this.detectDeviceCapabilities();

      // Initialize workers
      if (this.config.enableImageCompression) {
        await this.initializeImageWorker();
      }

      // Initialize audio context for audio optimization
      if (this.config.enableAudioCompression) {
        this.initializeAudioContext();
      }

      // Start performance monitoring
      if (this.config.monitoringEnabled) {
        this.startPerformanceMonitoring();
      }

      // Set up garbage collection
      this.setupGarbageCollection();

      console.log('PerformanceManager initialized successfully');

    } catch (error) {
      console.error('Failed to initialize PerformanceManager:', error);
    }
  }

  /**
   * Load asset with optimization
   */
  async loadAsset(
    url: string, 
    type: 'image' | 'audio' | 'data',
    options: Partial<AssetLoadOptions> = {}
  ): Promise<any> {
    const opts: AssetLoadOptions = {
      priority: 'medium',
      lazy: this.config.enableLazyLoading,
      compress: type === 'image' ? this.config.enableImageCompression : this.config.enableAudioCompression,
      cache: true,
      timeout: 10000,
      ...options
    };

    try {
      // Check cache first
      if (opts.cache && this.assetCache.has(url)) {
        this.updateCacheMetrics(true);
        return this.assetCache.get(url);
      }

      // Check if already loading
      if (this.loadingQueue.has(url)) {
        return await this.loadingQueue.get(url);
      }

      // Create loading promise
      const loadPromise = this.performAssetLoad(url, type, opts);
      this.loadingQueue.set(url, loadPromise);

      const result = await loadPromise;
      this.loadingQueue.delete(url);

      // Cache if enabled
      if (opts.cache) {
        await this.cacheAsset(url, result);
      }

      this.updateCacheMetrics(false);
      return result;

    } catch (error) {
      this.loadingQueue.delete(url);
      console.error(`Failed to load asset: ${url}`, error);
      throw error;
    }
  }

  /**
   * Optimize image with compression and resizing
   */
  async optimizeImage(
    imageData: ImageData | HTMLImageElement | string,
    targetWidth?: number,
    targetHeight?: number,
    quality?: number
  ): Promise<Blob> {
    try {
      if (this.imageWorker) {
        return await this.optimizeImageWithWorker(imageData, targetWidth, targetHeight, quality);
      } else {
        return await this.optimizeImageSync(imageData, targetWidth, targetHeight, quality);
      }
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  }

  /**
   * Optimize audio with compression
   */
  async optimizeAudio(audioBuffer: ArrayBuffer, targetBitrate?: number): Promise<ArrayBuffer> {
    try {
      if (!this.audioContext) {
        return audioBuffer;
      }

      // Decode audio
      const audioBufferData = await this.audioContext.decodeAudioData(audioBuffer.slice(0));

      // Apply compression (simplified - in real implementation would use actual audio compression)
      const compressedBuffer = this.compressAudioBuffer(audioBufferData, targetBitrate);

      return compressedBuffer;

    } catch (error) {
      console.error('Audio optimization failed:', error);
      return audioBuffer;
    }
  }

  /**
   * Lazy load content when needed
   */
  async lazyLoad(
    elements: Array<{ id: string; url: string; type: 'image' | 'audio' | 'data' }>,
    threshold: number = 0.1
  ): Promise<void> {
    if (!this.config.enableLazyLoading) {
      // Load all immediately if lazy loading disabled
      await Promise.all(elements.map(el => this.loadAsset(el.url, el.type)));
      return;
    }

    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const element = elements.find(el => el.id === entry.target.id);
            if (element) {
              try {
                await this.loadAsset(element.url, element.type, { priority: 'high' });
                observer.unobserve(entry.target);
              } catch (error) {
                console.error(`Lazy load failed for ${element.id}:`, error);
              }
            }
          }
        });
      },
      { threshold }
    );

    // Observe elements (would need actual DOM elements in real implementation)
    elements.forEach(element => {
      const domElement = document.getElementById(element.id);
      if (domElement) {
        observer.observe(domElement);
      }
    });
  }

  /**
   * Perform memory cleanup
   */
  async performMemoryCleanup(): Promise<{ freed: number; suggestions: OptimizationSuggestion[] }> {
    try {
      const beforeMemory = this.getCurrentMemoryUsage();
      const suggestions: OptimizationSuggestion[] = [];

      // Clear old cache entries
      const freedFromCache = await this.cleanupCache();

      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      // Clear unnecessary data
      this.clearHistoryBuffers();

      const afterMemory = this.getCurrentMemoryUsage();
      const freed = Math.max(0, beforeMemory - afterMemory);

      // Generate suggestions based on memory usage
      if (afterMemory > this.config.memoryThreshold * 0.8) {
        suggestions.push({
          type: 'memory',
          severity: 'high',
          message: 'High memory usage detected. Consider reducing image quality or clearing cache.',
          action: () => this.reduceQualitySettings(),
          autoApply: false
        });
      }

      return { freed: freed + freedFromCache, suggestions };

    } catch (error) {
      console.error('Memory cleanup failed:', error);
      return { freed: 0, suggestions: [] };
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Memory suggestions
    if (this.metrics.memoryUsage.percentage > 80) {
      suggestions.push({
        type: 'memory',
        severity: 'high',
        message: 'Memory usage is high. Clear cache or reduce quality settings.',
        action: () => this.performMemoryCleanup(),
        autoApply: false
      });
    }

    // Frame rate suggestions
    if (this.metrics.frameRate.average < 30) {
      suggestions.push({
        type: 'graphics',
        severity: 'medium',
        message: 'Low frame rate detected. Consider reducing graphics quality.',
        action: () => this.reduceGraphicsQuality(),
        autoApply: this.config.adaptiveQuality
      });
    }

    // Cache efficiency suggestions
    if (this.metrics.cacheEfficiency.hitRate < 0.5) {
      suggestions.push({
        type: 'network',
        severity: 'low',
        message: 'Low cache hit rate. Consider preloading frequently used assets.',
        action: () => this.optimizeCaching(),
        autoApply: true
      });
    }

    return suggestions;
  }

  /**
   * Apply optimization automatically
   */
  async applyOptimization(suggestion: OptimizationSuggestion): Promise<boolean> {
    try {
      if (suggestion.action) {
        const beforeMetrics = { ...this.metrics };
        await suggestion.action();
        
        // Wait a bit for metrics to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const improvement = this.calculateImprovement(beforeMetrics, this.metrics, suggestion.type);
        this.callbacks.onOptimizationApplied?.(suggestion.type, improvement);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      return false;
    }
  }

  /**
   * Configure performance settings
   */
  configure(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart monitoring if settings changed
    if (newConfig.monitoringEnabled !== undefined) {
      if (newConfig.monitoringEnabled) {
        this.startPerformanceMonitoring();
      } else {
        this.stopPerformanceMonitoring();
      }
    }
  }

  /**
   * Set performance callbacks
   */
  setCallbacks(callbacks: {
    onPerformanceIssue?: (suggestion: OptimizationSuggestion) => void;
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
    onOptimizationApplied?: (type: string, improvement: number) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Private helper methods

  private initializeMetrics(): PerformanceMetrics {
    return {
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      frameRate: { current: 60, average: 60, drops: 0 },
      loadTimes: { averageAssetLoad: 0, averageSceneLoad: 0, totalAssets: 0 },
      networkUsage: { bytesDownloaded: 0, bytesUploaded: 0, requestCount: 0 },
      cacheEfficiency: { hitRate: 0, missRate: 0, size: 0 },
      batteryImpact: 'low',
      thermalState: 'nominal'
    };
  }

  private async detectDeviceCapabilities(): Promise<void> {
    try {
      // Detect memory
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        this.metrics.memoryUsage.total = memInfo.jsHeapSizeLimit / (1024 * 1024);
      }

      // Detect connection quality
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.config.imageQuality = 'low';
          this.config.audioQuality = 'low';
        }
      }

      // Adjust settings based on device
      if (this.config.adaptiveQuality) {
        await this.adaptQualitySettings();
      }

    } catch (error) {
      console.error('Device capability detection failed:', error);
    }
  }

  private async initializeImageWorker(): Promise<void> {
    try {
      const workerScript = `
        self.onmessage = function(e) {
          const { id, imageData, width, height, quality } = e.data;
          
          try {
            // Simple image optimization (in real implementation would use actual image processing)
            const canvas = new OffscreenCanvas(width || imageData.width, height || imageData.height);
            const ctx = canvas.getContext('2d');
            
            // Draw and compress (simplified)
            const optimizedBlob = canvas.convertToBlob({ 
              type: 'image/jpeg', 
              quality: quality || 0.8 
            });
            
            self.postMessage({ id, success: true, data: optimizedBlob });
          } catch (error) {
            self.postMessage({ id, success: false, error: error.message });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.imageWorker = new Worker(URL.createObjectURL(blob));

    } catch (error) {
      console.warn('Failed to initialize image worker:', error);
      this.imageWorker = null;
    }
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      this.audioContext = null;
    }
  }

  private startPerformanceMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = window.setInterval(() => {
      this.updateMetrics();
    }, 1000); // Update every second
  }

  private stopPerformanceMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  private updateMetrics(): void {
    // Update memory metrics
    this.updateMemoryMetrics();

    // Update frame rate metrics
    this.updateFrameRateMetrics();

    // Update thermal state (if available)
    this.updateThermalState();

    // Update cache metrics
    this.updateCacheSize();

    this.callbacks.onMetricsUpdate?.(this.metrics);

    // Check for performance issues
    const suggestions = this.getOptimizationSuggestions();
    suggestions.forEach(suggestion => {
      if (suggestion.autoApply) {
        this.applyOptimization(suggestion);
      } else {
        this.callbacks.onPerformanceIssue?.(suggestion);
      }
    });
  }

  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsage.used = memInfo.usedJSHeapSize / (1024 * 1024);
      this.metrics.memoryUsage.total = memInfo.jsHeapSizeLimit / (1024 * 1024);
      this.metrics.memoryUsage.percentage = (this.metrics.memoryUsage.used / this.metrics.memoryUsage.total) * 100;
    }
  }

  private updateFrameRateMetrics(): void {
    // Simple frame rate calculation (would be more sophisticated in real implementation)
    const now = performance.now();
    if (this.frameRateHistory.length > 0) {
      const lastFrame = this.frameRateHistory[this.frameRateHistory.length - 1];
      if (lastFrame !== undefined) {
        const fps = 1000 / (now - lastFrame);
        this.metrics.frameRate.current = Math.round(fps);
      }
    }

    this.frameRateHistory.push(now);
    if (this.frameRateHistory.length > 60) {
      this.frameRateHistory.shift();
    }

    if (this.frameRateHistory.length > 1) {
      const lastFrame = this.frameRateHistory[this.frameRateHistory.length - 1];
      const firstFrame = this.frameRateHistory[0];
      if (lastFrame !== undefined && firstFrame !== undefined) {
        const totalTime = lastFrame - firstFrame;
        this.metrics.frameRate.average = Math.round((this.frameRateHistory.length - 1) * 1000 / totalTime);
      }
    }
  }

  private updateThermalState(): void {
    // Mock thermal state (would use actual thermal API if available)
    if (this.metrics.frameRate.average < 20) {
      this.metrics.thermalState = 'serious';
    } else if (this.metrics.frameRate.average < 30) {
      this.metrics.thermalState = 'fair';
    } else {
      this.metrics.thermalState = 'nominal';
    }
  }

  private updateCacheSize(): void {
    let totalSize = 0;
    this.assetCache.forEach(asset => {
      totalSize += this.estimateAssetSize(asset);
    });
    this.metrics.cacheEfficiency.size = totalSize / (1024 * 1024); // MB
  }

  private async performAssetLoad(url: string, type: 'image' | 'audio' | 'data', options: AssetLoadOptions): Promise<any> {
    const startTime = performance.now();

    try {
      let asset: any;

      switch (type) {
        case 'image':
          asset = await this.loadImage(url, options);
          break;
        case 'audio':
          asset = await this.loadAudio(url, options);
          break;
        case 'data':
          asset = await this.loadData(url, options);
          break;
        default:
          throw new Error(`Unsupported asset type: ${type}`);
      }

      const loadTime = performance.now() - startTime;
      this.updateLoadTimeMetrics(loadTime);

      return asset;

    } catch (error) {
      const loadTime = performance.now() - startTime;
      this.updateLoadTimeMetrics(loadTime);
      throw error;
    }
  }

  private async loadImage(url: string, options: AssetLoadOptions): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, options.timeout);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load failed'));
      };

      img.src = url;
    });
  }

  private async loadAudio(url: string, _options: AssetLoadOptions): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Audio fetch failed: ${response.status}`);
    }
    return await response.arrayBuffer();
  }

  private async loadData(url: string, _options: AssetLoadOptions): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Data fetch failed: ${response.status}`);
    }
    return await response.json();
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  private async cacheAsset(url: string, asset: any): Promise<void> {
    const assetSize = this.estimateAssetSize(asset);
    const currentCacheSize = this.metrics.cacheEfficiency.size;

    if (currentCacheSize + assetSize / (1024 * 1024) > this.config.maxCacheSize) {
      await this.evictCacheEntries(assetSize);
    }

    this.assetCache.set(url, asset);
  }

  private estimateAssetSize(asset: any): number {
    if (asset instanceof ArrayBuffer) {
      return asset.byteLength;
    } else if (asset instanceof HTMLImageElement) {
      return asset.naturalWidth * asset.naturalHeight * 4; // Rough estimate
    } else {
      return JSON.stringify(asset).length;
    }
  }

  private async evictCacheEntries(neededSpace: number): Promise<void> {
    // Simple LRU eviction (would be more sophisticated in real implementation)
    const entries = Array.from(this.assetCache.entries());
    let freedSpace = 0;

    for (const [url, asset] of entries) {
      const size = this.estimateAssetSize(asset);
      this.assetCache.delete(url);
      freedSpace += size;

      if (freedSpace >= neededSpace) {
        break;
      }
    }
  }

  private updateCacheMetrics(hit: boolean): void {
    if (hit) {
      this.metrics.cacheEfficiency.hitRate = 
        (this.metrics.cacheEfficiency.hitRate * 0.9) + (1 * 0.1);
    } else {
      this.metrics.cacheEfficiency.missRate = 
        (this.metrics.cacheEfficiency.missRate * 0.9) + (1 * 0.1);
    }
  }

  private updateLoadTimeMetrics(loadTime: number): void {
    this.metrics.loadTimes.totalAssets++;
    this.metrics.loadTimes.averageAssetLoad = 
      (this.metrics.loadTimes.averageAssetLoad * 0.9) + (loadTime * 0.1);
  }

  private async optimizeImageWithWorker(imageData: any, width?: number, height?: number, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);
      const timeout = setTimeout(() => {
        reject(new Error('Image optimization timeout'));
      }, 10000);

      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          clearTimeout(timeout);
          this.imageWorker?.removeEventListener('message', handler);
          
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };

      this.imageWorker?.addEventListener('message', handler);
      this.imageWorker?.postMessage({ id, imageData, width, height, quality });
    });
  }

  private async optimizeImageSync(imageData: any, width?: number, height?: number, quality?: number): Promise<Blob> {
    // Fallback synchronous image optimization
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = width || imageData.width || 300;
    canvas.height = height || imageData.height || 300;
    
    if (imageData instanceof HTMLImageElement) {
      ctx.drawImage(imageData, 0, 0, canvas.width, canvas.height);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', quality || 0.8);
    });
  }

  private compressAudioBuffer(audioBuffer: AudioBuffer, targetBitrate?: number): ArrayBuffer {
    // Simplified audio compression (would use actual audio compression in real implementation)
    const channels = audioBuffer.numberOfChannels;
    // const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Create a simple compressed version by reducing sample rate
    const compressionRatio = targetBitrate ? Math.min(1, targetBitrate / 128) : 0.7;
    const newLength = Math.floor(length * compressionRatio);
    
    const compressedBuffer = new ArrayBuffer(newLength * channels * 2); // 16-bit
    return compressedBuffer;
  }

  private async cleanupCache(): Promise<number> {
    const sizeBefore = this.metrics.cacheEfficiency.size;
    
    // Remove old entries
    // const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let removed = 0;

    // Simple cleanup - in real implementation would track access times
    if (this.assetCache.size > 50) {
      const entries = Array.from(this.assetCache.entries());
      const toRemove = entries.slice(0, Math.floor(entries.length / 2));
      
      toRemove.forEach(([url]) => {
        this.assetCache.delete(url);
        removed++;
      });
    }

    const sizeAfter = this.metrics.cacheEfficiency.size;
    return Math.max(0, sizeBefore - sizeAfter);
  }

  private clearHistoryBuffers(): void {
    this.frameRateHistory = this.frameRateHistory.slice(-30); // Keep last 30 frames
    this.memoryHistory = this.memoryHistory.slice(-60); // Keep last 60 seconds
  }

  private async adaptQualitySettings(): Promise<void> {
    const memoryUsage = this.metrics.memoryUsage.percentage;
    const frameRate = this.metrics.frameRate.average;

    if (memoryUsage > 80 || frameRate < 30) {
      this.config.imageQuality = 'low';
      this.config.audioQuality = 'low';
    } else if (memoryUsage > 60 || frameRate < 45) {
      this.config.imageQuality = 'medium';
      this.config.audioQuality = 'medium';
    } else {
      this.config.imageQuality = 'high';
      this.config.audioQuality = 'high';
    }
  }

  private async reduceQualitySettings(): Promise<void> {
    const qualities = ['high', 'medium', 'low'];
    const currentImageIndex = qualities.indexOf(this.config.imageQuality);
    const currentAudioIndex = qualities.indexOf(this.config.audioQuality);

    if (currentImageIndex < qualities.length - 1) {
      this.config.imageQuality = qualities[currentImageIndex + 1] as any;
    }

    if (currentAudioIndex < qualities.length - 1) {
      this.config.audioQuality = qualities[currentAudioIndex + 1] as any;
    }
  }

  private async reduceGraphicsQuality(): Promise<void> {
    this.config.imageQuality = 'low';
    // Would also reduce other graphics settings in real implementation
  }

  private async optimizeCaching(): Promise<void> {
    // Implement cache optimization strategies
    await this.cleanupCache();
    this.config.maxCacheSize = Math.min(this.config.maxCacheSize * 1.2, 50); // Increase cache size
  }

  private setupGarbageCollection(): void {
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastGCTime > this.config.gcInterval) {
        this.performMemoryCleanup();
        this.lastGCTime = now;
      }
    }, this.config.gcInterval);
  }

  private calculateImprovement(before: PerformanceMetrics, after: PerformanceMetrics, type: string): number {
    switch (type) {
      case 'memory':
        return Math.max(0, before.memoryUsage.percentage - after.memoryUsage.percentage);
      case 'graphics':
        return Math.max(0, after.frameRate.average - before.frameRate.average);
      case 'network':
        return Math.max(0, after.cacheEfficiency.hitRate - before.cacheEfficiency.hitRate);
      default:
        return 0;
    }
  }
}

// Create and export singleton instance
export const performanceManager = new PerformanceManager();