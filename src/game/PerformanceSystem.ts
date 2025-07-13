import { Animal } from './Animal';
import { TrickDefinition, getTrickById } from '../data/tricks';
import { trickSystem, TrickPerformance } from './TrickSystem';
import { bondingSystem } from './BondingSystem';

export type PerformanceVenue = 'backyard' | 'park' | 'competition' | 'street' | 'festival';
export type AudienceType = 'family' | 'friends' | 'strangers' | 'judges' | 'children';
export type PerformanceType = 'solo' | 'showcase' | 'competition' | 'freestyle' | 'themed';

export interface PerformanceEvent {
  id: string;
  name: string;
  description: string;
  venue: PerformanceVenue;
  audienceType: AudienceType;
  performanceType: PerformanceType;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  requirements: PerformanceRequirement[];
  rewards: PerformanceReward[];
  timeLimit?: number; // milliseconds
  minTricks?: number;
  maxTricks?: number;
  theme?: string;
  available: boolean;
  completed: boolean;
  bestScore?: number;
}

export interface PerformanceRequirement {
  type: 'trick_category' | 'trick_difficulty' | 'bond_level' | 'mastery_level' | 'specific_trick';
  value: string | number;
  description: string;
}

export interface PerformanceReward {
  type: 'points' | 'bond_points' | 'unlock' | 'title' | 'item' | 'achievement';
  value: number | string;
  description: string;
}

export interface PerformanceSession {
  sessionId: string;
  eventId: string;
  animalId: string;
  startTime: number;
  endTime?: number;
  selectedTricks: string[];
  performanceOrder: string[];
  currentTrickIndex: number;
  totalScore: number;
  audienceReaction: AudienceReaction;
  completed: boolean;
  results?: PerformanceResults;
}

export interface AudienceReaction {
  excitement: number; // 0-100
  engagement: number; // 0-100
  satisfaction: number; // 0-100
  feedback: string[];
  specialReactions: string[];
}

export interface PerformanceResults {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  trickScores: TrickScore[];
  audienceScore: number;
  bonusPoints: number;
  penalties: number;
  ranking: 'poor' | 'fair' | 'good' | 'excellent' | 'spectacular';
  achievements: string[];
  rewards: PerformanceReward[];
  feedback: string[];
}

export interface TrickScore {
  trickId: string;
  baseScore: number;
  executionScore: number;
  audienceBonus: number;
  difficultyBonus: number;
  totalScore: number;
  feedback: string;
}

export interface PerformanceHistory {
  animalId: string;
  performances: PerformanceSession[];
  totalEvents: number;
  totalScore: number;
  averageScore: number;
  bestPerformance: string; // session ID
  favoriteVenue: PerformanceVenue;
  specializations: string[]; // trick categories they excel at
  achievements: string[];
  reputation: number; // 0-100
}

