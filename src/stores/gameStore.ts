import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';
import { Animal } from '../game/Animal';
import { DialogueState } from '../game/DialogueSystem';

// Types for game state
interface Position {
  x: number;
  y: number;
}

interface Player {
  id: string;
  position: Position;
  name: string;
  level: number;
  experience: number;
}

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentMap: string;
  gameTime: number; // in milliseconds
  lastSaved: number;
}

interface PlayerState {
  player: Player;
  inventory: any[];
  companions: any[];
  discoveredAnimals: string[];
  achievements: string[];
  movementTarget: Position | null;
  movementPath: Position[];
  isMoving: boolean;
}

interface AnimalState {
  animals: Animal[];
  spawnedCount: number;
  lastSpawnTime: number;
}

interface UIState {
  activeModal: string | null;
  showDebugInfo: boolean;
  showGrid: boolean;
  activeMenu: string | null;
  notifications: Notification[];
  dialogueState: DialogueState;
}

interface Settings {
  audioEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  hapticFeedback: boolean;
  showTutorials: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  language: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

// Combined store interface
interface GameStore {
  // Game State
  gameState: GameState;
  playerState: PlayerState;
  animalState: AnimalState;
  uiState: UIState;
  settings: Settings;
  
  // Game Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  stopGame: () => void;
  setLoading: (loading: boolean) => void;
  updateGameTime: (deltaTime: number) => void;
  
  // Player Actions
  movePlayer: (position: Position) => void;
  setMovementTarget: (target: Position) => void;
  clearMovementTarget: () => void;
  moveTowardsTarget: () => boolean; // Returns true if movement completed
  updatePlayerExp: (exp: number) => void;
  addToInventory: (item: any) => void;
  removeFromInventory: (itemId: string) => void;
  addCompanion: (animal: any) => void;
  discoverAnimal: (animalId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  
  // Animal Actions
  addAnimal: (animal: Animal) => void;
  removeAnimal: (animalId: string) => void;
  updateAnimal: (animalId: string, updates: Partial<Animal>) => void;
  clearAllAnimals: () => void;
  
  // UI Actions
  openModal: (modalId: string) => void;
  closeModal: () => void;
  openMenu: (menuId: string) => void;
  closeMenu: () => void;
  toggleDebugInfo: () => void;
  toggleGrid: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  
  // Dialogue Actions
  setDialogueState: (state: DialogueState) => void;
  clearDialogue: () => void;
  
  // Settings Actions
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
  
  // Persistence Actions
  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;
}

// Default states
const defaultGameState: GameState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentMap: 'starter_meadow',
  gameTime: 0,
  lastSaved: Date.now()
};

const defaultPlayerState: PlayerState = {
  player: {
    id: 'player_1',
    position: { x: 10, y: 10 },
    name: 'Explorer',
    level: 1,
    experience: 0
  },
  inventory: [],
  companions: [],
  discoveredAnimals: [],
  achievements: [],
  movementTarget: null,
  movementPath: [],
  isMoving: false
};

const defaultUIState: UIState = {
  activeModal: null,
  showDebugInfo: true, // Show in development
  showGrid: true, // Show in development
  activeMenu: null,
  notifications: [],
  dialogueState: {
    isActive: false,
    currentAnimal: null,
    currentTree: null,
    currentOptions: [],
    history: []
  }
};

const defaultAnimalState: AnimalState = {
  animals: [],
  spawnedCount: 0,
  lastSpawnTime: 0
};

const defaultSettings: Settings = {
  audioEnabled: true,
  musicVolume: 70,
  sfxVolume: 80,
  hapticFeedback: true,
  showTutorials: true,
  difficulty: 'normal',
  language: 'en'
};

// Simple pathfinding function (Manhattan distance)
const findPath = (start: Position, end: Position): Position[] => {
  const path: Position[] = [];
  let current = { ...start };
  
  while (current.x !== end.x || current.y !== end.y) {
    // Move towards target one step at a time
    if (current.x < end.x) {
      current.x++;
    } else if (current.x > end.x) {
      current.x--;
    } else if (current.y < end.y) {
      current.y++;
    } else if (current.y > end.y) {
      current.y--;
    }
    
    path.push({ ...current });
  }
  
  return path;
};

// Create the store with persistence
export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial states
        gameState: defaultGameState,
        playerState: defaultPlayerState,
        animalState: defaultAnimalState,
        uiState: defaultUIState,
        settings: defaultSettings,

