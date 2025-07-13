export type TrickDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';
export type TrickCategory = 'basic' | 'movement' | 'performance' | 'utility' | 'social' | 'advanced';
export type GestureType = 'tap' | 'swipe' | 'hold' | 'double_tap' | 'circle' | 'sequence';

export interface TrickGesture {
  type: GestureType;
  direction?: 'up' | 'down' | 'left' | 'right' | 'clockwise' | 'counter_clockwise';
  duration?: number; // milliseconds for hold gestures
  sequence?: TrickGesture[]; // for complex sequences
  tolerance: number; // 0-1, how precise the gesture needs to be
  description: string;
}

export interface TrickRequirement {
  type: 'bond_level' | 'trust_level' | 'prerequisite_trick' | 'species_type' | 'personality' | 'energy_level';
  value: string | number;
  description: string;
}

export interface TrickReward {
  type: 'bond_points' | 'trust_points' | 'experience' | 'unlock' | 'ability';
  value: number | string;
  description: string;
}

export interface TrickDefinition {
  id: string;
  name: string;
  description: string;
  category: TrickCategory;
  difficulty: TrickDifficulty;
  icon: string;
  
  // Learning requirements
  requirements: TrickRequirement[];
  learningTime: number; // base time in milliseconds to learn
  practiceAttempts: number; // attempts needed to master
  
  // Gestures and interaction
  gestures: TrickGesture[];
  teachingPhases: TeachingPhase[];
  
  // Compatibility
  speciesCompatibility: {
    [species: string]: {
      difficulty: TrickDifficulty;
      successRate: number; // 0-1
      specialNotes?: string;
    };
  };
  
  // Performance
  performanceValue: number; // 1-100, how impressive this trick is
  energyCost: number; // energy cost to perform
  cooldown: number; // milliseconds between performances
  
  // Rewards and progression
  masteryRewards: TrickReward[];
  unlocks: string[]; // trick IDs that this unlocks
  
  // Flavor and presentation
  flavorText: string;
  performanceDescription: string;
  masteryDescription: string;
  tags: string[];
}

export interface TeachingPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // expected time for this phase
  requiredSuccess: number; // 0-1, success rate needed to advance
  gestures: TrickGesture[];
  feedback: {
    success: string[];
    failure: string[];
    encouragement: string[];
  };
}

