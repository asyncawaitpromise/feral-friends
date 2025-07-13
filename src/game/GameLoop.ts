// Game Loop Management with requestAnimationFrame
// Handles update logic, render cycle, pause/resume, and performance monitoring

export interface GameLoopConfig {
  targetFPS?: number;
  maxDeltaTime?: number;
  enablePerformanceMonitoring?: boolean;
  batteryOptimized?: boolean;
}

export interface GameLoopCallbacks {
  onUpdate?: (deltaTime: number, totalTime: number) => void;
  onRender?: (interpolation: number) => void;
  onFPSUpdate?: (fps: number) => void;
  onPerformanceWarning?: (avgFrameTime: number) => void;
}

export interface PerformanceMetrics {
  fps: number;
  averageFrameTime: number;
  frameCount: number;
  totalTime: number;
  isStable: boolean;
}

export class GameLoop {
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  
  // Timing
  private lastTime: number = 0;
  private accumulator: number = 0;
  private currentTime: number = 0;
  private frameCount: number = 0;
  private totalTime: number = 0;
  
  // Configuration
  private readonly config: Required<GameLoopConfig>;
  private readonly callbacks: GameLoopCallbacks;
  
  // Performance monitoring
  private fpsUpdateTime: number = 0;
  private frameTimeHistory: number[] = [];
  private readonly maxFrameHistory = 60; // Track last 60 frames
  
  // Frame rate limiting
  private readonly fixedTimeStep: number;
  private readonly maxUpdatesPerFrame = 5; // Prevent spiral of death
  
  constructor(config: GameLoopConfig = {}, callbacks: GameLoopCallbacks = {}) {
    this.config = {
      targetFPS: config.targetFPS ?? 60,
      maxDeltaTime: config.maxDeltaTime ?? 1000 / 20, // Cap at 20fps minimum
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      batteryOptimized: config.batteryOptimized ?? true,
    };
    
    this.callbacks = callbacks;
    this.fixedTimeStep = 1000 / this.config.targetFPS;
    
    // Bind methods to preserve context
    this.gameLoop = this.gameLoop.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Setup visibility change handling for battery optimization
    if (this.config.batteryOptimized) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('GameLoop: Already running');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.currentTime = this.lastTime;
    this.fpsUpdateTime = this.lastTime;
    this.frameCount = 0;
    this.totalTime = 0;
    this.accumulator = 0;
    
    console.log('GameLoop: Starting with target FPS:', this.config.targetFPS);
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Stop the game loop
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('GameLoop: Stopped');
  }
  
  /**
   * Pause the game loop (stops updates but continues rendering)
   */
  public pause(): void {
    if (!this.isRunning) {
      console.warn('GameLoop: Cannot pause - not running');
      return;
    }
    
    this.isPaused = true;
    console.log('GameLoop: Paused');
  }
  
  /**
   * Resume the game loop
   */
  public resume(): void {
    if (!this.isRunning) {
      console.warn('GameLoop: Cannot resume - not running');
      return;
    }
    
    this.isPaused = false;
    this.lastTime = performance.now(); // Reset timing to prevent large delta
    this.accumulator = 0;
    console.log('GameLoop: Resumed');
  }
  
  /**
   * Check if the game loop is currently running
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Check if the game loop is currently paused
   */
  public getIsPaused(): boolean {
    return this.isPaused;
  }
  
  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const averageFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
      : 0;
    
    const fps = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
    const isStable = averageFrameTime < this.fixedTimeStep * 1.2; // Within 20% of target
    
    return {
      fps: Math.round(fps),
      averageFrameTime: Math.round(averageFrameTime * 100) / 100,
      frameCount: this.frameCount,
      totalTime: Math.round(this.totalTime),
      isStable
    };
  }
  
  /**
   * Main game loop using fixed timestep with interpolation
   */
  private gameLoop(timestamp: number): void {
    if (!this.isRunning) {
      return;
    }
    
    // Calculate frame time and clamp to prevent spiral of death
    const rawDeltaTime = timestamp - this.lastTime;
    const deltaTime = Math.min(rawDeltaTime, this.config.maxDeltaTime);
    this.lastTime = timestamp;
    
    // Track performance
    if (this.config.enablePerformanceMonitoring) {
      this.trackPerformance(rawDeltaTime, timestamp);
    }
    
    // Fixed timestep updates (only when not paused)
    if (!this.isPaused) {
      this.accumulator += deltaTime;
      
      let updates = 0;
      while (this.accumulator >= this.fixedTimeStep && updates < this.maxUpdatesPerFrame) {
        // Fixed timestep update
        if (this.callbacks.onUpdate) {
          this.callbacks.onUpdate(this.fixedTimeStep, this.totalTime);
        }
        
        this.accumulator -= this.fixedTimeStep;
        this.totalTime += this.fixedTimeStep;
        updates++;
      }
      
      // Prevent accumulator from growing too large
      if (this.accumulator >= this.fixedTimeStep) {
        this.accumulator = this.accumulator % this.fixedTimeStep;
      }
    }
    
    // Render with interpolation
    const interpolation = this.isPaused ? 0 : this.accumulator / this.fixedTimeStep;
    if (this.callbacks.onRender) {
      this.callbacks.onRender(interpolation);
    }
    
    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Track performance metrics and trigger warnings
   */
  private trackPerformance(frameTime: number, timestamp: number): void {
    this.frameCount++;
    
    // Add to frame time history
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxFrameHistory) {
      this.frameTimeHistory.shift();
    }
    
    // Update FPS every second
    if (timestamp - this.fpsUpdateTime >= 1000) {
      const metrics = this.getPerformanceMetrics();
      
      if (this.callbacks.onFPSUpdate) {
        this.callbacks.onFPSUpdate(metrics.fps);
      }
      
      // Performance warning
      if (!metrics.isStable && this.callbacks.onPerformanceWarning) {
        this.callbacks.onPerformanceWarning(metrics.averageFrameTime);
      }
      
      this.fpsUpdateTime = timestamp;
    }
  }
  
  /**
   * Handle visibility change for battery optimization
   */
  private handleVisibilityChange(): void {
    if (!this.config.batteryOptimized) {
      return;
    }
    
    if (document.hidden) {
      if (this.isRunning && !this.isPaused) {
        this.pause();
        console.log('GameLoop: Auto-paused due to page visibility');
      }
    } else {
      if (this.isRunning && this.isPaused) {
        this.resume();
        console.log('GameLoop: Auto-resumed due to page visibility');
      }
    }
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stop();
    
    if (this.config.batteryOptimized) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    this.frameTimeHistory = [];
    console.log('GameLoop: Destroyed');
  }
}

// Utility function to create a game loop with common configuration
export function createGameLoop(
  updateCallback: (deltaTime: number, totalTime: number) => void,
  renderCallback: (interpolation: number) => void,
  config: GameLoopConfig = {}
): GameLoop {
  return new GameLoop(config, {
    onUpdate: updateCallback,
    onRender: renderCallback,
    onFPSUpdate: (fps) => {
      // Optional: Log FPS updates in development
      if (process.env.NODE_ENV === 'development') {
        console.debug(`GameLoop FPS: ${fps}`);
      }
    },
    onPerformanceWarning: (avgFrameTime) => {
      console.warn(`GameLoop: Performance warning - Average frame time: ${avgFrameTime}ms`);
    }
  });
}

// Export default GameLoop class
export default GameLoop;