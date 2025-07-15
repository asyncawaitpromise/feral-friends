import React from 'react';
import { 
  Heart, 
  Star, 
  Users, 
  Package, 
  Navigation, 
  MousePointer, 
  Eye, 
  MapPin, 
  Zap, 
  CheckCircle,
  Gift,
  Target,
  Award,
  Hexagon,
  Compass,
  BookOpen,
  Settings,
  Shield,
  Zap as Sparkles
} from 'react-feather';
import { TutorialConfig, createTutorialStep } from './Tutorial';

// Comprehensive tutorial steps for all game features
export const COMPREHENSIVE_TUTORIAL_STEPS = {
  // Basic game mechanics
  taming_basics: createTutorialStep({
    id: 'taming_basics',
    title: 'Understanding Taming',
    content: 'Taming is about building trust with animals through patient interactions. Each animal has a trust level from 0-100 that determines what interactions are available.',
    icon: <Heart size={20} />,
    type: 'info',
    tips: [
      'Trust levels unlock new interaction types',
      'Different animals prefer different approaches',
      'Building trust takes time and patience'
    ]
  }),

  trust_levels: createTutorialStep({
    id: 'trust_levels',
    title: 'Trust Levels Explained',
    content: 'Animals progress through trust levels: Fearful (0-15) → Wary (15-30) → Curious (30-50) → Accepting (50-75) → Friendly (75-90) → Bonded (90-100). Each level unlocks new interactions.',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Fearful animals will flee - give them space',
      'Curious animals might approach you first',
      'Bonded animals can become companions'
    ]
  }),

  interaction_types: createTutorialStep({
    id: 'interaction_types',
    title: 'Types of Interactions',
    content: 'Available interactions: Observe (safe, always available), Approach (builds trust), Offer Food (high trust gain), Gentle Touch (requires trust), Play (high trust needed), Speak Softly (calming), Give Space (reduces stress).',
    icon: <MousePointer size={20} />,
    type: 'demonstration',
    targetElement: '.interaction-panel',
    tips: [
      'Observe is safe and always available',
      'Food offering builds trust quickly',
      'Some interactions require items or trust levels'
    ]
  }),

  animal_personalities: createTutorialStep({
    id: 'animal_personalities',
    title: 'Animal Personalities',
    content: 'Each animal has a unique personality: Shy (prefers gentle approaches), Friendly (likes social interactions), Curious (investigates new things), Playful (loves games), Aggressive (needs patience).',
    icon: <Users size={20} />,
    type: 'info',
    tips: [
      'Shy animals prefer gentle, slow approaches',
      'Playful animals love games and toys',
      'Aggressive animals need patience and space'
    ]
  }),

  bonding_system: createTutorialStep({
    id: 'bonding_system',
    title: 'Building Bonds',
    content: 'As trust grows, you develop deeper bonds with animals. Bond levels: Stranger → Acquaintance → Friend → Close Friend → Best Friend. Higher bonds unlock special abilities.',
    icon: <Heart size={20} />,
    type: 'info',
    tips: [
      'Bonds unlock special abilities',
      'Companions follow you around',
      'Strong bonds enable trick teaching'
    ]
  }),

  // Trick system
  trick_system: createTutorialStep({
    id: 'trick_system',
    title: 'Teaching Tricks',
    content: 'Once you\'ve built sufficient trust (50+), you can teach animals tricks! Different animals learn different tricks based on their species and personality.',
    icon: <Zap size={20} />,
    type: 'demonstration',
    targetElement: '.trick-interface',
    tips: [
      'Start with simple tricks like "sit" and "stay"',
      'Practice makes perfect - repetition improves mastery',
      'Some tricks require specific items or environments'
    ]
  }),

  trick_categories: createTutorialStep({
    id: 'trick_categories',
    title: 'Trick Categories',
    content: 'Tricks are organized by difficulty: Basic (sit, stay, come), Intermediate (spin, shake, roll), Advanced (dance, perform, jump), Master (species-specific special abilities).',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Master basic tricks before advancing',
      'Each category requires higher trust levels',
      'Master tricks are unique to each species'
    ]
  }),

  trick_teaching_process: createTutorialStep({
    id: 'trick_teaching_process',
    title: 'The Teaching Process',
    content: 'Teaching involves: 1) Demonstration (show the trick), 2) Guidance (help the animal), 3) Practice (repeat), 4) Reward (positive reinforcement), 5) Mastery (perfect execution).',
    icon: <BookOpen size={20} />,
    type: 'info',
    tips: [
      'Be patient - learning takes time',
      'Use consistent gestures and commands',
      'Reward success immediately'
    ]
  }),

  // Exploration system
  exploration_mechanics: createTutorialStep({
    id: 'exploration_mechanics',
    title: 'Exploring the World',
    content: 'The world has different biomes: Meadows (open grasslands), Forests (wooded areas), Streams (water environments), Caves (underground areas), Hills (elevated terrain). Each biome hosts different animals.',
    icon: <MapPin size={20} />,
    type: 'info',
    tips: [
      'Forest animals prefer shaded areas',
      'Stream animals need water nearby',
      'Cave animals are often nocturnal'
    ]
  }),

  biome_specialization: createTutorialStep({
    id: 'biome_specialization',
    title: 'Biome Specialization',
    content: 'Each biome has unique features: Meadows have flowers and open spaces, Forests have trees and hidden paths, Streams have rocks and water plants, Caves have crystals and echoes, Hills have viewpoints and wind.',
    icon: <Compass size={20} />,
    type: 'info',
    tips: [
      'Explore thoroughly to find hidden areas',
      'Some animals only appear in specific weather',
      'Time of day affects animal activity'
    ]
  }),

  // Item and inventory system
  item_gathering: createTutorialStep({
    id: 'item_gathering',
    title: 'Gathering Items',
    content: 'Find items throughout the world: Food (berries, nuts, seeds), Toys (balls, sticks, ribbons), Tools (brushes, nets, containers), Special items (rare magical objects).',
    icon: <Package size={20} />,
    type: 'demonstration',
    targetElement: '.gathering-interface',
    tips: [
      'Different areas have different items',
      'Some items are seasonal or weather-dependent',
      'Rare items have special properties'
    ]
  }),

  item_usage: createTutorialStep({
    id: 'item_usage',
    title: 'Using Items Effectively',
    content: 'Items have different effects: Food increases trust and happiness, Toys enable play interactions, Tools unlock grooming and care, Special items provide unique abilities.',
    icon: <Gift size={20} />,
    type: 'info',
    tips: [
      'Match items to animal preferences',
      'Some items work better with certain species',
      'Save rare items for special occasions'
    ]
  }),

  // Progression system
  progression_system: createTutorialStep({
    id: 'progression_system',
    title: 'Character Progression',
    content: 'Gain experience from: Discovering animals (+25 XP), Successful interactions (+5-15 XP), Taming animals (+50 XP), Teaching tricks (+30 XP), Winning competitions (+150 XP).',
    icon: <Star size={20} />,
    type: 'info',
    tips: [
      'Experience unlocks new abilities',
      'Higher levels unlock new areas',
      'Some animals only appear at higher levels'
    ]
  }),

  achievement_system: createTutorialStep({
    id: 'achievement_system',
    title: 'Achievements & Goals',
    content: 'Complete achievements to earn rewards: Discovery (find animals), Bonding (build relationships), Mastery (perfect skills), Exploration (visit areas), Competition (win contests).',
    icon: <Award size={20} />,
    type: 'demonstration',
    targetElement: '.achievement-panel',
    tips: [
      'Check achievements regularly for goals',
      'Some achievements unlock special content',
      'Rare achievements give prestigious titles'
    ]
  }),

  // Competition system
  competition_basics: createTutorialStep({
    id: 'competition_basics',
    title: 'Competitions & Shows',
    content: 'Enter competitions to showcase your animals: Agility (speed and movement), Trick Shows (performed abilities), Bonding Contests (relationship strength), Beauty Pageants (appearance and grooming).',
    icon: <Award size={20} />,
    type: 'info',
    tips: [
      'Different competitions test different skills',
      'Strong bonds improve performance',
      'Winning competitions unlocks new content'
    ]
  }),

  competition_preparation: createTutorialStep({
    id: 'competition_preparation',
    title: 'Preparing for Competition',
    content: 'Success requires: High trust levels (75+), Mastered tricks, Proper grooming, Understanding judge preferences, Choosing the right animal for each competition type.',
    icon: <Target size={20} />,
    type: 'info',
    tips: [
      'Practice tricks before competing',
      'Grooming improves appearance scores',
      'Some competitions favor certain species'
    ]
  }),

  // Advanced features
  rare_animals: createTutorialStep({
    id: 'rare_animals',
    title: 'Rare & Special Animals',
    content: 'Rare animals have unique colors, patterns, or abilities. They appear under special conditions: certain weather, times of day, seasons, or after completing achievements.',
    icon: <Sparkles size={20} />,
    type: 'info',
    tips: [
      'Rare animals may appear at certain times',
      'Some rare animals have special requirements',
      'Legendary animals are extremely rare and powerful'
    ]
  }),

  companion_management: createTutorialStep({
    id: 'companion_management',
    title: 'Managing Companions',
    content: 'Bonded animals (trust 90+) can become companions. Manage their needs: feeding, grooming, exercise, and emotional care. Happy companions are more effective.',
    icon: <Users size={20} />,
    type: 'demonstration',
    targetElement: '.companion-panel',
    tips: [
      'Companions need regular care',
      'Active companions can help with tasks',
      'You can have multiple companions'
    ]
  }),

  advanced_interactions: createTutorialStep({
    id: 'advanced_interactions',
    title: 'Advanced Interactions',
    content: 'Unlock advanced interactions: Grooming (improves appearance), Training (teaches complex behaviors), Cooperative activities (work together), Healing (restore health and happiness).',
    icon: <Eye size={20} />,
    type: 'info',
    tips: [
      'Advanced interactions require high trust',
      'Some interactions are species-specific',
      'Mastering advanced interactions unlocks new content'
    ]
  }),

  // Endgame content
  endgame_content: createTutorialStep({
    id: 'endgame_content',
    title: 'Mastery & Endgame',
    content: 'Advanced players can pursue: Mastery challenges (difficult skill tests), Legendary animal encounters, Championship competitions, Habitat creation, Community events.',
    icon: <Hexagon size={20} />,
    type: 'info',
    tips: [
      'Mastery challenges test your skills',
      'Legendary animals are the ultimate goal',
      'Endgame content provides long-term goals'
    ]
  }),

  breeding_system: createTutorialStep({
    id: 'breeding_system',
    title: 'Animal Breeding',
    content: 'Advanced feature: Breed compatible animals to create offspring with unique traits. Breeding requires: High bond levels with both parents, Proper habitat setup, Breeding license (earned through achievements).',
    icon: <Heart size={20} />,
    type: 'info',
    tips: [
      'Offspring inherit traits from parents',
      'Some combinations create rare variants',
      'Breeding is a long-term commitment'
    ]
  }),

  habitat_creation: createTutorialStep({
    id: 'habitat_creation',
    title: 'Creating Habitats',
    content: 'Build custom habitats for your companions: Choose location, Add decorations, Install comfort items, Create food sources, Design play areas.',
    icon: <Settings size={20} />,
    type: 'info',
    tips: [
      'Different animals prefer different habitats',
      'Well-designed habitats improve animal happiness',
      'Habitats can be shared with other players'
    ]
  }),

  seasonal_events: createTutorialStep({
    id: 'seasonal_events',
    title: 'Seasonal Events',
    content: 'The world changes with seasons: Spring (new births, flowers), Summer (high activity, competitions), Fall (gathering, migration), Winter (rest, rare sightings).',
    icon: <Sparkles size={20} />,
    type: 'info',
    tips: [
      'Some animals only appear in certain seasons',
      'Seasonal events offer unique rewards',
      'Plan activities around seasonal changes'
    ]
  }),

  community_features: createTutorialStep({
    id: 'community_features',
    title: 'Community & Sharing',
    content: 'Connect with other players: Share achievements, Trade items, Participate in community events, Join competitions, Visit other players\' habitats.',
    icon: <Users size={20} />,
    type: 'info',
    tips: [
      'Community events offer exclusive rewards',
      'Trading helps complete collections',
      'Learning from other players improves skills'
    ]
  })
};

