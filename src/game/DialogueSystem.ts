import { Animal } from './Animal';

export interface DialogueOption {
  id: string;
  text: string;
  response?: string;
  nextOptions?: DialogueOption[];
  effect?: {
    trust?: number;
    energy?: number;
    item?: string;
  };
}

export interface DialogueTree {
  id: string;
  animalType: string;
  greeting: string;
  options: DialogueOption[];
}

export interface DialogueState {
  isActive: boolean;
  currentAnimal: Animal | null;
  currentTree: DialogueTree | null;
  currentOptions: DialogueOption[];
  history: string[];
}

export class DialogueSystem {
  private dialogueTrees: Map<string, DialogueTree[]> = new Map();
  private state: DialogueState = {
    isActive: false,
    currentAnimal: null,
    currentTree: null,
    currentOptions: [],
    history: []
  };

  constructor() {
    this.initializeDialogueTrees();
  }

  private initializeDialogueTrees(): void {
    const catDialogues: DialogueTree[] = [
      {
        id: 'cat_first_meeting',
        animalType: 'cat',
        greeting: "The cat looks at you curiously, whiskers twitching.",
        options: [
          {
            id: 'offer_food',
            text: "Offer some food",
            response: "The cat sniffs cautiously and takes a small bite. It seems to trust you a little more.",
            effect: { trust: 5, energy: -1 },
            nextOptions: [
              {
                id: 'pet_gently',
                text: "Pet gently",
                response: "The cat purrs softly and rubs against your hand.",
                effect: { trust: 3 }
              },
              {
                id: 'talk_softly',
                text: "Talk softly",
                response: "You speak in gentle tones. The cat meows back quietly.",
                effect: { trust: 2 }
              }
            ]
          },
          {
            id: 'approach_slowly',
            text: "Approach slowly",
            response: "The cat watches you carefully but doesn't run away.",
            effect: { trust: 2 },
            nextOptions: [
              {
                id: 'extend_hand',
                text: "Extend your hand",
                response: "The cat sniffs your hand and seems more comfortable.",
                effect: { trust: 3 }
              }
            ]
          },
          {
            id: 'make_sound',
            text: "Make clicking sounds",
            response: "The cat tilts its head, intrigued by the sounds you're making.",
            effect: { trust: 1 }
          }
        ]
      }
    ];

    const dogDialogues: DialogueTree[] = [
      {
        id: 'dog_first_meeting',
        animalType: 'dog',
        greeting: "A friendly dog bounds over, tail wagging enthusiastically!",
        options: [
          {
            id: 'play_fetch',
            text: "Play fetch",
            response: "The dog barks excitedly and brings back a stick, eyes bright with joy!",
            effect: { trust: 8, energy: -2 },
            nextOptions: [
              {
                id: 'continue_playing',
                text: "Keep playing",
                response: "The dog is having the time of its life! You're becoming fast friends.",
                effect: { trust: 5, energy: -1 }
              },
              {
                id: 'give_treats',
                text: "Give treats",
                response: "The dog sits obediently and devours the treats with gusto.",
                effect: { trust: 4 }
              }
            ]
          },
          {
            id: 'pet_enthusiastically',
            text: "Pet enthusiastically",
            response: "The dog leans into your touch, tail wagging even faster!",
            effect: { trust: 6 }
          },
          {
            id: 'speak_excitedly',
            text: "Speak in excited tones",
            response: "The dog barks back happily, matching your energy!",
            effect: { trust: 4 }
          }
        ]
      }
    ];

    const rabbitDialogues: DialogueTree[] = [
      {
        id: 'rabbit_first_meeting',
        animalType: 'rabbit',
        greeting: "A small rabbit freezes, ready to bolt at any sudden movement.",
        options: [
          {
            id: 'move_very_slowly',
            text: "Move very slowly",
            response: "The rabbit stays put, watching you with large, alert eyes.",
            effect: { trust: 3 },
            nextOptions: [
              {
                id: 'offer_carrot',
                text: "Offer a carrot",
                response: "The rabbit cautiously hops closer and nibbles the carrot.",
                effect: { trust: 5, energy: -1 }
              },
              {
                id: 'sit_quietly',
                text: "Sit quietly nearby",
                response: "The rabbit gradually relaxes, sensing you're not a threat.",
                effect: { trust: 4 }
              }
            ]
          },
          {
            id: 'whisper_softly',
            text: "Whisper softly",
            response: "The rabbit's ears twitch, listening to your gentle voice.",
            effect: { trust: 2 }
          },
          {
            id: 'stay_still',
            text: "Stay perfectly still",
            response: "The rabbit seems less nervous with your calm presence.",
            effect: { trust: 1 }
          }
        ]
      }
    ];

    this.dialogueTrees.set('cat', catDialogues);
    this.dialogueTrees.set('dog', dogDialogues);
    this.dialogueTrees.set('rabbit', rabbitDialogues);
  }

  startDialogue(animal: Animal): boolean {
    const trees = this.dialogueTrees.get(animal.type);
    if (!trees || trees.length === 0) return false;

    const appropriateTree = this.selectDialogueTree(animal, trees);
    if (!appropriateTree) return false;

    this.state = {
      isActive: true,
      currentAnimal: animal,
      currentTree: appropriateTree,
      currentOptions: appropriateTree.options,
      history: [appropriateTree.greeting]
    };

    return true;
  }

  private selectDialogueTree(animal: Animal, trees: DialogueTree[]): DialogueTree | null {
    if (animal.stats.trustLevel < 10) {
      return trees.find(tree => tree.id.includes('first_meeting')) || trees[0];
    }
    
    return trees[Math.floor(Math.random() * trees.length)];
  }

  selectOption(optionId: string): DialogueOption | null {
    const option = this.state.currentOptions.find(opt => opt.id === optionId);
    if (!option || !this.state.currentAnimal) return null;

    if (option.response) {
      this.state.history.push(`You: ${option.text}`);
      this.state.history.push(option.response);
    }

    if (option.effect) {
      this.applyEffects(this.state.currentAnimal, option.effect);
    }

    if (option.nextOptions && option.nextOptions.length > 0) {
      this.state.currentOptions = option.nextOptions;
    } else {
      this.endDialogue();
    }

    return option;
  }

  private applyEffects(animal: Animal, effects: DialogueOption['effect']): void {
    if (effects?.trust) {
      animal.modifyTrust(effects.trust);
    }
    if (effects?.energy) {
      animal.modifyEnergy(effects.energy);
    }
  }

  endDialogue(): void {
    this.state = {
      isActive: false,
      currentAnimal: null,
      currentTree: null,
      currentOptions: [],
      history: []
    };
  }

  getState(): DialogueState {
    return { ...this.state };
  }

  getCurrentGreeting(): string {
    return this.state.currentTree?.greeting || '';
  }

  getCurrentOptions(): DialogueOption[] {
    return [...this.state.currentOptions];
  }

  getHistory(): string[] {
    return [...this.state.history];
  }

  isDialogueActive(): boolean {
    return this.state.isActive;
  }
}

export const dialogueSystem = new DialogueSystem();