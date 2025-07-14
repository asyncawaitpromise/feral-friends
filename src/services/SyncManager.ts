// Sync Manager Service
// Handles sync strategy when connectivity returns with change tracking, conflict resolution, 
// incremental updates, and background synchronization

import { offlineStorage } from './OfflineStorage';
import { cloudSaveService } from './CloudSave';
import { ComprehensiveGameSave } from './SaveManager';

export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  conflictResolution: 'server' | 'local' | 'newest' | 'prompt';
  backgroundSync: boolean;
  syncInterval: number;
  changeTrackingEnabled: boolean;
}

export interface ChangeRecord {
  id: string;
  type: 'create' | 'update' | 'delete';
  tableName: string;
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastAttempt?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'bidirectional';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  errors: string[];
  startTime: number;
  estimatedCompletion?: number;
}

export interface SyncSession {
  id: string;
  startTime: number;
  endTime?: number;
  operations: SyncOperation[];
  totalChanges: number;
  successfulChanges: number;
  failedChanges: number;
  conflicts: ConflictResolution[];
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface ConflictResolution {
  changeId: string;
  localVersion: any;
  serverVersion: any;
  resolution: 'server' | 'local' | 'merged' | 'skipped';
  resolvedAt: number;
  resolvedBy: 'auto' | 'user';
}

export interface SyncStatus {
  isOnline: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  nextSyncTime: number;
  currentSession?: SyncSession;
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
  estimatedSyncTime: number;
}

export class SyncManager {
  private config: SyncConfig;
  private changeQueue: ChangeRecord[] = [];
  private isOnline: boolean = navigator.onLine;
  private isConnected: boolean = false;
  private isSyncing: boolean = false;
  private syncTimer: number | null = null;
  private currentSession: SyncSession | null = null;
  private networkMonitor: NetworkMonitor;
  private retryQueue: Map<string, number> = new Map();

  private callbacks: {
    onSyncStart?: (session: SyncSession) => void;
    onSyncProgress?: (operation: SyncOperation) => void;
    onSyncComplete?: (session: SyncSession) => void;
    onConflictDetected?: (conflict: ConflictResolution) => Promise<'server' | 'local' | 'skip'>;
    onError?: (error: string, context?: any) => void;
    onConnectivityChange?: (isOnline: boolean, isConnected: boolean) => void;
  } = {};

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
      conflictResolution: 'newest',
      backgroundSync: true,
      syncInterval: 300000, // 5 minutes
      changeTrackingEnabled: true,
      ...config
    };

