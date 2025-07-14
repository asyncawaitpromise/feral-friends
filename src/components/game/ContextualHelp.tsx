import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animated } from '@react-spring/web';
import { 
  HelpCircle, 
  X, 
  Zap, 
  MousePointer,
  Heart,
  Star,
  Package,
  Users
} from 'react-feather';
import { useBounce, useFadeIn, useSlideIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';

export interface HelpContext {
  area: string; // Current game area/screen
  playerLevel: number;
  recentActions: string[];
  currentObjectives: string[];
  timeInArea: number; // seconds
  strugglingIndicators: string[]; // Things player might be having trouble with
}

export interface ContextualTip {
  id: string;
  title: string;
  content: string;
  icon?: React.ReactNode;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'movement' | 'interaction' | 'inventory' | 'animals' | 'general' | 'troubleshooting';
  triggers: HelpTrigger[];
  conditions: HelpCondition[];
  maxShowCount?: number; // How many times this tip can be shown
  cooldownPeriod?: number; // Milliseconds before showing again
  targetElement?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  autoShow?: boolean; // Show automatically when conditions met
  dismissible?: boolean;
  actionButtons?: HelpAction[];
}

export interface HelpTrigger {
  type: 'time_in_area' | 'action_performed' | 'element_hovered' | 'lack_of_progress' | 'specific_context' | 'repeated_failure';
  target?: string;
  threshold?: number;
  comparison?: 'greater' | 'less' | 'equal';
}

export interface HelpCondition {
  type: 'player_level' | 'feature_unlocked' | 'tutorial_completed' | 'first_time' | 'area_match' | 'struggle_detected';
  target?: string;
  value?: any;
}

export interface HelpAction {
  id: string;
  label: string;
  action: 'dismiss' | 'show_tutorial' | 'open_guide' | 'highlight_element' | 'custom';
  target?: string;
  customHandler?: () => void;
}

interface ContextualHelpProps {
  context: HelpContext;
  onTipDismissed?: (tipId: string) => void;
  onActionTriggered?: (tipId: string, actionId: string) => void;
  isVisible?: boolean;
  enableAutoTips?: boolean;
}

// Predefined contextual tips
const CONTEXTUAL_TIPS: ContextualTip[] = [
  {
    id: 'first_movement',
    title: 'How to Move Around',
    content: 'Tap anywhere on the screen to move to that location. Your character will automatically find a path!',
    icon: <MousePointer size={16} />,
    priority: 'high',
    category: 'movement',
    triggers: [
      { type: 'time_in_area', threshold: 10000 } // 10 seconds in area without moving
    ],
    conditions: [
      { type: 'first_time', target: 'movement_tip' },
      { type: 'area_match', value: 'game' }
    ],
    targetElement: '.game-canvas',
    position: 'center',
    autoShow: true,
    maxShowCount: 2,
    actionButtons: [
      { id: 'got_it', label: 'Got it!', action: 'dismiss' },
      { id: 'show_tutorial', label: 'Show Tutorial', action: 'show_tutorial', target: 'movement' }
    ]
  },
  
  {
    id: 'animal_approach',
    title: 'Approaching Animals',
    content: 'Move slowly towards animals to avoid scaring them. Watch their emotions - they\'ll show you how they feel!',
    icon: <Heart size={16} />,
    priority: 'high',
    category: 'animals',
    triggers: [
      { type: 'specific_context', target: 'near_animal' },
      { type: 'repeated_failure', target: 'animal_scared', threshold: 2 }
    ],
    conditions: [
      { type: 'first_time', target: 'animal_approach_tip' }
    ],
    autoShow: true,
    maxShowCount: 3,
    actionButtons: [
      { id: 'understand', label: 'I understand', action: 'dismiss' },
      { id: 'learn_more', label: 'Learn more about animals', action: 'show_tutorial', target: 'animals' }
    ]
  },
  
  {
    id: 'inventory_reminder',
    title: 'Check Your Inventory',
    content: 'You can collect items to help befriend animals. Tap the inventory button to see what you have!',
    icon: <Package size={16} />,
    priority: 'medium',
    category: 'inventory',
    triggers: [
      { type: 'action_performed', target: 'item_collected', threshold: 1 }
    ],
    conditions: [
      { type: 'feature_unlocked', target: 'inventory_system' },
      { type: 'first_time', target: 'inventory_reminder' }
    ],
    targetElement: '.inventory-button',
    position: 'bottom',
    autoShow: true,
    actionButtons: [
      { id: 'open_inventory', label: 'Open Inventory', action: 'custom' },
      { id: 'later', label: 'Maybe later', action: 'dismiss' }
    ]
  },
  
  {
    id: 'struggling_with_animals',
    title: 'Having Trouble with Animals?',
    content: 'Animals have different personalities. Try different approaches: some like treats, others prefer toys, and some just want gentle patience.',
    icon: <Zap size={16} />,
    priority: 'medium',
    category: 'troubleshooting',
    triggers: [
      { type: 'repeated_failure', target: 'interaction_failed', threshold: 3 },
      { type: 'lack_of_progress', target: 'animal_friendship', threshold: 5 }
    ],
    conditions: [
      { type: 'struggle_detected', target: 'animal_interactions' }
    ],
    autoShow: true,
    cooldownPeriod: 300000, // 5 minutes
    actionButtons: [
      { id: 'show_tips', label: 'Show me tips', action: 'open_guide', target: 'animal_interaction_guide' },
      { id: 'keep_trying', label: 'I\'ll keep trying', action: 'dismiss' }
    ]
  },
  
  {
    id: 'exploration_encouragement',
    title: 'Keep Exploring!',
    content: 'Different areas have different animals. Try exploring meadows, forests, and water areas to meet new friends!',
    icon: <Star size={16} />,
    priority: 'low',
    category: 'general',
    triggers: [
      { type: 'time_in_area', threshold: 120000 } // 2 minutes in same area
    ],
    conditions: [
      { type: 'player_level', value: 1 }
    ],
    autoShow: true,
    maxShowCount: 1,
    cooldownPeriod: 600000 // 10 minutes
  },
  
  {
    id: 'companion_management',
    title: 'Managing Companions',
    content: 'You\'ve befriended an animal! Check your companion list to see their status and interact with them.',
    icon: <Users size={16} />,
    priority: 'high',
    category: 'animals',
    triggers: [
      { type: 'action_performed', target: 'animal_befriended', threshold: 1 }
    ],
    conditions: [
      { type: 'feature_unlocked', target: 'companion_management' },
      { type: 'first_time', target: 'companion_tip' }
    ],
    targetElement: '.companion-button',
    position: 'bottom',
    autoShow: true,
    actionButtons: [
      { id: 'show_companions', label: 'Show Companions', action: 'custom' },
      { id: 'dismiss', label: 'Got it', action: 'dismiss' }
    ]
  }
];

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  context,
  onTipDismissed,
  onActionTriggered,
  isVisible = true,
  enableAutoTips = true
}) => {
  const [activeTip, setActiveTip] = useState<ContextualTip | null>(null);
  const [shownTips, setShownTips] = useState<Record<string, number>>({});
  const [lastShownTimes, setLastShownTimes] = useState<Record<string, number>>({});
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [helpButtonVisible, setHelpButtonVisible] = useState(true);
  
  const checkInterval = useRef<number>();
  const { playSuccess, playButtonClick } = useSound();

  // Animation hooks
  const bounceStyle = useBounce(isHighlighting, 1.1);
  const fadeInStyle = useFadeIn(!!activeTip);
  const slideInStyle = useSlideIn(!!activeTip, 'up');

  // Load shown tips from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contextual-help-shown');
    if (saved) {
      try {
        setShownTips(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load contextual help data:', error);
      }
    }
  }, []);

  // Save shown tips to localStorage
  useEffect(() => {
    localStorage.setItem('contextual-help-shown', JSON.stringify(shownTips));
  }, [shownTips]);

  // Check for applicable tips
  const checkForApplicableTips = useCallback(() => {
    if (!enableAutoTips || activeTip) return;

    const now = Date.now();
    
    for (const tip of CONTEXTUAL_TIPS) {
      // Check if tip has been shown too many times
      const showCount = shownTips[tip.id] || 0;
      if (tip.maxShowCount && showCount >= tip.maxShowCount) continue;
      
      // Check cooldown period
      const lastShown = lastShownTimes[tip.id];
      if (lastShown && tip.cooldownPeriod && (now - lastShown) < tip.cooldownPeriod) continue;
      
      // Check conditions
      const conditionsMet = tip.conditions.every(condition => {
        switch (condition.type) {
          case 'player_level':
            return context.playerLevel >= (condition.value || 1);
          case 'first_time':
            return !shownTips[condition.target || tip.id];
          case 'area_match':
            return context.area === condition.value;
          case 'struggle_detected':
            return context.strugglingIndicators.includes(condition.target || '');
          case 'feature_unlocked':
            // This would integrate with the progression system
            return true; // Simplified for now
          case 'tutorial_completed':
            // This would check tutorial completion
            return true; // Simplified for now
          default:
            return true;
        }
      });
      
      if (!conditionsMet) continue;
      
      // Check triggers
      const triggersMet = tip.triggers.some(trigger => {
        switch (trigger.type) {
          case 'time_in_area':
            return context.timeInArea >= (trigger.threshold || 0);
          case 'action_performed':
            const actionCount = context.recentActions.filter(a => a === trigger.target).length;
            return actionCount >= (trigger.threshold || 1);
          case 'lack_of_progress':
            return context.timeInArea > (trigger.threshold || 60000) && 
                   context.currentObjectives.length > 0;
          case 'repeated_failure':
            const failureCount = context.strugglingIndicators.filter(s => s === trigger.target).length;
            return failureCount >= (trigger.threshold || 1);
          case 'specific_context':
            return context.currentObjectives.includes(trigger.target || '');
          default:
            return false;
        }
      });
      
      if (triggersMet && tip.autoShow) {
        showTip(tip);
        break; // Only show one tip at a time
      }
    }
  }, [context, enableAutoTips, activeTip, shownTips, lastShownTimes]);

  // Show a specific tip
  const showTip = useCallback((tip: ContextualTip) => {
    setActiveTip(tip);
    setShownTips(prev => ({ ...prev, [tip.id]: (prev[tip.id] || 0) + 1 }));
    setLastShownTimes(prev => ({ ...prev, [tip.id]: Date.now() }));
    
    // Highlight target element if specified
    if (tip.targetElement) {
      const element = document.querySelector(tip.targetElement);
      if (element) {
        setIsHighlighting(true);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
          setIsHighlighting(false);
        }, 3000);
      }
    }
    
    playSuccess();
  }, [playSuccess]);

  // Dismiss current tip
  const dismissTip = useCallback((tipId: string) => {
    setActiveTip(null);
    setIsHighlighting(false);
    onTipDismissed?.(tipId);
    playButtonClick();
  }, [onTipDismissed, playButtonClick]);

  // Handle action button clicks
  const handleAction = useCallback((tip: ContextualTip, action: HelpAction) => {
    switch (action.action) {
      case 'dismiss':
        dismissTip(tip.id);
        break;
      case 'show_tutorial':
        onActionTriggered?.(tip.id, action.id);
        dismissTip(tip.id);
        break;
      case 'open_guide':
        onActionTriggered?.(tip.id, action.id);
        break;
      case 'highlight_element':
        if (action.target) {
          const element = document.querySelector(action.target);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setIsHighlighting(true);
            setTimeout(() => setIsHighlighting(false), 2000);
          }
        }
        break;
      case 'custom':
        action.customHandler?.();
        onActionTriggered?.(tip.id, action.id);
        break;
    }
  }, [dismissTip, onActionTriggered]);

  // Manual help button handler
  const handleHelpButtonClick = () => {
    // Show a general help tip or the most relevant tip
    const relevantTip = CONTEXTUAL_TIPS.find(tip => 
      tip.category === 'general' || 
      tip.conditions.some(c => c.type === 'area_match' && c.value === context.area)
    );
    
    if (relevantTip) {
      showTip(relevantTip);
    }
  };

  // Set up periodic checking
  useEffect(() => {
    if (enableAutoTips) {
      checkInterval.current = window.setInterval(checkForApplicableTips, 5000); // Check every 5 seconds
      
      return () => {
        if (checkInterval.current) {
          clearInterval(checkInterval.current);
        }
      };
    }
  }, [checkForApplicableTips, enableAutoTips]);

  // Check immediately when context changes
  useEffect(() => {
    if (enableAutoTips) {
      checkForApplicableTips();
    }
  }, [context, checkForApplicableTips, enableAutoTips]);

  const renderTip = () => {
    if (!activeTip) return null;

    const positionClasses = {
      top: 'top-4',
      bottom: 'bottom-4',
      left: 'left-4 top-1/2 transform -translate-y-1/2',
      right: 'right-4 top-1/2 transform -translate-y-1/2',
      center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    };

    const priorityColors = {
      low: 'border-blue-200 bg-blue-50',
      medium: 'border-yellow-200 bg-yellow-50',
      high: 'border-orange-200 bg-orange-50',
      urgent: 'border-red-200 bg-red-50'
    };

    return (
      <animated.div 
        className={`
          fixed z-50 max-w-sm p-4 rounded-lg border-2 shadow-lg
          ${positionClasses[activeTip.position || 'center']}
          ${priorityColors[activeTip.priority]}
        `}
        style={slideInStyle}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {activeTip.icon || <HelpCircle size={20} />}
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">
              {activeTip.title}
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              {activeTip.content}
            </p>
            
            {activeTip.actionButtons && activeTip.actionButtons.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {activeTip.actionButtons.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(activeTip, action)}
                    className={`
                      px-3 py-1 text-xs rounded-md transition-colors
                      ${action.action === 'dismiss' 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {activeTip.dismissible !== false && (
            <button
              onClick={() => dismissTip(activeTip.id)}
              className="flex-shrink-0 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </animated.div>
    );
  };

  const renderHelpButton = () => {
    if (!isVisible || !helpButtonVisible) return null;

    return (
      <animated.button
        onClick={handleHelpButtonClick}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
        style={bounceStyle}
        title="Get help"
      >
        <HelpCircle size={24} />
      </animated.button>
    );
  };

  if (!isVisible) return null;

  return (
    <>
      {renderTip()}
      {renderHelpButton()}
    </>
  );
};

// Hook for managing contextual help state
export function useContextualHelp(initialContext: Partial<HelpContext> = {}) {
  const [context, setContext] = useState<HelpContext>({
    area: 'game',
    playerLevel: 1,
    recentActions: [],
    currentObjectives: [],
    timeInArea: 0,
    strugglingIndicators: [],
    ...initialContext
  });

  const updateContext = useCallback((updates: Partial<HelpContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  const addRecentAction = useCallback((action: string) => {
    setContext(prev => ({
      ...prev,
      recentActions: [...prev.recentActions.slice(-9), action] // Keep last 10 actions
    }));
  }, []);

  const addStruggleIndicator = useCallback((indicator: string) => {
    setContext(prev => ({
      ...prev,
      strugglingIndicators: [...prev.strugglingIndicators, indicator]
    }));
  }, []);

  const clearStruggleIndicators = useCallback(() => {
    setContext(prev => ({
      ...prev,
      strugglingIndicators: []
    }));
  }, []);

  const setObjectives = useCallback((objectives: string[]) => {
    setContext(prev => ({
      ...prev,
      currentObjectives: objectives
    }));
  }, []);

  return {
    context,
    updateContext,
    addRecentAction,
    addStruggleIndicator,
    clearStruggleIndicators,
    setObjectives
  };
}

export default ContextualHelp;