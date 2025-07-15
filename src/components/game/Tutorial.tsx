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
  SkipForward,
  CheckCircle,
  Zap,
  MapPin
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
  showSkipOption = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);
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
      setHintIndex(prev => (prev + 1) % (currentStep.tips?.length || 1));
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
        {currentStep.tips && (currentStep.tips?.length || 0) > 0 && (
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
                    <p className="text-sm text-blue-800">{currentStep.tips?.[hintIndex]}</p>
                    {(currentStep.tips?.length || 0) > 1 && (
                      <button
                        onClick={nextHint}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Next tip ({hintIndex + 1}/{currentStep.tips?.length || 0})
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
  }),

  // New comprehensive tutorial steps
  taming_basics: createTutorialStep({
    id: 'taming_basics',
    title: 'Understanding Taming',
    content: 'Taming is about building trust with animals through patient interactions. Each animal has a trust level from 0-100 that determines what interactions are available.',
    icon: <Heart size={20} />,
    type: 'info',
    tips: [
      'Trust levels unlock new interaction types',
      'Different animals prefer different approaches',
      'Building trust takes time and patience'
    ]
  }),

  trust_levels: createTutorialStep({
    id: 'trust_levels',
    title: 'Trust Levels Explained',
    content: 'Animals progress through trust levels: Fearful → Wary → Curious → Accepting → Friendly → Bonded. Each level unlocks new interactions and abilities.',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Fearful animals will flee - give them space',
      'Curious animals might approach you first',
      'Bonded animals can become companions'
    ]
  }),

  interaction_types: createTutorialStep({
    id: 'interaction_types',
    title: 'Types of Interactions',
    content: 'You can Observe, Approach, Offer Food, Gentle Touch, Play, Speak Softly, or Give Space. Each interaction affects trust differently based on the animal\'s personality.',
    icon: <MousePointer size={20} />,
    type: 'demonstration',
    targetElement: '.interaction-panel',
    tips: [
      'Observe is safe and always available',
      'Food offering builds trust quickly',
      'Some interactions require items or trust levels'
    ]
  }),

  animal_personalities: createTutorialStep({
    id: 'animal_personalities',
    title: 'Animal Personalities',
    content: 'Each animal has a unique personality: Shy, Friendly, Curious, Playful, or Aggressive. Understanding personality helps you choose the right approach.',
    icon: <Users size={20} />,
    type: 'info',
    tips: [
      'Shy animals prefer gentle, slow approaches',
      'Playful animals love games and toys',
      'Aggressive animals need patience and space'
    ]
  }),

  bonding_system: createTutorialStep({
    id: 'bonding_system',
    title: 'Building Bonds',
    content: 'As trust grows, you develop deeper bonds with animals. Bonded animals can become companions, learn tricks, and even help you in competitions.',
    icon: <Heart size={20} />,
    type: 'info',
    tips: [
      'Bonds unlock special abilities',
      'Companions follow you around',
      'Strong bonds enable trick teaching'
    ]
  }),

  trick_system: createTutorialStep({
    id: 'trick_system',
    title: 'Teaching Tricks',
    content: 'Once you\'ve built sufficient trust, you can teach animals tricks! Different animals learn different tricks based on their species and personality.',
    icon: <Zap size={20} />,
    type: 'demonstration',
    targetElement: '.trick-interface',
    tips: [
      'Start with simple tricks like "sit" and "stay"',
      'Practice makes perfect - repetition improves mastery',
      'Some tricks require specific items or environments'
    ]
  }),

  exploration_mechanics: createTutorialStep({
    id: 'exploration_mechanics',
    title: 'Exploring the World',
    content: 'The world has different biomes: meadows, forests, streams, caves, and hills. Each biome is home to different animals and contains unique items.',
    icon: <MapPin size={20} />,
    type: 'info',
    tips: [
      'Forest animals prefer shaded areas',
      'Stream animals need water nearby',
      'Cave animals are often nocturnal'
    ]
  }),

  item_gathering: createTutorialStep({
    id: 'item_gathering',
    title: 'Gathering Items',
    content: 'You can find food, toys, and special items throughout the world. Different items attract different animals and have various uses.',
    icon: <Package size={20} />,
    type: 'demonstration',
    targetElement: '.gathering-interface',
    tips: [
      'Berries and nuts are common animal foods',
      'Toys help with playful interactions',
      'Special items unlock advanced features'
    ]
  }),

  progression_system: createTutorialStep({
    id: 'progression_system',
    title: 'Character Progression',
    content: 'Gain experience by discovering animals, successful interactions, and completing achievements. Leveling up unlocks new areas and abilities.',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Experience comes from all interactions',
      'Achievements provide bonus experience',
      'Higher levels unlock rare animals'
    ]
  }),

  achievement_system: createTutorialStep({
    id: 'achievement_system',
    title: 'Achievements & Goals',
    content: 'Complete achievements to earn rewards and track your progress. Achievements range from simple tasks to challenging long-term goals.',
    icon: <CheckCircle size={20} />,
    type: 'demonstration',
    targetElement: '.achievement-panel',
    tips: [
      'Check achievements regularly for goals',
      'Some achievements unlock special content',
      'Rare achievements give prestigious titles'
    ]
  }),

  competition_basics: createTutorialStep({
    id: 'competition_basics',
    title: 'Competitions & Shows',
    content: 'Once you\'ve trained animals and taught them tricks, you can enter competitions! Show off your bond and your animal\'s abilities.',
    icon: <Users size={20} />,
    type: 'info',
    tips: [
      'Different competitions test different skills',
      'Strong bonds improve performance',
      'Winning competitions unlocks new content'
    ]
  }),

  rare_animals: createTutorialStep({
    id: 'rare_animals',
    title: 'Rare & Special Animals',
    content: 'Some animals are rare variants with unique colors or abilities. These special animals appear under specific conditions and offer unique rewards.',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Rare animals may appear at certain times',
      'Some rare animals have special requirements',
      'Legendary animals are extremely rare and powerful'
    ]
  }),

  companion_management: createTutorialStep({
    id: 'companion_management',
    title: 'Managing Companions',
    content: 'Bonded animals can become companions who follow you around. Manage your active companions and their needs through the companion interface.',
    icon: <Users size={20} />,
    type: 'demonstration',
    targetElement: '.companion-panel',
    tips: [
      'Companions need care and attention',
      'Active companions can help with tasks',
      'You can have multiple companions'
    ]
  }),

  advanced_interactions: createTutorialStep({
    id: 'advanced_interactions',
    title: 'Advanced Interactions',
    content: 'As you progress, unlock advanced interactions like grooming, training, and cooperative activities. These deepen your bond and provide new gameplay options.',
    icon: <Eye size={20} />,
    type: 'info',
    tips: [
      'Advanced interactions require high trust',
      'Some interactions are species-specific',
      'Mastering advanced interactions unlocks new content'
    ]
  }),

  seasonal_events: createTutorialStep({
    id: 'seasonal_events',
    title: 'Seasonal Events',
    content: 'The world changes with seasons and special events. Some animals only appear during certain seasons, and events offer unique rewards.',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Check for seasonal animals regularly',
      'Events often have time-limited rewards',
      'Some achievements are season-specific'
    ]
  }),

  endgame_content: createTutorialStep({
    id: 'endgame_content',
    title: 'Mastery & Endgame',
    content: 'Advanced players can pursue mastery challenges, legendary animal encounters, and prestigious competitions. The journey never truly ends!',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Mastery challenges test your skills',
      'Legendary animals are the ultimate goal',
      'Endgame content provides long-term goals'
    ]
  })
};

