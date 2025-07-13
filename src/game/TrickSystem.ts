import { Animal } from './Animal';
import { TrickDefinition, TeachingPhase, TrickGesture, ALL_TRICKS, getTrickById, getPrerequisiteTricks } from '../data/tricks';
import { bondingSystem } from './BondingSystem';
import { animalPersonality } from './AnimalPersonality';

export interface TrickLearningProgress {
  trickId: string;
  animalId: string;
  currentPhase: string;
  phaseProgress: number; // 0-1
  attemptsInPhase: number;
  successfulAttempts: number;
  totalAttempts: number;
  startedLearning: number; // timestamp
  lastAttempt: number; // timestamp
  masteryLevel: number; // 0-100
  isLearned: boolean;
  isMastered: boolean;
  personalityModifiers: {
    difficultyAdjustment: number;
    learningSpeedMultiplier: number;
    gestureToleranceBonus: number;
  };
}

export interface TrickAttempt {
  trickId: string;
  animalId: string;
  phaseId: string;
  timestamp: number;
  gestureAccuracy: number; // 0-1
  timingAccuracy: number; // 0-1
  success: boolean;
  feedback: string;
  energyUsed: number;
  bondPointsGained: number;
}

export interface TrickPerformance {
  trickId: string;
  animalId: string;
  timestamp: number;
  performanceQuality: number; // 0-1
  audienceReaction: 'poor' | 'good' | 'excellent' | 'spectacular';
  pointsEarned: number;
  energyUsed: number;
  perfectExecution: boolean;
}

export interface LearnedTrick {
  trickId: string;
  animalId: string;
  learnedDate: number;
  masteredDate?: number;
  timesPerformed: number;
  averagePerformanceQuality: number;
  personalBest: number;
  favoriteVariation?: string;
  customizations: string[]; // Animal-specific adaptations
}

export interface TrickTeachingSession {
  sessionId: string;
  trickId: string;
  animalId: string;
  startTime: number;
  endTime?: number;
  attempts: TrickAttempt[];
  phaseAdvancement: boolean;
  sessionSuccess: boolean;
  energyExpended: number;
  bondingGained: number;
  notes: string[];
}

export class TrickSystem {
  private learningProgress: Map<string, TrickLearningProgress> = new Map();
  private learnedTricks: Map<string, LearnedTrick[]> = new Map(); // animalId -> tricks
  private activeSessions: Map<string, TrickTeachingSession> = new Map();
  private performanceHistory: Map<string, TrickPerformance[]> = new Map();
  private gestureRecognition: GestureRecognitionSystem;
  
  private callbacks: {
    onTrickLearned?: (animalId: string, trickId: string) => void;
    onTrickMastered?: (animalId: string, trickId: string) => void;
    onPhaseAdvanced?: (animalId: string, trickId: string, newPhase: string) => void;
    onPerformanceComplete?: (animalId: string, performance: TrickPerformance) => void;
  } = {};

  constructor() {
    this.gestureRecognition = new GestureRecognitionSystem();
    this.loadTrickData();
  }

  /**
   * Start learning a new trick
   */
  startLearningTrick(animal: Animal, trickId: string): {
    success: boolean;
    message: string;
    session?: TrickTeachingSession;
    requirements?: string[];
  } {
    const trick = getTrickById(trickId);
    if (!trick) {
      return { success: false, message: 'Trick not found' };
    }

    // Check if already learning or learned
    const existingProgress = this.learningProgress.get(`${animal.id}_${trickId}`);
    if (existingProgress?.isLearned) {
      return { success: false, message: 'Trick already learned' };
    }

    // Check requirements
    const requirementCheck = this.checkTrickRequirements(animal, trick);
    if (!requirementCheck.canLearn) {
      return { 
        success: false, 
        message: 'Requirements not met', 
        requirements: requirementCheck.missingRequirements 
      };
    }

    // Check species compatibility
    const compatibility = trick.speciesCompatibility[animal.species];
    if (!compatibility || compatibility.successRate < 0.1) {
      return { 
        success: false, 
        message: `${animal.species} cannot learn this trick effectively` 
      };
    }

    // Initialize learning progress
    const personality = animalPersonality.getPersonality(animal.id);
    const progress: TrickLearningProgress = {
      trickId,
      animalId: animal.id,
      currentPhase: trick.teachingPhases[0].id,
      phaseProgress: 0,
      attemptsInPhase: 0,
      successfulAttempts: 0,
      totalAttempts: 0,
      startedLearning: Date.now(),
      lastAttempt: Date.now(),
      masteryLevel: 0,
      isLearned: false,
      isMastered: false,
      personalityModifiers: this.calculatePersonalityModifiers(personality, trick)
    };

    this.learningProgress.set(`${animal.id}_${trickId}`, progress);

    // Start teaching session
    const session = this.startTeachingSession(animal.id, trickId);

    return {
      success: true,
      message: `Started learning ${trick.name}`,
      session
    };
  }

