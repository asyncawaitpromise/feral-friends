// Cloud Save Service using PocketBase
// Provides user authentication, save synchronization, conflict resolution, and offline-first functionality

import PocketBase, { AuthModel } from 'pocketbase';
import { ComprehensiveGameSave, saveManager } from './SaveManager';

export interface CloudSaveConfig {
  pocketbaseUrl: string;
  maxCloudSlots: number;
  syncInterval: number;
  retryAttempts: number;
  conflictResolution: 'server' | 'local' | 'newest' | 'prompt';
}

export interface CloudSaveRecord {
  id: string;
  userId: string;
  slotId: number;
  saveData: ComprehensiveGameSave;
  saveSize: number;
  created: string;
  updated: string;
  deviceInfo: string;
  saveVersion: string;
  checksum: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  conflicts: ConflictInfo[];
  uploaded: number;
  downloaded: number;
  errors: string[];
}

export interface ConflictInfo {
  slotId: number;
  localLastSaved: number;
  cloudLastSaved: number;
  resolution: 'server' | 'local' | 'skip';
  reason: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthModel;
  message: string;
}

export class CloudSaveService {
  private pb: PocketBase;
  private config: CloudSaveConfig;
  private syncTimer: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private pendingOperations: Array<() => Promise<void>> = [];
  private isAuthenticated: boolean = false;
  
  private callbacks: {
    onSyncProgress?: (progress: { current: number; total: number; message: string }) => void;
    onConflictDetected?: (conflict: ConflictInfo) => Promise<'server' | 'local' | 'skip'>;
    onAuthRequired?: () => Promise<{ email: string; password: string } | null>;
    onSyncComplete?: (result: SyncResult) => void;
    onError?: (error: string) => void;
  } = {};

