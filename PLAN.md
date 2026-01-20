# Game Stats UI - Frontend Implementation Plan

## Architecture Overview

Modern Next.js 15 application with React 19, featuring real-time updates, AI analytics, and PWA capabilities.

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
│   │   ├── games/
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
- **E2E Tests**: Playwright
- **Coverage Target**: 70%+

---

## Deployment

**Recommended**: Vercel (Next.js native platform)

**Environment Variables**:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_APP_URL`

---

See sprint files for detailed implementation timeline.
