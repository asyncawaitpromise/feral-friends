// Achievement System
// Handles discovery, bonding, mastery, and exploration achievements

export type AchievementCategory = 'discovery' | 'bonding' | 'mastery' | 'exploration' | 'competition' | 'special';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  
  // Progress tracking
  requirements: AchievementRequirement[];
  currentProgress: Record<string, number>;
  isCompleted: boolean;
  completedAt?: number;
  
  // Rewards
  experience: number;
  coins?: number;
  unlocks?: string[];
  title?: string;
  badge?: string;
  
  // Display
  icon: string;
  hidden?: boolean; // Secret achievements
}

export interface AchievementRequirement {
  type: 'discover_species' | 'tame_animals' | 'learn_tricks' | 'visit_biomes' | 'win_competitions' | 'bond_level' | 'rare_encounters' | 'time_played' | 'special_action';
  target: number;
  species?: string;
  biome?: string;
  trick?: string;
  rarity?: string;
}

// Achievement definitions
export const ACHIEVEMENTS: Record<string, Omit<Achievement, 'currentProgress' | 'isCompleted' | 'completedAt'>> = {
  // Discovery Achievements
  firstFriend: {
    id: 'first_friend',
    name: 'First Friend',
    description: 'Successfully tame your first animal.',
    category: 'discovery',
    rarity: 'common',
    requirements: [{ type: 'tame_animals', target: 1 }],
    experience: 50,
    coins: 10,
    icon: '🤝'
  },

  animalLover: {
    id: 'animal_lover',
    name: 'Animal Lover',
    description: 'Tame 10 different animals.',
    category: 'discovery',
    rarity: 'uncommon',
    requirements: [{ type: 'tame_animals', target: 10 }],
    experience: 200,
    coins: 50,
    title: 'Animal Lover',
    icon: '❤️'
  },

  zookeeper: {
    id: 'zookeeper',
    name: 'Zookeeper',
    description: 'Tame 25 different animals.',
    category: 'discovery',
    rarity: 'rare',
    requirements: [{ type: 'tame_animals', target: 25 }],
    experience: 500,
    coins: 150,
    unlocks: ['advanced_taming_techniques'],
    title: 'Zookeeper',
    icon: '🦁'
  },

  masterTamer: {
    id: 'master_tamer',
    name: 'Master Tamer',
    description: 'Tame 50 different animals.',
    category: 'discovery',
    rarity: 'epic',
    requirements: [{ type: 'tame_animals', target: 50 }],
    experience: 1000,
    coins: 500,
    unlocks: ['legendary_taming_methods'],
    title: 'Master Tamer',
    badge: 'golden_paw',
    icon: '👑'
  },

  // Species-specific discoveries
  rabbitWhisperer: {
    id: 'rabbit_whisperer',
    name: 'Rabbit Whisperer',
    description: 'Discover and befriend 5 different rabbits.',
    category: 'discovery',
    rarity: 'common',
    requirements: [{ type: 'discover_species', target: 5, species: 'rabbit' }],
    experience: 75,
    coins: 25,
    title: 'Rabbit Whisperer',
    icon: '🐰'
  },

  birdWatcher: {
    id: 'bird_watcher',
    name: 'Bird Watcher',
    description: 'Discover 8 different bird species.',
    category: 'discovery',
    rarity: 'uncommon',
    requirements: [{ type: 'discover_species', target: 8, species: 'bird' }],
    experience: 150,
    coins: 40,
    title: 'Bird Watcher',
    icon: '🦅'
  },

  predatorFriend: {
    id: 'predator_friend',
    name: 'Predator Friend',
    description: 'Successfully tame a bear or wolf.',
    category: 'discovery',
    rarity: 'epic',
    requirements: [
      { type: 'tame_animals', target: 1, species: 'bear' },
      { type: 'tame_animals', target: 1, species: 'wolf' }
    ],
    experience: 300,
    coins: 100,
    title: 'Predator Friend',
    badge: 'brave_heart',
    icon: '🐺'
  },

  // Bonding Achievements
  trustedFriend: {
    id: 'trusted_friend',
    name: 'Trusted Friend',
    description: 'Reach maximum trust level with an animal.',
    category: 'bonding',
    rarity: 'uncommon',
    requirements: [{ type: 'bond_level', target: 100 }],
    experience: 100,
    coins: 30,
    icon: '💖'
  },

  heartCollector: {
    id: 'heart_collector',
    name: 'Heart Collector',
    description: 'Reach maximum trust with 5 different animals.',
    category: 'bonding',
    rarity: 'rare',
    requirements: [{ type: 'bond_level', target: 5 }],
    experience: 250,
    coins: 75,
    title: 'Heart Collector',
    icon: '💕'
  },

  soulMate: {
    id: 'soul_mate',
    name: 'Soul Mate',
    description: 'Maintain maximum trust with 10 animals simultaneously.',
    category: 'bonding',
    rarity: 'epic',
    requirements: [{ type: 'bond_level', target: 10 }],
    experience: 500,
    coins: 200,
    unlocks: ['empathy_boost'],
    title: 'Soul Mate',
    badge: 'golden_heart',
    icon: '💞'
  },

  // Mastery Achievements
  trickNovice: {
    id: 'trick_novice',
    name: 'Trick Novice',
    description: 'Teach your first trick to an animal.',
    category: 'mastery',
    rarity: 'common',
    requirements: [{ type: 'learn_tricks', target: 1 }],
    experience: 25,
    coins: 5,
    icon: '🎭'
  },

  trickTeacher: {
    id: 'trick_teacher',
    name: 'Trick Teacher',
    description: 'Teach 10 different tricks.',
    category: 'mastery',
    rarity: 'uncommon',
    requirements: [{ type: 'learn_tricks', target: 10 }],
    experience: 150,
    coins: 35,
    title: 'Trick Teacher',
    icon: '🎪'
  },

  trickMaster: {
    id: 'trick_master',
    name: 'Trick Master',
    description: 'Master all basic tricks with at least one animal.',
    category: 'mastery',
    rarity: 'rare',
    requirements: [
      { type: 'learn_tricks', target: 1, trick: 'sit' },
      { type: 'learn_tricks', target: 1, trick: 'stay' },
      { type: 'learn_tricks', target: 1, trick: 'spin' },
      { type: 'learn_tricks', target: 1, trick: 'jump' },
      { type: 'learn_tricks', target: 1, trick: 'shake' }
    ],
    experience: 300,
    coins: 100,
    unlocks: ['advanced_tricks'],
    title: 'Trick Master',
    icon: '🏆'
  },

  // Exploration Achievements
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visit 3 different biomes.',
    category: 'exploration',
    rarity: 'common',
    requirements: [{ type: 'visit_biomes', target: 3 }],
    experience: 75,
    coins: 20,
    icon: '🗺️'
  },

  adventurer: {
    id: 'adventurer',
    name: 'Adventurer',
    description: 'Visit 6 different biomes.',
    category: 'exploration',
    rarity: 'uncommon',
    requirements: [{ type: 'visit_biomes', target: 6 }],
    experience: 150,
    coins: 50,
    title: 'Adventurer',
    icon: '🏔️'
  },

  worldTraveler: {
    id: 'world_traveler',
    name: 'World Traveler',
    description: 'Visit all available biomes.',
    category: 'exploration',
    rarity: 'rare',
    requirements: [{ type: 'visit_biomes', target: 12 }],
    experience: 400,
    coins: 150,
    unlocks: ['fast_travel'],
    title: 'World Traveler',
    badge: 'compass_master',
    icon: '🌍'
  },

  // Competition Achievements
  competitor: {
    id: 'competitor',
    name: 'Competitor',
    description: 'Participate in your first competition.',
    category: 'competition',
    rarity: 'common',
    requirements: [{ type: 'win_competitions', target: 1 }],
    experience: 50,
    coins: 15,
    icon: '🏅'
  },

  champion: {
    id: 'champion',
    name: 'Champion',
    description: 'Win 5 competitions.',
    category: 'competition',
    rarity: 'rare',
    requirements: [{ type: 'win_competitions', target: 5 }],
    experience: 300,
    coins: 100,
    title: 'Champion',
    badge: 'victory_wreath',
    icon: '🏆'
  },

  grandChampion: {
    id: 'grand_champion',
    name: 'Grand Champion',
    description: 'Win the Grand Championship competition.',
    category: 'competition',
    rarity: 'legendary',
    requirements: [{ type: 'special_action', target: 1 }],
    experience: 1000,
    coins: 1000,
    unlocks: ['legendary_trainer_perks'],
    title: 'Grand Champion',
    badge: 'ultimate_trophy',
    icon: '👑'
  },

  // Special/Rare Achievements
  luckyEncounter: {
    id: 'lucky_encounter',
    name: 'Lucky Encounter',
    description: 'Discover your first rare animal variant.',
    category: 'special',
    rarity: 'uncommon',
    requirements: [{ type: 'rare_encounters', target: 1 }],
    experience: 200,
    coins: 75,
    title: 'Lucky One',
    icon: '🍀'
  },

  rarityCollector: {
    id: 'rarity_collector',
    name: 'Rarity Collector',
    description: 'Discover 5 different rare animal variants.',
    category: 'special',
    rarity: 'epic',
    requirements: [{ type: 'rare_encounters', target: 5 }],
    experience: 500,
    coins: 250,
    unlocks: ['rare_detector'],
    title: 'Rarity Collector',
    badge: 'rainbow_gem',
    icon: '💎'
  },

  legendaryFinder: {
    id: 'legendary_finder',
    name: 'Legendary Finder',
    description: 'Discover a legendary animal variant.',
    category: 'special',
    rarity: 'legendary',
    requirements: [{ type: 'rare_encounters', target: 1, rarity: 'legendary' }],
    experience: 1000,
    coins: 500,
    unlocks: ['legend_tracker'],
    title: 'Legend Finder',
    badge: 'legendary_star',
    icon: '⭐',
    hidden: true
  },

  dedicatedPlayer: {
    id: 'dedicated_player',
    name: 'Dedicated Player',
    description: 'Play for 10 hours total.',
    category: 'special',
    rarity: 'uncommon',
    requirements: [{ type: 'time_played', target: 36000000 }], // 10 hours in milliseconds
    experience: 200,
    coins: 50,
    title: 'Dedicated',
    icon: '⏰'
  },

  nightOwl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Discover 10 nocturnal animals.',
    category: 'special',
    rarity: 'rare',
    requirements: [{ type: 'special_action', target: 10 }],
    experience: 300,
    coins: 100,
    title: 'Night Owl',
    icon: '🦉'
  }
};

