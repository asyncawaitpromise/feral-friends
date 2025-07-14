import React, { useState, useEffect, useRef } from 'react';
import { animated } from '@react-spring/web';
import { 
  Heart, 
  ArrowLeft, 
  Star,
  Zap,
  Clock,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Activity
} from 'react-feather';
import { useSlideIn, useFadeIn, useBounce, useFloat } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';
import { Animal } from '../../game/Animal';
import { TamingSystem, TamingInteraction, TAMING_INTERACTIONS, TRUST_LEVELS } from '../../game/TamingSystem';
import { animalPersonality } from '../../game/AnimalPersonality';
import { bondingSystem } from '../../game/BondingSystem';

interface TamingInterfaceProps {
  animal: Animal;
  playerItems: string[];
  playerEnergy: number;
  onInteraction: (interactionId: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

interface InteractionFeedback {
  type: 'success' | 'failure' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export const TamingInterface: React.FC<TamingInterfaceProps> = ({
  animal,
  playerItems,
  playerEnergy,
  onInteraction,
  onClose,
  isVisible
}) => {
  const [selectedInteraction, setSelectedInteraction] = useState<string | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const [feedback, setFeedback] = useState<InteractionFeedback[]>([]);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showPersonalityInfo, setShowPersonalityInfo] = useState(false);
  const [trustHistory, setTrustHistory] = useState<number[]>([]);
  const [interactionCooldowns, setInteractionCooldowns] = useState<Record<string, number>>({});

  const tamingSystem = useRef(new TamingSystem());
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Animations
  const interfaceAnimation = useSlideIn(isVisible, 'up');
  const trustMeterAnimation = useFloat(true, 2, 2000);
  const interactionButtonsAnimation = useSlideIn(isVisible, 'left');
  const adviceAnimation = useFadeIn(showAdvice);
  const personalityAnimation = useBounce(showPersonalityInfo);

  // Audio
  const { playSuccess, playError } = useSound();

  // Get current taming progress
  const tamingProgress = tamingSystem.current.getTamingProgress(animal.id);
  const currentTrust = tamingProgress?.currentTrust || 0;
  const bondingProgress = bondingSystem.getBondingProgress(animal.id);
  const personality = animalPersonality.getPersonality(animal.id);

  // Get available interactions
  const availableInteractions = tamingSystem.current.getAvailableInteractions(animal.id, playerItems);

  // Get trust level info
  const trustLevelInfo = TRUST_LEVELS.find(level => currentTrust >= level.level) || TRUST_LEVELS[0];
  const nextTrustLevel = TRUST_LEVELS.find(level => currentTrust < level.level);

  // Update cooldowns
  useEffect(() => {
    const updateCooldowns = () => {
      const now = Date.now();
      const updatedCooldowns: Record<string, number> = {};
      
      Object.entries(interactionCooldowns).forEach(([interactionId, cooldownEnd]) => {
        if (cooldownEnd > now) {
          updatedCooldowns[interactionId] = cooldownEnd;
        }
      });
      
      setInteractionCooldowns(updatedCooldowns);
    };

    const interval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(interval);
  }, [interactionCooldowns]);

  // Handle interaction attempt
  const handleInteraction = async (interactionId: string) => {
    if (isInteracting || interactionCooldowns[interactionId]) return;

    setIsInteracting(true);
    setSelectedInteraction(interactionId);

    try {

      // Simulate interaction time
      const interaction = TAMING_INTERACTIONS.find(i => i.id === interactionId);
      if (interaction) {
        await new Promise(resolve => setTimeout(resolve, interaction.duration));
      }

      // Attempt the interaction
      const result = tamingSystem.current.attemptInteraction(
        animal.id,
        interactionId,
        playerItems,
        personality?.primary || 'neutral'
      );

      // Update trust history
      setTrustHistory(prev => [...prev.slice(-9), result.trustAfter]);

      // Add feedback
      const feedbackType = result.success ? 'success' : 'failure';
      const newFeedback: InteractionFeedback = {
        type: feedbackType,
        message: result.success ? result.playerFeedback : 'The interaction didn\'t go as planned',
        timestamp: Date.now()
      };

      setFeedback(prev => [...prev.slice(-4), newFeedback]);

      // Play appropriate sound
      if (result.success) {
        playSuccess();
      } else {
        playError();
      }

      // Set cooldown if applicable
      if (interaction?.cooldown) {
        setInteractionCooldowns(prev => ({
          ...prev,
          [interactionId]: Date.now() + interaction.cooldown!
        }));
      }

      // Update bonding progress
      if (result.success && bondingProgress) {
        bondingSystem.addBondPoints(
          animal.id,
          Math.floor(result.modifier * 2),
          `Successful ${interaction?.name || 'interaction'}`,
          'learning'
        );
      }

      // Trigger callback
      onInteraction(interactionId);

    } catch (error) {
      console.error('Interaction failed:', error);
      playError();
      setFeedback(prev => [...prev.slice(-4), {
        type: 'error',
        message: error instanceof Error ? error.message : 'Interaction failed',
        timestamp: Date.now()
      }]);
    } finally {
      setIsInteracting(false);
      setSelectedInteraction(null);
    }
  };

  // Get personality advice
  const getPersonalityAdvice = () => {
    if (!personality) return null;
    return animalPersonality.getPersonalityAdvice(animal.id);
  };

  // Format time remaining for cooldown
  const formatCooldownTime = (cooldownEnd: number): string => {
    const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
    return `${remaining}s`;
  };

  // Get interaction button color based on effectiveness
  const getInteractionButtonColor = (interaction: TamingInteraction): string => {
    if (!personality) return 'bg-blue-500';
    
    const effectiveness = animalPersonality.calculateInteractionEffectiveness(
      animal.id,
      interaction,
      {
        playerApproach: 'normal',
        environmentNoise: 'quiet',
        timeOfDay: 'afternoon',
        playerEnergy
      }
    );

    if (effectiveness.effectiveness > 1.3) return 'bg-green-500';
    if (effectiveness.effectiveness > 1.1) return 'bg-blue-500';
    if (effectiveness.effectiveness < 0.8) return 'bg-red-500';
    return 'bg-gray-500';
  };

  if (!isVisible) return null;

  return (
    <animated.div 
      style={interfaceAnimation}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
    >
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white">
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
                  {animal.name || `${animal.species.charAt(0).toUpperCase() + animal.species.slice(1)}`}
                </h2>
                <p className="text-sm opacity-90">
                  {personality?.primary ? `${personality.primary} personality` : 'Getting to know this animal...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowPersonalityInfo(!showPersonalityInfo)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Info size={18} />
              </Button>
              <Button
                onClick={() => setShowAdvice(!showAdvice)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Target size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Progress */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Trust Level</span>
            <span className="text-sm text-gray-500">{currentTrust}/100</span>
          </div>
          
          <animated.div style={trustMeterAnimation} className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  trustLevelInfo?.color === 'red' ? 'bg-red-500' :
                  trustLevelInfo?.color === 'orange' ? 'bg-orange-500' :
                  trustLevelInfo?.color === 'yellow' ? 'bg-yellow-500' :
                  trustLevelInfo?.color === 'blue' ? 'bg-blue-500' :
                  trustLevelInfo?.color === 'green' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}
                style={{ width: `${currentTrust}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs font-medium text-gray-600">
                {trustLevelInfo?.name || 'Unknown'}
              </span>
              {nextTrustLevel && (
                <span className="text-xs text-gray-500">
                  Next: {nextTrustLevel.name} ({(nextTrustLevel.level || 0) - currentTrust} points)
                </span>
              )}
            </div>
          </animated.div>

          {/* Bond Level */}
          {bondingProgress && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart size={16} className="text-pink-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Bond: {bondingProgress.currentBondLevel.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < bondingProgress.bondLevelNumber ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personality Info */}
        {showPersonalityInfo && personality && (
          <animated.div style={personalityAnimation} className="p-4 bg-blue-50 border-b">
            <h3 className="font-semibold text-blue-900 mb-2">Personality Insights</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-blue-800">
                  Primary: {personality.primary}
                  {personality.secondary && `, Secondary: ${personality.secondary}`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity size={14} className="text-blue-600" />
                <span className="text-sm text-blue-800">
                  Activity Level: {personality.activityLevel}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users size={14} className="text-blue-600" />
                <span className="text-sm text-blue-800">
                  Social Preference: {personality.socialPreference.replace('_', ' ')}
                </span>
              </div>
            </div>
          </animated.div>
        )}

        {/* Advice Panel */}
        {showAdvice && (
          <animated.div style={adviceAnimation} className="p-4 bg-green-50 border-b">
            <h3 className="font-semibold text-green-900 mb-2">Approach Tips</h3>
            {personality && (
              <div className="space-y-2">
                {getPersonalityAdvice()?.approachTips?.slice(0, 2).map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800">{tip}</span>
                  </div>
                )) || []}
              </div>
            )}
          </animated.div>
        )}

        {/* Interaction Buttons */}
        <animated.div style={interactionButtonsAnimation} className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Available Interactions</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableInteractions.map((interaction) => {
              const isOnCooldown = interactionCooldowns[interaction.id] && (interactionCooldowns[interaction.id] || 0) > Date.now();
              const cooldownTime = isOnCooldown ? (interactionCooldowns[interaction.id] || 0) : 0;
              
              return (
                <Button
                  key={interaction.id}
                  onClick={() => handleInteraction(interaction.id)}
                  disabled={isInteracting || isOnCooldown || playerEnergy < interaction.energyCost}
                  className={`
                    relative h-20 flex-col space-y-1 text-white
                    ${getInteractionButtonColor(interaction)}
                    ${isInteracting && selectedInteraction === interaction.id ? 'animate-pulse' : ''}
                    ${isOnCooldown ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-2xl">{interaction.icon}</div>
                  <div className="text-xs font-medium">{interaction.name}</div>
                  {interaction.energyCost > 0 && (
                    <div className="text-xs opacity-75 flex items-center">
                      <Zap size={10} className="mr-1" />
                      {interaction.energyCost || 0}
                    </div>
                  )}
                  {isOnCooldown && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-xs flex items-center">
                        <Clock size={12} className="mr-1" />
                        {formatCooldownTime(cooldownTime)}
                      </div>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </animated.div>

        {/* Feedback */}
        {feedback.length > 0 && (
          <div ref={feedbackRef} className="p-4 border-t bg-gray-50 max-h-32 overflow-y-auto">
            <h4 className="font-medium text-gray-900 mb-2">Recent Interactions</h4>
            <div className="space-y-2">
              {feedback.slice(-3).map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  {item.type === 'success' && <CheckCircle size={14} className="text-green-600 mt-0.5" />}
                  {item.type === 'failure' && <XCircle size={14} className="text-red-600 mt-0.5" />}
                  {item.type === 'warning' && <AlertTriangle size={14} className="text-yellow-600 mt-0.5" />}
                  {item.type === 'info' && <Info size={14} className="text-blue-600 mt-0.5" />}
                  {item.type === 'error' && <XCircle size={14} className="text-red-600 mt-0.5" />}
                  <span className="text-sm text-gray-700">{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust History Mini Chart */}
        {trustHistory.length > 1 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Trust Progress</span>
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <div className="flex items-end space-x-1 h-8">
              {trustHistory.map((trust, index) => (
                <div
                  key={index}
                  className="bg-blue-500 rounded-t-sm flex-1 transition-all duration-300"
                  style={{ height: `${(trust / 100) * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </animated.div>
  );
};

export default TamingInterface; 