// Performance events available to players
export const PERFORMANCE_EVENTS: PerformanceEvent[] = [
  {
    id: 'backyard_showcase',
    name: 'Backyard Showcase',
    description: 'A casual performance for family and friends in your backyard',
    venue: 'backyard',
    audienceType: 'family',
    performanceType: 'showcase',
    difficulty: 'easy',
    requirements: [
      {
        type: 'bond_level',
        value: 'friend',
        description: 'Must have friend-level bond with animal'
      }
    ],
    rewards: [
      {
        type: 'points',
        value: 50,
        description: 'Base performance points'
      },
      {
        type: 'bond_points',
        value: 10,
        description: 'Bonding through performance'
      }
    ],
    timeLimit: 120000, // 2 minutes
    minTricks: 2,
    maxTricks: 5,
    available: true,
    completed: false
  },
  
  {
    id: 'park_performance',
    name: 'Park Performance',
    description: 'Perform for strangers and dog walkers at the local park',
    venue: 'park',
    audienceType: 'strangers',
    performanceType: 'freestyle',
    difficulty: 'medium',
    requirements: [
      {
        type: 'bond_level',
        value: 'close_friend',
        description: 'Must have close friend bond'
      },
      {
        type: 'mastery_level',
        value: 60,
        description: 'Need at least 60% mastery on performed tricks'
      }
    ],
    rewards: [
      {
        type: 'points',
        value: 100,
        description: 'Public performance points'
      },
      {
        type: 'unlock',
        value: 'street_performance',
        description: 'Unlocks street performance events'
      }
    ],
    timeLimit: 180000, // 3 minutes
    minTricks: 3,
    maxTricks: 6,
    available: true,
    completed: false
  },
  
  {
    id: 'talent_competition',
    name: 'Local Talent Competition',
    description: 'Compete against other animal performers for prizes and recognition',
    venue: 'competition',
    audienceType: 'judges',
    performanceType: 'competition',
    difficulty: 'hard',
    requirements: [
      {
        type: 'bond_level',
        value: 'companion',
        description: 'Must have companion-level bond'
      },
      {
        type: 'trick_difficulty',
        value: 'medium',
        description: 'Must know at least 2 medium difficulty tricks'
      }
    ],
    rewards: [
      {
        type: 'points',
        value: 300,
        description: 'Competition points'
      },
      {
        type: 'title',
        value: 'Talented Performer',
        description: 'Earn performer title'
      },
      {
        type: 'achievement',
        value: 'first_competition',
        description: 'First competition achievement'
      }
    ],
    timeLimit: 240000, // 4 minutes
    minTricks: 4,
    maxTricks: 8,
    available: false,
    completed: false
  },
  
  {
    id: 'festival_showcase',
    name: 'Animal Festival Showcase',
    description: 'Grand performance at the annual animal festival',
    venue: 'festival',
    audienceType: 'children',
    performanceType: 'themed',
    difficulty: 'expert',
    theme: 'joy_and_friendship',
    requirements: [
      {
        type: 'bond_level',
        value: 'soul_mate',
        description: 'Must have soul mate bond'
      },
      {
        type: 'trick_category',
        value: 'performance',
        description: 'Must know performance category tricks'
      }
    ],
    rewards: [
      {
        type: 'points',
        value: 500,
        description: 'Festival performance points'
      },
      {
        type: 'title',
        value: 'Festival Star',
        description: 'Prestigious festival performer title'
      },
      {
        type: 'unlock',
        value: 'legendary_events',
        description: 'Unlocks legendary performance events'
      }
    ],
    timeLimit: 300000, // 5 minutes
    minTricks: 5,
    maxTricks: 10,
    available: false,
    completed: false
  }
];

export class PerformanceSystem {
  private performanceHistory: Map<string, PerformanceHistory> = new Map();
  private activeSession: PerformanceSession | null = null;
  private availableEvents: PerformanceEvent[] = [...PERFORMANCE_EVENTS];
  
  private callbacks: {
    onPerformanceStart?: (session: PerformanceSession) => void;
    onPerformanceComplete?: (results: PerformanceResults) => void;
    onEventUnlocked?: (eventId: string) => void;
    onAchievementEarned?: (animalId: string, achievement: string) => void;
  } = {};

  constructor() {
    this.loadPerformanceData();
  }

  /**
   * Get available performance events for an animal
   */
  getAvailableEvents(animal: Animal): PerformanceEvent[] {
    return this.availableEvents.filter(event => {
      if (!event.available) return false;
      return this.checkEventRequirements(animal, event).canPerform;
    });
  }

  /**
   * Start a performance session
   */
  startPerformance(
    animal: Animal,
    eventId: string,
    selectedTricks: string[]
  ): {
    success: boolean;
    message: string;
    session?: PerformanceSession;
  } {
    const event = this.availableEvents.find(e => e.id === eventId);
    if (!event) {
      return { success: false, message: 'Event not found' };
    }

    // Check requirements
    const requirementCheck = this.checkEventRequirements(animal, event);
    if (!requirementCheck.canPerform) {
      return { 
        success: false, 
        message: 'Requirements not met', 
        session: undefined 
      };
    }

    // Validate selected tricks
    const validation = this.validateTrickSelection(animal, event, selectedTricks);
    if (!validation.valid) {
      return { 
        success: false, 
        message: validation.message,
        session: undefined 
      };
    }

    // Create performance session
    const session: PerformanceSession = {
      sessionId: `${animal.id}_${eventId}_${Date.now()}`,
      eventId,
      animalId: animal.id,
      startTime: Date.now(),
      selectedTricks,
      performanceOrder: [...selectedTricks], // Can be reordered later
      currentTrickIndex: 0,
      totalScore: 0,
      audienceReaction: {
        excitement: 50,
        engagement: 50,
        satisfaction: 50,
        feedback: [],
        specialReactions: []
      },
      completed: false
    };

    this.activeSession = session;
    this.callbacks.onPerformanceStart?.(session);

    return {
      success: true,
      message: `Performance started at ${event.name}`,
      session
    };
  }

