// Interaction Feedback System
// Provides color changes, animations, sound placeholders, and UI messages for interaction success/failure

import React, { useState, useEffect, useRef } from 'react';
import { Heart, AlertCircle, CheckCircle, X, Zap, Star } from 'react-feather';
import { InteractionResult, InteractionType } from '../../game/InteractionSystem';
import { ApproachResult } from '../../game/ApproachSystem';
import { Animal } from '../../game/Animal';

export interface InteractionFeedbackProps {
  result?: InteractionResult | undefined;
  approachResult?: ApproachResult | undefined;
  animal?: Animal | undefined;
  position: { x: number; y: number }; // Screen position for feedback
  onComplete?: () => void;
  className?: string;
}

// Feedback animation types
type FeedbackAnimation = 'bounce' | 'pulse' | 'shake' | 'float' | 'sparkle';

// Color schemes for different interaction types
const INTERACTION_COLORS = {
  observe: { success: '#3b82f6', failure: '#6b7280' },    // Blue/Gray
  approach: { success: '#10b981', failure: '#f59e0b' },   // Green/Yellow
  interact: { success: '#8b5cf6', failure: '#ef4444' },   // Purple/Red
  feed: { success: '#f97316', failure: '#ef4444' },       // Orange/Red
  pet: { success: '#ec4899', failure: '#ef4444' },        // Pink/Red
  play: { success: '#6366f1', failure: '#ef4444' },       // Indigo/Red
  talk: { success: '#06b6d4', failure: '#ef4444' }        // Cyan/Red
};

// Icons for different interaction types
const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  observe: <Star className="w-6 h-6" />,
  approach: <Heart className="w-6 h-6" />,
  interact: <CheckCircle className="w-6 h-6" />,
  feed: <Heart className="w-6 h-6" />,
  pet: <Heart className="w-6 h-6" />,
  play: <Zap className="w-6 h-6" />,
  talk: <CheckCircle className="w-6 h-6" />
};

