// Offline Storage Service
// Robust offline storage using IndexedDB for large data and localStorage for settings
// Implements data compression for mobile storage efficiency

export interface StorageConfig {
  dbName: string;
  dbVersion: number;
  compressionEnabled: boolean;
  maxCacheSize: number; // in MB
  autoCleanup: boolean;
  cleanupThreshold: number; // in MB
}

export interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  size: number;
  compressed: boolean;
  type: 'game_save' | 'asset' | 'cache' | 'settings' | 'temporary';
  expiresAt?: number;
  metadata?: Record<string, any>;
}

export interface StorageStats {
  totalSize: number;
  itemCount: number;
  typeBreakdown: Record<string, { count: number; size: number }>;
  compressionRatio: number;
  availableSpace: number;
  lastCleanup: number;
}

export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
  compressed?: boolean;
}

export class OfflineStorage {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;
  private isInitialized: boolean = false;
  private pendingOperations: Map<string, Promise<any>> = new Map();
  private compressionWorker: Worker | null = null;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      dbName: 'FeralFriendsDB',
      dbVersion: 1,
      compressionEnabled: true,
      maxCacheSize: 50, // 50MB default
      autoCleanup: true,
      cleanupThreshold: 40, // Clean when 40MB used
      ...config
    };

    this.initializeStorage();
  }

  /**
   * Initialize IndexedDB and set up storage
   */
  async initializeStorage(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Check IndexedDB support
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        this.isInitialized = true;
        return true;
      }

      // Open database
      await this.openDatabase();
      
      // Initialize compression worker if supported
      if (this.config.compressionEnabled && window.Worker) {
        await this.initializeCompressionWorker();
      }

      // Set up auto cleanup
      if (this.config.autoCleanup) {
        this.scheduleAutoCleanup();
      }

      this.isInitialized = true;
      console.log('OfflineStorage initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize OfflineStorage:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Store data with automatic compression and type management
   */
  async store(
    key: string, 
    data: any, 
    type: StorageItem['type'] = 'cache',
    expiresIn?: number
  ): Promise<StorageResult> {
    try {
      await this.ensureInitialized();

      // Prepare storage item
      const timestamp = Date.now();
      let processedData = data;
      let compressed = false;
      let size = this.calculateSize(data);

      // Compress large data if enabled
      if (this.config.compressionEnabled && size > 1024) { // Compress items > 1KB
        const compressionResult = await this.compressData(data);
        if (compressionResult.success && compressionResult.data) {
          processedData = compressionResult.data;
          compressed = true;
          size = this.calculateSize(processedData);
        }
      }

      const storageItem: StorageItem = {
        id: key,
        data: processedData,
        timestamp,
        size,
        compressed,
        type,
        ...(expiresIn ? { expiresAt: timestamp + expiresIn } : {})
      };

      // Check storage space
      const spaceCheck = await this.checkStorageSpace(size);
      if (!spaceCheck.success) {
        // Try cleanup and retry
        await this.performCleanup();
        const retryCheck = await this.checkStorageSpace(size);
        if (!retryCheck.success) {
          return {
            success: false,
            error: 'Insufficient storage space'
          };
        }
      }

      // Store in IndexedDB or localStorage
      if (this.db) {
        await this.storeInIndexedDB(storageItem);
      } else {
        await this.storeInLocalStorage(key, storageItem);
      }

      // Track operation for deduplication
      this.pendingOperations.delete(key);

      return {
        success: true,
        compressed
      };

    } catch (error) {
      console.error('Failed to store data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Retrieve data with automatic decompression
   */
  async retrieve(key: string): Promise<StorageResult> {
    try {
      await this.ensureInitialized();

      // Check if operation is already pending
      if (this.pendingOperations.has(key)) {
        return await this.pendingOperations.get(key);
      }

      const operation = this.performRetrieve(key);
      this.pendingOperations.set(key, operation);

      const result = await operation;
      this.pendingOperations.delete(key);

      return result;

    } catch (error) {
      console.error('Failed to retrieve data:', error);
      this.pendingOperations.delete(key);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove data from storage
   */
  async remove(key: string): Promise<StorageResult> {
    try {
      await this.ensureInitialized();

      if (this.db) {
        await this.removeFromIndexedDB(key);
      } else {
        localStorage.removeItem(`feral_friends_${key}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to remove data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all data of specific type or all data
   */
  async clear(type?: StorageItem['type']): Promise<StorageResult> {
    try {
      await this.ensureInitialized();

      if (this.db) {
        const transaction = this.db.transaction(['storage'], 'readwrite');
        const store = transaction.objectStore('storage');

        if (type) {
          // Clear specific type
          const index = store.index('type');
          const request = index.openCursor(IDBKeyRange.only(type));
          
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            }
          };

          await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
          });
        } else {
          // Clear all data
          await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve(true);
            clearRequest.onerror = () => reject(clearRequest.error);
          });
        }
      } else {
        // Clear localStorage
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('feral_friends_')
        );
        keys.forEach(key => localStorage.removeItem(key));
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to clear storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      await this.ensureInitialized();

      let totalSize = 0;
      let itemCount = 0;
      const typeBreakdown: Record<string, { count: number; size: number }> = {};
      let compressedSize = 0;
      let uncompressedSize = 0;

      if (this.db) {
        const transaction = this.db.transaction(['storage'], 'readonly');
        const store = transaction.objectStore('storage');
        const request = store.getAll();

        const items: StorageItem[] = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        items.forEach(item => {
          totalSize += item.size;
          itemCount++;

          if (!typeBreakdown[item.type]) {
            typeBreakdown[item.type] = { count: 0, size: 0 };
          }
          typeBreakdown[item.type]!.count++;
          typeBreakdown[item.type]!.size += item.size;

          if (item.compressed) {
            compressedSize += item.size;
          } else {
            uncompressedSize += item.size;
          }
        });
      } else {
        // Calculate localStorage stats
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('feral_friends_')
        );
        
        keys.forEach(key => {
          const size = localStorage.getItem(key)?.length || 0;
          totalSize += size;
          itemCount++;
        });
      }

      const compressionRatio = compressedSize > 0 ? 
        (compressedSize + uncompressedSize) / compressedSize : 1;

      // Estimate available space (conservative)
      const estimatedQuota = 50 * 1024 * 1024; // 50MB estimate
      const availableSpace = Math.max(0, estimatedQuota - totalSize);

      return {
        totalSize,
        itemCount,
        typeBreakdown,
        compressionRatio,
        availableSpace,
        lastCleanup: parseInt(localStorage.getItem('feral_friends_last_cleanup') || '0')
      };

    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalSize: 0,
        itemCount: 0,
        typeBreakdown: {},
        compressionRatio: 1,
        availableSpace: 0,
        lastCleanup: 0
      };
    }
  }

  /**
   * Perform storage cleanup
   */
  async performCleanup(): Promise<StorageResult> {
    try {
      await this.ensureInitialized();

      const stats = await this.getStats();
      const sizeMB = stats.totalSize / (1024 * 1024);

      if (sizeMB < this.config.cleanupThreshold) {
        return { success: true, data: { cleaned: 0, reason: 'threshold_not_met' } };
      }

      let cleaned = 0;
      const now = Date.now();

      if (this.db) {
        const transaction = this.db.transaction(['storage'], 'readwrite');
        const store = transaction.objectStore('storage');
        const request = store.getAll();

        const items: StorageItem[] = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        // Sort by priority: expired first, then temporary, then oldest
        const toDelete = items
          .filter(item => {
            if (item.expiresAt && item.expiresAt < now) return true;
            if (item.type === 'temporary') return true;
            if (item.type === 'cache' && (now - item.timestamp) > 7 * 24 * 60 * 60 * 1000) return true; // 7 days
            return false;
          })
          .sort((a, b) => {
            if (a.expiresAt && b.expiresAt) return a.expiresAt - b.expiresAt;
            if (a.type === 'temporary' && b.type !== 'temporary') return -1;
            if (b.type === 'temporary' && a.type !== 'temporary') return 1;
            return a.timestamp - b.timestamp;
          });

        // Delete items until we're under threshold
        for (const item of toDelete) {
          const deleteTransaction = this.db.transaction(['storage'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('storage');
          await new Promise((resolve, reject) => {
            const deleteRequest = deleteStore.delete(item.id);
            deleteRequest.onsuccess = () => resolve(true);
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });

          cleaned++;
          const newStats = await this.getStats();
          if (newStats.totalSize / (1024 * 1024) < this.config.cleanupThreshold * 0.8) {
            break;
          }
        }
      }

      // Update last cleanup time
      localStorage.setItem('feral_friends_last_cleanup', now.toString());

      return { 
        success: true, 
        data: { cleaned, sizeBefore: sizeMB, sizeAfter: (await this.getStats()).totalSize / (1024 * 1024) }
      };

    } catch (error) {
      console.error('Failed to perform cleanup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      const success = await this.initializeStorage();
      if (!success) {
        throw new Error('Storage initialization failed');
      }
    }
  }

  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create storage object store
        if (!db.objectStoreNames.contains('storage')) {
          const store = db.createObjectStore('storage', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  private async initializeCompressionWorker(): Promise<void> {
    try {
      // Simple inline worker for compression
      const workerScript = `
        self.onmessage = function(e) {
          const { id, action, data } = e.data;
          
          try {
            if (action === 'compress') {
              const compressed = btoa(JSON.stringify(data));
              self.postMessage({ id, success: true, data: compressed });
            } else if (action === 'decompress') {
              const decompressed = JSON.parse(atob(data));
              self.postMessage({ id, success: true, data: decompressed });
            }
          } catch (error) {
            self.postMessage({ id, success: false, error: error.message });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));

    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
      this.compressionWorker = null;
    }
  }

  private async compressData(data: any): Promise<StorageResult> {
    try {
      if (this.compressionWorker) {
        return await this.compressWithWorker(data);
      } else {
        return await this.compressSync(data);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Compression failed'
      };
    }
  }

  private async compressWithWorker(data: any): Promise<StorageResult> {
    return new Promise((resolve) => {
      const id = Math.random().toString(36);
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Compression timeout' });
      }, 5000);

      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          clearTimeout(timeout);
          this.compressionWorker?.removeEventListener('message', handler);
          resolve({
            success: event.data.success,
            data: event.data.data,
            error: event.data.error
          });
        }
      };

      this.compressionWorker?.addEventListener('message', handler);
      this.compressionWorker?.postMessage({ id, action: 'compress', data });
    });
  }

  private async compressSync(data: any): Promise<StorageResult> {
    try {
      const compressed = btoa(JSON.stringify(data));
      return { success: true, data: compressed };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync compression failed'
      };
    }
  }

  private async decompressData(data: string): Promise<StorageResult> {
    try {
      if (this.compressionWorker) {
        return await this.decompressWithWorker(data);
      } else {
        return await this.decompressSync(data);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decompression failed'
      };
    }
  }

  private async decompressWithWorker(data: string): Promise<StorageResult> {
    return new Promise((resolve) => {
      const id = Math.random().toString(36);
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Decompression timeout' });
      }, 5000);

      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          clearTimeout(timeout);
          this.compressionWorker?.removeEventListener('message', handler);
          resolve({
            success: event.data.success,
            data: event.data.data,
            error: event.data.error
          });
        }
      };

      this.compressionWorker?.addEventListener('message', handler);
      this.compressionWorker?.postMessage({ id, action: 'decompress', data });
    });
  }

  private async decompressSync(data: string): Promise<StorageResult> {
    try {
      const decompressed = JSON.parse(atob(data));
      return { success: true, data: decompressed };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync decompression failed'
      };
    }
  }

  private async performRetrieve(key: string): Promise<StorageResult> {
    let storageItem: StorageItem | null = null;

    if (this.db) {
      storageItem = await this.retrieveFromIndexedDB(key);
    } else {
      storageItem = await this.retrieveFromLocalStorage(key);
    }

    if (!storageItem) {
      return { success: false, error: 'Item not found' };
    }

    // Check expiration
    if (storageItem.expiresAt && storageItem.expiresAt < Date.now()) {
      await this.remove(key);
      return { success: false, error: 'Item expired' };
    }

    // Decompress if necessary
    let data = storageItem.data;
    if (storageItem.compressed) {
      const decompressResult = await this.decompressData(data);
      if (!decompressResult.success) {
        return decompressResult;
      }
      data = decompressResult.data;
    }

    return {
      success: true,
      data,
      fromCache: true,
      compressed: storageItem.compressed
    };
  }

  private async storeInIndexedDB(item: StorageItem): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not available');

    const transaction = this.db.transaction(['storage'], 'readwrite');
    const store = transaction.objectStore('storage');

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async retrieveFromIndexedDB(key: string): Promise<StorageItem | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['storage'], 'readonly');
    const store = transaction.objectStore('storage');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not available');

    const transaction = this.db.transaction(['storage'], 'readwrite');
    const store = transaction.objectStore('storage');

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async storeInLocalStorage(key: string, item: StorageItem): Promise<void> {
    try {
      const serialized = JSON.stringify(item);
      localStorage.setItem(`feral_friends_${key}`, serialized);
    } catch (error) {
      throw new Error(`Failed to store in localStorage: ${error}`);
    }
  }

  private async retrieveFromLocalStorage(key: string): Promise<StorageItem | null> {
    try {
      const stored = localStorage.getItem(`feral_friends_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve from localStorage:', error);
      return null;
    }
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private async checkStorageSpace(requiredSize: number): Promise<StorageResult> {
    try {
      const stats = await this.getStats();
      const requiredMB = requiredSize / (1024 * 1024);
      const availableMB = stats.availableSpace / (1024 * 1024);

      if (availableMB < requiredMB) {
        return {
          success: false,
          error: `Insufficient space: need ${requiredMB.toFixed(2)}MB, have ${availableMB.toFixed(2)}MB`
        };
      }

      return { success: true };
    } catch (error) {
      return { success: true }; // Assume space is available if check fails
    }
  }

  private scheduleAutoCleanup(): void {
    // Run cleanup every hour
    setInterval(async () => {
      const stats = await this.getStats();
      const sizeMB = stats.totalSize / (1024 * 1024);
      
      if (sizeMB > this.config.cleanupThreshold) {
        console.log('Auto-cleanup triggered');
        await this.performCleanup();
      }
    }, 60 * 60 * 1000); // 1 hour
  }
}

// Create and export singleton instance
export const offlineStorage = new OfflineStorage();