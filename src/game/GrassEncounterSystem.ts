import { Position } from '../types/game';
import { GameMap } from './Map';
import { Animal, createAnimal, ANIMAL_TEMPLATES, AnimalSpecies } from './Animal';
import { EncounterAnimal, EncounterAnimalManager } from './EncounterAnimal';
import HabitatSystem from './HabitatSystem';

export interface EncounterConfig {
  encounterChance: number;
  minStepsInGrass: number;
  cooldownTime: number;
  maxEncountersPerArea: number;
}

export class GrassEncounterSystem {
  private map: GameMap;
  private habitatSystem: typeof HabitatSystem;
  private config: EncounterConfig;
  private lastEncounterTime: number;
  private stepsInGrass: number;
  private encounterCooldowns: Map<string, number>;
  private recentEncounterPositions: Position[];

  constructor(
    map: GameMap,
    habitatSystem: typeof HabitatSystem,
    config: Partial<EncounterConfig> = {}
  ) {
    this.map = map;
    this.habitatSystem = habitatSystem;
    this.config = {
      encounterChance: 0.15, // 15% chance per step in tall grass
      minStepsInGrass: 2, // Must walk 2 steps in grass before encounters possible
      cooldownTime: 30000, // 30 seconds between encounters
      maxEncountersPerArea: 1, // Max 1 encounter per 5x5 area
      ...config
    };
    this.lastEncounterTime = 0;
    this.stepsInGrass = 0;
    this.encounterCooldowns = new Map<string, number>();
    this.recentEncounterPositions = [];
  }

  /**
   * Check if player step should trigger an encounter
   */
  public checkForEncounter(playerPosition: Position, previousPosition: Position): EncounterAnimal | null {
    const currentTime = Date.now();
    
    // Check if we're on cooldown
    if (currentTime - this.lastEncounterTime < this.config.cooldownTime) {
      return null;
    }

    // Get current terrain
    const currentTerrain = this.map.getTerrainAt(playerPosition.x, playerPosition.y);
    const previousTerrain = this.map.getTerrainAt(previousPosition.x, previousPosition.y);

    // Count steps in grass
    if (this.isGrassTerrain(currentTerrain)) {
      this.stepsInGrass++;
    } else {
      this.stepsInGrass = 0;
    }

    // Check if we should attempt an encounter
    if (!this.shouldAttemptEncounter(playerPosition, currentTerrain)) {
      return null;
    }

    // Check area encounter limits
    if (this.hasRecentEncounterNearby(playerPosition)) {
      return null;
    }

    // Roll for encounter
    if (Math.random() > this.config.encounterChance) {
      return null;
    }

    // Generate encounter
    const animal = this.generateEncounterAnimal(playerPosition);
    if (animal) {
      this.lastEncounterTime = currentTime;
      this.stepsInGrass = 0;
      this.recordEncounter(playerPosition);
    }

    return animal;
  }

  /**
   * Check if terrain type is considered grass for encounters
   */
  private isGrassTerrain(terrain: string | null): boolean {
    return terrain === 'grass' || terrain === 'flower' || terrain === 'meadow';
  }

  /**
   * Check if we should attempt an encounter at this position
   */
  private shouldAttemptEncounter(position: Position, terrain: string | null): boolean {
    // Must be in grass terrain
    if (!this.isGrassTerrain(terrain)) {
      return false;
    }

    // Must have walked enough steps in grass
    if (this.stepsInGrass < this.config.minStepsInGrass) {
      return false;
    }

    // For now, all grass terrain allows encounters
    // TODO: Implement proper biome checking when regions support biomes

    return true;
  }

  /**
   * Check if there's been a recent encounter nearby
   */
  private hasRecentEncounterNearby(position: Position): boolean {
    const encounterRadius = 5; // 5x5 area
    
    return this.recentEncounterPositions.some(encounterPos => {
      const distance = Math.abs(encounterPos.x - position.x) + Math.abs(encounterPos.y - position.y);
      return distance < encounterRadius;
    });
  }

