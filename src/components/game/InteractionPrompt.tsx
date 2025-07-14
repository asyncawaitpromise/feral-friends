// Interaction Prompt Component
// Mobile-friendly UI for displaying and triggering object interactions

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Package, Droplet, Scissors, Home, Star } from 'react-feather';
import { Button } from '../ui';
import { EnvironmentObject, InteractionType } from '../../game';
import { IInteractionPrompt } from '../../game';

export interface InteractionPromptProps {
  prompt: IInteractionPrompt | null;
  visible: boolean;
  onInteract: (object: EnvironmentObject) => void;
  onDismiss?: () => void;
  className?: string;
}

// Icon mapping for different interaction types
const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  examine: <Eye className="w-5 h-5" />,
  harvest: <Scissors className="w-5 h-5" />,
  collect: <Package className="w-5 h-5" />,
  rest: <Home className="w-5 h-5" />,
  drink: <Droplet className="w-5 h-5" />,
  touch: <Star className="w-5 h-5" />,
  climb: <Home className="w-5 h-5" />,
  none: <Package className="w-5 h-5" />
};

// Color schemes for different interaction types
const INTERACTION_COLORS: Record<InteractionType, {
  bg: string;
  border: string;
  text: string;
  icon: string;
}> = {
  examine: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    text: 'text-white',
    icon: 'text-blue-100'
  },
  harvest: {
    bg: 'bg-green-500',
    border: 'border-green-400',
    text: 'text-white',
    icon: 'text-green-100'
  },
  collect: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-400',
    text: 'text-white',
    icon: 'text-yellow-100'
  },
  rest: {
    bg: 'bg-purple-500',
    border: 'border-purple-400',
    text: 'text-white',
    icon: 'text-purple-100'
  },
  drink: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-400',
    text: 'text-white',
    icon: 'text-cyan-100'
  },
  touch: {
    bg: 'bg-pink-500',
    border: 'border-pink-400',
    text: 'text-white',
    icon: 'text-pink-100'
  },
  climb: {
    bg: 'bg-gray-600',
    border: 'border-gray-500',
    text: 'text-white',
    icon: 'text-gray-100'
  },
  none: {
    bg: 'bg-gray-500',
    border: 'border-gray-400',
    text: 'text-white',
    icon: 'text-gray-100'
  }
};

