// Proximity Detection System
// Handles detection of player-animal interactions and triggers appropriate responses

import { Position } from '../types/game';
import { Animal, getDistanceToPlayer, AnimalState } from './Animal';
import { AnimalAI } from './AnimalAI';

export interface ProximityZone {
  name: string;
  radius: number;
  priority: number;
  description: string;
}

export interface ProximityEvent {
  type: 'enter' | 'exit' | 'stay';
  zone: ProximityZone;
  animal: Animal;
  distance: number;
  timestamp: number;
  duration?: number; // For 'stay' events
}

export interface InteractionOpportunity {
  animal: Animal;
  distance: number;
  interactionType: 'observe' | 'approach' | 'interact' | 'avoid';
  confidence: number; // 0-1, how likely interaction will succeed
  recommendedAction: string;
  warning?: string;
}

export class ProximityDetector {
  // Define proximity zones for different interaction types
  private static readonly PROXIMITY_ZONES: ProximityZone[] = [
    {
      name: 'interaction',
      radius: 2.0,
      priority: 1,
      description: 'Close enough for direct interaction'
    },
    {
      name: 'approach',
      radius: 4.0,
      priority: 2,
      description: 'Animal notices player approach'
    },
    {
      name: 'awareness',
      radius: 6.0,
      priority: 3,
      description: 'Animal becomes aware of player presence'
    },
    {
      name: 'detection',
      radius: 10.0,
      priority: 4,
      description: 'Animal detects player in area'
    }
  ];

  private proximityHistory: Map<string, ProximityEvent[]> = new Map();
  private lastUpdateTime: number = 0;
  private eventCallbacks: {
    onProximityEvent?: (event: ProximityEvent) => void;
    onInteractionOpportunity?: (opportunity: InteractionOpportunity) => void;
    onAnimalReaction?: (animal: Animal, reaction: string) => void;
  } = {};

  constructor() {
    this.lastUpdateTime = Date.now();
  }

  /**
   * Set callback functions for proximity events
   */
  setCallbacks(callbacks: typeof this.eventCallbacks): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  /**
   * Update proximity detection for all animals
   */
  update(animals: Animal[], playerPosition: Position): {
    events: ProximityEvent[];
    opportunities: InteractionOpportunity[];
  } {
    const currentTime = Date.now();
    const events: ProximityEvent[] = [];
    const opportunities: InteractionOpportunity[] = [];

    for (const animal of animals) {
      if (!animal.isActive) continue;

      const distance = getDistanceToPlayer(animal, playerPosition);
      const animalEvents = this.updateAnimalProximity(animal, distance, currentTime);
      const opportunity = this.evaluateInteractionOpportunity(animal, distance);

      events.push(...animalEvents);
      
      if (opportunity) {
        opportunities.push(opportunity);
      }

      // Trigger animal reactions based on proximity
      this.handleAnimalReactions(animal, distance, currentTime);
    }

    this.lastUpdateTime = currentTime;
    return { events, opportunities };
  }

