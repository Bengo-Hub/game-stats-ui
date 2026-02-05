# Game Stats UI - Frontend Implementation Plan

## Architecture Overview

Modern Next.js 15 application with React 19, featuring real-time updates, AI analytics, and PWA capabilities.

### Implementation Status
- [x] Project Initialization & Bootstrap
- [x] Folder Structure & Design System
- [x] Authentication UI (Sprint 1 Complete)
- [x] Dashboard & Core Views (Sprint 2 Complete)
- [x] Real-time Updates (SSE) - Sprint 3 Complete
- [x] Analytics Dashboard with Tremor Charts - Sprint 3 Complete
- [x] Spirit Scores Interface - Sprint 3 Complete
- [x] Admin Dashboard - Sprint 3 Complete
- [x] PWA Configuration - Sprint 1
- [x] Offline Fallback & Install Prompt - Sprint 4 Complete
- [x] Error Handling & Boundaries - Sprint 4 Complete
- [x] Loading States & Skeletons - Sprint 4 Complete
- [x] Accessibility (Skip Links, ARIA) - Sprint 4 Complete
- [x] E2E Testing with Playwright - Sprint 4 Complete
- [x] Production Build Optimization - Sprint 4 Complete
- [x] Public Events Discovery Page - Sprint 5 Complete
- [x] Event Calendar Modal - Sprint 5 Complete
- [x] Event Detail Page with Tabs - Sprint 5 Complete
- [x] Schedule/Timetable Views - Sprint 5 Complete
- [x] Geographic Hierarchical Filters - Sprint 5 Complete
- [x] TanStack Query Integration - Sprint 5 Complete
- [x] Landing Page Redesign - Sprint 5 Complete

### Sprint Progress
- **Sprint 1**: Foundation & Auth - COMPLETED
- **Sprint 2**: Core Features - COMPLETED
- **Sprint 3**: Real-time & Advanced - COMPLETED
- **Sprint 4**: PWA & Polish - COMPLETED
- **Sprint 5**: Event Discovery & UI Redesign - COMPLETED

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 15 (App Router) |
| UI Library | React | 19 |
| State Management | Zustand | Latest |
| UI Components | shadcn/ui | Latest |
| Styling | Tailwind CSS | v4 |
| Forms | React Hook Form + Zod | Latest |
| Charts | Tremor | Latest |
| PWA | next-pwa | Latest |

---

## Project Structure

```
game-stats-ui/
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (dashboard)/         # Main app
│   │   ├── page.tsx         # Dashboard
│   │   ├── games/           # Game views
│   │   ├── teams/           # Team management
│   │   ├── players/         # Player views
│   │   ├── analytics/       # Analytics dashboard
│   │   └── admin/           # Admin panel
│   ├── api/                 # API routes
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── features/            # Feature components
│   │   ├── games/           # Timer, connection status
│   │   ├── brackets/        # Tournament brackets
│   │   ├── spirit/          # Spirit score form & leaderboard
│   │   ├── teams/
│   │   ├── analytics/
│   │   └── admin/
│   └── layout/              # Layout components
├── lib/
│   ├── api/                 # API client
│   ├── hooks/               # Custom hooks
│   └── utils/               # Utilities
├── stores/                  # Zustand stores
│   ├── auth.ts
│   ├── game.ts
│   └── ui.ts
├── types/                   # TypeScript types
└── public/
    ├── manifest.json
    └── icons/
```

---

## Key Features Implementation

### 1. Real-time Updates (SSE)

```typescript
// lib/hooks/useGameStream.ts
export function useGameStream(gameId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_URL}/games/${gameId}/stream`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    eventSource.onopen = () => setIsConnected(true);
    
    eventSource.addEventListener('goal_scored', (event) => {
      const data = JSON.parse(event.data);
      setGameState((prev) => updateScore(prev, data));
    });

    // Handle reconnection
    eventSource.onerror = () => {
      setIsConnected(false);
      setTimeout(() => eventSource.close(), 5000);
    };

    return () => eventSource.close();
  }, [gameId]);

  return { gameState, isConnected };
}
```

### 2. Analytics with Tremor

```typescript
// app/(dashboard)/analytics/page.tsx
import { BarChart, LineChart } from '@tremor/react';

export default function AnalyticsPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  const handleQuery = async () => {
    const response = await fetch('/api/analytics/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    setResult(data);
  };

  return (
    <div>
      <Textarea 
        placeholder="Ask a question..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {result && (
        <Card>
          <Title>{result.explanation}</Title>
          {result.chart_type === 'bar' && (
            <BarChart
              data={result.data}
              index="name"
              categories={["value"]}
            />
          )}
        </Card>
      )}
    </div>
  );
}
```

### 3. State Management (Zustand)

```typescript
// stores/auth.ts
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    
    set({
      user: data.user,
      token: data.access_token,
      isAuthenticated: true,
    });
  },
  
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
```

---

## Performance Optimization

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: `next/image` for all images
- **Lazy Loading**: Dynamic imports for heavy components
- **Prefetching**: Link prefetching for navigation
- **Bundle Analysis**: `@next/bundle-analyzer`

---

## PWA Configuration

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.gamestats\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
  ],
});

module.exports = withPWA({
  // Next.js config
});
```