// Basic tricks that most animals can learn
export const BASIC_TRICKS: TrickDefinition[] = [
  {
    id: 'sit',
    name: 'Sit',
    description: 'The animal sits down on command',
    category: 'basic',
    difficulty: 'easy',
    icon: '🪑',
    requirements: [
      {
        type: 'trust_level',
        value: 30,
        description: 'Animal must trust you enough to follow simple commands'
      },
      {
        type: 'bond_level',
        value: 'acquaintance',
        description: 'Must have basic bond with animal'
      }
    ],
    learningTime: 120000, // 2 minutes
    practiceAttempts: 5,
    gestures: [
      {
        type: 'tap',
        tolerance: 0.8,
        description: 'Tap downward to indicate sitting motion'
      }
    ],
    teachingPhases: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Show the animal what sitting means',
        duration: 30000,
        requiredSuccess: 0.3,
        gestures: [
          {
            type: 'tap',
            direction: 'down',
            tolerance: 0.9,
            description: 'Gentle downward tap'
          }
        ],
        feedback: {
          success: ['Good! The animal is starting to understand.', 'Nice work! Keep it up.'],
          failure: ['Try a gentler approach.', 'The animal seems confused. Try again.'],
          encouragement: ['You\'re doing great!', 'Patience is key with this trick.']
        }
      },
      {
        id: 'practice',
        name: 'Practice',
        description: 'Repeat the command until the animal responds consistently',
        duration: 60000,
        requiredSuccess: 0.7,
        gestures: [
          {
            type: 'tap',
            direction: 'down',
            tolerance: 0.8,
            description: 'Confident downward tap'
          }
        ],
        feedback: {
          success: ['Excellent! The animal is learning fast.', 'Perfect! They\'re getting it.'],
          failure: ['Keep trying, you\'re almost there.', 'The animal needs more practice.'],
          encouragement: ['Almost there!', 'Great progress!']
        }
      },
      {
        id: 'mastery',
        name: 'Mastery',
        description: 'Perfect the timing and consistency',
        duration: 30000,
        requiredSuccess: 0.9,
        gestures: [
          {
            type: 'tap',
            direction: 'down',
            tolerance: 0.7,
            description: 'Quick, confident tap'
          }
        ],
        feedback: {
          success: ['Mastered! The animal sits perfectly on command.', 'Incredible! Perfect execution.'],
          failure: ['So close! Just a bit more practice.', 'Nearly perfect, keep going.'],
          encouragement: ['You\'re almost a master!', 'Final push!']
        }
      }
    ],
    speciesCompatibility: {
      rabbit: { difficulty: 'easy', successRate: 0.9 },
      bird: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Birds prefer perching to sitting' },
      squirrel: { difficulty: 'easy', successRate: 0.8 },
      fox: { difficulty: 'easy', successRate: 0.9 },
      deer: { difficulty: 'medium', successRate: 0.7 },
      butterfly: { difficulty: 'hard', successRate: 0.3, specialNotes: 'Very difficult for flying insects' },
      frog: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Natural sitting position' },
      turtle: { difficulty: 'easy', successRate: 0.8 }
    },
    performanceValue: 15,
    energyCost: 2,
    cooldown: 3000,
    masteryRewards: [
      {
        type: 'bond_points',
        value: 10,
        description: 'Strengthens bond through successful training'
      },
      {
        type: 'unlock',
        value: 'stay',
        description: 'Unlocks the Stay trick'
      }
    ],
    unlocks: ['stay', 'shake'],
    flavorText: 'The foundation of all training - teaching your companion to sit on command.',
    performanceDescription: 'Your companion sits attentively, looking up at you with trust and respect.',
    masteryDescription: 'Your companion sits instantly and perfectly on command, demonstrating complete understanding.',
    tags: ['basic', 'obedience', 'foundation']
  },

  {
    id: 'stay',
    name: 'Stay',
    description: 'The animal stays in place until released',
    category: 'basic',
    difficulty: 'easy',
    icon: '✋',
    requirements: [
      {
        type: 'prerequisite_trick',
        value: 'sit',
        description: 'Must know how to sit first'
      },
      {
        type: 'trust_level',
        value: 40,
        description: 'Requires more trust to stay put'
      }
    ],
    learningTime: 180000, // 3 minutes
    practiceAttempts: 8,
    gestures: [
      {
        type: 'hold',
        duration: 2000,
        tolerance: 0.7,
        description: 'Hold to indicate staying in place'
      }
    ],
    teachingPhases: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Teach the concept of staying in place',
        duration: 60000,
        requiredSuccess: 0.4,
        gestures: [
          {
            type: 'hold',
            duration: 1000,
            tolerance: 0.8,
            description: 'Short hold to start'
          }
        ],
        feedback: {
          success: ['Good! The animal is learning to wait.', 'Excellent patience!'],
          failure: ['Try holding your gesture longer.', 'The animal wants to move, be patient.'],
          encouragement: ['Stay calm and patient.', 'You\'re building trust.']
        }
      },
      {
        id: 'practice',
        name: 'Practice',
        description: 'Extend the stay duration',
        duration: 90000,
        requiredSuccess: 0.6,
        gestures: [
          {
            type: 'hold',
            duration: 2000,
            tolerance: 0.7,
            description: 'Longer hold for extended stay'
          }
        ],
        feedback: {
          success: ['Perfect! They\'re staying longer.', 'Great improvement!'],
          failure: ['The animal is restless, try shorter stays.', 'Build up the duration gradually.'],
          encouragement: ['Patience is paying off!', 'You\'re both learning together.']
        }
      },
      {
        id: 'mastery',
        name: 'Mastery',
        description: 'Perfect the stay command',
        duration: 30000,
        requiredSuccess: 0.8,
        gestures: [
          {
            type: 'hold',
            duration: 3000,
            tolerance: 0.6,
            description: 'Long, confident hold'
          }
        ],
        feedback: {
          success: ['Mastered! Perfect stay command.', 'Incredible self-control!'],
          failure: ['Almost perfect, just a bit more practice.', 'So close to mastery!'],
          encouragement: ['You\'re almost there!', 'Final stretch!']
        }
      }
    ],
    speciesCompatibility: {
      rabbit: { difficulty: 'easy', successRate: 0.8 },
      bird: { difficulty: 'hard', successRate: 0.4, specialNotes: 'Birds naturally want to fly away' },
      squirrel: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Squirrels are naturally restless' },
      fox: { difficulty: 'easy', successRate: 0.9 },
      deer: { difficulty: 'medium', successRate: 0.7 },
      butterfly: { difficulty: 'expert', successRate: 0.2, specialNotes: 'Nearly impossible for butterflies' },
      frog: { difficulty: 'easy', successRate: 0.8 },
      turtle: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Turtles are naturally patient' }
    },
    performanceValue: 25,
    energyCost: 3,
    cooldown: 5000,
    masteryRewards: [
      {
        type: 'bond_points',
        value: 15,
        description: 'Demonstrates deep trust and obedience'
      },
      {
        type: 'unlock',
        value: 'come',
        description: 'Unlocks the Come trick'
      }
    ],
    unlocks: ['come', 'wait'],
    flavorText: 'A test of patience and trust - can your companion resist the urge to move?',
    performanceDescription: 'Your companion remains perfectly still, eyes focused on you, awaiting your next command.',
    masteryDescription: 'Your companion stays motionless for extended periods, showing incredible discipline and trust.',
    tags: ['basic', 'obedience', 'patience', 'trust']
  },

  {
    id: 'shake',
    name: 'Shake',
    description: 'The animal offers their paw/wing/appendage for a handshake',
    category: 'social',
    difficulty: 'easy',
    icon: '🤝',
    requirements: [
      {
        type: 'trust_level',
        value: 35,
        description: 'Requires trust for physical contact'
      },
      {
        type: 'bond_level',
        value: 'friend',
        description: 'Must be comfortable with touch'
      }
    ],
    learningTime: 90000, // 1.5 minutes
    practiceAttempts: 6,
    gestures: [
      {
        type: 'swipe',
        direction: 'right',
        tolerance: 0.8,
        description: 'Swipe right to indicate handshake motion'
      }
    ],
    teachingPhases: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Introduce the concept of offering a paw',
        duration: 30000,
        requiredSuccess: 0.5,
        gestures: [
          {
            type: 'swipe',
            direction: 'right',
            tolerance: 0.9,
            description: 'Gentle right swipe'
          }
        ],
        feedback: {
          success: ['Great! The animal is offering their paw.', 'Perfect handshake!'],
          failure: ['Try a gentler approach.', 'The animal seems shy about contact.'],
          encouragement: ['Building trust through touch.', 'You\'re making great progress.']
        }
      },
      {
        id: 'practice',
        name: 'Practice',
        description: 'Practice the handshake motion',
        duration: 45000,
        requiredSuccess: 0.7,
        gestures: [
          {
            type: 'swipe',
            direction: 'right',
            tolerance: 0.8,
            description: 'Confident right swipe'
          }
        ],
        feedback: {
          success: ['Excellent handshake!', 'They\'re getting comfortable with contact.'],
          failure: ['The animal needs more trust building.', 'Try being more gentle.'],
          encouragement: ['Trust is growing!', 'Great social bonding.']
        }
      },
      {
        id: 'mastery',
        name: 'Mastery',
        description: 'Perfect the handshake',
        duration: 15000,
        requiredSuccess: 0.9,
        gestures: [
          {
            type: 'swipe',
            direction: 'right',
            tolerance: 0.7,
            description: 'Quick, confident swipe'
          }
        ],
        feedback: {
          success: ['Mastered! Perfect handshake every time.', 'Incredible social connection!'],
          failure: ['Almost perfect!', 'Just a bit more practice.'],
          encouragement: ['You\'re almost there!', 'Perfect social bonding!']
        }
      }
    ],
    speciesCompatibility: {
      rabbit: { difficulty: 'easy', successRate: 0.8 },
      bird: { difficulty: 'medium', successRate: 0.7, specialNotes: 'Uses wing instead of paw' },
      squirrel: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Very dexterous with paws' },
      fox: { difficulty: 'easy', successRate: 0.8 },
      deer: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Uses hoof, less precise' },
      butterfly: { difficulty: 'hard', successRate: 0.4, specialNotes: 'Uses antenna touch' },
      frog: { difficulty: 'medium', successRate: 0.7 },
      turtle: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Limited by shell mobility' }
    },
    performanceValue: 30,
    energyCost: 2,
    cooldown: 2000,
    masteryRewards: [
      {
        type: 'bond_points',
        value: 20,
        description: 'Physical contact strengthens emotional bond'
      },
      {
        type: 'unlock',
        value: 'high_five',
        description: 'Unlocks the High Five trick'
      }
    ],
    unlocks: ['high_five', 'wave'],
    flavorText: 'A friendly greeting that shows trust and social bonding.',
    performanceDescription: 'Your companion extends their paw/wing for a gentle, friendly handshake.',
    masteryDescription: 'Your companion offers a perfect handshake with confidence and warmth.',
    tags: ['social', 'contact', 'greeting', 'trust']
  }
];

