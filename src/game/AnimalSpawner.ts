// Animal Spawner System
// Handles spawning animals in appropriate locations with proper timing and limits

import { Position } from '../types/game';
import { 
  Animal, 
  AnimalSpecies, 
  createAnimal, 
  isPositionSuitableForSpecies,
  getAnimalsInRadius,
  getAnimalsBySpecies,
  ANIMAL_TEMPLATES
} from './Animal';

export interface SpawnPoint {
  id: string;
  position: Position;
  radius: number;
  biome: string;
  preferredSpecies: AnimalSpecies[];
  maxAnimals: number;
  spawnCooldown: number; // milliseconds between spawns
  lastSpawn: number;
  active: boolean;
}

export interface SpawnRule {
  species: AnimalSpecies;
  biomes: string[];
  timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk' | 'any';
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'any';
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'any';
  minDistance: number; // Minimum distance from player
  maxDistance: number; // Maximum distance from player
  probability: number; // 0-1 chance of spawning when conditions are met
  maxPerMap: number; // Maximum of this species on the entire map
  socialSpawning?: {
    enabled: boolean;
    groupSize: number; // How many to spawn together
    groupRadius: number; // How close together
  };
}

export interface SpawnerConfig {
  enabled: boolean;
  globalSpawnRate: number; // Base spawn rate multiplier
  maxTotalAnimals: number; // Maximum animals on map at once
  despawnDistance: number; // Distance from player before despawning
  despawnTime: number; // Time before inactive animals despawn
  playerProximityCheck: boolean; // Whether to check player distance
}

export class AnimalSpawner {
  private spawnPoints: Map<string, SpawnPoint> = new Map();
  private spawnRules: Map<AnimalSpecies, SpawnRule> = new Map();
  private config: SpawnerConfig;
  private activeAnimals: Map<string, Animal> = new Map();
  private lastCleanup: number = 0;
  private spawnerCallbacks: {
    onAnimalSpawned?: (animal: Animal) => void;
    onAnimalDespawned?: (animalId: string) => void;
    onSpawnAttempt?: (species: AnimalSpecies, position: Position, success: boolean) => void;
  } = {};

  constructor(config: Partial<SpawnerConfig> = {}) {
    this.config = {
      enabled: true,
      globalSpawnRate: 1.0,
      maxTotalAnimals: 20,
      despawnDistance: 15,
      despawnTime: 300000, // 5 minutes
      playerProximityCheck: true,
      ...config
    };

    this.initializeSpawnRules();
  }

  /**
   * Set callbacks for spawner events
   */
  setCallbacks(callbacks: typeof this.spawnerCallbacks) {
    this.spawnerCallbacks = { ...this.spawnerCallbacks, ...callbacks };
  }

  /**
   * Add a spawn point to the spawner
   */
  addSpawnPoint(spawnPoint: SpawnPoint): void {
    this.spawnPoints.set(spawnPoint.id, spawnPoint);
  }

  /**
   * Remove a spawn point
   */
  removeSpawnPoint(spawnPointId: string): void {
    this.spawnPoints.delete(spawnPointId);
  }

  /**
   * Update spawner system - call this regularly from game loop
   */
  update(playerPosition: Position, currentTime: number): Animal[] {
    if (!this.config.enabled) return [];

    const spawnedAnimals: Animal[] = [];

    // Clean up old/distant animals periodically
    if (currentTime - this.lastCleanup > 10000) { // Every 10 seconds
      this.cleanup(playerPosition, currentTime);
      this.lastCleanup = currentTime;
    }

    // Check each spawn point for spawning opportunities
    for (const spawnPoint of this.spawnPoints.values()) {
      if (!spawnPoint.active) continue;

      const newAnimals = this.updateSpawnPoint(spawnPoint, playerPosition, currentTime);
      spawnedAnimals.push(...newAnimals);
    }

    return spawnedAnimals;
  }

  /**
   * Get all currently active animals
   */
  getActiveAnimals(): Animal[] {
    return Array.from(this.activeAnimals.values()).filter(animal => animal.isActive);
  }

  /**
   * Get animals by species
   */
  getAnimalsBySpecies(species: AnimalSpecies): Animal[] {
    return this.getActiveAnimals().filter(animal => animal.species === species);
  }

  /**
   * Add an existing animal to the spawner's tracking
   */
  addAnimal(animal: Animal): void {
    this.activeAnimals.set(animal.id, animal);
  }

