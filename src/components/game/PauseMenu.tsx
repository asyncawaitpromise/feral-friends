import React, { useEffect } from 'react';
import { animated } from '@react-spring/web';
import { Pause, Play, Settings, Home, RotateCcw } from 'react-feather';
import { useSlideIn, useFadeIn, useStagger } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onSettings: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onClose: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onSettings,
  onRestart,
  onMainMenu,
  onClose
}) => {
  const { playMenuOpen, playMenuClose, playButtonClick } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen, 'down');
  const fadeInStyle = useFadeIn(isOpen);
  
  const menuItems = [
    { id: 'resume', label: 'Resume Game', icon: <Play size={20} />, action: onResume },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, action: onSettings },
    { id: 'restart', label: 'Restart Level', icon: <RotateCcw size={20} />, action: onRestart },
    { id: 'mainmenu', label: 'Main Menu', icon: <Home size={20} />, action: onMainMenu }
  ];

  const staggeredItems = useStagger(menuItems, 100);

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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleItemClick = (action: () => void) => {
    playButtonClick();
    action();
  };

  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={handleBackdropClick}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-4 border-blue-200"
        style={slideInStyle}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <Pause className="text-blue-600 mr-2" size={28} />
            <h2 className="text-2xl font-bold text-blue-800">Game Paused</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Take a break or adjust your settings
          </p>
        </div>

        {/* Menu Items */}
        <div className="space-y-3 mb-6">
          {staggeredItems((style, item) => (
            <animated.div key={item.id} style={style}>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                leftIcon={item.icon}
                onClick={() => handleItemClick(item.action)}
                className="justify-start text-left hover:bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-300"
              >
                {item.label}
              </Button>
            </animated.div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 mb-2">
            Press <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">ESC</kbd> or click outside to close
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
      </animated.div>
    </animated.div>
  );
};

export default PauseMenu;