---

## Testing Strategy

- **Unit Tests**: Jest + Testing Library
- **E2E Tests**: Playwright (Configured - see `playwright.config.ts` and `e2e/` folder)
- **Coverage Target**: 70%+
- **Test Files**: `e2e/app.spec.ts` - Navigation, mobile responsiveness, accessibility tests

---

## Deployment

**Recommended**: Vercel (Next.js native platform)

**Environment Variables**:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_APP_URL`

---

---

## Sprint 5: Event Discovery & UI Redesign

### Completed Features

#### 1. Public Events Discovery Page (`/discover`)
- **Temporal Tabs**: Upcoming, Live (with real-time count), Past events
- **Hierarchical Geographic Filters**: Continent → Country dropdown with flag emojis
- **Category Filters**: Outdoor, Hat, Beach, Indoor, League with colored badges
- **Search & Sort**: Debounced search, multiple sort options
- **TanStack Query**: Full integration for data fetching with caching

#### 2. Event Calendar Modal
- Interactive calendar view with month navigation
- Event dots colored by category
- Hide Leagues toggle
- Click date to see events list
- Direct links to event detail pages

#### 3. Event Detail Page (`/discover/[slug]`)
- **Horizontal Tab Navigation**: Info, Teams, Schedule, Spirit, Standings, Bracket
- **Schedule Tab**:
  - Division selector (U15, U19, etc.)
  - Date selector
  - Stage filter (All, Group, Bracket)
  - Game cards with scores and status
- **Timetable Modal**: Field-based grid view of all games
- **Teams Tab**: Grid display with team logos and seeds
- **Spirit Tab**: Leaderboard with average scores
- **Info Tab**: Event details, divisions, and stats

#### 4. Landing Page Redesign
- Compact hero section with dashboard preview
- Two-column layout on desktop
- Trust indicators and live stats
- Gradient styling throughout

#### 5. Component Architecture
- `EventFilters`: Unified filter component with geographic hierarchy
- `EventCalendar`: Modal calendar view
- `EventCard`: Event card with category badges and team preview
- `EventGrid`: Responsive grid layout
- `EventCategoryBadge`: Colored category indicators
- `TeamAvatarStack`: Team logo previews

#### 6. API Integration
- TanStack Query hooks for events, games, teams, spirit scores
- Real-time live event count
- Proper error handling and loading states

---

## Sprint 6: Dashboard & Live Game Integration - COMPLETED

### Completed Features

#### 1. Dashboard Pages - Real API Integration
All dashboard pages now connect to the backend API using TanStack Query:

- **Events Page (`/events`)**:
  - Removed mock data, uses `publicApi.listEvents()`
  - TanStack Query with 5-minute stale time
  - Error handling with retry button
  - Refresh button with loading state
  - Links to `/discover/{slug}` for detail pages

- **Teams Page (`/teams`)**:
  - Removed mock data, uses `publicApi.listTeams()`
  - Dynamic team color generation from name
  - Mobile card view + desktop table view
  - Search filtering by name, division, location

- **Players Page (`/players`)**:
  - Removed mock data, uses `publicApi.getPlayerLeaderboard()`
  - Displays player leaderboard with rankings
  - Gold/Silver/Bronze rank badges for top 3
  - Total points calculation (goals + assists)
  - Dynamic player avatar colors from name

#### 2. Live Game Detail Page (`/live/[id]`)
- **Real API Integration**:
  - `publicApi.getGame()` for game details
  - `publicApi.getGameTimeline()` for play-by-play events
  - `publicApi.getGameScores()` for player statistics
  - `publicApi.createGameStream()` for SSE real-time updates

- **SSE Real-time Updates**:
  - Auto-reconnect on connection loss
  - Connection status indicator
  - Query invalidation on score updates
  - Toggle between auto/manual refresh

- **UI Improvements**:
  - Status indicator (LIVE/FINAL/SCHEDULED)
  - Team logos with fallback color avatars
  - Elapsed time calculation for live games
  - Stats comparison bar chart
  - Play-by-play event timeline

#### 3. 404 Page Auth-Aware Navigation
- Client-side component with auth state check
- Shows "Go to Dashboard" only for authenticated users
- Shows "Browse Events" for unauthenticated users
- "Go Back" button for all users

### Files Modified
| File | Change |
|------|--------|
| `src/app/(dashboard)/events/page.tsx` | TanStack Query, real API |
| `src/app/(dashboard)/teams/page.tsx` | TanStack Query, real API |
| `src/app/(dashboard)/players/page.tsx` | Player leaderboard API |
| `src/app/(public)/live/[id]/page.tsx` | Real game data + SSE stream |
| `src/app/not-found.tsx` | Auth-aware navigation |
| `src/components/features/events/EventCard.tsx` | Fixed detail page links |

---

See sprint files for detailed implementation timeline.
