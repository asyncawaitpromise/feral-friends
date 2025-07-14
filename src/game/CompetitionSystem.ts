// Competition System
// Handles local contests, judging, and competitive gameplay elements

import { Animal } from './Animal';
import { getTrickMastery } from './TrickSystem';

export type CompetitionType = 'agility' | 'tricks' | 'bonding' | 'beauty' | 'intelligence' | 'mixed';
export type CompetitionTier = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
export type JudgeCategory = 'technique' | 'creativity' | 'bond' | 'presentation' | 'difficulty';

export interface Competition {
  id: string;
  name: string;
  description: string;
  type: CompetitionType;
  tier: CompetitionTier;
  
  // Requirements
  minPlayerLevel: number;
  requiredTricks?: string[];
  allowedSpecies?: string[];
  maxParticipants: number;
  
  // Rewards
  experience: number;
  coins?: number;
  unlocks?: string[];
  trophies: string[];
  
  // Timing
  duration: number; // in game days
  frequency: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  nextStart?: number; // timestamp
  
  // Competition state
  isActive: boolean;
  participants: CompetitionEntry[];
  winners?: CompetitionResult[];
}

export interface CompetitionEntry {
  playerId: string;
  playerName: string;
  animal: Animal;
  tricksToPerform: string[];
  registrationTime: number;
  entryFee?: number;
}

export interface CompetitionResult {
  entry: CompetitionEntry;
  totalScore: number;
  categoryScores: Record<JudgeCategory, number>;
  placement: number;
  rewards: {
    experience: number;
    coins: number;
    items?: string[];
    trophies?: string[];
  };
}

export interface JudgingCriteria {
  category: JudgeCategory;
  weight: number; // 0-1, how much this category affects final score
  description: string;
}

// Competition definitions
export const COMPETITIONS: Record<string, Omit<Competition, 'id' | 'isActive' | 'participants' | 'winners'>> = {
  beginnerAgility: {
    name: "Backyard Agility",
    description: "A friendly neighborhood competition focusing on basic movement and simple tricks.",
    type: 'agility',
    tier: 'beginner',
    minPlayerLevel: 1,
    requiredTricks: ['sit', 'stay'],
    maxParticipants: 8,
    experience: 50,
    coins: 25,
    trophies: ['bronze_agility'],
    duration: 3,
    frequency: 'weekly'
  },

  trickShowcase: {
    name: "Local Trick Showcase",
    description: "Show off your animal's most impressive tricks to amazed spectators.",
    type: 'tricks',
    tier: 'intermediate',
    minPlayerLevel: 5,
    requiredTricks: ['sit', 'stay', 'spin'],
    maxParticipants: 12,
    experience: 100,
    coins: 50,
    unlocks: ['advanced_tricks'],
    trophies: ['silver_performer'],
    duration: 5,
    frequency: 'weekly'
  },

  bondingContest: {
    name: "Heart to Heart",
    description: "A competition celebrating the special bond between human and animal.",
    type: 'bonding',
    tier: 'intermediate',
    minPlayerLevel: 8,
    maxParticipants: 10,
    experience: 120,
    coins: 75,
    trophies: ['golden_heart'],
    duration: 7,
    frequency: 'monthly'
  },

  beautyPageant: {
    name: "Forest Beauty Contest",
    description: "Celebrate the natural beauty and grace of wild animals.",
    type: 'beauty',
    tier: 'advanced',
    minPlayerLevel: 12,
    allowedSpecies: ['deer', 'fox', 'butterfly', 'otter'],
    maxParticipants: 6,
    experience: 150,
    coins: 100,
    unlocks: ['grooming_tools'],
    trophies: ['beauty_crown'],
    duration: 5,
    frequency: 'monthly'
  },

  masterChampionship: {
    name: "Grand Championship",
    description: "The ultimate test of skill, bond, and mastery for elite trainers.",
    type: 'mixed',
    tier: 'master',
    minPlayerLevel: 20,
    requiredTricks: ['sit', 'stay', 'spin', 'jump', 'shake', 'play_dead'],
    maxParticipants: 4,
    experience: 500,
    coins: 1000,
    unlocks: ['master_trainer_title', 'rare_items'],
    trophies: ['grand_champion'],
    duration: 14,
    frequency: 'seasonal'
  }
};