// Comprehensive tutorial configurations covering all game features
export const COMPREHENSIVE_TUTORIALS: Record<string, TutorialConfig> = {
  // Basic tutorials
  welcome: {
    id: 'welcome',
    title: 'Welcome to Feral Friends',
    description: 'Learn the basics of your adventure',
    category: 'basic',
    steps: [
      createTutorialStep({
        id: 'welcome_intro',
        title: 'Welcome to Feral Friends!',
        content: 'Welcome to a world where patience and kindness unlock the hearts of amazing animals. This is a journey of discovery, friendship, and gentle adventure.',
        icon: <Heart size={20} />,
        type: 'info',
        autoAdvance: 5000
      }),
      createTutorialStep({
        id: 'game_philosophy',
        title: 'A Different Kind of Game',
        content: 'There\'s no combat here - only connection. You\'ll succeed through understanding, patience, and genuine care for the animals you meet.',
        icon: <Shield size={20} />,
        type: 'info'
      }),
      COMPREHENSIVE_TUTORIAL_STEPS.exploration_mechanics
    ]
  },

  movement_basics: {
    id: 'movement_basics',
    title: 'Movement & Navigation',
    description: 'Master moving around the world',
    category: 'movement',
    steps: [
      createTutorialStep({
        id: 'basic_movement',
        title: 'How to Move',
        content: 'Tap anywhere on the screen to move there. Your character will automatically find a path and walk to that location, avoiding obstacles.',
        icon: <Navigation size={20} />,
        type: 'demonstration',
        targetElement: '.game-canvas',
        actionRequired: true,
        tips: [
          'Try tapping different areas to see pathfinding',
          'Your character moves at a steady, calm pace',
          'Obstacles are automatically avoided'
        ]
      }),
      createTutorialStep({
        id: 'camera_system',
        title: 'Camera & View',
        content: 'The camera smoothly follows your character. As you explore, you\'ll see more of the world and discover new areas.',
        icon: <Eye size={20} />,
        type: 'demonstration',
        autoAdvance: 4000
      }),
      createTutorialStep({
        id: 'map_transitions',
        title: 'Exploring New Areas',
        content: 'When you reach the edge of an area, you might find paths to new biomes. Each area has unique animals and items to discover.',
        icon: <MapPin size={20} />,
        type: 'info'
      })
    ]
  },

  // Core taming system
  taming_fundamentals: {
    id: 'taming_fundamentals',
    title: 'Animal Taming Fundamentals',
    description: 'Master the art of befriending animals',
    category: 'interaction',
    unlockConditions: { animalsDiscovered: 1 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.taming_basics,
      COMPREHENSIVE_TUTORIAL_STEPS.trust_levels,
      COMPREHENSIVE_TUTORIAL_STEPS.interaction_types,
      COMPREHENSIVE_TUTORIAL_STEPS.animal_personalities,
      COMPREHENSIVE_TUTORIAL_STEPS.bonding_system,
      createTutorialStep({
        id: 'first_taming_attempt',
        title: 'Your First Taming',
        content: 'Now try taming an animal! Start with observation to learn about them, then try gentle approaches. Watch their reactions and adjust your strategy.',
        icon: <Heart size={20} />,
        type: 'action',
        actionRequired: true,
        tips: [
          'Start with the safest interactions',
          'Watch the animal\'s body language and emotes',
          'Don\'t rush - patience is the key to success'
        ]
      })
    ]
  },

  // Trick teaching system
  trick_mastery: {
    id: 'trick_mastery',
    title: 'Teaching Tricks & Training',
    description: 'Learn to teach animals amazing abilities',
    category: 'advanced',
    prerequisites: ['taming_fundamentals'],
    unlockConditions: { playerLevel: 3 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.trick_system,
      COMPREHENSIVE_TUTORIAL_STEPS.trick_categories,
      COMPREHENSIVE_TUTORIAL_STEPS.trick_teaching_process,
      createTutorialStep({
        id: 'trick_requirements',
        title: 'Trick Requirements',
        content: 'Each trick has requirements: Minimum trust level, Specific gestures, Practice time, Some tricks need items or specific environments.',
        icon: <CheckCircle size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'first_trick_teaching',
        title: 'Teach Your First Trick',
        content: 'Try teaching "sit" to a bonded animal (trust 50+). This basic trick builds confidence and establishes the foundation for more complex training.',
        icon: <Zap size={20} />,
        type: 'action',
        actionRequired: true,
        tips: [
          'Use clear, consistent gestures',
          'Reward immediately when successful',
          'Practice regularly to improve mastery'
        ]
      })
    ]
  },

  // Exploration and world discovery
  exploration_mastery: {
    id: 'exploration_mastery',
    title: 'World Exploration & Discovery',
    description: 'Discover all the secrets of the world',
    category: 'basic',
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.exploration_mechanics,
      COMPREHENSIVE_TUTORIAL_STEPS.biome_specialization,
      createTutorialStep({
        id: 'animal_habitats',
        title: 'Animal Habitats',
        content: 'Animals have habitat preferences: Rabbits (meadows), Squirrels (forests), Frogs (streams), Bats (caves), Goats (hills). Understanding habitats helps you find specific animals.',
        icon: <Users size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'hidden_areas',
        title: 'Hidden Areas & Secrets',
        content: 'Some areas are hidden behind obstacles, require specific items to access, or only appear under certain conditions. Thorough exploration reveals these secrets.',
        icon: <Eye size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'exploration_rewards',
        title: 'Exploration Rewards',
        content: 'Exploring thoroughly rewards you with: Rare items, Hidden animals, Special locations, Unique interactions, Achievement progress.',
        icon: <Star size={20} />,
        type: 'info'
      })
    ]
  },

  // Item and inventory management
  inventory_mastery: {
    id: 'inventory_mastery',
    title: 'Items & Inventory Management',
    description: 'Master item collection and usage',
    category: 'inventory',
    steps: [
      createTutorialStep({
        id: 'inventory_basics',
        title: 'Your Inventory',
        content: 'Your inventory stores items you find and collect. Access it anytime to see what you have and manage your items.',
        icon: <Package size={20} />,
        type: 'demonstration',
        targetElement: '.inventory-button'
      }),
      COMPREHENSIVE_TUTORIAL_STEPS.item_gathering,
      COMPREHENSIVE_TUTORIAL_STEPS.item_usage,
      createTutorialStep({
        id: 'item_categories',
        title: 'Item Categories',
        content: 'Items are organized by type: Food (berries, nuts, seeds), Toys (balls, sticks, ribbons), Tools (brushes, nets, containers), Special (rare magical items).',
        icon: <Gift size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'inventory_management',
        title: 'Managing Your Inventory',
        content: 'Your inventory has limited space. Organize items by type, use them strategically, and consider storing extras in safe locations.',
        icon: <Settings size={20} />,
        type: 'demonstration',
        targetElement: '.inventory-interface'
      })
    ]
  },

  // Progression and achievements
  progression_mastery: {
    id: 'progression_mastery',
    title: 'Character Progression & Achievements',
    description: 'Understand leveling, achievements, and unlocks',
    category: 'basic',
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.progression_system,
      createTutorialStep({
        id: 'leveling_benefits',
        title: 'Benefits of Leveling Up',
        content: 'Each level unlocks: New areas to explore, Advanced interactions, Rare animal encounters, Special abilities, Increased inventory space.',
        icon: <Star size={20} />,
        type: 'info'
      }),
      COMPREHENSIVE_TUTORIAL_STEPS.achievement_system,
      createTutorialStep({
        id: 'achievement_categories',
        title: 'Achievement Categories',
        content: 'Achievements are grouped by: Discovery (find animals/areas), Bonding (build relationships), Mastery (perfect skills), Exploration (visit locations), Competition (win contests).',
        icon: <Award size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'progression_tracking',
        title: 'Tracking Your Progress',
        content: 'Monitor your progress through: Experience bar, Achievement panel, Statistics screen, Milestone notifications, Level-up rewards.',
        icon: <CheckCircle size={20} />,
        type: 'demonstration',
        targetElement: '.progression-panel'
      })
    ]
  },

  // Competition system
  competition_mastery: {
    id: 'competition_mastery',
    title: 'Competitions & Shows',
    description: 'Enter competitions and showcase your skills',
    category: 'advanced',
    prerequisites: ['trick_mastery'],
    unlockConditions: { playerLevel: 5 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.competition_basics,
      createTutorialStep({
        id: 'competition_types',
        title: 'Competition Types',
        content: 'Available competitions: Agility (speed/movement), Trick Shows (performed abilities), Bonding Contests (relationship strength), Beauty Pageants (appearance/grooming).',
        icon: <Award size={20} />,
        type: 'info'
      }),
      COMPREHENSIVE_TUTORIAL_STEPS.competition_preparation,
      createTutorialStep({
        id: 'judging_criteria',
        title: 'Understanding Judging',
        content: 'Judges evaluate: Skill execution, Animal happiness, Bond strength, Presentation quality, Originality, Difficulty level.',
        icon: <Eye size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'competition_strategy',
        title: 'Competition Strategy',
        content: 'Success tips: Choose the right animal for each competition, Practice beforehand, Understand judge preferences, Maintain calm confidence.',
        icon: <Target size={20} />,
        type: 'info'
      })
    ]
  },

  // Advanced features
  advanced_features: {
    id: 'advanced_features',
    title: 'Advanced Features & Mechanics',
    description: 'Unlock the full potential of the game',
    category: 'advanced',
    prerequisites: ['taming_fundamentals', 'progression_mastery'],
    unlockConditions: { playerLevel: 10 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.rare_animals,
      COMPREHENSIVE_TUTORIAL_STEPS.companion_management,
      COMPREHENSIVE_TUTORIAL_STEPS.advanced_interactions,
      createTutorialStep({
        id: 'animal_care',
        title: 'Advanced Animal Care',
        content: 'Provide comprehensive care: Regular feeding, Grooming sessions, Exercise activities, Health monitoring, Emotional support, Social interaction.',
        icon: <Heart size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'specialized_skills',
        title: 'Specialized Skills',
        content: 'Develop specialized skills: Animal psychology, Habitat design, Breeding expertise, Training mastery, Competition strategy, Conservation knowledge.',
        icon: <Star size={20} />,
        type: 'info'
      })
    ]
  },

  // Endgame mastery
  endgame_mastery: {
    id: 'endgame_mastery',
    title: 'Mastery & Endgame Content',
    description: 'Achieve true mastery of animal friendship',
    category: 'advanced',
    prerequisites: ['advanced_features', 'competition_mastery'],
    unlockConditions: { playerLevel: 20 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.endgame_content,
      createTutorialStep({
        id: 'mastery_challenges',
        title: 'Mastery Challenges',
        content: 'Complete ultimate challenges: Tame legendary animals, Win championship competitions, Achieve perfect bonds, Create masterpiece habitats, Mentor new players.',
        icon: <Hexagon size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'legendary_encounters',
        title: 'Legendary Animal Encounters',
        content: 'Seek legendary animals: Extremely rare, Unique abilities, Special requirements, Incredible rewards, Prestige status, Ultimate challenge.',
        icon: <Sparkles size={20} />,
        type: 'info'
      }),
      COMPREHENSIVE_TUTORIAL_STEPS.breeding_system,
      COMPREHENSIVE_TUTORIAL_STEPS.habitat_creation,
      COMPREHENSIVE_TUTORIAL_STEPS.seasonal_events,
      COMPREHENSIVE_TUTORIAL_STEPS.community_features
    ]
  },

  // Specialized tutorials
  seasonal_mastery: {
    id: 'seasonal_mastery',
    title: 'Seasonal Events & Changes',
    description: 'Master seasonal gameplay mechanics',
    category: 'advanced',
    prerequisites: ['exploration_mastery'],
    unlockConditions: { playerLevel: 8 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.seasonal_events,
      createTutorialStep({
        id: 'seasonal_animals',
        title: 'Seasonal Animals',
        content: 'Some animals only appear during specific seasons: Spring babies, Summer migrants, Fall harvesters, Winter survivors. Plan your activities accordingly.',
        icon: <Sparkles size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'seasonal_activities',
        title: 'Seasonal Activities',
        content: 'Each season offers unique activities: Spring (nesting, births), Summer (competitions, travel), Fall (gathering, preparation), Winter (rest, rare sightings).',
        icon: <Target size={20} />,
        type: 'info'
      })
    ]
  },

  breeding_mastery: {
    id: 'breeding_mastery',
    title: 'Animal Breeding & Genetics',
    description: 'Master the breeding system',
    category: 'advanced',
    prerequisites: ['advanced_features'],
    unlockConditions: { playerLevel: 15 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.breeding_system,
      createTutorialStep({
        id: 'breeding_requirements',
        title: 'Breeding Requirements',
        content: 'Successful breeding requires: Compatible species, High bond levels (80+), Proper habitat, Breeding license, Adequate resources, Time commitment.',
        icon: <CheckCircle size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'genetic_traits',
        title: 'Understanding Genetics',
        content: 'Offspring inherit traits: Physical appearance, Personality tendencies, Ability potential, Health factors, Rare characteristics, Special abilities.',
        icon: <Star size={20} />,
        type: 'info'
      })
    ]
  },

  habitat_mastery: {
    id: 'habitat_mastery',
    title: 'Habitat Creation & Design',
    description: 'Learn to create perfect habitats',
    category: 'advanced',
    prerequisites: ['advanced_features'],
    unlockConditions: { playerLevel: 12 },
    steps: [
      COMPREHENSIVE_TUTORIAL_STEPS.habitat_creation,
      createTutorialStep({
        id: 'habitat_planning',
        title: 'Planning Your Habitat',
        content: 'Consider: Animal needs, Space requirements, Environmental factors, Aesthetic design, Functionality, Expansion possibilities.',
        icon: <Settings size={20} />,
        type: 'info'
      }),
      createTutorialStep({
        id: 'habitat_maintenance',
        title: 'Habitat Maintenance',
        content: 'Regular maintenance includes: Cleaning, Restocking food, Repairing items, Updating decorations, Monitoring animal happiness, Seasonal adjustments.',
        icon: <Target size={20} />,
        type: 'info'
      })
    ]
  }
};

