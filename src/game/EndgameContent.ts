// Endgame Content System
// Advanced content for experienced players including master competitions, preservation challenges, and prestige content

import { Animal } from './Animal';
import { Competition } from './CompetitionSystem';

export type EndgameActivityType = 'master_competition' | 'preservation_challenge' | 'mastery_trial' | 'legendary_quest' | 'prestige_challenge';

export interface EndgameChallenge {
  id: string;
  name: string;
  description: string;
  type: EndgameActivityType;
  
  // Requirements
  minLevel: number;
  requiredAchievements: string[];
  requiredAnimals?: string[]; // Species or specific animals
  requiredMastery?: string[]; // Tricks that must be mastered
  
  // Challenge parameters
  duration: number; // in game days
  difficulty: 'expert' | 'master' | 'grandmaster' | 'legendary';
  participants: number; // max participants (1 for solo challenges)
  
  // Objectives
  objectives: ChallengeObjective[];
  
  // Rewards
  rewards: EndgameReward[];
  
  // Status
  isActive: boolean;
  isRepeatable: boolean;
  cooldownDays?: number;
  nextAvailable?: number;
}

export interface ChallengeObjective {
  id: string;
  description: string;
  type: 'performance' | 'preservation' | 'discovery' | 'mastery' | 'endurance';
  target: number;
  currentProgress: number;
  isCompleted: boolean;
  
  // Specific parameters
  species?: string;
  biome?: string;
  trick?: string;
  timeLimit?: number;
  requiredScore?: number;
}

export interface EndgameReward {
  type: 'experience' | 'coins' | 'title' | 'badge' | 'item' | 'unlock' | 'prestige_points';
  amount?: number;
  item?: string;
  title?: string;
  badge?: string;
  unlock?: string;
}

export interface MasterCompetition extends Competition {
  legendaryJudges: string[];
  globalLeaderboard: boolean;
  seasonalRanking: boolean;
  prestigePointReward: number;
}

export interface PreservationProject {
  id: string;
  name: string;
  description: string;
  species: string;
  currentPopulation: number;
  targetPopulation: number;
  conservationGoals: string[];
  contributors: string[]; // Player IDs
  rewards: EndgameReward[];
  deadline: number;
  isCompleted: boolean;
}

export interface PrestigeSystem {
  currentPrestige: number;
  totalPrestigePoints: number;
  prestigeBonuses: PrestigeBonus[];
  nextMilestone: PrestigeMilestone;
}

export interface PrestigeBonus {
  id: string;
  name: string;
  description: string;
  effect: string;
  cost: number;
  isUnlocked: boolean;
}

export interface PrestigeMilestone {
  points: number;
  title: string;
  rewards: EndgameReward[];
}

// Master competitions for endgame players
export const MASTER_COMPETITIONS: Record<string, Omit<MasterCompetition, 'isActive' | 'participants' | 'winners'>> = {
  grandChampionship: {
    id: 'grand_championship',
    name: 'Grand Championship',
    description: 'The ultimate test of skill and bond between trainer and animal.',
    type: 'mixed',
    tier: 'master',
    minPlayerLevel: 25,
    requiredTricks: ['sit', 'stay', 'spin', 'jump', 'shake', 'play_dead', 'roll_over', 'dance'],
    maxParticipants: 8,
    experience: 1000,
    coins: 2000,
    unlocks: ['grandmaster_title', 'legendary_items'],
    trophies: ['ultimate_champion'],
    duration: 21,
    frequency: 'seasonal',
    legendaryJudges: ['Master Elena', 'Champion Marcus', 'Legend Aria'],
    globalLeaderboard: true,
    seasonalRanking: true,
    prestigePointReward: 500
  },

  speciesSpecialist: {
    id: 'species_specialist',
    name: 'Species Mastery Championship',
    description: 'Demonstrate complete mastery over a single species.',
    type: 'bonding',
    tier: 'expert',
    minPlayerLevel: 20,
    maxParticipants: 12,
    experience: 750,
    coins: 1500,
    trophies: ['species_master'],
    duration: 14,
    frequency: 'monthly',
    legendaryJudges: ['Dr. Wildlife', 'Professor Nature'],
    globalLeaderboard: true,
    seasonalRanking: false,
    prestigePointReward: 300
  },

  perfectHarmony: {
    id: 'perfect_harmony',
    name: 'Perfect Harmony Challenge',
    description: 'Achieve flawless synchronization with multiple animals.',
    type: 'bonding',
    tier: 'master',
    minPlayerLevel: 30,
    requiredTricks: ['all_advanced_tricks'],
    maxParticipants: 4,
    experience: 1500,
    coins: 3000,
    unlocks: ['harmony_master_abilities'],
    trophies: ['perfect_harmony'],
    duration: 28,
    frequency: 'seasonal',
    legendaryJudges: ['The Council of Elders'],
    globalLeaderboard: true,
    seasonalRanking: true,
    prestigePointReward: 1000
  }
};