  /**
   * Remove an animal from tracking
   */
  removeAnimal(animalId: string): void {
    const animal = this.activeAnimals.get(animalId);
    if (animal) {
      animal.isActive = false;
      this.activeAnimals.delete(animalId);
      this.spawnerCallbacks.onAnimalDespawned?.(animalId);
    }
  }

  /**
   * Force spawn an animal at a specific location
   */
  forceSpawn(species: AnimalSpecies, position: Position): Animal | null {
    if (this.activeAnimals.size >= this.config.maxTotalAnimals) {
      return null;
    }

    const animal = this.createAnimalAtPosition(species, position);
    if (animal) {
      this.activeAnimals.set(animal.id, animal);
      this.spawnerCallbacks.onAnimalSpawned?.(animal);
    }

    return animal;
  }

  /**
   * Create spawn points automatically based on map analysis
   */
  createSpawnPointsForMap(mapWidth: number, mapHeight: number, biome: string = 'temperate'): void {
    const gridSize = 8; // Create spawn points every 8 tiles
    let spawnId = 0;

    for (let x = gridSize; x < mapWidth; x += gridSize) {
      for (let y = gridSize; y < mapHeight; y += gridSize) {
        const spawnPoint: SpawnPoint = {
          id: `auto_spawn_${spawnId++}`,
          position: { x, y },
          radius: 4,
          biome,
          preferredSpecies: this.getSpeciesForBiome(biome),
          maxAnimals: 3,
          spawnCooldown: 30000, // 30 seconds
          lastSpawn: 0,
          active: true
        };

        this.addSpawnPoint(spawnPoint);
      }
    }
  }

  // Private methods

  private initializeSpawnRules(): void {
    // Define spawn rules for each species
    const rules: Array<[AnimalSpecies, SpawnRule]> = [
      ['rabbit', {
        species: 'rabbit',
        biomes: ['meadow', 'grassland', 'temperate'],
        timeOfDay: 'day',
        season: 'any',
        weather: 'any',
        minDistance: 5,
        maxDistance: 12,
        probability: 0.8,
        maxPerMap: 8,
        socialSpawning: {
          enabled: true,
          groupSize: 3,
          groupRadius: 2
        }
      }],
      
      ['bird', {
        species: 'bird',
        biomes: ['forest', 'meadow', 'temperate'],
        timeOfDay: 'dawn',
        season: 'any',
        weather: 'sunny',
        minDistance: 3,
        maxDistance: 15,
        probability: 0.7,
        maxPerMap: 6,
        socialSpawning: {
          enabled: true,
          groupSize: 2,
          groupRadius: 3
        }
      }],
      
      ['squirrel', {
        species: 'squirrel',
        biomes: ['forest', 'temperate'],
        timeOfDay: 'day',
        season: 'any',
        weather: 'any',
        minDistance: 4,
        maxDistance: 10,
        probability: 0.6,
        maxPerMap: 5,
        socialSpawning: {
          enabled: false,
          groupSize: 1,
          groupRadius: 0
        }
      }],
      
      ['butterfly', {
        species: 'butterfly',
        biomes: ['meadow', 'flower', 'temperate'],
        timeOfDay: 'day',
        season: 'spring',
        weather: 'sunny',
        minDistance: 2,
        maxDistance: 8,
        probability: 0.9,
        maxPerMap: 10,
        socialSpawning: {
          enabled: true,
          groupSize: 4,
          groupRadius: 1
        }
      }],
      
      ['frog', {
        species: 'frog',
        biomes: ['water', 'swamp', 'temperate'],
        timeOfDay: 'dusk',
        season: 'any',
        weather: 'rainy',
        minDistance: 3,
        maxDistance: 6,
        probability: 0.5,
        maxPerMap: 4,
        socialSpawning: {
          enabled: true,
          groupSize: 2,
          groupRadius: 1
        }
      }],
      
      ['fox', {
        species: 'fox',
        biomes: ['forest', 'temperate'],
        timeOfDay: 'dusk',
        season: 'any',
        weather: 'any',
        minDistance: 8,
        maxDistance: 15,
        probability: 0.3,
        maxPerMap: 2,
        socialSpawning: {
          enabled: false,
          groupSize: 1,
          groupRadius: 0
        }
      }],
      
      ['deer', {
        species: 'deer',
        biomes: ['forest', 'meadow', 'temperate'],
        timeOfDay: 'dawn',
        season: 'any',
        weather: 'any',
        minDistance: 10,
        maxDistance: 20,
        probability: 0.2,
        maxPerMap: 3,
        socialSpawning: {
          enabled: true,
          groupSize: 2,
          groupRadius: 3
        }
      }],
      
      ['turtle', {
        species: 'turtle',
        biomes: ['water', 'swamp', 'temperate'],
        timeOfDay: 'any',
        season: 'any',
        weather: 'any',
        minDistance: 5,
        maxDistance: 10,
        probability: 0.4,
        maxPerMap: 3,
        socialSpawning: {
          enabled: false,
          groupSize: 1,
          groupRadius: 0
        }
      }]
    ];

    rules.forEach(([species, rule]) => {
      this.spawnRules.set(species, rule);
    });
  }

