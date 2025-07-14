// Enhanced Save Manager for Feral Friends
// Comprehensive game state persistence including all Stage 7 systems

// import { SaveSystem } from './SaveSystem';
import { Animal } from '../game/Animal';
import { PersonalityProfile } from '../game/AnimalPersonality';
// import { Bond } from '../game/BondingSystem';
// import { TrickProgress } from '../game/TrickSystem';
import { AnimalFoodPreferences } from '../game/FoodPreferences';
import { GatheringSkill, GatheringNode } from '../game/GatheringSystem';
import { InventoryItem } from '../game/InventorySystem';

// Enhanced save data structure that includes all game systems
export interface ComprehensiveGameSave {
  // Enhanced player data
  player: {
    id: string;
    name: string;
    level: number;
    experience: number;
    experienceToNext: number;
    position: { x: number; y: number };
    currentMap: string;
    energy: number;
    maxEnergy: number;
    health: number;
    maxHealth: number;
    playTimeSeconds: number;
    createdAt: number;
    lastActiveAt: number;
  };

  // World and exploration state
  world: {
    currentMap: string;
    discoveredMaps: string[];
    unlockedAreas: string[];
    playerMovementHistory: Array<{ position: { x: number; y: number }; timestamp: number }>;
    weatherConditions: string;
    timeOfDay: string;
    dayNightCycle: {
      currentPhase: string;
      timeElapsed: number;
    };
  };

  // Animal management
  animals: {
    discoveredAnimals: DiscoveredAnimal[];
    activeAnimals: Animal[];
    companionBonds: any[];
    animalPersonalities: Array<{ animalId: string; personality: PersonalityProfile }>;
    animalInteractionHistory: AnimalInteractionRecord[];
    animalSpawnHistory: Array<{ animalId: string; location: string; timestamp: number }>;
  };

  // Food and feeding systems
  feeding: {
    animalFoodPreferences: Array<{ animalId: string; preferences: AnimalFoodPreferences }>;
    foodDiscoveries: string[];
    gatheringSpotDiscoveries: string[];
    gatheringHistory: GatheringRecord[];
    totalFoodGiven: Record<string, number>; // foodId -> quantity
  };

  // Taming and bonding
  taming: {
    tamingAttempts: TamingRecord[];
    trustLevels: Record<string, number>; // animalId -> trust level
    bondLevels: Record<string, number>; // animalId -> bond level
    tamingMilestones: TamingMilestone[];
    activeCooldowns: Record<string, number>; // animalId -> cooldown end timestamp
  };

  // Trick teaching and performance
  tricks: {
    learnedTricks: any[];
    trickMasteryLevels: Record<string, number>; // trickId -> mastery level
    performanceHistory: PerformanceRecord[];
    teachingProgress: Array<{ animalId: string; trickId: string; progress: number }>;
    performanceVenues: Array<{ venueId: string; reputation: number; unlocked: boolean }>;
  };

  // Item and inventory management
  inventory: {
    items: InventoryItem[];
    maxSlots: number;
    categories: string[];
    itemHistory: ItemUsageRecord[];
    craftingRecipes: Array<{ recipeId: string; unlocked: boolean; timesCrafted: number }>;
    toolDurability: Record<string, number>; // toolId -> current durability
    activeCrafting: Array<{ recipeId: string; startTime: number; estimatedCompletion: number }>;
  };

  // Resource gathering
  gathering: {
    gatheringSkills: GatheringSkill[];
    discoveredNodes: GatheringNode[];
    gatheringHistory: GatheringRecord[];
    resourceDiscoveries: string[];
    skillProgressions: Array<{ skill: string; experience: number; level: number }>;
    activeGathering: { nodeId: string; startTime: number; estimatedCompletion: number } | null;
  };

  // Progress and achievements
  progress: {
    achievements: Achievement[];
    milestones: Milestone[];
    statistics: GameStatistics;
    progressFlags: Record<string, boolean>;
    unlockedFeatures: string[];
    experienceBreakdown: Record<string, number>; // source -> experience gained
  };

