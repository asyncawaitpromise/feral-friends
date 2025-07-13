import { useEffect, useCallback } from 'react';
import { getAudioManager, SoundOptions } from '../services/AudioManager';
import { getAmbientAudio } from '../game/AmbientAudio';

// Hook for easy sound effects
export function useSound() {
  const audioManager = getAudioManager();

  const playSound = useCallback((id: string, options?: SoundOptions) => {
    audioManager.playSound(id, options);
  }, [audioManager]);

  const playButtonClick = useCallback(() => {
    audioManager.playButtonClick();
  }, [audioManager]);

  const playButtonHover = useCallback(() => {
    audioManager.playButtonHover();
  }, [audioManager]);

  const playSuccess = useCallback(() => {
    audioManager.playSuccess();
  }, [audioManager]);

  const playError = useCallback(() => {
    audioManager.playError();
  }, [audioManager]);

  const playMenuOpen = useCallback(() => {
    audioManager.playMenuOpen();
  }, [audioManager]);

  const playMenuClose = useCallback(() => {
    audioManager.playMenuClose();
  }, [audioManager]);

  const playAnimalSound = useCallback((animalType: string) => {
    audioManager.playAnimalSound(animalType);
  }, [audioManager]);

  const playInteractionSound = useCallback((interactionType: string, success: boolean) => {
    audioManager.playInteractionSound(interactionType, success);
  }, [audioManager]);

  return {
    playSound,
    playButtonClick,
    playButtonHover,
    playSuccess,
    playError,
    playMenuOpen,
    playMenuClose,
    playAnimalSound,
    playInteractionSound
  };
}

// Hook for music control
export function useMusic() {
  const audioManager = getAudioManager();

  const playMusic = useCallback((id: string, options?: SoundOptions) => {
    audioManager.playMusic(id, options);
  }, [audioManager]);

  const stopMusic = useCallback((fadeOut?: number) => {
    audioManager.stopMusic(fadeOut);
  }, [audioManager]);

  const playAmbient = useCallback((id: string, options?: SoundOptions) => {
    audioManager.playAmbient(id, options);
  }, [audioManager]);

  const stopAmbient = useCallback((fadeOut?: number) => {
    audioManager.stopAmbient(fadeOut);
  }, [audioManager]);

  return {
    playMusic,
    stopMusic,
    playAmbient,
    stopAmbient
  };
}

// Hook for ambient audio management
export function useAmbientAudio() {
  const ambientAudio = getAmbientAudio();

  const setMapType = useCallback((mapType: string) => {
    ambientAudio.setMapType(mapType);
  }, [ambientAudio]);

  const setWeather = useCallback((weather: 'clear' | 'cloudy' | 'rainy' | 'windy' | 'snowy') => {
    ambientAudio.setWeather(weather);
  }, [ambientAudio]);

  const setTimeOfDay = useCallback((timeOfDay: number) => {
    ambientAudio.setTimeOfDay(timeOfDay);
  }, [ambientAudio]);

  const setPlayerActivity = useCallback((activity: 'idle' | 'moving' | 'interacting') => {
    ambientAudio.setPlayerActivity(activity);
  }, [ambientAudio]);

  const setPlayerPosition = useCallback((position: { x: number; y: number }) => {
    ambientAudio.setPlayerPosition(position);
  }, [ambientAudio]);

  const setNearbyAnimals = useCallback((animalTypes: string[]) => {
    ambientAudio.setNearbyAnimals(animalTypes);
  }, [ambientAudio]);

  const playEnvironmentalSound = useCallback((eventType: string, position?: { x: number; y: number }) => {
    ambientAudio.playEnvironmentalSound(eventType, position);
  }, [ambientAudio]);

  return {
    setMapType,
    setWeather,
    setTimeOfDay,
    setPlayerActivity,
    setPlayerPosition,
    setNearbyAnimals,
    playEnvironmentalSound
  };
}