    this.networkMonitor = new NetworkMonitor();
    this.initializeSyncManager();
  }

  /**
   * Initialize sync manager with connectivity monitoring
   */
  private async initializeSyncManager(): Promise<void> {
    try {
      // Load pending changes from storage
      await this.loadPendingChanges();

      // Set up connectivity monitoring
      this.setupConnectivityMonitoring();

      // Set up background sync if enabled
      if (this.config.backgroundSync) {
        this.setupBackgroundSync();
      }

      // Perform initial connectivity check
      await this.checkConnectivity();

      console.log('SyncManager initialized successfully');

    } catch (error) {
      console.error('Failed to initialize SyncManager:', error);
    }
  }

  /**
   * Track a change for synchronization
   */
  async trackChange(
    type: ChangeRecord['type'],
    tableName: string,
    data: any,
    priority: ChangeRecord['priority'] = 'medium'
  ): Promise<void> {
    if (!this.config.changeTrackingEnabled) return;

    try {
      const changeRecord: ChangeRecord = {
        id: `${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        tableName,
        data,
        timestamp: Date.now(),
        synced: false,
        retryCount: 0,
        priority
      };

      // Add to queue
      this.changeQueue.push(changeRecord);

      // Store change for persistence
      await offlineStorage.store(
        `change_${changeRecord.id}`,
        changeRecord,
        'cache',
        7 * 24 * 60 * 60 * 1000 // 7 days
      );

      // Trigger sync if online and not already syncing
      if (this.isConnected && !this.isSyncing) {
        this.scheduleSyncAttempt();
      }

    } catch (error) {
      console.error('Failed to track change:', error);
      this.callbacks.onError?.('Failed to track change', { type, tableName, error });
    }
  }

  /**
   * Start synchronization session
   */
  async startSync(force: boolean = false): Promise<SyncSession> {
    if (this.isSyncing && !force) {
      throw new Error('Sync already in progress');
    }

    try {
      // Check connectivity first
      await this.checkConnectivity();
      
      if (!this.isConnected) {
        throw new Error('No connection available for sync');
      }

      // Cancel any existing sync
      if (this.currentSession) {
        await this.cancelSync();
      }

      // Create new sync session
      this.currentSession = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        operations: [],
        totalChanges: this.changeQueue.filter(c => !c.synced).length,
        successfulChanges: 0,
        failedChanges: 0,
        conflicts: [],
        networkQuality: this.networkMonitor.getQuality()
      };

      this.isSyncing = true;
      this.callbacks.onSyncStart?.(this.currentSession);

      // Perform sync operations
      await this.performSync();

      // Complete session
      this.currentSession.endTime = Date.now();
      const completedSession = { ...this.currentSession };
      
      this.currentSession = null;
      this.isSyncing = false;

      this.callbacks.onSyncComplete?.(completedSession);
      return completedSession;

    } catch (error) {
      this.isSyncing = false;
      this.currentSession = null;
      console.error('Sync failed:', error);
      this.callbacks.onError?.('Sync failed', error);
      throw error;
    }
  }

  /**
   * Cancel current sync session
   */
  async cancelSync(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Mark all in-progress operations as cancelled
      this.currentSession.operations.forEach(op => {
        if (op.status === 'in_progress') {
          op.status = 'cancelled';
        }
      });

      this.currentSession.endTime = Date.now();
      this.isSyncing = false;
      this.currentSession = null;

    } catch (error) {
      console.error('Failed to cancel sync:', error);
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    const pendingChanges = this.changeQueue.filter(c => !c.synced).length;
    const lastSyncTime = parseInt(localStorage.getItem('feral_friends_last_sync') || '0');
    const nextSyncTime = this.syncTimer ? lastSyncTime + this.config.syncInterval : 0;

    const status: SyncStatus = {
      isOnline: this.isOnline,
      isConnected: this.isConnected,
      isSyncing: this.isSyncing,
      lastSyncTime,
      pendingChanges,
      nextSyncTime,
      networkQuality: this.networkMonitor.getQuality(),
      estimatedSyncTime: this.estimateSyncTime()
    };
    
    if (this.currentSession) {
      status.currentSession = this.currentSession;
    }
    
    return status;
  }

  /**
   * Force sync attempt regardless of schedule
   */
  async forceSyncNow(): Promise<SyncSession> {
    return await this.startSync(true);
  }

  /**
   * Set sync callbacks
   */
  setCallbacks(callbacks: {
    onSyncStart?: (session: SyncSession) => void;
    onSyncProgress?: (operation: SyncOperation) => void;
    onSyncComplete?: (session: SyncSession) => void;
    onConflictDetected?: (conflict: ConflictResolution) => Promise<'server' | 'local' | 'skip'>;
    onError?: (error: string, context?: any) => void;
    onConnectivityChange?: (isOnline: boolean, isConnected: boolean) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Configure sync settings
   */
  configure(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart background sync if interval changed
    if (newConfig.syncInterval || newConfig.backgroundSync !== undefined) {
      this.setupBackgroundSync();
    }
  }

  /**
   * Get pending changes count by priority
   */
  getPendingChangesByPriority(): Record<ChangeRecord['priority'], number> {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    
    this.changeQueue.filter(c => !c.synced).forEach(change => {
      counts[change.priority]++;
    });

    return counts;
  }

  /**
   * Clear all synced changes (cleanup)
   */
  async clearSyncedChanges(): Promise<void> {
    try {
      const syncedChanges = this.changeQueue.filter(c => c.synced);
      
      // Remove from storage
      for (const change of syncedChanges) {
        await offlineStorage.remove(`change_${change.id}`);
      }

      // Remove from memory queue
      this.changeQueue = this.changeQueue.filter(c => !c.synced);

    } catch (error) {
      console.error('Failed to clear synced changes:', error);
    }
  }

  // Private helper methods

  private async loadPendingChanges(): Promise<void> {
    try {
      // This would typically load from IndexedDB or another persistent store
      // For now, we'll leave the implementation basic since we're using offlineStorage
      const stats = await offlineStorage.getStats();
      console.log(`Loaded sync manager with ${stats.itemCount} potential change records`);

    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  }

  private setupConnectivityMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.checkConnectivity();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.isConnected = false;
      this.callbacks.onConnectivityChange?.(false, false);
    });

    // Monitor connection quality
    this.networkMonitor.onQualityChange((quality) => {
      if (quality === 'poor') {
        this.isConnected = false;
      } else {
        this.checkConnectivity();
      }
    });
  }

  private setupBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (!this.config.backgroundSync) return;

    this.syncTimer = window.setInterval(async () => {
      if (this.isConnected && !this.isSyncing && this.changeQueue.some(c => !c.synced)) {
        try {
          await this.startSync();
        } catch (error) {
          console.log('Background sync failed:', error);
        }
      }
    }, this.config.syncInterval);
  }

  private async checkConnectivity(): Promise<void> {
    try {
      if (!this.isOnline) {
        this.isConnected = false;
        return;
      }

      // Test actual connectivity to our services
      const wasConnected = this.isConnected;
      this.isConnected = cloudSaveService.isUserAuthenticated() && 
                        await this.testConnection();

      if (wasConnected !== this.isConnected) {
        this.callbacks.onConnectivityChange?.(this.isOnline, this.isConnected);
      }

    } catch (error) {
      this.isConnected = false;
      console.error('Connectivity check failed:', error);
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      // Simple connectivity test - try to fetch a small resource
      const response = await fetch('/manifest.json', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private scheduleSyncAttempt(): void {
    // Schedule a sync attempt with exponential backoff for failed items
    setTimeout(async () => {
      if (this.isConnected && !this.isSyncing) {
        try {
          await this.startSync();
        } catch (error) {
          console.log('Scheduled sync failed:', error);
        }
      }
    }, this.config.retryDelay);
  }

  private async performSync(): Promise<void> {
    if (!this.currentSession) return;

    // Sort changes by priority and timestamp
    const pendingChanges = this.changeQueue
      .filter(c => !c.synced)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

    if (pendingChanges.length === 0) return;

    // Process in batches
    for (let i = 0; i < pendingChanges.length; i += this.config.batchSize) {
      const batch = pendingChanges.slice(i, i + this.config.batchSize);
      
      const operation: SyncOperation = {
        id: `op_${Date.now()}_${i}`,
        type: 'upload',
        status: 'pending',
        progress: 0,
        totalItems: batch.length,
        processedItems: 0,
        errors: [],
        startTime: Date.now()
      };

      this.currentSession.operations.push(operation);
      operation.status = 'in_progress';

      try {
        await this.processBatch(batch, operation);
        operation.status = 'completed';
        operation.progress = 100;
      } catch (error) {
        operation.status = 'failed';
        operation.errors.push(error instanceof Error ? error.message : 'Unknown error');
        this.currentSession.failedChanges += batch.length;
      }

      this.callbacks.onSyncProgress?.(operation);
    }
  }

  private async processBatch(changes: ChangeRecord[], operation: SyncOperation): Promise<void> {
    for (const change of changes) {
      try {
        await this.processChange(change);
        change.synced = true;
        operation.processedItems++;
        operation.progress = (operation.processedItems / operation.totalItems) * 100;
        
        if (this.currentSession) {
          this.currentSession.successfulChanges++;
        }

        // Remove change from persistent storage
        await offlineStorage.remove(`change_${change.id}`);

      } catch (error) {
        change.retryCount++;
        change.lastAttempt = Date.now();
        operation.errors.push(`Change ${change.id}: ${error}`);
        
        if (this.currentSession) {
          this.currentSession.failedChanges++;
        }

        // Schedule retry if not exceeded max retries
        if (change.retryCount < this.config.maxRetries) {
          this.scheduleRetry(change);
        }
      }
    }
  }

  private async processChange(change: ChangeRecord): Promise<void> {
    // This is where we'd integrate with the actual cloud service
    // For now, we'll simulate the process
    
    switch (change.type) {
      case 'create':
      case 'update':
        // Upload data to cloud service
        if (change.tableName === 'game_save') {
          await cloudSaveService.uploadSave(change.data as ComprehensiveGameSave, 1);
        }
        break;
        
      case 'delete':
        // Delete from cloud service
        if (change.tableName === 'game_save') {
          await cloudSaveService.deleteCloudSave(1);
        }
        break;
    }
  }

  private scheduleRetry(change: ChangeRecord): void {
    const delay = this.config.retryDelay * Math.pow(2, change.retryCount - 1);
    
    const timeoutId = window.setTimeout(() => {
      this.retryQueue.delete(change.id);
      if (this.isConnected && !this.isSyncing) {
        this.scheduleSyncAttempt();
      }
    }, delay);

    this.retryQueue.set(change.id, timeoutId);
  }

  private estimateSyncTime(): number {
    const pendingChanges = this.changeQueue.filter(c => !c.synced).length;
    const networkQuality = this.networkMonitor.getQuality();
    
    // Rough estimation based on network quality and change count
    const baseTimePerItem = {
      poor: 2000,
      fair: 1000,
      good: 500,
      excellent: 200
    };

    return pendingChanges * baseTimePerItem[networkQuality];
  }
}

/**
 * Network Quality Monitor
 */
class NetworkMonitor {
  private quality: 'poor' | 'fair' | 'good' | 'excellent' = 'good';
  private callbacks: Array<(quality: typeof this.quality) => void> = [];
  // private lastTest: number = 0;
  private testInterval: number = 30000; // 30 seconds

  constructor() {
    this.startMonitoring();
  }

  getQuality(): typeof this.quality {
    return this.quality;
  }

  onQualityChange(callback: (quality: typeof this.quality) => void): void {
    this.callbacks.push(callback);
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.testNetworkQuality();
    }, this.testInterval);

    // Initial test
    this.testNetworkQuality();
  }

  private async testNetworkQuality(): Promise<void> {
    if (!navigator.onLine) {
      this.updateQuality('poor');
      return;
    }

    try {
      const start = Date.now();
      const response = await fetch('/manifest.json?t=' + start, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const duration = Date.now() - start;

      let newQuality: typeof this.quality;
      if (!response.ok) {
        newQuality = 'poor';
      } else if (duration < 200) {
        newQuality = 'excellent';
      } else if (duration < 500) {
        newQuality = 'good';
      } else if (duration < 1000) {
        newQuality = 'fair';
      } else {
        newQuality = 'poor';
      }

      this.updateQuality(newQuality);

    } catch (error) {
      this.updateQuality('poor');
    }
  }

  private updateQuality(newQuality: typeof this.quality): void {
    if (newQuality !== this.quality) {
      this.quality = newQuality;
      this.callbacks.forEach(callback => callback(newQuality));
    }
  }
}

// Create and export singleton instance
export const syncManager = new SyncManager();