// Export tutorial categories for organization
export const TUTORIAL_CATEGORIES = {
  basic: ['welcome', 'movement_basics', 'exploration_mastery', 'inventory_mastery', 'progression_mastery'],
  interaction: ['taming_fundamentals'],
  advanced: ['trick_mastery', 'competition_mastery', 'advanced_features', 'seasonal_mastery', 'breeding_mastery', 'habitat_mastery', 'endgame_mastery']
};

// Tutorial unlock progression
export const TUTORIAL_PROGRESSION = {
  // Level 1 - Basics
  1: ['welcome', 'movement_basics'],
  
  // Level 2 - Core mechanics
  2: ['taming_fundamentals', 'exploration_mastery'],
  
  // Level 3 - Inventory and items
  3: ['inventory_mastery', 'trick_mastery'],
  
  // Level 5 - Progression and achievements
  5: ['progression_mastery', 'competition_mastery'],
  
  // Level 8 - Seasonal content
  8: ['seasonal_mastery'],
  
  // Level 10 - Advanced features
  10: ['advanced_features'],
  
  // Level 12 - Habitat creation
  12: ['habitat_mastery'],
  
  // Level 15 - Breeding
  15: ['breeding_mastery'],
  
  // Level 20 - Endgame
  20: ['endgame_mastery']
}; 