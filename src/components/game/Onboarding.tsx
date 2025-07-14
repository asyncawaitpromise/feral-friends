import React, { useState, useEffect, useCallback } from 'react';
import { animated } from '@react-spring/web';
import { 
  Play, 
  ArrowRight, 
  Star, 
  Heart, 
  Users, 
  MapPin, 
  Package,
  Settings,
  CheckCircle,
  SkipForward,
  Zap
} from 'react-feather';
import { useSlideIn, useFadeIn, useStagger } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import { Tutorial, TutorialConfig, COMMON_TUTORIAL_STEPS, createTutorialStep } from './Tutorial';
import Button from '../ui/Button';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  playerName?: string;
  showWelcome?: boolean;
  gameVersion?: string;
}

interface OnboardingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tutorial?: TutorialConfig;
  action?: () => void;
  completed: boolean;
  required: boolean;
}

const ONBOARDING_TUTORIALS: Record<string, TutorialConfig> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Feral Friends',
    description: 'Learn the basics of your new adventure',
    category: 'basic',
    steps: [
      {
        ...COMMON_TUTORIAL_STEPS.welcome,
        content: 'Welcome to Feral Friends! You\'re about to embark on a magical journey where you\'ll explore beautiful worlds and befriend amazing creatures through patience, kindness, and understanding.'
      },
      createTutorialStep({
        id: 'game_concept',
        title: 'Your Mission',
        content: 'Unlike other games, there\'s no combat here. Instead, you\'ll win hearts through gentle approaches, tasty treats, and patient friendship building.',
        icon: <Heart size={20} />,
        type: 'info',
        tips: [
          'Every animal has its own personality',
          'Building trust takes time and patience',
          'Some animals are naturally more friendly than others'
        ]
      }),
      createTutorialStep({
        id: 'exploration',
        title: 'Explore & Discover',
        content: 'The world is full of different biomes, each home to unique animals. Explore meadows, forests, streams, and more to meet new friends!',
        icon: <MapPin size={20} />,
        type: 'info'
      })
    ]
  },
  
  movement: {
    id: 'movement',
    title: 'Movement & Navigation',
    description: 'Learn how to move around the world',
    category: 'movement',
    steps: [
      {
        ...COMMON_TUTORIAL_STEPS.movement,
        actionRequired: true,
        validationFn: () => {
          // This would check if player has moved at least once
          return localStorage.getItem('tutorial-movement-completed') === 'true';
        }
      },
      createTutorialStep({
        id: 'camera',
        title: 'Camera Following',
        content: 'Notice how the camera smoothly follows your character as you move. This helps you see the world around you as you explore.',
        icon: <MapPin size={20} />,
        type: 'demonstration',
        autoAdvance: 4000
      }),
      createTutorialStep({
        id: 'exploration_encourage',
        title: 'Start Exploring!',
        content: 'Try moving to different areas. Each terrain type may be home to different animals. Look for grass, water, flowers, and other interesting spots!',
        icon: <Zap size={20} />,
        type: 'action',
        tips: [
          'Animals often appear near their preferred habitats',
          'Water areas might have aquatic creatures',
          'Flower patches attract butterflies and small animals'
        ]
      })
    ]
  },
  
  animals: {
    id: 'animals',
    title: 'Meeting Your First Animal',
    description: 'Learn how to interact with wildlife',
    category: 'animals',
    steps: [
      createTutorialStep({
        id: 'animal_spotting',
        title: 'Spotting Animals',
        content: 'Look around for moving creatures! Animals will wander around their territories, and each has different behaviors and schedules.',
        icon: <Users size={20} />,
        type: 'demonstration',
        tips: [
          'Animals show emotions with icons above their heads',
          'Different species have different movement patterns',
          'Some animals are more active at certain times'
        ]
      }),
      {
        ...COMMON_TUTORIAL_STEPS.animals,
        validationFn: () => {
          // This would check if player has approached an animal
          return localStorage.getItem('tutorial-animal-interaction-completed') === 'true';
        }
      },
      createTutorialStep({
        id: 'animal_emotions',
        title: 'Understanding Emotions',
        content: 'Animals express themselves through emote icons. Happy animals might show hearts, while scared ones might show exclamation marks. Learn to read their feelings!',
        icon: <Heart size={20} />,
        type: 'info',
        tips: [
          '❤️ means the animal is happy or content',
          '❗ means the animal is alert or cautious',
          '😴 means the animal is resting or sleepy',
          '🎈 means the animal is playful'
        ]
      })
    ]
  },
  
  inventory: {
    id: 'inventory',
    title: 'Items & Inventory',
    description: 'Learn about collecting and using items',
    category: 'inventory',
    steps: [
      {
        ...COMMON_TUTORIAL_STEPS.inventory,
        actionRequired: true,
        validationFn: () => {
          return localStorage.getItem('tutorial-inventory-opened') === 'true';
        }
      },
      createTutorialStep({
        id: 'item_types',
        title: 'Types of Items',
        content: 'You\'ll find different types of items: Food (fruits, nuts), Toys (balls, sticks), Tools (nets, brushes), and Special items for advanced interactions.',
        icon: <Package size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'item_usage',
        title: 'Using Items with Animals',
        content: 'Different animals prefer different items. Rabbits love carrots, while birds might prefer seeds. Experiment to discover preferences!',
        icon: <Heart size={20} />,
        type: 'info',
        tips: [
          'Try different foods with different animals',
          'Some items work better with certain species',
          'Rare items can have special effects'
        ]
      })
    ]
  }
};

