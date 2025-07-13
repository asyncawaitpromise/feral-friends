// Game UI Overlay Component
// Displays game information, debug data, and interactive UI elements

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Grid, Info, MapPin, Zap } from 'react-feather';
import { Button } from '../ui';
import { useGameStore, usePlayerState, useUIState } from '../../stores';
import { Position } from '../../types/game';

export interface GameUIProps {
  className?: string;
  showDebugInfo?: boolean;
  showGrid?: boolean;
  playerPosition?: Position;
  currentTile?: {
    type?: string;
    terrainType?: string;
    walkable: boolean;
  };
  gameStats?: {
    fps: number;
    entityCount: number;
    tileCount: number;
  };
  onToggleGrid?: () => void;
  onToggleDebug?: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
  className = '',
  showDebugInfo = false,
  showGrid = false,
  playerPosition = { x: 0, y: 0 },
  currentTile,
  gameStats,
  onToggleGrid,
  onToggleDebug,
}) => {
  const playerState = usePlayerState();
  const uiState = useUIState();
  const { toggleDebugInfo, toggleGrid } = useGameStore();
  
  // Local state for UI animations
  const [isCompact, setIsCompact] = useState(false);
  const [lastPosition, setLastPosition] = useState(playerPosition);
  const [positionChanged, setPositionChanged] = useState(false);
  const [hasSeenInstructions, setHasSeenInstructions] = useState(() => {
    return localStorage.getItem('feral-friends-instructions-seen') === 'true';
  });
  
  // Auto-compact UI after period of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCompact(true);
    }, 10000); // Compact after 10 seconds
    
    return () => clearTimeout(timer);
  }, [playerPosition]);
  
  // Track position changes for visual feedback
  useEffect(() => {
    if (playerPosition.x !== lastPosition.x || playerPosition.y !== lastPosition.y) {
      setPositionChanged(true);
      setLastPosition(playerPosition);
      setIsCompact(false); // Expand UI when moving
      
      const timer = setTimeout(() => {
        setPositionChanged(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [playerPosition, lastPosition]);
  
  const handleToggleGrid = () => {
    if (onToggleGrid) {
      onToggleGrid();
    } else {
      toggleGrid();
    }
  };
  
  const handleToggleDebug = () => {
    if (onToggleDebug) {
      onToggleDebug();
    } else {
      toggleDebugInfo();
    }
  };
  
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Main Game Info Panel */}
      <div className={`absolute top-4 left-4 pointer-events-auto transition-all duration-300 ${
        isCompact ? 'opacity-70 scale-90' : 'opacity-100 scale-100'
      }`}>
        <div className="bg-black bg-opacity-70 text-white rounded-lg p-3 space-y-2 min-w-48">
          {/* Player Position */}
          <div className={`flex items-center space-x-2 transition-colors duration-300 ${
            positionChanged ? 'text-green-400' : 'text-white'
          }`}>
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-mono">
              Position: ({playerPosition.x}, {playerPosition.y})
            </span>
          </div>
          
          {/* Current Tile Info */}
          {currentTile && (
            <div className="flex items-center space-x-2 text-gray-300">
              <div className={`w-3 h-3 rounded border ${
                currentTile.walkable ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'
              }`} />
              <span className="text-sm capitalize">
                {currentTile.terrainType || currentTile.type || 'unknown'} {!currentTile.walkable && '(blocked)'}
              </span>
            </div>
          )}
          
          {/* Player Stats */}
          <div className="space-y-1 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Level:</span>
              <span className="font-mono">{playerState.player.level}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>XP:</span>
              <span className="font-mono">{playerState.player.experience}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Animals:</span>
              <span className="font-mono">{playerState.discoveredAnimals.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Companions:</span>
              <span className="font-mono">{playerState.companions.length}</span>
            </div>
          </div>
          
          {/* Movement Status */}
          {playerState.isMoving && (
            <div className="flex items-center space-x-2 text-blue-400">
              <Zap className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Moving...</span>
              {playerState.movementTarget && (
                <span className="text-xs font-mono">
                  → ({playerState.movementTarget.x}, {playerState.movementTarget.y})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Controls Panel */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-black bg-opacity-70 rounded-lg p-2 space-y-2">
          {/* Grid Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleGrid}
            className={`w-10 h-10 p-0 ${
              showGrid ? 'text-blue-400 bg-blue-400 bg-opacity-20' : 'text-white hover:text-blue-400'
            }`}
            title={showGrid ? 'Hide Grid' : 'Show Grid'}
          >
            <Grid className="w-4 h-4" />
          </Button>
          
          {/* Debug Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleDebug}
            className={`w-10 h-10 p-0 ${
              showDebugInfo ? 'text-green-400 bg-green-400 bg-opacity-20' : 'text-white hover:text-green-400'
            }`}
            title={showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
          >
            {showDebugInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      {/* Debug Information Panel */}
      {showDebugInfo && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <div className="bg-black bg-opacity-80 text-white rounded-lg p-4 font-mono text-xs space-y-2 max-w-xs">
            <div className="flex items-center space-x-2 text-green-400 mb-3">
              <Info className="w-4 h-4" />
              <span className="font-bold">Debug Information</span>
            </div>
            
            {/* Performance Stats */}
            {gameStats && (
              <div className="space-y-1">
                <div className="text-yellow-400 font-bold">Performance:</div>
                <div className="ml-2 space-y-1">
                  <div>FPS: {gameStats.fps}</div>
                  <div>Entities: {gameStats.entityCount}</div>
                  <div>Tiles: {gameStats.tileCount}</div>
                </div>
              </div>
            )}
            
            {/* Player Debug Info */}
            <div className="space-y-1">
              <div className="text-blue-400 font-bold">Player:</div>
              <div className="ml-2 space-y-1">
                <div>ID: {playerState.player.id}</div>
                <div>Name: {playerState.player.name}</div>
                <div>Grid Pos: ({playerPosition.x}, {playerPosition.y})</div>
                <div>Moving: {playerState.isMoving ? 'YES' : 'NO'}</div>
                {playerState.movementTarget && (
                  <div>Target: ({playerState.movementTarget.x}, {playerState.movementTarget.y})</div>
                )}
                <div>Path Length: {playerState.movementPath.length}</div>
              </div>
            </div>
            
            {/* Current Tile Debug */}
            {currentTile && (
              <div className="space-y-1">
                <div className="text-purple-400 font-bold">Current Tile:</div>
                <div className="ml-2 space-y-1">
                  <div>Type: {currentTile.terrainType || currentTile.type || 'unknown'}</div>
                  <div>Walkable: {currentTile.walkable ? 'YES' : 'NO'}</div>
                  <div>Pos: ({playerPosition.x}, {playerPosition.y})</div>
                </div>
              </div>
            )}
            
            {/* UI State Debug */}
            <div className="space-y-1">
              <div className="text-pink-400 font-bold">UI State:</div>
              <div className="ml-2 space-y-1">
                <div>Active Modal: {uiState.activeModal || 'None'}</div>
                <div>Active Menu: {uiState.activeMenu || 'None'}</div>
                <div>Show Grid: {uiState.showGrid ? 'YES' : 'NO'}</div>
                <div>Show Debug: {uiState.showDebugInfo ? 'YES' : 'NO'}</div>
                <div>Notifications: {uiState.notifications.length}</div>
              </div>
            </div>
            
            {/* Browser/Device Info */}
            <div className="space-y-1">
              <div className="text-orange-400 font-bold">Device:</div>
              <div className="ml-2 space-y-1">
                <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
                <div>Pixel Ratio: {window.devicePixelRatio}</div>
                <div>Touch: {('ontouchstart' in window) ? 'YES' : 'NO'}</div>
                <div>Online: {navigator.onLine ? 'YES' : 'NO'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mini Map (Future Feature Placeholder) */}
      {showDebugInfo && (
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <div className="bg-black bg-opacity-70 rounded-lg p-3 w-32 h-32">
            <div className="text-white text-xs text-center mb-2">Mini Map</div>
            <div className="w-full h-20 bg-gray-800 rounded border-2 border-gray-600 relative">
              {/* Player dot */}
              <div 
                className="absolute w-2 h-2 bg-blue-400 rounded-full transform -translate-x-1 -translate-y-1"
                style={{
                  left: `${((playerPosition.x % 20) / 20) * 100}%`,
                  top: `${((playerPosition.y % 20) / 20) * 100}%`,
                }}
              />
              {/* Target dot */}
              {playerState.movementTarget && (
                <div 
                  className="absolute w-2 h-2 bg-green-400 rounded-full transform -translate-x-1 -translate-y-1"
                  style={{
                    left: `${((playerState.movementTarget.x % 20) / 20) * 100}%`,
                    top: `${((playerState.movementTarget.y % 20) / 20) * 100}%`,
                  }}
                />
              )}
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              Area {Math.floor(playerPosition.x / 20)},{Math.floor(playerPosition.y / 20)}
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions Panel (for new players) */}
      {!isCompact && !hasSeenInstructions && playerState.player.level === 1 && playerState.player.experience === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-blue-600 bg-opacity-90 text-white rounded-lg p-4 max-w-sm">
            <div className="text-center space-y-2">
              <div className="text-sm font-bold">Welcome to Feral Friends!</div>
              <div className="text-xs space-y-1">
                <div>• Tap any grid cell to move there</div>
                <div>• Use the virtual controls below</div>
                <div>• Explore to discover animals</div>
                <div>• Toggle grid/debug with buttons above</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 text-white border-white hover:bg-white hover:text-blue-600"
                onClick={() => {
                  setIsCompact(true);
                  setHasSeenInstructions(true);
                  localStorage.setItem('feral-friends-instructions-seen', 'true');
                }}
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;