'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Game, GameEvent } from '@/types';
import { useAuthStore } from '@/stores/auth';

// SSE Event Types
export type SSEEventType =
  | 'connected'
  | 'game_started'
  | 'game_ended'
  | 'goal_scored'
  | 'score_updated'
  | 'stoppage_started'
  | 'stoppage_ended'
  | 'timer_update'
  | 'error';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: string;
}

export interface GameStreamState {
  game: Game | null;
  events: GameEvent[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  error: string | null;
}

interface UseGameStreamOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onEvent?: (event: SSEEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function useGameStream(
  gameId: string | null,
  options: UseGameStreamOptions = {}
) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onEvent,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [state, setState] = useState<GameStreamState>({
    game: null,
    events: [],
    isConnected: false,
    connectionStatus: 'disconnected',
    lastUpdate: null,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const connect = useCallback(() => {
    if (!gameId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState((prev) => ({
      ...prev,
      connectionStatus: 'connecting',
      error: null,
    }));

    // Build URL with auth token as query param (EventSource doesn't support headers)
    const url = new URL(`${API_BASE_URL}/games/${gameId}/stream`);
    if (accessToken) {
      url.searchParams.set('token', accessToken);
    }

    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setState((prev) => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected',
        error: null,
      }));
      onConnect?.();
    };

    // Handle specific event types
    const eventHandlers: Record<string, (e: MessageEvent) => void> = {
      connected: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          game: data.game || prev.game,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'connected', data, timestamp: new Date().toISOString() });
      },

      game_started: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          game: data.game || prev.game,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'game_started', data, timestamp: new Date().toISOString() });
      },

      game_ended: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          game: data.game || prev.game,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'game_ended', data, timestamp: new Date().toISOString() });
      },

      goal_scored: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          game: data.game || prev.game,
          events: data.event ? [...prev.events, data.event] : prev.events,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'goal_scored', data, timestamp: new Date().toISOString() });
      },

      score_updated: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          game: data.game
            ? { ...prev.game, ...data.game }
            : prev.game,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'score_updated', data, timestamp: new Date().toISOString() });
      },

      timer_update: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'timer_update', data, timestamp: new Date().toISOString() });
      },

      stoppage_started: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          game: data.game || prev.game,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'stoppage_started', data, timestamp: new Date().toISOString() });
      },

      stoppage_ended: (e) => {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          game: data.game || prev.game,
          lastUpdate: new Date(),
        }));
        onEvent?.({ type: 'stoppage_ended', data, timestamp: new Date().toISOString() });
      },
    };

    // Register all event listeners
    Object.entries(eventHandlers).forEach(([eventType, handler]) => {
      eventSource.addEventListener(eventType, handler);
    });

    // Handle generic messages
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setState((prev) => ({ ...prev, lastUpdate: new Date() }));
        onEvent?.({ type: 'connected', data, timestamp: new Date().toISOString() });
      } catch {
        console.warn('Failed to parse SSE message:', e.data);
      }
    };

    eventSource.onerror = (e) => {
      console.error('SSE connection error:', e);
      eventSource.close();
      eventSourceRef.current = null;

      setState((prev) => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'error',
        error: 'Connection lost',
      }));

      onDisconnect?.();
      onError?.(new Error('SSE connection error'));

      // Auto-reconnect logic
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval * Math.min(reconnectAttemptsRef.current, 3));
      }
    };
  }, [
    gameId,
    accessToken,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    onConnect,
    onDisconnect,
    onError,
    onEvent,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionStatus: 'disconnected',
    }));
  }, []);

  // Connect when gameId changes
  useEffect(() => {
    if (gameId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [gameId, connect, disconnect]);

  // Update game data
  const updateGame = useCallback((updates: Partial<Game>) => {
    setState((prev) => ({
      ...prev,
      game: prev.game ? { ...prev.game, ...updates } : null,
    }));
  }, []);

  // Add event to timeline
  const addEvent = useCallback((event: GameEvent) => {
    setState((prev) => ({
      ...prev,
      events: [...prev.events, event],
    }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    updateGame,
    addEvent,
  };
}

export default useGameStream;