  private updateSpawnPoint(
    spawnPoint: SpawnPoint, 
    playerPosition: Position, 
    currentTime: number
  ): Animal[] {
    const spawnedAnimals: Animal[] = [];

    // Check cooldown
    if (currentTime - spawnPoint.lastSpawn < spawnPoint.spawnCooldown) {
      return spawnedAnimals;
    }

    // Check if we've reached max animals for this spawn point
    const animalsNearSpawn = getAnimalsInRadius(
      this.getActiveAnimals(), 
      spawnPoint.position, 
      spawnPoint.radius
    );

    if (animalsNearSpawn.length >= spawnPoint.maxAnimals) {
      return spawnedAnimals;
    }

    // Check total animal limit
    if (this.activeAnimals.size >= this.config.maxTotalAnimals) {
      return spawnedAnimals;
    }

    // Try to spawn each preferred species
    for (const species of spawnPoint.preferredSpecies) {
      const rule = this.spawnRules.get(species);
      if (!rule) continue;

      // Check if we can spawn this species
      if (this.canSpawnSpecies(species, spawnPoint, playerPosition, currentTime)) {
        const spawnPosition = this.getSpawnPosition(spawnPoint, playerPosition);
        if (spawnPosition) {
          const newAnimals = this.spawnSpecies(species, spawnPosition, rule);
          spawnedAnimals.push(...newAnimals);
          
          if (newAnimals.length > 0) {
            spawnPoint.lastSpawn = currentTime;
            break; // Only spawn one species type per update
          }
        }
      }
    }

    return spawnedAnimals;
  }

  private canSpawnSpecies(
    species: AnimalSpecies, 
    spawnPoint: SpawnPoint, 
    playerPosition: Position, 
    currentTime: number
  ): boolean {
    const rule = this.spawnRules.get(species);
    if (!rule) return false;

    // Check max per map limit
    const existingCount = this.getAnimalsBySpecies(species).length;
    if (existingCount >= rule.maxPerMap) return false;

    // Check biome compatibility
    if (!rule.biomes.includes(spawnPoint.biome)) return false;

    // Check player distance
    const distanceToPlayer = Math.sqrt(
      Math.pow(spawnPoint.position.x - playerPosition.x, 2) + 
      Math.pow(spawnPoint.position.y - playerPosition.y, 2)
    );

    if (distanceToPlayer < rule.minDistance || distanceToPlayer > rule.maxDistance) {
      return false;
    }

    // Check probability
    if (Math.random() > rule.probability * this.config.globalSpawnRate) {
      return false;
    }

    return true;
  }

  private getSpawnPosition(spawnPoint: SpawnPoint, playerPosition: Position): Position | null {
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spawnPoint.radius;
      
      const position = {
        x: spawnPoint.position.x + Math.cos(angle) * distance,
        y: spawnPoint.position.y + Math.sin(angle) * distance
      };

      // Make sure position is not too close to player
      const distanceToPlayer = Math.sqrt(
        Math.pow(position.x - playerPosition.x, 2) + 
        Math.pow(position.y - playerPosition.y, 2)
      );

      if (distanceToPlayer >= 3) { // Minimum 3 tiles from player
        return position;
      }
    }

