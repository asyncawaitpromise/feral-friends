import { Animal } from './Animal';
import { Position } from '../types/game';
import { TrickDefinition } from '../data/tricks';

export interface EncounterAnimal extends Animal {
  encounter: {
    fear: number; // 0-100, how scared the animal is
    affection: number; // 0-100, how much they like the player
    interactionCount: number; // Number of interactions in this encounter
    startTime: number; // When encounter started
    lastInteraction: number; // Last interaction timestamp
    personalityTraits: string[]; // Behavioral traits affecting interactions
    hasBeenCalmed: boolean; // Whether fear has been reduced below threshold
    tamingProgress: number; // 0-100, progress toward being tamed
    fleeThreshold: number; // Fear level at which animal will flee
    tameThreshold: number; // Affection level needed to tame
    interactions: EncounterInteraction[]; // History of interactions
  };
}

export interface EncounterInteraction {
  id: string;
  type: 'trick' | 'taming_method' | 'item_use' | 'flee_attempt';
  timestamp: number;
  success: boolean;
  fearBefore: number;
  fearAfter: number;
  affectionBefore: number;
  affectionAfter: number;
  details: {
    trickId?: string;
    methodId?: string;
    itemId?: string;
    effectiveness?: number;
    playerFeedback?: string;
    animalReaction?: string;
  };
}

export interface TrickResult {
  success: boolean;
  fearReduction: number;
  affectionGain: number;
  effectiveness: number;
  playerFeedback: string;
  animalReaction: string;
  criticalSuccess?: boolean; // Extra good result
  criticalFailure?: boolean; // Made things worse
}

export interface TamingResult {
  success: boolean;
  fearReduction: number;
  affectionGain: number;
  effectiveness: number;
  playerFeedback: string;
  animalReaction: string;
  riskTriggered?: boolean; // If high-risk method backfired
  bonusEffect?: string; // Special positive effect
}

export class EncounterAnimalManager {
  /**
   * Create an encounter animal from a regular animal
   */
  static createEncounterAnimal(baseAnimal: Animal, position: Position): EncounterAnimal {
    const initialFear = 50 + Math.random() * 40; // 50-90% fear for wild animals
    const fleeThreshold = 80 + Math.random() * 20; // 80-100% flee threshold
    const tameThreshold = 70 + Math.random() * 20; // 70-90% affection needed
    
    // Generate personality traits that affect interactions
    const personalityTraits = this.generatePersonalityTraits(baseAnimal.species);
    
    const encounterAnimal: EncounterAnimal = {
      ...baseAnimal,
      position,
      encounter: {
        fear: initialFear,
        affection: 0,
        interactionCount: 0,
        startTime: Date.now(),
        lastInteraction: 0,
        personalityTraits,
        hasBeenCalmed: false,
        tamingProgress: 0,
        fleeThreshold,
        tameThreshold,
        interactions: []
      }
    };

    return encounterAnimal;
  }

