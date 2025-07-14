// Utility Functions Barrel Exports

// Mathematical utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// Grid utilities
export const gridToScreen = (gridX: number, gridY: number, tileSize: number) => ({
  x: gridX * tileSize,
  y: gridY * tileSize
});

export const screenToGrid = (screenX: number, screenY: number, tileSize: number) => ({
  x: Math.floor(screenX / tileSize),
  y: Math.floor(screenY / tileSize)
});

// Distance calculation
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

// Random utilities
export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomChoice = <T>(array: T[]): T => {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  return array[Math.floor(Math.random() * array.length)]!;
};

// Storage utilities
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};