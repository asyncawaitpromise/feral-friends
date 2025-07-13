import { Animal } from './Animal';
import { TamingInteraction } from './TamingSystem';

export type PersonalityTrait = 
  | 'shy' 
  | 'curious' 
  | 'playful' 
  | 'aggressive' 
  | 'friendly' 
  | 'lazy' 
  | 'energetic'
  | 'cautious'
  | 'bold'
  | 'social'
  | 'solitary'
  | 'patient'
  | 'restless';

export interface PersonalityProfile {
  primary: PersonalityTrait;
  secondary?: PersonalityTrait;
  intensity: number; // 0-100, how strongly they express their personality
  adaptability: number; // 0-100, how much they can change based on interactions
  socialPreference: 'solitary' | 'small_groups' | 'large_groups';
  activityLevel: 'low' | 'moderate' | 'high';
  fearResponse: 'freeze' | 'flee' | 'hide' | 'aggressive';
  trustBuilding: 'slow' | 'moderate' | 'fast';
  preferredInteractions: string[];
  dislikedInteractions: string[];
  specialRequirements?: string[];
}

export interface PersonalityModifiers {
  trustGainMultiplier: number;
  fearDecayRate: number;
  energyConsumption: number;
  interactionCooldown: number;
  approachTolerance: number;
  foodPreference: string[];
  toyPreference: string[];
  environmentPreference: string[];
}