// Player achievement progress
export const playerAchievements: Map<string, Achievement> = new Map();

/**
 * Initialize achievement system for player
 */
export function initializeAchievements(): void {
  Object.values(ACHIEVEMENTS).forEach(template => {
    const achievement: Achievement = {
      ...template,
      currentProgress: {},
      isCompleted: false
    };

    // Initialize progress tracking
    achievement.requirements.forEach(req => {
      const key = `${req.type}_${req.species || req.biome || req.trick || req.rarity || 'general'}`;
      achievement.currentProgress[key] = 0;
    });

    playerAchievements.set(achievement.id, achievement);
  });
}

/**
 * Update achievement progress
 */
export function updateAchievementProgress(
  type: AchievementRequirement['type'],
  amount: number = 1,
  context?: {
    species?: string;
    biome?: string;
    trick?: string;
    rarity?: string;
  }
): Achievement[] {
  const completedAchievements: Achievement[] = [];

  playerAchievements.forEach(achievement => {
    if (achievement.isCompleted) return;

    achievement.requirements.forEach(requirement => {
      if (requirement.type !== type) return;

      // Check if requirement matches context
      if (requirement.species && requirement.species !== context?.species) return;
      if (requirement.biome && requirement.biome !== context?.biome) return;
      if (requirement.trick && requirement.trick !== context?.trick) return;
      if (requirement.rarity && requirement.rarity !== context?.rarity) return;

      // Update progress
      const key = `${requirement.type}_${requirement.species || requirement.biome || requirement.trick || requirement.rarity || 'general'}`;
      achievement.currentProgress[key] = Math.min(
        achievement.currentProgress[key] + amount,
        requirement.target
      );

      // Check if achievement is completed
      if (checkAchievementCompletion(achievement)) {
        achievement.isCompleted = true;
        achievement.completedAt = Date.now();
        completedAchievements.push(achievement);
      }
    });
  });

  return completedAchievements;
}

