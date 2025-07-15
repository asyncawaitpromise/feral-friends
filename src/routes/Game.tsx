import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Settings, Pause, Play, Package, User, Users, BookOpen, Menu, Award, Target, Heart, Save, Activity } from 'react-feather';
import { Button, LoadingSpinner } from '../components/ui';
import { Container } from '../components/layout';
import { GameCanvas, TouchControls, GameUI } from '../components/game';
import { SettingsMenu, MainMenu, OfflineStatus, SaveSlots, DataManager } from '../components/ui';
import { Inventory, PlayerStatus, CompanionList, Tutorial, Onboarding, TutorialMenu, TamingInterface, TrickTeaching, ItemUsage, EnhancedEncounterInterface } from '../components/game';
import { COMPREHENSIVE_TUTORIALS } from '../components/game/ComprehensiveTutorials';
import { useGameStore, useGameState, usePlayerState, useAnimalState, useUIState } from '../stores';
import { MapManager, createMapManager, GameMap } from '../game';
import { MAP_REGISTRY, DEFAULT_MAP_ID } from '../data/maps';
import { Position } from '../types/game';
import { Animal, createAnimal } from '../game/Animal';
// AnimalSpawner removed - using grass encounters only
import { AnimalAI, createAIContext } from '../game/AnimalAI';
import { ProximityDetector, createProximityDetector } from '../game/ProximityDetection';
import { GrassEncounterSystem } from '../game/GrassEncounterSystem';
import { EncounterAnimal } from '../game/EncounterAnimal';
import HabitatSystem from '../game/HabitatSystem';