  // Settings and preferences
  settings: {
    audio: {
      masterVolume: number;
      soundEffectsVolume: number;
      musicVolume: number;
      ambientVolume: number;
      muteAll: boolean;
    };
    graphics: {
      qualityLevel: 'low' | 'medium' | 'high';
      animationsEnabled: boolean;
      particleEffectsEnabled: boolean;
      screenShakeEnabled: boolean;
    };
    gameplay: {
      autoSaveEnabled: boolean;
      autoSaveInterval: number;
      difficultyLevel: 'easy' | 'normal' | 'hard';
      tutorialCompleted: boolean;
      hintsEnabled: boolean;
    };
    accessibility: {
      colorBlindMode: boolean;
      highContrastMode: boolean;
      reducedMotion: boolean;
      largerText: boolean;
      audioCues: boolean;
    };
    controls: {
      touchSensitivity: number;
      hapticFeedback: boolean;
      gestureControls: boolean;
    };
  };

  // Meta information
  meta: {
    saveVersion: string;
    gameVersion: string;
    lastSaved: number;
    totalPlaySessions: number;
    averageSessionLength: number;
    deviceInfo: string;
    backupAvailable: boolean;
    cloudSyncEnabled: boolean;
    cloudSyncLastTime: number;
  };

  // Legacy compatibility properties
  id?: string;
  name?: string;
  level?: number;
  experience?: number;
  position?: { x: number; y: number };
  currentMap?: string;
  energy?: number;
  maxEnergy?: number;
  stats?: {
    animalsDiscovered: number;
    animalsTamed: number;
    tricksLearned: number;
    mapsExplored: number;
    totalPlayTime: number;
  };
  legacyInventoryItems?: Array<{
    id: string;
    type: 'food' | 'tool' | 'toy' | 'misc';
    name: string;
    quantity: number;
    description: string;
  }>;
  discoveredAnimals?: string[];
  companions?: any[];
  achievements?: Array<{
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    unlockedAt: number;
    progress: number;
    maxProgress: number;
    category: "special" | "discovery" | "bonding" | "tricks" | "exploration";
  }>;
  legacySettings?: {
    audio: any;
    graphics: any;
    gameplay: any;
    accessibility: any;
    controls: any;
  };
  lastSaved?: number;
}

// Supporting interfaces
export interface DiscoveredAnimal {
  id: string;
  species: string;
  firstSeen: number;
  timesSeen: number;
  lastSeen: number;
  location: string;
  notes: string;
}

export interface AnimalInteractionRecord {
  animalId: string;
  interactionType: string;
  timestamp: number;
  success: boolean;
  trustChange: number;
  bondChange: number;
  location: string;
}

export interface TamingRecord {
  animalId: string;
  timestamp: number;
  interactionType: string;
  success: boolean;
  trustGained: number;
  methodUsed: string;
  duration: number;
  location: string;
}

export interface TamingMilestone {
  animalId: string;
  milestone: string;
  timestamp: number;
  trustLevel: number;
  bondLevel: number;
}

export interface PerformanceRecord {
  animalId: string;
  venueId: string;
  tricksPerformed: string[];
  score: number;
  audienceReaction: string;
  timestamp: number;
  rewardsEarned: string[];
}

export interface ItemUsageRecord {
  itemId: string;
  timestamp: number;
  targetAnimalId?: string;
  success: boolean;
  effectsApplied: string[];
  location: string;
}

export interface GatheringRecord {
  nodeId: string;
  timestamp: number;
  duration: number;
  success: boolean;
  itemsGathered: Array<{ itemId: string; quantity: number; quality: string }>;
  experienceGained: number;
  skillsImproved: Array<{ skill: string; improvement: number }>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  reached: boolean;
  reachedAt?: number;
  category: string;
  value: number;
}