export const Onboarding: React.FC<OnboardingProps> = ({
  isOpen,
  onComplete,
  onSkip,
  playerName = 'Explorer',
  showWelcome = true,
  gameVersion = '1.0'
}) => {
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [showingTutorial, setShowingTutorial] = useState(false);
  const [onboardingStages, setOnboardingStages] = useState<OnboardingStage[]>([]);
  const [allCompleted, setAllCompleted] = useState(false);

  const { playButtonClick, playSuccess, playMenuOpen } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen && !showingTutorial, 'up');
  const fadeInStyle = useFadeIn(isOpen);
  const staggeredStages = useStagger(onboardingStages, 150);

  // Initialize onboarding stages
  useEffect(() => {
    const stages: OnboardingStage[] = [
      {
        id: 'welcome',
        title: 'Welcome to Feral Friends!',
        description: 'Learn about your magical adventure',
        icon: <Star size={24} />,
        tutorial: ONBOARDING_TUTORIALS.welcome,
        completed: false,
        required: true
      },
      {
        id: 'movement',
        title: 'Movement & Controls',
        description: 'Learn how to navigate the world',
        icon: <MapPin size={24} />,
        tutorial: ONBOARDING_TUTORIALS.movement,
        completed: false,
        required: true
      },
      {
        id: 'animals',
        title: 'Meeting Animals',
        description: 'Learn to interact with wildlife',
        icon: <Users size={24} />,
        tutorial: ONBOARDING_TUTORIALS.animals,
        completed: false,
        required: true
      },
      {
        id: 'inventory',
        title: 'Items & Inventory',
        description: 'Discover tools and treats',
        icon: <Package size={24} />,
        tutorial: ONBOARDING_TUTORIALS.inventory,
        completed: false,
        required: false
      }
    ];

    setOnboardingStages(stages);
  }, []);

  // Check if all required stages are completed
  useEffect(() => {
    const requiredStages = onboardingStages.filter(stage => stage.required);
    const completedRequired = requiredStages.filter(stage => completedStages.has(stage.id));
    setAllCompleted(completedRequired.length === requiredStages.length);
  }, [completedStages, onboardingStages]);

  // Play sound when onboarding opens
  useEffect(() => {
    if (isOpen && !showingTutorial) {
      playMenuOpen();
    }
  }, [isOpen, showingTutorial, playMenuOpen]);

  const handleStageClick = (stageId: string) => {
    playButtonClick();
    const stage = onboardingStages.find(s => s.id === stageId);
    
    if (stage?.tutorial) {
      setCurrentStage(stageId);
      setShowingTutorial(true);
    } else if (stage?.action) {
      stage.action();
    }
  };

  const handleTutorialComplete = useCallback((tutorialId: string) => {
    setCompletedStages(prev => new Set([...prev, tutorialId]));
    setShowingTutorial(false);
    setCurrentStage(null);
    playSuccess();

    // Update localStorage to track completion
    localStorage.setItem(`onboarding-${tutorialId}-completed`, 'true');
  }, [playSuccess]);

  const handleTutorialSkip = useCallback(() => {
    setShowingTutorial(false);
    setCurrentStage(null);
  }, []);

  const handleCompleteOnboarding = () => {
    playSuccess();
    localStorage.setItem('onboarding-completed', 'true');
    onComplete();
  };

  const handleSkipOnboarding = () => {
    playButtonClick();
    localStorage.setItem('onboarding-skipped', 'true');
    onSkip();
  };

  const renderWelcomeHeader = () => (
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart className="text-white" size={32} />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome, {playerName}!
      </h1>
      <p className="text-gray-600 max-w-md mx-auto">
        Let's get you started on your journey to befriend amazing animals and explore beautiful worlds.
      </p>
      <div className="text-xs text-gray-400 mt-2">
        Feral Friends v{gameVersion}
      </div>
    </div>
  );

  const renderStageCard = (stage: OnboardingStage) => {
    const isCompleted = completedStages.has(stage.id);
    const isAvailable = stage.required || isCompleted || completedStages.size > 0;

    return (
      <div
        className={`
          p-4 border rounded-lg cursor-pointer transition-all duration-200
          ${isCompleted 
            ? 'border-green-300 bg-green-50' 
            : isAvailable 
              ? 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:shadow-md' 
              : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          }
        `}
        onClick={() => isAvailable && handleStageClick(stage.id)}
      >
        <div className="flex items-start gap-3">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${isCompleted 
              ? 'bg-green-100 text-green-600' 
              : isAvailable 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-400'
            }
          `}>
            {isCompleted ? <CheckCircle size={24} /> : stage.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{stage.title}</h3>
              {stage.required && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  Required
                </span>
              )}
              {isCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  ✓ Complete
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{stage.description}</p>
            
            {isAvailable && !isCompleted && (
              <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm">
                <Play size={12} />
                Start Tutorial
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        {completedStages.size} of {onboardingStages.filter(s => s.required).length} required tutorials completed
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={handleSkipOnboarding}
          leftIcon={<SkipForward size={16} />}
          className="text-gray-500 hover:text-gray-700"
        >
          Skip All
        </Button>
        
        <Button
          variant="primary"
          onClick={handleCompleteOnboarding}
          disabled={!allCompleted}
          rightIcon={<CheckCircle size={16} />}
        >
          {allCompleted ? 'Start Playing!' : 'Complete Required Tutorials'}
        </Button>
      </div>
    </div>
  );

  const renderProgressOverview = () => {
    const totalRequired = onboardingStages.filter(s => s.required).length;
    const completedRequired = onboardingStages.filter(s => s.required && completedStages.has(s.id)).length;
    const progressPercentage = (completedRequired / totalRequired) * 100;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Onboarding Progress
          </span>
          <span className="text-sm text-gray-500">
            {completedRequired}/{totalRequired} complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Show tutorial if one is active
  if (showingTutorial && currentStage) {
    const tutorial = onboardingStages.find(s => s.id === currentStage)?.tutorial;
    
    return (
      <Tutorial
        isOpen={showingTutorial}
        onClose={handleTutorialSkip}
        currentTutorial={tutorial || null}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
        completedTutorials={Array.from(completedStages)}
        showSkipOption={true}
      />
    );
  }

  // Show main onboarding interface
  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        style={slideInStyle}
      >
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          {showWelcome && renderWelcomeHeader()}
          {renderProgressOverview()}
          
          <div className="space-y-4 mb-6">
            {staggeredStages((style, stage: OnboardingStage) => (
              <animated.div key={stage.id} style={style}>
                {renderStageCard(stage)}
              </animated.div>
            ))}
          </div>
          
          {renderFooter()}
        </div>
      </animated.div>
    </animated.div>
  );
};

export default Onboarding;