// Endgame challenges
export const ENDGAME_CHALLENGES: Record<string, Omit<EndgameChallenge, 'isActive'>> = {
  legendaryBeastmaster: {
    id: 'legendary_beastmaster',
    name: 'Legendary Beastmaster Trial',
    description: 'Prove your mastery by taming and bonding with legendary creatures.',
    type: 'legendary_quest',
    minLevel: 28,
    requiredAchievements: ['masterTamer', 'grandChampion', 'legendaryFinder'],
    duration: 90,
    difficulty: 'legendary',
    participants: 1,
    objectives: [
      {
        id: 'tame_legendary',
        description: 'Tame 3 legendary animal variants',
        type: 'mastery',
        target: 3,
        currentProgress: 0,
        isCompleted: false
      },
      {
        id: 'perfect_bond',
        description: 'Achieve perfect bond (100 trust) with all legendaries',
        type: 'mastery',
        target: 3,
        currentProgress: 0,
        isCompleted: false
      },
      {
        id: 'master_performance',
        description: 'Score 95+ in a master competition with a legendary animal',
        type: 'performance',
        target: 1,
        currentProgress: 0,
        isCompleted: false,
        requiredScore: 95
      }
    ],
    rewards: [
      { type: 'title', title: 'Legendary Beastmaster' },
      { type: 'badge', badge: 'legendary_crown' },
      { type: 'prestige_points', amount: 1000 },
      { type: 'unlock', unlock: 'mythical_animals' }
    ],
    isRepeatable: false
  },

  conservationHero: {
    id: 'conservation_hero',
    name: 'Conservation Hero Challenge',
    description: 'Lead efforts to protect and preserve endangered species.',
    type: 'preservation_challenge',
    minLevel: 22,
    requiredAchievements: ['worldTraveler', 'rarityCollector'],
    duration: 60,
    difficulty: 'master',
    participants: 1,
    objectives: [
      {
        id: 'save_species',
        description: 'Successfully preserve 5 endangered species',
        type: 'preservation',
        target: 5,
        currentProgress: 0,
        isCompleted: false
      },
      {
        id: 'population_growth',
        description: 'Increase population of rare species by 50%',
        type: 'preservation',
        target: 50,
        currentProgress: 0,
        isCompleted: false
      },
      {
        id: 'habitat_restoration',
        description: 'Restore 3 degraded habitats to full health',
        type: 'preservation',
        target: 3,
        currentProgress: 0,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'title', title: 'Conservation Hero' },
      { type: 'badge', badge: 'green_guardian' },
      { type: 'prestige_points', amount: 750 },
      { type: 'unlock', unlock: 'habitat_management_tools' }
    ],
    isRepeatable: true,
    cooldownDays: 120
  },

  trickMasterSupreme: {
    id: 'trick_master_supreme',
    name: 'Trick Master Supreme',
    description: 'Demonstrate absolute mastery of all trick categories.',
    type: 'mastery_trial',
    minLevel: 25,
    requiredAchievements: ['trickMaster', 'champion'],
    requiredMastery: ['all_expert_tricks'],
    duration: 30,
    difficulty: 'grandmaster',
    participants: 1,
    objectives: [
      {
        id: 'master_all_categories',
        description: 'Master all tricks in every category',
        type: 'mastery',
        target: 25,
        currentProgress: 0,
        isCompleted: false
      },
      {
        id: 'perfect_performances',
        description: 'Achieve perfect scores in 10 trick competitions',
        type: 'performance',
        target: 10,
        currentProgress: 0,
        isCompleted: false,
        requiredScore: 100
      },
      {
        id: 'create_new_trick',
        description: 'Innovate and teach a completely new trick',
        type: 'discovery',
        target: 1,
        currentProgress: 0,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'title', title: 'Trick Master Supreme' },
      { type: 'badge', badge: 'infinity_star' },
      { type: 'prestige_points', amount: 800 },
      { type: 'unlock', unlock: 'trick_creation_system' }
    ],
    isRepeatable: false
  },

  enduranceMarathon: {
    id: 'endurance_marathon',
    name: 'Ultimate Endurance Marathon',
    description: 'Test your dedication and stamina in the ultimate challenge.',
    type: 'prestige_challenge',
    minLevel: 30,
    requiredAchievements: ['dedicatedPlayer', 'masterTamer', 'grandChampion'],
    duration: 7,
    difficulty: 'legendary',
    participants: 1,
    objectives: [
      {
        id: 'continuous_play',
        description: 'Maintain active gameplay for 168 hours (7 days)',
        type: 'endurance',
        target: 168,
        currentProgress: 0,
        isCompleted: false,
        timeLimit: 168 * 60 * 60 * 1000 // 7 days in milliseconds
      },
      {
        id: 'daily_achievements',
        description: 'Complete at least 5 achievements each day',
        type: 'mastery',
        target: 35,
        currentProgress: 0,
        isCompleted: false
      },
      {
        id: 'species_diversity',
        description: 'Interact with 50 different animals during the marathon',
        type: 'discovery',
        target: 50,
        currentProgress: 0,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'title', title: 'Endurance Champion' },
      { type: 'badge', badge: 'eternal_flame' },
      { type: 'prestige_points', amount: 2000 },
      { type: 'unlock', unlock: 'unlimited_energy' }
    ],
    isRepeatable: true,
    cooldownDays: 365 // Once per year
  }
};

