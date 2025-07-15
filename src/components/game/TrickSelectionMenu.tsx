import React, { useState, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { 
  ArrowLeft, 
  Star,
  Zap,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'react-feather';
import { useSlideIn, useFadeIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';
import { Animal } from '../../game/Animal';
import { TrickDefinition, getAvailableTricksForSpecies, ALL_TRICKS } from '../../data/tricks';

interface TrickSelectionMenuProps {
  animal: Animal;
  playerEnergy: number;
  animalFear: number; // 0-100, how scared the animal is
  animalAffection: number; // 0-100, how much affection earned
  onTrickSelected: (trick: TrickDefinition) => void;
  onBack: () => void;
  isVisible: boolean;
}

interface TrickEffectiveness {
  trick: TrickDefinition;
  effectiveness: number; // 0-1, how effective this trick will be
  fearReduction: number; // how much fear it will reduce
  energyCost: number;
  successChance: number; // 0-1, chance of success
  description: string;
}

export const TrickSelectionMenu: React.FC<TrickSelectionMenuProps> = ({
  animal,
  playerEnergy,
  animalFear,
  animalAffection,
  onTrickSelected,
  onBack,
  isVisible
}) => {
  const [selectedTrick, setSelectedTrick] = useState<TrickDefinition | null>(null);
  const [trickEffectiveness, setTrickEffectiveness] = useState<TrickEffectiveness[]>([]);

  // Animations
  const menuAnimation = useSlideIn(isVisible, 'right');
  const detailAnimation = useFadeIn(selectedTrick !== null);

  // Audio
  const { playSuccess, playError } = useSound();

  // Calculate trick effectiveness for this encounter
  useEffect(() => {
    const availableTricks = getEncounterTricks(animal.species);
    const effectiveness = availableTricks.map(trick => calculateTrickEffectiveness(trick));
    setTrickEffectiveness(effectiveness);
  }, [animal, animalFear, animalAffection, playerEnergy]);

  const getEncounterTricks = (species: string): TrickDefinition[] => {
    // Get basic tricks suitable for wild encounters
    const encounterTrickIds = ['sit', 'shake', 'jump', 'spin', 'stay'];
    return ALL_TRICKS.filter(trick => 
      encounterTrickIds.includes(trick.id) &&
      trick.speciesCompatibility[species] &&
      trick.speciesCompatibility[species].successRate > 0.2
    );
  };

  const calculateTrickEffectiveness = (trick: TrickDefinition): TrickEffectiveness => {
    const speciesData = trick.speciesCompatibility[animal.species];
    if (!speciesData) {
      return {
        trick,
        effectiveness: 0,
        fearReduction: 0,
        energyCost: trick.energyCost,
        successChance: 0,
        description: 'This animal cannot learn this trick'
      };
    }

    // Base success rate from species compatibility
    let successChance = speciesData.successRate;

    // Adjust based on animal's current fear level
    if (animalFear > 70) {
      successChance *= 0.6; // Very scared animals are harder to impress
    } else if (animalFear > 40) {
      successChance *= 0.8; // Moderately scared
    } else if (animalFear < 20) {
      successChance *= 1.2; // Calm animals are easier to impress
    }

    // Adjust based on trick difficulty vs fear
    const difficultyPenalty = {
      'easy': 0.9,
      'medium': 0.7,
      'hard': 0.5,
      'expert': 0.3,
      'master': 0.1
    };
    
    if (animalFear > 50) {
      successChance *= difficultyPenalty[trick.difficulty];
    }

    // Calculate fear reduction based on trick performance value and success
    const baseFearReduction = Math.min(30, trick.performanceValue * 0.4);
    const fearReduction = baseFearReduction * successChance;

    // Effectiveness is combination of success chance and impact
    const effectiveness = successChance * (fearReduction / 30);

    let description = '';
    if (successChance > 0.8) {
      description = 'Very likely to impress';
    } else if (successChance > 0.6) {
      description = 'Good chance to impress';
    } else if (successChance > 0.4) {
      description = 'Moderate chance to impress';
    } else if (successChance > 0.2) {
      description = 'Low chance to impress';
    } else {
      description = 'Very unlikely to work';
    }

    if (animalFear > 60 && trick.difficulty !== 'easy') {
      description += ' (animal too scared for complex tricks)';
    }

    return {
      trick,
      effectiveness,
      fearReduction,
      energyCost: trick.energyCost,
      successChance: Math.min(1, successChance),
      description
    };
  };

  const handleTrickSelection = (trickData: TrickEffectiveness) => {
    if (playerEnergy < trickData.energyCost) {
      playError();
      return;
    }

    setSelectedTrick(trickData.trick);
    playSuccess();
    onTrickSelected(trickData.trick);
  };

  const getEffectivenessColor = (effectiveness: number): string => {
    if (effectiveness > 0.7) return 'text-green-600';
    if (effectiveness > 0.5) return 'text-blue-600';
    if (effectiveness > 0.3) return 'text-yellow-600';
    if (effectiveness > 0.1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEffectivenessIcon = (effectiveness: number): React.ReactNode => {
    if (effectiveness > 0.7) return <CheckCircle size={16} className="text-green-600" />;
    if (effectiveness > 0.3) return <Target size={16} className="text-yellow-600" />;
    return <XCircle size={16} className="text-red-600" />;
  };

  if (!isVisible) return null;

  return (
    <animated.div style={menuAnimation} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Select Trick</h2>
                <p className="text-sm opacity-90">
                  Impress the {animal.species} with a trick
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animal Status */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Fear Level</span>
              <div className="flex items-center space-x-1">
                <AlertTriangle size={14} className="text-orange-500" />
                <span className="text-sm text-gray-600">{Math.round(animalFear)}/100</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Energy</span>
              <div className="flex items-center space-x-1">
                <Zap size={14} className="text-blue-500" />
                <span className="text-sm text-gray-600">{playerEnergy}/100</span>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="h-2 rounded-full bg-orange-500"
              style={{ width: `${animalFear}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-600">
            {animalFear > 70 ? 'Very scared - only simple tricks will work' :
             animalFear > 40 ? 'Moderately scared - be gentle' :
             animalFear > 20 ? 'Slightly nervous - tricks should work well' :
             'Calm - ready to be impressed'}
          </p>
        </div>

        {/* Trick List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Available Tricks</h3>
          <div className="space-y-3">
            {trickEffectiveness.map((trickData, index) => {
              const isAffordable = playerEnergy >= trickData.energyCost;
              const effectiveness = trickData.effectiveness;
              
              return (
                <Button
                  key={index}
                  onClick={() => handleTrickSelection(trickData)}
                  disabled={!isAffordable}
                  className={`
                    w-full p-4 text-left border-2 rounded-lg transition-all
                    ${isAffordable ? 'hover:border-blue-300 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                    ${effectiveness > 0.5 ? 'border-green-200 bg-green-50' :
                      effectiveness > 0.3 ? 'border-blue-200 bg-blue-50' :
                      'border-gray-200 bg-gray-50'}
                  `}
                  variant="ghost"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{trickData.trick.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{trickData.trick.name}</h4>
                          {getEffectivenessIcon(effectiveness)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{trickData.trick.description}</p>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <Zap size={12} className="text-blue-500" />
                            <span className={isAffordable ? 'text-gray-600' : 'text-red-500'}>
                              {trickData.energyCost}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target size={12} className="text-green-500" />
                            <span className="text-gray-600">
                              -{Math.round(trickData.fearReduction)} fear
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star size={12} className="text-yellow-500" />
                            <span className="text-gray-600">
                              {Math.round(trickData.successChance * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs mt-2 ${getEffectivenessColor(effectiveness)}`}>
                    {trickData.description}
                  </div>
                </Button>
              );
            })}
          </div>

          {trickEffectiveness.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No suitable tricks available for this animal</p>
            </div>
          )}
        </div>

        {/* Footer Tips */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start space-x-2">
            <AlertTriangle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="mb-1"><strong>Tips:</strong></p>
              <ul className="space-y-1">
                <li>• Scared animals respond better to simple tricks</li>
                <li>• Higher success rate = more fear reduction</li>
                <li>• Save energy for multiple attempts if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default TrickSelectionMenu;