// Personality definitions with detailed characteristics
export const PERSONALITY_PROFILES: Record<PersonalityTrait, PersonalityProfile> = {
  shy: {
    primary: 'shy',
    intensity: 80,
    adaptability: 30,
    socialPreference: 'solitary',
    activityLevel: 'low',
    fearResponse: 'hide',
    trustBuilding: 'slow',
    preferredInteractions: ['observe', 'give_space', 'speak_softly'],
    dislikedInteractions: ['approach_direct', 'loud_sounds', 'sudden_movements'],
    specialRequirements: ['requires_patience', 'needs_safe_space', 'slow_approach_only']
  },

  curious: {
    primary: 'curious',
    intensity: 70,
    adaptability: 80,
    socialPreference: 'small_groups',
    activityLevel: 'moderate',
    fearResponse: 'freeze',
    trustBuilding: 'moderate',
    preferredInteractions: ['observe', 'gentle_touch', 'show_objects'],
    dislikedInteractions: ['ignore', 'repetitive_actions'],
    specialRequirements: ['needs_variety', 'responds_to_novelty']
  },

  playful: {
    primary: 'playful',
    intensity: 85,
    adaptability: 70,
    socialPreference: 'small_groups',
    activityLevel: 'high',
    fearResponse: 'flee',
    trustBuilding: 'fast',
    preferredInteractions: ['play_gesture', 'offer_toys', 'energetic_movement'],
    dislikedInteractions: ['boring_repetition', 'forced_stillness'],
    specialRequirements: ['needs_stimulation', 'energy_dependent']
  },

  aggressive: {
    primary: 'aggressive',
    intensity: 90,
    adaptability: 20,
    socialPreference: 'solitary',
    activityLevel: 'high',
    fearResponse: 'aggressive',
    trustBuilding: 'slow',
    preferredInteractions: ['give_space', 'respect_boundaries', 'food_offerings'],
    dislikedInteractions: ['direct_approach', 'touching', 'cornering'],
    specialRequirements: ['requires_respect', 'territorial', 'needs_dominance_acknowledgment']
  },

  friendly: {
    primary: 'friendly',
    intensity: 75,
    adaptability: 90,
    socialPreference: 'large_groups',
    activityLevel: 'moderate',
    fearResponse: 'flee',
    trustBuilding: 'fast',
    preferredInteractions: ['gentle_touch', 'speak_softly', 'offer_food', 'play_gesture'],
    dislikedInteractions: ['aggressive_approach', 'being_ignored'],
    specialRequirements: ['social_interaction', 'responds_to_kindness']
  },

  lazy: {
    primary: 'lazy',
    intensity: 60,
    adaptability: 40,
    socialPreference: 'solitary',
    activityLevel: 'low',
    fearResponse: 'freeze',
    trustBuilding: 'slow',
    preferredInteractions: ['gentle_touch', 'food_offerings', 'comfortable_presence'],
    dislikedInteractions: ['energetic_play', 'forced_movement', 'loud_interactions'],
    specialRequirements: ['minimal_energy', 'comfort_focused']
  },

  energetic: {
    primary: 'energetic',
    intensity: 95,
    adaptability: 60,
    socialPreference: 'large_groups',
    activityLevel: 'high',
    fearResponse: 'flee',
    trustBuilding: 'moderate',
    preferredInteractions: ['play_gesture', 'chase_games', 'active_movement'],
    dislikedInteractions: ['forced_stillness', 'slow_interactions'],
    specialRequirements: ['high_stimulation', 'movement_based']
  },

  cautious: {
    primary: 'cautious',
    intensity: 85,
    adaptability: 50,
    socialPreference: 'small_groups',
    activityLevel: 'low',
    fearResponse: 'freeze',
    trustBuilding: 'slow',
    preferredInteractions: ['observe', 'predictable_routine', 'safe_distance'],
    dislikedInteractions: ['surprises', 'sudden_changes', 'unpredictable_behavior'],
    specialRequirements: ['predictability', 'gradual_changes', 'safety_first']
  },

  bold: {
    primary: 'bold',
    intensity: 80,
    adaptability: 70,
    socialPreference: 'large_groups',
    activityLevel: 'high',
    fearResponse: 'aggressive',
    trustBuilding: 'fast',
    preferredInteractions: ['direct_approach', 'confident_gestures', 'challenging_play'],
    dislikedInteractions: ['timid_approach', 'excessive_caution'],
    specialRequirements: ['confidence_matching', 'leadership_respect']
  },

  social: {
    primary: 'social',
    intensity: 90,
    adaptability: 80,
    socialPreference: 'large_groups',
    activityLevel: 'moderate',
    fearResponse: 'flee',
    trustBuilding: 'fast',
    preferredInteractions: ['group_activities', 'social_play', 'communication'],
    dislikedInteractions: ['isolation', 'solitary_activities'],
    specialRequirements: ['group_interaction', 'social_validation']
  },

  solitary: {
    primary: 'solitary',
    intensity: 70,
    adaptability: 30,
    socialPreference: 'solitary',
    activityLevel: 'low',
    fearResponse: 'hide',
    trustBuilding: 'slow',
    preferredInteractions: ['one_on_one', 'quiet_presence', 'respect_space'],
    dislikedInteractions: ['group_activities', 'crowded_situations'],
    specialRequirements: ['private_space', 'individual_attention']
  },

  patient: {
    primary: 'patient',
    intensity: 60,
    adaptability: 70,
    socialPreference: 'small_groups',
    activityLevel: 'low',
    fearResponse: 'freeze',
    trustBuilding: 'slow',
    preferredInteractions: ['slow_approach', 'gentle_persistence', 'calm_presence'],
    dislikedInteractions: ['rushed_interactions', 'impatience'],
    specialRequirements: ['time_investment', 'consistent_approach']
  },

  restless: {
    primary: 'restless',
    intensity: 85,
    adaptability: 40,
    socialPreference: 'small_groups',
    activityLevel: 'high',
    fearResponse: 'flee',
    trustBuilding: 'moderate',
    preferredInteractions: ['varied_activities', 'movement_based', 'quick_changes'],
    dislikedInteractions: ['long_stillness', 'repetitive_routine'],
    specialRequirements: ['variety', 'movement_opportunities']
  }
};

export class AnimalPersonality {
  private personalityCache: Map<string, PersonalityProfile> = new Map();
  private personalityModifiers: Map<string, PersonalityModifiers> = new Map();

  constructor() {
    this.initializeModifiers();
  }