  /**
   * Perform a trick during a performance session
   */
  performTrick(trickId: string): {
    success: boolean;
    trickScore: TrickScore;
    audienceReaction: AudienceReaction;
    sessionComplete: boolean;
    message: string;
  } {
    if (!this.activeSession) {
      return {
        success: false,
        trickScore: {} as TrickScore,
        audienceReaction: {} as AudienceReaction,
        sessionComplete: false,
        message: 'No active performance session'
      };
    }

    const session = this.activeSession;
    const event = this.availableEvents.find(e => e.id === session.eventId);
    const trick = getTrickById(trickId);

    if (!event || !trick) {
      return {
        success: false,
        trickScore: {} as TrickScore,
        audienceReaction: session.audienceReaction,
        sessionComplete: false,
        message: 'Invalid trick or event'
      };
    }

    // Perform the trick using the trick system
    const trickResult = trickSystem.performTrick(session.animalId, trickId);
    if (!trickResult.success) {
      return {
        success: false,
        trickScore: {} as TrickScore,
        audienceReaction: session.audienceReaction,
        sessionComplete: false,
        message: 'Trick performance failed'
      };
    }

    // Calculate performance score
    const trickScore = this.calculateTrickScore(
      trickResult.performance,
      trick,
      event,
      session.audienceReaction
    );

    // Update audience reaction
    this.updateAudienceReaction(session.audienceReaction, trickScore, trick, event);

    // Update session
    session.totalScore += trickScore.totalScore;
    session.currentTrickIndex++;

    // Check if performance is complete
    const sessionComplete = session.currentTrickIndex >= session.selectedTricks.length;
    
    if (sessionComplete) {
      session.completed = true;
      session.endTime = Date.now();
      
      // Calculate final results
      const results = this.calculatePerformanceResults(session, event);
      session.results = results;
      
      // Update performance history
      this.updatePerformanceHistory(session.animalId, session);
      
      // Award rewards
      this.awardPerformanceRewards(session.animalId, results);
      
      this.callbacks.onPerformanceComplete?.(results);
      this.activeSession = null;
    }

    this.savePerformanceData();

    return {
      success: true,
      trickScore,
      audienceReaction: session.audienceReaction,
      sessionComplete,
      message: trickScore.feedback
    };
  }

  /**
   * Get performance history for an animal
   */
  getPerformanceHistory(animalId: string): PerformanceHistory {
    return this.performanceHistory.get(animalId) || {
      animalId,
      performances: [],
      totalEvents: 0,
      totalScore: 0,
      averageScore: 0,
      bestPerformance: '',
      favoriteVenue: 'backyard',
      specializations: [],
      achievements: [],
      reputation: 0
    };
  }

  /**
   * Get current active session
   */
  getActiveSession(): PerformanceSession | null {
    return this.activeSession;
  }

  /**
   * Set performance callbacks
   */
  setCallbacks(callbacks: {
    onPerformanceStart?: (session: PerformanceSession) => void;
    onPerformanceComplete?: (results: PerformanceResults) => void;
    onEventUnlocked?: (eventId: string) => void;
    onAchievementEarned?: (animalId: string, achievement: string) => void;
  }): void {
    this.callbacks = callbacks;
  }

  // Private helper methods

