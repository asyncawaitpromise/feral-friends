// Auto-Save Service
// Automatic save functionality at logical points with save corruption recovery

import { saveManager, ComprehensiveGameSave } from './SaveManager';
import { cloudSaveService } from './CloudSave';

export type SaveTrigger = 
  | 'animal_tamed'
  | 'trick_learned'
  | 'area_discovered'
  | 'achievement_unlocked'
  | 'item_crafted'
  | 'level_up'
  | 'performance_completed'
  | 'gathering_completed'
  | 'major_interaction'
  | 'map_transition'
  | 'periodic'
  | 'game_pause'
  | 'manual';

export interface AutoSaveConfig {
  enabled: boolean;
  autoSlotId: number; // Dedicated auto-save slot (usually 0)
  maxAutoSaves: number;
  periodicInterval: number; // milliseconds
  minTimeBetweenSaves: number; // milliseconds
  enabledTriggers: SaveTrigger[];
  cloudAutoSync: boolean;
  compressionEnabled: boolean;
  backupBeforeSave: boolean;
}

export interface SaveEvent {
  trigger: SaveTrigger;
  timestamp: number;
  success: boolean;
  saveSize?: number | undefined;
  compressionRatio?: number | undefined;
  error?: string | undefined;
  gameState: {
    playerLevel: number;
    currentMap: string;
    playTime: number;
  };
}

export interface AutoSaveStatus {
  lastSaveTime: number;
  lastSaveTrigger: SaveTrigger;
  totalAutoSaves: number;
  recentEvents: SaveEvent[];
  nextPeriodicSave: number;
  isEnabled: boolean;
  pendingSave: boolean;
}

export class AutoSaveService {
  private config: AutoSaveConfig;
  private lastSaveTime: number = 0;
  private periodicTimer: number | null = null;
  private saveHistory: SaveEvent[] = [];
  private pendingSave: boolean = false;
  private currentGameState: Partial<ComprehensiveGameSave> | null = null;
  
  private callbacks: {
    onAutoSave?: (event: SaveEvent) => void;
    onSaveError?: (error: string, trigger: SaveTrigger) => void;
    onCorruptionDetected?: (corruptedSlot: number) => void;
    onBackupCreated?: (backupSlot: number) => void;
  } = {};

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = {
      enabled: true,
      autoSlotId: 0,
      maxAutoSaves: 5,
      periodicInterval: 120000, // 2 minutes
      minTimeBetweenSaves: 30000, // 30 seconds
      enabledTriggers: [
        'animal_tamed',
        'trick_learned',
        'area_discovered',
        'achievement_unlocked',
        'level_up',
        'periodic',
        'game_pause'
      ],
      cloudAutoSync: true,
      compressionEnabled: true,
      backupBeforeSave: true,
      ...config
    };

