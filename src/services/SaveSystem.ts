export interface PlayerSaveData {
  id: string;
  name: string;
  level: number;
  experience: number;
  position: { x: number; y: number };
  currentMap: string;
  energy: number;
  maxEnergy: number;
  stats: {
    animalsDiscovered: number;
    animalsTamed: number;
    tricksLearned: number;
    mapsExplored: number;
    totalPlayTime: number; // in seconds
  };
  inventory: InventoryItem[];
  discoveredAnimals: string[]; // Animal IDs that have been seen
  companions: CompanionData[];
  achievements: Achievement[];
  settings: GameSettings;
  lastSaved: number; // timestamp
}

export interface InventoryItem {
  id: string;
  type: 'food' | 'tool' | 'toy' | 'misc';
  name: string;
  quantity: number;
  description?: string;
}

export interface CompanionData {
  id: string;
  animalId: string;
  name: string;
  species: string;
  trustLevel: number;
  energy: number;
  friendship: number;
  knownTricks: string[];
  personality: string;
  dateCompanioned: number; // timestamp
  stats: {
    tricksPerformed: number;
    gamesPlayed: number;
    foodsEaten: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number; // timestamp
  category: 'discovery' | 'bonding' | 'tricks' | 'exploration' | 'special';
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  ambientVolume: number;
  isMuted: boolean;
  showFPS: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  particleQuality: 'low' | 'medium' | 'high';
  autoSave: boolean;
  showTutorials: boolean;
  touchSensitivity: number;
  largeText: boolean;
  soundCues: boolean;
  screenReader: boolean;
}

export interface SaveSlot {
  slotId: number;
  playerData: PlayerSaveData | null;
  lastModified: number;
  isEmpty: boolean;
  previewData?: {
    playerName: string;
    level: number;
    currentMap: string;
    playTime: string;
    companionCount: number;
  };
}

export interface SaveSystemConfig {
  maxSaveSlots: number;
  autoSaveInterval: number; // milliseconds
  compressionEnabled: boolean;
  backupEnabled: boolean;
  maxBackups: number;
}

export class SaveSystem {
  private config: SaveSystemConfig;
  private autoSaveTimer: number | null = null;
  private lastAutoSave: number = 0;
  private currentPlayerData: PlayerSaveData | null = null;

  constructor(config: Partial<SaveSystemConfig> = {}) {
    this.config = {
      maxSaveSlots: 3,
      autoSaveInterval: 60000, // 1 minute
      compressionEnabled: true,
      backupEnabled: true,
      maxBackups: 3,
      ...config
    };
  }