// Movement tricks
export const MOVEMENT_TRICKS: TrickDefinition[] = [
  {
    id: 'spin',
    name: 'Spin',
    description: 'The animal spins in a circle',
    category: 'movement',
    difficulty: 'medium',
    icon: '🌀',
    requirements: [
      {
        type: 'trust_level',
        value: 50,
        description: 'Requires trust for movement commands'
      },
      {
        type: 'energy_level',
        value: 60,
        description: 'Animal needs energy to spin'
      }
    ],
    learningTime: 240000, // 4 minutes
    practiceAttempts: 10,
    gestures: [
      {
        type: 'circle',
        direction: 'clockwise',
        tolerance: 0.6,
        description: 'Draw a clockwise circle to indicate spinning'
      }
    ],
    teachingPhases: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Teach the concept of spinning',
        duration: 80000,
        requiredSuccess: 0.3,
        gestures: [
          {
            type: 'circle',
            direction: 'clockwise',
            tolerance: 0.8,
            description: 'Slow, clear circle motion'
          }
        ],
        feedback: {
          success: ['Good! The animal is starting to turn.', 'Nice movement!'],
          failure: ['Try a clearer circular motion.', 'The animal seems confused about direction.'],
          encouragement: ['Movement tricks take practice.', 'You\'re building coordination.']
        }
      },
      {
        id: 'practice',
        name: 'Practice',
        description: 'Practice full spinning motion',
        duration: 120000,
        requiredSuccess: 0.6,
        gestures: [
          {
            type: 'circle',
            direction: 'clockwise',
            tolerance: 0.7,
            description: 'Confident circular motion'
          }
        ],
        feedback: {
          success: ['Excellent spin!', 'They\'re getting the hang of it.'],
          failure: ['The animal needs more practice with direction.', 'Try slower, clearer circles.'],
          encouragement: ['Great coordination building!', 'Movement is improving.']
        }
      },
      {
        id: 'mastery',
        name: 'Mastery',
        description: 'Perfect the spinning technique',
        duration: 40000,
        requiredSuccess: 0.8,
        gestures: [
          {
            type: 'circle',
            direction: 'clockwise',
            tolerance: 0.6,
            description: 'Quick, precise circle'
          }
        ],
        feedback: {
          success: ['Mastered! Perfect spinning technique.', 'Incredible coordination!'],
          failure: ['Almost perfect, just refine the motion.', 'So close to mastery!'],
          encouragement: ['Perfect coordination coming together!', 'You\'re almost there!']
        }
      }
    ],
    speciesCompatibility: {
      rabbit: { difficulty: 'medium', successRate: 0.7 },
      bird: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Natural spinning ability in flight' },
      squirrel: { difficulty: 'easy', successRate: 0.8, specialNotes: 'Very agile spinners' },
      fox: { difficulty: 'medium', successRate: 0.7 },
      deer: { difficulty: 'hard', successRate: 0.5, specialNotes: 'Large size makes spinning difficult' },
      butterfly: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Natural aerial spinning' },
      frog: { difficulty: 'medium', successRate: 0.6 },
      turtle: { difficulty: 'hard', successRate: 0.4, specialNotes: 'Shell makes spinning awkward' }
    },
    performanceValue: 40,
    energyCost: 8,
    cooldown: 8000,
    masteryRewards: [
      {
        type: 'bond_points',
        value: 25,
        description: 'Complex movement shows advanced training'
      },
      {
        type: 'unlock',
        value: 'dance',
        description: 'Unlocks the Dance trick'
      }
    ],
    unlocks: ['dance', 'twirl'],
    flavorText: 'A graceful spinning motion that showcases agility and coordination.',
    performanceDescription: 'Your companion spins in a beautiful, controlled circle.',
    masteryDescription: 'Your companion spins with perfect grace and precision, like a natural dancer.',
    tags: ['movement', 'coordination', 'agility', 'performance']
  },

  {
    id: 'jump',
    name: 'Jump',
    description: 'The animal jumps up on command',
    category: 'movement',
    difficulty: 'easy',
    icon: '⬆️',
    requirements: [
      {
        type: 'trust_level',
        value: 45,
        description: 'Requires trust for energetic movements'
      },
      {
        type: 'energy_level',
        value: 40,
        description: 'Animal needs energy to jump'
      }
    ],
    learningTime: 150000, // 2.5 minutes
    practiceAttempts: 7,
    gestures: [
      {
        type: 'swipe',
        direction: 'up',
        tolerance: 0.8,
        description: 'Swipe up to indicate jumping motion'
      }
    ],
    teachingPhases: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Teach the concept of jumping',
        duration: 50000,
        requiredSuccess: 0.4,
        gestures: [
          {
            type: 'swipe',
            direction: 'up',
            tolerance: 0.9,
            description: 'Gentle upward swipe'
          }
        ],
        feedback: {
          success: ['Great! The animal is jumping.', 'Nice height!'],
          failure: ['Try a more energetic upward motion.', 'The animal needs encouragement to jump.'],
          encouragement: ['Building energy and excitement.', 'You\'re motivating them well.']
        }
      },
      {
        id: 'practice',
        name: 'Practice',
        description: 'Practice jumping height and timing',
        duration: 75000,
        requiredSuccess: 0.7,
        gestures: [
          {
            type: 'swipe',
            direction: 'up',
            tolerance: 0.8,
            description: 'Confident upward swipe'
          }
        ],
        feedback: {
          success: ['Excellent jump!', 'Perfect timing and height.'],
          failure: ['The animal needs more energy.', 'Try building up excitement first.'],
          encouragement: ['Great athletic ability!', 'You\'re both getting stronger.']
        }
      },
      {
        id: 'mastery',
        name: 'Mastery',
        description: 'Perfect the jumping technique',
        duration: 25000,
        requiredSuccess: 0.9,
        gestures: [
          {
            type: 'swipe',
            direction: 'up',
            tolerance: 0.7,
            description: 'Quick, energetic upward swipe'
          }
        ],
        feedback: {
          success: ['Mastered! Perfect jumping form.', 'Incredible athletic ability!'],
          failure: ['Almost perfect form!', 'Just a bit more power needed.'],
          encouragement: ['You\'re both athletes now!', 'Perfect form coming together!']
        }
      }
    ],
    speciesCompatibility: {
      rabbit: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Natural jumping ability' },
      bird: { difficulty: 'easy', successRate: 0.8, specialNotes: 'Uses flight instead of jumping' },
      squirrel: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Excellent natural jumpers' },
      fox: { difficulty: 'easy', successRate: 0.8 },
      deer: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Powerful natural jumpers' },
      butterfly: { difficulty: 'medium', successRate: 0.6, specialNotes: 'More of a flutter than jump' },
      frog: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Exceptional jumping ability' },
      turtle: { difficulty: 'hard', successRate: 0.3, specialNotes: 'Shell makes jumping very difficult' }
    },
    performanceValue: 35,
    energyCost: 6,
    cooldown: 4000,
    masteryRewards: [
      {
        type: 'bond_points',
        value: 20,
        description: 'Energetic movement shows enthusiasm'
      },
      {
        type: 'unlock',
        value: 'leap',
        description: 'Unlocks the Leap trick'
      }
    ],
    unlocks: ['leap', 'bounce'],
    flavorText: 'An energetic display of athletic ability and enthusiasm.',
    performanceDescription: 'Your companion jumps with enthusiasm and perfect form.',
    masteryDescription: 'Your companion leaps with incredible height and grace, like a natural athlete.',
    tags: ['movement', 'athletic', 'energy', 'enthusiasm']
  }
];

