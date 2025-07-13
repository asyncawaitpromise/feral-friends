import React, { useState, useEffect, useRef } from 'react';
import { animated } from '@react-spring/web';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Eye, 
  MousePointer, 
  Navigation,
  Users,
  Package,
  Star,
  Heart,
  Play,
  SkipForward,
  RotateCcw,
  CheckCircle
} from 'react-feather';
import { useSlideIn, useFadeIn, useBounce } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'action' | 'demonstration' | 'interaction';
  targetElement?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  actionRequired?: boolean;
  skipable?: boolean;
  autoAdvance?: number; // milliseconds
  validationFn?: () => boolean; // Function to check if step is complete
  customComponent?: React.ReactNode;
  tips?: string[];
}

export interface TutorialConfig {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'movement' | 'interaction' | 'inventory' | 'animals' | 'advanced';
  steps: TutorialStep[];
  prerequisites?: string[]; // Other tutorial IDs that should be completed first
  unlockConditions?: {
    playerLevel?: number;
    animalsDiscovered?: number;
    itemsCollected?: number;
    mapsExplored?: number;
  };
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  currentTutorial: TutorialConfig | null;
  onComplete: (tutorialId: string) => void;
  onSkip: () => void;
  completedTutorials: string[];
  showSkipOption?: boolean;
  autoStart?: boolean;
}

const TUTORIAL_ICONS = {
  movement: <Navigation size={20} />,
  interaction: <MousePointer size={20} />,
  animals: <Users size={20} />,
  inventory: <Package size={20} />,
  basic: <Star size={20} />,
  advanced: <Eye size={20} />
};