/**
 * Check if achievement requirements are met
 */
function checkAchievementCompletion(achievement: Achievement): boolean {
  return achievement.requirements.every(requirement => {
    const key = `${requirement.type}_${requirement.species || requirement.biome || requirement.trick || requirement.rarity || 'general'}`;
    return achievement.currentProgress[key] >= requirement.target;
  });
}

/**
 * Get achievement progress percentage
 */
export function getAchievementProgress(achievementId: string): number {
  const achievement = playerAchievements.get(achievementId);
  if (!achievement) return 0;

  if (achievement.isCompleted) return 100;

  let totalProgress = 0;
  let totalRequired = 0;

  achievement.requirements.forEach(requirement => {
    const key = `${requirement.type}_${requirement.species || requirement.biome || requirement.trick || requirement.rarity || 'general'}`;
    totalProgress += achievement.currentProgress[key];
    totalRequired += requirement.target;
  });

  return totalRequired > 0 ? Math.round((totalProgress / totalRequired) * 100) : 0;
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return Array.from(playerAchievements.values())
    .filter(achievement => achievement.category === category)
    .filter(achievement => !achievement.hidden || achievement.isCompleted);
}

/**
 * Get completed achievements
 */
export function getCompletedAchievements(): Achievement[] {
  return Array.from(playerAchievements.values())
    .filter(achievement => achievement.isCompleted)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
}

