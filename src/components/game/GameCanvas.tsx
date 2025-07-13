import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TILE_SIZE, TARGET_FPS } from '../../constants';
import { Animal, getAnimalEmotion } from '../../game/Animal';
import { DialogueBox } from './DialogueBox';
import { dialogueSystem } from '../../game/DialogueSystem';
import { useGameStore } from '../../stores/gameStore';
import { createPlayerAnimations, PlayerAnimations } from '../../game/PlayerAnimations';
import { createAnimalAnimations, AnimalAnimations } from '../../game/AnimalAnimations';

interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
  isPaused?: boolean;
  onCellTap?: (gridX: number, gridY: number) => void;
  playerPosition?: { x: number; y: number };
  movementTarget?: { x: number; y: number } | null;
  movementPath?: { x: number; y: number }[];
  showGrid?: boolean;
  currentMap?: any; // GameMap type - will be properly typed later
  animals?: Animal[];
  onAnimalClick?: (animal: Animal) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  width: propWidth,
  height: propHeight,
  className = '',
  onCanvasReady,
  isPaused = false,
  onCellTap,
  playerPosition = { x: 10, y: 10 },
  movementTarget = null,
  movementPath = [],
  showGrid = true,
  currentMap = null,
  animals = [],
  onAnimalClick
}) => {
  const dialogueState = useGameStore((state) => state.uiState.dialogueState);
  const setDialogueState = useGameStore((state) => state.setDialogueState);
  const clearDialogue = useGameStore((state) => state.clearDialogue);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [fps, setFps] = useState(0);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  
  // FPS tracking
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsUpdateTime = useRef(performance.now());

  // Animation systems
  const playerAnimations = useRef<PlayerAnimations | null>(null);
  const animalAnimations = useRef<AnimalAnimations | null>(null);

  // Dialogue handlers
  const handleDialogueOptionSelect = useCallback((optionId: string) => {
    const result = dialogueSystem.selectOption(optionId);
    if (result) {
      setDialogueState(dialogueSystem.getState());
    }
  }, [setDialogueState]);

  const handleDialogueClose = useCallback(() => {
    dialogueSystem.endDialogue();
    clearDialogue();
  }, [clearDialogue]);

  // Keyboard event handler for dialogue
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dialogueState.isActive) {
        handleDialogueClose();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [dialogueState.isActive, handleDialogueClose]);

  // Initialize animation systems
  useEffect(() => {
    if (!playerAnimations.current) {
      playerAnimations.current = createPlayerAnimations(playerPosition);
    }
    if (!animalAnimations.current) {
      animalAnimations.current = createAnimalAnimations();
    }
  }, []);

  // Update player animations when position changes
  const prevPlayerPosition = useRef(playerPosition);
  useEffect(() => {
    if (playerAnimations.current) {
      const prevPos = prevPlayerPosition.current;
      
      // Check if position actually changed
      if (prevPos.x !== playerPosition.x || prevPos.y !== playerPosition.y) {
        console.log('Player position changed from', prevPos, 'to', playerPosition);
        
        // Start movement animation from previous position to new position
        playerAnimations.current.startMovement(playerPosition);
      }
      
      // Update the ref for next comparison
      prevPlayerPosition.current = playerPosition;
    }
  }, [playerPosition]);

  // Handle canvas resizing
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();
    
    // Use provided dimensions or container size
    const newWidth = propWidth || rect.width;
    const newHeight = propHeight || rect.height;
    
    // Get device pixel ratio for crisp rendering
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Set display size
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    
    // Set actual canvas size for crisp rendering
    canvas.width = newWidth * pixelRatio;
    canvas.height = newHeight * pixelRatio;
    
    // Scale context to match device pixel ratio
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio);
      
      // Set default canvas styles for crisp pixel art
      ctx.imageSmoothingEnabled = false;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
    
    setDimensions({ width: newWidth, height: newHeight });
  }, [propWidth, propHeight]);

  // Initialize canvas
  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => updateCanvasSize();
    const handleOrientationChange = () => {
      // Delay to ensure proper dimensions after orientation change
      setTimeout(updateCanvasSize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateCanvasSize]);

  // Camera following logic with smooth interpolation
  const targetCamera = useRef({ x: 0, y: 0 });
  const cameraSpeed = 0.1; // Adjust this value to control camera smoothness (0.1 = smooth, 1.0 = instant)

  useEffect(() => {
    if (!currentMap) return;
    
    const mapDimensions = currentMap.getDimensions();
    const centerX = Math.floor(dimensions.width / 2);
    const centerY = Math.floor(dimensions.height / 2);
    
    // Calculate target camera position to center player on screen
    let targetCameraX = (playerPosition.x * TILE_SIZE) - centerX;
    let targetCameraY = (playerPosition.y * TILE_SIZE) - centerY;
    
    // Clamp camera to map boundaries
    const maxCameraX = (mapDimensions.width * TILE_SIZE) - dimensions.width;
    const maxCameraY = (mapDimensions.height * TILE_SIZE) - dimensions.height;
    
    targetCameraX = Math.max(0, Math.min(maxCameraX, targetCameraX));
    targetCameraY = Math.max(0, Math.min(maxCameraY, targetCameraY));
    
    // Store target position for smooth interpolation
    targetCamera.current = { x: targetCameraX, y: targetCameraY };
  }, [playerPosition, dimensions, currentMap]);

  // Smooth camera interpolation in render loop
  useEffect(() => {
    if (!currentMap) return;

    let animationId: number;
    
    const updateCamera = () => {
      setCamera(prevCamera => {
        const deltaX = targetCamera.current.x - prevCamera.x;
        const deltaY = targetCamera.current.y - prevCamera.y;
        
        // Use smooth interpolation
        const newX = prevCamera.x + deltaX * cameraSpeed;
        const newY = prevCamera.y + deltaY * cameraSpeed;
        
        // If very close to target, snap to avoid infinite micro-movements
        const threshold = 0.5;
        const finalX = Math.abs(deltaX) < threshold ? targetCamera.current.x : newX;
        const finalY = Math.abs(deltaY) < threshold ? targetCamera.current.y : newY;
        
        return { x: finalX, y: finalY };
      });
      
      animationId = requestAnimationFrame(updateCamera);
    };
    
    animationId = requestAnimationFrame(updateCamera);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [currentMap, cameraSpeed]);

  // Notify parent when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && onCanvasReady) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        onCanvasReady(canvas, ctx);
      }
    }
  }, [onCanvasReady]);

  // Handle canvas tap/click for movement
  const handleCanvasInteraction = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!onCellTap || !canvasRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      // Touch event - only handle touchend, not touchstart
      if (event.type !== 'touchend') return;
      if (event.changedTouches.length === 0) return;
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      // Mouse event - only handle click, not mousedown/mouseup
      if (event.type !== 'click') return;
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // Convert to world coordinates (accounting for camera offset)
    const worldX = canvasX + camera.x;
    const worldY = canvasY + camera.y;
    
    // Convert to grid coordinates
    const gridX = Math.floor(worldX / TILE_SIZE);
    const gridY = Math.floor(worldY / TILE_SIZE);
    
    // Ensure coordinates are within map bounds
    if (currentMap && currentMap.isValidPosition(gridX, gridY)) {
      onCellTap(gridX, gridY);
    }
  }, [onCellTap, dimensions, TILE_SIZE, camera, currentMap]);

  // Simple terrain rendering function
  const renderMapTerrain = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!currentMap) return;
    
    // Calculate visible tile range based on camera position
    const visibleStartX = Math.floor(camera.x / TILE_SIZE) - 1;
    const visibleEndX = Math.floor((camera.x + dimensions.width) / TILE_SIZE) + 1;
    const visibleStartY = Math.floor(camera.y / TILE_SIZE) - 1;
    const visibleEndY = Math.floor((camera.y + dimensions.height) / TILE_SIZE) + 1;
    
    // Simple terrain color mapping
    const terrainColors: Record<string, string> = {
      grass: '#22c55e',
      water: '#3b82f6', 
      stone: '#6b7280',
      forest: '#15803d',
      path: '#a3a3a3',
      flower: '#ec4899',
      sand: '#fbbf24',
      dirt: '#92400e',
      rock: '#374151',
      bush: '#16a34a',
    };
    
    for (let y = visibleStartY; y <= visibleEndY; y++) {
      for (let x = visibleStartX; x <= visibleEndX; x++) {
        const tile = currentMap.getTile(x, y);
        if (!tile) continue;
        
        // Convert world coordinates to screen coordinates
        const screenX = (x * TILE_SIZE) - camera.x;
        const screenY = (y * TILE_SIZE) - camera.y;
        const terrainType = tile.terrainType || tile.type || 'grass';
        
        ctx.fillStyle = terrainColors[terrainType] || terrainColors.grass;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // Add simple visual variations
        if (terrainType === 'water') {
          // Water animation
          const ripple = Math.sin(Date.now() * 0.003 + x * 0.1 + y * 0.1) * 3;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenX, screenY + TILE_SIZE/2 + ripple);
          ctx.lineTo(screenX + TILE_SIZE, screenY + TILE_SIZE/2 + ripple);
          ctx.stroke();
        } else if (terrainType === 'flower') {
          // Flower spots
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [currentMap, dimensions, TILE_SIZE, camera]);

  // Animal rendering function
  const renderAnimals = useCallback((ctx: CanvasRenderingContext2D, currentTime: number) => {
    if (!animals || animals.length === 0) return;

    for (const animal of animals) {
      if (!animal.isActive) continue;

      // Convert animal position to screen coordinates
      const screenX = (animal.position.x * TILE_SIZE) - camera.x;
      const screenY = (animal.position.y * TILE_SIZE) - camera.y;

      // Skip rendering if animal is off-screen
      if (screenX < -TILE_SIZE || screenX > dimensions.width || 
          screenY < -TILE_SIZE || screenY > dimensions.height) {
        continue;
      }

      const centerX = screenX + TILE_SIZE / 2;
      const centerY = screenY + TILE_SIZE / 2;

      // Get animal colors
      const primaryColor = animal.visual.color;
      const secondaryColor = animal.visual.secondaryColor || primaryColor;

      // Animation based on movement and species
      const time = currentTime * 0.001;
      let animationOffset = 0;
      
      switch (animal.visual.animation) {
        case 'hop':
          animationOffset = animal.ai.currentState === 'wandering' ? 
            Math.abs(Math.sin(time * 8)) * 8 : 0;
          break;
        case 'fly':
          animationOffset = Math.sin(time * 6) * 6;
          break;
        case 'walk':
          animationOffset = animal.ai.currentState === 'wandering' ? 
            Math.sin(time * 4) * 2 : 0;
          break;
        case 'dart':
          animationOffset = animal.ai.currentState === 'wandering' ? 
            Math.sin(time * 12) * 4 : 0;
          break;
        case 'swim':
          animationOffset = Math.sin(time * 3) * 3;
          break;
        default:
          animationOffset = 0;
      }

      const finalY = centerY - animationOffset;

      // Animal shadow (except for flying animals)
      if (animal.visual.animation !== 'fly') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 8, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw animal based on species and size
      const sizeMultiplier = {
        tiny: 0.6,
        small: 0.8,
        medium: 1.0,
        large: 1.3
      }[animal.visual.size];

      const baseSize = 8 * sizeMultiplier;

      // Animal body
      ctx.fillStyle = primaryColor;
      ctx.beginPath();

      switch (animal.species) {
        case 'rabbit':
          // Oval body
          ctx.ellipse(centerX, finalY, baseSize * 1.2, baseSize, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Ears
          ctx.fillStyle = secondaryColor;
          ctx.beginPath();
          ctx.ellipse(centerX - 4, finalY - baseSize, 3, baseSize * 0.8, 0, 0, Math.PI * 2);
          ctx.ellipse(centerX + 4, finalY - baseSize, 3, baseSize * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'bird':
          // Round body
          ctx.arc(centerX, finalY, baseSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Wing
          ctx.fillStyle = secondaryColor;
          ctx.beginPath();
          ctx.ellipse(centerX + baseSize * 0.5, finalY, baseSize * 0.8, baseSize * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Beak
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(centerX - baseSize, finalY);
          ctx.lineTo(centerX - baseSize * 1.5, finalY - 2);
          ctx.lineTo(centerX - baseSize, finalY + 2);
          ctx.fill();
          break;

        case 'squirrel':
          // Oval body
          ctx.ellipse(centerX, finalY, baseSize, baseSize * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Tail
          ctx.fillStyle = secondaryColor;
          ctx.beginPath();
          ctx.ellipse(centerX + baseSize, finalY - baseSize * 0.5, baseSize * 0.8, baseSize * 1.5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'fox':
          // Elongated body
          ctx.ellipse(centerX, finalY, baseSize * 1.3, baseSize * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Ears
          ctx.fillStyle = secondaryColor;
          ctx.beginPath();
          ctx.moveTo(centerX - 4, finalY - baseSize);
          ctx.lineTo(centerX - 1, finalY - baseSize * 1.5);
          ctx.lineTo(centerX + 2, finalY - baseSize);
          ctx.moveTo(centerX + 4, finalY - baseSize);
          ctx.lineTo(centerX + 1, finalY - baseSize * 1.5);
          ctx.lineTo(centerX - 2, finalY - baseSize);
          ctx.fill();
          break;

        case 'deer':
          // Large oval body
          ctx.ellipse(centerX, finalY, baseSize * 1.1, baseSize * 1.4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Antlers (if applicable)
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX - 6, finalY - baseSize);
          ctx.lineTo(centerX - 8, finalY - baseSize * 1.8);
          ctx.moveTo(centerX + 6, finalY - baseSize);
          ctx.lineTo(centerX + 8, finalY - baseSize * 1.8);
          ctx.stroke();
          break;

        case 'butterfly':
          // Small body
          ctx.fillStyle = '#374151';
          ctx.beginPath();
          ctx.ellipse(centerX, finalY, 2, baseSize, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Wings
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.ellipse(centerX - 4, finalY - 2, baseSize * 0.8, baseSize * 0.6, 0, 0, Math.PI * 2);
          ctx.ellipse(centerX + 4, finalY - 2, baseSize * 0.8, baseSize * 0.6, 0, 0, Math.PI * 2);
          ctx.ellipse(centerX - 4, finalY + 2, baseSize * 0.6, baseSize * 0.4, 0, 0, Math.PI * 2);
          ctx.ellipse(centerX + 4, finalY + 2, baseSize * 0.6, baseSize * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'frog':
          // Round body
          ctx.arc(centerX, finalY, baseSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Eyes
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(centerX - 3, finalY - baseSize * 0.7, 3, 0, Math.PI * 2);
          ctx.arc(centerX + 3, finalY - baseSize * 0.7, 3, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'turtle':
          // Shell
          ctx.fillStyle = secondaryColor;
          ctx.beginPath();
          ctx.ellipse(centerX, finalY, baseSize * 1.2, baseSize, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Shell pattern
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, finalY, baseSize * 0.8, 0, Math.PI * 2);
          ctx.moveTo(centerX - baseSize * 0.5, finalY);
          ctx.lineTo(centerX + baseSize * 0.5, finalY);
          ctx.moveTo(centerX, finalY - baseSize * 0.5);
          ctx.lineTo(centerX, finalY + baseSize * 0.5);
          ctx.stroke();
          
          // Head
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(centerX - baseSize, finalY, baseSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;

        default:
          // Default round animal
          ctx.arc(centerX, finalY, baseSize, 0, Math.PI * 2);
          ctx.fill();
      }

      // State indicator (emote icon) 
      if (animal.visual.emoteIcon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX + baseSize + 8, finalY - baseSize, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = '14px emoji';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(animal.visual.emoteIcon, centerX + baseSize + 8, finalY - baseSize);
      }

      // Debug info (if enabled) 
      if (showGrid) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${animal.species}`, centerX, finalY + baseSize + 12);
        ctx.fillText(`${animal.ai.currentState}`, centerX, finalY + baseSize + 22);
      }
    }
  }, [animals, camera, dimensions, TILE_SIZE, showGrid]);

  // Simple demo rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (currentTime: number) => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      // FPS calculation
      frameCount.current++;
      if (currentTime - fpsUpdateTime.current >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - fpsUpdateTime.current)));
        frameCount.current = 0;
        fpsUpdateTime.current = currentTime;
      }

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw map terrain if available, otherwise fallback to gradient
      if (currentMap) {
        renderMapTerrain(ctx);
      } else {
        // Draw background gradient (fallback)
        const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
        gradient.addColorStop(0, '#86efac'); // green-300
        gradient.addColorStop(0.5, '#34d399'); // emerald-400
        gradient.addColorStop(1, '#06b6d4'); // cyan-500
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }
      
      // Draw grid (optional)
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Calculate grid offset based on camera
        const gridOffsetX = camera.x % TILE_SIZE;
        const gridOffsetY = camera.y % TILE_SIZE;
        
        // Vertical lines
        for (let x = -gridOffsetX; x <= dimensions.width; x += TILE_SIZE) {
          if (x >= 0) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, dimensions.height);
            ctx.stroke();
          }
        }
        
        // Horizontal lines
        for (let y = -gridOffsetY; y <= dimensions.height; y += TILE_SIZE) {
          if (y >= 0) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(dimensions.width, y);
            ctx.stroke();
          }
        }
      }
      
      // Draw movement path
      if (movementPath.length > 0) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; // green-500 with opacity
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        // Start from current player position (adjusted for camera)
        const startX = (playerPosition.x * TILE_SIZE + TILE_SIZE / 2) - camera.x;
        const startY = (playerPosition.y * TILE_SIZE + TILE_SIZE / 2) - camera.y;
        ctx.moveTo(startX, startY);
        
        // Draw path (adjusted for camera)
        movementPath.forEach((point) => {
          const pathX = (point.x * TILE_SIZE + TILE_SIZE / 2) - camera.x;
          const pathY = (point.y * TILE_SIZE + TILE_SIZE / 2) - camera.y;
          ctx.lineTo(pathX, pathY);
        });
        
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
      }
      
      // Draw movement target
      if (movementTarget) {
        const targetX = (movementTarget.x * TILE_SIZE) - camera.x;
        const targetY = (movementTarget.y * TILE_SIZE) - camera.y;
        
        // Target highlight
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)'; // green-500 with opacity
        ctx.fillRect(targetX, targetY, TILE_SIZE, TILE_SIZE);
        
        // Target border
        ctx.strokeStyle = '#22c55e'; // green-500
        ctx.lineWidth = 2;
        ctx.strokeRect(targetX, targetY, TILE_SIZE, TILE_SIZE);
        
        // Target center indicator
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(targetX + TILE_SIZE / 2, targetY + TILE_SIZE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw animals
      renderAnimals(ctx, currentTime);
      
      // Draw animated player character
      if (playerAnimations.current) {
        const animatedData = playerAnimations.current.update(16); // 60fps
        const playerScreenX = animatedData.x + TILE_SIZE / 2 - camera.x;
        const playerScreenY = animatedData.y + TILE_SIZE / 2 - camera.y;
        
        ctx.save();
        ctx.translate(playerScreenX, playerScreenY);
        ctx.scale(animatedData.scale, animatedData.scale);
        ctx.rotate(animatedData.rotation * Math.PI / 180);
        
        // Character shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Character body
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Character eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-5, -5, 1.5, 0, Math.PI * 2);
        ctx.arc(5, -5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      } else {
        // Fallback to old rendering
        const time = currentTime * 0.001;
        const playerScreenX = (playerPosition.x * TILE_SIZE + TILE_SIZE / 2) - camera.x;
        const playerScreenY = (playerPosition.y * TILE_SIZE + TILE_SIZE / 2) - camera.y;
        const bounce = Math.sin(time * 3) * 5;
        
        // Character shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(playerScreenX, playerScreenY + 20, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Character body
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY + bounce, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Character eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(playerScreenX - 5, playerScreenY - 5 + bounce, 3, 0, Math.PI * 2);
        ctx.arc(playerScreenX + 5, playerScreenY - 5 + bounce, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(playerScreenX - 5, playerScreenY - 5 + bounce, 1.5, 0, Math.PI * 2);
        ctx.arc(playerScreenX + 5, playerScreenY - 5 + bounce, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Debug info
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 100);
      
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.fillText(`FPS: ${fps}`, 15, 25);
      ctx.fillText(`Size: ${dimensions.width}x${dimensions.height}`, 15, 40);
      ctx.fillText(`Ratio: ${window.devicePixelRatio}`, 15, 55);
      ctx.fillText(`Status: ${isPaused ? 'PAUSED' : 'RUNNING'}`, 15, 70);
      ctx.fillText(`Animals: ${animals.filter(a => a.isActive).length}`, 15, 85);
      
      lastTime.current = currentTime;
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, isPaused, fps, playerPosition, movementTarget, movementPath, showGrid, currentMap, renderMapTerrain, camera, renderAnimals, animals]);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative ${className}`}
      style={{ touchAction: 'none' }} // Prevent scrolling on touch
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ 
          imageRendering: 'pixelated', // Crisp pixel art - fallback for older browsers
          // Note: Only the last imageRendering value would apply anyway due to CSS cascade
        }}
        onClick={handleCanvasInteraction}
        onTouchEnd={handleCanvasInteraction}
      />
      <DialogueBox
        dialogueState={dialogueState}
        onSelectOption={handleDialogueOptionSelect}
        onClose={handleDialogueClose}
      />
    </div>
  );
};

export default GameCanvas;