  /**
   * Update proximity tracking for a single animal
   */
  private updateAnimalProximity(animal: Animal, distance: number, currentTime: number): ProximityEvent[] {
    const events: ProximityEvent[] = [];
    const animalId = animal.id;

    // Get or create history for this animal
    if (!this.proximityHistory.has(animalId)) {
      this.proximityHistory.set(animalId, []);
    }
    const history = this.proximityHistory.get(animalId)!;

    // Find current zones the animal is in
    const currentZones = ProximityDetector.PROXIMITY_ZONES.filter(zone => distance <= zone.radius);
    const previousZones = this.getPreviousZones(history);

    // Detect zone changes
    for (const zone of ProximityDetector.PROXIMITY_ZONES) {
      const wasInZone = previousZones.includes(zone.name);
      const isInZone = currentZones.includes(zone);

      if (isInZone && !wasInZone) {
        // Entered zone
        const event: ProximityEvent = {
          type: 'enter',
          zone,
          animal,
          distance,
          timestamp: currentTime
        };
        events.push(event);
        history.push(event);
        this.eventCallbacks.onProximityEvent?.(event);

      } else if (!isInZone && wasInZone) {
        // Exited zone
        const event: ProximityEvent = {
          type: 'exit',
          zone,
          animal,
          distance,
          timestamp: currentTime
        };
        events.push(event);
        history.push(event);
        this.eventCallbacks.onProximityEvent?.(event);

      } else if (isInZone && wasInZone) {
        // Still in zone - create stay event periodically
        const lastStayEvent = this.getLastStayEvent(history, zone.name);
        const timeSinceLastStay = lastStayEvent ? 
          currentTime - lastStayEvent.timestamp : 
          currentTime - this.lastUpdateTime;

        if (timeSinceLastStay > 2000) { // Every 2 seconds
          const event: ProximityEvent = {
            type: 'stay',
            zone,
            animal,
            distance,
            timestamp: currentTime,
            duration: timeSinceLastStay
          };
          events.push(event);
          history.push(event);
        }
      }
    }

    // Limit history size
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    return events;
  }

  /**
   * Evaluate if there's an interaction opportunity with an animal
   */
  private evaluateInteractionOpportunity(animal: Animal, distance: number): InteractionOpportunity | null {
    // Don't suggest interactions with inactive animals
    if (!animal.isActive) return null;

    // Determine interaction type based on distance and animal state
    let interactionType: InteractionOpportunity['interactionType'];
    let confidence: number;
    let recommendedAction: string;
    let warning: string | undefined;

    if (distance <= 2.0) {
      // Close interaction range
      if (AnimalAI.canBeInteracted(animal)) {
        interactionType = 'interact';
        confidence = this.calculateInteractionConfidence(animal, distance);
        recommendedAction = this.getInteractionRecommendation(animal);
        
        if (confidence < 0.3) {
          warning = 'Animal seems nervous - approach slowly';
        }
      } else {
        interactionType = 'avoid';
        confidence = 0;
        recommendedAction = 'Give the animal space';
        warning = this.getAvoidanceReason(animal);
      }
    } else if (distance <= 4.0) {
      // Approach range
      interactionType = 'approach';
      confidence = this.calculateApproachConfidence(animal, distance);
      const approachMethod = AnimalAI.getRecommendedApproach(animal);
      recommendedAction = `Move ${approachMethod.method} - ${approachMethod.reason}`;
      
      if (animal.stats.fear > 60) {
        warning = 'Animal seems skittish';
      }
    } else if (distance <= 10.0) {
      // Observation range
      interactionType = 'observe';
      confidence = 0.8; // Observation is usually safe
      recommendedAction = this.getObservationRecommendation(animal);
    } else {
      // Too far for meaningful interaction
      return null;
    }

    return {
      animal,
      distance,
      interactionType,
      confidence,
      recommendedAction,
      warning
    };
  }

  /**
   * Handle animal reactions to player proximity (turn-based)
   */
  private handleAnimalReactions(animal: Animal, distance: number, currentTime: number): void {
    const previousDistance = this.getPreviousDistance(animal.id);
    
    // In turn-based system, check for approach over multiple turns instead of rapid approach
    if (previousDistance && previousDistance - distance > 2.0) {
      // Only react if the approach was significant (more than 2 tiles closer)
      if (animal.stats.fear > 60) { // Higher threshold for turn-based
        this.eventCallbacks.onAnimalReaction?.(animal, 'cautious of approaching player');
      }
    }

    // Update player sighting in animal memory
    if (distance <= 6.0) {
      animal.ai.lastPlayerSighting = {
        position: { x: 0, y: 0 }, // This would be actual player position
        timestamp: currentTime
      };
    }

    // Trigger state changes based on proximity
    this.triggerProximityStateChanges(animal, distance);
  }

