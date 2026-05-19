import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const memoryStorage = new Map()

function safeLocalStorage() {
  try {
    const storage = window.localStorage
    const testKey = '__dn-storage-test__'
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch {
    return {
      getItem: (name) => memoryStorage.get(name) ?? null,
      setItem: (name, value) => memoryStorage.set(name, value),
      removeItem: (name) => memoryStorage.delete(name),
    }
  }
}

export const useGameStore = create(
  persist(
    (set) => ({
      // Navigation
      screen: 'home', // home | game | training | online | subscription | settings
      setScreen: (screen) => set({ screen }),

      // Settings
      theme: 'deathnote',
      setTheme: (theme) => set({ theme }),
      boardFlipped: false,
      toggleFlip: () => set((s) => ({ boardFlipped: !s.boardFlipped })),
      grokApiKey: '',
      setGrokApiKey: (k) => set({ grokApiKey: k }),

      // Game config
      difficulty: 'medium',
      setDifficulty: (difficulty) => set({ difficulty }),
      timeControl: '10+0',
      setTimeControl: (tc) => set({ timeControl: tc }),
      gameMode: 'ai', // ai | friend | online
      setGameMode: (gameMode) => set({ gameMode }),

      // Subscription
      plan: 'free', // free | pro | elite
      setPlan: (plan) => set({ plan }),

      // Stats
      stats: { wins: 0, losses: 0, draws: 0, rating: 1200 },
      addWin: () => set((s) => ({ stats: { ...s.stats, wins: s.stats.wins + 1, rating: s.stats.rating + 12 } })),
      addLoss: () => set((s) => ({ stats: { ...s.stats, losses: s.stats.losses + 1, rating: Math.max(100, s.stats.rating - 10) } })),
      addDraw: () => set((s) => ({ stats: { ...s.stats, draws: s.stats.draws + 1, rating: s.stats.rating + 2 } })),

      // Training progress
      trainingProgress: {},
      completeTrainingLevel: (id) => set((s) => ({
        trainingProgress: { ...s.trainingProgress, [id]: true }
      })),

      // Online
      onlineRoomCode: null,
      setOnlineRoomCode: (code) => set({ onlineRoomCode: code }),
      onlinePlayerColor: 'w',
      setOnlinePlayerColor: (c) => set({ onlinePlayerColor: c }),
    }),
    {
      name: 'dn-chess-store',
      storage: createJSONStorage(safeLocalStorage),
      partialize: (state) => ({
        theme: state.theme,
        difficulty: state.difficulty,
        plan: state.plan,
        stats: state.stats,
        trainingProgress: state.trainingProgress,
        grokApiKey: state.grokApiKey,
      }),
    }
  )
)
