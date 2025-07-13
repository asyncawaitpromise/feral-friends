// Approach System
// Handles movement speed detection, approach mechanics, and trust building through gentle interactions

import { Position } from '../types/game';
import { Animal, getDistanceToPlayer, updateAnimalMemory } from './Animal';

export type ApproachSpeed = 'slow' | 'normal' | 'fast' | 'sudden';
export type ApproachPath = 'direct' | 'indirect' | 'circular' | 'zigzag';

export interface ApproachAttempt {
  animal: Animal;
  playerPosition: Position;
  previousPosition: Position;
  speed: ApproachSpeed;
  path: ApproachPath;
  distance: number;
  previousDistance: number;
  timestamp: number;
  animalReaction: 'calm' | 'cautious' | 'nervous' | 'scared';
}

export interface ApproachResult {
  success: boolean;
  animalReaction: string;
  trustChange: number;
  fearChange: number;
  recommendations: string[];
  nextStepAdvice: string;
}

export class ApproachSystem {
  private approachHistory: Map<string, ApproachAttempt[]> = new Map();
  private playerMovementHistory: Position[] = [];
  private lastUpdateTime: number = 0;
  private callbacks: {
    onApproachAttempt?: (attempt: ApproachAttempt) => void;
    onSuccessfulApproach?: (animal: Animal, result: ApproachResult) => void;
    onFailedApproach?: (animal: Animal, result: ApproachResult) => void;
    onAnimalReaction?: (animal: Animal, reaction: string) => void;
  } = {};

  constructor() {
    this.lastUpdateTime = Date.now();
  }

  /**
   * Set callback functions for approach events
   */
  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update the approach system with new player position
   */
  updatePlayerPosition(
    newPosition: Position, 
    animals: Animal[]
  ): Map<string, ApproachResult> {
    const currentTime = Date.now();
    const results = new Map<string, ApproachResult>();

    // Add to movement history
    this.playerMovementHistory.push({ ...newPosition });
    if (this.playerMovementHistory.length > 10) {
      this.playerMovementHistory.shift();
    }

    // Analyze approach for each nearby animal
    for (const animal of animals) {
      if (!animal.isActive) continue;
      
      const distance = getDistanceToPlayer(animal, newPosition);
      if (distance <= 12) { // Only analyze animals within approach range
        const result = this.analyzeApproach(animal, newPosition, currentTime);
        if (result) {
          results.set(animal.id, result);
        }
      }
    }

    this.lastUpdateTime = currentTime;
    return results;
  }

