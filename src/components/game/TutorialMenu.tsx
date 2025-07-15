import React, { useState } from 'react';
import { animated } from '@react-spring/web';
import { 
  X, 
  Play, 
  CheckCircle, 
  Star, 
  Heart, 
  Users, 
  Package, 
  Award, 
  Hexagon,
  Lock,
  BookOpen
} from 'react-feather';
import { useSlideIn, useFadeIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import { COMPREHENSIVE_TUTORIALS, TUTORIAL_CATEGORIES } from './ComprehensiveTutorials';
import Button from '../ui/Button';

interface TutorialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTutorial: (tutorialId: string) => void;
  completedTutorials: string[];
  playerLevel: number;
}

interface TutorialMenuItem {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'interaction' | 'advanced';
  level: number;
  completed: boolean;
  available: boolean;
  icon: React.ReactNode;
}

const CATEGORY_ICONS = {
  basic: <BookOpen size={20} />,
  interaction: <Heart size={20} />,
  advanced: <Hexagon size={20} />
};

const CATEGORY_COLORS = {
  basic: 'blue',
  interaction: 'green',
  advanced: 'purple'
};

export const TutorialMenu: React.FC<TutorialMenuProps> = ({
  isOpen,
  onClose,
  onSelectTutorial,
  completedTutorials,
  playerLevel
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'interaction' | 'advanced'>('basic');
  const { playButtonClick, playMenuOpen, playMenuClose } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen, 'up');
  const fadeInStyle = useFadeIn(isOpen);

  // Play sound effects
  React.useEffect(() => {
    if (isOpen) {
      playMenuOpen();
    } else {
      playMenuClose();
    }
  }, [isOpen, playMenuOpen, playMenuClose]);

  // Get tutorial menu items
  const getTutorialMenuItems = (): TutorialMenuItem[] => {
    return Object.entries(COMPREHENSIVE_TUTORIALS).map(([id, tutorial]) => {
      const unlockLevel = tutorial.unlockConditions?.playerLevel || 1;
      const isCompleted = completedTutorials.includes(id);
      const isAvailable = playerLevel >= unlockLevel;
      
      // Check prerequisites
      const hasPrerequisites = !tutorial.prerequisites || 
        tutorial.prerequisites.every(prereq => completedTutorials.includes(prereq));

      return {
        id,
        title: tutorial.title,
        description: tutorial.description,
        category: tutorial.category as 'basic' | 'interaction' | 'advanced',
        level: unlockLevel,
        completed: isCompleted,
        available: isAvailable && hasPrerequisites,
        icon: CATEGORY_ICONS[tutorial.category as keyof typeof CATEGORY_ICONS]
      };
    });
  };

  const tutorialItems = getTutorialMenuItems();

  const handleTutorialSelect = (tutorialId: string) => {
    playButtonClick();
    onSelectTutorial(tutorialId);
    onClose();
  };

  const renderCategoryTabs = () => (
    <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
      {(['basic', 'interaction', 'advanced'] as const).map(category => {
        const categoryItems = tutorialItems.filter(item => item.category === category);
        const completedInCategory = categoryItems.filter(item => item.completed).length;
        const availableInCategory = categoryItems.filter(item => item.available).length;
        const color = CATEGORY_COLORS[category];
        
        return (
          <button
            key={category}
            onClick={() => {
              playButtonClick();
              setSelectedCategory(category);
            }}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? `bg-white text-${color}-600 shadow-sm`
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {CATEGORY_ICONS[category]}
              <span className="capitalize">{category}</span>
            </div>
            <div className="text-xs opacity-75">
              {completedInCategory}/{availableInCategory} complete
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderTutorialCard = (item: TutorialMenuItem) => {
    const color = CATEGORY_COLORS[item.category];
    
    return (
      <div
        key={item.id}
        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
          item.completed
            ? 'border-green-200 bg-green-50'
            : item.available
            ? `border-${color}-200 bg-${color}-50 hover:bg-${color}-100 cursor-pointer`
            : 'border-gray-200 bg-gray-50 opacity-60'
        }`}
        onClick={() => item.available && handleTutorialSelect(item.id)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            item.completed
              ? 'bg-green-100 text-green-600'
              : item.available
              ? `bg-${color}-100 text-${color}-600`
              : 'bg-gray-100 text-gray-400'
          }`}>
            {item.completed ? <CheckCircle size={20} /> : item.available ? item.icon : <Lock size={20} />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{item.title}</h3>
              {!item.available && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Level {item.level}
                </span>
              )}
              {item.completed && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  ✓ Completed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
            
            {item.available && !item.completed && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Play size={12} />
                Start Tutorial
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProgressSummary = () => {
    const totalTutorials = tutorialItems.length;
    const completedCount = tutorialItems.filter(item => item.completed).length;
    const availableCount = tutorialItems.filter(item => item.available).length;
    const progressPercentage = (completedCount / totalTutorials) * 100;

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Tutorial Progress
          </span>
          <span className="text-sm text-gray-600">
            {completedCount}/{totalTutorials} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {availableCount} tutorials available at your level
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={slideInStyle}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Tutorial Library</h2>
                <p className="text-sm text-gray-600">Choose any tutorial to learn or review</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {renderProgressSummary()}
          {renderCategoryTabs()}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {tutorialItems
              .filter(item => item.category === selectedCategory)
              .sort((a, b) => a.level - b.level)
              .map(item => renderTutorialCard(item))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Tutorials help you master all aspects of Feral Friends
            </div>
            
            <Button
              variant="ghost"
              onClick={onClose}
              leftIcon={<X size={16} />}
            >
              Close
            </Button>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
}; 