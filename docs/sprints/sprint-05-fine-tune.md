# DigiGameStats Events System Redesign Plan

## Status: IMPLEMENTATION COMPLETE ✅

**Last Updated**: 2026-02-05
**Scope**: Backend fixes + Frontend event detail page tabs
**Completion**: All tasks completed successfully

---

## Overview

Comprehensive redesign of the events discovery system based on reference UI screenshots:
- **Fix 1**: EventCard to match reference design (colorful badges, team avatars, proper counts)
- **Fix 2**: Add `/api/v1/public/geographic/countries` endpoint (currently 404)
- **Fix 3**: Implement all missing event detail tabs (Group, Crossover, Bracket, Stats, Crew)
- **Enhancement**: Improve Spirit tab with per-game ratings and expandable rows

---

## Current Issues Identified

1. **EventCard** - Shows "0 teams, 0 games" even when divisions have teams (teamsCount not aggregated)
2. **Countries API** - Returns 404 (endpoint doesn't exist)
3. **Event Detail Tabs** - Several tabs show "Coming Soon" placeholder instead of real data

---

## Sprint 11: Immediate Fixes

### 11.1 Fix Countries API Endpoint (404 Error)

**Step 1: Add ListCountries to Metadata Service**
**File:** `game-stats-api/internal/application/metadata/service.go`

```go
type CountryDTO struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Slug        string `json:"slug"`
    Code        string `json:"code"`
    ContinentID string `json:"continent_id"`
}

func (s *Service) ListCountries(ctx context.Context, continentID *uuid.UUID) ([]CountryDTO, error) {
    countries, err := s.countryRepo.List(ctx) // Already exists in repository
    // Filter by continentID if provided, transform to DTOs
}
```

**Step 2: Add Handler**
**File:** `game-stats-api/internal/presentation/http/handlers/geographic_handler.go`

```go
// ListCountries handles the request to list all countries.
// @Summary List Countries
// @Tags geographic
// @Param continent_id query string false "Filter by continent ID"
// @Success 200 {array} metadata.CountryDTO
// @Router /geographic/countries [get]
func (h *GeographicHandler) ListCountries(w http.ResponseWriter, r *http.Request) {
    var continentID *uuid.UUID
    if cid := r.URL.Query().Get("continent_id"); cid != "" {
        if id, err := uuid.Parse(cid); err == nil {
            continentID = &id
        }
    }
    countries, err := h.service.ListCountries(r.Context(), continentID)
    // Handle error and return JSON
}
```

**Step 3: Add Route**
**File:** `game-stats-api/internal/presentation/http/router.go`

In the public geographic routes group:
```go
r.Get("/geographic/countries", h.geographic.ListCountries)
```

### 11.2 Fix EventCard Team/Game Counts
**Issue:** `e.TeamsCount` and `e.GamesCount` are stored fields that return 0 because they're not calculated

**File:** `game-stats-api/internal/presentation/http/handlers/event_handler.go`

**Fix 1:** Modify `toEventResponse` to calculate counts from loaded edges:
```go
// In toEventResponse function, calculate actual counts:
actualTeamsCount := 0
for _, dp := range e.Edges.DivisionPools {
    if dp.Edges.Teams != nil {
        actualTeamsCount += len(dp.Edges.Teams)
    }
}
// Use calculated count if stored count is 0
teamsCount := e.TeamsCount
if teamsCount == 0 {
    teamsCount = actualTeamsCount
}
```

**Fix 2:** Ensure Games edge is loaded in ListEvents query:
```go
query := h.client.Event.Query().
    Where(event.DeletedAtIsNil()).
    WithDiscipline().
    WithLocation(func(lq *ent.LocationQuery) {
        lq.WithCountry()
    }).
    WithDivisionPools(func(dpq *ent.DivisionPoolQuery) {
        dpq.WithTeams()
    }).
    WithGames()  // ADD THIS LINE
```

---

## Sprint 12: Event Detail Page - Missing Tabs Implementation

Based on reference screenshots, implement 6 missing/incomplete tabs:

### 12.1 Group Tab (Pool Standings) - Screenshot 5
**Reference Design:**
- Division filter (Men, Competitive, Recreational, Women)
- Group/Pool selector (Group A, Group B, etc.)
- Standings table: #, Team (with logo), G, W, L, Pts, GD, F, A, Form
- Form column shows last 5 game results as colored dots (green=win, red=loss)
- Legend explaining abbreviations
- Tiebreaker rule note
- "Group Games" section below showing individual pool games

**Files to Modify:**
- `game-stats-ui/src/app/(public)/discover/[slug]/page.tsx` - Add Group tab content
- `game-stats-ui/src/components/features/standings/PoolStandings.tsx` - NEW component
- `game-stats-ui/src/lib/api/public.ts` - Use existing `getEventStandings()` endpoint

**API Endpoint:** `GET /api/v1/public/events/{id}/standings` (exists)

### 12.2 Crossover Tab - Screenshot 6
**Reference Design:**
- Division filter
- Crossover games displayed as cards
- Game code labels (CF5-1v3, CF6-2v4)
- Shows teams, scores, date/time, field, status

**Files to Modify:**
- `game-stats-ui/src/app/(public)/discover/[slug]/page.tsx` - Add Crossover tab content
- Filter games by `roundType === 'crossover'`

**Implementation:** Reuse existing GameCard component with crossover round filter

### 12.3 Bracket Tab - Screenshot 7
**Reference Design:**
- Division filter
- Pool selector (Pool A - 1-8)
- Tournament bracket visualization (Quarterfinals → Semifinals → Finals)
- Match cards with team names, scores, status
- Medal positions: Gold, Silver, Bronze, 4th

**Files to Modify:**
- `game-stats-ui/src/app/(public)/discover/[slug]/page.tsx` - Integrate TournamentBracket

**Existing Component:** `TournamentBracket` in `src/components/features/brackets/tournament-bracket.tsx`
**API Endpoint:** `GET /api/v1/public/events/{id}/bracket` (exists)

### 12.4 Stats Tab (Player Leaderboard) - Screenshot 8
**Reference Design:**
- Division filter
- Filter by stat type: Goals, Assists, Total O, Blocks, Total All
- Search by player name
- Table: Rank (medal icons 1-3), Name, Team, Goals, Asst., Blocks, Total
- Rank badges: Gold (1), Silver (2), Bronze (3)

**Files to Create:**
- `game-stats-ui/src/components/features/leaderboards/PlayerStatsTable.tsx` - NEW

**API Endpoint:** `GET /api/v1/public/leaderboards/players` (exists)

### 12.5 Enhanced Standings Tab - Screenshot 9
**Reference Design:**
- Final/overall standings by division
- Division filter
- Table: Rank (medal icons), Team (with logo), Division
- Medal positions for top 4

**Files to Modify:**
- `game-stats-ui/src/app/(public)/discover/[slug]/page.tsx` - Replace placeholder

**API Endpoint:** `GET /api/v1/public/events/{id}/standings` (exists)

### 12.6 Crew Tab - Screenshot 10
**Reference Design:**
- Tournament Admins section with logos
- Scorekeepers section with avatars

**Files to Create:**
- `game-stats-ui/src/components/features/events/EventCrew.tsx` - NEW

**Backend Consideration:** May need new endpoint for event staff/crew
- Check if `event.Edges.Users` or similar exists for admin/scorekeeper info

### 12.7 Enhanced Spirit Tab - Screenshot 4
**Reference Design:**
- Division filter
- Table: Team Name, Games Played, Games Rated, %
- Expandable rows showing per-game spirit ratings
- "Rated" status badge for each game

**Enhancement to existing tab:**
- Add division filter
- Add expandable rows with per-game breakdown
- Show rating percentage

**API Endpoints:**
- `GET /api/v1/public/leaderboards/spirit` (exists)
- `GET /api/v1/public/games/{id}/spirit` (exists, for per-game details)

---

## Sprint 13: EventCard Enhancement

### 13.1 Match Reference Design (Screenshot 2)
**Current vs Target:**
| Feature | Current | Target |
|---------|---------|--------|
| Event Logo | ✅ Exists | ✅ Keep |
| Date Range | ✅ Exists | ✅ Keep |
| Location + Flag | ✅ Exists | ✅ Keep |
| Category Badges | ✅ Exists | Enhance colors |
| Team Count | Shows 0 | Show actual count from divisions |
| Team Avatar Stack | ✅ Exists | Show "+N" indicator properly |
| Games Count | Shows 0 | Show actual count |

**Fix:** Ensure teamsCount is calculated from sum of division team counts

---

## Sprint 7: Backend Schema & API Redesign

### 7.1 Event Entity Schema Changes
**File:** `game-stats-api/ent/schema/event.go`

Add new fields:
```go
field.Strings("categories")      // ["outdoor", "hat", "beach", "indoor", "league"]
field.String("logo_url")         // Event logo image URL
field.String("banner_url")       // Event banner image URL
field.Int("teams_count")         // Denormalized count
field.Int("games_count")         // Denormalized count
```

### 7.2 Enhanced Event Filter Support
**File:** `game-stats-api/internal/presentation/http/handlers/event_handler.go`

New query parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| `temporal` | string | `past`, `upcoming`, `live`, `all` |
| `category` | string[] | Filter by categories (OR logic) |
| `country` | string | ISO 2-letter country code |
| `search` | string | Search name/description |
| `startDateFrom` | RFC3339 | Events starting after date |
| `startDateTo` | RFC3339 | Events starting before date |
| `sortBy` | string | `start_date`, `name`, `teams_count` |
| `sortOrder` | string | `asc`, `desc` |

### 7.3 Enhanced Response Structure
```json
{
  "id": "uuid",
  "name": "2026 Ultimate Youth Tournament",
  "slug": "2026-ultimate-youth-tournament",
  "year": 2026,
  "startDate": "2026-01-31T00:00:00Z",
  "endDate": "2026-02-02T00:00:00Z",
  "status": "published",
  "categories": ["outdoor"],
  "logoUrl": "https://...",
  "teamsCount": 16,
  "gamesCount": 32,
  "discipline": { "id": "...", "name": "Ultimate" },
  "location": {
    "id": "...",
    "name": "Hong Kong Stadium",
    "city": "Hong Kong",
    "country": { "id": "...", "name": "China", "code": "CN" }
  },
  "divisions": [
    { "id": "...", "name": "Open", "divisionType": "Open", "teamsCount": 8 }
  ],
  "teamPreview": [
    { "id": "...", "name": "Team A", "logoUrl": "..." }
  ]
}
```

---

## Sprint 8: Frontend Types & API Client

### 8.1 Type Updates
**File:** `game-stats-ui/src/types/index.ts`

```typescript
export type EventCategory = 'outdoor' | 'hat' | 'beach' | 'indoor' | 'league';

export interface Event {
  // Existing fields...
  categories?: EventCategory[];
  logoUrl?: string;
  bannerUrl?: string;
  teamsCount: number;
  gamesCount: number;
  location?: EventLocation;
  divisions?: EventDivision[];
  teamPreview?: TeamPreview[];
}

export interface EventLocation {
  id: string;
  name: string;
  city?: string;
  country?: { id: string; name: string; code: string; };
}
```

### 8.2 API Client Updates
**File:** `game-stats-ui/src/lib/api/public.ts`

```typescript
export interface ListEventsParams extends PaginationParams {
  temporal?: 'past' | 'upcoming' | 'live' | 'all';
  category?: EventCategory[];
  country?: string;
  search?: string;
  sortBy?: 'start_date' | 'name' | 'teams_count';
  sortOrder?: 'asc' | 'desc';
}
```

---

## Sprint 9: Events UI Components

### 9.1 New Component Structure
```
src/components/features/events/
├── index.ts
├── EventCard.tsx           # Gamified event card
├── EventGrid.tsx           # Responsive grid layout
├── EventCalendar.tsx       # Calendar view
├── EventFilters.tsx        # Filter controls
├── EventCategoryBadge.tsx  # Colorful category badges
├── EventLocationBadge.tsx  # Location with flag
├── TeamAvatarStack.tsx     # Overlapping team avatars
└── EventListSkeleton.tsx   # Loading states
```

### 9.2 Category Color System
| Category | Light Mode | Dark Mode | Icon |
|----------|------------|-----------|------|
| outdoor | emerald-100/700 | emerald-900/400 | Sun |
| hat | amber-100/700 | amber-900/400 | Shuffle |
| beach | sky-100/700 | sky-900/400 | Waves |
| indoor | violet-100/700 | violet-900/400 | Building |
| league | rose-100/700 | rose-900/400 | Trophy |

### 9.3 Country Flags
Use flag emoji conversion from ISO 2-letter country code:
```typescript
const getCountryFlag = (code: string): string => {
  const codePoints = code.toUpperCase().split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
// "US" → 🇺🇸, "CN" → 🇨🇳, "AE" → 🇦🇪
```

### 9.3 EventCard Design Elements
- Gradient header based on primary category
- Country flag emoji next to location
- Colorful category badges with icons
- Team avatar stack (max 4, with +N indicator)
- Date badge (large day + month)
- Hover: scale + shadow lift animation

---

## Sprint 10: Events Page Implementation

### 10.1 Page Layout
**Files:**
- `game-stats-ui/src/app/(public)/events/page.tsx` (main page)
- `game-stats-ui/src/app/(public)/discover/page.tsx` (redirect or re-export to /events)

Both `/events` and `/discover` routes will serve the same page.

```
┌─────────────────────────────────────────────────────┐
│  🏆 Discover Events                                 │
│  Find tournaments and competitions near you         │
├─────────────────────────────────────────────────────┤
│ [Upcoming] [Past]  |  🔍 Search...  | 📅 Calendar  │
├─────────────────────────────────────────────────────┤
│ [🏖️ Outdoor] [🎩 Hat] [🏐 Beach] ... | 🇺🇸 Country ▼ │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Event 1 │ │ Event 2 │ │ Event 3 │ │ Event 4 │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Event 5 │ │ Event 6 │ │ Event 7 │ │ Event 8 │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
└─────────────────────────────────────────────────────┘
```

### 10.2 Calendar View
Simple month grid with event dots, click to expand day's events.

---

## Files Modified/Created (Sprint 11-12)

### Backend Files (Sprint 11) ✅ COMPLETED
| Status | File | Change |
|--------|------|--------|
| ✅ | `handlers/geographic_handler.go` | Added ListCountries handler |
| ✅ | `router.go` | Added `/geographic/countries` and `/events/{id}/crew` routes |
| ✅ | `handlers/event_handler.go` | Fixed teamsCount/gamesCount calculation, added GetEventCrew handler |

### Frontend Files (Sprint 12-13) ✅ COMPLETED
| Status | File | Change |
|--------|------|--------|
| ✅ | `src/app/(public)/discover/[slug]/page.tsx` | Implemented all 10 tabs (Info, Teams, Schedule, Spirit, Group, Crossover, Bracket, Stats, Standings, Crew) |
| ✅ | `src/lib/api/public.ts` | Added getEventCrew, CrewMember, EventCrew types |
| ✅ | `src/types/index.ts` | Added GameSpiritScore interface, enhanced TeamSpiritAverage |

### Existing Components to Reuse
| Component | Location | Used For |
|-----------|----------|----------|
| TournamentBracket | `components/features/brackets/tournament-bracket.tsx` | Bracket tab |
| SpiritLeaderboard | `components/features/spirit/spirit-leaderboard.tsx` | Enhanced Spirit tab |
| GameCard | `app/(public)/discover/[slug]/page.tsx` | Schedule, Crossover tabs |
| EventCategoryBadge | `components/features/events/EventCategoryBadge.tsx` | Event cards |
| TeamAvatarStack | `components/features/events/TeamAvatarStack.tsx` | Event cards |

---

## Implementation Order

1. **Fix Countries API** (Backend) - 15 min
2. **Fix EventCard counts** (Backend) - 30 min
3. **Group Tab** (Frontend) - Pool standings with form indicators - 2 hr
4. **Crossover Tab** (Frontend) - Filter games by round type - 30 min
5. **Bracket Tab** (Frontend) - Integrate existing component - 1 hr
6. **Stats Tab** (Frontend) - Player leaderboard - 1.5 hr
7. **Standings Tab** (Frontend) - Final standings with medals - 1 hr
8. **Crew Tab** (Frontend) - Tournament staff display - 1 hr
9. **Spirit Tab Enhancement** (Frontend) - Expandable rows - 1.5 hr

---

## Verification Checklist

### Backend
- [x] `GET /api/v1/public/geographic/countries` returns 200 with countries list
- [x] `GET /api/v1/public/events` returns correct teamsCount (not 0)
- [x] `GET /api/v1/public/events` returns correct gamesCount (not 0)
- [x] `GET /api/v1/public/events/{id}/crew` returns event staff/crew
- [x] Backend builds without errors

### Frontend - Event Detail Page
- [x] Group tab shows pool standings with G, W, L, Pts, GD, F, A columns
- [x] Group tab shows legend for abbreviations
- [x] Crossover tab shows crossover games filtered correctly
- [x] Bracket tab displays tournament bracket visualization
- [x] Stats tab shows player leaderboard with Goals, Assists, Total
- [x] Stats tab has filter for sorting by different stats
- [x] Standings tab shows final standings with medal icons
- [x] Crew tab shows tournament admins and scorekeepers
- [x] Spirit tab has expandable rows with per-game breakdown
- [x] Spirit tab shows Games Played, Games Rated, Rated % columns
- [x] All tabs have division filter working
- [x] Frontend builds without errors
- [x] Mobile responsive design works on all tabs

---

## Completed Work

### ✅ Sprints 1-3: Auth, RBAC, Public API Integration
- Public routes without login
- Permission-based route protection
- Real API integration for all public pages

### ✅ Sprint 4-6: Pagination Implementation
- Backend pagination middleware (default 50, max 100)
- Frontend pagination hooks
- Type fixes for Game, Team, Event types

### ✅ Sprint 11: Backend Fixes
- Added `/api/v1/public/geographic/countries` endpoint
- Fixed EventCard team/game counts calculation (now calculated from division pools)
- Added `/api/v1/public/events/{id}/crew` endpoint for tournament staff

### ✅ Sprint 12: Event Detail Page Tabs
- **Group Tab**: Pool standings with G, W, L, Pts, GD, F, A columns
- **Crossover Tab**: Games filtered by crossover round type
- **Bracket Tab**: Integrated TournamentBracket component
- **Stats Tab**: Player leaderboard with Goals, Assists, Total stats + filtering
- **Standings Tab**: Final standings with medal icons (🥇🥈🥉)
- **Crew Tab**: Tournament admins and scorekeepers with avatars
- **Spirit Tab Enhanced**: Expandable rows, per-game breakdown, rated percentage

---

## Files Modified/Created

### Phase 1 Files
| Status | File | Change |
|--------|------|--------|
| ✅ | `src/components/providers/auth-provider.tsx` | Added public paths, permission-based route protection |

### Phase 2 Files
| Status | File | Change |
|--------|------|--------|
| ✅ | `src/lib/permissions/index.ts` | RBAC utilities (roles, permissions, checks) |
| ✅ | `src/lib/permissions/routes.ts` | Route permission configuration |
| ✅ | `src/lib/hooks/usePermission.ts` | Permission hooks |
| ✅ | `src/components/guards/permission-guard.tsx` | Guard components |
| ✅ | `src/components/layout/sidebar.tsx` | Permission-based nav filtering |

### Phase 3 Files
| Status | File | Change |
|--------|------|--------|
| ✅ | `src/lib/api/public.ts` | Public API client module |
| ✅ | `src/lib/api/index.ts` | Export public API |
| ✅ | `src/app/(public)/discover/page.tsx` | Real API integration |
| ✅ | `src/app/(public)/live/page.tsx` | Real API integration |
| ✅ | `src/app/(public)/leaderboards/page.tsx` | Real API integration |
| ✅ | `src/app/(public)/directory/page.tsx` | Real API integration |
| ✅ | `src/types/index.ts` | Updated User type for login response |

---

## Verification Checklist

- [x] **Auth Fix**: Visit `/discover` without login - should NOT redirect to `/login`
- [x] **RBAC**: Login as spectator - Admin nav item should be hidden
- [x] **API Integration**: Events load from backend (check network tab)
- [ ] **SSE**: Live game page shows real-time updates (needs testing with live data)
- [x] **Build**: `pnpm build` passes without errors

---

## How RBAC Works (For Reference)

1. **Login Response**: Returns `{ user: { id, email, name, role } }` with JWT tokens
2. **Permission Derivation**: Frontend uses `ROLE_PERMISSIONS` mapping to derive permissions from role
3. **Route Protection**: `AuthProvider` checks route permissions on navigation
4. **Component Protection**: `PermissionGuard` and `usePermission` hook for granular control
5. **Sidebar Filtering**: Nav items filtered by user permissions

```typescript
// Example: Check if user can manage events
const { can } = usePermissions();
if (can('manage_events')) {
  // Show edit button
}

// Example: Protect a component
<PermissionGuard permission="manage_teams" fallback={<AccessDenied />}>
  <TeamEditor />
</PermissionGuard>
```

---

## Key Principles

1. **Adapt existing files** before creating new ones
2. **No mock/placeholder data** - connect to real API
3. **Mobile-first responsive design**
4. **Follow existing patterns** in codebase
5. **Update sprint docs** after completion