const InteractionPrompt: React.FC<InteractionPromptProps> = ({
  prompt,
  visible,
  onInteract,
  onDismiss,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastPromptId, setLastPromptId] = useState<string | null>(null);

  // Handle show/hide animations
  useEffect(() => {
    if (prompt && prompt.id !== lastPromptId) {
      setIsAnimating(true);
      setLastPromptId(prompt.id);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [prompt, lastPromptId]);

  // Auto-dismiss after period of inactivity
  useEffect(() => {
    if (!visible || !prompt) return;

    const dismissTimer = setTimeout(() => {
      onDismiss?.();
    }, 8000); // Auto-dismiss after 8 seconds

    return () => clearTimeout(dismissTimer);
  }, [visible, prompt, onDismiss]);

  const handleInteract = useCallback(() => {
    if (prompt && prompt.canInteract) {
      onInteract(prompt.object);
    }
  }, [prompt, onInteract]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  if (!prompt || !visible) {
    return null;
  }

  const interactionType = prompt.object.interaction.type;
  const colors = INTERACTION_COLORS[interactionType];
  const icon = INTERACTION_ICONS[interactionType];

  const canInteract = prompt.canInteract;
  const objectName = prompt.object.metadata.name;
  const interactionPrompt = prompt.object.interaction.prompt;
  const reason = prompt.reason;

  return (
    <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div
        className={`
          transition-all duration-300 ease-out
          ${isAnimating ? 'scale-110 opacity-80' : 'scale-100 opacity-100'}
          ${visible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Main interaction card */}
        <div className={`
          ${colors.bg} ${colors.border}
          rounded-lg border-2 shadow-lg
          max-w-sm mx-4 p-4
          ${!canInteract ? 'opacity-75' : ''}
        `}>
          {/* Object info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`${colors.icon} flex-shrink-0`}>
                {icon}
              </div>
              <div className={`${colors.text}`}>
                <div className="font-semibold text-sm">{objectName}</div>
                <div className="text-xs opacity-90">
                  {Math.round(prompt.distance * 10) / 10}m away
                </div>
              </div>
            </div>
            
            {/* Rarity indicator */}
            {prompt.object.metadata.rarity && prompt.object.metadata.rarity !== 'common' && (
              <div className={`
                px-2 py-1 rounded text-xs font-bold
                ${prompt.object.metadata.rarity === 'legendary' ? 'bg-yellow-400 text-yellow-900' :
                  prompt.object.metadata.rarity === 'rare' ? 'bg-purple-400 text-purple-900' :
                  'bg-blue-400 text-blue-900'}
              `}>
                {prompt.object.metadata.rarity}
              </div>
            )}
          </div>

          {/* Interaction prompt text */}
          <div className={`${colors.text} text-sm mb-4`}>
            {canInteract ? interactionPrompt : reason || 'Cannot interact'}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className={`
                flex-1 ${colors.text} border-current 
                hover:bg-white hover:bg-opacity-20
                focus:ring-2 focus:ring-white focus:ring-opacity-50
              `}
            >
              Ignore
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleInteract}
              disabled={!canInteract}
              className={`
                flex-2 bg-white text-gray-900 
                hover:bg-gray-100 
                disabled:bg-gray-300 disabled:text-gray-500
                focus:ring-2 focus:ring-white focus:ring-opacity-50
                min-w-0 px-6
              `}
            >
              <span className="flex items-center space-x-2">
                {icon}
                <span className="font-semibold">
                  {interactionType.charAt(0).toUpperCase() + interactionType.slice(1)}
                </span>
              </span>
            </Button>
          </div>

          {/* Requirements hint */}
          {!canInteract && reason && (
            <div className={`${colors.text} text-xs mt-2 opacity-75 text-center`}>
              {reason}
            </div>
          )}
        </div>

        {/* Distance indicator */}
        <div className="flex justify-center mt-2">
          <div className="flex space-x-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${prompt.distance <= (i + 1) ? 
                    `${colors.bg.replace('bg-', 'bg-opacity-80 bg-')}` : 
                    'bg-gray-400 bg-opacity-40'
                  }
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for when multiple interactions are available
export interface CompactInteractionPromptProps {
  prompts: IInteractionPrompt[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onInteract: (object: EnvironmentObject) => void;
  className?: string;
}

export const CompactInteractionPrompt: React.FC<CompactInteractionPromptProps> = ({
  prompts,
  selectedIndex,
  onSelect,
  onInteract,
  className = ''
}) => {
  if (prompts.length === 0) return null;

  const selectedPrompt = prompts[selectedIndex];
  if (!selectedPrompt) return null;
  
  const colors = INTERACTION_COLORS[selectedPrompt.object.interaction.type];

  return (
    <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        {/* Object selector */}
        {prompts.length > 1 && (
          <div className="flex space-x-2 bg-black bg-opacity-70 rounded-full p-2">
            {prompts.map((prompt, index) => {
              const isSelected = index === selectedIndex;
              const promptColors = INTERACTION_COLORS[prompt.object.interaction.type];
              
              return (
                <button
                  key={prompt.id}
                  onClick={() => onSelect(index)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-200 text-xs
                    ${isSelected ? 
                      `${promptColors.bg} ${promptColors.text}` : 
                      'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }
                  `}
                >
                  {INTERACTION_ICONS[prompt.object.interaction.type]}
                </button>
              );
            })}
          </div>
        )}

        {/* Main interaction button */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => onInteract(selectedPrompt.object)}
          disabled={!selectedPrompt.canInteract}
          className={`
            ${colors.bg} ${colors.text} ${colors.border}
            border-2 shadow-lg px-6 py-3
            hover:scale-105 transition-transform duration-200
            disabled:opacity-50 disabled:hover:scale-100
            focus:ring-2 focus:ring-white focus:ring-opacity-50
          `}
        >
          <span className="flex items-center space-x-2">
            {INTERACTION_ICONS[selectedPrompt.object.interaction.type]}
            <span className="font-semibold">
              {selectedPrompt.object.interaction.type.charAt(0).toUpperCase() + 
               selectedPrompt.object.interaction.type.slice(1)}
            </span>
          </span>
        </Button>

        {/* Object name */}
        <div className="text-white text-sm text-center bg-black bg-opacity-50 rounded px-3 py-1">
          {selectedPrompt.object.metadata.name}
        </div>
      </div>
    </div>
  );
};

// Hook for managing interaction prompts
export const useInteractionPrompts = () => {
  const [currentPrompt, setCurrentPrompt] = useState<IInteractionPrompt | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showPrompt = useCallback((prompt: IInteractionPrompt) => {
    setCurrentPrompt(prompt);
    setIsVisible(true);
  }, []);

  const hidePrompt = useCallback(() => {
    setIsVisible(false);
    // Delay clearing the prompt to allow for exit animations
    setTimeout(() => {
      setCurrentPrompt(null);
    }, 300);
  }, []);

  const dismissPrompt = useCallback(() => {
    hidePrompt();
  }, [hidePrompt]);

  return {
    currentPrompt,
    isVisible,
    showPrompt,
    hidePrompt,
    dismissPrompt
  };
};

export default InteractionPrompt;