const Game: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [currentMap, setCurrentMap] = useState<GameMap | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');
  const [hasShownWelcome, setHasShownWelcome] = useState(() => {
    const stored = localStorage.getItem('feral-friends-welcome-shown');
    console.log('Initial hasShownWelcome state from localStorage:', stored);
    return stored === 'true';
  });

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPlayerStatus, setShowPlayerStatus] = useState(false);
  const [showCompanionList, setShowCompanionList] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTutorialMenu, setShowTutorialMenu] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [showTamingInterface, setShowTamingInterface] = useState(false);
  const [showTrickTeaching, setShowTrickTeaching] = useState(false);
  const [showItemUsage, setShowItemUsage] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showEncounterInterface, setShowEncounterInterface] = useState(false);
  const [encounterAnimal, setEncounterAnimal] = useState<EncounterAnimal | null>(null);
  const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  
  // Map system refs
  const mapManagerRef = useRef<MapManager | null>(null);
  
  // Animal system refs
  // animalSpawnerRef removed - using grass encounters only
  const proximityDetectorRef = useRef<ProximityDetector | null>(null);
  const grassEncounterRef = useRef<GrassEncounterSystem | null>(null);
  const habitatSystemRef = useRef<typeof HabitatSystem | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  // Zustand store hooks
  const gameState = useGameState();
  const playerState = usePlayerState();
  const animalState = useAnimalState();
  const uiState = useUIState();
  const { 
    startGame, 
    pauseGame, 
    resumeGame, 
    setLoading,
    movePlayer,
    setMovementTarget,
    moveTowardsTarget,
    addNotification,
    toggleDebugInfo,
    addAnimal,
    removeAnimal,
    updateAnimal,
    clearAllAnimals,
    openModal,
    closeModal
  } = useGameStore();

  // Safe pathfinding that respects map collision
  const findSafePath = useCallback((start: Position, end: Position, map: GameMap): Position[] => {
    const path: Position[] = [];
    let current = { ...start };
    
    while (current.x !== end.x || current.y !== end.y) {
      let nextStep = { ...current };
      
      // Try to move towards target, but check if the step is valid
      if (current.x < end.x) {
        nextStep.x++;
      } else if (current.x > end.x) {
        nextStep.x--;
      } else if (current.y < end.y) {
        nextStep.y++;
      } else if (current.y > end.y) {
        nextStep.y--;
      }
      
      // Check if the next step is valid and walkable
      if (map.isValidPosition(nextStep.x, nextStep.y) && map.isWalkable(nextStep.x, nextStep.y)) {
        current = nextStep;
        path.push({ ...current });
      } else {
        // If we can't move directly, try alternative routes
        // For now, just stop pathfinding if we hit an obstacle
        console.log('Pathfinding blocked at:', nextStep, 'stopping path creation');
        break;
      }
      
      // Safety check to prevent infinite loops
      if (path.length > 100) {
        console.log('Pathfinding exceeded max steps, stopping');
        break;
      }
    }
    
    return path;
  }, []);

  // Set movement target with custom path
  const setMovementTargetWithPath = useCallback((target: Position, path: Position[]) => {
    // Use the store's state setter directly but with our custom path
    const { playerState } = useGameStore.getState();
    
    // Don't set target if already at position
    if (playerState.player.position.x === target.x && playerState.player.position.y === target.y) {
      return;
    }
    
    useGameStore.setState((state) => ({
      playerState: {
        ...state.playerState,
        movementTarget: target,
        movementPath: path,
        isMoving: path.length > 0
      }
    }));
  }, []);

  // Create stable notification function without debug logging
  const stableAddNotification = useCallback((notification: any) => {
    addNotification(notification);
  }, [addNotification]);

  // Load completed tutorials on mount
  useEffect(() => {
    const loadCompletedTutorials = () => {
      const completed: string[] = [];
      Object.keys(COMPREHENSIVE_TUTORIALS).forEach(tutorialId => {
        if (localStorage.getItem(`tutorial-${tutorialId}-completed`) === 'true') {
          completed.push(tutorialId);
        }
      });
      setCompletedTutorials(completed);
    };

    loadCompletedTutorials();
  }, []);

  // Initialize game with map system (only run once)
  useEffect(() => {
    console.log('=== GAME INIT EFFECT ===');
    console.log('Game component mounted/re-mounted. gameInitialized:', gameInitialized);
    console.log('hasShownWelcome current state:', hasShownWelcome);
    console.log('localStorage feral-friends-welcome-shown:', localStorage.getItem('feral-friends-welcome-shown'));
    
    if (gameInitialized) {
      console.log('Game already initialized, skipping init');
      return; // Prevent re-initialization
    }
    
    const initGame = async () => {
      try {
        setLoading(true);
        setLoadingStage('Initializing map system...');
        setLoadingProgress(10);
        
        // Create map manager
        const mapManager = createMapManager({
          cacheSize: 5,
          preloadRadius: 1,
          transitionDuration: 1000,
        });
        
        // Register map data sources
        setLoadingStage('Loading map data...');
        setLoadingProgress(30);
        
        Object.entries(MAP_REGISTRY).forEach(([mapId, mapData]) => {
          mapManager.registerMapSource(mapId, async () => mapData);
        });
        
        // Set callbacks
        mapManager.setCallbacks({
          onMapLoaded: (mapId, map) => {
            console.log(`Map loaded: ${mapId}`);
            if (mapId === DEFAULT_MAP_ID) {
              setCurrentMap(map);
            }
          },
          onLoadingProgress: (state) => {
            setLoadingProgress(50 + (state.progress * 0.4)); // 50-90%
            setLoadingStage(state.stage === 'complete' ? 'Finalizing...' : `Loading ${state.stage}...`);
          },
        });
        
        mapManagerRef.current = mapManager;
        
        // Load initial map
        setLoadingStage('Loading starter map...');
        setLoadingProgress(60);
        
        const initialMap = await mapManager.loadMap(DEFAULT_MAP_ID);
        await mapManager.setCurrentMap(DEFAULT_MAP_ID);
        
        setCurrentMap(initialMap);
        setLoadingProgress(90);
        
        // Initialize encounter systems
        setLoadingStage('Setting up encounters...');
        
        // Create proximity detector
        const proximityDetector = createProximityDetector();

        // Create habitat system (it's an object, not a class)
        const habitatSystem = HabitatSystem;

        // Create grass encounter system
        const grassEncounter = new GrassEncounterSystem(initialMap, habitatSystem, {
          encounterChance: 0.2, // 20% chance per grass step
          minStepsInGrass: 2,
          cooldownTime: 45000, // 45 seconds between encounters
          maxEncountersPerArea: 1
        });
        
        // Set up proximity detector callbacks
        proximityDetector.setCallbacks({
          onProximityEvent: (event) => {
            // Only show awareness notifications for new animal species or special interactions
            if (event.type === 'enter' && event.zone.name === 'awareness') {
              if (!playerState.discoveredAnimals.includes(event.animal.species) || (event.animal.behavior.rarity || 0) > 0.8) {
                stableAddNotification({
                  type: 'info',
                  title: `${event.animal.species.charAt(0).toUpperCase() + event.animal.species.slice(1)} notices you`,
                  message: `The ${event.animal.species} is aware of your presence`,
                  duration: 2000
                });
              }
            }
          },
          onInteractionOpportunity: (opportunity) => {
            // Only log in development mode
            if (process.env.NODE_ENV === 'development') {
              console.log('Interaction opportunity:', opportunity.interactionType, opportunity.animal.species);
            }
          },
          onAnimalReaction: (animal, reaction) => {
            // Only log significant reactions in development mode
            if (process.env.NODE_ENV === 'development' && (reaction.includes('flee') || reaction.includes('approach'))) {
              console.log('Animal reaction:', animal.species, reaction);
            }
          }
        });
        proximityDetectorRef.current = proximityDetector;
        grassEncounterRef.current = grassEncounter;
        habitatSystemRef.current = habitatSystem;
        
        setLoadingProgress(95);
        
        // Final setup
        setLoadingStage('Starting game...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsLoading(false);
        setGameInitialized(true);
        setLoadingProgress(100);
        startGame();
        
        // Welcome notification (only show once)
        console.log('=== WELCOME NOTIFICATION CHECK ===');
        console.log('hasShownWelcome before check:', hasShownWelcome);
        console.log('localStorage before check:', localStorage.getItem('feral-friends-welcome-shown'));
        
        if (!hasShownWelcome) {
          console.log('🎉 Showing welcome notification for the first time');
          stableAddNotification({
            type: 'success',
            title: 'Welcome to Feral Friends!',
            message: `You've arrived at the ${initialMap.getMetadata().displayName}`,
            duration: 4000
          });
          console.log('Setting hasShownWelcome to true and updating localStorage');
          setHasShownWelcome(true);
          localStorage.setItem('feral-friends-welcome-shown', 'true');
          console.log('localStorage after setting:', localStorage.getItem('feral-friends-welcome-shown'));
        } else {
          console.log('❌ Welcome notification already shown, skipping');
        }
        
      } catch (error) {
        console.error('Failed to initialize game:', error);
        stableAddNotification({
          type: 'error',
          title: 'Loading Failed',
          message: 'Failed to load the game. Please refresh and try again.',
          duration: 5000
        });
      }
    };

    initGame();
  }, []); // Empty dependency array - only run once on mount

  // Turn-based animal AI updates (triggered by player movement)
  useEffect(() => {
    if (!gameInitialized || !proximityDetectorRef.current) {
      return;
    }

    const currentTime = Date.now();
    const proximityDetector = proximityDetectorRef.current;

    try {
      // Update animal AI - this is now turn-based
      const activeAnimals = animalState.animals.filter(animal => animal.isActive);
      const aiContext = createAIContext(playerState.player.position, currentTime, 500); // Fixed delta for turn-based
      
      for (const animal of activeAnimals) {
        const result = AnimalAI.updateAI(animal, aiContext);
        
        // Update animal in store if it changed
        if (result.stateChanged || result.memoryUpdated) {
          updateAnimal(animal.id, animal);
        }
      }

      // Update proximity detection
      proximityDetector.update(activeAnimals, playerState.player.position);

    } catch (error) {
      console.error('Turn-based AI update error:', error);
    }
  }, [gameInitialized, playerState.player.position, animalState.animals, updateAnimal]); // Triggers on player position change

  // Grass encounter callback
  const handlePlayerMovement = useCallback((newPosition: Position, previousPosition: Position) => {
    if (!grassEncounterRef.current || showEncounterInterface) {
      return; // Don't trigger if already in encounter
    }

    const encounterAnimal = grassEncounterRef.current.checkForEncounter(newPosition, previousPosition);
    if (encounterAnimal) {
      setEncounterAnimal(encounterAnimal);
      setShowEncounterInterface(true);
      
      // Add notification
      addNotification({
        type: 'info',
        title: 'Wild Encounter!',
        message: `A wild ${encounterAnimal.species} appears from the grass!`,
        duration: 3000
      });
    }
  }, [showEncounterInterface, addNotification]);

  // Enhanced encounter action handlers
  const handleAnimalTamed = useCallback((animal: Animal) => {
    addAnimal(animal);
    addNotification({
      type: 'success',
      title: 'Animal Tamed!',
      message: `You successfully tamed the ${animal.species}!`,
      duration: 3000
    });
    setShowEncounterInterface(false);
    setEncounterAnimal(null);
  }, [addAnimal, addNotification]);

  const handleAnimalFled = useCallback(() => {
    addNotification({
      type: 'warning',
      title: 'Animal Fled',
      message: `The animal got too scared and ran away.`,
      duration: 2500
    });
    setShowEncounterInterface(false);
    setEncounterAnimal(null);
  }, [addNotification]);

  const handleEnergyUsed = useCallback((amount: number) => {
    // TODO: Update player energy in store when energy system is implemented
    console.log(`Used ${amount} energy`);
  }, []);

  const handleItemUsed = useCallback((itemId: string) => {
    // TODO: Remove item from inventory when inventory system is implemented
    console.log(`Used item: ${itemId}`);
  }, []);

  const handleEncounterFlee = useCallback(() => {
    addNotification({
      type: 'info',
      title: 'You fled',
      message: `You quietly backed away from the encounter.`,
      duration: 2000
    });
    setShowEncounterInterface(false);
    setEncounterAnimal(null);
  }, [addNotification]);

  // Watch for player position changes to trigger grass encounters
  const previousPlayerPosition = useRef<Position>(playerState.player.position);
  useEffect(() => {
    const currentPosition = playerState.player.position;
    const previousPosition = previousPlayerPosition.current;
    
    // Only trigger if position actually changed
    if (currentPosition.x !== previousPosition.x || currentPosition.y !== previousPosition.y) {
      handlePlayerMovement(currentPosition, previousPosition);
      previousPlayerPosition.current = { ...currentPosition };
    }
  }, [playerState.player.position, handlePlayerMovement]);

  // Movement loop for tap-to-move functionality
  useEffect(() => {
    console.log('=== MOVEMENT EFFECT ===');
    console.log('playerState.isMoving:', playerState.isMoving);
    console.log('gameState.isPaused:', gameState.isPaused);
    
    if (!playerState.isMoving || gameState.isPaused) {
      console.log('Movement effect returning early');
      return;
    }

    console.log('Setting up movement interval');
    const moveInterval = setInterval(() => {
      console.log('Movement interval tick');
      const isComplete = moveTowardsTarget();
      if (isComplete) {
        console.log('Movement completed, showing destination reached notification');
        stableAddNotification({
          type: 'success',
          title: 'Destination reached!',
          message: 'Arrived at target location.',
          duration: 1500
        });
      }
    }, 500); // Move every 500ms for visible movement

    return () => {
      console.log('Cleaning up movement interval');
      clearInterval(moveInterval);
    };
  }, [playerState.isMoving, gameState.isPaused, moveTowardsTarget]);

  const togglePause = () => {
    if (gameState.isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right' | null) => {
    if (!direction || gameState.isPaused || !currentMap) return;
    
    // Start from current target position (if moving) or current position (if stationary)
    const startPos = playerState.movementTarget && playerState.isMoving 
      ? playerState.movementTarget 
      : playerState.player.position;
    
    let newPosition = { ...startPos };
    
    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, startPos.y - 1);
        break;
      case 'down':
        newPosition.y = startPos.y + 1;
        break;
      case 'left':
        newPosition.x = Math.max(0, startPos.x - 1);
        break;
      case 'right':
        newPosition.x = startPos.x + 1;
        break;
    }
    
    // Don't move to same position
    if (newPosition.x === startPos.x && newPosition.y === startPos.y) {
      return;
    }
    
    // Validate the new position
    if (!currentMap.isValidPosition(newPosition.x, newPosition.y)) {
      stableAddNotification({
        type: 'warning',
        title: 'Invalid location',
        message: 'Cannot move outside map boundaries',
        duration: 2000
      });
      return;
    }
    
    if (!currentMap.isWalkable(newPosition.x, newPosition.y)) {
      const tile = currentMap.getTile(newPosition.x, newPosition.y);
      stableAddNotification({
        type: 'warning',
        title: 'Blocked path',
        message: `Cannot walk on ${tile?.terrainType || 'this terrain'}`,
        duration: 2000
      });
      return;
    }
    
    // Create a safe path from current player position to the new target
    const safePath = findSafePath(playerState.player.position, newPosition, currentMap);
    
    // Check if we could create a path to the target
    if (safePath.length === 0) {
      // No path found - target is unreachable
      stableAddNotification({
        type: 'warning',
        title: 'Path blocked',
        message: 'Cannot reach that location',
        duration: 2000
      });
      return;
    }
    
    // Set new movement target with updated path
    setMovementTargetWithPath(newPosition, safePath);
    
    // Provide visual feedback for directional movement
    stableAddNotification({
      type: 'info',
      title: `Moving ${direction}`,
      message: `Target: (${newPosition.x}, ${newPosition.y})`,
      duration: 1000
    });
  };

  const handleCellTap = (gridX: number, gridY: number) => {
    console.log('=== CELL TAP ===');
    console.log('Tapped cell:', gridX, gridY);
    console.log('gameState.isPaused:', gameState.isPaused);
    console.log('currentMap exists:', !!currentMap);
    
    if (gameState.isPaused || !currentMap) {
      console.log('Tap ignored - game paused or no map');
      return;
    }
    
    // Check if target position is valid on the current map
    if (!currentMap.isValidPosition(gridX, gridY)) {
      console.log('Invalid position, showing warning notification');
      stableAddNotification({
        type: 'warning',
        title: 'Invalid location',
        message: 'Cannot move outside map boundaries',
        duration: 2000
      });
      return;
    }
    
    // Check if target position is walkable
    if (!currentMap.isWalkable(gridX, gridY)) {
      const tile = currentMap.getTile(gridX, gridY);
      stableAddNotification({
        type: 'warning',
        title: 'Blocked path',
        message: `Cannot walk on ${tile?.terrainType || 'this terrain'}`,
        duration: 2000
      });
      return;
    }
    
    // Prevent setting same target or rapid successive calls
    if (playerState.movementTarget && 
        playerState.movementTarget.x === gridX && 
        playerState.movementTarget.y === gridY) {
      return;
    }
    
    // Check for map transitions
    const transitions = currentMap.getTransitionsAtPosition(gridX, gridY);
    if (transitions.length > 0) {
      // Handle map transition
      const transition = transitions[0];
      stableAddNotification({
        type: 'info',
        title: 'Transition available',
        message: `Press action button to ${transition.description || 'continue'}`,
        duration: 3000
      });
    }
    
    // Create a safe path that avoids obstacles
    const safePath = findSafePath(playerState.player.position, { x: gridX, y: gridY }, currentMap);
    
    // Check if we could create a path to the target
    if (safePath.length === 0) {
      // No path found - target is unreachable
      stableAddNotification({
        type: 'warning',
        title: 'Unreachable destination',
        message: 'Cannot find a path to that location',
        duration: 2000
      });
      return;
    }
    
    // Set movement target with safe path
    setMovementTargetWithPath({ x: gridX, y: gridY }, safePath);
    
    // Get current tile info for feedback
    const targetTile = currentMap.getTile(gridX, gridY);
    stableAddNotification({
      type: 'info',
      title: 'Moving to destination',
      message: `Walking to ${targetTile?.terrainType || 'unknown'} at (${gridX}, ${gridY})`,
      duration: 2000
    });
  };

  const handleAction = (action: 'A' | 'B') => {
    if (gameState.isPaused) return;
    
    if (action === 'A') {
      // Action button - interact with environment
      stableAddNotification({
        type: 'info',
        title: 'Action!',
        message: 'Looking for something to interact with...',
        duration: 2000
      });
    } else if (action === 'B') {
      // Menu button - toggle debug info for now
      toggleDebugInfo();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
        <Container centerContent>
          <div className="text-center max-w-md">
            <LoadingSpinner size="lg" text={loadingStage} />
            
            {/* Progress bar */}
            <div className="mt-6 w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">{loadingProgress}% complete</p>
            
            <div className="mt-6 space-y-2 text-gray-600">
              <p className="text-lg">🌟 {loadingStage}</p>
              <div className="text-sm space-y-1">
                {loadingProgress >= 30 && <p>✅ Map system initialized</p>}
                {loadingProgress >= 60 && <p>✅ Starter meadow loaded</p>}
                {loadingProgress >= 90 && <p>✅ Game world ready</p>}
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Game Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-50 text-white">
        <div className="flex items-center justify-between p-4">
          {/* Left side - Home button */}
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
              <Home className="w-5 h-5" />
            </Button>
          </Link>

          {/* Center - Game status */}
          <div className="text-center">
            <p className="text-sm font-medium">Feral Friends</p>
            <p className="text-xs text-gray-300">
              {gameState.isPaused ? 'Paused' : 'Playing'}
            </p>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={togglePause}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {gameState.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(true)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowGameMenu(true)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Game Content Area */}
      <main className="h-screen pt-16 relative">
        {/* Game Canvas */}
        <div className="w-full h-full relative">
          <GameCanvas 
            isPaused={gameState.isPaused}
            className="w-full h-full"
            onCellTap={handleCellTap}
            playerPosition={playerState.player.position}
            movementTarget={playerState.movementTarget}
            movementPath={playerState.movementPath}
            showGrid={uiState.showGrid}
            currentMap={currentMap}
            animals={animalState.animals}
            onAnimalClick={(animal) => {
              stableAddNotification({
                type: 'info',
                title: `${animal.species.charAt(0).toUpperCase() + animal.species.slice(1)}`,
                message: `This ${animal.species} is ${animal.ai.currentState}. ${animal.visual.emoteIcon || ''}`,
                duration: 3000
              });
            }}
          />
          
          {/* Quick Access UI Buttons - Left Panel */}
          <div className="absolute top-20 left-4 flex flex-col gap-2 z-40">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowInventory(true)}
              className="inventory-button shadow-lg"
              leftIcon={<Package size={16} />}
            >
              Inventory
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPlayerStatus(true)}
              className="shadow-lg"
              leftIcon={<User size={16} />}
            >
              Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompanionList(true)}
              className="companion-button shadow-lg bg-white"
              leftIcon={<Users size={16} />}
            >
              Companions
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTutorialMenu(true)}
              className="shadow-lg bg-white bg-opacity-80"
              leftIcon={<BookOpen size={16} />}
            >
              Tutorials
            </Button>
          </div>

          {/* Game Features Panel - Right Side */}
          <div className="absolute top-20 right-4 flex flex-col gap-2 z-40">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAchievements(true)}
              className="shadow-lg bg-yellow-500 hover:bg-yellow-600 text-white"
              leftIcon={<Award size={16} />}
            >
              Achievements
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrickTeaching(true)}
              className="shadow-lg bg-green-500 hover:bg-green-600 text-white"
              leftIcon={<Target size={16} />}
            >
              Tricks
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTamingInterface(true)}
              className="shadow-lg bg-pink-500 hover:bg-pink-600 text-white"
              leftIcon={<Heart size={16} />}
            >
              Taming
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSaveSlots(true)}
              className="shadow-lg bg-purple-500 hover:bg-purple-600"
              leftIcon={<Save size={16} />}
            >
              Save/Load
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowItemUsage(true)}
              className="shadow-lg bg-orange-500 hover:bg-orange-600 text-white"
              leftIcon={<Activity size={16} />}
            >
              Use Items
            </Button>
          </div>
          
          {/* Enhanced Game UI Overlay */}
          <GameUI 
            showDebugInfo={uiState.showDebugInfo}
            showGrid={uiState.showGrid}
            playerPosition={playerState.player.position}
            currentTile={currentMap ? currentMap.getTile(playerState.player.position.x, playerState.player.position.y) || undefined : undefined}
            gameStats={{
              fps: 60, // This would come from the game loop
              entityCount: animalState.animals.filter(a => a.isActive).length,
              tileCount: currentMap ? currentMap.getDimensions().width * currentMap.getDimensions().height : 0,
            }}
          />
          
          {/* Stacked Notifications */}
          {uiState.notifications.length > 0 && (
            <div className="absolute top-4 right-4">
              {uiState.notifications.slice(-3).map((notification, index) => {
                const isTop = index === uiState.notifications.slice(-3).length - 1;
                const offset = (uiState.notifications.slice(-3).length - 1 - index) * 8;
                const opacity = isTop ? 1 : 0.7 - (offset * 0.1);
                const scale = isTop ? 1 : 0.95 - (offset * 0.02);
                
                return (
                  <div
                    key={notification.id}
                    className={`absolute p-3 rounded shadow-lg text-white max-w-xs transition-all duration-200 ${
                      notification.type === 'success' ? 'bg-green-500' :
                      notification.type === 'error' ? 'bg-red-500' :
                      notification.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{
                      top: `${offset}px`,
                      right: `${offset}px`,
                      opacity,
                      transform: `scale(${scale})`,
                      zIndex: 50 - index
                    }}
                  >
                    <div className="font-medium text-sm">{notification.title}</div>
                    {isTop && (
                      <div className="text-xs opacity-90">{notification.message}</div>
                    )}
                  </div>
                );
              })}
              
              {/* Message Log Button */}
              {uiState.notifications.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openModal('messageLog')}
                  className="absolute -bottom-12 right-0 bg-black bg-opacity-70 text-white hover:bg-opacity-90 text-xs px-2 py-1"
                >
                  📝 {uiState.notifications.length} messages
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Touch Controls */}
        <TouchControls
          onMove={handleMove}
          onAction={handleAction}
          disabled={gameState.isPaused}
          showLabels={true}
        />
      </main>

      {/* Message Log Modal */}
      {uiState.activeModal === 'messageLog' && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Message Log</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </Button>
            </div>
            
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {uiState.notifications.length === 0 ? (
                <p className="text-gray-500 text-center">No messages yet</p>
              ) : (
                uiState.notifications.slice().reverse().map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded border-l-4 ${
                      notification.type === 'success' ? 'bg-green-50 border-green-500' :
                      notification.type === 'error' ? 'bg-red-50 border-red-500' :
                      notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">
                          {notification.title}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{uiState.notifications.length} total messages</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeModal}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Paused</h2>
            <p className="text-gray-600 mb-6">Take a break and come back when you're ready!</p>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                fullWidth 
                onClick={togglePause}
                leftIcon={<Play className="w-5 h-5" />}
              >
                Resume Game
              </Button>
              <Link to="/" className="block">
                <Button variant="outline" fullWidth>
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* UI Component Modals */}
      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(settings) => {
          console.log('Settings saved:', settings);
          setShowSettings(false);
        }}
      />

      <MainMenu
        isOpen={showMainMenu}
        onClose={() => setShowGameMenu(false)}
        onNewGame={() => {
          console.log('New game requested');
          setShowGameMenu(false);
        }}
        onLoadGame={(slotId) => {
          console.log('Load game from slot:', slotId);
          setShowGameMenu(false);
        }}
        onSettings={() => {
          setShowGameMenu(false);
          setShowSettings(true);
        }}
        onAbout={() => {
          console.log('Show about');
          setShowGameMenu(false);
        }}
        showHomeOption={true}
        onGoHome={() => {
          setShowGameMenu(false);
          // Navigate to home - would integrate with router
        }}
      />

      <Inventory
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        onUseItem={(itemId, targetId) => {
          console.log('Using item:', itemId, 'on target:', targetId);
          return { success: true, message: 'Item used successfully!', itemConsumed: true, quantityUsed: 1 };
        }}
        selectedAnimalId={undefined}
      />

      <PlayerStatus
        playerName={playerState.player.name}
        stats={{
          level: 1,
          experience: 150,
          experienceToNext: 200,
          energy: 85,
          maxEnergy: 100,
          health: 95,
          maxHealth: 100,
          totalPlayTime: 1800
        }}
        progress={{
          animalsDiscovered: animalState.animals.length,
          animalsTamed: 0,
          tricksLearned: 0,
          mapsExplored: 1,
          itemsCollected: 0,
          achievementsUnlocked: 0
        }}
        location={{
          currentMap: currentMap?.getMetadata().displayName || 'Unknown',
          region: 'Starter Meadow',
          coordinates: playerState.player.position,
          biome: 'Temperate'
        }}
        companionCount={0}
        inventoryCount={0}
        maxInventorySlots={20}
        onToggleCollapse={() => setShowPlayerStatus(false)}
      />

      <CompanionList
        isOpen={showCompanionList}
        onClose={() => setShowCompanionList(false)}
        companions={[]}
        onSelectCompanion={(companion) => {
          console.log('Selected companion:', companion);
        }}
        onFeedCompanion={(companionId) => {
          console.log('Feeding companion:', companionId);
        }}
        onPlayWithCompanion={(companionId) => {
          console.log('Playing with companion:', companionId);
        }}
        onTrainCompanion={(companionId) => {
          console.log('Training companion:', companionId);
        }}
      />

      <Tutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        currentTutorial={currentTutorial ? COMPREHENSIVE_TUTORIALS[currentTutorial] : null}
        onComplete={(tutorialId) => {
          console.log('Tutorial completed:', tutorialId);
          setCompletedTutorials(prev => [...prev, tutorialId]);
          localStorage.setItem(`tutorial-${tutorialId}-completed`, 'true');
          setShowTutorial(false);
          setCurrentTutorial(null);
        }}
        onSkip={() => {
          setShowTutorial(false);
          setCurrentTutorial(null);
        }}
        completedTutorials={completedTutorials}
      />

      <TutorialMenu
        isOpen={showTutorialMenu}
        onClose={() => setShowTutorialMenu(false)}
        onSelectTutorial={(tutorialId) => {
          setCurrentTutorial(tutorialId);
          setShowTutorial(true);
        }}
        completedTutorials={completedTutorials}
        playerLevel={playerState.player.level}
      />

      <Onboarding
        isOpen={showOnboarding}
        onComplete={() => {
          console.log('Onboarding completed');
          setHasShownWelcome(true);
          localStorage.setItem('feral-friends-welcome-shown', 'true');
          setShowOnboarding(false);
        }}
        onSkip={() => {
          console.log('Onboarding skipped');
          setHasShownWelcome(true);
          localStorage.setItem('feral-friends-welcome-shown', 'true');
          setShowOnboarding(false);
        }}
        playerName={playerState.player.name}
        playerLevel={playerState.player.level}
      />

      {/* Save/Load System */}
      <SaveSlots
        isOpen={showSaveSlots}
        onClose={() => setShowSaveSlots(false)}
        onLoadSave={(slotId: number, saveData) => {
          console.log('Loading game from slot:', slotId, saveData);
          setShowSaveSlots(false);
        }}
        onNewGame={() => {
          console.log('Starting new game');
          setShowSaveSlots(false);
        }}
      />

      {/* Data Management */}
      <DataManager
        isOpen={showDataManager}
        onClose={() => setShowDataManager(false)}
      />

      {/* Taming Interface */}
      {showTamingInterface && animalState.animals.length > 0 && (
        <TamingInterface
          animal={animalState.animals[0]}
          playerItems={[]}
          playerEnergy={100}
          onInteraction={(interactionId: string) => {
            console.log('Taming interaction:', interactionId);
          }}
          onClose={() => setShowTamingInterface(false)}
          isVisible={showTamingInterface}
        />
      )}

      {/* Enhanced Encounter Interface */}
      {showEncounterInterface && encounterAnimal && (
        <EnhancedEncounterInterface
          animal={encounterAnimal}
          playerItems={['food', 'water', 'toy']} // Placeholder items
          playerEnergy={100}
          onAnimalTamed={handleAnimalTamed}
          onAnimalFled={handleAnimalFled}
          onEnergyUsed={handleEnergyUsed}
          onItemUsed={handleItemUsed}
          onFlee={handleEncounterFlee}
          onClose={() => {
            setShowEncounterInterface(false);
            setEncounterAnimal(null);
          }}
          isVisible={showEncounterInterface}
        />
      )}

      {/* Trick Teaching */}
      {showTrickTeaching && animalState.animals.length > 0 && (
        <TrickTeaching
          animal={animalState.animals[0]}
          trickId="sit"
          onComplete={(success: boolean) => {
            console.log('Trick teaching completed:', success);
            setShowTrickTeaching(false);
          }}
          onClose={() => setShowTrickTeaching(false)}
          isVisible={showTrickTeaching}
        />
      )}

      {/* Item Usage Interface */}
      <ItemUsage
        visible={showItemUsage}
        onClose={() => setShowItemUsage(false)}
        targetAnimal={animalState.animals.length > 0 ? animalState.animals[0] : undefined}
        selectedItem={undefined}
        onItemUsed={(result) => {
          console.log('Item used with result:', result);
          if (result.itemConsumed) {
            setShowItemUsage(false);
          }
        }}
      />

      {/* Achievements Panel - Create a simple modal for now */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Achievements
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAchievements(false)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <h3 className="font-medium text-yellow-800">First Friend</h3>
                <p className="text-sm text-yellow-600">Tame your first animal companion</p>
                <div className="text-xs text-yellow-500 mt-1">Progress: 0/1</div>
              </div>
              <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <h3 className="font-medium text-blue-800">Explorer</h3>
                <p className="text-sm text-blue-600">Visit all map areas</p>
                <div className="text-xs text-blue-500 mt-1">Progress: 1/5</div>
              </div>
              <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                <h3 className="font-medium text-green-800">Trick Master</h3>
                <p className="text-sm text-green-600">Teach 10 different tricks</p>
                <div className="text-xs text-green-500 mt-1">Progress: 0/10</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Status Indicator */}
      <OfflineStatus position="top-right" />
    </div>
  );
};

export default Game;