export interface GameStatistics {
  totalPlayTime: number;
  animalsDiscovered: number;
  animalsTamed: number;
  tricksLearned: number;
  tricksPerformed: number;
  itemsUsed: number;
  itemsCrafted: number;
  resourcesGathered: number;
  mapsExplored: number;
  achievementsUnlocked: number;
  averageSessionLength: number;
  longestPlaySession: number;
  totalStepsWalked: number;
  totalInteractions: number;
  successfulInteractions: number;
  foodGiven: number;
  performancesGiven: number;
  perfectPerformances: number;
}

export class SaveManager {
  // private saveSystem: SaveSystem;
  private autosaveEnabled: boolean = true;
  private autosaveInterval: number = 60000; // 1 minute
  private autosaveTimer: number | null = null;
  private compressionEnabled: boolean = true;

  constructor() {
    // this.saveSystem = new SaveSystem({
    //   maxSaveSlots: 5,
    //   autoSaveInterval: this.autosaveInterval,
    //   compressionEnabled: this.compressionEnabled,
    //   backupEnabled: true,
    //   maxBackups: 5
    // });
    
    this.initializeAutoSave();
  }

  /**
   * Save comprehensive game state to specified slot
   */
  async saveGameState(gameState: Partial<ComprehensiveGameSave>, slotId: number = 1): Promise<{
    success: boolean;
    message: string;
    saveSize: number;
    compressionRatio?: number;
  }> {
    try {
      // Create complete save data with defaults
      const comprehensiveSave: ComprehensiveGameSave = this.createCompleteSaveData(gameState);
      
      // Validate save data integrity
      const validation = this.validateSaveData(comprehensiveSave);
      if (!validation.valid) {
        return {
          success: false,
          message: `Save validation failed: ${validation.errors.join(', ')}`,
          saveSize: 0
        };
      }

      // Calculate save size
      const saveDataString = JSON.stringify(comprehensiveSave);
      const saveSize = new Blob([saveDataString]).size;

      // Perform the save
      const saveKey = `feral-friends-comprehensive-${slotId}`;
      
      if (this.compressionEnabled) {
        const compressed = this.compressData(saveDataString);
        localStorage.setItem(saveKey, compressed);
        const compressionRatio = saveDataString.length / compressed.length;
        
        return {
          success: true,
          message: `Game saved successfully to slot ${slotId}`,
          saveSize,
          compressionRatio
        };
      } else {
        localStorage.setItem(saveKey, saveDataString);
        return {
          success: true,
          message: `Game saved successfully to slot ${slotId}`,
          saveSize
        };
      }

    } catch (error) {
      console.error('Save failed:', error);
      return {
        success: false,
        message: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        saveSize: 0
      };
    }
  }