    this.initializeAutoSave();
  }

  /**
   * Update current game state for auto-saving
   */
  updateGameState(gameState: Partial<ComprehensiveGameSave>): void {
    this.currentGameState = gameState;
  }

  /**
   * Trigger auto-save for specific event
   */
  async triggerAutoSave(
    trigger: SaveTrigger,
    gameState?: Partial<ComprehensiveGameSave>,
    forceImmediate: boolean = false
  ): Promise<{
    success: boolean;
    message: string;
    saveEvent?: SaveEvent;
  }> {
    // Use provided game state or current state
    const stateToSave = gameState || this.currentGameState;
    
    if (!stateToSave) {
      return {
        success: false,
        message: 'No game state available for auto-save'
      };
    }

    // Check if auto-save is enabled and trigger is allowed
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'Auto-save is disabled'
      };
    }

    if (!this.config.enabledTriggers.includes(trigger)) {
      return {
        success: false,
        message: `Auto-save trigger '${trigger}' is disabled`
      };
    }

    // Check minimum time between saves (unless forced)
    const timeSinceLastSave = Date.now() - this.lastSaveTime;
    if (!forceImmediate && timeSinceLastSave < this.config.minTimeBetweenSaves) {
      return {
        success: false,
        message: `Too soon since last save (${Math.ceil((this.config.minTimeBetweenSaves - timeSinceLastSave) / 1000)}s remaining)`
      };
    }

    // Prevent concurrent saves
    if (this.pendingSave) {
      return {
        success: false,
        message: 'Auto-save already in progress'
      };
    }

    this.pendingSave = true;

    try {
      // Create backup if enabled
      if (this.config.backupBeforeSave) {
        await this.createBackup();
      }

      // Perform the auto-save
      const saveResult = await saveManager.saveGameState(stateToSave, this.config.autoSlotId);
      
      const saveEvent: SaveEvent = {
        trigger,
        timestamp: Date.now(),
        success: saveResult.success,
        saveSize: saveResult.saveSize,
        compressionRatio: saveResult.compressionRatio,
        error: saveResult.success ? undefined : saveResult.message,
        gameState: {
          playerLevel: stateToSave.player?.level || 1,
          currentMap: stateToSave.world?.currentMap || 'unknown',
          playTime: stateToSave.player?.playTimeSeconds || 0
        }
      };

      // Add to history
      this.saveHistory.push(saveEvent);
      if (this.saveHistory.length > 50) {
        this.saveHistory.shift(); // Keep only recent 50 events
      }

      if (saveResult.success) {
        this.lastSaveTime = Date.now();
        
        // Auto-sync to cloud if enabled and authenticated
        if (this.config.cloudAutoSync && cloudSaveService.isUserAuthenticated()) {
          try {
            await cloudSaveService.uploadSave(stateToSave as ComprehensiveGameSave, this.config.autoSlotId);
          } catch (error) {
            console.warn('Auto-save cloud sync failed:', error);
          }
        }

        this.callbacks.onAutoSave?.(saveEvent);
        
        return {
          success: true,
          message: `Auto-save completed (${trigger})`,
          saveEvent
        };
      } else {
        this.callbacks.onSaveError?.(saveResult.message, trigger);
        
        return {
          success: false,
          message: `Auto-save failed: ${saveResult.message}`,
          saveEvent
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const saveEvent: SaveEvent = {
        trigger,
        timestamp: Date.now(),
        success: false,
        error: errorMessage,
        gameState: {
          playerLevel: stateToSave.player?.level || 1,
          currentMap: stateToSave.world?.currentMap || 'unknown',
          playTime: stateToSave.player?.playTimeSeconds || 0
        }
      };

      this.saveHistory.push(saveEvent);
      this.callbacks.onSaveError?.(errorMessage, trigger);

      return {
        success: false,
        message: `Auto-save error: ${errorMessage}`,
        saveEvent
      };

    } finally {
      this.pendingSave = false;
    }
  }

  /**
   * Load the most recent auto-save
   */
  async loadAutoSave(): Promise<{
    success: boolean;
    data?: ComprehensiveGameSave;
    message: string;
  }> {
    try {
      const result = await saveManager.loadGameState(this.config.autoSlotId);
      
      if (result.success && result.data) {
        // Verify auto-save integrity
        const isValid = await this.verifyAutoSaveIntegrity(result.data);
        
        if (!isValid) {
          // Try to recover from backup
          const backupResult = await this.recoverFromBackup();
          if (backupResult.success) {
            return backupResult;
          }
          
          return {
            success: false,
            message: 'Auto-save corrupted and backup recovery failed'
          };
        }

        return result;
      }

      return result;

    } catch (error) {
      return {
        success: false,
        message: `Failed to load auto-save: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get auto-save status information
   */
  getAutoSaveStatus(): AutoSaveStatus {
    return {
      lastSaveTime: this.lastSaveTime,
      lastSaveTrigger: this.saveHistory[this.saveHistory.length - 1]?.trigger || 'none' as SaveTrigger,
      totalAutoSaves: this.saveHistory.filter(e => e.success).length,
      recentEvents: this.saveHistory.slice(-10),
      nextPeriodicSave: this.periodicTimer ? this.lastSaveTime + this.config.periodicInterval : 0,
      isEnabled: this.config.enabled,
      pendingSave: this.pendingSave
    };
  }

  /**
   * Configure auto-save settings
   */
  configure(newConfig: Partial<AutoSaveConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };

    // Restart periodic timer if interval changed or enabled state changed
    if (wasEnabled !== this.config.enabled || newConfig.periodicInterval) {
      this.stopPeriodicTimer();
      if (this.config.enabled) {
        this.startPeriodicTimer();
      }
    }
  }

  /**
   * Enable or disable auto-save
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled) {
      this.startPeriodicTimer();
    } else {
      this.stopPeriodicTimer();
    }
  }

  /**
   * Get auto-save history
   */
  getAutoSaveHistory(): SaveEvent[] {
    return [...this.saveHistory];
  }

  /**
   * Clear auto-save history
   */
  clearHistory(): void {
    this.saveHistory = [];
  }

  /**
   * Set auto-save callbacks
   */
  setCallbacks(callbacks: {
    onAutoSave?: (event: SaveEvent) => void;
    onSaveError?: (error: string, trigger: SaveTrigger) => void;
    onCorruptionDetected?: (corruptedSlot: number) => void;
    onBackupCreated?: (backupSlot: number) => void;
  }): void {
    this.callbacks = callbacks;
  }

  /**
   * Force immediate auto-save regardless of timing constraints
   */
  async forceAutoSave(gameState?: Partial<ComprehensiveGameSave>): Promise<{
    success: boolean;
    message: string;
  }> {
    const result = await this.triggerAutoSave('manual', gameState, true);
    return {
      success: result.success,
      message: result.message
    };
  }

  // Private helper methods

  private initializeAutoSave(): void {
    if (this.config.enabled) {
      this.startPeriodicTimer();
    }

    // Set up page visibility change listener for auto-save on tab switch
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.config.enabled) {
        this.triggerAutoSave('game_pause');
      }
    });

    // Set up beforeunload listener for auto-save on page close
    window.addEventListener('beforeunload', () => {
      if (this.config.enabled && this.currentGameState) {
        // Synchronous save attempt (limited time)
        this.triggerAutoSave('game_pause');
      }
    });
  }

  private startPeriodicTimer(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
    }

    this.periodicTimer = window.setInterval(() => {
      if (this.config.enabled && this.currentGameState) {
        this.triggerAutoSave('periodic');
      }
    }, this.config.periodicInterval);
  }

  private stopPeriodicTimer(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }

  private async createBackup(): Promise<void> {
    try {
      // Try to load current auto-save
      const currentSave = await saveManager.loadGameState(this.config.autoSlotId);
      
      if (currentSave.success && currentSave.data) {
        // Save to backup slot (negative slot IDs for backups)
        const backupSlot = -Math.abs(this.config.autoSlotId);
        await saveManager.saveGameState(currentSave.data, backupSlot);
        this.callbacks.onBackupCreated?.(backupSlot);
      }
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
  }

  private async verifyAutoSaveIntegrity(saveData: ComprehensiveGameSave): Promise<boolean> {
    try {
      // Basic integrity checks
      if (!saveData.player?.id || !saveData.world?.currentMap || !saveData.meta?.saveVersion) {
        return false;
      }

      // Check for required data structures
      if (!saveData.animals || !saveData.inventory || !saveData.progress) {
        return false;
      }

      // Verify timestamps make sense
      if (saveData.meta.lastSaved > Date.now() + 86400000) { // Not more than 1 day in future
        return false;
      }

      return true;

    } catch (error) {
      console.error('Save integrity verification failed:', error);
      return false;
    }
  }

  private async recoverFromBackup(): Promise<{
    success: boolean;
    data?: ComprehensiveGameSave;
    message: string;
  }> {
    try {
      const backupSlot = -Math.abs(this.config.autoSlotId);
      const backupResult = await saveManager.loadGameState(backupSlot);
      
      if (backupResult.success && backupResult.data) {
        // Verify backup integrity
        const isBackupValid = await this.verifyAutoSaveIntegrity(backupResult.data);
        
        if (isBackupValid) {
          // Restore backup to main auto-save slot
          await saveManager.saveGameState(backupResult.data, this.config.autoSlotId);
          
          return {
            success: true,
            data: backupResult.data,
            message: 'Successfully recovered from backup'
          };
        }
      }

      return {
        success: false,
        message: 'No valid backup found'
      };

    } catch (error) {
      return {
        success: false,
        message: `Backup recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Create singleton instance
export const autoSaveService = new AutoSaveService();

// Export convenience functions for common save triggers
export const autoSave = {
  onAnimalTamed: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('animal_tamed', gameState),
    
  onTrickLearned: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('trick_learned', gameState),
    
  onAreaDiscovered: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('area_discovered', gameState),
    
  onAchievementUnlocked: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('achievement_unlocked', gameState),
    
  onItemCrafted: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('item_crafted', gameState),
    
  onLevelUp: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('level_up', gameState),
    
  onPerformanceCompleted: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('performance_completed', gameState),
    
  onGatheringCompleted: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('gathering_completed', gameState),
    
  onMajorInteraction: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('major_interaction', gameState),
    
  onMapTransition: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('map_transition', gameState),
    
  onGamePause: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.triggerAutoSave('game_pause', gameState),
    
  force: (gameState?: Partial<ComprehensiveGameSave>) => 
    autoSaveService.forceAutoSave(gameState)
};