  /**
   * Get approach advice for a specific animal
   */
  getApproachAdvice(animal: Animal, playerPosition: Position): {
    recommendedSpeed: ApproachSpeed;
    recommendedPath: ApproachPath;
    advice: string[];
    warningsForAnimal: string[];
  } {
    const distance = getDistanceToPlayer(animal, playerPosition);
    const history = this.approachHistory.get(animal.id) || [];
    
    // Analyze animal's personality and current state
    const advice: string[] = [];
    const warnings: string[] = [];
    let recommendedSpeed: ApproachSpeed = 'slow';
    let recommendedPath: ApproachPath = 'indirect';

    // Base recommendations on animal stats
    if (animal.stats.fear > 70) {
      recommendedSpeed = 'slow';
      recommendedPath = 'indirect';
      advice.push('This animal is very scared - approach extremely slowly');
      advice.push('Take an indirect path to seem less threatening');
      warnings.push('Direct approach will likely cause the animal to flee');
    } else if (animal.stats.fear > 40) {
      recommendedSpeed = 'slow';
      recommendedPath = 'indirect';
      advice.push('Approach slowly to avoid startling this cautious animal');
    } else if (animal.stats.trust > 60) {
      recommendedSpeed = 'normal';
      recommendedPath = 'direct';
      advice.push('This animal trusts you - normal approach should work');
    } else {
      recommendedSpeed = 'slow';
      advice.push('Build trust with slow, gentle movements');
    }

    // Adjust based on animal state
    switch (animal.ai.currentState) {
      case 'feeding':
        recommendedSpeed = 'slow';
        advice.push('Animal is feeding - approach very slowly');
        warnings.push('Don\'t disturb the animal while eating');
        break;
      case 'sleeping':
        advice.push('Animal is sleeping - wait for it to wake up');
        warnings.push('Approaching a sleeping animal may startle it');
        break;
      case 'curious':
        recommendedSpeed = 'slow';
        advice.push('Animal is curious - let it come to you');
        break;
      case 'fleeing':
        advice.push('Animal is fleeing - give it space to calm down');
        warnings.push('Don\'t chase a fleeing animal');
        break;
    }

    // Adjust based on distance
    if (distance > 6) {
      advice.push('You can move normally at this distance');
    } else if (distance > 3) {
      advice.push('You\'re getting close - slow down your approach');
    } else {
      advice.push('Very close - any sudden movement may scare the animal');
    }

    // Learn from previous attempts
    const recentAttempts = history.filter(h => 
      Date.now() - h.timestamp < 300000 // Last 5 minutes
    );
    
    if (recentAttempts.length > 0) {
      const successfulAttempts = recentAttempts.filter(a => a.animalReaction === 'calm');
      const scaredAttempts = recentAttempts.filter(a => a.animalReaction === 'scared');
      
      if (scaredAttempts.length > successfulAttempts.length) {
        recommendedSpeed = 'slow';
        advice.push('Previous approaches scared this animal - be extra gentle');
      }
    }

    return {
      recommendedSpeed,
      recommendedPath,
      advice,
      warningsForAnimal: warnings
    };
  }

  /**
   * Evaluate the quality of an approach attempt
   */
  evaluateApproachQuality(
    animal: Animal,
    speed: ApproachSpeed,
    path: ApproachPath,
    distance: number
  ): {
    score: number; // 0-1
    feedback: string;
    improvements: string[];
  } {
    let score = 0.5; // Base score
    const improvements: string[] = [];

    // Evaluate speed appropriateness
    const fearLevel = animal.stats.fear;
    const trustLevel = animal.stats.trust;

    if (fearLevel > 70) {
      // Very scared animal
      if (speed === 'slow') score += 0.3;
      else if (speed === 'normal') score -= 0.1;
      else score -= 0.4;
      
      if (speed !== 'slow') {
        improvements.push('Approach more slowly for scared animals');
      }
    } else if (fearLevel > 40) {
      // Cautious animal
      if (speed === 'slow') score += 0.2;
      else if (speed === 'normal') score += 0.1;
      else score -= 0.2;
    } else if (trustLevel > 60) {
      // Trusting animal
      if (speed === 'normal') score += 0.2;
      else if (speed === 'slow') score += 0.1;
      
      if (speed === 'slow' && trustLevel > 80) {
        improvements.push('This animal trusts you - you can move more naturally');
      }
    }

    // Evaluate path appropriateness
    if (fearLevel > 50) {
      if (path === 'indirect' || path === 'circular') score += 0.2;
      else score -= 0.1;
      
      if (path === 'direct') {
        improvements.push('Try an indirect approach for nervous animals');
      }
    }

    // Distance considerations
    if (distance < 2 && speed !== 'slow') {
      score -= 0.3;
      improvements.push('Move very slowly when very close');
    }

    // Animal state considerations
    switch (animal.ai.currentState) {
      case 'feeding':
        if (speed === 'slow') score += 0.1;
        else score -= 0.2;
        break;
      case 'curious':
        if (speed === 'slow') score += 0.2;
        break;
      case 'fleeing':
        score -= 0.5;
        improvements.push('Don\'t approach fleeing animals');
        break;
    }

    score = Math.max(0, Math.min(1, score));

    let feedback: string;
    if (score >= 0.8) feedback = 'Excellent approach!';
    else if (score >= 0.6) feedback = 'Good approach';
    else if (score >= 0.4) feedback = 'Adequate approach';
    else if (score >= 0.2) feedback = 'Poor approach';
    else feedback = 'Very poor approach';

    return { score, feedback, improvements };
  }