// Preservation projects
export const PRESERVATION_PROJECTS: Record<string, Omit<PreservationProject, 'contributors' | 'isCompleted'>> = {
  crystalDeerSanctuary: {
    id: 'crystal_deer_sanctuary',
    name: 'Crystal Deer Sanctuary',
    description: 'Protect the endangered Crystal Deer population in the Mountain Peak.',
    species: 'deer',
    currentPopulation: 5,
    targetPopulation: 25,
    conservationGoals: [
      'Establish safe breeding grounds',
      'Reduce human interference',
      'Provide adequate food sources',
      'Monitor population health'
    ],
    rewards: [
      { type: 'title', title: 'Deer Guardian' },
      { type: 'prestige_points', amount: 500 },
      { type: 'unlock', unlock: 'crystal_deer_breeding_program' }
    ],
    deadline: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
  },

  shadowWolfPack: {
    id: 'shadow_wolf_pack',
    name: 'Shadow Wolf Pack Restoration',
    description: 'Restore the Shadow Wolf pack to its former strength.',
    species: 'wolf',
    currentPopulation: 3,
    targetPopulation: 15,
    conservationGoals: [
      'Re-establish pack hierarchy',
      'Secure territory boundaries',
      'Ensure genetic diversity',
      'Protect from hunters'
    ],
    rewards: [
      { type: 'title', title: 'Pack Leader' },
      { type: 'prestige_points', amount: 750 },
      { type: 'unlock', unlock: 'shadow_realm_access' }
    ],
    deadline: Date.now() + (120 * 24 * 60 * 60 * 1000) // 120 days
  }
};

