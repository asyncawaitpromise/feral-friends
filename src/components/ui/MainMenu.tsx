import React, { useState, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { 
  Play, 
  Save, 
  Settings, 
  Info, 
  Home,
  Plus,
  Clock,
  Users,
  Star,
  Trash2
} from 'react-feather';
import { useSlideIn, useFadeIn, useStagger } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import { getSaveSystem, SaveSlot } from '../../services/SaveSystem';
import Button from './Button';

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGame: () => void;
  onLoadGame: (slotId: number) => void;
  onSettings: () => void;
  onAbout: () => void;
  showHomeOption?: boolean;
  onGoHome?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  onClose,
  onNewGame,
  onLoadGame,
  onSettings,
  onAbout,
  showHomeOption = false,
  onGoHome
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'saves'>('main');
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { playMenuOpen, playMenuClose, playButtonClick } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen, 'up');
  const fadeInStyle = useFadeIn(isOpen);
  
  const mainMenuItems = [
    { id: 'new', label: 'New Game', icon: <Plus size={20} />, action: onNewGame },
    { id: 'continue', label: 'Continue', icon: <Play size={20} />, action: () => setActiveTab('saves') },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, action: onSettings },
    { id: 'about', label: 'About', icon: <Info size={20} />, action: onAbout }
  ];

  if (showHomeOption && onGoHome) {
    mainMenuItems.push({ 
      id: 'home', 
      label: 'Home', 
      icon: <Home size={20} />, 
      action: onGoHome 
    });
  }

  const staggeredItems = useStagger(mainMenuItems, 100);

  // Load save slots when switching to saves tab
  useEffect(() => {
    if (activeTab === 'saves' && isOpen) {
      loadSaveSlots();
    }
  }, [activeTab, isOpen]);

  // Play sound effects when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      playMenuOpen();
    } else {
      playMenuClose();
    }
  }, [isOpen, playMenuOpen, playMenuClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  const loadSaveSlots = async () => {
    setIsLoading(true);
    try {
      const saveSystem = getSaveSystem();
      const slots = await saveSystem.getAllSaveSlots();
      setSaveSlots(slots);
    } catch (error) {
      console.error('Failed to load save slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSave = async (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this save? This action cannot be undone.'
    );
    
    if (confirmDelete) {
      try {
        const saveSystem = getSaveSystem();
        await saveSystem.deleteGame(slotId);
        await loadSaveSlots(); // Refresh the list
        playButtonClick();
      } catch (error) {
        console.error('Failed to delete save:', error);
      }
    }
  };

  const handleItemClick = (action: () => void) => {
    playButtonClick();
    action();
  };

  const handleLoadGame = (slotId: number) => {
    playButtonClick();
    onLoadGame(slotId);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatPlayTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={handleBackdropClick}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border-4 border-purple-200"
        style={slideInStyle}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 border-b border-gray-200">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-purple-800 mb-2">
              🦊 Feral Friends
            </h1>
            <p className="text-purple-600 text-sm">
              Adventure awaits with your animal companions
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'main'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Home size={16} />
            Main Menu
          </button>
          <button
            onClick={() => setActiveTab('saves')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'saves'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Save size={16} />
            Save Games
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'main' && (
            <div className="space-y-4">
              {staggeredItems((style, item) => (
                <animated.div key={item.id} style={style}>
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    leftIcon={item.icon}
                    onClick={() => handleItemClick(item.action)}
                    className="justify-start text-left hover:bg-purple-50 border-purple-200 text-purple-800 hover:border-purple-300"
                  >
                    {item.label}
                  </Button>
                </animated.div>
              ))}
            </div>
          )}

          {activeTab === 'saves' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Save Games</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('main')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Back
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading saves...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {saveSlots.map(slot => (
                    <div
                      key={slot.slotId}
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        slot.isEmpty
                          ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          : 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                      }`}
                      onClick={() => !slot.isEmpty && handleLoadGame(slot.slotId)}
                    >
                      {slot.isEmpty ? (
                        <div className="text-center py-4">
                          <Plus className="mx-auto text-gray-400 mb-2" size={24} />
                          <p className="text-gray-500 text-sm">Empty Slot {slot.slotId}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(onNewGame);
                            }}
                            className="mt-2 text-purple-600 hover:text-purple-700"
                          >
                            Start New Game
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-purple-800">
                                {slot.previewData?.playerName || 'Unknown Player'}
                              </h4>
                              <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
                                Slot {slot.slotId}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Star size={12} />
                                Level {slot.previewData?.level || 1}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users size={12} />
                                {slot.previewData?.companionCount || 0} companions
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                {slot.previewData?.playTime || '0m'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(slot.lastModified)}
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">
                                📍 {slot.previewData?.currentMap || 'Unknown location'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleLoadGame(slot.slotId)}
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteSave(slot.slotId, e)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Press <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">ESC</kbd> to close
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleItemClick(onClose)}
              className="text-gray-600 hover:text-gray-800"
            >
              Close Menu
            </Button>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
};

export default MainMenu;