  /**
   * Calculate trust building from gentle interactions
   */
  calculateTrustBuilding(
    animal: Animal,
    approachQuality: number,
    consistency: number
  ): {
    trustGain: number;
    fearReduction: number;
    memo: string;
  } {
    let trustGain = 0;
    let fearReduction = 0;

    // Base trust gain from approach quality
    trustGain = approachQuality * 3;

    // Bonus for consistency
    if (consistency > 0.7) {
      trustGain += 2;
      fearReduction += 3;
    } else if (consistency > 0.5) {
      trustGain += 1;
      fearReduction += 2;
    }

    // Adjust based on current trust level
    if (animal.stats.trust < 20) {
      trustGain *= 1.5; // Easier to gain initial trust
    } else if (animal.stats.trust > 80) {
      trustGain *= 0.5; // Harder to gain trust when already high
    }

    // Adjust based on fear level
    if (animal.stats.fear > 70) {
      fearReduction += approachQuality * 2;
      trustGain *= 0.7; // Scared animals gain trust slowly
    }

    let memo: string;
    if (trustGain >= 5) {
      memo = 'The animal is learning to trust you';
    } else if (trustGain >= 2) {
      memo = 'Your gentle approach is building trust';
    } else if (trustGain > 0) {
      memo = 'Small progress in gaining trust';
    } else {
      memo = 'No trust gained from this interaction';
    }

    return {
      trustGain: Math.round(trustGain),
      fearReduction: Math.round(fearReduction),
      memo
    };
  }

  // Private methods

  private analyzeApproach(
    animal: Animal,
    newPosition: Position,
    currentTime: number
  ): ApproachResult | null {
    const history = this.approachHistory.get(animal.id) || [];
    const distance = getDistanceToPlayer(animal, newPosition);

    // Get previous position from movement history
    if (this.playerMovementHistory.length < 2) return null;
    
    const previousPosition = this.playerMovementHistory[this.playerMovementHistory.length - 2];
    const previousDistance = Math.sqrt(
      Math.pow(animal.position.x - previousPosition.x, 2) + 
      Math.pow(animal.position.y - previousPosition.y, 2)
    );

    // Determine approach speed
    const movementDistance = Math.sqrt(
      Math.pow(newPosition.x - previousPosition.x, 2) + 
      Math.pow(newPosition.y - previousPosition.y, 2)
    );
    
    const timeDelta = currentTime - this.lastUpdateTime;
    const speed = this.categorizeSpeed(movementDistance, timeDelta);

    // Determine approach path
    const path = this.categorizePath(animal, previousPosition, newPosition);

    // Determine animal reaction
    const reaction = this.determineAnimalReaction(animal, speed, path, distance, previousDistance);

    // Create approach attempt
    const attempt: ApproachAttempt = {
      animal,
      playerPosition: newPosition,
      previousPosition,
      speed,
      path,
      distance,
      previousDistance,
      timestamp: currentTime,
      animalReaction: reaction
    };

    // Record attempt
    history.push(attempt);
    if (history.length > 20) {
      history.shift();
    }
    this.approachHistory.set(animal.id, history);

    // Trigger callbacks
    this.callbacks.onApproachAttempt?.(attempt);
    this.callbacks.onAnimalReaction?.(animal, reaction);

    // Generate result
    return this.generateApproachResult(animal, attempt, history);
  }

  private categorizeSpeed(movementDistance: number, timeDelta: number): ApproachSpeed {
    if (timeDelta === 0) return 'sudden';
    
    const speed = movementDistance / (timeDelta / 1000); // tiles per second
    
    if (speed < 0.5) return 'slow';
    if (speed < 1.5) return 'normal';
    if (speed < 3) return 'fast';
    return 'sudden';
  }