// Prestige system configuration
export const PRESTIGE_BONUSES: Record<string, PrestigeBonus> = {
  animalWhisperer: {
    id: 'animal_whisperer',
    name: 'Animal Whisperer',
    description: 'Animals trust you 25% faster',
    effect: 'trust_gain_bonus',
    cost: 100,
    isUnlocked: false
  },

  masterTrainer: {
    id: 'master_trainer',
    name: 'Master Trainer',
    description: 'Tricks are learned 50% faster',
    effect: 'trick_learning_bonus',
    cost: 200,
    isUnlocked: false
  },

  rareSeeker: {
    id: 'rare_seeker',
    name: 'Rare Seeker',
    description: 'Rare animals spawn 2x more frequently',
    effect: 'rare_spawn_bonus',
    cost: 300,
    isUnlocked: false
  },

  experienceBoost: {
    id: 'experience_boost',
    name: 'Experience Boost',
    description: 'Gain 25% more experience from all activities',
    effect: 'xp_bonus',
    cost: 250,
    isUnlocked: false
  },

  competitionEdge: {
    id: 'competition_edge',
    name: 'Competition Edge',
    description: 'Start competitions with a 10-point score bonus',
    effect: 'competition_bonus',
    cost: 400,
    isUnlocked: false
  },

  habitatExpert: {
    id: 'habitat_expert',
    name: 'Habitat Expert',
    description: 'All biomes provide optimal conditions for your animals',
    effect: 'habitat_bonus',
    cost: 500,
    isUnlocked: false
  }
};

export const PRESTIGE_MILESTONES: PrestigeMilestone[] = [
  {
    points: 1000,
    title: 'Prestige Initiate',
    rewards: [
      { type: 'title', title: 'Prestige Initiate' },
      { type: 'badge', badge: 'first_prestige' }
    ]
  },
  {
    points: 2500,
    title: 'Elite Trainer',
    rewards: [
      { type: 'title', title: 'Elite Trainer' },
      { type: 'unlock', unlock: 'elite_trainer_perks' }
    ]
  },
  {
    points: 5000,
    title: 'Legendary Master',
    rewards: [
      { type: 'title', title: 'Legendary Master' },
      { type: 'badge', badge: 'legendary_master' },
      { type: 'unlock', unlock: 'legendary_content' }
    ]
  },
  {
    points: 10000,
    title: 'Mythical Grandmaster',
    rewards: [
      { type: 'title', title: 'Mythical Grandmaster' },
      { type: 'badge', badge: 'mythical_crown' },
      { type: 'unlock', unlock: 'mythical_realm' }
    ]
  }
];

// Active endgame content
export const activeEndgameContent = {
  activeChallenges: new Map<string, EndgameChallenge>(),
  activeProjects: new Map<string, PreservationProject>(),
  playerPrestige: {
    currentPrestige: 0,
    totalPrestigePoints: 0,
    prestigeBonuses: Object.values(PRESTIGE_BONUSES),
    nextMilestone: PRESTIGE_MILESTONES[0]
  } as PrestigeSystem
};

/**
 * Start an endgame challenge
 */
export function startEndgameChallenge(
  challengeId: string,
  playerId: string
): EndgameChallenge | null {
  const template = ENDGAME_CHALLENGES[challengeId];
  if (!template) return null;

  const challenge: EndgameChallenge = {
    ...template,
    isActive: true,
    objectives: template.objectives.map(obj => ({ ...obj }))
  };

  activeEndgameContent.activeChallenges.set(challengeId, challenge);
  return challenge;
}

/**
 * Update challenge progress
 */
export function updateChallengeProgress(
  challengeId: string,
  objectiveId: string,
  progress: number
): boolean {
  const challenge = activeEndgameContent.activeChallenges.get(challengeId);
  if (!challenge) return false;

  const objective = challenge.objectives.find(obj => obj.id === objectiveId);
  if (!objective) return false;

  objective.currentProgress = Math.min(objective.currentProgress + progress, objective.target);
  objective.isCompleted = objective.currentProgress >= objective.target;

  // Check if entire challenge is completed
  const allCompleted = challenge.objectives.every(obj => obj.isCompleted);
  if (allCompleted) {
    challenge.isActive = false;
    return true; // Challenge completed
  }

  return false;
}

/**
 * Join a preservation project
 */
export function joinPreservationProject(
  projectId: string,
  playerId: string
): boolean {
  const project = activeEndgameContent.activeProjects.get(projectId);
  if (!project) return false;

  if (!project.contributors.includes(playerId)) {
    project.contributors.push(playerId);
    return true;
  }

  return false;
}

