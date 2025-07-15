import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['zustand'],
          
          // Game system chunks
          'game-core': [
            './src/game/GameLoop.ts',
            './src/game/Player.ts',
            './src/game/InputManager.ts',
            './src/stores/gameStore.ts'
          ],
          'game-animals': [
            './src/game/Animal.ts',
            './src/game/AnimalAI.ts',
            './src/game/AnimalBehaviorSystem.ts',
            './src/game/AnimalSpawner.ts',
            './src/game/TamingSystem.ts',
            './src/game/BondingSystem.ts'
          ],
          'game-systems': [
            './src/game/ItemSystem.ts',
            './src/game/InventorySystem.ts',
            './src/game/GatheringSystem.ts',
            './src/game/TrickSystem.ts',
            './src/game/AchievementSystem.ts'
          ],
          'game-world': [
            './src/game/Map.ts',
            './src/game/MapManager.ts',
            './src/game/MapRenderer.ts',
            './src/game/EnvironmentRenderer.ts',
            './src/game/HabitatSystem.ts'
          ],
          'game-audio': [
            './src/services/AudioManager.ts',
            './src/services/ComprehensiveAudioSystem.ts',
            './src/game/AmbientAudio.ts'
          ],
          'game-save': [
            './src/services/SaveSystem.ts',
            './src/services/SaveManager.ts',
            './src/services/AutoSave.ts',
            './src/services/CloudSave.ts',
            './src/services/OfflineStorage.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