export const Tutorial: React.FC<TutorialProps> = ({
  isOpen,
  onClose,
  currentTutorial,
  onComplete,
  onSkip,
  completedTutorials,
  showSkipOption = true,
  autoStart = false
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimer = useRef<number>();
  const { playButtonClick, playSuccess, playError } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen, 'up');
  const fadeInStyle = useFadeIn(isOpen);
  const bounceStyle = useBounce(isHighlighting, 1.05);

  const currentStep = currentTutorial?.steps[currentStepIndex];
  const totalSteps = currentTutorial?.steps.length || 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // Reset tutorial state when tutorial changes
  useEffect(() => {
    if (currentTutorial) {
      setCurrentStepIndex(0);
      setUserProgress({});
      setShowHint(false);
      setHintIndex(0);
    }
  }, [currentTutorial?.id]);

  // Handle auto-advance
  useEffect(() => {
    if (currentStep?.autoAdvance && isOpen) {
      autoAdvanceTimer.current = window.setTimeout(() => {
        handleNext();
      }, currentStep.autoAdvance);

      return () => {
        if (autoAdvanceTimer.current) {
          clearTimeout(autoAdvanceTimer.current);
        }
      };
    }
  }, [currentStep, isOpen]);

  // Handle target element highlighting
  useEffect(() => {
    if (currentStep?.targetElement && isOpen) {
      const element = document.querySelector(currentStep.targetElement);
      if (element) {
        setIsHighlighting(true);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class
        element.classList.add('tutorial-highlight');
        
        return () => {
          element.classList.remove('tutorial-highlight');
          setIsHighlighting(false);
        };
      }
    }
  }, [currentStep, isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          toggleHint();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    playButtonClick();
    
    // Check if step validation is required
    if (currentStep?.validationFn && !currentStep.validationFn()) {
      playError();
      setShowHint(true);
      return;
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      playButtonClick();
      setCurrentStepIndex(prev => prev - 1);
      setShowHint(false);
    }
  };

  const handleComplete = () => {
    if (currentTutorial) {
      playSuccess();
      onComplete(currentTutorial.id);
      onClose();
    }
  };

  const handleSkip = () => {
    playButtonClick();
    onSkip();
    onClose();
  };

  const handleClose = () => {
    playButtonClick();
    onClose();
  };

  const toggleHint = () => {
    if (currentStep?.tips && currentStep.tips.length > 0) {
      setShowHint(!showHint);
      if (!showHint) {
        setHintIndex(0);
      }
    }
  };

  const nextHint = () => {
    if (currentStep?.tips) {
      setHintIndex(prev => (prev + 1) % currentStep.tips.length);
    }
  };

  const renderProgressBar = () => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-gray-500">
        Step {currentStepIndex + 1} of {totalSteps}
      </span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>
      <span className="text-sm text-gray-500">
        {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
      </span>
    </div>
  );

  const renderStepContent = () => {
    if (!currentStep) return null;

    return (
      <div className="mb-6">
        {/* Step Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {currentStep.icon || TUTORIAL_ICONS[currentTutorial?.category || 'basic']}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{currentStep.title}</h3>
            <span className={`text-xs px-2 py-1 rounded ${
              currentStep.type === 'action' ? 'bg-green-100 text-green-700' :
              currentStep.type === 'demonstration' ? 'bg-blue-100 text-blue-700' :
              currentStep.type === 'interaction' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {currentStep.type.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="text-gray-700 leading-relaxed mb-4">
          {currentStep.content}
        </div>

        {/* Custom Component */}
        {currentStep.customComponent && (
          <div className="mb-4">
            {currentStep.customComponent}
          </div>
        )}

        {/* Tips Section */}
        {currentStep.tips && currentStep.tips.length > 0 && (
          <div className="mb-4">
            <button
              onClick={toggleHint}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Star size={14} />
              {showHint ? 'Hide Tips' : 'Show Tips'}
            </button>
            
            {showHint && (
              <animated.div style={fadeInStyle} className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Star size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">{currentStep.tips[hintIndex]}</p>
                    {currentStep.tips.length > 1 && (
                      <button
                        onClick={nextHint}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Next tip ({hintIndex + 1}/{currentStep.tips.length})
                      </button>
                    )}
                  </div>
                </div>
              </animated.div>
            )}
          </div>
        )}

        {/* Action Required Indicator */}
        {currentStep.actionRequired && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <animated.div style={bounceStyle}>
              <ArrowRight className="text-yellow-600" size={16} />
            </animated.div>
            <span className="text-sm text-yellow-800 font-medium">
              Action required to continue
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderNavigationButtons = () => (
    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={isFirstStep}
          leftIcon={<ArrowLeft size={16} />}
        >
          Previous
        </Button>
        
        {showSkipOption && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            leftIcon={<SkipForward size={16} />}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip Tutorial
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          leftIcon={<X size={16} />}
        >
          Close
        </Button>
        
        <Button
          variant="primary"
          size="sm"
          onClick={handleNext}
          rightIcon={isLastStep ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
          disabled={currentStep?.actionRequired && currentStep?.validationFn && !currentStep.validationFn()}
        >
          {isLastStep ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );

  const renderTutorialCard = () => (
    <animated.div 
      className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-blue-200"
      style={slideInStyle}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
              {TUTORIAL_ICONS[currentTutorial?.category || 'basic']}
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-800">{currentTutorial?.title}</h2>
              <p className="text-sm text-blue-600">{currentTutorial?.description}</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {renderProgressBar()}
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        {renderNavigationButtons()}
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          Use <kbd className="bg-gray-200 px-1 rounded">←→</kbd> arrows, <kbd className="bg-gray-200 px-1 rounded">Space</kbd> to navigate, <kbd className="bg-gray-200 px-1 rounded">H</kbd> for hints, <kbd className="bg-gray-200 px-1 rounded">Esc</kbd> to close
        </div>
      </div>
    </animated.div>
  );

  if (!isOpen || !currentTutorial) return null;

  return (
    <animated.div 
      ref={overlayRef}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {renderTutorialCard()}
    </animated.div>
  );
};

// Tutorial step builder utility
export const createTutorialStep = (step: Partial<TutorialStep> & { id: string; title: string; content: string }): TutorialStep => ({
  type: 'info',
  position: 'center',
  skipable: true,
  actionRequired: false,
  ...step
});

// Common tutorial steps library
export const COMMON_TUTORIAL_STEPS = {
  welcome: createTutorialStep({
    id: 'welcome',
    title: 'Welcome to Feral Friends!',
    content: 'Welcome to your adventure! In this game, you\'ll explore beautiful worlds and befriend amazing animals through patience and kindness.',
    icon: <Heart size={20} />,
    type: 'info',
    autoAdvance: 5000
  }),
  
  movement: createTutorialStep({
    id: 'movement',
    title: 'How to Move',
    content: 'Tap anywhere on the screen to move to that location. Your character will automatically find a path and walk there.',
    icon: <Navigation size={20} />,
    type: 'demonstration',
    targetElement: '.game-canvas',
    tips: [
      'Try tapping on different areas to see your character move',
      'You can also use the directional controls if available',
      'Your character will avoid obstacles automatically'
    ]
  }),
  
  animals: createTutorialStep({
    id: 'animals',
    title: 'Meeting Animals',
    content: 'When you see an animal, approach slowly and carefully. Different animals have different personalities and may react differently to your presence.',
    icon: <Users size={20} />,
    type: 'interaction',
    actionRequired: true,
    tips: [
      'Slow movements are less scary to animals',
      'Watch for the animal\'s reaction - they show emotions!',
      'Some animals are naturally more shy than others'
    ]
  }),
  
  inventory: createTutorialStep({
    id: 'inventory',
    title: 'Using Your Inventory',
    content: 'You can carry items to help befriend animals. Different animals like different types of food and toys.',
    icon: <Package size={20} />,
    type: 'demonstration',
    targetElement: '.inventory-button'
  })
};

export default Tutorial;