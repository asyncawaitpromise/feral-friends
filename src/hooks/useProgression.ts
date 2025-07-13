import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ProgressionMilestone {
  id: string;
  name: string;
  description: string;
  category: 'movement' | 'exploration' | 'animals' | 'interaction' | 'inventory' | 'social' | 'mastery';
  requirements: ProgressionRequirement[];
  unlocks: string[]; // Feature IDs that get unlocked
  rewards?: ProgressionReward[];
  priority: number; // Lower numbers = higher priority
  hidden?: boolean; // Don't show to player until unlocked
}

export interface ProgressionRequirement {
  type: 'action' | 'count' | 'time' | 'discovery' | 'achievement' | 'level';
  target: string; // What to track
  value: number; // Required amount
  description: string;
}

export interface ProgressionReward {
  type: 'feature' | 'item' | 'knowledge' | 'cosmetic';
  id: string;
  name: string;
  description: string;
}

export interface PlayerProgress {
  // Basic stats
  level: number;
  experience: number;
  totalPlayTime: number; // seconds
  
  // Exploration
  mapsVisited: string[];
  tilesExplored: number;
  locationsDiscovered: string[];
  
  // Animal interactions
  animalsDiscovered: string[];
  animalsSeen: Record<string, number>; // species -> count
  animalsInteractedWith: string[];
  animalsTamed: string[];
  animalsBefriended: string[];
  
  // Items & inventory
  itemsCollected: string[];
  itemTypesFound: string[];
  totalItemsGathered: number;
  
  // Skills & knowledge
  tricksLearned: string[];
  achievementsUnlocked: string[];
  tutorialsCompleted: string[];
  
  // Social & interaction
  conversationsHad: number;
  friendshipLevelsReached: Record<string, number>; // animalId -> level
  
  // Actions taken
  actionCounts: Record<string, number>; // action -> count
  
  // Milestones
  milestonesUnlocked: string[];
  featuresUnlocked: string[];
}

export interface UnlockedFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  unlockedAt: number; // timestamp
  seen: boolean; // Has player been notified?
}