// Advanced performance tricks
export const PERFORMANCE_TRICKS: TrickDefinition[] = [
  {
    id: 'dance',
    name: 'Dance',
    description: 'The animal performs a rhythmic dance sequence',
    category: 'performance',
    difficulty: 'hard',
    icon: '💃',
    requirements: [
      {
        type: 'prerequisite_trick',
        value: 'spin',
        description: 'Must know how to spin first'
      },
      {
        type: 'trust_level',
        value: 70,
        description: 'Requires high trust for complex performance'
      },
      {
        type: 'bond_level',
        value: 'close_friend',
        description: 'Must have close bond for artistic expression'
      }
    ],
    learningTime: 600000, // 10 minutes
    practiceAttempts: 20,
    gestures: [
      {
        type: 'sequence',
        tolerance: 0.5,
        description: 'Complex sequence of movements',
        sequence: [
          {
            type: 'circle',
            direction: 'clockwise',
            tolerance: 0.6,
            description: 'Spin component'
          },
          {
            type: 'swipe',
            direction: 'left',
            tolerance: 0.7,
            description: 'Step left'
          },
          {
            type: 'swipe',
            direction: 'right',
            tolerance: 0.7,
            description: 'Step right'
          },
          {
            type: 'swipe',
            direction: 'up',
            tolerance: 0.8,
            description: 'Jump component'
          }
        ]
      }
    ],
    teachingPhases: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Introduce basic dance movements',
        duration: 200000,
        requiredSuccess: 0.2,
        gestures: [
          {
            type: 'sequence',
            tolerance: 0.8,
            description: 'Simple movement sequence',
            sequence: [
              {
                type: 'swipe',
                direction: 'left',
                tolerance: 0.8,
                description: 'Step left'
              },
              {
                type: 'swipe',
                direction: 'right',
                tolerance: 0.8,
                description: 'Step right'
              }
            ]
          }
        ],
        feedback: {
          success: ['Beautiful movement!', 'They\'re feeling the rhythm.'],
          failure: ['Complex movements take time.', 'Break it down into smaller steps.'],
          encouragement: ['You\'re creating art together.', 'Artistic expression is developing.']
        }
      },
      {
        id: 'practice',
        name: 'Practice',
        description: 'Build the full dance sequence',
        duration: 300000,
        requiredSuccess: 0.4,
        gestures: [
          {
            type: 'sequence',
            tolerance: 0.6,
            description: 'Extended movement sequence',
            sequence: [
              {
                type: 'circle',
                direction: 'clockwise',
                tolerance: 0.7,
                description: 'Spin component'
              },
              {
                type: 'swipe',
                direction: 'left',
                tolerance: 0.7,
                description: 'Step left'
              },
              {
                type: 'swipe',
                direction: 'right',
                tolerance: 0.7,
                description: 'Step right'
              }
            ]
          }
        ],
        feedback: {
          success: ['Incredible dance sequence!', 'Perfect artistic expression.'],
          failure: ['The sequence is challenging, keep practicing.', 'Break it into smaller parts.'],
          encouragement: ['You\'re both becoming dancers!', 'Artistic mastery is developing.']
        }
      },
      {
        id: 'mastery',
        name: 'Mastery',
        description: 'Perfect the complete dance',
        duration: 100000,
        requiredSuccess: 0.7,
        gestures: [
          {
            type: 'sequence',
            tolerance: 0.5,
            description: 'Full dance sequence',
            sequence: [
              {
                type: 'circle',
                direction: 'clockwise',
                tolerance: 0.6,
                description: 'Spin component'
              },
              {
                type: 'swipe',
                direction: 'left',
                tolerance: 0.7,
                description: 'Step left'
              },
              {
                type: 'swipe',
                direction: 'right',
                tolerance: 0.7,
                description: 'Step right'
              },
              {
                type: 'swipe',
                direction: 'up',
                tolerance: 0.8,
                description: 'Jump finale'
              }
            ]
          }
        ],
        feedback: {
          success: ['Mastered! Incredible dance performance.', 'Perfect artistic expression!'],
          failure: ['Almost perfect, just polish the sequence.', 'So close to dance mastery!'],
          encouragement: ['You\'re both artists now!', 'Perfect harmony in movement!']
        }
      }
    ],
    speciesCompatibility: {
      rabbit: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Graceful hopping dance' },
      bird: { difficulty: 'easy', successRate: 0.8, specialNotes: 'Natural aerial dance ability' },
      squirrel: { difficulty: 'medium', successRate: 0.7, specialNotes: 'Acrobatic dance style' },
      fox: { difficulty: 'hard', successRate: 0.5, specialNotes: 'Elegant but challenging' },
      deer: { difficulty: 'hard', successRate: 0.4, specialNotes: 'Size makes complex moves difficult' },
      butterfly: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Natural dancing ability' },
      frog: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Rhythmic hopping dance' },
      turtle: { difficulty: 'expert', successRate: 0.2, specialNotes: 'Extremely challenging due to shell' }
    },
    performanceValue: 85,
    energyCost: 15,
    cooldown: 20000,
    masteryRewards: [
      {
        type: 'bond_points',
        value: 50,
        description: 'Artistic expression creates deep emotional connection'
      },
      {
        type: 'unlock',
        value: 'choreography',
        description: 'Unlocks advanced choreography tricks'
      }
    ],
    unlocks: ['choreography', 'performance_art'],
    flavorText: 'The ultimate expression of harmony between you and your companion.',
    performanceDescription: 'Your companion performs a beautiful, rhythmic dance that captivates all who watch.',
    masteryDescription: 'Your companion dances with such grace and artistry that it moves observers to tears.',
    tags: ['performance', 'artistic', 'advanced', 'harmony', 'emotional']
  }
];