const InteractionFeedback: React.FC<InteractionFeedbackProps> = ({
  result,
  approachResult,
  animal,
  position,
  onComplete,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animation, setAnimation] = useState<FeedbackAnimation>('bounce');
  const [particleEffects, setParticleEffects] = useState<Array<{ id: string; x: number; y: number; delay: number }>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Show feedback when result changes
  useEffect(() => {
    if (result || approachResult) {
      setIsVisible(true);
      
      // Determine animation based on success/failure
      if (result) {
        setAnimation(result.success ? 'bounce' : 'shake');
        playFeedbackSound(result.success ? 'success' : 'failure');
        
        // Create particle effects for successful interactions
        if (result.success && (result.type === 'feed' || result.type === 'pet' || result.type === 'play')) {
          createParticleEffects();
        }
      } else if (approachResult) {
        setAnimation(approachResult.success ? 'float' : 'pulse');
        playFeedbackSound(approachResult.success ? 'approach_success' : 'approach_failure');
      }

      // Auto-hide after duration
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onComplete?.();
        }, 300); // Wait for fade-out animation
      }, getDuration());
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [result, approachResult, onComplete]);

  // Create particle effects for positive interactions
  const createParticleEffects = () => {
    const particles = Array.from({ length: 5 }, (_, i) => ({
      id: `particle-${i}-${Date.now()}`,
      x: (Math.random() - 0.5) * 60, // Spread around center
      y: (Math.random() - 0.5) * 60,
      delay: i * 100 // Stagger animation
    }));
    setParticleEffects(particles);
    
    // Clear particles after animation
    setTimeout(() => {
      setParticleEffects([]);
    }, 2000);
  };

  // Play feedback sound (placeholder for now)
  const playFeedbackSound = (soundType: string) => {
    // Placeholder for sound system integration
    console.log(`🔊 Playing sound: ${soundType}`);
    
    // Future implementation might include:
    // - Success chimes
    // - Failure buzzes
    // - Animal-specific sounds
    // - Volume-aware playback
  };

  // Get feedback duration based on interaction type
  const getDuration = (): number => {
    if (result) {
      switch (result.type) {
        case 'observe': return 2000;
        case 'approach': return 2500;
        case 'interact': return 3000;
        case 'feed': case 'pet': case 'play': case 'talk': return 3500;
        default: return 2500;
      }
    }
    return 2000; // Default for approach results
  };

  // Get feedback color based on result
  const getFeedbackColor = (): string => {
    if (result) {
      const colors = INTERACTION_COLORS[result.type];
      return result.success ? colors.success : colors.failure;
    } else if (approachResult) {
      return approachResult.success ? '#10b981' : '#f59e0b';
    }
    return '#6b7280';
  };

  // Get feedback icon
  const getFeedbackIcon = () => {
    if (result) {
      return result.success ? INTERACTION_ICONS[result.type] : <X className="w-6 h-6" />;
    } else if (approachResult) {
      return approachResult.success ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />;
    }
    return <AlertCircle className="w-6 h-6" />;
  };

  // Get feedback message
  const getFeedbackMessage = (): string => {
    if (result) {
      return result.message;
    } else if (approachResult) {
      return approachResult.animalReaction;
    }
    return '';
  };

  // Get feedback title
  const getFeedbackTitle = (): string => {
    if (result) {
      return result.success ? 'Success!' : 'Failed';
    } else if (approachResult) {
      return approachResult.success ? 'Good approach!' : 'Poor approach';
    }
    return 'Feedback';
  };

  // Show stat changes
  const getStatChanges = () => {
    if (!result?.effects) return null;

    const changes = [];
    if (result.effects.trustChange && result.effects.trustChange !== 0) {
      changes.push(`Trust ${result.effects.trustChange > 0 ? '+' : ''}${result.effects.trustChange}`);
    }
    if (result.effects.fearChange && result.effects.fearChange !== 0) {
      changes.push(`Fear ${result.effects.fearChange > 0 ? '+' : ''}${result.effects.fearChange}`);
    }
    if (result.effects.happinessChange && result.effects.happinessChange !== 0) {
      changes.push(`Happiness ${result.effects.happinessChange > 0 ? '+' : ''}${result.effects.happinessChange}`);
    }
    if (result.effects.energyChange && result.effects.energyChange !== 0) {
      changes.push(`Energy ${result.effects.energyChange > 0 ? '+' : ''}${result.effects.energyChange}`);
    }

    return changes.length > 0 ? changes : null;
  };

  // Animation CSS classes
  const getAnimationClasses = (): string => {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    if (!isVisible) {
      return `${baseClasses} opacity-0 scale-75 translate-y-4`;
    }

    switch (animation) {
      case 'bounce':
        return `${baseClasses} opacity-100 scale-100 translate-y-0 animate-bounce`;
      case 'pulse':
        return `${baseClasses} opacity-100 scale-100 translate-y-0 animate-pulse`;
      case 'shake':
        return `${baseClasses} opacity-100 scale-100 translate-y-0 animate-shake`;
      case 'float':
        return `${baseClasses} opacity-100 scale-100 translate-y-0 animate-float`;
      case 'sparkle':
        return `${baseClasses} opacity-100 scale-100 translate-y-0 animate-sparkle`;
      default:
        return `${baseClasses} opacity-100 scale-100 translate-y-0`;
    }
  };

  if (!result && !approachResult) {
    return null;
  }

  return (
    <div
      className={`fixed pointer-events-none z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {/* Main Feedback */}
      <div
        className={`relative bg-white rounded-lg shadow-lg border-2 p-4 max-w-xs ${getAnimationClasses()}`}
        style={{ borderColor: getFeedbackColor() }}
      >
        {/* Icon and Title */}
        <div className="flex items-center space-x-3 mb-2">
          <div
            className="flex-shrink-0 p-2 rounded-full"
            style={{ backgroundColor: getFeedbackColor(), color: 'white' }}
          >
            {getFeedbackIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 text-sm">
              {getFeedbackTitle()}
            </div>
            {animal && (
              <div className="text-xs text-gray-600 capitalize">
                {animal.species}
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="text-sm text-gray-700 mb-2">
          {getFeedbackMessage()}
        </div>

        {/* Stat Changes */}
        {getStatChanges() && (
          <div className="bg-gray-50 rounded p-2 mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Changes:</div>
            <div className="space-y-1">
              {getStatChanges()!.map((change, index) => (
                <div key={index} className="text-xs text-gray-700 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                  {change}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unlocks */}
        {result?.unlocks && result.unlocks.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
            <div className="text-xs font-medium text-yellow-800 mb-1">🎉 Unlocked:</div>
            <div className="space-y-1">
              {result.unlocks.map((unlock, index) => (
                <div key={index} className="text-xs text-yellow-700 capitalize">
                  {unlock}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approach Recommendations */}
        {approachResult?.recommendations && approachResult.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="text-xs font-medium text-blue-800 mb-1">💡 Tips:</div>
            <div className="space-y-1">
              {approachResult.recommendations.slice(0, 2).map((tip, index) => (
                <div key={index} className="text-xs text-blue-700">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Effects Indicator */}
        {result?.success && (
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute top-0 w-4 h-4 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Particle Effects */}
      {particleEffects.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none animate-float"
          style={{
            left: particle.x,
            top: particle.y,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '1.5s'
          }}
        >
          <div className="w-2 h-2 bg-yellow-400 rounded-full opacity-80"></div>
        </div>
      ))}

      {/* Screen Flash Effect for Important Interactions */}
      {result?.success && (result.type === 'feed' || result.type === 'pet') && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${getFeedbackColor()}20 0%, transparent 70%)`,
            animation: 'flash 0.5s ease-out'
          }}
        />
      )}
    </div>
  );
};

