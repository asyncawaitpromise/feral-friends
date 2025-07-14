// Progression System
// Handles player leveling, experience, unlocks, and content gating

export interface PlayerLevel {
  level: number;
  currentXP: number;
  xpToNext: number;
  totalXP: number;
}

export interface UnlockableContent {
  id: string;
  name: string;
  description: string;
  type: 'area' | 'trick' | 'item' | 'feature' | 'animal' | 'biome' | 'competition';
  requiredLevel: number;
  requiredAchievements?: string[];
  requiredCompletions?: string[];
  isUnlocked: boolean;
  unlockMessage: string;
}

export interface ExperienceSource {
  action: string;
  baseXP: number;
  description: string;
  category: 'discovery' | 'bonding' | 'mastery' | 'exploration' | 'competition' | 'special';
}

// Experience values for different actions
export const EXPERIENCE_SOURCES: Record<string, ExperienceSource> = {
  discoverAnimal: {
    action: 'discover_animal',
    baseXP: 25,
    description: 'Discover a new animal species',
    category: 'discovery'
  },
  
  discoverRareAnimal: {
    action: 'discover_rare_animal',
    baseXP: 100,
    description: 'Discover a rare animal variant',
    category: 'discovery'
  },
  
  tameAnimal: {
    action: 'tame_animal',
    baseXP: 50,
    description: 'Successfully tame an animal',
    category: 'bonding'
  },
  
  teachTrick: {
    action: 'teach_trick',
    baseXP: 30,
    description: 'Teach a new trick to an animal',
    category: 'mastery'
  },
  
  masterTrick: {
    action: 'master_trick',
    baseXP: 75,
    description: 'Master a trick with an animal',
    category: 'mastery'
  },
  
  exploreBiome: {
    action: 'explore_biome',
    baseXP: 40,
    description: 'Visit a new biome for the first time',
    category: 'exploration'
  },
  
  winCompetition: {
    action: 'win_competition',
    baseXP: 150,
    description: 'Win a competition',
    category: 'competition'
  },
  
  completeAchievement: {
    action: 'complete_achievement',
    baseXP: 100,
    description: 'Complete an achievement',
    category: 'special'
  },
  
  bondLevelUp: {
    action: 'bond_level_up',
    baseXP: 20,
    description: 'Increase bond level with an animal',
    category: 'bonding'
  },
  
  findItem: {
    action: 'find_item',
    baseXP: 15,
    description: 'Find an item while exploring',
    category: 'exploration'
  },
  
  feedAnimal: {
    action: 'feed_animal',
    baseXP: 5,
    description: 'Feed an animal their favorite food',
    category: 'bonding'
  },
  
  dailyPlay: {
    action: 'daily_play',
    baseXP: 20,
    description: 'Play the game daily',
    category: 'special'
  }
};

// Level progression curve (XP required for each level)
export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  
  // Exponential curve with diminishing returns
  const baseXP = 100;
  const multiplier = 1.15;
  const levelModifier = Math.pow(level - 1, 1.2);
  
  return Math.floor(baseXP * Math.pow(multiplier, level - 2) * levelModifier);
}

// Calculate total XP needed to reach a level
export function getTotalXPForLevel(level: number): number {
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += getXPRequiredForLevel(i);
  }
  return totalXP;
}