  /**
   * Assign a personality to an animal based on species and random factors
   */
  assignPersonality(animal: Animal): PersonalityProfile {
    // Species-based personality tendencies
    const speciesPersonalities: Record<string, PersonalityTrait[]> = {
      rabbit: ['shy', 'cautious', 'curious', 'social'],
      bird: ['curious', 'energetic', 'social', 'restless'],
      squirrel: ['energetic', 'playful', 'restless', 'bold'],
      fox: ['cautious', 'curious', 'solitary', 'patient'],
      deer: ['shy', 'cautious', 'social', 'patient'],
      butterfly: ['curious', 'restless', 'solitary', 'energetic'],
      frog: ['patient', 'lazy', 'cautious', 'solitary'],
      turtle: ['patient', 'lazy', 'cautious', 'solitary']
    };

    const possiblePersonalities = speciesPersonalities[animal.species] || ['curious', 'friendly'];
    const primaryTrait = possiblePersonalities[Math.floor(Math.random() * possiblePersonalities.length)];
    
    // 30% chance of secondary trait
    let secondaryTrait: PersonalityTrait | undefined;
    if (Math.random() < 0.3) {
      const remaining = possiblePersonalities.filter(p => p !== primaryTrait);
      if (remaining.length > 0) {
        secondaryTrait = remaining[Math.floor(Math.random() * remaining.length)];
      }
    }

    const baseProfile = PERSONALITY_PROFILES[primaryTrait];
    const personalityProfile: PersonalityProfile = {
      ...baseProfile,
      primary: primaryTrait,
      secondary: secondaryTrait,
      intensity: Math.max(50, baseProfile.intensity + (Math.random() - 0.5) * 30),
      adaptability: Math.max(10, baseProfile.adaptability + (Math.random() - 0.5) * 40)
    };

    // Cache the personality
    this.personalityCache.set(animal.id, personalityProfile);
    
    // Apply personality effects to animal stats
    this.applyPersonalityToAnimal(animal, personalityProfile);

    return personalityProfile;
  }

  /**
   * Get an animal's personality profile
   */
  getPersonality(animalId: string): PersonalityProfile | null {
    return this.personalityCache.get(animalId) || null;
  }

  /**
   * Get personality modifiers for interactions
   */
  getPersonalityModifiers(animalId: string): PersonalityModifiers | null {
    return this.personalityModifiers.get(animalId) || null;
  }

  /**
   * Calculate interaction effectiveness based on personality
   */
  calculateInteractionEffectiveness(
    animalId: string,
    interaction: TamingInteraction,
    context: {
      playerApproach: 'slow' | 'normal' | 'fast';
      environmentNoise: 'quiet' | 'normal' | 'loud';
      timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      playerEnergy: number;
    }
  ): {
    effectiveness: number; // 0-2 multiplier
    advice: string[];
    warnings: string[];
  } {
    const personality = this.getPersonality(animalId);
    if (!personality) {
      return { effectiveness: 1, advice: [], warnings: [] };
    }

    let effectiveness = 1;
    const advice: string[] = [];
    const warnings: string[] = [];

    // Check preferred interactions
    if (personality.preferredInteractions.includes(interaction.id)) {
      effectiveness *= 1.5;
      advice.push(`This animal loves ${interaction.name.toLowerCase()}`);
    }

    // Check disliked interactions
    if (personality.dislikedInteractions.includes(interaction.id)) {
      effectiveness *= 0.5;
      warnings.push(`This animal dislikes ${interaction.name.toLowerCase()}`);
    }

    // Apply context modifiers
    if (context.playerApproach === 'slow' && personality.trustBuilding === 'slow') {
      effectiveness *= 1.2;
      advice.push('Your slow approach matches this animal\'s preference');
    }

    if (context.playerApproach === 'fast' && personality.activityLevel === 'high') {
      effectiveness *= 1.1;
    } else if (context.playerApproach === 'fast' && personality.primary === 'shy') {
      effectiveness *= 0.6;
      warnings.push('This shy animal is scared by fast movements');
    }

    // Environment considerations
    if (context.environmentNoise === 'loud' && personality.primary === 'shy') {
      effectiveness *= 0.7;
      warnings.push('Loud environment makes this shy animal uncomfortable');
    }

    // Time of day considerations
    if (context.timeOfDay === 'night' && personality.activityLevel === 'low') {
      effectiveness *= 1.1;
      advice.push('This calm animal is more receptive at night');
    }

    // Player energy considerations
    if (context.playerEnergy < 30 && personality.activityLevel === 'high') {
      effectiveness *= 0.8;
      warnings.push('This energetic animal needs more enthusiasm');
    }

    return {
      effectiveness: Math.max(0.1, Math.min(2.0, effectiveness)),
      advice,
      warnings
    };
  }