// Compound component for displaying multiple feedback items
export interface MultiFeedbackProps {
  feedbackItems: Array<{
    id: string;
    result?: InteractionResult;
    approachResult?: ApproachResult;
    animal?: Animal;
    position: { x: number; y: number };
  }>;
  onComplete?: (id: string) => void;
  className?: string;
}

export const MultiFeedback: React.FC<MultiFeedbackProps> = ({
  feedbackItems,
  onComplete,
  className = ''
}) => {
  const [activeFeedback, setActiveFeedback] = useState<string[]>(
    feedbackItems.map(item => item.id)
  );

  const handleComplete = (id: string) => {
    setActiveFeedback(prev => prev.filter(activeId => activeId !== id));
    onComplete?.(id);
  };

  return (
    <div className={className}>
      {feedbackItems
        .filter(item => activeFeedback.includes(item.id))
        .map((item) => (
          <InteractionFeedback
            key={item.id}
            result={item.result}
            approachResult={item.approachResult}
            animal={item.animal}
            position={item.position}
            onComplete={() => handleComplete(item.id)}
          />
        ))}
    </div>
  );
};

// Hook for managing interaction feedback
export const useInteractionFeedback = () => {
  const [feedbackQueue, setFeedbackQueue] = useState<Array<{
    id: string;
    result?: InteractionResult;
    approachResult?: ApproachResult;
    animal?: Animal;
    position: { x: number; y: number };
  }>>([]);

  const addFeedback = (
    result: InteractionResult | undefined,
    approachResult: ApproachResult | undefined,
    animal: Animal | undefined,
    position: { x: number; y: number }
  ) => {
    const id = `feedback-${Date.now()}-${Math.random()}`;
    const feedbackItem: {
      id: string;
      result?: InteractionResult;
      approachResult?: ApproachResult;
      animal?: Animal;
      position: { x: number; y: number };
    } = { id, position };
    
    if (result) feedbackItem.result = result;
    if (approachResult) feedbackItem.approachResult = approachResult;
    if (animal) feedbackItem.animal = animal;
    
    setFeedbackQueue(prev => [...prev, feedbackItem]);
  };

  const removeFeedback = (id: string) => {
    setFeedbackQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearAllFeedback = () => {
    setFeedbackQueue([]);
  };

  return {
    feedbackItems: feedbackQueue,
    addFeedback,
    removeFeedback,
    clearAllFeedback
  };
};

// CSS animations (would typically be in a CSS file)
const feedbackStyles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
}

@keyframes flash {
  0% { opacity: 0; }
  50% { opacity: 0.3; }
  100% { opacity: 0; }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-float {
  animation: float 2s ease-in-out infinite;
}

.animate-sparkle {
  animation: sparkle 1.5s ease-in-out;
}
`;

// Inject styles (in a real app, these would be in CSS files)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = feedbackStyles;
  document.head.appendChild(style);
}

export default InteractionFeedback;