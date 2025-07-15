import React, { useState, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { 
  ArrowLeft, 
  Heart,
  Package,
  Coffee,
  Gift,
  Zap,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star
} from 'react-feather';
import { useSlideIn, useFadeIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';
import { Animal } from '../../game/Animal';
import { TamingInteraction, TAMING_INTERACTIONS } from '../../game/TamingSystem';

interface TamingMethodMenuProps {
  animal: Animal;
  playerItems: string[];
  playerEnergy: number;
  animalFear: number; // 0-100, how scared the animal is
  animalAffection: number; // 0-100, how much affection earned
  onMethodSelected: (method: TamingMethod) => void;
  onBack: () => void;
  isVisible: boolean;
}

interface TamingMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'food' | 'gentle_touch' | 'speak_softly' | 'give_space' | 'play' | 'observe';
  energyCost: number;
  fearReduction: number; // How much this reduces fear
  affectionGain: number; // How much affection this can give
  requiredItems?: string[];
  effectiveness: number; // 0-1 based on current fear level
  successChance: number; // 0-1 chance of working
  riskLevel: 'low' | 'medium' | 'high'; // Risk of scaring animal more
}

interface TamingMethodEffectiveness {
  method: TamingMethod;
  adjustedEffectiveness: number;
  adjustedSuccessChance: number;
  description: string;
  warning?: string;
}

export const TamingMethodMenu: React.FC<TamingMethodMenuProps> = ({
  animal,
  playerItems,
  playerEnergy,
  animalFear,
  animalAffection,
  onMethodSelected,
  onBack,
  isVisible
}) => {
  const [selectedMethod, setSelectedMethod] = useState<TamingMethod | null>(null);
  const [methodEffectiveness, setMethodEffectiveness] = useState<TamingMethodEffectiveness[]>([]);

  // Animations
  const menuAnimation = useSlideIn(isVisible, 'right');
  const detailAnimation = useFadeIn(selectedMethod !== null);

  // Audio
  const { playSuccess, playError } = useSound();

  // Base taming methods available in encounters
  const baseTamingMethods: TamingMethod[] = [
    {
      id: 'offer_food',
      name: 'Offer Food',
      description: 'Gently offer food to build trust and show you mean no harm',
      icon: '🍎',
      type: 'food',
      energyCost: 3,
      fearReduction: 25,
      affectionGain: 30,
      requiredItems: ['food'],
      effectiveness: 0.8,
      successChance: 0.7,
      riskLevel: 'low'
    },
    {
      id: 'gentle_touch',
      name: 'Gentle Touch',
      description: 'Slowly extend your hand for the animal to sniff and touch',
      icon: '✋',
      type: 'gentle_touch',
      energyCost: 2,
      fearReduction: 15,
      affectionGain: 25,
      effectiveness: 0.6,
      successChance: 0.5,
      riskLevel: 'medium'
    },
    {
      id: 'speak_softly',
      name: 'Speak Softly',
      description: 'Use a calm, gentle voice to soothe the animal',
      icon: '💬',
      type: 'speak_softly',
      energyCost: 1,
      fearReduction: 10,
      affectionGain: 15,
      effectiveness: 0.7,
      successChance: 0.8,
      riskLevel: 'low'
    },
    {
      id: 'give_space',
      name: 'Give Space',
      description: 'Step back and let the animal feel safe while observing you',
      icon: '👀',
      type: 'give_space',
      energyCost: 1,
      fearReduction: 20,
      affectionGain: 10,
      effectiveness: 0.9,
      successChance: 0.9,
      riskLevel: 'low'
    },
    {
      id: 'offer_toy',
      name: 'Offer Toy',
      description: 'Present a toy to encourage playful interaction',
      icon: '🎾',
      type: 'play',
      energyCost: 4,
      fearReduction: 20,
      affectionGain: 35,
      requiredItems: ['toy'],
      effectiveness: 0.6,
      successChance: 0.6,
      riskLevel: 'medium'
    },
    {
      id: 'slow_approach',
      name: 'Slow Approach',
      description: 'Move very slowly closer to show peaceful intentions',
      icon: '🚶‍♂️',
      type: 'observe',
      energyCost: 2,
      fearReduction: 5,
      affectionGain: 20,
      effectiveness: 0.4,
      successChance: 0.4,
      riskLevel: 'high'
    }
  ];

  // Calculate method effectiveness based on current situation
  useEffect(() => {
    const effectiveness = baseTamingMethods.map(method => calculateMethodEffectiveness(method));
    setMethodEffectiveness(effectiveness);
  }, [animalFear, animalAffection, playerItems, playerEnergy]);

  const calculateMethodEffectiveness = (method: TamingMethod): TamingMethodEffectiveness => {
    let adjustedEffectiveness = method.effectiveness;
    let adjustedSuccessChance = method.successChance;
    let description = '';
    let warning = '';

    // Check if required items are available
    if (method.requiredItems) {
      const hasAllItems = method.requiredItems.every(item => playerItems.includes(item));
      if (!hasAllItems) {
        return {
          method,
          adjustedEffectiveness: 0,
          adjustedSuccessChance: 0,
          description: `Missing required items: ${method.requiredItems.join(', ')}`,
          warning: 'Cannot use without required items'
        };
      }
    }

    // Adjust based on fear level
    if (animalFear > 80) {
      // Very scared animals
      if (method.type === 'give_space' || method.type === 'speak_softly') {
        adjustedEffectiveness *= 1.3;
        adjustedSuccessChance *= 1.2;
        description = 'Perfect for very scared animals';
      } else if (method.type === 'food') {
        adjustedEffectiveness *= 1.1;
        adjustedSuccessChance *= 1.1;
        description = 'Food can help even very scared animals';
      } else if (method.riskLevel === 'high') {
        adjustedEffectiveness *= 0.3;
        adjustedSuccessChance *= 0.3;
        description = 'Too risky for a very scared animal';
        warning = 'High risk of making animal more scared';
      } else {
        adjustedEffectiveness *= 0.7;
        adjustedSuccessChance *= 0.7;
        description = 'Challenging with such a scared animal';
      }
    } else if (animalFear > 50) {
      // Moderately scared animals
      if (method.type === 'give_space' || method.type === 'speak_softly' || method.type === 'food') {
        adjustedEffectiveness *= 1.1;
        adjustedSuccessChance *= 1.1;
        description = 'Good choice for a scared animal';
      } else if (method.riskLevel === 'high') {
        adjustedEffectiveness *= 0.6;
        adjustedSuccessChance *= 0.6;
        description = 'Risky approach for a scared animal';
        warning = 'Might increase fear if it fails';
      } else {
        description = 'Moderate effectiveness';
      }
    } else if (animalFear > 20) {
      // Slightly nervous animals
      if (method.type === 'play' || method.type === 'gentle_touch') {
        adjustedEffectiveness *= 1.2;
        adjustedSuccessChance *= 1.2;
        description = 'Great for building trust';
      } else {
        description = 'Good chance of success';
      }
    } else {
      // Calm animals
      if (method.type === 'play' || method.type === 'gentle_touch') {
        adjustedEffectiveness *= 1.3;
        adjustedSuccessChance *= 1.3;
        description = 'Excellent for building affection';
      } else if (method.type === 'give_space') {
        adjustedEffectiveness *= 0.8;
        description = 'Less needed for calm animals';
      } else {
        description = 'Very likely to succeed';
      }
    }

    // Adjust based on existing affection
    if (animalAffection > 50) {
      adjustedEffectiveness *= 1.1;
      adjustedSuccessChance *= 1.1;
      description += ' (animal already likes you)';
    }

    // Cap values at 1.0
    adjustedEffectiveness = Math.min(1.0, adjustedEffectiveness);
    adjustedSuccessChance = Math.min(1.0, adjustedSuccessChance);

    return {
      method,
      adjustedEffectiveness,
      adjustedSuccessChance,
      description,
      warning
    };
  };

  const handleMethodSelection = (methodData: TamingMethodEffectiveness) => {
    if (playerEnergy < methodData.method.energyCost) {
      playError();
      return;
    }

    setSelectedMethod(methodData.method);
    playSuccess();
    onMethodSelected(methodData.method);
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

  const getRiskIcon = (risk: string): React.ReactNode => {
    switch (risk) {
      case 'low': return <CheckCircle size={14} className="text-green-500" />;
      case 'medium': return <AlertTriangle size={14} className="text-yellow-500" />;
      case 'high': return <XCircle size={14} className="text-red-500" />;
      default: return <Target size={14} className="text-gray-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <animated.div style={menuAnimation} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
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
                <h2 className="text-xl font-bold">Taming Methods</h2>
                <p className="text-sm opacity-90">
                  Build trust with the {animal.species}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animal Status */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle size={14} className="text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Fear</span>
                <span className="text-sm text-gray-600">{Math.round(animalFear)}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: `${animalFear}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Heart size={14} className="text-pink-500" />
                <span className="text-sm font-medium text-gray-700">Affection</span>
                <span className="text-sm text-gray-600">{Math.round(animalAffection)}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-pink-500"
                  style={{ width: `${animalAffection}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Zap size={14} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Energy: {playerEnergy}/100</span>
          </div>
        </div>

        {/* Method List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Available Methods</h3>
          <div className="space-y-3">
            {methodEffectiveness.map((methodData, index) => {
              const isAffordable = playerEnergy >= methodData.method.energyCost;
              const canUse = methodData.adjustedSuccessChance > 0;
              const effectiveness = methodData.adjustedEffectiveness;
              
              return (
                <Button
                  key={index}
                  onClick={() => handleMethodSelection(methodData)}
                  disabled={!isAffordable || !canUse}
                  className={`
                    w-full p-4 text-left border-2 rounded-lg transition-all
                    ${isAffordable && canUse ? 'hover:border-green-300 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                    ${effectiveness > 0.6 ? 'border-green-200 bg-green-50' :
                      effectiveness > 0.4 ? 'border-blue-200 bg-blue-50' :
                      effectiveness > 0.2 ? 'border-yellow-200 bg-yellow-50' :
                      'border-gray-200 bg-gray-50'}
                  `}
                  variant="ghost"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{methodData.method.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{methodData.method.name}</h4>
                          {getEffectivenessIcon(effectiveness)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{methodData.method.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs mb-2">
                          <div className="flex items-center space-x-1">
                            <Zap size={12} className="text-blue-500" />
                            <span className={isAffordable ? 'text-gray-600' : 'text-red-500'}>
                              {methodData.method.energyCost}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <AlertTriangle size={12} className="text-orange-500" />
                            <span className="text-gray-600">
                              -{methodData.method.fearReduction} fear
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart size={12} className="text-pink-500" />
                            <span className="text-gray-600">
                              +{methodData.method.affectionGain} affection
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star size={12} className="text-yellow-500" />
                            <span className="text-gray-600">
                              {Math.round(methodData.adjustedSuccessChance * 100)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Risk:</span>
                            {getRiskIcon(methodData.method.riskLevel)}
                            <span className="text-gray-600 capitalize">{methodData.method.riskLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-xs mt-2 ${getEffectivenessColor(effectiveness)}`}>
                    {methodData.description}
                  </div>
                  
                  {methodData.warning && (
                    <div className="text-xs mt-1 text-red-600 font-medium">
                      ⚠️ {methodData.warning}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Footer Tips */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start space-x-2">
            <AlertTriangle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="mb-1"><strong>Strategy:</strong></p>
              <ul className="space-y-1">
                <li>• Reduce fear first, then build affection</li>
                <li>• High fear = use low-risk methods</li>
                <li>• Need {100 - animalAffection} more affection to tame</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default TamingMethodMenu;