        // Game Actions
        startGame: () => {
          set((state) => ({
            gameState: {
              ...state.gameState,
              isPlaying: true,
              isPaused: false,
              isLoading: false
            }
          }));
        },

        pauseGame: () => {
          set((state) => ({
            gameState: {
              ...state.gameState,
              isPaused: true
            }
          }));
        },

        resumeGame: () => {
          set((state) => ({
            gameState: {
              ...state.gameState,
              isPaused: false
            }
          }));
        },

        stopGame: () => {
          set((state) => ({
            gameState: {
              ...state.gameState,
              isPlaying: false,
              isPaused: false
            }
          }));
        },

        setLoading: (loading: boolean) => {
          set((state) => ({
            gameState: {
              ...state.gameState,
              isLoading: loading
            }
          }));
        },

        updateGameTime: (deltaTime: number) => {
          set((state) => ({
            gameState: {
              ...state.gameState,
              gameTime: state.gameState.gameTime + deltaTime
            }
          }));
        },

        // Player Actions
        movePlayer: (position: Position) => {
          set((state) => ({
            playerState: {
              ...state.playerState,
              player: {
                ...state.playerState.player,
                position
              },
              isMoving: false,
              movementTarget: null,
              movementPath: []
            }
          }));
        },

        setMovementTarget: (target: Position) => {
          const state = get();
          const currentPos = state.playerState.player.position;
          
          // Don't set target if already at position
          if (currentPos.x === target.x && currentPos.y === target.y) {
            return;
          }
          
          const path = findPath(currentPos, target);
          
          set((state) => ({
            playerState: {
              ...state.playerState,
              movementTarget: target,
              movementPath: path,
              isMoving: true
            }
          }));
        },

        clearMovementTarget: () => {
          set((state) => ({
            playerState: {
              ...state.playerState,
              movementTarget: null,
              movementPath: [],
              isMoving: false
            }
          }));
        },

        moveTowardsTarget: () => {
          const state = get();
          const { movementPath, isMoving } = state.playerState;
          
          if (!isMoving || movementPath.length === 0) {
            return false;
          }
          
          // Get next position in path
          const nextPosition = movementPath[0];
          const remainingPath = movementPath.slice(1);
          
          set((state) => ({
            playerState: {
              ...state.playerState,
              player: {
                ...state.playerState.player,
                position: nextPosition
              },
              movementPath: remainingPath,
              isMoving: remainingPath.length > 0,
              movementTarget: remainingPath.length === 0 ? null : state.playerState.movementTarget
            }
          }));
          
          // Return true if movement is complete
          return remainingPath.length === 0;
        },

        updatePlayerExp: (exp: number) => {
          set((state) => {
            const newExp = state.playerState.player.experience + exp;
            const newLevel = Math.floor(newExp / 100) + 1;
            
            return {
              playerState: {
                ...state.playerState,
                player: {
                  ...state.playerState.player,
                  experience: newExp,
                  level: newLevel
                }
              }
            };
          });
        },

        addToInventory: (item: any) => {
          set((state) => ({
            playerState: {
              ...state.playerState,
              inventory: [...state.playerState.inventory, item]
            }
          }));
        },

        removeFromInventory: (itemId: string) => {
          set((state) => ({
            playerState: {
              ...state.playerState,
              inventory: state.playerState.inventory.filter(item => item.id !== itemId)
            }
          }));
        },

        addCompanion: (animal: any) => {
          set((state) => ({
            playerState: {
              ...state.playerState,
              companions: [...state.playerState.companions, animal]
            }
          }));
        },

        discoverAnimal: (animalId: string) => {
          set((state) => ({
            playerState: {
              ...state.playerState,
              discoveredAnimals: [...new Set([...state.playerState.discoveredAnimals, animalId])]
            }
          }));
        },

