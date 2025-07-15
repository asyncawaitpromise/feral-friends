import React, { useState, useEffect, useCallback } from 'react';
import { animated } from '@react-spring/web';
import { 
  Play, 
  Star, 
  Heart, 
  Users, 
  MapPin, 
  Package,
  CheckCircle,
  SkipForward,
  Zap,
  Award,
  Eye,
  Hexagon,
  Target,
  BookOpen
} from 'react-feather';
import { useSlideIn, useFadeIn, useStagger } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import { Tutorial, TutorialConfig } from './Tutorial';
import { COMPREHENSIVE_TUTORIALS, TUTORIAL_CATEGORIES } from './ComprehensiveTutorials';
import Button from '../ui/Button';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  playerName?: string;
  playerLevel?: number;
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
  level: number;
  category: 'basic' | 'interaction' | 'advanced';
}

export const Onboarding: React.FC<OnboardingProps> = ({
  isOpen,
  onComplete,
  onSkip,
  playerName = 'Explorer',
  playerLevel = 1,
  showWelcome = true,
  gameVersion = '1.0'
}) => {
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [showingTutorial, setShowingTutorial] = useState(false);
  const [onboardingStages, setOnboardingStages] = useState<OnboardingStage[]>([]);
  const [allCompleted, setAllCompleted] = useState(false);
  const [currentTab, setCurrentTab] = useState<'basic' | 'interaction' | 'advanced'>('basic');

  const { playButtonClick, playSuccess, playMenuOpen } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen && !showingTutorial, 'up');
  const fadeInStyle = useFadeIn(isOpen);
  // const staggeredStages = useStagger(onboardingStages.filter(s => s.category === currentTab), 150);

  // Initialize onboarding stages based on comprehensive tutorials
  useEffect(() => {
    const stages: OnboardingStage[] = [
      // Basic tutorials
      {
        id: 'welcome',
        title: 'Welcome to Feral Friends!',
        description: 'Learn about your magical adventure',
        icon: <Star size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.welcome,
        completed: false,
        required: true,
        level: 1,
        category: 'basic'
      },
      {
        id: 'movement_basics',
        title: 'Movement & Navigation',
        description: 'Learn how to move around the world',
        icon: <MapPin size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.movement_basics,
        completed: false,
        required: true,
        level: 1,
        category: 'basic'
      },
      {
        id: 'exploration_mastery',
        title: 'World Exploration',
        description: 'Discover biomes and hidden areas',
        icon: <Eye size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.exploration_mastery,
        completed: false,
        required: false,
        level: 2,
        category: 'basic'
      },
      {
        id: 'inventory_mastery',
        title: 'Items & Inventory',
        description: 'Master item collection and usage',
        icon: <Package size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.inventory_mastery,
        completed: false,
        required: false,
        level: 3,
        category: 'basic'
      },
      {
        id: 'progression_mastery',
        title: 'Character Progression',
        description: 'Understand leveling and achievements',
        icon: <Award size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.progression_mastery,
        completed: false,
        required: false,
        level: 5,
        category: 'basic'
      },

      // Interaction tutorials
      {
        id: 'taming_fundamentals',
        title: 'Animal Taming',
        description: 'Master the art of befriending animals',
        icon: <Heart size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.taming_fundamentals,
        completed: false,
        required: true,
        level: 2,
        category: 'interaction'
      },
      {
        id: 'trick_mastery',
        title: 'Teaching Tricks',
        description: 'Learn to train animals with amazing abilities',
        icon: <Zap size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.trick_mastery,
        completed: false,
        required: false,
        level: 3,
        category: 'interaction'
      },
      {
        id: 'competition_mastery',
        title: 'Competitions & Shows',
        description: 'Enter competitions and showcase your skills',
        icon: <Award size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.competition_mastery,
        completed: false,
        required: false,
        level: 5,
        category: 'interaction'
      },

      // Advanced tutorials
      {
        id: 'advanced_features',
        title: 'Advanced Features',
        description: 'Unlock the full potential of the game',
        icon: <Star size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.advanced_features,
        completed: false,
        required: false,
        level: 10,
        category: 'advanced'
      },
      {
        id: 'seasonal_mastery',
        title: 'Seasonal Events',
        description: 'Master seasonal gameplay mechanics',
        icon: <Target size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.seasonal_mastery,
        completed: false,
        required: false,
        level: 8,
        category: 'advanced'
      },
      {
        id: 'breeding_mastery',
        title: 'Animal Breeding',
        description: 'Master the breeding system',
        icon: <Heart size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.breeding_mastery,
        completed: false,
        required: false,
        level: 15,
        category: 'advanced'
      },
      {
        id: 'habitat_mastery',
        title: 'Habitat Creation',
        description: 'Learn to create perfect habitats',
        icon: <BookOpen size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.habitat_mastery,
        completed: false,
        required: false,
        level: 12,
        category: 'advanced'
      },
      {
        id: 'endgame_mastery',
        title: 'Mastery & Endgame',
        description: 'Achieve true mastery of animal friendship',
        icon: <Hexagon size={24} />,
        tutorial: COMPREHENSIVE_TUTORIALS.endgame_mastery,
        completed: false,
        required: false,
        level: 20,
        category: 'advanced'
      }
    ];

    // Load completion status from localStorage
    const completedTutorials = new Set<string>();
    stages.forEach(stage => {
      if (localStorage.getItem(`tutorial-${stage.id}-completed`) === 'true') {
        stage.completed = true;
        completedTutorials.add(stage.id);
      }
    });

    setOnboardingStages(stages);
    setCompletedStages(completedTutorials);
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
    localStorage.setItem(`tutorial-${tutorialId}-completed`, 'true');
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
        Feral Friends v{gameVersion} • Level {playerLevel}
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
      {(['basic', 'interaction', 'advanced'] as const).map(tab => {
        const tabStages = onboardingStages.filter(s => s.category === tab);
        const completedInTab = tabStages.filter(s => completedStages.has(s.id)).length;
        const availableInTab = tabStages.filter(s => s.level <= playerLevel).length;
        
        return (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              currentTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="capitalize">{tab}</div>
            <div className="text-xs opacity-75">
              {completedInTab}/{availableInTab}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderStageCard = (stage: OnboardingStage, index: number) => {
    const isCompleted = completedStages.has(stage.id);
    const isAvailable = stage.level <= playerLevel;
    const isLocked = !isAvailable;

    return (
      <div
        key={stage.id}
        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
          isCompleted 
            ? 'border-green-200 bg-green-50 hover:bg-green-100' 
            : isAvailable
            ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
            : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
        }`}
        onClick={() => isAvailable && handleStageClick(stage.id)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isCompleted 
              ? 'bg-green-100 text-green-600' 
              : isAvailable
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {isCompleted ? <CheckCircle size={20} /> : stage.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{stage.title}</h3>
              {stage.required && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  Required
                </span>
              )}
              {isLocked && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Level {stage.level}
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

  const renderFooter = () => {
    const currentTabStages = onboardingStages.filter(s => s.category === currentTab);
    const requiredStages = onboardingStages.filter(s => s.required);
    const completedRequired = requiredStages.filter(s => completedStages.has(s.id)).length;
    const totalRequired = requiredStages.length;

    return (
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {completedRequired} of {totalRequired} required tutorials completed
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
  };

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
            {completedRequired}/{totalRequired} required complete
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

  // Main onboarding interface
  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={(e) => e.target === e.currentTarget && handleSkipOnboarding()}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={slideInStyle}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 border-b border-gray-200">
          {renderWelcomeHeader()}
          {renderProgressOverview()}
          {renderTabs()}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {onboardingStages
              .filter(stage => stage.category === currentTab)
              .map((stage, index) => renderStageCard(stage, index))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {renderFooter()}
        </div>
      </animated.div>
    </animated.div>
  );
};

export default Onboarding;