  /**
   * Generate an encounter animal based on location
   */
  private generateEncounterAnimal(position: Position): EncounterAnimal | null {
    try {
      // Default to temperate biome for now
      // TODO: Get biome from region when supported
      const biome = 'temperate';
      
      // Get suitable species for this biome
      const suitableSpecies = this.getSuitableSpeciesForBiome(biome);
      if (suitableSpecies.length === 0) {
        return null;
      }

      // Choose random species
      const species = suitableSpecies[Math.floor(Math.random() * suitableSpecies.length)] as AnimalSpecies;
      
      // Create base animal
      const baseAnimal = createAnimal(`encounter_${species}_${Date.now()}`, species, position);
      
      // Convert to encounter animal with fear/affection system
      const encounterAnimal = EncounterAnimalManager.createEncounterAnimal(baseAnimal, position);
      
      return encounterAnimal;
      
    } catch (error) {
      console.error('Failed to generate encounter animal:', error);
      return null;
    }
  }

  /**
   * Get animal species suitable for the given biome
   */
  private getSuitableSpeciesForBiome(biome: string): string[] {
    const biomeSpecies: Record<string, string[]> = {
      temperate: ['rabbit', 'squirrel', 'bird', 'mouse', 'fox'],
      forest: ['deer', 'owl', 'raccoon', 'squirrel', 'hedgehog'],
      meadow: ['rabbit', 'butterfly', 'bird', 'mouse'],
      water: ['frog', 'turtle', 'otter', 'bird'],
      grassland: ['rabbit', 'deer', 'bird', 'mouse'],
      swamp: ['frog', 'turtle', 'bird'],
      mountain: ['hawk', 'owl', 'bear'],
      desert: ['mouse', 'bird'],
      cave: ['bat', 'bear'],
      flower: ['butterfly', 'bird', 'rabbit'],
      arctic: ['bear', 'owl'],
      volcanic: ['bird']
    };

    // Default to common small animals if biome not found
    return biomeSpecies[biome] || ['rabbit', 'bird', 'mouse', 'squirrel'];
  }

  /**
   * Record an encounter at the given position
   */
  private recordEncounter(position: Position): void {
    this.recentEncounterPositions.push({ ...position });
    
    // Clean up old encounter positions (keep last 10)
    if (this.recentEncounterPositions.length > 10) {
      this.recentEncounterPositions.shift();
    }
  }

  /**
   * Clear encounter cooldowns and reset state
   */
  public reset(): void {
    this.lastEncounterTime = 0;
    this.stepsInGrass = 0;
    this.encounterCooldowns.clear();
    this.recentEncounterPositions = [];
  }

  /**
   * Update system (call periodically to clean up old data)
   */
  public update(): void {
    const currentTime = Date.now();
    
    // Clean up old encounter cooldowns
    for (const [key, time] of this.encounterCooldowns.entries()) {
      if (currentTime - time > this.config.cooldownTime * 2) {
        this.encounterCooldowns.delete(key);
      }
    }

    // Clean up old encounter positions after 5 minutes
    this.recentEncounterPositions = this.recentEncounterPositions.filter(pos => {
      const positionKey = `${pos.x},${pos.y}`;
      const encounterTime = this.encounterCooldowns.get(positionKey);
      return !encounterTime || (currentTime - encounterTime < 300000); // 5 minutes
    });
  }

  /**
   * Get current encounter statistics
   */
  public getStats(): {
    stepsInGrass: number;
    timeSinceLastEncounter: number;
    encountersInCooldown: number;
    isOnCooldown: boolean;
  } {
    const currentTime = Date.now();
    return {
      stepsInGrass: this.stepsInGrass,
      timeSinceLastEncounter: currentTime - this.lastEncounterTime,
      encountersInCooldown: this.encounterCooldowns.size,
      isOnCooldown: (currentTime - this.lastEncounterTime) < this.config.cooldownTime
    };
  }
}