// Hook for audio initialization
export function useAudioInitialization() {
  const audioManager = getAudioManager();
  const ambientAudio = getAmbientAudio();

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioManager.initialize();
        ambientAudio.start();
        console.log('Audio systems initialized');
      } catch (error) {
        console.warn('Audio initialization failed:', error);
      }
    };

    // Initialize audio on first user interaction to comply with browser policies
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [audioManager, ambientAudio]);

  return {
    audioManager,
    ambientAudio
  };
}

// Hook for interaction-specific audio feedback
export function useInteractionAudio() {
  const { playInteractionSound, playAnimalSound } = useSound();
  const { playEnvironmentalSound } = useAmbientAudio();

  const handleInteractionResult = useCallback((
    animalType: string,
    interactionType: string,
    success: boolean,
    position?: { x: number; y: number }
  ) => {
    // Play interaction sound
    playInteractionSound(interactionType, success);

    // Play animal sound if successful
    if (success) {
      setTimeout(() => {
        playAnimalSound(animalType);
      }, 300); // Slight delay for natural feel
    }

    // Play environmental sound for certain interactions
    if (success && position) {
      switch (interactionType) {
        case 'feed':
          playEnvironmentalSound('eating', position);
          break;
        case 'play':
          playEnvironmentalSound('playful', position);
          break;
        case 'pet':
          playEnvironmentalSound('content', position);
          break;
      }
    }
  }, [playInteractionSound, playAnimalSound, playEnvironmentalSound]);

  return {
    handleInteractionResult
  };
}

// Hook for dynamic audio based on game state
export function useGameAudio(gameState: {
  playerPosition: { x: number; y: number };
  currentMap?: string;
  nearbyAnimals?: string[];
  weather?: string;
  timeOfDay?: number;
  isPlaying?: boolean;
}) {
  const { setMapType, setPlayerPosition, setNearbyAnimals, setWeather, setTimeOfDay } = useAmbientAudio();

  // Update ambient audio based on game state changes
  useEffect(() => {
    if (gameState.currentMap) {
      setMapType(gameState.currentMap);
    }
  }, [gameState.currentMap, setMapType]);

  useEffect(() => {
    setPlayerPosition(gameState.playerPosition);
  }, [gameState.playerPosition, setPlayerPosition]);

  useEffect(() => {
    if (gameState.nearbyAnimals) {
      setNearbyAnimals(gameState.nearbyAnimals);
    }
  }, [gameState.nearbyAnimals, setNearbyAnimals]);

  useEffect(() => {
    if (gameState.weather) {
      setWeather(gameState.weather as any);
    }
  }, [gameState.weather, setWeather]);

  useEffect(() => {
    if (gameState.timeOfDay !== undefined) {
      setTimeOfDay(gameState.timeOfDay);
    }
  }, [gameState.timeOfDay, setTimeOfDay]);

  // Pause/resume audio based on game state
  useEffect(() => {
    const audioManager = getAudioManager();
    const ambientAudio = getAmbientAudio();

    if (gameState.isPlaying === false) {
      audioManager.updateConfig({ muted: true });
      ambientAudio.stop();
    } else if (gameState.isPlaying === true) {
      audioManager.updateConfig({ muted: false });
      ambientAudio.start();
    }
  }, [gameState.isPlaying]);
}

// Hook for accessibility audio cues
export function useAccessibilityAudio() {
  const { playSound } = useSound();

  const playNavigationCue = useCallback(() => {
    playSound('navigation_cue', { volume: 0.3 });
  }, [playSound]);

  const playFocusCue = useCallback(() => {
    playSound('focus_cue', { volume: 0.2 });
  }, [playSound]);

  const playErrorCue = useCallback(() => {
    playSound('error_cue', { volume: 0.4 });
  }, [playSound]);

  const playSuccessCue = useCallback(() => {
    playSound('success_cue', { volume: 0.4 });
  }, [playSound]);

  return {
    playNavigationCue,
    playFocusCue,
    playErrorCue,
    playSuccessCue
  };
}