// Unlockable content definitions
export const UNLOCKABLE_CONTENT: Record<string, Omit<UnlockableContent, 'isUnlocked'>> = {
  // Areas
  forestDeep: {
    id: 'forest_deep',
    name: 'Deep Forest',
    description: 'A mysterious forest area with rare animals and hidden secrets.',
    type: 'area',
    requiredLevel: 5,
    unlockMessage: 'You can now explore the Deep Forest! New animals await discovery.'
  },
  
  mountainPeak: {
    id: 'mountain_peak',
    name: 'Mountain Peak',
    description: 'The highest mountain area where only the bravest animals live.',
    type: 'area',
    requiredLevel: 10,
    unlockMessage: 'The Mountain Peak is now accessible! Watch out for predators.'
  },
  
  crystalCave: {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    description: 'A magical underground cave system with crystalline formations.',
    type: 'area',
    requiredLevel: 15,
    requiredAchievements: ['explorer'],
    unlockMessage: 'The Crystal Cave has opened! Legendary animals may dwell within.'
  },
  
  shadowRealm: {
    id: 'shadow_realm',
    name: 'Shadow Realm',
    description: 'A mysterious dimension where shadow variants roam.',
    type: 'area',
    requiredLevel: 25,
    requiredAchievements: ['rarityCollector'],
    unlockMessage: 'The Shadow Realm beckons! Only the most experienced trainers may enter.'
  },
  
  // Advanced Tricks
  advancedTricks: {
    id: 'advanced_tricks',
    name: 'Advanced Tricks',
    description: 'Complex tricks that require high bond levels and experience.',
    type: 'trick',
    requiredLevel: 8,
    requiredAchievements: ['trickTeacher'],
    unlockMessage: 'Advanced tricks are now available! Teach your animals amazing new skills.'
  },
  
  expertTricks: {
    id: 'expert_tricks',
    name: 'Expert Tricks',
    description: 'The most challenging tricks that showcase true mastery.',
    type: 'trick',
    requiredLevel: 15,
    requiredAchievements: ['trickMaster'],
    unlockMessage: 'Expert tricks unlocked! Only the most skilled trainers can teach these.'
  },
  
  // Special Items
  rareFinder: {
    id: 'rare_finder',
    name: 'Rare Animal Detector',
    description: 'A device that helps locate rare animal variants.',
    type: 'item',
    requiredLevel: 12,
    requiredAchievements: ['luckyEncounter'],
    unlockMessage: 'Rare Animal Detector unlocked! Finding rare variants just got easier.'
  },
  
  bondBooster: {
    id: 'bond_booster',
    name: 'Bond Enhancer',
    description: 'A special item that accelerates bonding with animals.',
    type: 'item',
    requiredLevel: 18,
    requiredAchievements: ['heartCollector'],
    unlockMessage: 'Bond Enhancer unlocked! Strengthen your relationships faster.'
  },
  
  // Features
  fastTravel: {
    id: 'fast_travel',
    name: 'Fast Travel',
    description: 'Quickly travel between discovered areas.',
    type: 'feature',
    requiredLevel: 7,
    requiredAchievements: ['adventurer'],
    unlockMessage: 'Fast Travel unlocked! Move quickly between discovered areas.'
  },
  
  weatherControl: {
    id: 'weather_control',
    name: 'Weather Prediction',
    description: 'See upcoming weather patterns to plan your activities.',
    type: 'feature',
    requiredLevel: 20,
    unlockMessage: 'Weather Prediction unlocked! Plan your adventures around the weather.'
  },
  
  // Competition Tiers
  advancedCompetitions: {
    id: 'advanced_competitions',
    name: 'Advanced Competitions',
    description: 'Higher-tier competitions with better rewards.',
    type: 'competition',
    requiredLevel: 10,
    requiredAchievements: ['competitor'],
    unlockMessage: 'Advanced competitions are now available! Test your skills against the best.'
  },
  
  masterCompetitions: {
    id: 'master_competitions',
    name: 'Master Competitions',
    description: 'Elite competitions for the most skilled trainers.',
    type: 'competition',
    requiredLevel: 20,
    requiredAchievements: ['champion'],
    unlockMessage: 'Master competitions unlocked! Only true champions can compete here.'
  },
  
  // Special Animals
  legendaryAnimals: {
    id: 'legendary_animals',
    name: 'Legendary Animals',
    description: 'Mythical creatures that only appear for master trainers.',
    type: 'animal',
    requiredLevel: 25,
    requiredAchievements: ['grandChampion', 'worldTraveler'],
    unlockMessage: 'Legendary animals may now appear! Keep exploring to find them.'
  },
  
  // Biomes
  enchantedForest: {
    id: 'enchanted_forest',
    name: 'Enchanted Forest',
    description: 'A magical forest where fairy-tale animals live.',
    type: 'biome',
    requiredLevel: 22,
    requiredAchievements: ['masterTamer'],
    unlockMessage: 'The Enchanted Forest has awakened! Magical animals await within.'
  }
};