  // Core save/load operations
  async saveGame(playerData: PlayerSaveData, slotId: number = 1): Promise<boolean> {
    try {
      // Validate input
      if (slotId < 1 || slotId > this.config.maxSaveSlots) {
        throw new Error(`Invalid save slot: ${slotId}`);
      }

      // Update save timestamp
      const saveData: PlayerSaveData = {
        ...playerData,
        lastSaved: Date.now()
      };

      // Create backup if enabled
      if (this.config.backupEnabled) {
        await this.createBackup(slotId);
      }

      // Save to localStorage with compression if enabled
      const saveKey = `feral-friends-save-${slotId}`;
      const serializedData = JSON.stringify(saveData);
      
      if (this.config.compressionEnabled) {
        // Simple compression using base64 (could be enhanced with actual compression)
        const compressedData = btoa(serializedData);
        localStorage.setItem(saveKey, compressedData);
        localStorage.setItem(`${saveKey}-compressed`, 'true');
      } else {
        localStorage.setItem(saveKey, serializedData);
        localStorage.setItem(`${saveKey}-compressed`, 'false');
      }

      // Update slot metadata
      await this.updateSlotMetadata(slotId, saveData);

      this.currentPlayerData = saveData;
      console.log(`Game saved successfully to slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  async loadGame(slotId: number): Promise<PlayerSaveData | null> {
    try {
      if (slotId < 1 || slotId > this.config.maxSaveSlots) {
        throw new Error(`Invalid save slot: ${slotId}`);
      }

      const saveKey = `feral-friends-save-${slotId}`;
      const savedData = localStorage.getItem(saveKey);
      
      if (!savedData) {
        return null;
      }

      // Check if data is compressed
      const isCompressed = localStorage.getItem(`${saveKey}-compressed`) === 'true';
      let deserializedData: string;

      if (isCompressed) {
        deserializedData = atob(savedData);
      } else {
        deserializedData = savedData;
      }

      const playerData: PlayerSaveData = JSON.parse(deserializedData);
      
      // Validate loaded data
      if (!this.validateSaveData(playerData)) {
        throw new Error('Invalid save data structure');
      }

      this.currentPlayerData = playerData;
      console.log(`Game loaded successfully from slot ${slotId}`);
      return playerData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  async deleteGame(slotId: number): Promise<boolean> {
    try {
      if (slotId < 1 || slotId > this.config.maxSaveSlots) {
        throw new Error(`Invalid save slot: ${slotId}`);
      }

      const saveKey = `feral-friends-save-${slotId}`;
      localStorage.removeItem(saveKey);
      localStorage.removeItem(`${saveKey}-compressed`);
      localStorage.removeItem(`${saveKey}-metadata`);

      // Clean up backups
      for (let i = 1; i <= this.config.maxBackups; i++) {
        localStorage.removeItem(`${saveKey}-backup-${i}`);
      }

      console.log(`Save slot ${slotId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  // Save slot management
  async getAllSaveSlots(): Promise<SaveSlot[]> {
    const slots: SaveSlot[] = [];

    for (let i = 1; i <= this.config.maxSaveSlots; i++) {
      const slot = await this.getSaveSlot(i);
      slots.push(slot);
    }

    return slots;
  }

  async getSaveSlot(slotId: number): Promise<SaveSlot> {
    const saveKey = `feral-friends-save-${slotId}`;
    const savedData = localStorage.getItem(saveKey);
    const metadataKey = `${saveKey}-metadata`;
    const metadata = localStorage.getItem(metadataKey);

    if (!savedData) {
      return {
        slotId,
        playerData: null,
        lastModified: 0,
        isEmpty: true
      };
    }

    let playerData: PlayerSaveData | null = null;
    let previewData = undefined;

    try {
      // Load preview data from metadata if available
      if (metadata) {
        previewData = JSON.parse(metadata);
      } else {
        // Load full data to create preview
        playerData = await this.loadGame(slotId);
        if (playerData) {
          previewData = this.createPreviewData(playerData);
          await this.updateSlotMetadata(slotId, playerData);
        }
      }
    } catch (error) {
      console.warn(`Failed to load preview for slot ${slotId}:`, error);
    }

    return {
      slotId,
      playerData,
      lastModified: previewData?.lastModified || 0,
      isEmpty: false,
      previewData
    };
  }

  // Auto-save functionality
  startAutoSave(playerDataProvider: () => PlayerSaveData | null): void {
    if (this.autoSaveTimer) {
      this.stopAutoSave();
    }

    this.autoSaveTimer = window.setInterval(async () => {
      const playerData = playerDataProvider();
      if (playerData && this.shouldAutoSave()) {
        await this.autoSave(playerData);
      }
    }, this.config.autoSaveInterval);

    console.log('Auto-save started');
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('Auto-save stopped');
    }
  }

  private async autoSave(playerData: PlayerSaveData): Promise<void> {
    try {
      // Use slot 1 for auto-saves by default
      const success = await this.saveGame(playerData, 1);
      if (success) {
        this.lastAutoSave = Date.now();
        console.log('Auto-save completed');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  private shouldAutoSave(): boolean {
    const timeSinceLastSave = Date.now() - this.lastAutoSave;
    return timeSinceLastSave >= this.config.autoSaveInterval;
  }

  // Backup system
  private async createBackup(slotId: number): Promise<void> {
    try {
      const saveKey = `feral-friends-save-${slotId}`;
      const existingData = localStorage.getItem(saveKey);
      
      if (!existingData) return;

      // Shift existing backups
      for (let i = this.config.maxBackups; i > 1; i--) {
        const prevBackup = localStorage.getItem(`${saveKey}-backup-${i - 1}`);
        if (prevBackup) {
          localStorage.setItem(`${saveKey}-backup-${i}`, prevBackup);
        }
      }

      // Create new backup
      localStorage.setItem(`${saveKey}-backup-1`, existingData);
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
  }

  async restoreFromBackup(slotId: number, backupIndex: number = 1): Promise<boolean> {
    try {
      if (backupIndex < 1 || backupIndex > this.config.maxBackups) {
        throw new Error(`Invalid backup index: ${backupIndex}`);
      }

      const saveKey = `feral-friends-save-${slotId}`;
      const backupKey = `${saveKey}-backup-${backupIndex}`;
      const backupData = localStorage.getItem(backupKey);

      if (!backupData) {
        throw new Error(`No backup found at index ${backupIndex}`);
      }

      localStorage.setItem(saveKey, backupData);
      console.log(`Restored save slot ${slotId} from backup ${backupIndex}`);
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  // Utility methods
  private validateSaveData(data: any): data is PlayerSaveData {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.level === 'number' &&
      data.position &&
      typeof data.position.x === 'number' &&
      typeof data.position.y === 'number' &&
      Array.isArray(data.inventory) &&
      Array.isArray(data.companions) &&
      typeof data.lastSaved === 'number'
    );
  }

  private createPreviewData(playerData: PlayerSaveData) {
    const playTimeHours = Math.floor(playerData.stats.totalPlayTime / 3600);
    const playTimeMinutes = Math.floor((playerData.stats.totalPlayTime % 3600) / 60);
    
    return {
      playerName: playerData.name,
      level: playerData.level,
      currentMap: playerData.currentMap,
      playTime: `${playTimeHours}h ${playTimeMinutes}m`,
      companionCount: playerData.companions.length,
      lastModified: playerData.lastSaved
    };
  }

  private async updateSlotMetadata(slotId: number, playerData: PlayerSaveData): Promise<void> {
    try {
      const saveKey = `feral-friends-save-${slotId}`;
      const metadataKey = `${saveKey}-metadata`;
      const previewData = this.createPreviewData(playerData);
      
      localStorage.setItem(metadataKey, JSON.stringify(previewData));
    } catch (error) {
      console.warn('Failed to update slot metadata:', error);
    }
  }

  // Export/Import functionality
  async exportSave(slotId: number): Promise<string | null> {
    try {
      const playerData = await this.loadGame(slotId);
      if (!playerData) {
        throw new Error('No save data found');
      }

      const exportData = {
        version: '1.0',
        exportedAt: Date.now(),
        gameData: playerData
      };

      return btoa(JSON.stringify(exportData));
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  async importSave(importData: string, slotId: number): Promise<boolean> {
    try {
      const decodedData = atob(importData);
      const parsedData = JSON.parse(decodedData);

      if (!parsedData.gameData || !this.validateSaveData(parsedData.gameData)) {
        throw new Error('Invalid import data');
      }

      return await this.saveGame(parsedData.gameData, slotId);
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  // Configuration and cleanup
  updateConfig(newConfig: Partial<SaveSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('feral-friends-')) {
          used += localStorage.getItem(key)?.length || 0;
        }
      }

      // Estimate total localStorage capacity (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      const percentage = Math.round((used / total) * 100);

      return { used, total, percentage };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('feral-friends-')) {
          keys.push(key);
        }
      }

      keys.forEach(key => localStorage.removeItem(key));
      
      this.currentPlayerData = null;
      this.stopAutoSave();
      
      console.log('All save data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear save data:', error);
      return false;
    }
  }

  dispose(): void {
    this.stopAutoSave();
    this.currentPlayerData = null;
  }
}

// Global save system instance
let saveSystemInstance: SaveSystem | null = null;

export function getSaveSystem(): SaveSystem {
  if (!saveSystemInstance) {
    saveSystemInstance = new SaveSystem();
  }
  return saveSystemInstance;
}

// Convenience functions
export async function quickSave(playerData: PlayerSaveData): Promise<boolean> {
  return getSaveSystem().saveGame(playerData, 1);
}

export async function quickLoad(): Promise<PlayerSaveData | null> {
  return getSaveSystem().loadGame(1);
}

export function enableAutoSave(playerDataProvider: () => PlayerSaveData | null): void {
  getSaveSystem().startAutoSave(playerDataProvider);
}

export function disableAutoSave(): void {
  getSaveSystem().stopAutoSave();
}