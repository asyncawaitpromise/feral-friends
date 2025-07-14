// PWA Manager Service
// Handles Progressive Web App functionality including install prompts and app-like features

import React from 'react';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

class PWAManagerService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private installListeners: ((canInstall: boolean) => void)[] = [];
  private statusListeners: ((status: PWAStatus) => void)[] = [];

  constructor() {
    this.initializePWA();
  }

  private initializePWA(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt fired');
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.notifyInstallListeners(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      this.deferredPrompt = null;
      this.notifyInstallListeners(false);
      this.notifyStatusListeners();
    });

    // Check if already running as installed PWA
    if (this.isRunningStandalone()) {
      console.log('PWA: Running in standalone mode');
    }

    // iOS-specific detection
    this.detectIOSInstallability();
  }

  public async promptInstall(): Promise<{ installed: boolean; error?: string }> {
    if (!this.deferredPrompt) {
      return { 
        installed: false, 
        error: 'Install prompt not available. Try using browser menu to install.' 
      };
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted install prompt');
        this.deferredPrompt = null;
        this.notifyInstallListeners(false);
        return { installed: true };
      } else {
        console.log('PWA: User dismissed install prompt');
        return { installed: false, error: 'User cancelled installation' };
      }
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error);
      return { 
        installed: false, 
        error: 'Failed to show install prompt' 
      };
    }
  }

  public isInstallable(): boolean {
    return this.deferredPrompt !== null || this.isIOSInstallable();
  }

  public isInstalled(): boolean {
    return this.isRunningStandalone() || 
           this.isIOSInstalled() || 
           window.matchMedia('(display-mode: standalone)').matches;
  }

  public isRunningStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true; // iOS Safari
  }

  public getPlatform(): PWAStatus['platform'] {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  public getStatus(): PWAStatus {
    return {
      isInstallable: this.isInstallable(),
      isInstalled: this.isInstalled(),
      isStandalone: this.isRunningStandalone(),
      platform: this.getPlatform()
    };
  }

  private isIOSInstallable(): boolean {
    const platform = this.getPlatform();
    return platform === 'ios' && 
           !this.isRunningStandalone() &&
           navigator.userAgent.includes('Safari');
  }

  private isIOSInstalled(): boolean {
    return (window.navigator as any).standalone === true;
  }

  private detectIOSInstallability(): void {
    if (this.isIOSInstallable()) {
      // For iOS, we can't programmatically trigger install,
      // but we can detect when it's possible
      this.notifyInstallListeners(true);
    }
  }

  public onInstallAvailable(callback: (canInstall: boolean) => void): () => void {
    this.installListeners.push(callback);
    
    // Immediately call with current state
    callback(this.isInstallable());
    
    // Return unsubscribe function
    return () => {
      const index = this.installListeners.indexOf(callback);
      if (index > -1) {
        this.installListeners.splice(index, 1);
      }
    };
  }

  public onStatusChange(callback: (status: PWAStatus) => void): () => void {
    this.statusListeners.push(callback);
    
    // Immediately call with current state
    callback(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  private notifyInstallListeners(canInstall: boolean): void {
    this.installListeners.forEach(callback => callback(canInstall));
  }

  private notifyStatusListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(callback => callback(status));
  }

  public getInstallInstructions(): { platform: string; instructions: string[] } {
    const platform = this.getPlatform();
    
    switch (platform) {
      case 'ios':
        return {
          platform: 'iOS Safari',
          instructions: [
            'Tap the Share button (square with arrow up)',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install Feral Friends'
          ]
        };
      case 'android':
        return {
          platform: 'Android Chrome',
          instructions: [
            'Tap the menu button (three dots)',
            'Select "Add to Home Screen" or "Install app"',
            'Tap "Add" or "Install" to continue'
          ]
        };
      case 'desktop':
        return {
          platform: 'Desktop Browser',
          instructions: [
            'Look for install icon in address bar',
            'Or use browser menu "Install Feral Friends"',
            'Follow prompts to install as desktop app'
          ]
        };
      default:
        return {
          platform: 'Browser',
          instructions: [
            'Installation may not be available on this browser',
            'Try using Chrome, Safari, or Edge',
            'Check browser menu for install options'
          ]
        };
    }
  }

  public hideInstallPrompt(): void {
    this.deferredPrompt = null;
    this.notifyInstallListeners(false);
  }

  public async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('PWA: Persistent storage granted:', persistent);
        return persistent;
      } catch (error) {
        console.error('PWA: Failed to request persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  public async getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (error) {
        console.error('PWA: Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }
}

// Create singleton instance
export const PWAManager = new PWAManagerService();

// React hook for PWA functionality
export function usePWA() {
  const [status, setStatus] = React.useState<PWAStatus>(() => PWAManager.getStatus());
  const [canInstall, setCanInstall] = React.useState(false);

  React.useEffect(() => {
    const unsubscribeStatus = PWAManager.onStatusChange(setStatus);
    const unsubscribeInstall = PWAManager.onInstallAvailable(setCanInstall);

    return () => {
      unsubscribeStatus();
      unsubscribeInstall();
    };
  }, []);

  const promptInstall = React.useCallback(() => {
    return PWAManager.promptInstall();
  }, []);

  const getInstallInstructions = React.useCallback(() => {
    return PWAManager.getInstallInstructions();
  }, []);

  const hidePrompt = React.useCallback(() => {
    PWAManager.hideInstallPrompt();
  }, []);

  return {
    status,
    canInstall,
    promptInstall,
    getInstallInstructions,
    hidePrompt,
    requestPersistentStorage: PWAManager.requestPersistentStorage,
    getStorageEstimate: PWAManager.getStorageEstimate
  };
}

// For non-React usage
export { PWAManager as default };