// Player progression state
export const playerProgression = {
  level: 1,
  currentXP: 0,
  totalXP: 0,
  unlockedContent: new Set<string>(),
  milestones: new Map<number, boolean>()
};

/**
 * Initialize progression system
 */
export function initializeProgression(): void {
  // Unlock basic content
  playerProgression.unlockedContent.add('basic_tricks');
  playerProgression.unlockedContent.add('beginner_competitions');
}

/**
 * Award experience points and handle level ups
 */
export function awardExperience(
  action: string, 
  multiplier: number = 1,
  bonus: number = 0
): { xpGained: number; leveledUp: boolean; newLevel?: number; unlocks?: string[] } {
  const source = EXPERIENCE_SOURCES[action];
  if (!source) {
    console.warn(`Unknown experience source: ${action}`);
    return { xpGained: 0, leveledUp: false };
  }
  
  const baseXP = source.baseXP;
  const xpGained = Math.round((baseXP * multiplier) + bonus);
  
  const previousLevel = playerProgression.level;
  playerProgression.currentXP += xpGained;
  playerProgression.totalXP += xpGained;
  
  // Check for level up
  const newLevel = calculateLevelFromXP(playerProgression.totalXP);
  const leveledUp = newLevel > previousLevel;
  
  if (leveledUp) {
    playerProgression.level = newLevel;
    playerProgression.currentXP = playerProgression.totalXP - getTotalXPForLevel(newLevel);
    
    // Check for new unlocks
    const newUnlocks = checkForUnlocks(newLevel);
    
    return {
      xpGained,
      leveledUp: true,
      newLevel,
      unlocks: newUnlocks
    };
  }
  
  return { xpGained, leveledUp: false };
}

/**
 * Calculate player level from total XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  let cumulativeXP = 0;
  
  while (cumulativeXP <= totalXP) {
    level++;
    cumulativeXP += getXPRequiredForLevel(level);
  }
  
  return level - 1;
}

/**
 * Get current player level info
 */
export function getPlayerLevel(): PlayerLevel {
  const nextLevel = playerProgression.level + 1;
  const xpForNext = getXPRequiredForLevel(nextLevel);
  const totalXPForCurrentLevel = getTotalXPForLevel(playerProgression.level);
  const currentXP = playerProgression.totalXP - totalXPForCurrentLevel;
  
  return {
    level: playerProgression.level,
    currentXP,
    xpToNext: xpForNext - currentXP,
    totalXP: playerProgression.totalXP
  };
}

/**
 * Check for new content unlocks at a given level
 */
export function checkForUnlocks(level: number, achievements: string[] = []): string[] {
  const newUnlocks: string[] = [];
  
  Object.entries(UNLOCKABLE_CONTENT).forEach(([id, content]) => {
    if (playerProgression.unlockedContent.has(id)) return;
    
    // Check level requirement
    if (content.requiredLevel > level) return;
    
    // Check achievement requirements
    if (content.requiredAchievements) {
      const hasAllAchievements = content.requiredAchievements.every(
        achId => achievements.includes(achId)
      );
      if (!hasAllAchievements) return;
    }
    
    // Content is unlocked!
    playerProgression.unlockedContent.add(id);
    newUnlocks.push(id);
  });
  
  return newUnlocks;
}

/**
 * Check if content is unlocked
 */
export function isContentUnlocked(contentId: string): boolean {
  return playerProgression.unlockedContent.has(contentId);
}

/**
 * Get all unlocked content by type
 */
export function getUnlockedContentByType(type: UnlockableContent['type']): UnlockableContent[] {
  return Object.entries(UNLOCKABLE_CONTENT)
    .filter(([id, content]) => 
      content.type === type && playerProgression.unlockedContent.has(id)
    )
    .map(([id, content]) => ({
      ...content,
      isUnlocked: true
    }));
}

/**
 * Get content close to unlocking
 */