// Comprehensive tutorial configurations
export const COMPREHENSIVE_TUTORIALS: Record<string, TutorialConfig> = {
  // Basic tutorials (existing)
  welcome: {
    id: 'welcome',
    title: 'Welcome to Feral Friends',
    description: 'Learn the basics of your new adventure',
    category: 'basic',
    steps: [
      COMMON_TUTORIAL_STEPS.welcome,
      createTutorialStep({
        id: 'game_concept',
        title: 'Your Mission',
        content: 'Unlike other games, there\'s no combat here. Instead, you\'ll win hearts through gentle approaches, tasty treats, and patient friendship building.',
        icon: <Heart size={20} />,
        type: 'info'
      }),
      COMMON_TUTORIAL_STEPS.exploration_mechanics
    ]
  },

  movement: {
    id: 'movement',
    title: 'Movement & Navigation',
    description: 'Master moving around the world',
    category: 'movement',
    steps: [
      COMMON_TUTORIAL_STEPS.movement,
      createTutorialStep({
        id: 'camera_following',
        title: 'Camera System',
        content: 'The camera follows your character smoothly. You can see more of the world as you explore different areas.',
        icon: <Eye size={20} />,
        type: 'demonstration',
        autoAdvance: 4000
      }),
      createTutorialStep({
        id: 'map_boundaries',
        title: 'Map Boundaries',
        content: 'Each area has boundaries. When you reach an edge, you might find a transition to a new area with different animals and environments.',
        icon: <MapPin size={20} />,
        type: 'info'
      })
    ]
  },

  // New comprehensive tutorials
  taming_system: {
    id: 'taming_system',
    title: 'Animal Taming System',
    description: 'Master the art of befriending animals',
    category: 'interaction',
    unlockConditions: { animalsDiscovered: 1 },
    steps: [
      COMMON_TUTORIAL_STEPS.taming_basics,
      COMMON_TUTORIAL_STEPS.trust_levels,
      COMMON_TUTORIAL_STEPS.interaction_types,
      COMMON_TUTORIAL_STEPS.animal_personalities,
      COMMON_TUTORIAL_STEPS.bonding_system,
      createTutorialStep({
        id: 'taming_practice',
        title: 'Practice Taming',
        content: 'Now try taming an animal! Start with observation, then try gentle approaches. Watch how the animal reacts and adjust your strategy.',
        icon: <Heart size={20} />,
        type: 'action',
        actionRequired: true,
        tips: [
          'Start with the safest interactions',
          'Watch the animal\'s body language',
          'Don\'t rush - patience is key'
        ]
      })
    ]
  },

  trick_teaching: {
    id: 'trick_teaching',
    title: 'Teaching Tricks',
    description: 'Learn to teach animals amazing tricks',
    category: 'advanced',
    prerequisites: ['taming_system'],
    unlockConditions: { playerLevel: 3 },
    steps: [
      COMMON_TUTORIAL_STEPS.trick_system,
      createTutorialStep({
        id: 'trick_categories',
        title: 'Types of Tricks',
        content: 'Tricks are categorized by difficulty: Basic (sit, stay), Intermediate (spin, shake), Advanced (dance, perform), and Master (species-specific special tricks).',
        icon: <Star size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'teaching_process',
        title: 'The Teaching Process',
        content: 'Teaching involves demonstration, practice, and reinforcement. Use gestures, rewards, and patience to help animals learn.',
        icon: <MousePointer size={20} />,
        type: 'demonstration',
        targetElement: '.trick-teaching-interface'
      }),
      createTutorialStep({
        id: 'practice_tricks',
        title: 'Practice Teaching',
        content: 'Try teaching a basic trick to a bonded animal. Start with "sit" - it\'s the easiest trick and builds confidence for both you and the animal.',
        icon: <Zap size={20} />,
        type: 'action',
        actionRequired: true
      })
    ]
  },

  exploration_mastery: {
    id: 'exploration_mastery',
    title: 'World Exploration',
    description: 'Discover all the secrets of the world',
    category: 'basic',
    steps: [
      COMMON_TUTORIAL_STEPS.exploration_mechanics,
      createTutorialStep({
        id: 'biome_types',
        title: 'Understanding Biomes',
        content: 'Each biome has unique characteristics: Meadows (open, sunny), Forests (shaded, dense), Streams (water, rocks), Caves (dark, quiet), Hills (elevated, windy).',
        icon: <MapPin size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'animal_habitats',
        title: 'Animal Habitats',
        content: 'Animals prefer specific habitats. Rabbits love meadows, squirrels prefer forests, frogs stay near water, and bats live in caves.',
        icon: <Users size={20} />,
        type: 'info'
      }),
      COMMON_TUTORIAL_STEPS.item_gathering,
      createTutorialStep({
        id: 'exploration_rewards',
        title: 'Exploration Rewards',
        content: 'Exploring thoroughly rewards you with rare items, hidden animals, and special locations. Some areas only unlock after meeting certain conditions.',
        icon: <Star size={20} />,
        type: 'info'
      })
    ]
  },

  progression_mastery: {
    id: 'progression_mastery',
    title: 'Character Progression',
    description: 'Understand leveling, achievements, and unlocks',
    category: 'basic',
    steps: [
      COMMON_TUTORIAL_STEPS.progression_system,
      createTutorialStep({
        id: 'experience_sources',
        title: 'Gaining Experience',
        content: 'Earn XP from: discovering animals (+25), successful interactions (+5-15), taming animals (+50), teaching tricks (+30), winning competitions (+150).',
        icon: <Star size={20} />,
        type: 'info'
      }),
      COMMON_TUTORIAL_STEPS.achievement_system,
      createTutorialStep({
        id: 'unlocks_system',
        title: 'Unlocks & Rewards',
        content: 'Leveling up unlocks new areas, advanced interactions, rare animals, and special abilities. Check your progression regularly!',
        icon: <CheckCircle size={20} />,
        type: 'demonstration',
        targetElement: '.progression-panel'
      })
    ]
  },

  inventory_mastery: {
    id: 'inventory_mastery',
    title: 'Items & Inventory',
    description: 'Master item collection and usage',
    category: 'inventory',
    steps: [
      COMMON_TUTORIAL_STEPS.inventory,
      createTutorialStep({
        id: 'item_categories',
        title: 'Item Categories',
        content: 'Items are categorized as: Food (berries, nuts, seeds), Toys (balls, sticks, ribbons), Tools (brushes, nets), and Special (rare magical items).',
        icon: <Package size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'item_effects',
        title: 'Item Effects',
        content: 'Different items have different effects: Food increases trust and happiness, toys enable play interactions, tools unlock grooming and care.',
        icon: <Star size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'inventory_management',
        title: 'Managing Your Inventory',
        content: 'Your inventory has limited space. Organize items by type, use them strategically, and store extras in safe locations.',
        icon: <Package size={20} />,
        type: 'demonstration',
        targetElement: '.inventory-interface'
      })
    ]
  },

  competition_system: {
    id: 'competition_system',
    title: 'Competitions & Shows',
    description: 'Enter competitions and show off your skills',
    category: 'advanced',
    prerequisites: ['trick_teaching'],
    unlockConditions: { playerLevel: 5 },
    steps: [
      COMMON_TUTORIAL_STEPS.competition_basics,
      createTutorialStep({
        id: 'competition_types',
        title: 'Types of Competitions',
        content: 'Competitions include: Agility (movement skills), Trick Shows (performed tricks), Bonding Contests (relationship strength), Beauty Pageants (appearance).',
        icon: <Star size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'preparation',
        title: 'Preparing for Competition',
        content: 'Success requires: strong animal bonds, mastered tricks, proper grooming, and understanding the competition requirements.',
        icon: <CheckCircle size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'competition_strategy',
        title: 'Competition Strategy',
        content: 'Choose the right animal for each competition, practice beforehand, and pay attention to the judges\' preferences.',
        icon: <Eye size={20} />,
        type: 'info'
      })
    ]
  },

  advanced_features: {
    id: 'advanced_features',
    title: 'Advanced Features',
    description: 'Unlock the full potential of the game',
    category: 'advanced',
    prerequisites: ['taming_system', 'progression_mastery'],
    unlockConditions: { playerLevel: 10 },
    steps: [
      COMMON_TUTORIAL_STEPS.rare_animals,
      COMMON_TUTORIAL_STEPS.companion_management,
      COMMON_TUTORIAL_STEPS.advanced_interactions,
      createTutorialStep({
        id: 'breeding_system',
        title: 'Animal Breeding',
        content: 'Advanced players can breed compatible animals to create offspring with unique traits and abilities.',
        icon: <Heart size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'habitat_creation',
        title: 'Creating Habitats',
        content: 'Build custom habitats for your animal friends with decorations, food sources, and comfort items.',
        icon: <MapPin size={20} />,
        type: 'info'
      })
    ]
  },

  endgame_mastery: {
    id: 'endgame_mastery',
    title: 'Mastery & Endgame',
    description: 'Achieve true mastery of animal friendship',
    category: 'advanced',
    prerequisites: ['advanced_features', 'competition_system'],
    unlockConditions: { playerLevel: 20 },
    steps: [
      COMMON_TUTORIAL_STEPS.endgame_content,
      createTutorialStep({
        id: 'mastery_challenges',
        title: 'Mastery Challenges',
        content: 'Complete challenging tasks that test your skills: tame legendary animals, win championship competitions, achieve perfect bonds.',
        icon: <Star size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'legendary_animals',
        title: 'Legendary Encounters',
        content: 'Seek out legendary animals - rare, powerful creatures that appear only under special conditions and offer incredible rewards.',
        icon: <Star size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'community_features',
        title: 'Community & Sharing',
        content: 'Share your achievements, trade items with other players, and participate in community events and challenges.',
        icon: <Users size={20} />,
        type: 'info'
      })
    ]
  }
};

export default Tutorial;