import { useSpring, useTransition, config } from '@react-spring/web';
import { useMemo } from 'react';

// Common animation configurations optimized for mobile
export const ANIMATION_CONFIGS = {
  // Fast and responsive for UI interactions
  ui: {
    tension: 300,
    friction: 30,
    clamp: true
  },
  
  // Smooth movement for game entities
  movement: {
    tension: 200,
    friction: 25,
    clamp: false
  },
  
  // Gentle animations for ambient effects
  ambient: {
    tension: 120,
    friction: 20,
    clamp: false
  },
  
  // Quick feedback animations
  feedback: {
    tension: 400,
    friction: 35,
    clamp: true
  }
} as const;

// Hook for slide-in animations (modals, panels, etc.)
export function useSlideIn(isVisible: boolean, direction: 'up' | 'down' | 'left' | 'right' = 'up') {
  const getTransform = (visible: boolean) => {
    if (visible) return 'translate3d(0, 0, 0)';
    
    switch (direction) {
      case 'up':
        return 'translate3d(0, 100%, 0)';
      case 'down':
        return 'translate3d(0, -100%, 0)';
      case 'left':
        return 'translate3d(100%, 0, 0)';
      case 'right':
        return 'translate3d(-100%, 0, 0)';
      default:
        return 'translate3d(0, 100%, 0)';
    }
  };

  return useSpring({
    transform: getTransform(isVisible),
    opacity: isVisible ? 1 : 0,
    config: ANIMATION_CONFIGS.ui
  });
}

// Hook for fade animations
export function useFadeIn(isVisible: boolean, delay = 0) {
  return useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
    config: ANIMATION_CONFIGS.ui,
    delay
  });
}

// Hook for bounce animations (buttons, interactions)
export function useBounce(trigger: boolean, scale = 1.1) {
  return useSpring({
    transform: trigger ? `scale(${scale})` : 'scale(1)',
    config: ANIMATION_CONFIGS.feedback
  });
}

// Hook for position-based movement animations
export function useMovement(position: { x: number; y: number }, immediate = false) {
  return useSpring({
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    config: immediate ? { duration: 0 } : ANIMATION_CONFIGS.movement,
    immediate
  });
}

// Hook for smooth value transitions (health bars, counters, etc.)
export function useValueTransition(value: number, format?: (value: number) => string) {
  const spring = useSpring({
    value,
    config: ANIMATION_CONFIGS.ui
  });

  return useMemo(() => {
    if (format) {
      return spring.value.to(format);
    }
    return spring.value;
  }, [spring.value, format]);
}

// Hook for list animations (adding/removing items)
export function useListTransition<T>(items: T[], keys?: (item: T) => string | number) {
  return useTransition(items, {
    from: { opacity: 0, transform: 'scale(0.8) translate3d(0, -20px, 0)' },
    enter: { opacity: 1, transform: 'scale(1) translate3d(0, 0, 0)' },
    leave: { opacity: 0, transform: 'scale(0.8) translate3d(0, -20px, 0)' },
    config: ANIMATION_CONFIGS.ui,
    keys: keys || ((item: T, index: number) => index)
  });
}

// Hook for pulsing animations (notifications, attention-grabbers)
export function usePulse(active: boolean, intensity = 0.1) {
  return useSpring({
    transform: active ? `scale(${1 + intensity})` : 'scale(1)',
    config: {
      tension: 300,
      friction: 10
    },
    loop: active
  });
}

// Hook for floating animations (ambient movement)
export function useFloat(active: boolean, amplitude = 5, duration = 2000) {
  return useSpring({
    from: { transform: 'translate3d(0, 0, 0)' },
    to: active ? [
      { transform: `translate3d(0, -${amplitude}px, 0)` },
      { transform: 'translate3d(0, 0, 0)' }
    ] : { transform: 'translate3d(0, 0, 0)' },
    config: ANIMATION_CONFIGS.ambient,
    loop: active,
    duration: active ? duration : 0
  });
}

// Hook for shake animations (errors, warnings)
export function useShake(trigger: boolean) {
  return useSpring({
    transform: trigger ? 'translate3d(-2px, 0, 0)' : 'translate3d(0, 0, 0)',
    config: {
      tension: 500,
      friction: 10
    },
    onRest: () => {
      if (trigger) {
        // Continue shaking effect
        setTimeout(() => {
          // Reset would happen automatically due to trigger changing
        }, 50);
      }
    }
  });
}

// Hook for rotation animations
export function useRotation(degrees: number, immediate = false) {
  return useSpring({
    transform: `rotate(${degrees}deg)`,
    config: immediate ? { duration: 0 } : ANIMATION_CONFIGS.movement,
    immediate
  });
}

// Hook for staggered animations (sequential reveals)
export function useStagger<T>(items: T[], delay = 100) {
  return useTransition(items, {
    from: { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
    enter: (item, index) => async (next) => {
      await new Promise(resolve => setTimeout(resolve, index * delay));
      await next({ opacity: 1, transform: 'translate3d(0, 0, 0)' });
    },
    leave: { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
    config: ANIMATION_CONFIGS.ui
  });
}

// Hook for progress bar animations
export function useProgress(progress: number, immediate = false) {
  return useSpring({
    width: `${Math.max(0, Math.min(100, progress))}%`,
    config: immediate ? { duration: 0 } : ANIMATION_CONFIGS.ui,
    immediate
  });
}

// Utility function to create custom easing
export function createEasing(name: keyof typeof config) {
  return config[name];
}

// Performance-optimized animation hook for mobile
export function useMobileOptimizedAnimation(
  values: Record<string, any>,
  deps: any[] = [],
  immediate = false
) {
  return useSpring({
    ...values,
    config: {
      ...ANIMATION_CONFIGS.ui,
      // Reduce precision on mobile for better performance
      precision: 0.01
    },
    immediate
  });
}