// Default milestones for the game
const DEFAULT_MILESTONES: ProgressionMilestone[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Take your first steps in the world',
    category: 'movement',
    requirements: [
      { type: 'action', target: 'move', value: 1, description: 'Move to a new location' }
    ],
    unlocks: ['movement_tutorial', 'exploration_hint'],
    priority: 1
  },
  
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Explore different areas of the world',
    category: 'exploration',
    requirements: [
      { type: 'count', target: 'tilesExplored', value: 25, description: 'Explore 25 different locations' }
    ],
    unlocks: ['map_overview', 'exploration_achievements'],
    priority: 3
  },
  
  {
    id: 'animal_observer',
    name: 'Animal Observer',
    description: 'Discover your first animal',
    category: 'animals',
    requirements: [
      { type: 'count', target: 'animalsDiscovered', value: 1, description: 'Discover your first animal' }
    ],
    unlocks: ['animal_info_panel', 'proximity_indicators'],
    priority: 2
  },
  
  {
    id: 'animal_friend',
    name: 'Animal Friend',
    description: 'Successfully interact with an animal',
    category: 'interaction',
    requirements: [
      { type: 'count', target: 'animalsInteractedWith', value: 1, description: 'Interact with an animal' }
    ],
    unlocks: ['interaction_tutorial', 'emotion_system', 'trust_meters'],
    priority: 4
  },
  
  {
    id: 'collector',
    name: 'Collector',
    description: 'Find your first item',
    category: 'inventory',
    requirements: [
      { type: 'count', target: 'itemsCollected', value: 1, description: 'Collect your first item' }
    ],
    unlocks: ['inventory_system', 'item_categories', 'usage_hints'],
    priority: 5
  },
  
  {
    id: 'conversationalist',
    name: 'Conversationalist',
    description: 'Have meaningful conversations',
    category: 'social',
    requirements: [
      { type: 'count', target: 'conversationsHad', value: 3, description: 'Have 3 conversations with animals' }
    ],
    unlocks: ['dialogue_history', 'personality_insights', 'conversation_tips'],
    priority: 6
  },
  
  {
    id: 'nature_expert',
    name: 'Nature Expert',
    description: 'Discover many different animal species',
    category: 'animals',
    requirements: [
      { type: 'count', target: 'animalsDiscovered', value: 5, description: 'Discover 5 different animal species' }
    ],
    unlocks: ['species_guide', 'habitat_information', 'behavioral_insights'],
    priority: 8
  },
  
  {
    id: 'companion_keeper',
    name: 'Companion Keeper',
    description: 'Befriend your first animal companion',
    category: 'social',
    requirements: [
      { type: 'count', target: 'animalsBefriended', value: 1, description: 'Befriend an animal' }
    ],
    unlocks: ['companion_management', 'bond_activities', 'companion_benefits'],
    priority: 7
  },
  
  {
    id: 'experienced_explorer',
    name: 'Experienced Explorer',
    description: 'Spend significant time exploring',
    category: 'exploration',
    requirements: [
      { type: 'time', target: 'totalPlayTime', value: 1800, description: 'Play for 30 minutes total' }
    ],
    unlocks: ['advanced_features', 'achievement_system', 'progress_tracking'],
    priority: 10
  },
  
  {
    id: 'master_naturalist',
    name: 'Master Naturalist',
    description: 'Achieve mastery in animal interactions',
    category: 'mastery',
    requirements: [
      { type: 'count', target: 'animalsDiscovered', value: 10, description: 'Discover 10 animal species' },
      { type: 'count', target: 'animalsBefriended', value: 3, description: 'Befriend 3 animals' },
      { type: 'count', target: 'tricksLearned', value: 5, description: 'Learn 5 tricks' }
    ],
    unlocks: ['mastery_challenges', 'expert_mode', 'special_animals'],
    priority: 15,
    hidden: true
  }
];

// Feature definitions - what gets unlocked
const FEATURE_DEFINITIONS: Record<string, UnlockedFeature> = {
  movement_tutorial: {
    id: 'movement_tutorial',
    name: 'Movement Tutorial',
    description: 'Learn advanced movement techniques',
    category: 'tutorial',
    unlockedAt: 0,
    seen: false
  },
  animal_info_panel: {
    id: 'animal_info_panel',
    name: 'Animal Information',
    description: 'View detailed information about animals',
    category: 'interface',
    unlockedAt: 0,
    seen: false
  },
  inventory_system: {
    id: 'inventory_system',
    name: 'Inventory System',
    description: 'Manage your collected items',
    category: 'system',
    unlockedAt: 0,
    seen: false
  },
  companion_management: {
    id: 'companion_management',
    name: 'Companion Management',
    description: 'Track and interact with your animal friends',
    category: 'social',
    unlockedAt: 0,
    seen: false
  },
  achievement_system: {
    id: 'achievement_system',
    name: 'Achievement System',
    description: 'Track your accomplishments and progress',
    category: 'progression',
    unlockedAt: 0,
    seen: false
  }
};