  private checkEventRequirements(animal: Animal, event: PerformanceEvent): {
    canPerform: boolean;
    missingRequirements: string[];
  } {
    const missing: string[] = [];
    
    event.requirements.forEach(req => {
      switch (req.type) {
        case 'bond_level':
          const bondProgress = bondingSystem.getBondingProgress(animal.id);
          if (!bondProgress || bondProgress.currentBondLevel !== req.value) {
            missing.push(`Bond level ${req.value} required`);
          }
          break;
        case 'mastery_level':
          // Check if animal has tricks with required mastery
          const learnedTricks = trickSystem.getLearnedTricks(animal.id);
          const hasRequiredMastery = learnedTricks.some(trick => 
            trickSystem.getMasteryLevel(animal.id, trick.trickId) >= (req.value as number)
          );
          if (!hasRequiredMastery) {
            missing.push(`Mastery level ${req.value}% required on at least one trick`);
          }
          break;
        case 'trick_difficulty':
          const availableTricks = trickSystem.getLearnedTricks(animal.id);
          const hasRequiredDifficulty = availableTricks.some(trick => {
            const trickDef = getTrickById(trick.trickId);
            return trickDef?.difficulty === req.value;
          });
          if (!hasRequiredDifficulty) {
            missing.push(`Must know tricks of ${req.value} difficulty`);
          }
          break;
      }
    });

    return {
      canPerform: missing.length === 0,
      missingRequirements: missing
    };
  }

  private validateTrickSelection(
    animal: Animal,
    event: PerformanceEvent,
    selectedTricks: string[]
  ): { valid: boolean; message: string } {
    // Check trick count
    if (event.minTricks && selectedTricks.length < event.minTricks) {
      return { valid: false, message: `Must select at least ${event.minTricks} tricks` };
    }
    
    if (event.maxTricks && selectedTricks.length > event.maxTricks) {
      return { valid: false, message: `Can select at most ${event.maxTricks} tricks` };
    }

    // Check if animal knows all selected tricks
    const learnedTricks = trickSystem.getLearnedTricks(animal.id);
    const learnedTrickIds = learnedTricks.map(t => t.trickId);
    
    for (const trickId of selectedTricks) {
      if (!learnedTrickIds.includes(trickId)) {
        return { valid: false, message: `Animal doesn't know trick: ${trickId}` };
      }
    }

    return { valid: true, message: 'Valid trick selection' };
  }

  private calculateTrickScore(
    performance: TrickPerformance,
    trick: TrickDefinition,
    event: PerformanceEvent,
    audienceReaction: AudienceReaction
  ): TrickScore {
    const baseScore = trick.performanceValue;
    const executionScore = Math.floor(performance.performanceQuality * 100);
    const audienceBonus = Math.floor(audienceReaction.excitement * 0.2);
    
    // Difficulty bonus based on event difficulty
    let difficultyBonus = 0;
    switch (event.difficulty) {
      case 'easy': difficultyBonus = 10; break;
      case 'medium': difficultyBonus = 20; break;
      case 'hard': difficultyBonus = 35; break;
      case 'expert': difficultyBonus = 50; break;
    }

    const totalScore = baseScore + executionScore + audienceBonus + difficultyBonus;
    
    const feedback = this.generateTrickFeedback(performance, trick, event);

    return {
      trickId: trick.id,
      baseScore,
      executionScore,
      audienceBonus,
      difficultyBonus,
      totalScore,
      feedback
    };
  }

  private updateAudienceReaction(
    reaction: AudienceReaction,
    trickScore: TrickScore,
    trick: TrickDefinition,
    event: PerformanceEvent
  ): void {
    // Update excitement based on trick performance
    const excitementChange = (trickScore.executionScore - 50) * 0.3;
    reaction.excitement = Math.max(0, Math.min(100, reaction.excitement + excitementChange));
    
    // Update engagement based on trick difficulty and variety
    const engagementChange = trick.difficulty === 'hard' ? 10 : 5;
    reaction.engagement = Math.max(0, Math.min(100, reaction.engagement + engagementChange));
    
    // Update satisfaction based on overall performance
    const satisfactionChange = trickScore.totalScore > 100 ? 8 : 3;
    reaction.satisfaction = Math.max(0, Math.min(100, reaction.satisfaction + satisfactionChange));
    
    // Add feedback based on performance
    if (trickScore.executionScore > 80) {
      reaction.feedback.push(`Amazing ${trick.name}!`);
    } else if (trickScore.executionScore > 60) {
      reaction.feedback.push(`Good ${trick.name}!`);
    } else {
      reaction.feedback.push(`Nice try with ${trick.name}.`);
    }
    
    // Add special reactions for exceptional performances
    if (trickScore.executionScore > 90) {
      reaction.specialReactions.push('The crowd goes wild!');
    }
  }