/**
 * Contribute to preservation project
 */
export function contributeToPreservation(
  projectId: string,
  contribution: number
): boolean {
  const project = activeEndgameContent.activeProjects.get(projectId);
  if (!project) return false;

  project.currentPopulation = Math.min(
    project.currentPopulation + contribution,
    project.targetPopulation
  );

  if (project.currentPopulation >= project.targetPopulation) {
    project.isCompleted = true;
    return true; // Project completed
  }

  return false;
}

/**
 * Award prestige points
 */
export function awardPrestigePoints(points: number): void {
  activeEndgameContent.playerPrestige.totalPrestigePoints += points;
  
  // Check for milestone rewards
  const nextMilestone = PRESTIGE_MILESTONES.find(
    milestone => milestone.points > activeEndgameContent.playerPrestige.currentPrestige
  );
  
  if (nextMilestone && activeEndgameContent.playerPrestige.totalPrestigePoints >= nextMilestone.points) {
    activeEndgameContent.playerPrestige.currentPrestige = nextMilestone.points;
    activeEndgameContent.playerPrestige.nextMilestone = 
      PRESTIGE_MILESTONES.find(m => m.points > nextMilestone.points) || nextMilestone;
  }
}

/**
 * Purchase prestige bonus
 */
export function purchasePrestigeBonus(bonusId: string): boolean {
  const bonus = activeEndgameContent.playerPrestige.prestigeBonuses.find(b => b.id === bonusId);
  if (!bonus || bonus.isUnlocked) return false;

  if (activeEndgameContent.playerPrestige.totalPrestigePoints >= bonus.cost) {
    activeEndgameContent.playerPrestige.totalPrestigePoints -= bonus.cost;
    bonus.isUnlocked = true;
    return true;
  }

  return false;
}

/**
 * Get available endgame content for player level
 */
export function getAvailableEndgameContent(
  playerLevel: number,
  achievements: string[]
): {
  challenges: EndgameChallenge[];
  competitions: MasterCompetition[];
  projects: PreservationProject[];
} {
  const challenges = Object.values(ENDGAME_CHALLENGES).filter(challenge => {
    const levelMet = playerLevel >= challenge.minLevel;
    const achievementsMet = challenge.requiredAchievements.every(achId => 
      achievements.includes(achId)
    );
    return levelMet && achievementsMet;
  }).map(template => ({ ...template, isActive: false }));

  const competitions = Object.values(MASTER_COMPETITIONS).filter(comp => {
    return playerLevel >= comp.minPlayerLevel;
  }).map(template => ({ 
    ...template, 
    isActive: false, 
    participants: [], 
    winners: undefined 
  }));

  const projects = Object.values(PRESERVATION_PROJECTS).map(template => ({
    ...template,
    contributors: [],
    isCompleted: false
  }));

  return { challenges, competitions, projects };
}

/**
 * Get endgame progression recommendations
 */
export function getEndgameRecommendations(
  playerLevel: number,
  achievements: string[],
  prestigePoints: number
): string[] {
  const recommendations: string[] = [];

  if (playerLevel >= 25 && !achievements.includes('legendaryFinder')) {
    recommendations.push('Search for legendary animals to unlock the ultimate challenges.');
  }

  if (playerLevel >= 22 && prestigePoints < 500) {
    recommendations.push('Focus on earning prestige points through master competitions.');
  }

  if (playerLevel >= 30 && achievements.includes('grandChampion')) {
    recommendations.push('Consider taking on the Ultimate Endurance Marathon for ultimate glory.');
  }

  if (achievements.includes('rarityCollector')) {
    recommendations.push('Join preservation projects to help endangered species.');
  }

  return recommendations;
}

export default {
  MASTER_COMPETITIONS,
  ENDGAME_CHALLENGES,
  PRESERVATION_PROJECTS,
  PRESTIGE_BONUSES,
  PRESTIGE_MILESTONES,
  activeEndgameContent,
  startEndgameChallenge,
  updateChallengeProgress,
  joinPreservationProject,
  contributeToPreservation,
  awardPrestigePoints,
  purchasePrestigeBonus,
  getAvailableEndgameContent,
  getEndgameRecommendations
};