  /**
   * Get personality-based advice for approaching an animal
   */
  getPersonalityAdvice(animalId: string): {
    approachTips: string[];
    interactionSuggestions: string[];
    avoidanceWarnings: string[];
    longTermStrategy: string[];
  } {
    const personality = this.getPersonality(animalId);
    if (!personality) {
      return { approachTips: [], interactionSuggestions: [], avoidanceWarnings: [], longTermStrategy: [] };
    }

    const approachTips: string[] = [];
    const interactionSuggestions: string[] = [];
    const avoidanceWarnings: string[] = [];
    const longTermStrategy: string[] = [];

    // Generate advice based on primary personality
    switch (personality.primary) {
      case 'shy':
        approachTips.push('Move very slowly and avoid direct eye contact');
        approachTips.push('Let the animal approach you rather than pursuing');
        interactionSuggestions.push('Start with quiet observation from a distance');
        avoidanceWarnings.push('Never corner or trap this animal');
        longTermStrategy.push('Building trust will take many patient sessions');
        break;

      case 'curious':
        approachTips.push('Bring interesting objects to capture attention');
        approachTips.push('Use varied approaches to maintain interest');
        interactionSuggestions.push('Show different items and let them investigate');
        avoidanceWarnings.push('Don\'t repeat the same interaction too much');
        longTermStrategy.push('Keep interactions fresh and engaging');
        break;

      case 'playful':
        approachTips.push('Use energetic, playful movements');
        approachTips.push('Bring toys or play objects');
        interactionSuggestions.push('Engage in active play and games');
        avoidanceWarnings.push('Don\'t force stillness or quiet activities');
        longTermStrategy.push('Regular play sessions will build strong bonds');
        break;

      case 'aggressive':
        approachTips.push('Maintain respectful distance initially');
        approachTips.push('Never show fear or backing down');
        interactionSuggestions.push('Offer food from a safe distance');
        avoidanceWarnings.push('Never corner or threaten this animal');
        longTermStrategy.push('Earn respect through consistent, confident behavior');
        break;

      case 'friendly':
        approachTips.push('Direct, confident approach works well');
        approachTips.push('Warm, welcoming gestures are appreciated');
        interactionSuggestions.push('Gentle touch and kind words');
        avoidanceWarnings.push('Don\'t ignore or seem disinterested');
        longTermStrategy.push('Regular, consistent friendly interactions');
        break;

      case 'lazy':
        approachTips.push('Slow, non-demanding approach');
        approachTips.push('Respect their need for rest');
        interactionSuggestions.push('Gentle petting and food offerings');
        avoidanceWarnings.push('Don\'t demand energetic interactions');
        longTermStrategy.push('Comfort-focused bonding over time');
        break;

      case 'energetic':
        approachTips.push('Match their energy level');
        approachTips.push('Use dynamic, engaging movements');
        interactionSuggestions.push('Active play and movement-based games');
        avoidanceWarnings.push('Don\'t try to force calmness');
        longTermStrategy.push('High-energy bonding activities');
        break;
    }

    // Add secondary personality considerations
    if (personality.secondary) {
      const secondaryProfile = PERSONALITY_PROFILES[personality.secondary];
      approachTips.push(`Also consider: they show ${personality.secondary} tendencies`);
      longTermStrategy.push(`Balance approaches for both ${personality.primary} and ${personality.secondary} traits`);
    }

    return {
      approachTips,
      interactionSuggestions,
      avoidanceWarnings,
      longTermStrategy
    };
  }

