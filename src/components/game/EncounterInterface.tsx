import React, { useState, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { 
  Heart, 
  ArrowLeft, 
  Star,
  Zap,
  Package,
  PlayCircle,
  Home,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'react-feather';
import { useSlideIn, useFadeIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';
import { Animal } from '../../game/Animal';

interface EncounterInterfaceProps {
  animal: Animal;
  playerItems: string[];
  playerEnergy: number;
  onTrick: () => void;
  onTame: () => void;
  onUseItem: (itemId: string) => void;
  onFlee: () => void;
  onClose: () => void;
  isVisible: boolean;
}

interface EncounterFeedback {
  type: 'success' | 'failure' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export const EncounterInterface: React.FC<EncounterInterfaceProps> = ({
  animal,
  playerItems,
  playerEnergy,
  onTrick,
  onTame,
  onUseItem,
  onFlee,
  onClose,
  isVisible
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EncounterFeedback[]>([]);
  const [isActing, setIsActing] = useState(false);
  const [showItems, setShowItems] = useState(false);

  // Animations
  const interfaceAnimation = useSlideIn(isVisible, 'up');
  const itemsAnimation = useFadeIn(showItems);

  // Audio
  const { playSuccess, playError } = useSound();

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (feedback.length > 0) {
      const timer = setTimeout(() => {
        setFeedback(prev => prev.slice(0, -1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const addFeedback = (type: EncounterFeedback['type'], message: string) => {
    const newFeedback: EncounterFeedback = {
      type,
      message,
      timestamp: Date.now()
    };
    setFeedback(prev => [...prev.slice(-2), newFeedback]);
  };

  const handleAction = async (action: string, callback: () => void) => {
    if (isActing) return;

    setIsActing(true);
    setSelectedAction(action);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      callback();
    } catch (error) {
      console.error('Action failed:', error);
      playError();
      addFeedback('error', 'Action failed');
    } finally {
      setIsActing(false);
      setSelectedAction(null);
    }
  };

  const handleItemUse = (itemId: string) => {
    handleAction('item', () => onUseItem(itemId));
    setShowItems(false);
  };

  const getAnimalMood = (): { color: string; text: string } => {
    const trust = animal.stats?.trust || 0;
    const health = animal.stats?.health || 100;
    
    if (trust > 70) return { color: 'text-green-600', text: 'Friendly' };
    if (trust > 40) return { color: 'text-blue-600', text: 'Curious' };
    if (trust > 20) return { color: 'text-yellow-600', text: 'Cautious' };
    if (health < 50) return { color: 'text-red-600', text: 'Wounded' };
    return { color: 'text-gray-600', text: 'Wild' };
  };

  const mood = getAnimalMood();

  if (!isVisible) return null;

  return (
    <animated.div 
      style={interfaceAnimation}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Wild Encounter!</h2>
                <p className="text-sm opacity-90">
                  A {animal.species} appears from the tall grass
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animal Info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">{animal.species === 'rabbit' ? '🐰' : 
                  animal.species === 'fox' ? '🦊' : 
                  animal.species === 'deer' ? '🦌' : 
                  animal.species === 'bird' ? '🐦' : 
                  animal.species === 'squirrel' ? '🐿️' : 
                  animal.species === 'butterfly' ? '🦋' : 
                  animal.species === 'frog' ? '🐸' : 
                  animal.species === 'turtle' ? '🐢' : 
                  animal.species === 'owl' ? '🦉' : 
                  animal.species === 'mouse' ? '🐭' : 
                  animal.species === 'raccoon' ? '🦝' : 
                  animal.species === 'bear' ? '🐻' : 
                  animal.species === 'wolf' ? '🐺' : 
                  animal.species === 'otter' ? '🦦' : 
                  animal.species === 'hedgehog' ? '🦔' : 
                  animal.species === 'bat' ? '🦇' : '🐾'}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 capitalize">
                  {animal.species}
                </h3>
                <p className={`text-sm ${mood.color}`}>{mood.text}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Heart size={14} className="text-red-500" />
                <span className="text-sm text-gray-600">{animal.stats?.health || 100}/100</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <Star size={14} className="text-yellow-500" />
                <span className="text-sm text-gray-600">{animal.stats?.trust || 0}/100</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
            <p className="italic">
              {animal.stats?.trust && animal.stats.trust > 50 ? 
                "The animal looks at you with recognition and interest." :
                animal.stats?.trust && animal.stats.trust > 20 ?
                "The animal watches you cautiously but doesn't flee." :
                "The animal is alert and ready to run at any sudden movement."
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Choose Your Action</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Trick Action */}
            <Button
              onClick={() => handleAction('trick', onTrick)}
              disabled={isActing || playerEnergy < 10}
              className={`
                relative h-20 flex-col space-y-1 text-white bg-blue-500 hover:bg-blue-600
                ${isActing && selectedAction === 'trick' ? 'animate-pulse' : ''}
              `}
            >
              <PlayCircle size={24} />
              <div className="text-xs font-medium">Trick</div>
              <div className="text-xs opacity-75 flex items-center">
                <Zap size={10} className="mr-1" />
                10
              </div>
            </Button>

            {/* Tame Action */}
            <Button
              onClick={() => handleAction('tame', onTame)}
              disabled={isActing || playerEnergy < 15}
              className={`
                relative h-20 flex-col space-y-1 text-white bg-green-500 hover:bg-green-600
                ${isActing && selectedAction === 'tame' ? 'animate-pulse' : ''}
              `}
            >
              <Home size={24} />
              <div className="text-xs font-medium">Tame</div>
              <div className="text-xs opacity-75 flex items-center">
                <Zap size={10} className="mr-1" />
                15
              </div>
            </Button>

            {/* Items Action */}
            <Button
              onClick={() => setShowItems(!showItems)}
              disabled={isActing || playerItems.length === 0}
              className={`
                relative h-20 flex-col space-y-1 text-white bg-purple-500 hover:bg-purple-600
                ${showItems ? 'ring-2 ring-purple-300' : ''}
              `}
            >
              <Package size={24} />
              <div className="text-xs font-medium">Items</div>
              <div className="text-xs opacity-75">
                {playerItems.length} available
              </div>
            </Button>

            {/* Flee Action */}
            <Button
              onClick={() => handleAction('flee', onFlee)}
              disabled={isActing}
              className={`
                relative h-20 flex-col space-y-1 text-white bg-red-500 hover:bg-red-600
                ${isActing && selectedAction === 'flee' ? 'animate-pulse' : ''}
              `}
            >
              <ArrowLeft size={24} />
              <div className="text-xs font-medium">Flee</div>
              <div className="text-xs opacity-75">No cost</div>
            </Button>
          </div>
        </div>

        {/* Items Panel */}
        {showItems && (
          <animated.div style={itemsAnimation} className="p-4 bg-gray-50 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Use Item</h4>
            <div className="grid grid-cols-3 gap-2">
              {playerItems.slice(0, 6).map((item, index) => (
                <Button
                  key={index}
                  onClick={() => handleItemUse(item)}
                  disabled={isActing}
                  className="h-12 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  {item}
                </Button>
              ))}
            </div>
            {playerItems.length > 6 && (
              <p className="text-xs text-gray-500 mt-2">
                +{playerItems.length - 6} more items
              </p>
            )}
          </animated.div>
        )}

        {/* Feedback */}
        {feedback.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-2">
              {feedback.slice(-2).map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  {item.type === 'success' && <CheckCircle size={14} className="text-green-600 mt-0.5" />}
                  {item.type === 'failure' && <XCircle size={14} className="text-red-600 mt-0.5" />}
                  {item.type === 'warning' && <AlertTriangle size={14} className="text-yellow-600 mt-0.5" />}
                  {item.type === 'error' && <XCircle size={14} className="text-red-600 mt-0.5" />}
                  <span className="text-sm text-gray-700">{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Energy Warning */}
        {playerEnergy < 15 && (
          <div className="p-3 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Low energy! Some actions may not be available.
              </span>
            </div>
          </div>
        )}
      </div>
    </animated.div>
  );
};

export default EncounterInterface;