// Utility tricks that provide practical benefits
export const UTILITY_TRICKS: TrickDefinition[] = [
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'The animal retrieves and brings back items',
    category: 'utility',
    difficulty: 'medium',
    icon: '🎾',
    requirements: [
      {
        type: 'trust_level',
        value: 60,
        description: 'Requires trust to bring items back'
      },
      {
        type: 'bond_level',
        value: 'friend',
        description: 'Must want to help you'
      }
    ],
    learningTime: 300000, // 5 minutes
    practiceAttempts: 12,
    gestures: [
      {
        type: 'double_tap',
        tolerance: 0.7,
        description: 'Double tap to indicate fetch command'
      }
    ],
    teachingPhases: [
      {
        id: 'introduction',
        name: 'Introduction',
        description: 'Teach the concept of retrieving items',
        duration: 120000,
        requiredSuccess: 0.3,
        gestures: [
          {
            type: 'double_tap',
            tolerance: 0.8,
            description: 'Clear double tap'
          }
        ],
        feedback: {
          success: ['Good! They\'re showing interest in the item.', 'Great retrieval instinct!'],
          failure: ['Try showing them the item first.', 'The animal needs to understand what to fetch.'],
          encouragement: ['Building helpful behavior.', 'You\'re teaching cooperation.']
        }
      },
      {
        id: 'practice',
        name: 'Practice',
        description: 'Practice bringing items back',
        duration: 150000,
        requiredSuccess: 0.6,
        gestures: [
          {
            type: 'double_tap',
            tolerance: 0.7,
            description: 'Confident double tap'
          }
        ],
        feedback: {
          success: ['Excellent fetch!', 'Perfect retrieval and return.'],
          failure: ['The animal is learning to bring it back.', 'Encourage them to return to you.'],
          encouragement: ['Great teamwork developing!', 'You\'re building cooperation.']
        }
      },
      {
        id: 'mastery',
        name: 'Mastery',
        description: 'Perfect the fetch technique',
        duration: 30000,
        requiredSuccess: 0.8,
        gestures: [
          {
            type: 'double_tap',
            tolerance: 0.6,
            description: 'Quick, precise double tap'
          }
        ],
        feedback: {
          success: ['Mastered! Perfect fetch every time.', 'Incredible helpful companion!'],
          failure: ['Almost perfect retrieval skills.', 'Just a bit more consistency needed.'],
          encouragement: ['You\'re the perfect team!', 'Cooperation mastered!']
        }
      }
    ],
    speciesCompatibility: {
      rabbit: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Can carry small items' },
      bird: { difficulty: 'easy', successRate: 0.8, specialNotes: 'Natural carrying ability' },
      squirrel: { difficulty: 'easy', successRate: 0.9, specialNotes: 'Excellent at carrying nuts and small items' },
      fox: { difficulty: 'easy', successRate: 0.8, specialNotes: 'Natural hunting retrieval instincts' },
      deer: { difficulty: 'hard', successRate: 0.3, specialNotes: 'Difficult to carry items with mouth' },
      butterfly: { difficulty: 'expert', successRate: 0.1, specialNotes: 'Cannot carry items effectively' },
      frog: { difficulty: 'medium', successRate: 0.5, specialNotes: 'Can carry small items in mouth' },
      turtle: { difficulty: 'medium', successRate: 0.6, specialNotes: 'Slow but reliable retrieval' }
    },
    performanceValue: 55,
    energyCost: 10,
    cooldown: 15000,
    masteryRewards: [
      {
        type: 'bond_points',
        value: 30,
        description: 'Helpful behavior strengthens partnership'
      },
      {
        type: 'ability',
        value: 'item_retrieval',
        description: 'Can help find and retrieve lost items'
      }
    ],
    unlocks: ['search', 'carry'],
    flavorText: 'A practical skill that makes your companion a helpful partner in daily activities.',
    performanceDescription: 'Your companion reliably fetches and returns items with enthusiasm.',
    masteryDescription: 'Your companion is an expert retriever, bringing back exactly what you need.',
    tags: ['utility', 'helpful', 'cooperation', 'practical']
  }
];