  /**
   * Update personality based on interactions (learning and adaptation)
   */
  updatePersonalityFromInteraction(
    animalId: string,
    interactionSuccess: boolean,
    interactionType: string,
    trustLevel: number
  ): void {
    const personality = this.getPersonality(animalId);
    if (!personality || personality.adaptability < 20) return;

    // Animals with high adaptability can learn and adjust
    if (interactionSuccess && personality.adaptability > 60) {
      // Add successful interaction to preferences if not already there
      if (!personality.preferredInteractions.includes(interactionType)) {
        personality.preferredInteractions.push(interactionType);
      }
      
      // Remove from dislikes if it was there
      const dislikeIndex = personality.dislikedInteractions.indexOf(interactionType);
      if (dislikeIndex > -1) {
        personality.dislikedInteractions.splice(dislikeIndex, 1);
      }
    }

    // High trust levels can make animals more adaptable
    if (trustLevel > 70) {
      personality.adaptability = Math.min(100, personality.adaptability + 1);
      personality.intensity = Math.max(30, personality.intensity - 0.5);
    }

    // Update cache
    this.personalityCache.set(animalId, personality);
  }

  private initializeModifiers(): void {
    // Initialize base modifiers for each personality type
    Object.entries(PERSONALITY_PROFILES).forEach(([trait, profile]) => {
      const modifiers: PersonalityModifiers = {
        trustGainMultiplier: this.calculateTrustMultiplier(profile),
        fearDecayRate: this.calculateFearDecayRate(profile),
        energyConsumption: this.calculateEnergyConsumption(profile),
        interactionCooldown: this.calculateInteractionCooldown(profile),
        approachTolerance: this.calculateApproachTolerance(profile),
        foodPreference: this.getFoodPreferences(profile),
        toyPreference: this.getToyPreferences(profile),
        environmentPreference: this.getEnvironmentPreferences(profile)
      };
      
      // Store with trait name as key for reference
      this.personalityModifiers.set(trait, modifiers);
    });
  }

  private applyPersonalityToAnimal(animal: Animal, personality: PersonalityProfile): void {
    // Adjust base stats based on personality
    switch (personality.primary) {
      case 'shy':
        animal.stats.fear = Math.min(100, animal.stats.fear + 20);
        animal.stats.trust = Math.max(0, animal.stats.trust - 10);
        break;
      case 'friendly':
        animal.stats.trust = Math.min(100, animal.stats.trust + 15);
        animal.stats.happiness = Math.min(100, animal.stats.happiness + 10);
        break;
      case 'aggressive':
        animal.stats.fear = Math.max(0, animal.stats.fear - 15);
        animal.stats.trust = Math.max(0, animal.stats.trust - 20);
        break;
      case 'playful':
        animal.stats.energy = Math.min(100, animal.stats.energy + 15);
        animal.stats.happiness = Math.min(100, animal.stats.happiness + 15);
        break;
      case 'lazy':
        animal.stats.energy = Math.max(0, animal.stats.energy - 20);
        break;
      case 'energetic':
        animal.stats.energy = Math.min(100, animal.stats.energy + 20);
        break;
    }

    // Adjust behavior based on personality
    switch (personality.fearResponse) {
      case 'hide':
        animal.behavior.fleeDistance = Math.max(1, animal.behavior.fleeDistance - 1);
        break;
      case 'flee':
        animal.behavior.fleeDistance = animal.behavior.fleeDistance + 1;
        break;
      case 'aggressive':
        animal.behavior.fleeDistance = Math.max(1, animal.behavior.fleeDistance - 2);
        break;
    }

    // Adjust activity based on personality
    switch (personality.activityLevel) {
      case 'low':
        animal.behavior.activityLevel = Math.max(0.1, animal.behavior.activityLevel - 0.3);
        animal.behavior.restDuration = animal.behavior.restDuration * 1.5;
        break;
      case 'high':
        animal.behavior.activityLevel = Math.min(1, animal.behavior.activityLevel + 0.3);
        animal.behavior.restDuration = animal.behavior.restDuration * 0.7;
        break;
    }
  }

