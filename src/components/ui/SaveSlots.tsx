// Save Slots Component
// Multiple save slot system with previews, cloud sync, and save management

import React, { useState, useEffect, useCallback } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { 
  Save, 
  Download, 
  Trash2, 
  Clock, 
  User, 
  MapPin, 
  Users, 
  Award, 
  Cloud,
  CloudOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus
} from 'react-feather';
import { Button, Card, Modal } from '../ui';
import { saveManager, ComprehensiveGameSave } from '../../services/SaveManager';
import { cloudSaveService, SyncResult } from '../../services/CloudSave';
import { useSound } from '../../hooks/useAudio';

export interface SaveSlotsProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSave?: (slotId: number, saveData: ComprehensiveGameSave) => void;
  onNewGame?: () => void;
  currentGameState?: Partial<ComprehensiveGameSave>;
  className?: string;
}

interface SaveSlotInfo {
  slotId: number;
  exists: boolean;
  playerName?: string;
  level?: number;
  playTime?: number;
  lastSaved?: number;
  saveSize?: number;
  cloudSynced?: boolean;
  cloudConflict?: boolean;
  preview?: {
    location: string;
    companionsCount: number;
    achievementsCount: number;
    currentMap: string;
  };
}

const SaveSlots: React.FC<SaveSlotsProps> = ({
  isOpen,
  onClose,
  onLoadSave,
  onNewGame,
  currentGameState,
  className = ''
}) => {
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [cloudSlots, setCloudSlots] = useState<SaveSlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showCloudAuth, setShowCloudAuth] = useState(false);
  const [showSyncResult, setShowSyncResult] = useState<SyncResult | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  const { playSound } = useSound();

  // Animation for modal
  const modalAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1) translateY(0%)' : 'scale(0.95) translateY(5%)',
    config: { tension: 300, friction: 30 }
  });

  // Load save slot information
  const loadSaveSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      const localSlots = await saveManager.getSaveSlotInfo();
      setSaveSlots(localSlots.map(slot => ({
        ...slot,
        cloudSynced: false,
        cloudConflict: false
      })));

      // Load cloud slots if authenticated
      if (cloudSaveService.isUserAuthenticated()) {
        const cloudSlotInfo = await cloudSaveService.getCloudSaveSlots();
        setCloudSlots(cloudSlotInfo.map(slot => ({
          ...slot,
          cloudSynced: true,
          cloudConflict: false
        })));
      }
    } catch (error) {
      console.error('Failed to load save slots:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up cloud save callbacks
  useEffect(() => {
    cloudSaveService.setCallbacks({
      onSyncProgress: (progress) => {
        setSyncProgress(progress);
      },
      onSyncComplete: (result) => {
        setShowSyncResult(result);
        setSyncProgress(null);
        setIsSyncing(false);
        loadSaveSlots(); // Refresh slots after sync
      },
      onError: (error) => {
        console.error('Cloud save error:', error);
        setIsSyncing(false);
        setSyncProgress(null);
      }
    });
  }, [loadSaveSlots]);

  // Load slots when component opens
  useEffect(() => {
    if (isOpen) {
      loadSaveSlots();
    }
  }, [isOpen, loadSaveSlots]);

  // Save game to selected slot
  const handleSaveGame = useCallback(async (slotId: number) => {
    if (!currentGameState) return;

    setIsLoading(true);
    playSound('ui_interaction');

    try {
      const result = await saveManager.saveGameState(currentGameState, slotId);
      
      if (result.success) {
        playSound('success');
        
        // Upload to cloud if authenticated
        if (cloudSaveService.isUserAuthenticated()) {
          const uploadResult = await cloudSaveService.uploadSave(currentGameState as ComprehensiveGameSave, slotId);
          if (!uploadResult.success) {
            console.warn('Cloud upload failed:', uploadResult.message);
          }
        }
        
        // Refresh slots
        await loadSaveSlots();
      } else {
        playSound('error');
        console.error('Save failed:', result.message);
      }
    } catch (error) {
      playSound('error');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentGameState, loadSaveSlots, playSound]);

  // Load game from selected slot
  const handleLoadGame = useCallback(async (slotId: number) => {
    setIsLoading(true);
    playSound('ui_interaction');

    try {
      const result = await saveManager.loadGameState(slotId);
      
      if (result.success && result.data) {
        playSound('success');
        onLoadSave?.(slotId, result.data);
        onClose();
      } else {
        playSound('error');
        console.error('Load failed:', result.message);
      }
    } catch (error) {
      playSound('error');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onLoadSave, onClose, playSound]);

  // Delete save from selected slot
  const handleDeleteSave = useCallback(async (slotId: number) => {
    setIsLoading(true);
    playSound('ui_interaction');

    try {
      const result = await saveManager.deleteSaveData(slotId);
      
      if (result.success) {
        playSound('success');
        
        // Delete from cloud if authenticated
        if (cloudSaveService.isUserAuthenticated()) {
          await cloudSaveService.deleteCloudSave(slotId);
        }
        
        // Refresh slots
        await loadSaveSlots();
      } else {
        playSound('error');
        console.error('Delete failed:', result.message);
      }
    } catch (error) {
      playSound('error');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  }, [loadSaveSlots, playSound]);

  // Sync with cloud
  const handleCloudSync = useCallback(async () => {
    if (!cloudSaveService.isUserAuthenticated()) {
      setShowCloudAuth(true);
      return;
    }

    setIsSyncing(true);
    playSound('ui_interaction');

    try {
      await cloudSaveService.synchronizeSaves();
    } catch (error) {
      playSound('error');
      console.error('Sync error:', error);
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [playSound]);

  // Format play time
  const formatPlayTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format save size
  const formatSaveSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render save slot
  const renderSaveSlot = (slot: SaveSlotInfo, isCloudSlot: boolean = false) => {
    const isEmpty = !slot.exists;
    const isSelected = selectedSlot === slot.slotId;

    return (
      <Card
        key={`${isCloudSlot ? 'cloud' : 'local'}-${slot.slotId}`}
        className={`p-4 cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
        } ${isEmpty ? 'border-dashed border-gray-300' : 'border-solid'}`}
        onClick={() => setSelectedSlot(slot.slotId)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isEmpty ? 'bg-gray-300' : isCloudSlot ? 'bg-blue-500' : 'bg-green-500'
            }`} />
            <span className="font-medium text-gray-800">
              {isCloudSlot ? 'Cloud' : 'Local'} Slot {slot.slotId}
            </span>
            {slot.cloudSynced && <Cloud className="w-4 h-4 text-blue-500" />}
            {slot.cloudConflict && <AlertTriangle className="w-4 h-4 text-orange-500" />}
          </div>
          
          <div className="flex space-x-1">
            {!isEmpty && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadGame(slot.slotId);
                  }}
                  disabled={isLoading}
                  className="p-1"
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(slot.slotId);
                  }}
                  disabled={isLoading}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {isEmpty && currentGameState && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveGame(slot.slotId);
                }}
                disabled={isLoading}
                className="p-1"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isEmpty ? (
          <div className="text-center py-8 text-gray-500">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Empty Slot</p>
            <p className="text-xs">Click to save current game</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Player Info */}
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">{slot.playerName}</p>
                <p className="text-sm text-gray-600">Level {slot.level}</p>
              </div>
            </div>

            {/* Game Progress */}
            {slot.preview && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{slot.preview.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{slot.preview.companionsCount} companions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{slot.preview.achievementsCount} achievements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{formatPlayTime(slot.playTime || 0)}</span>
                </div>
              </div>
            )}

            {/* Save Info */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
              <span>
                {slot.lastSaved ? new Date(slot.lastSaved).toLocaleDateString() : 'Unknown'}
              </span>
              <span>{formatSaveSize(slot.saveSize || 0)}</span>
            </div>
          </div>
        )}
      </Card>
    );
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
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Save Slots</h2>
              <p className="text-gray-600">Manage your game saves and cloud sync</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Cloud Sync Button */}
              <Button
                variant="outline"
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="flex items-center space-x-2"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : cloudSaveService.isUserAuthenticated() ? (
                  <Cloud className="w-4 h-4" />
                ) : (
                  <CloudOff className="w-4 h-4" />
                )}
                <span>
                  {isSyncing ? 'Syncing...' : 
                   cloudSaveService.isUserAuthenticated() ? 'Sync' : 'Sign In'}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-2"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Sync Progress */}
          {syncProgress && (
            <div className="p-4 bg-blue-50 border-b">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">{syncProgress.message}</p>
                  <div className="mt-1 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading save slots...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Local Saves */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                    <Save className="w-5 h-5" />
                    <span>Local Saves</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {saveSlots.map(slot => renderSaveSlot(slot, false))}
                  </div>
                </div>

                {/* Cloud Saves */}
                {cloudSaveService.isUserAuthenticated() && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                      <Cloud className="w-5 h-5" />
                      <span>Cloud Saves</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cloudSlots.map(slot => renderSaveSlot(slot, true))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={onNewGame}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Game</span>
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </animated.div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Save"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                This action cannot be undone
              </p>
              <p className="text-xs text-red-700">
                Save data will be permanently deleted from both local and cloud storage
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => showDeleteConfirm && handleDeleteSave(showDeleteConfirm)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Save'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sync Result Modal */}
      {showSyncResult && (
        <Modal
          isOpen={true}
          onClose={() => setShowSyncResult(null)}
          title="Sync Complete"
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className={`flex items-center space-x-3 p-3 rounded-lg ${
              showSyncResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {showSyncResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  showSyncResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {showSyncResult.message}
                </p>
                {showSyncResult.success && (
                  <p className="text-xs text-green-700">
                    {showSyncResult.uploaded} uploaded, {showSyncResult.downloaded} downloaded
                  </p>
                )}
              </div>
            </div>

            {showSyncResult.conflicts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">Conflicts Resolved:</p>
                {showSyncResult.conflicts.map((conflict, index) => (
                  <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                    Slot {conflict.slotId}: {conflict.reason} - Used {conflict.resolution} version
                  </div>
                ))}
              </div>
            )}

            {showSyncResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-800">Errors:</p>
                {showSyncResult.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-600 p-2 bg-red-50 rounded">
                    {error}
                  </div>
                ))}
              </div>
            )}
            
            <Button
              onClick={() => setShowSyncResult(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SaveSlots;