    return null; // Could not find suitable position
  }

  private spawnSpecies(species: AnimalSpecies, position: Position, rule: SpawnRule): Animal[] {
    const spawnedAnimals: Animal[] = [];
    
    // Determine group size
    const groupSize = rule.socialSpawning?.enabled ? 
      Math.floor(Math.random() * rule.socialSpawning.groupSize) + 1 : 1;

    for (let i = 0; i < groupSize; i++) {
      let spawnPosition = { ...position };
      
      // For group spawning, offset position slightly
      if (i > 0 && rule.socialSpawning?.enabled) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * rule.socialSpawning.groupRadius;
        spawnPosition.x += Math.cos(angle) * distance;
        spawnPosition.y += Math.sin(angle) * distance;
      }

      const animal = this.createAnimalAtPosition(species, spawnPosition);
      if (animal) {
        this.activeAnimals.set(animal.id, animal);
        spawnedAnimals.push(animal);
        
        this.spawnerCallbacks.onAnimalSpawned?.(animal);
        this.spawnerCallbacks.onSpawnAttempt?.(species, spawnPosition, true);
      } else {
        this.spawnerCallbacks.onSpawnAttempt?.(species, spawnPosition, false);
      }
    }

    return spawnedAnimals;
  }

  private createAnimalAtPosition(species: AnimalSpecies, position: Position): Animal | null {
    try {
      const animalId = `${species}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return createAnimal(animalId, species, position);
    } catch (error) {
      console.error(`Failed to create animal ${species} at position`, position, error);
      return null;
    }
  }

  private cleanup(playerPosition: Position, currentTime: number): void {
    const animalsToRemove: string[] = [];

    for (const [animalId, animal] of this.activeAnimals) {
      // Check distance from player
      const distanceToPlayer = Math.sqrt(
        Math.pow(animal.position.x - playerPosition.x, 2) + 
        Math.pow(animal.position.y - playerPosition.y, 2)
      );

      // Check if animal should be despawned
      const shouldDespawn = 
        !animal.isActive ||
        (this.config.playerProximityCheck && distanceToPlayer > this.config.despawnDistance) ||
        (currentTime - animal.lastUpdate > this.config.despawnTime);

      if (shouldDespawn) {
        animalsToRemove.push(animalId);
      }
    }

    // Remove despawned animals
    animalsToRemove.forEach(animalId => {
      this.removeAnimal(animalId);
    });
  }

  private getSpeciesForBiome(biome: string): AnimalSpecies[] {
    const species: AnimalSpecies[] = [];
    
    for (const [speciesName, rule] of this.spawnRules) {
      if (rule.biomes.includes(biome)) {
        species.push(speciesName);
      }
    }

    return species.length > 0 ? species : ['rabbit', 'bird', 'butterfly']; // Default species
  }
}

/**
 * Create a pre-configured animal spawner
 */
export function createAnimalSpawner(config: Partial<SpawnerConfig> = {}): AnimalSpawner {
  return new AnimalSpawner(config);
}

/**
 * Create spawn points for common biomes
 */
export function createBiomeSpawnPoints(biome: string, mapBounds: { width: number; height: number }): SpawnPoint[] {
  const spawnPoints: SpawnPoint[] = [];
  const { width, height } = mapBounds;

  // Create spawn points based on biome type
  switch (biome) {
    case 'meadow':
    case 'grassland':
      // Scattered spawn points for open areas
      for (let i = 0; i < 6; i++) {
        spawnPoints.push({
          id: `meadow_spawn_${i}`,
          position: {
            x: Math.random() * width,
            y: Math.random() * height
          },
          radius: 5,
          biome,
          preferredSpecies: ['rabbit', 'butterfly', 'bird'],
          maxAnimals: 4,
          spawnCooldown: 20000,
          lastSpawn: 0,
          active: true
        });
      }
      break;

    case 'forest':
      // Clustered spawn points for forest areas
      for (let i = 0; i < 4; i++) {
        spawnPoints.push({
          id: `forest_spawn_${i}`,
          position: {
            x: Math.random() * width,
            y: Math.random() * height
          },
          radius: 6,
          biome,
          preferredSpecies: ['squirrel', 'bird', 'fox', 'deer'],
          maxAnimals: 3,
          spawnCooldown: 30000,
          lastSpawn: 0,
          active: true
        });
      }
      break;

    case 'water':
    case 'swamp':
      // Water-specific spawn points
      for (let i = 0; i < 3; i++) {
        spawnPoints.push({
          id: `water_spawn_${i}`,
          position: {
            x: Math.random() * width,
            y: Math.random() * height
          },
          radius: 3,
          biome,
          preferredSpecies: ['frog', 'turtle'],
          maxAnimals: 2,
          spawnCooldown: 45000,
          lastSpawn: 0,
          active: true
        });
      }
      break;

    default:
      // Default temperate spawn points
      for (let i = 0; i < 5; i++) {
        spawnPoints.push({
          id: `default_spawn_${i}`,
          position: {
            x: Math.random() * width,
            y: Math.random() * height
          },
          radius: 4,
          biome: 'temperate',
          preferredSpecies: ['rabbit', 'bird', 'squirrel'],
          maxAnimals: 3,
          spawnCooldown: 25000,
          lastSpawn: 0,
          active: true
        });
      }
  }

  return spawnPoints;
}

export default AnimalSpawner;