  /**
   * Attempt to perform a trick gesture
   */
  attemptTrickGesture(
    animalId: string,
    trickId: string,
    gestureInput: {
      type: string;
      direction?: string;
      duration?: number;
      accuracy: number;
      timing: number;
    }
  ): {
    success: boolean;
    feedback: string;
    phaseAdvanced: boolean;
    trickLearned: boolean;
    gestureAccuracy: number;
    nextPhase?: string;
  } {
    const progressKey = `${animalId}_${trickId}`;
    const progress = this.learningProgress.get(progressKey);
    const trick = getTrickById(trickId);
    
    if (!progress || !trick) {
      return {
        success: false,
        feedback: 'No active learning session',
        phaseAdvanced: false,
        trickLearned: false,
        gestureAccuracy: 0
      };
    }

    const currentPhase = trick.teachingPhases.find(p => p.id === progress.currentPhase);
    if (!currentPhase) {
      return {
        success: false,
        feedback: 'Invalid learning phase',
        phaseAdvanced: false,
        trickLearned: false,
        gestureAccuracy: 0
      };
    }

    // Evaluate gesture accuracy
    const gestureAccuracy = this.evaluateGestureAccuracy(
      gestureInput,
      currentPhase.gestures[0], // Simplified for now
      progress.personalityModifiers.gestureToleranceBonus
    );

    // Determine success based on accuracy and phase requirements
    const success = gestureAccuracy >= currentPhase.requiredSuccess;
    
    // Update progress
    progress.totalAttempts++;
    progress.attemptsInPhase++;
    progress.lastAttempt = Date.now();
    
    if (success) {
      progress.successfulAttempts++;
      progress.phaseProgress = Math.min(1, progress.phaseProgress + (1 / trick.practiceAttempts));
    }

    // Generate feedback
    const feedbackMessages = success ? currentPhase.feedback.success : currentPhase.feedback.failure;
    const feedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];

    // Check for phase advancement
    let phaseAdvanced = false;
    let trickLearned = false;
    let nextPhase: string | undefined;

