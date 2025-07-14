// Service Worker Manager
// Handles service worker registration, updates, and communication

import React from 'react';

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  isWaiting: boolean;
  updateAvailable: boolean;
  registrationTime: Date | null;
}

class ServiceWorkerManagerService {
  private registration: ServiceWorkerRegistration | null = null;
  private statusListeners: ((status: ServiceWorkerStatus) => void)[] = [];
  private updateListeners: (() => void)[] = [];

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('SW Manager: Service workers not supported');
      this.notifyStatusListeners();
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });

      console.log('SW Manager: Service worker registered:', this.registration.scope);

      // Set up event listeners
      this.setupEventListeners();

      // Check for updates immediately
      this.checkForUpdates();

      // Check for updates periodically
      setInterval(() => this.checkForUpdates(), 60000); // Every minute

      this.notifyStatusListeners();
    } catch (error) {
      console.error('SW Manager: Failed to register service worker:', error);
      this.notifyStatusListeners();
    }
  }

  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for service worker updates
    this.registration.addEventListener('updatefound', () => {
      console.log('SW Manager: Update found');
      
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('SW Manager: New service worker installed, update available');
            this.notifyUpdateListeners();
          }
          this.notifyStatusListeners();
        });
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('SW Manager: Controller changed');
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('SW Manager: Message from service worker:', event.data);
      
      if (event.data.type === 'CACHE_UPDATED') {
        console.log('SW Manager: Cache updated');
      } else if (event.data.type === 'BACKGROUND_SYNC_SUCCESS') {
        console.log('SW Manager: Background sync completed');
      }
    });
  }

  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return this.getStatus().updateAvailable;
    } catch (error) {
      console.error('SW Manager: Failed to check for updates:', error);
      return false;
    }
  }

  public async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      throw new Error('No service worker waiting');
    }

    // Send skip waiting message
    this.registration.waiting.postMessage({ action: 'skipWaiting' });
  }

  public async clearCache(): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve();
        } else {
          reject(new Error(event.data.error));
        }
      };

      this.registration!.active!.postMessage(
        { action: 'clearCache' },
        [messageChannel.port2]
      );
    });
  }

  public async getCacheInfo(): Promise<Record<string, any>> {
    if (!this.registration?.active) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage(
        { action: 'getCacheInfo' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
  }

  public getStatus(): ServiceWorkerStatus {
    const isSupported = 'serviceWorker' in navigator;
    const isRegistered = this.registration !== null;
    const isActive = this.registration?.active !== null;
    const isWaiting = this.registration?.waiting !== null;
    const updateAvailable = isWaiting && navigator.serviceWorker.controller !== null;

    return {
      isSupported,
      isRegistered,
      isActive,
      isWaiting,
      updateAvailable,
      registrationTime: this.registration ? new Date() : null
    };
  }

  public onStatusChange(callback: (status: ServiceWorkerStatus) => void): () => void {
    this.statusListeners.push(callback);
    
    // Immediately call with current status
    callback(this.getStatus());
    
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  public onUpdateAvailable(callback: () => void): () => void {
    this.updateListeners.push(callback);
    
    return () => {
      const index = this.updateListeners.indexOf(callback);
      if (index > -1) {
        this.updateListeners.splice(index, 1);
      }
    };
  }

  private notifyStatusListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(callback => callback(status));
  }

  private notifyUpdateListeners(): void {
    this.updateListeners.forEach(callback => callback());
  }

  // Background sync registration
  public async registerBackgroundSync(tag: string = 'background-sync'): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    if ('sync' in this.registration) {
      try {
        await (this.registration as any).sync.register(tag);
        console.log('SW Manager: Background sync registered');
      } catch (error) {
        console.error('SW Manager: Failed to register background sync:', error);
        throw error;
      }
    } else {
      console.warn('SW Manager: Background sync not supported');
    }
  }

  // Push notifications setup
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    try {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // For demo purposes - in production, get this from your server
      const applicationServerKey = 'your-vapid-public-key';
      
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(applicationServerKey)
      });

      console.log('SW Manager: Push subscription created');
      return subscription;
    } catch (error) {
      console.error('SW Manager: Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Unregister service worker (for debugging)
  public async unregister(): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registered');
    }

    await this.registration.unregister();
    this.registration = null;
    console.log('SW Manager: Service worker unregistered');
    this.notifyStatusListeners();
  }
}

// Singleton instance
export const ServiceWorkerManager = new ServiceWorkerManagerService();

// React hook for service worker
export function useServiceWorker() {
  const [status, setStatus] = React.useState<ServiceWorkerStatus>(() => 
    ServiceWorkerManager.getStatus()
  );
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    const unsubscribeStatus = ServiceWorkerManager.onStatusChange(setStatus);
    const unsubscribeUpdate = ServiceWorkerManager.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUpdate();
    };
  }, []);

  const applyUpdate = React.useCallback(async () => {
    try {
      await ServiceWorkerManager.skipWaiting();
      setUpdateAvailable(false);
    } catch (error) {
      console.error('Failed to apply update:', error);
    }
  }, []);

  const checkForUpdates = React.useCallback(() => {
    return ServiceWorkerManager.checkForUpdates();
  }, []);

  const clearCache = React.useCallback(() => {
    return ServiceWorkerManager.clearCache();
  }, []);

  return {
    status,
    updateAvailable,
    applyUpdate,
    checkForUpdates,
    clearCache,
    getCacheInfo: ServiceWorkerManager.getCacheInfo,
    registerBackgroundSync: ServiceWorkerManager.registerBackgroundSync
  };
}

export default ServiceWorkerManager;