  private categorizePath(animal: Animal, from: Position, to: Position): ApproachPath {
    // Calculate angle change to determine path type
    const angleToAnimal = Math.atan2(
      animal.position.y - from.y,
      animal.position.x - from.x
    );
    
    const movementAngle = Math.atan2(to.y - from.y, to.x - from.x);
    const angleDiff = Math.abs(angleToAnimal - movementAngle);
    
    if (angleDiff < Math.PI / 6) return 'direct'; // Within 30 degrees
    if (angleDiff < Math.PI / 3) return 'indirect'; // Within 60 degrees
    if (angleDiff < Math.PI * 2 / 3) return 'circular'; // Within 120 degrees
    return 'zigzag'; // More than 120 degrees
  }

  private determineAnimalReaction(
    animal: Animal,
    speed: ApproachSpeed,
    path: ApproachPath,
    distance: number,
    previousDistance: number
  ): 'calm' | 'cautious' | 'nervous' | 'scared' {
    let reactionScore = 0;

    // Base reaction on animal's fear and trust
    reactionScore += animal.stats.fear / 100;
    reactionScore -= animal.stats.trust / 200;

    // Adjust for approach speed
    switch (speed) {
      case 'slow': reactionScore -= 0.2; break;
      case 'normal': break;
      case 'fast': reactionScore += 0.3; break;
      case 'sudden': reactionScore += 0.6; break;
    }

    // Adjust for path
    switch (path) {
      case 'indirect': reactionScore -= 0.1; break;
      case 'circular': reactionScore -= 0.05; break;
      case 'direct': reactionScore += 0.1; break;
      case 'zigzag': reactionScore += 0.2; break;
    }

    // Adjust for distance and getting closer
    if (distance < 3) reactionScore += 0.2;
    if (distance < 1.5) reactionScore += 0.3;
    if (previousDistance > distance) reactionScore += 0.1; // Getting closer

    // Adjust for animal state
    switch (animal.ai.currentState) {
      case 'feeding': reactionScore += 0.2; break;
      case 'sleeping': reactionScore += 0.4; break;
      case 'curious': reactionScore -= 0.2; break;
      case 'fleeing': reactionScore += 0.5; break;
    }

    // Determine reaction
    if (reactionScore <= 0.2) return 'calm';
    if (reactionScore <= 0.5) return 'cautious';
    if (reactionScore <= 0.8) return 'nervous';
    return 'scared';
  }

  private generateApproachResult(
    animal: Animal,
    attempt: ApproachAttempt,
    history: ApproachAttempt[]
  ): ApproachResult {
    const evaluation = this.evaluateApproachQuality(
      animal,
      attempt.speed,
      attempt.path,
      attempt.distance
    );

    // Calculate consistency from recent history
    const recentAttempts = history.slice(-5);
    const consistency = this.calculateConsistency(recentAttempts);

    // Calculate trust building
    const trustBuilding = this.calculateTrustBuilding(animal, evaluation.score, consistency);

    const success = attempt.animalReaction === 'calm' || attempt.animalReaction === 'cautious';
    
    // Apply trust/fear changes to animal
    if (success) {
      animal.stats.trust = Math.min(100, animal.stats.trust + trustBuilding.trustGain);
      animal.stats.fear = Math.max(0, animal.stats.fear - trustBuilding.fearReduction);
      
      // Update memory with positive interaction
      updateAnimalMemory(animal, attempt.playerPosition, 'safe');
    } else {
      // Failed approach increases fear
      const fearIncrease = attempt.animalReaction === 'scared' ? 5 : 2;
      animal.stats.fear = Math.min(100, animal.stats.fear + fearIncrease);
      
      // Update memory with negative interaction
      updateAnimalMemory(animal, attempt.playerPosition, 'danger');
    }

    const result: ApproachResult = {
      success,
      animalReaction: `Animal is ${attempt.animalReaction}`,
      trustChange: success ? trustBuilding.trustGain : 0,
      fearChange: success ? -trustBuilding.fearReduction : (attempt.animalReaction === 'scared' ? 5 : 2),
      recommendations: evaluation.improvements,
      nextStepAdvice: this.getNextStepAdvice(animal, attempt, success)
    };

    // Trigger callbacks
    if (success) {
      this.callbacks.onSuccessfulApproach?.(animal, result);
    } else {
      this.callbacks.onFailedApproach?.(animal, result);
    }

    return result;
  }