// Judging criteria for different competition types
export const JUDGING_CRITERIA: Record<CompetitionType, JudgingCriteria[]> = {
  agility: [
    { category: 'technique', weight: 0.4, description: 'Speed and precision of movements' },
    { category: 'difficulty', weight: 0.3, description: 'Complexity of maneuvers performed' },
    { category: 'presentation', weight: 0.2, description: 'Style and confidence during performance' },
    { category: 'bond', weight: 0.1, description: 'Visible connection between trainer and animal' }
  ],

  tricks: [
    { category: 'technique', weight: 0.3, description: 'Execution quality of individual tricks' },
    { category: 'creativity', weight: 0.25, description: 'Innovation and uniqueness of performance' },
    { category: 'difficulty', weight: 0.25, description: 'Complexity and challenge of tricks shown' },
    { category: 'presentation', weight: 0.2, description: 'Entertainment value and showmanship' }
  ],

  bonding: [
    { category: 'bond', weight: 0.5, description: 'Strength of emotional connection displayed' },
    { category: 'technique', weight: 0.2, description: 'Harmony and synchronization' },
    { category: 'presentation', weight: 0.2, description: 'Natural and relaxed interaction' },
    { category: 'creativity', weight: 0.1, description: 'Unique bonding moments shown' }
  ],

  beauty: [
    { category: 'presentation', weight: 0.4, description: 'Natural grace and poise' },
    { category: 'bond', weight: 0.3, description: 'Comfort and confidence with trainer' },
    { category: 'technique', weight: 0.2, description: 'Controlled and elegant movement' },
    { category: 'creativity', weight: 0.1, description: 'Unique poses or expressions' }
  ],

  intelligence: [
    { category: 'technique', weight: 0.35, description: 'Problem-solving accuracy' },
    { category: 'difficulty', weight: 0.3, description: 'Complexity of challenges completed' },
    { category: 'creativity', weight: 0.2, description: 'Novel approaches to problems' },
    { category: 'presentation', weight: 0.15, description: 'Confidence during challenges' }
  ],

  mixed: [
    { category: 'technique', weight: 0.25, description: 'Overall skill demonstration' },
    { category: 'bond', weight: 0.25, description: 'Partnership quality' },
    { category: 'difficulty', weight: 0.2, description: 'Challenge level attempted' },
    { category: 'creativity', weight: 0.15, description: 'Innovation and uniqueness' },
    { category: 'presentation', weight: 0.15, description: 'Entertainment and style' }
  ]
};

// Active competitions
export const activeCompetitions: Map<string, Competition> = new Map();

/**
 * Start a new competition
 */
export function startCompetition(competitionKey: string): Competition {
  const template = COMPETITIONS[competitionKey];
  if (!template) {
    throw new Error(`Unknown competition: ${competitionKey}`);
  }

  const competition: Competition = {
    ...template,
    id: `${competitionKey}_${Date.now()}`,
    isActive: true,
    participants: [],
    winners: undefined
  };

  activeCompetitions.set(competition.id, competition);
  return competition;
}

/**
 * Register player and animal for competition
 */
export function registerForCompetition(
  competitionId: string,
  playerId: string,
  playerName: string,
  animal: Animal,
  tricksToPerform: string[] = []
): boolean {
  const competition = activeCompetitions.get(competitionId);
  if (!competition || !competition.isActive) {
    return false;
  }

  // Check if already registered
  if (competition.participants.some(p => p.playerId === playerId)) {
    return false;
  }

  // Check requirements
  if (competition.participants.length >= competition.maxParticipants) {
    return false;
  }

  // Check species restrictions
  if (competition.allowedSpecies && !competition.allowedSpecies.includes(animal.species)) {
    return false;
  }

  // Register entry
  const entry: CompetitionEntry = {
    playerId,
    playerName,
    animal: { ...animal }, // Create copy to avoid mutations
    tricksToPerform,
    registrationTime: Date.now()
  };

  competition.participants.push(entry);
  return true;
}