  private calculateTrustMultiplier(profile: PersonalityProfile): number {
    switch (profile.trustBuilding) {
      case 'slow': return 0.7;
      case 'fast': return 1.3;
      default: return 1.0;
    }
  }

  private calculateFearDecayRate(profile: PersonalityProfile): number {
    switch (profile.fearResponse) {
      case 'freeze': return 0.8;
      case 'hide': return 0.6;
      case 'flee': return 1.0;
      case 'aggressive': return 1.2;
      default: return 1.0;
    }
  }

  private calculateEnergyConsumption(profile: PersonalityProfile): number {
    switch (profile.activityLevel) {
      case 'low': return 0.7;
      case 'high': return 1.4;
      default: return 1.0;
    }
  }

  private calculateInteractionCooldown(profile: PersonalityProfile): number {
    const baseMultiplier = profile.intensity > 70 ? 0.8 : 1.2;
    return profile.adaptability > 60 ? baseMultiplier * 0.9 : baseMultiplier * 1.1;
  }

  private calculateApproachTolerance(profile: PersonalityProfile): number {
    switch (profile.primary) {
      case 'shy': return 0.5;
      case 'aggressive': return 0.6;
      case 'friendly': return 1.3;
      case 'bold': return 1.4;
      default: return 1.0;
    }
  }

  private getFoodPreferences(profile: PersonalityProfile): string[] {
    const preferences: string[] = [];
    
    switch (profile.primary) {
      case 'playful':
        preferences.push('treats', 'sweet_fruits');
        break;
      case 'lazy':
        preferences.push('easy_food', 'soft_fruits');
        break;
      case 'energetic':
        preferences.push('energy_rich', 'nuts', 'seeds');
        break;
      case 'shy':
        preferences.push('familiar_food', 'gentle_offerings');
        break;
      case 'aggressive':
        preferences.push('meat', 'challenging_food');
        break;
      default:
        preferences.push('varied_diet');
    }
    
    return preferences;
  }

  private getToyPreferences(profile: PersonalityProfile): string[] {
    const preferences: string[] = [];
    
    switch (profile.primary) {
      case 'playful':
        preferences.push('balls', 'interactive_toys', 'puzzle_toys');
        break;
      case 'curious':
        preferences.push('puzzle_toys', 'novel_objects', 'exploration_toys');
        break;
      case 'energetic':
        preferences.push('active_toys', 'chase_toys', 'movement_toys');
        break;
      case 'lazy':
        preferences.push('comfort_items', 'soft_toys');
        break;
      case 'shy':
        preferences.push('safe_toys', 'familiar_objects');
        break;
      default:
        preferences.push('basic_toys');
    }
    
    return preferences;
  }

  private getEnvironmentPreferences(profile: PersonalityProfile): string[] {
    const preferences: string[] = [];
    
    switch (profile.socialPreference) {
      case 'solitary':
        preferences.push('quiet_areas', 'hidden_spots', 'private_spaces');
        break;
      case 'small_groups':
        preferences.push('cozy_areas', 'semi_private', 'comfortable_spaces');
        break;
      case 'large_groups':
        preferences.push('open_areas', 'social_spaces', 'active_environments');
        break;
    }
    
    switch (profile.activityLevel) {
      case 'low':
        preferences.push('calm_environments', 'resting_areas');
        break;
      case 'high':
        preferences.push('stimulating_environments', 'active_areas');
        break;
    }
    
    return preferences;
  }
}

// Export singleton instance
export const animalPersonality = new AnimalPersonality(); 