  private calculateConsistency(attempts: ApproachAttempt[]): number {
    if (attempts.length === 0) return 0;
    
    const calmAttempts = attempts.filter(a => a.animalReaction === 'calm').length;
    return calmAttempts / attempts.length;
  }

  private getNextStepAdvice(animal: Animal, attempt: ApproachAttempt, success: boolean): string {
    if (success) {
      if (attempt.distance <= 2) {
        return 'You\'re close enough to try interacting!';
      } else {
        return 'Continue approaching slowly - you\'re doing well';
      }
    } else {
      if (attempt.animalReaction === 'scared') {
        return 'Stop moving and let the animal calm down';
      } else {
        return 'Try approaching more slowly and indirectly';
      }
    }
  }

  /**
   * Get approach statistics for an animal
   */
  getApproachStats(animalId: string): {
    totalAttempts: number;
    successRate: number;
    averageReaction: string;
    trustTrend: 'improving' | 'stable' | 'declining';
  } {
    const history = this.approachHistory.get(animalId) || [];
    const recentHistory = history.slice(-10);
    
    if (recentHistory.length === 0) {
      return {
        totalAttempts: 0,
        successRate: 0,
        averageReaction: 'unknown',
        trustTrend: 'stable'
      };
    }

    const successfulAttempts = recentHistory.filter(
      h => h.animalReaction === 'calm' || h.animalReaction === 'cautious'
    ).length;
    
    const successRate = successfulAttempts / recentHistory.length;

    // Determine average reaction
    const reactionCounts = {
      calm: recentHistory.filter(h => h.animalReaction === 'calm').length,
      cautious: recentHistory.filter(h => h.animalReaction === 'cautious').length,
      nervous: recentHistory.filter(h => h.animalReaction === 'nervous').length,
      scared: recentHistory.filter(h => h.animalReaction === 'scared').length
    };

    const averageReaction = Object.entries(reactionCounts)
      .reduce((max, [reaction, count]) => count > max.count ? { reaction, count } : max, { reaction: 'calm', count: 0 })
      .reaction;

    // Determine trust trend
    let trustTrend: 'improving' | 'stable' | 'declining';
    if (recentHistory.length >= 5) {
      const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
      const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));
      
      const firstHalfSuccess = firstHalf.filter(h => h.animalReaction === 'calm').length / firstHalf.length;
      const secondHalfSuccess = secondHalf.filter(h => h.animalReaction === 'calm').length / secondHalf.length;
      
      if (secondHalfSuccess > firstHalfSuccess + 0.2) trustTrend = 'improving';
      else if (secondHalfSuccess < firstHalfSuccess - 0.2) trustTrend = 'declining';
      else trustTrend = 'stable';
    } else {
      trustTrend = 'stable';
    }

    return {
      totalAttempts: recentHistory.length,
      successRate,
      averageReaction,
      trustTrend
    };
  }

  /**
   * Clear all approach history
   */
  clearHistory(): void {
    this.approachHistory.clear();
    this.playerMovementHistory = [];
  }
}

/**
 * Create a new approach system
 */
export function createApproachSystem(): ApproachSystem {
  return new ApproachSystem();
}

export default ApproachSystem;