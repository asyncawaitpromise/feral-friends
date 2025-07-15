// Map Data Index
// Centralized access to all map definitions and utilities

import { MapData } from '../../game/Map';

// Import map data
import starterMeadowData from './starter_meadow.json';
import forestAreaData from './forest_area.json';
import streamAreaData from './stream_area.json';
import rockyHillsData from './rocky_hills.json';
import caveEntranceData from './cave_entrance.json';

// Map registry
export const MAP_REGISTRY: Record<string, MapData> = {
  starter_meadow: starterMeadowData as unknown as MapData,
  forest_area: forestAreaData as unknown as MapData,
  stream_area: streamAreaData as unknown as MapData,
  rocky_hills: rockyHillsData as unknown as MapData,
  cave_entrance: caveEntranceData as unknown as MapData,
};

// Map metadata for quick reference
export const MAP_INFO = {
  starter_meadow: {
    id: 'starter_meadow',
    name: 'Peaceful Meadow',
    difficulty: 'easy',
    recommendedLevel: 1,
    description: 'A gentle grassy meadow perfect for beginning explorers.',
  },
  forest_area: {
    id: 'forest_area',
    name: 'Whispering Woods',
    difficulty: 'normal',
    recommendedLevel: 3,
    description: 'A dense forest filled with towering trees and hidden paths.',
  },
  stream_area: {
    id: 'stream_area',
    name: 'Babbling Brook',
    difficulty: 'easy',
    recommendedLevel: 2,
    description: 'A winding stream flows through this area, attracting water-loving animals.',
  },
  rocky_hills: {
    id: 'rocky_hills',
    name: 'Windswept Peaks',
    difficulty: 'hard',
    recommendedLevel: 5,
    description: 'Rugged hills covered with stones and sparse vegetation.',
  },
  cave_entrance: {
    id: 'cave_entrance',
    name: 'Mysterious Cavern',
    difficulty: 'normal',
    recommendedLevel: 4,
    description: 'The mouth of a dark cave system with unusual animals.',
  },
} as const;

// Starting map configuration
export const DEFAULT_MAP_ID = 'starter_meadow';

// Map progression paths
export const MAP_PROGRESSION = {
  beginner: ['starter_meadow', 'stream_area'],
  intermediate: ['forest_area', 'cave_entrance'],
  advanced: ['rocky_hills'],
} as const;

// Utility functions
export function getMapData(mapId: string): MapData | null {
  return MAP_REGISTRY[mapId] || null;
}

export function getAllMapIds(): string[] {
  return Object.keys(MAP_REGISTRY);
}

export function getMapsByDifficulty(difficulty: 'easy' | 'normal' | 'hard'): string[] {
  return Object.entries(MAP_INFO)
    .filter(([_, info]) => info.difficulty === difficulty)
    .map(([id]) => id);
}

export function getMapsByLevel(minLevel: number, maxLevel: number = Infinity): string[] {
  return Object.entries(MAP_INFO)
    .filter(([_, info]) => info.recommendedLevel >= minLevel && info.recommendedLevel <= maxLevel)
    .map(([id]) => id);
}

export function validateMapConnections(): boolean {
  // Check that all map transitions point to valid maps
  let isValid = true;
  
  Object.entries(MAP_REGISTRY).forEach(([mapId, mapData]) => {
    mapData.transitions.forEach(transition => {
      if (!MAP_REGISTRY[transition.toMapId]) {
        console.error(`Map ${mapId} has invalid transition to ${transition.toMapId}`);
        isValid = false;
      }
    });
  });
  
  return isValid;
}

// Map loading functions for async use
export async function loadMapData(mapId: string): Promise<MapData> {
  const mapData = getMapData(mapId);
  if (!mapData) {
    throw new Error(`Map not found: ${mapId}`);
  }
  
  // Simulate async loading delay for larger maps
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mapData;
}

export async function preloadAllMaps(): Promise<void> {
  console.log('Preloading all map data...');
  
  const loadPromises = getAllMapIds().map(mapId => loadMapData(mapId));
  await Promise.all(loadPromises);
  
  console.log(`Preloaded ${loadPromises.length} maps successfully`);
}

// Development utilities
export function getMapStats() {
  const stats = {
    totalMaps: Object.keys(MAP_REGISTRY).length,
    totalTransitions: 0,
    totalObjects: 0,
    totalSpawners: 0,
    mapsByDifficulty: {
      easy: getMapsByDifficulty('easy').length,
      normal: getMapsByDifficulty('normal').length,
      hard: getMapsByDifficulty('hard').length,
    },
  };
  
  Object.values(MAP_REGISTRY).forEach(mapData => {
    stats.totalTransitions += mapData.transitions.length;
    stats.totalObjects += mapData.objects.length;
    stats.totalSpawners += mapData.spawners.length;
  });
  
  return stats;
}

// Export individual map data for direct access
export {
  starterMeadowData,
  forestAreaData,
  streamAreaData,
  rockyHillsData,
  caveEntranceData,
};