    if (progress.phaseProgress >= 1) {
      const currentPhaseIndex = trick.teachingPhases.findIndex(p => p.id === progress.currentPhase);
      if (currentPhaseIndex < trick.teachingPhases.length - 1) {
        // Advance to next phase
        progress.currentPhase = trick.teachingPhases[currentPhaseIndex + 1].id;
        progress.phaseProgress = 0;
        progress.attemptsInPhase = 0;
        phaseAdvanced = true;
        nextPhase = progress.currentPhase;
        
        this.callbacks.onPhaseAdvanced?.(animalId, trickId, progress.currentPhase);
      } else {
        // Trick learned!
        progress.isLearned = true;
        progress.masteryLevel = 60; // Base mastery level
        trickLearned = true;
        
        // Add to learned tricks
        this.addLearnedTrick(animalId, trickId);
        
        // Award bonding points
        const bondPoints = trick.masteryRewards
          .filter(r => r.type === 'bond_points')
          .reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0);
        
        if (bondPoints > 0) {
          bondingSystem.addBondPoints(animalId, bondPoints, `Learned trick: ${trick.name}`, 'learning');
        }
        
        this.callbacks.onTrickLearned?.(animalId, trickId);
      }
    }

    // Record attempt
    const attempt: TrickAttempt = {
      trickId,
      animalId,
      phaseId: progress.currentPhase,
      timestamp: Date.now(),
      gestureAccuracy,
      timingAccuracy: gestureInput.timing,
      success,
      feedback,
      energyUsed: trick.energyCost,
      bondPointsGained: success ? 2 : 1
    };

    // Add to active session
    const session = this.activeSessions.get(animalId);
    if (session) {
      session.attempts.push(attempt);
    }

    this.saveTrickData();

    return {
      success,
      feedback,
      phaseAdvanced,
      trickLearned,
      gestureAccuracy,
      nextPhase
    };
  }

  /**
   * Perform a learned trick
   */
  performTrick(animalId: string, trickId: string): {
    success: boolean;
    performance: TrickPerformance;
    message: string;
    masteryGained: boolean;
  } {
    const learnedTrick = this.getLearnedTrick(animalId, trickId);
    const trick = getTrickById(trickId);
    
    if (!learnedTrick || !trick) {
      return {
        success: false,
        performance: {} as TrickPerformance,
        message: 'Trick not learned',
        masteryGained: false
      };
    }

    // Calculate performance quality based on mastery and random factors
    const baseQuality = learnedTrick.averagePerformanceQuality || 0.6;
    const masteryBonus = this.getMasteryLevel(animalId, trickId) / 100 * 0.3;
    const randomFactor = (Math.random() - 0.5) * 0.2;
    const performanceQuality = Math.max(0, Math.min(1, baseQuality + masteryBonus + randomFactor));

    // Determine audience reaction
    let audienceReaction: TrickPerformance['audienceReaction'];
    if (performanceQuality >= 0.9) audienceReaction = 'spectacular';
    else if (performanceQuality >= 0.7) audienceReaction = 'excellent';
    else if (performanceQuality >= 0.5) audienceReaction = 'good';
    else audienceReaction = 'poor';

    // Calculate points earned
    const pointsEarned = Math.floor(trick.performanceValue * performanceQuality);
    const perfectExecution = performanceQuality >= 0.95;

    // Create performance record
    const performance: TrickPerformance = {
      trickId,
      animalId,
      timestamp: Date.now(),
      performanceQuality,
      audienceReaction,
      pointsEarned,
      energyUsed: trick.energyCost,
      perfectExecution
    };

    // Update learned trick stats
    learnedTrick.timesPerformed++;
    learnedTrick.averagePerformanceQuality = 
      (learnedTrick.averagePerformanceQuality * (learnedTrick.timesPerformed - 1) + performanceQuality) / 
      learnedTrick.timesPerformed;
    
    if (performanceQuality > learnedTrick.personalBest) {
      learnedTrick.personalBest = performanceQuality;
    }

    // Check for mastery advancement
    let masteryGained = false;
    const currentMastery = this.getMasteryLevel(animalId, trickId);
    if (currentMastery < 100 && performanceQuality > 0.8) {
      const masteryGain = Math.floor(performanceQuality * 10);
      this.addMasteryPoints(animalId, trickId, masteryGain);
      masteryGained = true;
    }

    // Store performance history
    if (!this.performanceHistory.has(animalId)) {
      this.performanceHistory.set(animalId, []);
    }
    this.performanceHistory.get(animalId)!.push(performance);

    // Award bonding points for good performances
    if (performanceQuality > 0.7) {
      const bondPoints = Math.floor(performanceQuality * 10);
      bondingSystem.addBondPoints(animalId, bondPoints, `Great performance of ${trick.name}`, 'performance');
    }

    this.callbacks.onPerformanceComplete?.(animalId, performance);
    this.saveTrickData();

    return {
      success: true,
      performance,
      message: this.getPerformanceMessage(performance),
      masteryGained
    };
  }

  /**
   * Get available tricks for an animal
   */
  getAvailableTricks(animal: Animal): TrickDefinition[] {
    return ALL_TRICKS.filter(trick => {
      const compatibility = trick.speciesCompatibility[animal.species];
      if (!compatibility || compatibility.successRate < 0.3) return false;
      
      const requirements = this.checkTrickRequirements(animal, trick);
      return requirements.canLearn;
    });
  }

  /**
   * Get learned tricks for an animal
   */
  getLearnedTricks(animalId: string): LearnedTrick[] {
    return this.learnedTricks.get(animalId) || [];
  }

  /**
   * Get learning progress for a specific trick
   */
  getLearningProgress(animalId: string, trickId: string): TrickLearningProgress | null {
    return this.learningProgress.get(`${animalId}_${trickId}`) || null;
  }

  /**
   * Get mastery level for a specific trick
   */
  getMasteryLevel(animalId: string, trickId: string): number {
    const progress = this.learningProgress.get(`${animalId}_${trickId}`);
    return progress?.masteryLevel || 0;
  }

  /**
   * Get performance history for an animal
   */
  getPerformanceHistory(animalId: string): TrickPerformance[] {
    return this.performanceHistory.get(animalId) || [];
  }

  /**
   * Set system callbacks
   */
  setCallbacks(callbacks: {
    onTrickLearned?: (animalId: string, trickId: string) => void;
    onTrickMastered?: (animalId: string, trickId: string) => void;
    onPhaseAdvanced?: (animalId: string, trickId: string, newPhase: string) => void;
    onPerformanceComplete?: (animalId: string, performance: TrickPerformance) => void;
  }): void {
    this.callbacks = callbacks;
  }

  // Private helper methods

  private startTeachingSession(animalId: string, trickId: string): TrickTeachingSession {
    const sessionId = `${animalId}_${trickId}_${Date.now()}`;
    const session: TrickTeachingSession = {
      sessionId,
      trickId,
      animalId,
      startTime: Date.now(),
      attempts: [],
      phaseAdvancement: false,
      sessionSuccess: false,
      energyExpended: 0,
      bondingGained: 0,
      notes: []
    };

    this.activeSessions.set(animalId, session);
    return session;
  }

  private checkTrickRequirements(animal: Animal, trick: TrickDefinition): {
    canLearn: boolean;
    missingRequirements: string[];
  } {
    const missing: string[] = [];
    
    trick.requirements.forEach(req => {
      switch (req.type) {
        case 'trust_level':
          if (animal.stats.trust < (req.value as number)) {
            missing.push(`Trust level ${req.value} required (current: ${animal.stats.trust})`);
          }
          break;
        case 'bond_level':
          const bondProgress = bondingSystem.getBondingProgress(animal.id);
          if (!bondProgress || bondProgress.currentBondLevel !== req.value) {
            missing.push(`Bond level ${req.value} required`);
          }
          break;
        case 'prerequisite_trick':
          const hasPrereq = this.getLearnedTrick(animal.id, req.value as string);
          if (!hasPrereq) {
            missing.push(`Must learn ${req.value} first`);
          }
          break;
        case 'energy_level':
          if (animal.stats.energy < (req.value as number)) {
            missing.push(`Energy level ${req.value} required (current: ${animal.stats.energy})`);
          }
          break;
        case 'personality':
          const personality = animalPersonality.getPersonality(animal.id);
          if (!personality || personality.primary !== req.value) {
            missing.push(`Personality ${req.value} required`);
          }
          break;
      }
    });

    return {
      canLearn: missing.length === 0,
      missingRequirements: missing
    };
  }

  private calculatePersonalityModifiers(personality: any, trick: TrickDefinition): TrickLearningProgress['personalityModifiers'] {
    const modifiers = {
      difficultyAdjustment: 0,
      learningSpeedMultiplier: 1,
      gestureToleranceBonus: 0
    };

    if (!personality) return modifiers;

    // Adjust based on personality traits
    switch (personality.primary) {
      case 'curious':
        modifiers.learningSpeedMultiplier = 1.2;
        modifiers.gestureToleranceBonus = 0.1;
        break;
      case 'playful':
        if (trick.category === 'movement' || trick.category === 'performance') {
          modifiers.learningSpeedMultiplier = 1.3;
        }
        break;
      case 'patient':
        modifiers.gestureToleranceBonus = 0.2;
        break;
      case 'energetic':
        if (trick.category === 'movement') {
          modifiers.learningSpeedMultiplier = 1.4;
        }
        break;
      case 'shy':
        modifiers.difficultyAdjustment = 0.1;
        modifiers.learningSpeedMultiplier = 0.8;
        break;
    }

    return modifiers;
  }

  private evaluateGestureAccuracy(
    input: { type: string; direction?: string; duration?: number; accuracy: number },
    expected: TrickGesture,
    toleranceBonus: number
  ): number {
    let accuracy = input.accuracy;
    
    // Apply tolerance bonus
    const adjustedTolerance = Math.min(1, expected.tolerance + toleranceBonus);
    
    // Check gesture type match
    if (input.type !== expected.type) {
      accuracy *= 0.3;
    }
    
    // Check direction match (if applicable)
    if (expected.direction && input.direction !== expected.direction) {
      accuracy *= 0.5;
    }
    
    // Check duration match (if applicable)
    if (expected.duration && input.duration) {
      const durationAccuracy = 1 - Math.abs(expected.duration - input.duration) / expected.duration;
      accuracy *= Math.max(0.3, durationAccuracy);
    }
    
    // Apply tolerance
    if (accuracy >= adjustedTolerance) {
      return Math.min(1, accuracy);
    } else {
      return accuracy * 0.5; // Partial credit for close attempts
    }
  }

  private addLearnedTrick(animalId: string, trickId: string): void {
    const learnedTrick: LearnedTrick = {
      trickId,
      animalId,
      learnedDate: Date.now(),
      timesPerformed: 0,
      averagePerformanceQuality: 0.6,
      personalBest: 0,
      customizations: []
    };

    if (!this.learnedTricks.has(animalId)) {
      this.learnedTricks.set(animalId, []);
    }
    
    this.learnedTricks.get(animalId)!.push(learnedTrick);
  }

  private getLearnedTrick(animalId: string, trickId: string): LearnedTrick | null {
    const tricks = this.learnedTricks.get(animalId) || [];
    return tricks.find(t => t.trickId === trickId) || null;
  }

  private addMasteryPoints(animalId: string, trickId: string, points: number): void {
    const progress = this.learningProgress.get(`${animalId}_${trickId}`);
    if (progress) {
      progress.masteryLevel = Math.min(100, progress.masteryLevel + points);
      
      if (progress.masteryLevel >= 100 && !progress.isMastered) {
        progress.isMastered = true;
        const learnedTrick = this.getLearnedTrick(animalId, trickId);
        if (learnedTrick) {
          learnedTrick.masteredDate = Date.now();
        }
        this.callbacks.onTrickMastered?.(animalId, trickId);
      }
    }
  }

  private getPerformanceMessage(performance: TrickPerformance): string {
    const trick = getTrickById(performance.trickId);
    const trickName = trick?.name || 'trick';
    
    switch (performance.audienceReaction) {
      case 'spectacular':
        return `Spectacular performance of ${trickName}! The audience is amazed!`;
      case 'excellent':
        return `Excellent ${trickName}! Everyone is impressed.`;
      case 'good':
        return `Good ${trickName}. The audience enjoyed it.`;
      case 'poor':
        return `The ${trickName} needs more practice, but it's a good effort.`;
      default:
        return `${trickName} performed.`;
    }
  }

  private loadTrickData(): void {
    try {
      const saved = localStorage.getItem('feralFriends_trickData');
      if (saved) {
        const data = JSON.parse(saved);
        this.learningProgress = new Map(data.learningProgress || []);
        this.learnedTricks = new Map(data.learnedTricks || []);
        this.performanceHistory = new Map(data.performanceHistory || []);
      }
    } catch (error) {
      console.warn('Failed to load trick data:', error);
    }
  }

  private saveTrickData(): void {
    try {
      const data = {
        learningProgress: Array.from(this.learningProgress.entries()),
        learnedTricks: Array.from(this.learnedTricks.entries()),
        performanceHistory: Array.from(this.performanceHistory.entries())
      };
      localStorage.setItem('feralFriends_trickData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save trick data:', error);
    }
  }
}

// Simple gesture recognition system
class GestureRecognitionSystem {
  recognizeGesture(input: any): { type: string; accuracy: number; timing: number } {
    // Simplified gesture recognition
    // In a real implementation, this would analyze touch/mouse input patterns
    return {
      type: input.type || 'tap',
      accuracy: Math.random() * 0.4 + 0.6, // 0.6-1.0
      timing: Math.random() * 0.3 + 0.7 // 0.7-1.0
    };
  }
}

// Export singleton instance
export const trickSystem = new TrickSystem(); 