// Combine all tricks into a master database
export const ALL_TRICKS: TrickDefinition[] = [
  ...BASIC_TRICKS,
  ...MOVEMENT_TRICKS,
  ...PERFORMANCE_TRICKS,
  ...UTILITY_TRICKS
];

// Helper functions for working with tricks
export const getTrickById = (id: string): TrickDefinition | undefined => {
  return ALL_TRICKS.find(trick => trick.id === id);
};

export const getTricksByCategory = (category: TrickCategory): TrickDefinition[] => {
  return ALL_TRICKS.filter(trick => trick.category === category);
};

export const getTricksByDifficulty = (difficulty: TrickDifficulty): TrickDefinition[] => {
  return ALL_TRICKS.filter(trick => trick.difficulty === difficulty);
};

export const getAvailableTricksForSpecies = (species: string): TrickDefinition[] => {
  return ALL_TRICKS.filter(trick => 
    trick.speciesCompatibility[species] && 
    trick.speciesCompatibility[species].successRate > 0.3
  );
};

export const getPrerequisiteTricks = (trickId: string): TrickDefinition[] => {
  const trick = getTrickById(trickId);
  if (!trick) return [];
  
  const prerequisites: TrickDefinition[] = [];
  trick.requirements.forEach(req => {
    if (req.type === 'prerequisite_trick') {
      const prereq = getTrickById(req.value as string);
      if (prereq) prerequisites.push(prereq);
    }
  });
  
  return prerequisites;
};

export const getUnlockedTricks = (trickId: string): TrickDefinition[] => {
  const trick = getTrickById(trickId);
  if (!trick) return [];
  
  return trick.unlocks.map(id => getTrickById(id)).filter(Boolean) as TrickDefinition[];
}; 