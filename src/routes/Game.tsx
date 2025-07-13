import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Settings, Pause, Play } from 'react-feather';
import { Button, LoadingSpinner } from '../components/ui';
import { Container } from '../components/layout';
import { GameCanvas, TouchControls, GameUI } from '../components/game';
import { useGameStore, useGameState, usePlayerState, useUIState } from '../stores';
import { MapManager, createMapManager, GameMap } from '../game';
import { MAP_REGISTRY, DEFAULT_MAP_ID } from '../data/maps';
import { Position } from '../types/game';

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
  
  // Map system refs
  const mapManagerRef = useRef<MapManager | null>(null);
  
  // Zustand store hooks
  const gameState = useGameState();
  const playerState = usePlayerState();
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
    toggleDebugInfo 
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

  // Wrap addNotification to trace all calls
  const tracedAddNotification = useCallback((notification: any) => {
    console.log('🔔 addNotification called with:', notification);
    console.trace('Call stack for addNotification:');
    addNotification(notification);
  }, [addNotification]);

  // Create stable notification function
  const stableAddNotification = useCallback((notification: any) => {
    console.log('stableAddNotification called with:', notification);
    tracedAddNotification(notification);
  }, [tracedAddNotification]);

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
          tracedAddNotification({
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
        tracedAddNotification({
          type: 'error',
          title: 'Loading Failed',
          message: 'Failed to load the game. Please refresh and try again.',
          duration: 5000
        });
      }
    };

    initGame();
  }, []); // Empty dependency array - only run once on mount

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
    
    const currentPos = playerState.player.position;
    let newPosition = { ...currentPos };
    
    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, currentPos.y - 1);
        break;
      case 'down':
        newPosition.y = currentPos.y + 1;
        break;
      case 'left':
        newPosition.x = Math.max(0, currentPos.x - 1);
        break;
      case 'right':
        newPosition.x = currentPos.x + 1;
        break;
    }
    
    // Validate the new position using the same logic as tap-to-move
    if (!currentMap.isValidPosition(newPosition.x, newPosition.y)) {
      tracedAddNotification({
        type: 'warning',
        title: 'Invalid location',
        message: 'Cannot move outside map boundaries',
        duration: 2000
      });
      return;
    }
    
    if (!currentMap.isWalkable(newPosition.x, newPosition.y)) {
      const tile = currentMap.getTile(newPosition.x, newPosition.y);
      tracedAddNotification({
        type: 'warning',
        title: 'Blocked path',
        message: `Cannot walk on ${tile?.terrainType || 'this terrain'}`,
        duration: 2000
      });
      return;
    }
    
    movePlayer(newPosition);
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
      tracedAddNotification({
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
      tracedAddNotification({
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
      tracedAddNotification({
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
      tracedAddNotification({
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
    tracedAddNotification({
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
      tracedAddNotification({
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
            <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
              <Settings className="w-5 h-5" />
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
          />
          
          {/* Enhanced Game UI Overlay */}
          <GameUI 
            showDebugInfo={uiState.showDebugInfo}
            showGrid={uiState.showGrid}
            playerPosition={playerState.player.position}
            currentTile={currentMap ? currentMap.getTile(playerState.player.position.x, playerState.player.position.y) : undefined}
            gameStats={{
              fps: 60, // This would come from the game loop
              entityCount: 0,
              tileCount: currentMap ? currentMap.getDimensions().width * currentMap.getDimensions().height : 0,
            }}
          />
          
          {/* Notifications */}
          {uiState.notifications.length > 0 && (
            <div className="absolute top-4 right-4 space-y-2">
              {uiState.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded shadow-lg text-white max-w-xs ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm opacity-90">{notification.message}</div>
                </div>
              ))}
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
    </div>
  );
};

export default Game;