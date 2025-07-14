import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, CloudOff, Cloud, RefreshCw, AlertTriangle } from 'react-feather';
import Button from './Button';
import { syncManager } from '../../services/SyncManager';

interface OfflineStatusProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface ConnectionStatus {
  isOnline: boolean;
  lastOnline: Date | null;
  pendingSyncCount: number;
  syncInProgress: boolean;
  lastSyncAttempt: Date | null;
  lastSuccessfulSync: Date | null;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({
  className = '',
  showDetails = false,
  position = 'top-right'
}) => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : null,
    pendingSyncCount: 0,
    syncInProgress: false,
    lastSyncAttempt: null,
    lastSuccessfulSync: null
  });

  const [showDetailedView, setShowDetailedView] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    setStatus(prev => ({
      ...prev,
      isOnline,
      lastOnline: isOnline ? new Date() : prev.lastOnline
    }));

    // Show brief notification when coming back online
    if (isOnline && !status.isOnline) {
      setJustCameOnline(true);
      setTimeout(() => setJustCameOnline(false), 3000);
      
      // Trigger sync when coming back online
      handleManualSync();
    }
  }, [status.isOnline]);

  // Get sync status from SyncManager
  const updateSyncStatus = useCallback(async () => {
    try {
      const syncStatus = syncManager.getSyncStatus();
      
      setStatus(prev => ({
        ...prev,
        pendingSyncCount: syncStatus.pendingChanges,
        syncInProgress: syncStatus.isSyncing,
        lastSyncAttempt: syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime) : null,
        lastSuccessfulSync: syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime) : null
      }));
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  }, []);

  // Manual sync trigger
  const handleManualSync = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }

    try {
      setStatus(prev => ({ ...prev, syncInProgress: true }));
      await syncManager.forceSyncNow();
      await updateSyncStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [updateSyncStatus]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update sync status periodically
    const syncInterval = setInterval(updateSyncStatus, 5000);

    // Initial sync status check
    updateSyncStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(syncInterval);
    };
  }, [updateOnlineStatus, updateSyncStatus]);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Status color and icon
  const getStatusDisplay = () => {
    if (status.syncInProgress) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200',
        text: 'Syncing...',
        pulse: true
      };
    }

    if (!status.isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        text: 'Offline',
        pulse: false
      };
    }

    if (status.pendingSyncCount > 0) {
      return {
        icon: CloudOff,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 border-amber-200',
        text: `${status.pendingSyncCount} pending`,
        pulse: false
      };
    }

    return {
      icon: status.isOnline ? Cloud : WifiOff,
      color: 'text-green-500',
      bgColor: 'bg-green-50 border-green-200',
      text: 'Online',
      pulse: false
    };
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // Format time for display
  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Simple indicator (default view)
  if (!showDetails && !showDetailedView) {
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
        onClick={() => setShowDetailedView(true)}
      >
        <div className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border-2 shadow-lg cursor-pointer
          transition-all duration-300 hover:scale-105
          ${statusDisplay.bgColor}
        `}>
          <StatusIcon 
            size={16} 
            className={`${statusDisplay.color} ${statusDisplay.pulse ? 'animate-spin' : ''}`} 
          />
          {justCameOnline && (
            <span className="text-xs font-medium text-green-600">Back online!</span>
          )}
        </div>
      </div>
    );
  }

  // Detailed view
  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className={`
        bg-white rounded-lg border-2 shadow-xl p-4 min-w-64 max-w-sm
        ${statusDisplay.bgColor}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <StatusIcon 
              size={20} 
              className={`${statusDisplay.color} ${statusDisplay.pulse ? 'animate-spin' : ''}`} 
            />
            <span className="font-semibold text-gray-800">
              Connection Status
            </span>
          </div>
          <button
            onClick={() => setShowDetailedView(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Status Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
          </div>

          {!status.isOnline && status.lastOnline && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last online:</span>
              <span className="text-sm text-gray-800">
                {formatTime(status.lastOnline)}
              </span>
            </div>
          )}

          {status.pendingSyncCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending changes:</span>
              <span className="text-sm font-medium text-amber-600">
                {status.pendingSyncCount}
              </span>
            </div>
          )}

          {status.lastSuccessfulSync && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last sync:</span>
              <span className="text-sm text-gray-800">
                {formatTime(status.lastSuccessfulSync)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          {status.isOnline && status.pendingSyncCount > 0 && (
            <Button
              onClick={handleManualSync}
              disabled={status.syncInProgress}
              size="sm"
              className="w-full mb-2"
            >
              {status.syncInProgress ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Cloud size={14} className="mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          )}

          {!status.isOnline && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <p className="font-medium mb-1">You're offline</p>
                  <p>Changes will sync when connection is restored.</p>
                </div>
              </div>
            </div>
          )}

          {status.isOnline && status.pendingSyncCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Cloud size={16} className="text-green-500" />
                <span className="text-xs text-green-700 font-medium">
                  All changes synced
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineStatus;