// Animal Interaction UI Component
// Mobile-optimized UI for animal interactions showing mood, options, and feedback

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Heart, Gift, Play, Users, Smile, MessageCircle } from 'react-feather';
import { Button } from '../ui';
import { getAnimalEmotion } from '../../game/Animal';
import { InteractionType, InteractionZone, InteractionResult } from '../../game/InteractionSystem';

export interface AnimalInteractionProps {
  zone: InteractionZone | null;
  visible: boolean;
  onInteract: (type: InteractionType) => void;
  onClose: () => void;
  lastResult?: InteractionResult;
  className?: string;
}

// Icon mapping for interaction types
const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  observe: <Eye className="w-5 h-5" />,
  approach: <Smile className="w-5 h-5" />,
  interact: <Users className="w-5 h-5" />,
  feed: <Gift className="w-5 h-5" />,
  pet: <Heart className="w-5 h-5" />,
  play: <Play className="w-5 h-5" />,
  talk: <MessageCircle className="w-5 h-5" />
};

// Color schemes for interaction types
const INTERACTION_COLORS: Record<InteractionType, string> = {
  observe: 'bg-blue-500 hover:bg-blue-600',
  approach: 'bg-green-500 hover:bg-green-600',
  interact: 'bg-purple-500 hover:bg-purple-600',
  feed: 'bg-orange-500 hover:bg-orange-600',
  pet: 'bg-pink-500 hover:bg-pink-600',
  play: 'bg-indigo-500 hover:bg-indigo-600',
  talk: 'bg-teal-500 hover:bg-teal-600'
};