  /**
   * Load comprehensive game state from specified slot
   */
  async loadGameState(slotId: number = 1): Promise<{
    success: boolean;
    data?: ComprehensiveGameSave;
    message: string;
  }> {
    try {
      const saveKey = `feral-friends-comprehensive-${slotId}`;
      const savedData = localStorage.getItem(saveKey);
      
      if (!savedData) {
        return {
          success: false,
          message: `No save data found in slot ${slotId}`
        };
      }

      // Decompress if necessary
      let gameStateString: string;
      if (this.isCompressed(savedData)) {
        gameStateString = this.decompressData(savedData);
      } else {
        gameStateString = savedData;
      }

      // Parse and validate
      const gameState: ComprehensiveGameSave = JSON.parse(gameStateString);
      const validation = this.validateSaveData(gameState);
      
      if (!validation.valid) {
        return {
          success: false,
          message: `Save data corrupted: ${validation.errors.join(', ')}`
        };
      }

      // Perform any necessary migrations
      const migratedData = this.migrateToCurrentVersion(gameState);

      return {
        success: true,
        data: migratedData,
        message: `Game loaded successfully from slot ${slotId}`
      };

    } catch (error) {
      console.error('Load failed:', error);
      return {
        success: false,
        message: `Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get save slot information for all slots
   */
  async getSaveSlotInfo(): Promise<Array<{
    slotId: number;
    exists: boolean;
    playerName?: string;
    level?: number;
    playTime?: number;
    lastSaved?: number;
    saveSize?: number;
    preview?: {
      location: string;
      companionsCount: number;
      achievementsCount: number;
      currentMap: string;
    };
  }>> {
    const slots: Array<any> = [];

    for (let slotId = 1; slotId <= 5; slotId++) {
      const saveKey = `feral-friends-comprehensive-${slotId}`;
      const savedData = localStorage.getItem(saveKey);
      
      if (!savedData) {
        slots.push({ slotId, exists: false });
        continue;
      }

      try {
        let gameStateString: string;
        if (this.isCompressed(savedData)) {
          gameStateString = this.decompressData(savedData);
        } else {
          gameStateString = savedData;
        }

        const gameState: ComprehensiveGameSave = JSON.parse(gameStateString);
        const saveSize = new Blob([savedData]).size;

        slots.push({
          slotId,
          exists: true,
          playerName: gameState.player.name,
          level: gameState.player.level,
          playTime: gameState.player.playTimeSeconds,
          lastSaved: gameState.meta.lastSaved,
          saveSize,
          preview: {
            location: gameState.world.currentMap,
            companionsCount: gameState.animals.companionBonds.length,
            achievementsCount: gameState.progress.achievements.filter(a => a.unlocked).length,
            currentMap: gameState.world.currentMap
          }
        });
      } catch (error) {
        slots.push({
          slotId,
          exists: true,
          playerName: 'Corrupted Save',
          level: 0,
          playTime: 0,
          lastSaved: 0,
          saveSize: new Blob([savedData]).size
        });
      }
    }

    return slots;
  }

  /**
   * Enable/disable auto-save functionality
   */
  setAutoSave(enabled: boolean, intervalMs: number = 60000): void {
    this.autosaveEnabled = enabled;
    this.autosaveInterval = intervalMs;
    
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }

    if (enabled) {
      this.initializeAutoSave();
    }
  }

  /**
   * Perform auto-save with current game state
   */
  async performAutoSave(gameState: Partial<ComprehensiveGameSave>): Promise<void> {
    if (!this.autosaveEnabled) return;

    try {
      const result = await this.saveGameState(gameState, 0); // Slot 0 for auto-save
      if (result.success) {
        console.log('Auto-save completed successfully');
      } else {
        console.warn('Auto-save failed:', result.message);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }

  /**
   * Export save data for backup or transfer
   */
  async exportSaveData(slotId: number): Promise<{
    success: boolean;
    data?: string;
    message: string;
  }> {
    try {
      const loadResult = await this.loadGameState(slotId);
      if (!loadResult.success || !loadResult.data) {
        return {
          success: false,
          message: loadResult.message
        };
      }

      const exportData = {
        version: '1.0',
        exportDate: Date.now(),
        gameData: loadResult.data
      };

      const exportString = JSON.stringify(exportData, null, 2);
      
      return {
        success: true,
        data: exportString,
        message: 'Save data exported successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Import save data from backup or transfer
   */
  async importSaveData(importString: string, targetSlotId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const importData = JSON.parse(importString);
      
      if (!importData.gameData || !importData.version) {
        return {
          success: false,
          message: 'Invalid import data format'
        };
      }

      const result = await this.saveGameState(importData.gameData, targetSlotId);
      return {
        success: result.success,
        message: result.success ? 'Save data imported successfully' : result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete save data from specified slot
   */
  async deleteSaveData(slotId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const saveKey = `feral-friends-comprehensive-${slotId}`;
      localStorage.removeItem(saveKey);
      
      return {
        success: true,
        message: `Save data deleted from slot ${slotId}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods

  private createCompleteSaveData(partialData: Partial<ComprehensiveGameSave>): ComprehensiveGameSave {
    const now = Date.now();
    
    return {
      // Merge with defaults
      player: {
        id: 'player_1',
        name: 'Player',
        level: 1,
        experience: 0,
        experienceToNext: 100,
        position: { x: 0, y: 0 },
        currentMap: 'starter_meadow',
        energy: 100,
        maxEnergy: 100,
        health: 100,
        maxHealth: 100,
        playTimeSeconds: 0,
        createdAt: now,
        lastActiveAt: now,
        ...partialData.player
      },
      
      world: {
        currentMap: 'starter_meadow',
        discoveredMaps: ['starter_meadow'],
        unlockedAreas: ['starter_meadow'],
        playerMovementHistory: [],
        weatherConditions: 'clear',
        timeOfDay: 'afternoon',
        dayNightCycle: {
          currentPhase: 'afternoon',
          timeElapsed: 0
        },
        ...partialData.world
      },

      animals: {
        discoveredAnimals: [],
        activeAnimals: [],
        companionBonds: [],
        animalPersonalities: [],
        animalInteractionHistory: [],
        animalSpawnHistory: [],
        ...partialData.animals
      },

      feeding: {
        animalFoodPreferences: [],
        foodDiscoveries: [],
        gatheringSpotDiscoveries: [],
        gatheringHistory: [],
        totalFoodGiven: {},
        ...partialData.feeding
      },

      taming: {
        tamingAttempts: [],
        trustLevels: {},
        bondLevels: {},
        tamingMilestones: [],
        activeCooldowns: {},
        ...partialData.taming
      },

      tricks: {
        learnedTricks: [],
        trickMasteryLevels: {},
        performanceHistory: [],
        teachingProgress: [],
        performanceVenues: [],
        ...partialData.tricks
      },

      inventory: {
        items: [],
        maxSlots: 20,
        categories: ['food', 'tools', 'toys', 'misc'],
        itemHistory: [],
        craftingRecipes: [],
        toolDurability: {},
        activeCrafting: [],
        ...partialData.inventory
      },

      gathering: {
        gatheringSkills: [],
        discoveredNodes: [],
        gatheringHistory: [],
        resourceDiscoveries: [],
        skillProgressions: [],
        activeGathering: null,
        ...partialData.gathering
      },

      progress: {
        achievements: [],
        milestones: [],
        statistics: {
          totalPlayTime: 0,
          animalsDiscovered: 0,
          animalsTamed: 0,
          tricksLearned: 0,
          tricksPerformed: 0,
          itemsUsed: 0,
          itemsCrafted: 0,
          resourcesGathered: 0,
          mapsExplored: 0,
          achievementsUnlocked: 0,
          averageSessionLength: 0,
          longestPlaySession: 0,
          totalStepsWalked: 0,
          totalInteractions: 0,
          successfulInteractions: 0,
          foodGiven: 0,
          performancesGiven: 0,
          perfectPerformances: 0
        },
        progressFlags: {},
        unlockedFeatures: [],
        experienceBreakdown: {},
        ...partialData.progress
      },

      settings: {
        audio: {
          masterVolume: 0.8,
          soundEffectsVolume: 0.8,
          musicVolume: 0.6,
          ambientVolume: 0.4,
          muteAll: false,
          ...partialData.settings?.audio
        },
        graphics: {
          qualityLevel: 'medium' as const,
          animationsEnabled: true,
          particleEffectsEnabled: true,
          screenShakeEnabled: true,
          ...partialData.settings?.graphics
        },
        gameplay: {
          autoSaveEnabled: true,
          autoSaveInterval: 60000,
          difficultyLevel: 'normal' as const,
          tutorialCompleted: false,
          hintsEnabled: true,
          ...partialData.settings?.gameplay
        },
        accessibility: {
          colorBlindMode: false,
          highContrastMode: false,
          reducedMotion: false,
          largerText: false,
          audioCues: false,
          ...partialData.settings?.accessibility
        },
        controls: {
          touchSensitivity: 1.0,
          hapticFeedback: true,
          gestureControls: true,
          ...partialData.settings?.controls
        }
      },

      meta: {
        saveVersion: '1.0.0',
        gameVersion: '0.8.0',
        lastSaved: now,
        totalPlaySessions: 1,
        averageSessionLength: 0,
        deviceInfo: navigator.userAgent,
        backupAvailable: false,
        cloudSyncEnabled: false,
        cloudSyncLastTime: 0,
        ...partialData.meta
      },

      // Legacy properties for compatibility
      id: partialData.player?.id || 'player_1',
      name: partialData.player?.name || 'Player',
      level: partialData.player?.level || 1,
      experience: partialData.player?.experience || 0,
      position: partialData.player?.position || { x: 0, y: 0 },
      currentMap: partialData.world?.currentMap || 'starter_meadow',
      energy: partialData.player?.energy || 100,
      maxEnergy: partialData.player?.maxEnergy || 100,
      stats: {
        animalsDiscovered: partialData.progress?.statistics?.animalsDiscovered || 0,
        animalsTamed: partialData.progress?.statistics?.animalsTamed || 0,
        tricksLearned: partialData.progress?.statistics?.tricksLearned || 0,
        mapsExplored: partialData.progress?.statistics?.mapsExplored || 0,
        totalPlayTime: partialData.progress?.statistics?.totalPlayTime || 0
      },
      // Use legacy inventory format for compatibility
      legacyInventoryItems: partialData.inventory?.items?.map(item => ({
        id: item.id,
        type: item.type as 'food' | 'tool' | 'toy' | 'misc',
        name: item.name,
        quantity: item.quantity || 1,
        description: item.description
      })) || [],
      discoveredAnimals: partialData.animals?.discoveredAnimals?.map(a => a.id) || [],
      companions: [],
      achievements: partialData.progress?.achievements?.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlockedAt || 0,
        progress: achievement.progress,
        maxProgress: achievement.maxProgress,
        category: achievement.category as "special" | "discovery" | "bonding" | "tricks" | "exploration"
      })) || [],
      legacySettings: {
        audio: partialData.settings?.audio || {},
        graphics: partialData.settings?.graphics || {},
        gameplay: partialData.settings?.gameplay || {},
        accessibility: partialData.settings?.accessibility || {},
        controls: partialData.settings?.controls || {}
      },
      lastSaved: now
    };
  }