  /**
   * Generate personality traits based on species
   */
  private static generatePersonalityTraits(species: string): string[] {
    const speciesTraits: Record<string, string[]> = {
      rabbit: ['timid', 'gentle', 'quick_to_flee'],
      fox: ['clever', 'cautious', 'independent'],
      deer: ['graceful', 'alert', 'easily_startled'],
      bird: ['energetic', 'curious', 'easily_distracted'],
      squirrel: ['playful', 'energetic', 'food_motivated'],
      mouse: ['timid', 'quick', 'nervous'],
      frog: ['calm', 'patient', 'moisture_loving'],
      turtle: ['slow', 'steady', 'patient'],
      butterfly: ['delicate', 'beautiful', 'fragile'],
      raccoon: ['clever', 'mischievous', 'food_motivated'],
      bear: ['strong', 'protective', 'cautious'],
      wolf: ['proud', 'loyal', 'pack_oriented'],
      otter: ['playful', 'social', 'water_loving'],
      hedgehog: ['defensive', 'spiky', 'gentle_heart'],
      bat: ['nocturnal', 'sensitive', 'echolocation'],
      owl: ['wise', 'patient', 'night_hunter'],
      hawk: ['proud', 'sharp_eyed', 'independent']
    };

    const baseTraits = speciesTraits[species] || ['neutral', 'calm'];
    
    // Add 2-3 random traits
    const shuffled = [...baseTraits].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  /**
   * Perform a trick on the encounter animal
   */
  static performTrick(animal: EncounterAnimal, trick: TrickDefinition): TrickResult {
    const fearBefore = animal.encounter.fear;
    const affectionBefore = animal.encounter.affection;

    // Base effectiveness from species compatibility
    const speciesData = trick.speciesCompatibility[animal.species];
    let baseEffectiveness = speciesData?.successRate || 0.5;

    // Adjust for current fear level
    let fearModifier = 1.0;
    if (animal.encounter.fear > 70) {
      fearModifier = 0.6; // Very scared animals are harder to impress
    } else if (animal.encounter.fear > 40) {
      fearModifier = 0.8;
    } else if (animal.encounter.fear < 20) {
      fearModifier = 1.3; // Calm animals are easier to impress
    }

    // Adjust for personality traits
    let personalityModifier = 1.0;
    animal.encounter.personalityTraits.forEach(trait => {
      switch (trait) {
        case 'timid':
          if (trick.difficulty === 'easy') personalityModifier *= 1.2;
          else personalityModifier *= 0.7;
          break;
        case 'playful':
          if (trick.category === 'movement' || trick.category === 'performance') personalityModifier *= 1.3;
          break;
        case 'clever':
          if (trick.difficulty === 'hard' || trick.difficulty === 'expert') personalityModifier *= 1.2;
          break;
        case 'energetic':
          if (trick.category === 'movement') personalityModifier *= 1.4;
          break;
        case 'calm':
          if (trick.category === 'basic') personalityModifier *= 1.2;
          break;
      }
    });

    const finalEffectiveness = baseEffectiveness * fearModifier * personalityModifier;
    const success = Math.random() < finalEffectiveness;

    let fearReduction = 0;
    let affectionGain = 0;
    let playerFeedback = '';
    let animalReaction = '';
    let criticalSuccess = false;
    let criticalFailure = false;

    if (success) {
      // Base fear reduction and affection gain
      fearReduction = Math.min(30, trick.performanceValue * 0.5);
      affectionGain = Math.min(25, trick.performanceValue * 0.4);

      // Apply personality bonuses
      if (animal.encounter.personalityTraits.includes('playful') && trick.category === 'movement') {
        fearReduction *= 1.5;
        affectionGain *= 1.3;
      }

      // Check for critical success (10% chance)
      if (Math.random() < 0.1) {
        criticalSuccess = true;
        fearReduction *= 1.8;
        affectionGain *= 1.5;
        playerFeedback = `Amazing! The ${animal.species} is absolutely delighted by your ${trick.name}!`;
        animalReaction = 'The animal seems genuinely impressed and much more comfortable around you.';
      } else {
        playerFeedback = `Great! The ${animal.species} enjoyed your ${trick.name}.`;
        animalReaction = 'The animal seems less scared and more interested in you.';
      }
    } else {
      // Failed trick
      fearReduction = -5; // Actually increases fear slightly
      affectionGain = 0;

      // Check for critical failure (5% chance)
      if (Math.random() < 0.05) {
        criticalFailure = true;
        fearReduction = -15;
        playerFeedback = `Oh no! Your ${trick.name} attempt startled the ${animal.species}!`;
        animalReaction = 'The animal is now more scared and backing away from you.';
      } else {
        playerFeedback = `The ${animal.species} doesn't seem impressed by your ${trick.name}.`;
        animalReaction = 'The animal watches cautiously but remains wary.';
      }
    }

    // Apply changes
    animal.encounter.fear = Math.max(0, Math.min(100, animal.encounter.fear - fearReduction));
    animal.encounter.affection = Math.max(0, Math.min(100, animal.encounter.affection + affectionGain));
    animal.encounter.interactionCount++;
    animal.encounter.lastInteraction = Date.now();

    // Check if animal has been calmed
    if (animal.encounter.fear < 30 && !animal.encounter.hasBeenCalmed) {
      animal.encounter.hasBeenCalmed = true;
    }

    // Record interaction
    const interaction: EncounterInteraction = {
      id: `trick_${Date.now()}`,
      type: 'trick',
      timestamp: Date.now(),
      success,
      fearBefore,
      fearAfter: animal.encounter.fear,
      affectionBefore,
      affectionAfter: animal.encounter.affection,
      details: {
        trickId: trick.id,
        effectiveness: finalEffectiveness,
        playerFeedback,
        animalReaction
      }
    };
    animal.encounter.interactions.push(interaction);

    return {
      success,
      fearReduction,
      affectionGain,
      effectiveness: finalEffectiveness,
      playerFeedback,
      animalReaction,
      criticalSuccess,
      criticalFailure
    };
  }

  /**
   * Use a taming method on the encounter animal
   */
  static useTamingMethod(animal: EncounterAnimal, method: any): TamingResult {
    const fearBefore = animal.encounter.fear;
    const affectionBefore = animal.encounter.affection;

    // Calculate effectiveness based on fear level and method type
    let effectiveness = method.effectiveness;
    
    // Adjust for current fear level
    if (animal.encounter.fear > 80) {
      if (method.type === 'give_space' || method.type === 'speak_softly') {
        effectiveness *= 1.3;
      } else if (method.riskLevel === 'high') {
        effectiveness *= 0.3;
      } else {
        effectiveness *= 0.7;
      }
    } else if (animal.encounter.fear < 30) {
      if (method.type === 'gentle_touch' || method.type === 'play') {
        effectiveness *= 1.3;
      }
    }

    // Personality adjustments
    animal.encounter.personalityTraits.forEach(trait => {
      switch (trait) {
        case 'food_motivated':
          if (method.type === 'food') effectiveness *= 1.4;
          break;
        case 'playful':
          if (method.type === 'play') effectiveness *= 1.3;
          break;
        case 'timid':
          if (method.riskLevel === 'low') effectiveness *= 1.2;
          else effectiveness *= 0.8;
          break;
        case 'gentle':
          if (method.type === 'gentle_touch') effectiveness *= 1.3;
          break;
      }
    });

    const success = Math.random() < effectiveness;
    let fearReduction = 0;
    let affectionGain = 0;
    let playerFeedback = '';
    let animalReaction = '';
    let riskTriggered = false;
    let bonusEffect = '';

    if (success) {
      fearReduction = method.fearReduction;
      affectionGain = method.affectionGain;

      // Bonus effects for personality matches
      if (animal.encounter.personalityTraits.includes('food_motivated') && method.type === 'food') {
        bonusEffect = 'The animal seems especially grateful for the food!';
        affectionGain *= 1.3;
      }

      playerFeedback = `Success! Your ${method.name.toLowerCase()} approach worked well.`;
      animalReaction = 'The animal responds positively to your gentle approach.';
    } else {
      // Method failed
      if (method.riskLevel === 'high') {
        riskTriggered = true;
        fearReduction = -10; // Increases fear
        playerFeedback = `Your ${method.name.toLowerCase()} attempt was too bold and scared the animal.`;
        animalReaction = 'The animal jerks back and becomes more wary of you.';
      } else {
        fearReduction = 0;
        affectionGain = 0;
        playerFeedback = `Your ${method.name.toLowerCase()} attempt had no effect.`;
        animalReaction = 'The animal remains unchanged by your approach.';
      }
    }

    // Apply changes
    animal.encounter.fear = Math.max(0, Math.min(100, animal.encounter.fear - fearReduction));
    animal.encounter.affection = Math.max(0, Math.min(100, animal.encounter.affection + affectionGain));
    animal.encounter.interactionCount++;
    animal.encounter.lastInteraction = Date.now();

    // Update taming progress
    animal.encounter.tamingProgress = (animal.encounter.affection / animal.encounter.tameThreshold) * 100;

    // Record interaction
    const interaction: EncounterInteraction = {
      id: `taming_${Date.now()}`,
      type: 'taming_method',
      timestamp: Date.now(),
      success,
      fearBefore,
      fearAfter: animal.encounter.fear,
      affectionBefore,
      affectionAfter: animal.encounter.affection,
      details: {
        methodId: method.id,
        effectiveness,
        playerFeedback,
        animalReaction
      }
    };
    animal.encounter.interactions.push(interaction);

    return {
      success,
      fearReduction,
      affectionGain,
      effectiveness,
      playerFeedback,
      animalReaction,
      riskTriggered,
      bonusEffect
    };
  }

  /**
   * Check if animal should flee based on fear level
   */
  static shouldAnimalFlee(animal: EncounterAnimal): boolean {
    return animal.encounter.fear >= animal.encounter.fleeThreshold;
  }

  /**
   * Check if animal is ready to be tamed
   */
  static canAnimalBeTamed(animal: EncounterAnimal): boolean {
    return animal.encounter.affection >= animal.encounter.tameThreshold && animal.encounter.fear < 40;
  }

  /**
   * Get encounter summary for player feedback
   */
  static getEncounterSummary(animal: EncounterAnimal): {
    status: 'ongoing' | 'success' | 'fled' | 'failed';
    fearLevel: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
    affectionLevel: 'none' | 'slight' | 'moderate' | 'strong' | 'bonded';
    readyToTame: boolean;
    interactionCount: number;
    duration: number;
  } {
    const fear = animal.encounter.fear;
    const affection = animal.encounter.affection;
    const duration = Date.now() - animal.encounter.startTime;

    let fearLevel: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
    if (fear > 80) fearLevel = 'very_high';
    else if (fear > 60) fearLevel = 'high';
    else if (fear > 40) fearLevel = 'medium';
    else if (fear > 20) fearLevel = 'low';
    else fearLevel = 'very_low';

    let affectionLevel: 'none' | 'slight' | 'moderate' | 'strong' | 'bonded';
    if (affection < 20) affectionLevel = 'none';
    else if (affection < 40) affectionLevel = 'slight';
    else if (affection < 60) affectionLevel = 'moderate';
    else if (affection < 80) affectionLevel = 'strong';
    else affectionLevel = 'bonded';

    let status: 'ongoing' | 'success' | 'fled' | 'failed' = 'ongoing';
    if (this.canAnimalBeTamed(animal)) {
      status = 'success';
    } else if (this.shouldAnimalFlee(animal)) {
      status = 'fled';
    }

    return {
      status,
      fearLevel,
      affectionLevel,
      readyToTame: this.canAnimalBeTamed(animal),
      interactionCount: animal.encounter.interactionCount,
      duration
    };
  }
}