const AnimalInteraction: React.FC<AnimalInteractionProps> = ({
  zone,
  visible,
  onInteract,
  onClose,
  lastResult,
  className = ''
}) => {
  const [showResult, setShowResult] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionType | null>(null);

  // Show result feedback
  useEffect(() => {
    if (lastResult) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  const handleInteract = useCallback((type: InteractionType) => {
    setSelectedInteraction(type);
    onInteract(type);
  }, [onInteract]);

  if (!zone || !visible) {
    return null;
  }

  const animal = zone.animal;
  const canInteract = zone.availableInteractions.length > 0;

  // Calculate animal mood color
  const getMoodColor = () => {
    if (animal.stats.fear > 70) return 'text-red-500';
    if (animal.stats.happiness > 70) return 'text-green-500';
    if (animal.stats.trust > 60) return 'text-blue-500';
    return 'text-yellow-500';
  };

  const getMoodDescription = () => {
    if (animal.stats.fear > 70) return 'Scared';
    if (animal.stats.happiness > 70) return 'Happy';
    if (animal.stats.trust > 60) return 'Trusting';
    if (animal.stats.curiosity > 70) return 'Curious';
    return 'Neutral';
  };

  return (
    <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
      <div className={`
        transition-all duration-300 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}>
        {/* Result Feedback */}
        {showResult && lastResult && (
          <div className={`
            absolute -top-16 left-1/2 transform -translate-x-1/2
            p-3 rounded-lg shadow-lg text-white text-center max-w-xs
            ${lastResult.success ? 'bg-green-500' : 'bg-red-500'}
            transition-all duration-300
          `}>
            <div className="text-sm font-medium">{lastResult.message}</div>
            {lastResult.effects && (
              <div className="text-xs mt-1 opacity-90">
                {lastResult.effects.trustChange && lastResult.effects.trustChange > 0 && (
                  <span>+{lastResult.effects.trustChange} Trust </span>
                )}
                {lastResult.effects.happinessChange && lastResult.effects.happinessChange > 0 && (
                  <span>+{lastResult.effects.happinessChange} Happiness </span>
                )}
                {lastResult.effects.fearChange && lastResult.effects.fearChange < 0 && (
                  <span>{lastResult.effects.fearChange} Fear </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Interaction Panel */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm mx-4">
          {/* Animal Info Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {getAnimalEmotion(animal)}
              </div>
              <div>
                <div className="font-semibold text-gray-800 capitalize">
                  {animal.species}
                </div>
                <div className={`text-sm ${getMoodColor()}`}>
                  {getMoodDescription()} • {zone.distance.toFixed(1)}m away
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>

          {/* Animal Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-600">Trust</div>
              <div className="flex items-center mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${animal.stats.trust}%` }}
                  />
                </div>
                <span className="text-xs ml-2 text-gray-700">{animal.stats.trust}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-600">Energy</div>
              <div className="flex items-center mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(animal.stats.energy / animal.stats.maxEnergy) * 100}%` }}
                  />
                </div>
                <span className="text-xs ml-2 text-gray-700">
                  {animal.stats.energy}/{animal.stats.maxEnergy}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <div className="text-sm text-blue-800">
              <span className="font-medium">💡 Tip: </span>
              {zone.recommendedAction}
            </div>
            {zone.confidence < 0.5 && (
              <div className="text-xs text-blue-600 mt-1">
                Success chance: {Math.round(zone.confidence * 100)}%
              </div>
            )}
          </div>

          {/* Warnings */}
          {zone.warnings && zone.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              {zone.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-yellow-800">
                  <span className="font-medium">⚠️ </span>
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Interaction Buttons */}
          {canInteract ? (
            <div className="grid grid-cols-2 gap-2">
              {zone.availableInteractions.map((interaction) => (
                <Button
                  key={interaction}
                  variant="primary"
                  size="sm"
                  onClick={() => handleInteract(interaction)}
                  disabled={selectedInteraction === interaction}
                  className={`
                    ${INTERACTION_COLORS[interaction]} text-white
                    flex items-center space-x-2 justify-center
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 hover:scale-105
                  `}
                >
                  {INTERACTION_ICONS[interaction]}
                  <span className="font-medium capitalize">{interaction}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-500 text-sm">
                No interactions available
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {zone.requirements?.[0] || 'Get closer to interact'}
              </div>
            </div>
          )}

          {/* Animal State Info */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>State: {animal.ai.currentState}</span>
              <span>Interactions: {animal.interactionCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for mobile when multiple animals are nearby
export interface CompactAnimalInteractionProps {
  zones: InteractionZone[];
  selectedZoneIndex: number;
  onSelectZone: (index: number) => void;
  onInteract: (type: InteractionType) => void;
  onClose: () => void;
  lastResult?: InteractionResult;
  className?: string;
}

export const CompactAnimalInteraction: React.FC<CompactAnimalInteractionProps> = ({
  zones,
  selectedZoneIndex,
  onSelectZone,
  onInteract,
  onClose,
  lastResult,
  className = ''
}) => {
  if (zones.length === 0) return null;

  const selectedZone = zones[selectedZoneIndex];
  const animal = selectedZone.animal;

  return (
    <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        {/* Animal Selector */}
        {zones.length > 1 && (
          <div className="flex space-x-2 bg-black bg-opacity-80 rounded-full p-2">
            {zones.map((zone, index) => {
              const isSelected = index === selectedZoneIndex;
              return (
                <button
                  key={zone.animal.id}
                  onClick={() => onSelectZone(index)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-200 text-lg
                    ${isSelected ? 
                      'bg-white text-gray-800 scale-110' : 
                      'bg-gray-600 text-white hover:bg-gray-500'
                    }
                  `}
                >
                  {getAnimalEmotion(zone.animal)}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          {selectedZone.availableInteractions.slice(0, 3).map((interaction) => (
            <Button
              key={interaction}
              variant="primary"
              size="sm"
              onClick={() => onInteract(interaction)}
              className={`
                ${INTERACTION_COLORS[interaction]} text-white
                flex items-center space-x-1 px-3 py-2
                hover:scale-105 transition-all duration-200
              `}
            >
              {INTERACTION_ICONS[interaction]}
              <span className="text-xs capitalize">{interaction}</span>
            </Button>
          ))}
        </div>

        {/* Animal Name */}
        <div className="text-white text-sm text-center bg-black bg-opacity-70 rounded px-3 py-1">
          {animal.species} • {Math.round(selectedZone.distance * 10) / 10}m
        </div>
      </div>
    </div>
  );
};

export default AnimalInteraction;