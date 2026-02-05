// Game store for real-time state management

import { create } from 'zustand';
import type { Game, GameEvent } from '@/types';

interface GameTimerState {
  elapsedSeconds: number;
  isRunning: boolean;
  stoppageSeconds: number;
  isStoppage: boolean;
}

interface GameState {
  // Current game
  currentGame: Game | null;
  gameEvents: GameEvent[];

  // Timer state
  timer: GameTimerState;

  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastUpdate: Date | null;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

interface GameActions {
  // Game actions
  setGame: (game: Game | null) => void;
  updateGame: (updates: Partial<Game>) => void;
  clearGame: () => void;

  // Event actions
  addEvent: (event: GameEvent) => void;
  setEvents: (events: GameEvent[]) => void;
  clearEvents: () => void;

  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setElapsedTime: (seconds: number) => void;
  incrementTimer: () => void;
  startStoppage: () => void;
  endStoppage: () => void;
  addStoppageTime: (seconds: number) => void;

  // Connection actions
  setConnectionStatus: (status: GameState['connectionStatus']) => void;
  setConnected: (connected: boolean) => void;
  setLastUpdate: (date: Date) => void;

  // Loading actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Score actions
  recordGoal: (teamId: string, isHome: boolean) => void;
}

type GameStore = GameState & GameActions;

const initialTimerState: GameTimerState = {
  elapsedSeconds: 0,
  isRunning: false,
  stoppageSeconds: 0,
  isStoppage: false,
};

const initialState: GameState = {
  currentGame: null,
  gameEvents: [],
  timer: initialTimerState,
  isConnected: false,
  connectionStatus: 'disconnected',
  lastUpdate: null,
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // Game actions
  setGame: (game) => {
    set({ currentGame: game });

    // Initialize timer from game data if available
    if (game?.actualStartTime && game.status === 'in_progress') {
      const startTime = new Date(game.actualStartTime).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      set({
        timer: {
          ...get().timer,
          elapsedSeconds,
          isRunning: true,
          stoppageSeconds: game.stoppageTimeSeconds || 0,
        },
      });
    }
  },

  updateGame: (updates) => {
    const { currentGame } = get();
    if (currentGame) {
      set({ currentGame: { ...currentGame, ...updates } });
    }
  },

  clearGame: () => {
    set({
      currentGame: null,
      gameEvents: [],
      timer: initialTimerState,
    });
  },

  // Event actions
  addEvent: (event) => {
    set((state) => ({
      gameEvents: [...state.gameEvents, event],
    }));
  },

  setEvents: (events) => {
    set({ gameEvents: events });
  },

  clearEvents: () => {
    set({ gameEvents: [] });
  },

  // Timer actions
  startTimer: () => {
    set((state) => ({
      timer: { ...state.timer, isRunning: true },
    }));
  },

  pauseTimer: () => {
    set((state) => ({
      timer: { ...state.timer, isRunning: false },
    }));
  },

  resetTimer: () => {
    set({ timer: initialTimerState });
  },

  setElapsedTime: (seconds) => {
    set((state) => ({
      timer: { ...state.timer, elapsedSeconds: seconds },
    }));
  },

  incrementTimer: () => {
    const { timer } = get();
    if (timer.isRunning && !timer.isStoppage) {
      set({
        timer: { ...timer, elapsedSeconds: timer.elapsedSeconds + 1 },
      });
    }
  },

  startStoppage: () => {
    set((state) => ({
      timer: { ...state.timer, isStoppage: true },
    }));
  },

  endStoppage: () => {
    set((state) => ({
      timer: { ...state.timer, isStoppage: false },
    }));
  },

  addStoppageTime: (seconds) => {
    set((state) => ({
      timer: {
        ...state.timer,
        stoppageSeconds: state.timer.stoppageSeconds + seconds,
      },
    }));
  },

  // Connection actions
  setConnectionStatus: (status) => {
    set({
      connectionStatus: status,
      isConnected: status === 'connected',
    });
  },

  setConnected: (connected) => {
    set({
      isConnected: connected,
      connectionStatus: connected ? 'connected' : 'disconnected',
    });
  },

  setLastUpdate: (date) => {
    set({ lastUpdate: date });
  },

  // Loading actions
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  // Score actions
  recordGoal: (teamId, isHome) => {
    const { currentGame } = get();
    if (!currentGame) return;

    if (isHome) {
      set({
        currentGame: {
          ...currentGame,
          homeTeamScore: currentGame.homeTeamScore + 1,
        },
      });
    } else {
      set({
        currentGame: {
          ...currentGame,
          awayTeamScore: currentGame.awayTeamScore + 1,
        },
      });
    }
  },
}));

// Selector hooks
export const useCurrentGame = () => useGameStore((state) => state.currentGame);
export const useGameEvents = () => useGameStore((state) => state.gameEvents);
export const useGameTimer = () => useGameStore((state) => state.timer);
export const useGameConnection = () =>
  useGameStore((state) => ({
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    lastUpdate: state.lastUpdate,
  }));
