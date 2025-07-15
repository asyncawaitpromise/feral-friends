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
  XCircle,
  Activity,
  Award
} from 'react-feather';
import { useSlideIn, useFadeIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';
import { Animal } from '../../game/Animal';
import { EncounterAnimal, EncounterAnimalManager, TrickResult, TamingResult } from '../../game/EncounterAnimal';
import { TrickDefinition } from '../../data/tricks';
import TrickSelectionMenu from './TrickSelectionMenu';
import TamingMethodMenu from './TamingMethodMenu';

interface EnhancedEncounterInterfaceProps {
  animal: Animal;
  playerItems: string[];
  playerEnergy: number;
  onAnimalTamed: (animal: Animal) => void;
  onAnimalFled: () => void;
  onEnergyUsed: (amount: number) => void;
  onItemUsed: (itemId: string) => void;
  onFlee: () => void;
  onClose: () => void;
  isVisible: boolean;
}

interface EncounterFeedback {
  type: 'success' | 'failure' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  details?: string;
}

type EncounterState = 'main' | 'trick_selection' | 'taming_selection' | 'item_selection' | 'completed' | 'fled';

export const EnhancedEncounterInterface: React.FC<EnhancedEncounterInterfaceProps> = ({
  animal,
  playerItems,
  playerEnergy,
  onAnimalTamed,
  onAnimalFled,
  onEnergyUsed,
  onItemUsed,
  onFlee,
  onClose,
  isVisible
}) => {
  const [encounterAnimal, setEncounterAnimal] = useState<EncounterAnimal | null>(null);
  const [currentState, setCurrentState] = useState<EncounterState>('main');
  const [feedback, setFeedback] = useState<EncounterFeedback[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showItems, setShowItems] = useState(false);

  // Animations
  const interfaceAnimation = useSlideIn(isVisible, 'up');
  const feedbackAnimation = useFadeIn(feedback.length > 0);
  const itemsAnimation = useFadeIn(showItems);

  // Audio
  const { playSuccess, playError } = useSound();

  // Initialize encounter animal
  useEffect(() => {
    if (isVisible && animal && !encounterAnimal) {
      const newEncounterAnimal = EncounterAnimalManager.createEncounterAnimal(animal, animal.position);
      setEncounterAnimal(newEncounterAnimal);
      
      addFeedback('info', `A wild ${animal.species} appears!`, 
        `The animal looks ${newEncounterAnimal.encounter.fear > 70 ? 'very scared' : 
         newEncounterAnimal.encounter.fear > 40 ? 'nervous' : 'cautious'} but curious.`);
    }
  }, [isVisible, animal, encounterAnimal]);

  // Check for encounter end conditions
  useEffect(() => {
    if (!encounterAnimal) return;

    // Check if animal should flee
    if (EncounterAnimalManager.shouldAnimalFlee(encounterAnimal)) {
      setCurrentState('fled');
      addFeedback('warning', 'The animal is too scared!', 'It runs away into the tall grass.');
      setTimeout(() => {
        onAnimalFled();
        onClose();
      }, 3000);
      return;
    }

    // Check if animal can be tamed
    if (EncounterAnimalManager.canAnimalBeTamed(encounterAnimal)) {
      setCurrentState('completed');
      addFeedback('success', 'The animal trusts you completely!', 'You can now tame it as your companion.');
    }
  }, [encounterAnimal, onAnimalFled, onClose]);

  const addFeedback = (type: EncounterFeedback['type'], message: string, details?: string) => {
    const newFeedback: EncounterFeedback = {
      type,
      message,
      timestamp: Date.now(),
      details
    };
    setFeedback(prev => [...prev.slice(-2), newFeedback]);

    // Auto-remove feedback after delay
    setTimeout(() => {
      setFeedback(prev => prev.filter(f => f.timestamp !== newFeedback.timestamp));
    }, 5000);
  };

  const handleTrickSelected = async (trick: TrickDefinition) => {
    if (!encounterAnimal || isProcessingAction) return;

    setIsProcessingAction(true);
    setCurrentState('main');
    
    try {
      // Use player energy
      onEnergyUsed(trick.energyCost);
      
      // Perform trick
      const result: TrickResult = EncounterAnimalManager.performTrick(encounterAnimal, trick);
      
      // Update local state
      setEncounterAnimal({...encounterAnimal});
      
      // Provide feedback
      if (result.criticalSuccess) {
        playSuccess();
        addFeedback('critical', result.playerFeedback, result.animalReaction);
      } else if (result.success) {
        playSuccess();
        addFeedback('success', result.playerFeedback, result.animalReaction);
      } else if (result.criticalFailure) {
        playError();
        addFeedback('error', result.playerFeedback, result.animalReaction);
      } else {
        addFeedback('warning', result.playerFeedback, result.animalReaction);
      }

    } catch (error) {
      console.error('Trick failed:', error);
      playError();
      addFeedback('error', 'Something went wrong with the trick.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTamingMethodSelected = async (method: any) => {
    if (!encounterAnimal || isProcessingAction) return;

    setIsProcessingAction(true);
    setCurrentState('main');

    try {
      // Use player energy
      onEnergyUsed(method.energyCost);
      
      // Use required items if any
      if (method.requiredItems) {
        method.requiredItems.forEach((item: string) => onItemUsed(item));
      }
      
      // Use taming method
      const result: TamingResult = EncounterAnimalManager.useTamingMethod(encounterAnimal, method);
      
      // Update local state
      setEncounterAnimal({...encounterAnimal});
      
      // Provide feedback
      if (result.bonusEffect) {
        playSuccess();
        addFeedback('critical', result.playerFeedback, `${result.animalReaction} ${result.bonusEffect}`);
      } else if (result.success) {
        playSuccess();
        addFeedback('success', result.playerFeedback, result.animalReaction);
      } else if (result.riskTriggered) {
        playError();
        addFeedback('error', result.playerFeedback, result.animalReaction);
      } else {
        addFeedback('warning', result.playerFeedback, result.animalReaction);
      }

    } catch (error) {
      console.error('Taming method failed:', error);
      playError();
      addFeedback('error', 'Something went wrong with the taming attempt.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTameAnimal = () => {
    if (!encounterAnimal) return;
    
    // Convert encounter animal back to regular animal and mark as tamed
    const { encounter, ...baseAnimal } = encounterAnimal;
    const tamedAnimal: Animal = {
      ...baseAnimal,
      discoveredByPlayer: true,
      interactionCount: encounter.interactionCount
    };
    
    // Update trust in stats
    if (tamedAnimal.stats) {
      tamedAnimal.stats.trust = encounter.affection;
    }
    
    onAnimalTamed(tamedAnimal);
    addFeedback('success', 'Congratulations!', `The ${animal.species} is now your companion!`);
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleItemUse = (itemId: string) => {
    if (!encounterAnimal) return;
    
    // Check if using collar on ready-to-tame animal
    if (itemId === 'collar' && EncounterAnimalManager.canAnimalBeTamed(encounterAnimal)) {
      onItemUsed(itemId); // Use the collar item
      addFeedback('success', 'Collar used successfully!', `The ${animal.species} is now wearing a collar and trusts you completely.`);
      setShowItems(false);
      handleTameAnimal();
      return;
    }
    
    // Regular item usage
    onItemUsed(itemId);
    addFeedback('info', `Used ${itemId}`, `The ${animal.species} seems interested.`);
    setShowItems(false);
  };

  const getAnimalMoodColor = (fear: number): string => {
    if (fear > 80) return 'text-red-600';
    if (fear > 60) return 'text-orange-600';
    if (fear > 40) return 'text-yellow-600';
    if (fear > 20) return 'text-blue-600';
    return 'text-green-600';
  };

  const getAnimalMoodText = (fear: number, affection: number): string => {
    if (fear > 80) return 'Terrified';
    if (fear > 60) return 'Very Scared';
    if (fear > 40) return 'Nervous';
    if (fear > 20) return 'Cautious';
    if (affection > 60) return 'Trusting';
    if (affection > 30) return 'Interested';
    return 'Calm';
  };

  if (!isVisible || !encounterAnimal) return null;

  // Render submenus
  if (currentState === 'trick_selection') {
    return (
      <TrickSelectionMenu
        animal={animal}
        playerEnergy={playerEnergy}
        animalFear={encounterAnimal.encounter.fear}
        animalAffection={encounterAnimal.encounter.affection}
        onTrickSelected={handleTrickSelected}
        onBack={() => setCurrentState('main')}
        isVisible={true}
      />
    );
  }

  if (currentState === 'taming_selection') {
    return (
      <TamingMethodMenu
        animal={animal}
        playerItems={playerItems}
        playerEnergy={playerEnergy}
        animalFear={encounterAnimal.encounter.fear}
        animalAffection={encounterAnimal.encounter.affection}
        onMethodSelected={handleTamingMethodSelected}
        onBack={() => setCurrentState('main')}
        isVisible={true}
      />
    );
  }

  const fear = encounterAnimal.encounter.fear;
  const affection = encounterAnimal.encounter.affection;
  const canTame = EncounterAnimalManager.canAnimalBeTamed(encounterAnimal);

  return (
    <animated.div 
      style={interfaceAnimation}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl mx-4">
        {/* Header */}
        <div className={`p-4 text-white ${
          currentState === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
          currentState === 'fled' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
          'bg-gradient-to-r from-green-600 to-emerald-600'
        }`}>
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
                <h2 className="text-xl font-bold">
                  {currentState === 'completed' ? 'Success!' :
                   currentState === 'fled' ? 'Animal Fled' :
                   'Wild Encounter'}
                </h2>
                <p className="text-sm opacity-90">
                  {currentState === 'completed' ? 'Ready to tame!' :
                   currentState === 'fled' ? 'Better luck next time' :
                   `Interacting with ${animal.species}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animal Status */}
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
                <h3 className="font-semibold text-gray-900 capitalize">{animal.species}</h3>
                <p className={`text-sm ${getAnimalMoodColor(fear)}`}>
                  {getAnimalMoodText(fear, affection)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap size={14} className="text-blue-500" />
              <span className="text-sm text-gray-600">{playerEnergy}/100</span>
            </div>
          </div>

          {/* Fear and Affection Bars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle size={14} className="text-orange-500" />
                <span className="text-xs font-medium text-gray-700">Fear</span>
                <span className="text-xs text-gray-600">{Math.round(fear)}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${fear}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Heart size={14} className="text-pink-500" />
                <span className="text-xs font-medium text-gray-700">Affection</span>
                <span className="text-xs text-gray-600">{Math.round(affection)}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-pink-500 transition-all duration-500"
                  style={{ width: `${affection}%` }}
                />
              </div>
            </div>
          </div>

          {/* Personality Traits */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {encounterAnimal.encounter.personalityTraits.map((trait, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {trait.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {currentState === 'main' && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Choose Your Action</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Trick Action */}
              <Button
                onClick={() => setCurrentState('trick_selection')}
                disabled={isProcessingAction || playerEnergy < 2}
                className="h-20 flex-col space-y-1 text-white bg-blue-500 hover:bg-blue-600"
              >
                <PlayCircle size={24} />
                <div className="text-xs font-medium">Tricks</div>
                <div className="text-xs opacity-75">Impress animal</div>
              </Button>

              {/* Tame Action */}
              <Button
                onClick={() => setCurrentState('taming_selection')}
                disabled={isProcessingAction || playerEnergy < 1}
                className="h-20 flex-col space-y-1 text-white bg-green-500 hover:bg-green-600"
              >
                <Home size={24} />
                <div className="text-xs font-medium">Taming</div>
                <div className="text-xs opacity-75">Build trust</div>
              </Button>

              {/* Items Action */}
              <Button
                onClick={() => setShowItems(!showItems)}
                disabled={isProcessingAction || playerItems.length === 0}
                className={`h-20 flex-col space-y-1 text-white bg-purple-500 hover:bg-purple-600 ${
                  showItems ? 'ring-2 ring-purple-300' : ''
                }`}
              >
                <Package size={24} />
                <div className="text-xs font-medium">Items</div>
                <div className="text-xs opacity-75">{playerItems.length} available</div>
              </Button>

              {/* Flee Action */}
              <Button
                onClick={onFlee}
                disabled={isProcessingAction}
                className="h-20 flex-col space-y-1 text-white bg-red-500 hover:bg-red-600"
              >
                <ArrowLeft size={24} />
                <div className="text-xs font-medium">Flee</div>
                <div className="text-xs opacity-75">Leave encounter</div>
              </Button>
            </div>

            {/* Ready to Tame Notice */}
            {canTame && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award size={20} className="text-green-600" />
                  <div className="font-semibold text-green-800">Ready to Tame!</div>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  The {animal.species} trusts you enough to become your companion.
                </p>
                <p className="text-xs text-green-600">
                  💡 Use a collar from your items to tame this animal
                </p>
              </div>
            )}
          </div>
        )}

        {/* Items Panel */}
        {showItems && (
          <animated.div style={itemsAnimation} className="p-4 bg-gray-50 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Use Item</h4>
            {canTame && playerItems.includes('collar') && (
              <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-xs text-green-800 font-medium">
                  🎯 You can use a collar to tame this animal!
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {playerItems.slice(0, 6).map((item, index) => {
                const isCollar = item === 'collar';
                const canTameWithCollar = canTame && isCollar;
                
                return (
                  <Button
                    key={index}
                    onClick={() => handleItemUse(item)}
                    disabled={isProcessingAction}
                    className={`h-12 text-xs ${
                      canTameWithCollar 
                        ? 'bg-green-500 hover:bg-green-600 text-white ring-2 ring-green-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {isCollar ? '🎯' : ''} {item}
                  </Button>
                );
              })}
            </div>
          </animated.div>
        )}

        {/* Feedback */}
        {feedback.length > 0 && (
          <animated.div style={feedbackAnimation} className="p-4 border-t bg-gray-50">
            <div className="space-y-2">
              {feedback.slice(-2).map((item, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-start space-x-2">
                    {item.type === 'success' && <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />}
                    {item.type === 'critical' && <Star size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />}
                    {item.type === 'error' && <XCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />}
                    {item.type === 'warning' && <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />}
                    {item.type === 'info' && <Activity size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.message}</p>
                      {item.details && (
                        <p className="text-xs text-gray-600 mt-1">{item.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </animated.div>
        )}

        {/* Progress Summary */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Interactions: {encounterAnimal.encounter.interactionCount}</span>
            <span>
              {canTame ? 'Ready to tame!' :
               fear > 60 ? 'Reduce fear first' :
               affection < 50 ? 'Build more affection' :
               'Keep building trust'}
            </span>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default EnhancedEncounterInterface;