/**
 * Judge a competition entry
 */
export function judgeEntry(
  competitionId: string,
  entry: CompetitionEntry,
  playerLevel: number = 1
): CompetitionResult {
  const competition = activeCompetitions.get(competitionId);
  if (!competition) {
    throw new Error(`Competition not found: ${competitionId}`);
  }

  const criteria = JUDGING_CRITERIA[competition.type];
  const categoryScores: Record<JudgeCategory, number> = {} as any;

  // Calculate scores for each category
  criteria.forEach(criterion => {
    let score = 0;

    switch (criterion.category) {
      case 'technique':
        score = calculateTechniqueScore(entry.animal, entry.tricksToPerform);
        break;
      case 'creativity':
        score = calculateCreativityScore(entry.tricksToPerform, playerLevel);
        break;
      case 'bond':
        score = calculateBondScore(entry.animal);
        break;
      case 'presentation':
        score = calculatePresentationScore(entry.animal, competition.type);
        break;
      case 'difficulty':
        score = calculateDifficultyScore(entry.tricksToPerform, competition.tier);
        break;
    }

    categoryScores[criterion.category] = Math.max(0, Math.min(100, score));
  });

  // Calculate weighted total score
  let totalScore = 0;
  criteria.forEach(criterion => {
    totalScore += categoryScores[criterion.category] * criterion.weight;
  });

  return {
    entry,
    totalScore: Math.round(totalScore),
    categoryScores,
    placement: 0, // Will be set when competition ends
    rewards: {
      experience: 0,
      coins: 0
    }
  };
}

/**
 * Calculate technique score based on animal stats and tricks
 */
function calculateTechniqueScore(animal: Animal, tricks: string[]): number {
  const baseScore = 50;
  
  // Animal's trust and happiness affect technique
  const trustBonus = (animal.stats.trust / 100) * 30;
  const happinessBonus = (animal.stats.happiness / 100) * 20;
  
  // Trick mastery affects technique
  let trickBonus = 0;
  tricks.forEach(trickId => {
    const mastery = getTrickMastery(animal.id, trickId);
    trickBonus += mastery * 5; // Up to 5 points per mastered trick
  });

  return baseScore + trustBonus + happinessBonus + trickBonus;
}

/**
 * Calculate creativity score based on trick combination and player level
 */
function calculateCreativityScore(tricks: string[], playerLevel: number): number {
  const baseScore = 40;
  
  // More tricks = more creativity potential
  const varietyBonus = Math.min(tricks.length * 8, 40);
  
  // Player level affects creativity
  const experienceBonus = Math.min(playerLevel * 2, 20);
  
  // Bonus for unique trick combinations (simplified)
  let combinationBonus = 0;
  if (tricks.includes('spin') && tricks.includes('jump')) combinationBonus += 10;
  if (tricks.includes('play_dead') && tricks.includes('shake')) combinationBonus += 15;

  return baseScore + varietyBonus + experienceBonus + combinationBonus;
}

/**
 * Calculate bond score based on animal trust and relationship
 */
function calculateBondScore(animal: Animal): number {
  const trustScore = animal.stats.trust;
  const happinessScore = animal.stats.happiness;
  const fearPenalty = animal.stats.fear;
  
  // Strong bond = high trust, high happiness, low fear
  const bondStrength = (trustScore + happinessScore - fearPenalty) / 2;
  
  return Math.max(0, Math.min(100, bondStrength));
}

/**
 * Calculate presentation score based on animal characteristics
 */
function calculatePresentationScore(animal: Animal, competitionType: CompetitionType): number {
  let baseScore = 60;
  
  // Animal happiness affects presentation
  const happinessBonus = (animal.stats.happiness / 100) * 25;
  
  // Low fear improves presentation
  const confidenceBonus = Math.max(0, (100 - animal.stats.fear) / 100) * 15;
  
  // Type-specific bonuses
  if (competitionType === 'beauty') {
    // Rare animals get beauty bonus
    if ((animal as any).rareVariant) {
      baseScore += 20;
    }
  }

  return baseScore + happinessBonus + confidenceBonus;
}