  private calculatePerformanceResults(
    session: PerformanceSession,
    event: PerformanceEvent
  ): PerformanceResults {
    const maxPossibleScore = session.selectedTricks.length * 200; // Rough estimate
    const percentage = (session.totalScore / maxPossibleScore) * 100;
    
    let ranking: PerformanceResults['ranking'];
    if (percentage >= 90) ranking = 'spectacular';
    else if (percentage >= 75) ranking = 'excellent';
    else if (percentage >= 60) ranking = 'good';
    else if (percentage >= 40) ranking = 'fair';
    else ranking = 'poor';
    
    const audienceScore = Math.floor(
      (session.audienceReaction.excitement + 
       session.audienceReaction.engagement + 
       session.audienceReaction.satisfaction) / 3
    );
    
    const bonusPoints = ranking === 'spectacular' ? 100 : 
                      ranking === 'excellent' ? 50 : 0;
    
    const results: PerformanceResults = {
      totalScore: session.totalScore,
      maxPossibleScore,
      percentage,
      trickScores: [], // Would be populated during performance
      audienceScore,
      bonusPoints,
      penalties: 0,
      ranking,
      achievements: [],
      rewards: event.rewards,
      feedback: session.audienceReaction.feedback
    };
    
    return results;
  }

  private updatePerformanceHistory(animalId: string, session: PerformanceSession): void {
    let history = this.performanceHistory.get(animalId);
    if (!history) {
      history = {
        animalId,
        performances: [],
        totalEvents: 0,
        totalScore: 0,
        averageScore: 0,
        bestPerformance: '',
        favoriteVenue: 'backyard',
        specializations: [],
        achievements: [],
        reputation: 0
      };
    }
    
    history.performances.push(session);
    history.totalEvents++;
    history.totalScore += session.totalScore;
    history.averageScore = history.totalScore / history.totalEvents;
    
    // Update best performance
    if (session.totalScore > (history.performances.find(p => p.sessionId === history.bestPerformance)?.totalScore || 0)) {
      history.bestPerformance = session.sessionId;
    }
    
    // Update reputation based on performance
    const reputationGain = Math.floor(session.totalScore / 100);
    history.reputation = Math.min(100, history.reputation + reputationGain);
    
    this.performanceHistory.set(animalId, history);
  }

  private awardPerformanceRewards(animalId: string, results: PerformanceResults): void {
    results.rewards.forEach(reward => {
      switch (reward.type) {
        case 'bond_points':
          bondingSystem.addBondPoints(
            animalId,
            typeof reward.value === 'number' ? reward.value : 0,
            'Performance reward',
            'performance'
          );
          break;
        case 'unlock':
          // Unlock new events
          const eventToUnlock = this.availableEvents.find(e => e.id === reward.value);
          if (eventToUnlock) {
            eventToUnlock.available = true;
            this.callbacks.onEventUnlocked?.(eventToUnlock.id);
          }
          break;
        case 'achievement':
          this.callbacks.onAchievementEarned?.(animalId, reward.value as string);
          break;
      }
    });
  }

  private generateTrickFeedback(
    performance: TrickPerformance,
    trick: TrickDefinition,
    event: PerformanceEvent
  ): string {
    const quality = performance.performanceQuality;
    
    if (quality >= 0.9) {
      return `Spectacular ${trick.name}! The audience is amazed!`;
    } else if (quality >= 0.7) {
      return `Excellent ${trick.name}! Great execution!`;
    } else if (quality >= 0.5) {
      return `Good ${trick.name}. The audience enjoyed it.`;
    } else {
      return `${trick.name} needs more practice, but good effort!`;
    }
  }

  private loadPerformanceData(): void {
    try {
      const saved = localStorage.getItem('feralFriends_performanceData');
      if (saved) {
        const data = JSON.parse(saved);
        this.performanceHistory = new Map(data.performanceHistory || []);
        this.availableEvents = data.availableEvents || [...PERFORMANCE_EVENTS];
      }
    } catch (error) {
      console.warn('Failed to load performance data:', error);
    }
  }

  private savePerformanceData(): void {
    try {
      const data = {
        performanceHistory: Array.from(this.performanceHistory.entries()),
        availableEvents: this.availableEvents
      };
      localStorage.setItem('feralFriends_performanceData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save performance data:', error);
    }
  }
}

// Export singleton instance
export const performanceSystem = new PerformanceSystem(); 