  /**
   * Trigger animal state changes based on proximity (turn-based)
   */
  private triggerProximityStateChanges(animal: Animal, distance: number): void {
    const currentState = animal.ai.currentState;

    // If player gets too close and animal should flee (more conservative for turn-based)
    if (distance <= animal.behavior.fleeDistance - 1 && animal.stats.fear > 60) {
      if (currentState !== 'fleeing' && currentState !== 'hiding') {
        // This would trigger through the main AI system
        this.eventCallbacks.onAnimalReaction?.(animal, 'fleeing from player');
      }
    }

    // If player is at good distance and animal is curious (easier to trigger)
    if (distance > animal.behavior.fleeDistance && distance <= 6.0) {
      if (animal.stats.curiosity > 60 && animal.stats.fear < 60) {
        if (currentState === 'idle' && Math.random() < 0.5) {
          this.eventCallbacks.onAnimalReaction?.(animal, 'showing curiosity about player');
        }
      }
    }
  }

  /**
   * Calculate confidence for direct interaction
   */
  private calculateInteractionConfidence(animal: Animal, distance: number): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on animal stats
    confidence += (animal.stats.trust / 100) * 0.3;
    confidence -= (animal.stats.fear / 100) * 0.4;
    confidence += (animal.stats.curiosity / 100) * 0.2;

    // Adjust based on distance (closer can be more intimidating)
    if (distance < 1.0) {
      confidence -= 0.2;
    }

    // Adjust based on animal state
    switch (animal.ai.currentState) {
      case 'curious':
        confidence += 0.3;
        break;
      case 'idle':
        confidence += 0.1;
        break;
      case 'feeding':
        confidence -= 0.2;
        break;
      case 'fleeing':
      case 'hiding':
        confidence = 0;
        break;
    }