  private validateSaveData(saveData: ComprehensiveGameSave): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!saveData.player?.id) errors.push('Missing player ID');
    if (!saveData.player?.name) errors.push('Missing player name');
    if (typeof saveData.player?.level !== 'number') errors.push('Invalid player level');
    if (!saveData.world?.currentMap) errors.push('Missing current map');
    if (!saveData.meta?.saveVersion) errors.push('Missing save version');

    // Validate data types
    if (saveData.animals?.discoveredAnimals && !Array.isArray(saveData.animals.discoveredAnimals)) {
      errors.push('Invalid discovered animals data');
    }
    if (saveData.inventory?.items && !Array.isArray(saveData.inventory.items)) {
      errors.push('Invalid inventory data');
    }

    return { valid: errors.length === 0, errors };
  }

  private migrateToCurrentVersion(saveData: ComprehensiveGameSave): ComprehensiveGameSave {
    // Handle version migrations here
    // For now, just update the version number
    return {
      ...saveData,
      meta: {
        ...saveData.meta,
        saveVersion: '1.0.0',
        gameVersion: '0.8.0'
      }
    };
  }

  private compressData(data: string): string {
    // Simple compression using btoa - could be enhanced with actual compression libraries
    return btoa(data);
  }

  private decompressData(compressedData: string): string {
    return atob(compressedData);
  }

  private isCompressed(data: string): boolean {
    try {
      atob(data);
      return true;
    } catch {
      return false;
    }
  }

  private initializeAutoSave(): void {
    if (!this.autosaveEnabled) return;

    this.autosaveTimer = window.setInterval(() => {
      // Auto-save will be triggered by the game loop when needed
      console.log('Auto-save timer tick');
    }, this.autosaveInterval);
  }
}

// Export singleton instance
export const saveManager = new SaveManager();