  constructor(config: Partial<CloudSaveConfig> = {}) {
    this.config = {
      pocketbaseUrl: import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090',
      maxCloudSlots: 5,
      syncInterval: 300000, // 5 minutes
      retryAttempts: 3,
      conflictResolution: 'newest',
      ...config
    };

    this.pb = new PocketBase(this.config.pocketbaseUrl);
    this.initializeCloudSave();
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      const authData = await this.pb.collection('users').authWithPassword(email, password);
      
      this.isAuthenticated = true;
      this.startSyncTimer();
      
      return {
        success: true,
        user: authData.record,
        message: 'Authentication successful'
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Register new user account
   */
  async register(email: string, password: string, username: string): Promise<AuthResult> {
    try {
      const userData = {
        email,
        password,
        passwordConfirm: password,
        username,
        verified: false
      };

      const record = await this.pb.collection('users').create(userData);
      
      // Auto-authenticate after registration
      await this.authenticate(email, password);
      
      return {
        success: true,
        user: record,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    this.pb.authStore.clear();
    this.isAuthenticated = false;
    this.stopSyncTimer();
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.pb.authStore.isValid && this.isAuthenticated;
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthModel | null {
    return this.pb.authStore.model;
  }

  /**
   * Upload save data to cloud
   */
  async uploadSave(saveData: ComprehensiveGameSave, slotId: number): Promise<{
    success: boolean;
    message: string;
    cloudId?: string;
  }> {
    if (!this.isUserAuthenticated()) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    if (!this.isOnline) {
      // Queue for later
      this.pendingOperations.push(async () => { await this.uploadSave(saveData, slotId); });
      return {
        success: false,
        message: 'Offline - queued for sync when online'
      };
    }

    try {
      const userId = this.pb.authStore.model?.id;
      if (!userId) {
        return {
          success: false,
          message: 'No user ID available'
        };
      }

      // Check if save already exists for this slot
      const existingRecords = await this.pb.collection('game_saves').getList(1, 1, {
        filter: `userId = "${userId}" && slotId = ${slotId}`
      });

      const saveRecord = {
        userId,
        slotId,
        saveData: JSON.stringify(saveData),
        saveSize: JSON.stringify(saveData).length,
        deviceInfo: navigator.userAgent,
        saveVersion: saveData.meta.saveVersion,
        checksum: this.calculateChecksum(JSON.stringify(saveData))
      };

      let cloudId: string;

      if (existingRecords.totalItems > 0) {
        // Update existing record
        const updated = await this.pb.collection('game_saves').update(existingRecords.items[0]!.id, saveRecord);
        cloudId = updated.id;
      } else {
        // Create new record
        const created = await this.pb.collection('game_saves').create(saveRecord);
        cloudId = created.id;
      }

      return {
        success: true,
        message: `Save uploaded to cloud slot ${slotId}`,
        cloudId
      };

    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Download save data from cloud
   */
  async downloadSave(slotId: number): Promise<{
    success: boolean;
    data?: ComprehensiveGameSave;
    message: string;
  }> {
    if (!this.isUserAuthenticated()) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    if (!this.isOnline) {
      return {
        success: false,
        message: 'Cannot download while offline'
      };
    }

    try {
      const userId = this.pb.authStore.model?.id;
      if (!userId) {
        return {
          success: false,
          message: 'No user ID available'
        };
      }

      const records = await this.pb.collection('game_saves').getList(1, 1, {
        filter: `userId = "${userId}" && slotId = ${slotId}`,
        sort: '-updated'
      });

      if (records.totalItems === 0) {
        return {
          success: false,
          message: `No cloud save found for slot ${slotId}`
        };
      }

      const record = records.items[0] as unknown as CloudSaveRecord;
      const saveData: ComprehensiveGameSave = JSON.parse(record.saveData as any);

      // Verify checksum
      const expectedChecksum = this.calculateChecksum(JSON.stringify(saveData));
      if (record.checksum !== expectedChecksum) {
        return {
          success: false,
          message: 'Cloud save data corrupted (checksum mismatch)'
        };
      }

      return {
        success: true,
        data: saveData,
        message: `Save downloaded from cloud slot ${slotId}`
      };

    } catch (error) {
      console.error('Download failed:', error);
      return {
        success: false,
        message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Synchronize all saves between local and cloud
   */
  async synchronizeSaves(): Promise<SyncResult> {
    if (!this.isUserAuthenticated()) {
      return {
        success: false,
        message: 'User not authenticated',
        conflicts: [],
        uploaded: 0,
        downloaded: 0,
        errors: ['User not authenticated']
      };
    }

    if (!this.isOnline) {
      return {
        success: false,
        message: 'Cannot sync while offline',
        conflicts: [],
        uploaded: 0,
        downloaded: 0,
        errors: ['Offline']
      };
    }

    const result: SyncResult = {
      success: true,
      message: 'Sync completed',
      conflicts: [],
      uploaded: 0,
      downloaded: 0,
      errors: []
    };

    try {
      this.callbacks.onSyncProgress?.({ current: 0, total: 5, message: 'Starting sync...' });

      // Get local save slots
      const localSlots = await saveManager.getSaveSlotInfo();
      
      // Get cloud save slots
      const cloudSlots = await this.getCloudSaveSlots();

      this.callbacks.onSyncProgress?.({ current: 1, total: 5, message: 'Analyzing differences...' });

      // Process each slot
      for (let slotId = 1; slotId <= this.config.maxCloudSlots; slotId++) {
        const localSlot = localSlots.find(s => s.slotId === slotId);
        const cloudSlot = cloudSlots.find(s => s.slotId === slotId);

        try {
          const slotResult = await this.syncSlot(slotId, localSlot, cloudSlot);
          
          if (slotResult.conflict) {
            result.conflicts.push(slotResult.conflict);
          }
          
          if (slotResult.uploaded) result.uploaded++;
          if (slotResult.downloaded) result.downloaded++;
          
        } catch (error) {
          const errorMsg = `Slot ${slotId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
        }

        this.callbacks.onSyncProgress?.({
          current: slotId + 1,
          total: 5,
          message: `Processing slot ${slotId}...`
        });
      }

      this.callbacks.onSyncProgress?.({ current: 5, total: 5, message: 'Sync complete' });

      result.success = result.errors.length === 0;
      result.message = result.success ? 
        `Sync completed: ${result.uploaded} uploaded, ${result.downloaded} downloaded` :
        `Sync completed with ${result.errors.length} errors`;

      this.callbacks.onSyncComplete?.(result);
      return result;

    } catch (error) {
      result.success = false;
      result.message = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(result.message);
      return result;
    }
  }

  /**
   * Get cloud save slot information
   */
  async getCloudSaveSlots(): Promise<Array<{
    slotId: number;
    exists: boolean;
    lastSaved?: number;
    saveSize?: number;
    deviceInfo?: string;
  }>> {
    if (!this.isUserAuthenticated() || !this.isOnline) {
      return [];
    }

    try {
      const userId = this.pb.authStore.model?.id;
      if (!userId) return [];

      const records = await this.pb.collection('game_saves').getFullList({
        filter: `userId = "${userId}"`,
        sort: 'slotId'
      });

      const slots: Array<any> = [];
      
      for (let slotId = 1; slotId <= this.config.maxCloudSlots; slotId++) {
        const record = records.find((r: any) => r.slotId === slotId);
        
        if (record) {
          slots.push({
            slotId,
            exists: true,
            lastSaved: new Date(record.updated).getTime(),
            saveSize: record.saveSize,
            deviceInfo: record.deviceInfo
          });
        } else {
          slots.push({
            slotId,
            exists: false
          });
        }
      }

      return slots;

    } catch (error) {
      console.error('Failed to get cloud slots:', error);
      return [];
    }
  }

  /**
   * Delete cloud save from specific slot
   */
  async deleteCloudSave(slotId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!this.isUserAuthenticated()) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    try {
      const userId = this.pb.authStore.model?.id;
      if (!userId) {
        return {
          success: false,
          message: 'No user ID available'
        };
      }

      const records = await this.pb.collection('game_saves').getList(1, 1, {
        filter: `userId = "${userId}" && slotId = ${slotId}`
      });

      if (records.totalItems === 0) {
        return {
          success: false,
          message: `No cloud save found for slot ${slotId}`
        };
      }

      await this.pb.collection('game_saves').delete(records.items[0]!.id);

      return {
        success: true,
        message: `Cloud save deleted from slot ${slotId}`
      };

    } catch (error) {
      return {
        success: false,
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Set cloud save callbacks
   */
  setCallbacks(callbacks: {
    onSyncProgress?: (progress: { current: number; total: number; message: string }) => void;
    onConflictDetected?: (conflict: ConflictInfo) => Promise<'server' | 'local' | 'skip'>;
    onAuthRequired?: () => Promise<{ email: string; password: string } | null>;
    onSyncComplete?: (result: SyncResult) => void;
    onError?: (error: string) => void;
  }): void {
    this.callbacks = callbacks;
  }

  /**
   * Enable/disable automatic sync
   */
  setAutoSync(enabled: boolean, intervalMs: number = 300000): void {
    this.config.syncInterval = intervalMs;
    
    if (enabled && this.isUserAuthenticated()) {
      this.startSyncTimer();
    } else {
      this.stopSyncTimer();
    }
  }

  /**
   * Get sync status information
   */
  getSyncStatus(): {
    isAuthenticated: boolean;
    isOnline: boolean;
    autoSyncEnabled: boolean;
    lastSyncTime?: number;
    pendingOperations: number;
  } {
    return {
      isAuthenticated: this.isAuthenticated,
      isOnline: this.isOnline,
      autoSyncEnabled: this.syncTimer !== null,
      pendingOperations: this.pendingOperations.length
    };
  }

  // Private helper methods

  private async initializeCloudSave(): Promise<void> {
    // Set up online/offline listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Check if user is already authenticated
    if (this.pb.authStore.isValid) {
      this.isAuthenticated = true;
      this.startSyncTimer();
    }
  }

  private async syncSlot(
    slotId: number,
    localSlot: any,
    cloudSlot: any
  ): Promise<{
    uploaded: boolean;
    downloaded: boolean;
    conflict?: ConflictInfo;
  }> {
    const result = { uploaded: false, downloaded: false, conflict: null as any };

    // No data in either location
    if (!localSlot?.exists && !cloudSlot?.exists) {
      return result;
    }

    // Only local data exists
    if (localSlot?.exists && !cloudSlot?.exists) {
      const localData = await saveManager.loadGameState(slotId);
      if (localData.success && localData.data) {
        const uploadResult = await this.uploadSave(localData.data, slotId);
        result.uploaded = uploadResult.success;
      }
      return result;
    }

    // Only cloud data exists
    if (!localSlot?.exists && cloudSlot?.exists) {
      const cloudData = await this.downloadSave(slotId);
      if (cloudData.success && cloudData.data) {
        const saveResult = await saveManager.saveGameState(cloudData.data, slotId);
        result.downloaded = saveResult.success;
      }
      return result;
    }

    // Both exist - check for conflicts
    if (localSlot?.exists && cloudSlot?.exists) {
      const localTime = localSlot.lastSaved || 0;
      const cloudTime = cloudSlot.lastSaved || 0;

      // No conflict if times are very close (within 1 second)
      if (Math.abs(localTime - cloudTime) < 1000) {
        return result;
      }

      const conflict: ConflictInfo = {
        slotId,
        localLastSaved: localTime,
        cloudLastSaved: cloudTime,
        resolution: 'local' as 'local' | 'server' | 'skip',
        reason: localTime > cloudTime ? 'Local is newer' : 'Cloud is newer'
      };

      // Auto-resolve based on config or ask user
      let resolution = this.config.conflictResolution;
      
      if (resolution === 'newest') {
        resolution = localTime > cloudTime ? 'local' : 'server';
      } else if (resolution === 'prompt' && this.callbacks.onConflictDetected) {
        const userChoice = await this.callbacks.onConflictDetected(conflict);
        resolution = userChoice === 'skip' ? 'local' : userChoice;
      }

      conflict.resolution = resolution as 'local' | 'server' | 'skip';

      if (resolution === 'local') {
        const localData = await saveManager.loadGameState(slotId);
        if (localData.success && localData.data) {
          const uploadResult = await this.uploadSave(localData.data, slotId);
          result.uploaded = uploadResult.success;
        }
      } else if (resolution === 'server') {
        const cloudData = await this.downloadSave(slotId);
        if (cloudData.success && cloudData.data) {
          const saveResult = await saveManager.saveGameState(cloudData.data, slotId);
          result.downloaded = saveResult.success;
        }
      }

      result.conflict = conflict;
    }

    return result;
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = window.setInterval(async () => {
      if (this.isOnline && this.isAuthenticated) {
        try {
          await this.synchronizeSaves();
        } catch (error) {
          console.error('Auto-sync failed:', error);
          this.callbacks.onError?.(`Auto-sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }, this.config.syncInterval);
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async processPendingOperations(): Promise<void> {
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Pending operation failed:', error);
        // Re-queue failed operations
        this.pendingOperations.push(operation);
      }
    }
  }

  private calculateChecksum(data: string): string {
    // Simple checksum using hash of data length and first/last characters
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}

// Export singleton instance
export const cloudSaveService = new CloudSaveService();