/**
 * Get achievements close to completion
 */
export function getAchievementsNearCompletion(threshold: number = 80): Achievement[] {
  return Array.from(playerAchievements.values())
    .filter(achievement => !achievement.isCompleted)
    .filter(achievement => getAchievementProgress(achievement.id) >= threshold)
    .filter(achievement => !achievement.hidden);
}

/**
 * Get total achievement stats
 */
export function getAchievementStats(): {
  total: number;
  completed: number;
  completionRate: number;
  totalExperience: number;
  totalCoins: number;
  unlockedTitles: string[];
  earnedBadges: string[];
} {
  const allAchievements = Array.from(playerAchievements.values());
  const completed = allAchievements.filter(a => a.isCompleted);
  
  const totalExperience = completed.reduce((sum, a) => sum + a.experience, 0);
  const totalCoins = completed.reduce((sum, a) => sum + (a.coins || 0), 0);
  const unlockedTitles = completed.filter(a => a.title).map(a => a.title!);
  const earnedBadges = completed.filter(a => a.badge).map(a => a.badge!);

  return {
    total: allAchievements.filter(a => !a.hidden).length,
    completed: completed.length,
    completionRate: Math.round((completed.length / allAchievements.filter(a => !a.hidden).length) * 100),
    totalExperience,
    totalCoins,
    unlockedTitles,
    earnedBadges
  };
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common': return '#FFFFFF';
    case 'uncommon': return '#32CD32';
    case 'rare': return '#4169E1';
    case 'epic': return '#9932CC';
    case 'legendary': return '#FFD700';
    default: return '#FFFFFF';
  }
}

/**
 * Award achievement manually (for special cases)
 */
export function awardAchievement(achievementId: string): boolean {
  const achievement = playerAchievements.get(achievementId);
  if (!achievement || achievement.isCompleted) {
    return false;
  }

  achievement.isCompleted = true;
  achievement.completedAt = Date.now();
  
  // Mark all requirements as completed
  achievement.requirements.forEach(requirement => {
    const key = `${requirement.type}_${requirement.species || requirement.biome || requirement.trick || requirement.rarity || 'general'}`;
    achievement.currentProgress[key] = requirement.target;
  });

  return true;
}

export default {
  ACHIEVEMENTS,
  playerAchievements,
  initializeAchievements,
  updateAchievementProgress,
  getAchievementProgress,
  getAchievementsByCategory,
  getCompletedAchievements,
  getAchievementsNearCompletion,
  getAchievementStats,
  getRarityColor,
  awardAchievement
};