export function getContentNearUnlock(
  currentLevel: number, 
  achievements: string[] = []
): UnlockableContent[] {
  return Object.entries(UNLOCKABLE_CONTENT)
    .filter(([id, content]) => !playerProgression.unlockedContent.has(id))
    .filter(([_, content]) => {
      const levelClose = content.requiredLevel <= currentLevel + 3;
      const achievementsClose = !content.requiredAchievements || 
        content.requiredAchievements.some(achId => achievements.includes(achId));
      return levelClose && achievementsClose;
    })
    .map(([id, content]) => ({
      ...content,
      isUnlocked: false
    }))
    .sort((a, b) => a.requiredLevel - b.requiredLevel);
}

/**
 * Get progression milestones
 */
export function getProgressionMilestones(): { level: number; reward: string; claimed: boolean }[] {
  const milestones = [
    { level: 5, reward: 'Unlock Deep Forest area' },
    { level: 10, reward: 'Advanced tricks and Mountain Peak' },
    { level: 15, reward: 'Crystal Cave and expert content' },
    { level: 20, reward: 'Master competitions and weather control' },
    { level: 25, reward: 'Legendary animals and Shadow Realm' },
    { level: 30, reward: 'Grandmaster status and special rewards' }
  ];
  
  return milestones.map(milestone => ({
    ...milestone,
    claimed: playerProgression.milestones.get(milestone.level) || false
  }));
}

/**
 * Claim milestone reward
 */
export function claimMilestoneReward(level: number): boolean {
  if (playerProgression.level < level) return false;
  if (playerProgression.milestones.get(level)) return false;
  
  playerProgression.milestones.set(level, true);
  return true;
}

/**
 * Get XP multiplier based on player level
 */
export function getXPMultiplier(level: number): number {
  // Higher level players get slightly reduced XP to slow progression
  if (level >= 25) return 0.8;
  if (level >= 20) return 0.9;
  if (level >= 15) return 0.95;
  return 1.0;
}

/**
 * Get content recommendations based on player progress
 */
export function getProgressionRecommendations(
  level: number,
  achievements: string[],
  tamedAnimals: number,
  knownTricks: number
): string[] {
  const recommendations: string[] = [];
  
  // Level-based recommendations
  if (level < 5 && tamedAnimals < 3) {
    recommendations.push('Try taming more animals to gain experience and unlock new areas.');
  }
  
  if (level >= 5 && !isContentUnlocked('forest_deep')) {
    recommendations.push('Visit the Deep Forest to discover new animal species.');
  }
  
  if (knownTricks < 5 && level >= 3) {
    recommendations.push('Learn more tricks to improve your competition performance.');
  }
  
  if (level >= 8 && !achievements.includes('competitor')) {
    recommendations.push('Try participating in competitions to earn rewards and experience.');
  }
  
  if (level >= 12 && !achievements.includes('explorer')) {
    recommendations.push('Explore different biomes to discover unique animals and unlock new areas.');
  }
  
  if (level >= 15 && !achievements.includes('rarityCollector')) {
    recommendations.push('Search for rare animal variants to unlock special content.');
  }
  
  return recommendations;
}

/**
 * Calculate prestige points for end-game progression
 */
export function calculatePrestigePoints(
  level: number,
  achievements: number,
  rareAnimals: number,
  competitionsWon: number
): number {
  let points = 0;
  
  // Base points from level
  points += Math.max(0, level - 20) * 10;
  
  // Bonus points from achievements
  points += achievements * 5;
  
  // Rare animal bonus
  points += rareAnimals * 15;
  
  // Competition bonus
  points += competitionsWon * 20;
  
  return points;
}

export default {
  EXPERIENCE_SOURCES,
  UNLOCKABLE_CONTENT,
  playerProgression,
  initializeProgression,
  awardExperience,
  calculateLevelFromXP,
  getPlayerLevel,
  checkForUnlocks,
  isContentUnlocked,
  getUnlockedContentByType,
  getContentNearUnlock,
  getProgressionMilestones,
  claimMilestoneReward,
  getXPMultiplier,
  getProgressionRecommendations,
  calculatePrestigePoints,
  getXPRequiredForLevel,
  getTotalXPForLevel
};