    // Adjust based on interaction history
    if (animal.interactionCount > 0) {
      confidence += Math.min(0.2, animal.interactionCount * 0.05);
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate confidence for approach
   */
  private calculateApproachConfidence(animal: Animal, distance: number): number {
    let confidence = 0.7; // Base confidence for approach

    // Adjust based on fear level
    confidence -= (animal.stats.fear / 100) * 0.5;

    // Adjust based on animal state
    if (animal.ai.currentState === 'fleeing' || animal.ai.currentState === 'hiding') {
      confidence = 0.1;
    } else if (animal.ai.currentState === 'curious') {
      confidence += 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get interaction recommendation based on animal state
   */
  private getInteractionRecommendation(animal: Animal): string {
    switch (animal.ai.currentState) {
      case 'curious':
        return 'Hold still and let the animal approach you';
      case 'idle':
        return 'Slowly extend your hand for the animal to sniff';
      case 'feeding':
        return 'Wait for the animal to finish feeding';
      default:
        return 'Move slowly and speak softly';
    }
  }

  /**
   * Get observation recommendation
   */
  private getObservationRecommendation(animal: Animal): string {
    const species = animal.species;
    const state = animal.ai.currentState;

    if (state === 'feeding') {
      return `Watch the ${species} feed - learn about its behavior`;
    } else if (state === 'wandering') {
      return `Observe the ${species}'s movement patterns`;
    } else {
      return `Study the ${species} from a safe distance`;
    }
  }

  /**
   * Get reason why animal should be avoided
   */
  private getAvoidanceReason(animal: Animal): string {
    switch (animal.ai.currentState) {
      case 'fleeing':
        return 'Animal is scared and trying to escape';
      case 'hiding':
        return 'Animal is hiding and feels threatened';
      case 'sleeping':
        return 'Don\'t disturb the sleeping animal';
      default:
        return 'Animal is not receptive to interaction right now';
    }
  }

  // Helper methods

  private getPreviousZones(history: ProximityEvent[]): string[] {
    const recentEvents = history.slice(-10); // Last 10 events
    const zones: string[] = [];
    
    for (const zone of ProximityDetector.PROXIMITY_ZONES) {
      let inZone = false;
      
      // Check most recent events for this zone
      for (let i = recentEvents.length - 1; i >= 0; i--) {
        const event = recentEvents[i];
        if (event.zone.name === zone.name) {
          inZone = event.type === 'enter' || event.type === 'stay';
          break;
        }
      }
      
      if (inZone) {
        zones.push(zone.name);
      }
    }
    
    return zones;
  }

  private getLastStayEvent(history: ProximityEvent[], zoneName: string): ProximityEvent | null {
    for (let i = history.length - 1; i >= 0; i--) {
      const event = history[i];
      if (event.zone.name === zoneName && event.type === 'stay') {
        return event;
      }
    }
    return null;
  }

  private getPreviousDistance(animalId: string): number | null {
    const history = this.proximityHistory.get(animalId);
    if (!history || history.length === 0) return null;
    
    return history[history.length - 1].distance;
  }

  /**
   * Get interaction opportunities for animals within interaction range
   */
  getInteractionOpportunities(animals: Animal[], playerPosition: Position): InteractionOpportunity[] {
    return animals
      .filter(animal => animal.isActive)
      .map(animal => {
        const distance = getDistanceToPlayer(animal, playerPosition);
        return this.evaluateInteractionOpportunity(animal, distance);
      })
      .filter(opportunity => opportunity !== null) as InteractionOpportunity[];
  }

  /**
   * Check if any animals are in interaction range
   */
  hasNearbyAnimals(animals: Animal[], playerPosition: Position, maxDistance: number = 6.0): boolean {
    return animals.some(animal => {
      if (!animal.isActive) return false;
      const distance = getDistanceToPlayer(animal, playerPosition);
      return distance <= maxDistance;
    });
  }

  /**
   * Get the closest animal to the player
   */
  getClosestAnimal(animals: Animal[], playerPosition: Position): { animal: Animal; distance: number } | null {
    let closest: { animal: Animal; distance: number } | null = null;

    for (const animal of animals) {
      if (!animal.isActive) continue;
      
      const distance = getDistanceToPlayer(animal, playerPosition);
      if (!closest || distance < closest.distance) {
        closest = { animal, distance };
      }
    }

    return closest;
  }

  /**
   * Clear proximity history for all animals
   */
  clearHistory(): void {
    this.proximityHistory.clear();
  }

  /**
   * Get proximity statistics for debugging
   */
  getProximityStats(): {
    totalAnimalsTracked: number;
    totalEvents: number;
    averageEventsPerAnimal: number;
  } {
    const totalAnimals = this.proximityHistory.size;
    const totalEvents = Array.from(this.proximityHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    
    return {
      totalAnimalsTracked: totalAnimals,
      totalEvents,
      averageEventsPerAnimal: totalAnimals > 0 ? totalEvents / totalAnimals : 0
    };
  }
}

/**
 * Create a proximity detector with default settings
 */
export function createProximityDetector(): ProximityDetector {
  return new ProximityDetector();
}

/**
 * Utility function to check if player can interact with specific animal
 */
export function canPlayerInteractWithAnimal(animal: Animal, playerPosition: Position): {
  canInteract: boolean;
  reason: string;
  distance: number;
} {
  const distance = getDistanceToPlayer(animal, playerPosition);
  
  if (distance > 2.0) {
    return {
      canInteract: false,
      reason: 'Too far away - get closer to interact',
      distance
    };
  }

  if (!AnimalAI.canBeInteracted(animal)) {
    return {
      canInteract: false,
      reason: `Animal is ${animal.ai.currentState} and cannot be interacted with`,
      distance
    };
  }

  if (animal.stats.fear > 80) {
    return {
      canInteract: false,
      reason: 'Animal is too scared to interact',
      distance
    };
  }

  return {
    canInteract: true,
    reason: 'Ready for interaction',
    distance
  };
}

export default ProximityDetector;