export function useProgression() {
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('feral-friends-progression');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to load progression data:', error);
      }
    }
    
    // Default progress
    return {
      level: 1,
      experience: 0,
      totalPlayTime: 0,
      mapsVisited: [],
      tilesExplored: 0,
      locationsDiscovered: [],
      animalsDiscovered: [],
      animalsSeen: {},
      animalsInteractedWith: [],
      animalsTamed: [],
      animalsBefriended: [],
      itemsCollected: [],
      itemTypesFound: [],
      totalItemsGathered: 0,
      tricksLearned: [],
      achievementsUnlocked: [],
      tutorialsCompleted: [],
      conversationsHad: 0,
      friendshipLevelsReached: {},
      actionCounts: {},
      milestonesUnlocked: [],
      featuresUnlocked: []
    };
  });

  const [unlockedFeatures, setUnlockedFeatures] = useState<Record<string, UnlockedFeature>>({});
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('feral-friends-progression', JSON.stringify(playerProgress));
  }, [playerProgress]);

  // Check for newly unlocked milestones
  const checkMilestones = useCallback(() => {
    const newlyUnlocked: string[] = [];
    
    for (const milestone of DEFAULT_MILESTONES) {
      // Skip if already unlocked
      if (playerProgress.milestonesUnlocked.includes(milestone.id)) {
        continue;
      }
      
      // Check if all requirements are met
      const allRequirementsMet = milestone.requirements.every(req => {
        switch (req.type) {
          case 'action':
            return (playerProgress.actionCounts[req.target] || 0) >= req.value;
          case 'count':
            const targetValue = getProgressValue(playerProgress, req.target);
            return targetValue >= req.value;
          case 'time':
            return playerProgress.totalPlayTime >= req.value;
          case 'discovery':
            return playerProgress.locationsDiscovered.includes(req.target);
          case 'achievement':
            return playerProgress.achievementsUnlocked.includes(req.target);
          case 'level':
            return playerProgress.level >= req.value;
          default:
            return false;
        }
      });
      
      if (allRequirementsMet) {
        newlyUnlocked.push(milestone.id);
        
        // Unlock associated features
        for (const featureId of milestone.unlocks) {
          if (!playerProgress.featuresUnlocked.includes(featureId)) {
            const feature = FEATURE_DEFINITIONS[featureId];
            if (feature) {
              setUnlockedFeatures(prev => ({
                ...prev,
                [featureId]: {
                  ...feature,
                  unlockedAt: Date.now(),
                  seen: false
                }
              }));
            }
          }
        }
      }
    }
    
    if (newlyUnlocked.length > 0) {
      setPlayerProgress(prev => ({
        ...prev,
        milestonesUnlocked: [...prev.milestonesUnlocked, ...newlyUnlocked],
        featuresUnlocked: [
          ...prev.featuresUnlocked,
          ...newlyUnlocked.flatMap(id => 
            DEFAULT_MILESTONES.find(m => m.id === id)?.unlocks || []
          )
        ]
      }));
      
      setNewUnlocks(newlyUnlocked);
    }
  }, [playerProgress]);

  // Helper function to get progress values
  const getProgressValue = (progress: PlayerProgress, target: string): number => {
    switch (target) {
      case 'tilesExplored':
        return progress.tilesExplored;
      case 'animalsDiscovered':
        return progress.animalsDiscovered.length;
      case 'animalsInteractedWith':
        return progress.animalsInteractedWith.length;
      case 'animalsBefriended':
        return progress.animalsBefriended.length;
      case 'itemsCollected':
        return progress.itemsCollected.length;
      case 'tricksLearned':
        return progress.tricksLearned.length;
      case 'conversationsHad':
        return progress.conversationsHad;
      default:
        return 0;
    }
  };

  // Update progress functions
  const updateProgress = useCallback((updates: Partial<PlayerProgress>) => {
    setPlayerProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const trackAction = useCallback((action: string, count: number = 1) => {
    setPlayerProgress(prev => ({
      ...prev,
      actionCounts: {
        ...prev.actionCounts,
        [action]: (prev.actionCounts[action] || 0) + count
      }
    }));
  }, []);

  const addExperience = useCallback((amount: number) => {
    setPlayerProgress(prev => {
      const newExp = prev.experience + amount;
      const newLevel = Math.floor(newExp / 100) + 1; // Simple leveling formula
      
      return {
        ...prev,
        experience: newExp,
        level: Math.max(prev.level, newLevel)
      };
    });
  }, []);

  const discoverAnimal = useCallback((animalId: string, species: string) => {
    setPlayerProgress(prev => ({
      ...prev,
      animalsDiscovered: prev.animalsDiscovered.includes(animalId) 
        ? prev.animalsDiscovered 
        : [...prev.animalsDiscovered, animalId],
      animalsSeen: {
        ...prev.animalsSeen,
        [species]: (prev.animalsSeen[species] || 0) + 1
      }
    }));
  }, []);

  const collectItem = useCallback((itemId: string, itemType: string) => {
    setPlayerProgress(prev => ({
      ...prev,
      itemsCollected: prev.itemsCollected.includes(itemId)
        ? prev.itemsCollected
        : [...prev.itemsCollected, itemId],
      itemTypesFound: prev.itemTypesFound.includes(itemType)
        ? prev.itemTypesFound
        : [...prev.itemTypesFound, itemType],
      totalItemsGathered: prev.totalItemsGathered + 1
    }));
  }, []);

  // Get available milestones (not hidden or already unlocked)
  const availableMilestones = useMemo(() => {
    return DEFAULT_MILESTONES
      .filter(milestone => 
        !milestone.hidden && 
        !playerProgress.milestonesUnlocked.includes(milestone.id)
      )
      .sort((a, b) => a.priority - b.priority);
  }, [playerProgress.milestonesUnlocked]);

  // Get progress towards next milestones
  const milestoneProgress = useMemo(() => {
    return availableMilestones.map(milestone => {
      const progress = milestone.requirements.map(req => {
        const currentValue = req.type === 'action' 
          ? (playerProgress.actionCounts[req.target] || 0)
          : getProgressValue(playerProgress, req.target);
        
        return {
          requirement: req,
          current: currentValue,
          target: req.value,
          progress: Math.min(currentValue / req.value, 1),
          completed: currentValue >= req.value
        };
      });
      
      const overallProgress = progress.reduce((sum, p) => sum + p.progress, 0) / progress.length;
      const allCompleted = progress.every(p => p.completed);
      
      return {
        milestone,
        requirements: progress,
        overallProgress,
        completed: allCompleted
      };
    });
  }, [availableMilestones, playerProgress]);

  // Check for feature availability
  const isFeatureUnlocked = useCallback((featureId: string): boolean => {
    return playerProgress.featuresUnlocked.includes(featureId);
  }, [playerProgress.featuresUnlocked]);

  // Mark feature as seen
  const markFeatureAsSeen = useCallback((featureId: string) => {
    setUnlockedFeatures(prev => ({
      ...prev,
      [featureId]: prev[featureId] ? { ...prev[featureId], seen: true } : prev[featureId]
    }));
  }, []);

  // Clear new unlocks
  const clearNewUnlocks = useCallback(() => {
    setNewUnlocks([]);
  }, []);

  // Auto-check milestones when progress changes
  useEffect(() => {
    checkMilestones();
  }, [checkMilestones]);

  return {
    playerProgress,
    unlockedFeatures,
    newUnlocks,
    availableMilestones,
    milestoneProgress,
    
    // Actions
    updateProgress,
    trackAction,
    addExperience,
    discoverAnimal,
    collectItem,
    
    // Queries
    isFeatureUnlocked,
    
    // UI Management
    markFeatureAsSeen,
    clearNewUnlocks
  };
}

// Helper hook for checking if specific features should be shown
export function useFeatureGating() {
  const { isFeatureUnlocked } = useProgression();
  
  const shouldShowInventory = isFeatureUnlocked('inventory_system');
  const shouldShowAnimalInfo = isFeatureUnlocked('animal_info_panel');
  const shouldShowCompanionManagement = isFeatureUnlocked('companion_management');
  const shouldShowAchievements = isFeatureUnlocked('achievement_system');
  
  return {
    shouldShowInventory,
    shouldShowAnimalInfo,
    shouldShowCompanionManagement,
    shouldShowAchievements,
    isFeatureUnlocked
  };
}

export default useProgression;