        unlockAchievement: (achievementId: string) => {
          set((state) => ({
            playerState: {
              ...state.playerState,
              achievements: [...new Set([...state.playerState.achievements, achievementId])]
            }
          }));
        },

        // Animal Actions
        addAnimal: (animal: Animal) => {
          set((state) => ({
            animalState: {
              ...state.animalState,
              animals: [...state.animalState.animals, animal],
              spawnedCount: state.animalState.spawnedCount + 1
            }
          }));
        },

        removeAnimal: (animalId: string) => {
          set((state) => ({
            animalState: {
              ...state.animalState,
              animals: state.animalState.animals.filter(animal => animal.id !== animalId)
            }
          }));
        },

        updateAnimal: (animalId: string, updates: Partial<Animal>) => {
          set((state) => ({
            animalState: {
              ...state.animalState,
              animals: state.animalState.animals.map(animal => 
                animal.id === animalId ? { ...animal, ...updates } : animal
              )
            }
          }));
        },

        clearAllAnimals: () => {
          set((state) => ({
            animalState: {
              ...state.animalState,
              animals: [],
              spawnedCount: 0
            }
          }));
        },

        // UI Actions
        openModal: (modalId: string) => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              activeModal: modalId
            }
          }));
        },

        closeModal: () => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              activeModal: null
            }
          }));
        },

        openMenu: (menuId: string) => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              activeMenu: menuId
            }
          }));
        },

        closeMenu: () => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              activeMenu: null
            }
          }));
        },

        toggleDebugInfo: () => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              showDebugInfo: !state.uiState.showDebugInfo
            }
          }));
        },

        toggleGrid: () => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              showGrid: !state.uiState.showGrid
            }
          }));
        },

        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notification_${Date.now()}_${Math.random()}`,
            timestamp: Date.now()
          };
          
          set((state) => ({
            uiState: {
              ...state.uiState,
              notifications: [...state.uiState.notifications, newNotification]
            }
          }));

          // Auto-remove notification after duration
          if (notification.duration) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration);
          }
        },

        removeNotification: (notificationId: string) => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              notifications: state.uiState.notifications.filter(n => n.id !== notificationId)
            }
          }));
        },

        // Dialogue Actions
        setDialogueState: (dialogueState: DialogueState) => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              dialogueState
            }
          }));
        },

        clearDialogue: () => {
          set((state) => ({
            uiState: {
              ...state.uiState,
              dialogueState: {
                isActive: false,
                currentAnimal: null,
                currentTree: null,
                currentOptions: [],
                history: []
              }
            }
          }));
        },

        // Settings Actions
        updateSettings: (newSettings: Partial<Settings>) => {
          set((state) => ({
            settings: {
              ...state.settings,
              ...newSettings
            }
          }));
        },

        resetSettings: () => {
          set(() => ({
            settings: defaultSettings
          }));
        },

        // Persistence Actions
        saveGame: () => {
          set((state) => ({
            gameState: {
              ...state.gameState,
              lastSaved: Date.now()
            }
          }));
        },

        loadGame: () => {
          // This will be handled by the persist middleware
          console.log('Game loaded from storage');
        },

        resetGame: () => {
          set(() => ({
            gameState: defaultGameState,
            playerState: defaultPlayerState,
            animalState: defaultAnimalState,
            uiState: { ...defaultUIState, showDebugInfo: true, showGrid: true }
          }));
        }
      }),
      {
        name: STORAGE_KEYS.GAME_SAVE,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          gameState: state.gameState,
          playerState: state.playerState,
          animalState: state.animalState,
          settings: state.settings
        })
      }
    )
  )
);

// Convenient selectors
export const useGameState = () => useGameStore((state) => state.gameState);
export const usePlayerState = () => useGameStore((state) => state.playerState);
export const useAnimalState = () => useGameStore((state) => state.animalState);
export const useUIState = () => useGameStore((state) => state.uiState);
export const useSettings = () => useGameStore((state) => state.settings);