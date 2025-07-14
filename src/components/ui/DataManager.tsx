// Data Manager UI Component
// Shows storage usage, sync status, data export/import options, and clear cache functionality

import React, { useState, useEffect, useCallback } from 'react';
import { animated, useSpring } from '@react-spring/web';
import {
  Database,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart,
  Settings,
  Wifi,
  WifiOff,
  Cloud,
  Smartphone
} from 'react-feather';
import { Button, Card, Modal } from '../ui';
import { offlineStorage, StorageStats } from '../../services/OfflineStorage';
import { syncManager, SyncStatus } from '../../services/SyncManager';
import { performanceManager, PerformanceMetrics, OptimizationSuggestion } from '../../services/PerformanceManager';
import { useSound } from '../../hooks/useAudio';

export interface DataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface TabType {
  id: 'storage' | 'sync' | 'performance' | 'settings';
  label: string;
  icon: React.ComponentType<any>;
}

const DataManager: React.FC<DataManagerProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<TabType['id']>('storage');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [exportData, setExportData] = useState<string | null>(null);

  const { playSound } = useSound();

  const tabs: TabType[] = [
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'sync', label: 'Sync', icon: Cloud },
    { id: 'performance', label: 'Performance', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Animation for modal
  const modalAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1) translateY(0%)' : 'scale(0.95) translateY(5%)',
    config: { tension: 300, friction: 30 }
  });

  // Load data when component opens
  const loadData = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      const [storage, sync, performance, opts] = await Promise.all([
        offlineStorage.getStats(),
        Promise.resolve(syncManager.getSyncStatus()),
        Promise.resolve(performanceManager.getMetrics()),
        Promise.resolve(performanceManager.getOptimizationSuggestions())
      ]);

      setStorageStats(storage);
      setSyncStatus(sync);
      setPerformanceMetrics(performance);
      setSuggestions(opts);

    } catch (error) {
      console.error('Failed to load data manager info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadData();
    
    // Set up periodic refresh
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle clear cache
  const handleClearCache = useCallback(async (type: string) => {
    setIsLoading(true);
    playSound('ui_interaction');

    try {
      let result;
      switch (type) {
        case 'all':
          result = await offlineStorage.clear();
          break;
        case 'temporary':
          result = await offlineStorage.clear('temporary');
          break;
        case 'cache':
          result = await offlineStorage.clear('cache');
          break;
        default:
          return;
      }

      if (result.success) {
        playSound('success');
        await loadData();
      } else {
        playSound('error');
        console.error('Clear cache failed:', result.error);
      }
    } catch (error) {
      playSound('error');
      console.error('Clear cache error:', error);
    } finally {
      setIsLoading(false);
      setShowClearConfirm(null);
    }
  }, [loadData, playSound]);

  // Handle data export
  const handleExport = useCallback(async () => {
    setIsLoading(true);
    playSound('ui_interaction');

    try {
      // Export storage stats and settings
      const exportObj = {
        timestamp: Date.now(),
        storageStats,
        syncStatus,
        performanceMetrics,
        version: '1.0'
      };

      const exportString = JSON.stringify(exportObj, null, 2);
      setExportData(exportString);
      playSound('success');

    } catch (error) {
      playSound('error');
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageStats, syncStatus, performanceMetrics, playSound]);

  // Handle sync operations
  const handleSync = useCallback(async () => {
    setIsLoading(true);
    playSound('ui_interaction');

    try {
      await syncManager.forceSyncNow();
      playSound('success');
      await loadData();
    } catch (error) {
      playSound('error');
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadData, playSound]);

  // Handle optimization application
  const handleApplyOptimization = useCallback(async (suggestion: OptimizationSuggestion) => {
    setIsLoading(true);
    playSound('ui_interaction');

    try {
      const success = await performanceManager.applyOptimization(suggestion);
      if (success) {
        playSound('success');
        await loadData();
      } else {
        playSound('error');
      }
    } catch (error) {
      playSound('error');
      console.error('Optimization failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadData, playSound]);

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  // Render storage tab
  const renderStorageTab = () => (
    <div className="space-y-6">
      {/* Storage Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Storage Usage
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {storageStats && (
          <div className="space-y-4">
            {/* Total Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total Storage</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(storageStats.totalSize)} / {formatBytes(storageStats.availableSpace + storageStats.totalSize)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (storageStats.totalSize / (storageStats.availableSpace + storageStats.totalSize)) * 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* Type Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(storageStats.typeBreakdown).map(([type, data]) => (
                <div key={type} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <span className="text-xs text-gray-600">{data.count} items</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{formatBytes(data.size)}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm('temporary')}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Temp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm('cache')}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  // Render sync tab
  const renderSyncTab = () => (
    <div className="space-y-6">
      {/* Sync Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Cloud className="w-5 h-5 mr-2" />
            Sync Status
          </h3>
          <div className="flex items-center space-x-2">
            {syncStatus?.isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {syncStatus?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {syncStatus && (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connection</span>
                  {syncStatus.isConnected ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {syncStatus.isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Changes</span>
                  <span className="text-sm font-bold">{syncStatus.pendingChanges}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Changes waiting to sync
                </p>
              </div>
            </div>

            {/* Last Sync */}
            {syncStatus.lastSyncTime > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Sync</span>
                  <span className="text-xs text-gray-600">
                    {new Date(syncStatus.lastSyncTime).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Network: {syncStatus.networkQuality}
                </p>
              </div>
            )}

            {/* Current Session */}
            {syncStatus.currentSession && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Syncing...</span>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {syncStatus.currentSession.operations.length} operations in progress
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button
                onClick={handleSync}
                disabled={isLoading || syncStatus.isSyncing || !syncStatus.isConnected}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Force Sync
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  // Render performance tab
  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BarChart className="w-5 h-5 mr-2" />
            Performance
          </h3>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Mobile Optimized</span>
          </div>
        </div>

        {performanceMetrics && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm font-bold">
                    {Math.round(performanceMetrics.memoryUsage.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      performanceMetrics.memoryUsage.percentage > 80 ? 'bg-red-500' :
                      performanceMetrics.memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${performanceMetrics.memoryUsage.percentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Frame Rate</span>
                  <span className="text-sm font-bold">{performanceMetrics.frameRate.current} FPS</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Avg: {performanceMetrics.frameRate.average} FPS
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <span className="text-sm font-bold">
                    {formatPercentage(performanceMetrics.cacheEfficiency.hitRate)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Size: {formatBytes(performanceMetrics.cacheEfficiency.size * 1024 * 1024)}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Thermal State</span>
                  <span className={`text-sm font-bold capitalize ${
                    performanceMetrics.thermalState === 'critical' ? 'text-red-600' :
                    performanceMetrics.thermalState === 'serious' ? 'text-orange-600' :
                    performanceMetrics.thermalState === 'fair' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {performanceMetrics.thermalState}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Battery: {performanceMetrics.batteryImpact}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Optimization Suggestions</h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                suggestion.severity === 'critical' ? 'bg-red-50 border-red-500' :
                suggestion.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                suggestion.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{suggestion.message}</p>
                    <p className="text-xs text-gray-600 mt-1 capitalize">
                      {suggestion.type} • {suggestion.severity} priority
                    </p>
                  </div>
                  {suggestion.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyOptimization(suggestion)}
                      disabled={isLoading}
                    >
                      {suggestion.autoApply ? 'Auto-Applied' : 'Apply'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  // Render settings tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Data Management Settings
        </h3>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Danger Zone</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <div className="mt-3 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm('all')}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'storage':
        return renderStorageTab();
      case 'sync':
        return renderSyncTab();
      case 'performance':
        return renderPerformanceTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <animated.div 
        style={modalAnimation}
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 ${className}`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <Card className="w-full max-w-4xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Database className="w-6 h-6 mr-2" />
                Data Manager
              </h2>
              <p className="text-gray-600">Manage storage, sync, and performance</p>
            </div>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-2"
            >
              ×
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {isLoading && activeTab !== 'performance' ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading data...</p>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </Card>
      </animated.div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm !== null}
        onClose={() => setShowClearConfirm(null)}
        title="Clear Data"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                This action cannot be undone
              </p>
              <p className="text-xs text-red-700">
                {showClearConfirm === 'all' ? 'All data will be permanently deleted' :
                 showClearConfirm === 'temporary' ? 'Temporary files will be deleted' :
                 'Cache data will be deleted'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => showClearConfirm && handleClearCache(showClearConfirm)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Clearing...' : 'Clear Data'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Data Modal */}
      {exportData && (
        <Modal
          isOpen={true}
          onClose={() => setExportData(null)}
          title="Export Data"
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Copy the data below or download as a file:
            </p>
            <textarea
              value={exportData}
              readOnly
              className="w-full h-40 p-3 border rounded-lg text-xs font-mono resize-none"
              placeholder="Export data will appear here..."
            />
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(exportData);
                  playSound('success');
                }}
                className="flex-1"
              >
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setExportData(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default DataManager;