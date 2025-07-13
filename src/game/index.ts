// Game Module Barrel Exports
export { GameLoop, createGameLoop } from './GameLoop';
export type { GameLoopConfig, GameLoopCallbacks, PerformanceMetrics } from './GameLoop';

export { Player, createPlayer } from './Player';
export type { PlayerConfig, PlayerSprite, PlayerMovement, PlayerState } from './Player';

export { InputManager, createInputManager } from './InputManager';
export type { InputAction, InputEvent, InputState, TouchState, InputConfig } from './InputManager';

export { Renderer, createRenderer } from './Renderer';
export type { RendererConfig, Camera, RenderContext, Layer } from './Renderer';

export { Grid, createGrid } from './Grid';
export type { TileType, Tile, GridConfig, GridBounds, TileVisualInfo } from './Grid';

export { CollisionSystem, createCollisionSystem, createEntity } from './Collision';
export type { CollisionConfig, CollisionResult, CollidableEntity, CollisionLayer } from './Collision';

export { GameMap, createMapMetadata, createMapObject, createTransition } from './Map';
export type { TerrainType, MapTile, MapObject, AnimalSpawner, MapTransition, MapBounds, MapMetadata, MapData, MapRegion } from './Map';

export { MapRenderer, createMapRenderer } from './MapRenderer';
export type { MapRenderConfig, RenderLayer, WeatherEffect, WeatherParticle } from './MapRenderer';

export { MapManager, createMapManager } from './MapManager';
export type { MapManagerConfig, LoadedMap, MapTransitionContext, TransitionEffect, MapLoadingState } from './MapManager';