/**
 * Calculate difficulty score based on tricks and competition tier
 */
function calculateDifficultyScore(tricks: string[], tier: CompetitionTier): number {
  const trickDifficulties: Record<string, number> = {
    'sit': 5,
    'stay': 8,
    'spin': 12,
    'jump': 15,
    'shake': 10,
    'play_dead': 20,
    'roll_over': 18,
    'dance': 25
  };

  let totalDifficulty = 0;
  tricks.forEach(trick => {
    totalDifficulty += trickDifficulties[trick] || 0;
  });

  // Scale based on competition tier
  const tierMultipliers: Record<CompetitionTier, number> = {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.2,
    expert: 1.4,
    master: 1.6
  };

  return Math.min(100, totalDifficulty * tierMultipliers[tier]);
}

/**
 * End competition and determine winners
 */
export function endCompetition(competitionId: string): CompetitionResult[] {
  const competition = activeCompetitions.get(competitionId);
  if (!competition || !competition.isActive) {
    return [];
  }

  // Judge all entries
  const results = competition.participants.map(entry => 
    judgeEntry(competitionId, entry)
  );

  // Sort by score and assign placements
  results.sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((result, index) => {
    result.placement = index + 1;
    
    // Assign rewards based on placement
    const baseReward = competition.experience;
    const placementMultipliers = [1.0, 0.7, 0.5, 0.3]; // 1st, 2nd, 3rd, 4th+
    const multiplier = placementMultipliers[index] || 0.1;
    
    result.rewards.experience = Math.round(baseReward * multiplier);
    result.rewards.coins = Math.round((competition.coins || 0) * multiplier);
    
    // Winner gets trophies
    if (index === 0) {
      result.rewards.trophies = [...competition.trophies];
    }
  });

  competition.winners = results;
  competition.isActive = false;

  return results;
}

/**
 * Get available competitions for player level
 */
export function getAvailableCompetitions(playerLevel: number): string[] {
  return Object.keys(COMPETITIONS).filter(key => {
    const comp = COMPETITIONS[key];
    return comp.minPlayerLevel <= playerLevel;
  });
}

/**
 * Get competition leaderboard
 */
export function getCompetitionLeaderboard(competitionId: string): CompetitionResult[] {
  const competition = activeCompetitions.get(competitionId);
  if (!competition || !competition.winners) {
    return [];
  }

  return [...competition.winners].sort((a, b) => a.placement - b.placement);
}

/**
 * Check if animal meets competition requirements
 */
export function meetsCompetitionRequirements(
  animal: Animal,
  competitionKey: string,
  knownTricks: string[] = []
): { eligible: boolean; missing: string[] } {
  const comp = COMPETITIONS[competitionKey];
  if (!comp) {
    return { eligible: false, missing: ['Competition not found'] };
  }

  const missing: string[] = [];

  // Check species restrictions
  if (comp.allowedSpecies && !comp.allowedSpecies.includes(animal.species)) {
    missing.push(`Species ${animal.species} not allowed`);
  }

  // Check required tricks
  if (comp.requiredTricks) {
    const missingTricks = comp.requiredTricks.filter(trick => !knownTricks.includes(trick));
    if (missingTricks.length > 0) {
      missing.push(`Missing tricks: ${missingTricks.join(', ')}`);
    }
  }

  // Check animal bond level (simplified)
  if (animal.stats.trust < 30) {
    missing.push('Animal trust too low (need 30+)');
  }

  return {
    eligible: missing.length === 0,
    missing
  };
}

export default {
  COMPETITIONS,
  JUDGING_CRITERIA,
  activeCompetitions,
  startCompetition,
  registerForCompetition,
  judgeEntry,
  endCompetition,
  getAvailableCompetitions,
  getCompetitionLeaderboard,
  meetsCompetitionRequirements
};