# Dashboard Pages Production-Ready Implementation Plan

## Status: PLANNING
**Created**: 2026-02-05
**Scope**: All authenticated dashboard pages CRUD operations

---

## Overview

This plan covers making all dashboard pages production-ready with:
- Full CRUD operations (Create, Read, Update, Delete)
- Clear separation from public pages
- RBAC permission enforcement
- Proper API integration with auth headers
- Form validation and error handling

---

## Current State Analysis

### Backend API Endpoints Available

| Resource | GET | POST | PUT | DELETE | Notes |
|----------|-----|------|-----|--------|-------|
| Events | `/events`, `/events/{id}` | - | - | - | Read-only currently |
| Games | `/games`, `/games/{id}` | `/games` | `/games/{id}` | `/games/{id}` | Full CRUD exists |
| Teams | `/teams`, `/teams/{id}` | - | - | - | Read-only currently |
| Rounds | `/rounds/{id}` | `/rounds` | `/rounds/{id}` | - | Partial |
| Admin | `/admin/games/{id}/score`, `/admin/games/{id}/audit` | - | PUT | - | Limited |
| Analytics | `/analytics/query`, `/analytics/health` | POST | - | - | Needs auth fix |

### Frontend Pages Status

| Page | Read | Create | Update | Delete | RBAC |
|------|------|--------|--------|--------|------|
| Events | ✅ | ❌ | ❌ | ❌ | ❌ |
| Games | ✅ | ⚠️ UI only | ❌ | ❌ | ❌ |
| Teams | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin | ❌ Mock | ❌ | ❌ | ❌ | ❌ |
| Analytics | ✅ | N/A | N/A | N/A | ❌ |
| Settings | ⚠️ Partial | N/A | ❌ | N/A | ✅ |

---

## Sprint 1: Events Management Page

### 1.1 Create Authenticated Events API Client
**File:** `src/lib/api/events.ts`

```typescript
// Events API with auth headers
const eventsApi = {
  list: (params) => authFetch<Event[]>('/events', { params }),
  get: (id) => authFetch<Event>(`/events/${id}`),
  create: (data) => authFetch<Event>('/events', { method: 'POST', body: data }),
  update: (id, data) => authFetch<Event>(`/events/${id}`, { method: 'PUT', body: data }),
  delete: (id) => authFetch<void>(`/events/${id}`, { method: 'DELETE' }),
  // Division management
  createDivision: (eventId, data) => authFetch(`/events/${eventId}/divisions`, { method: 'POST', body: data }),
  // Round management
  createRound: (eventId, data) => authFetch(`/events/${eventId}/rounds`, { method: 'POST', body: data }),
};
```

### 1.2 Backend: Add Missing Event Endpoints
**File:** `router.go` - Add to authenticated routes

```go
// Events CRUD (event_manager+)
r.Route("/events", func(r chi.Router) {
    r.Use(RequirePermission("manage_events"))
    r.Post("/", opts.EventHandler.CreateEvent)
    r.Put("/{id}", opts.EventHandler.UpdateEvent)
    r.Delete("/{id}", opts.EventHandler.DeleteEvent)
    // Division management
    r.Post("/{id}/divisions", opts.DivisionHandler.CreateDivision)
    r.Put("/{id}/divisions/{divId}", opts.DivisionHandler.UpdateDivision)
})
```

### 1.3 CreateEventDialog Component
**File:** `src/components/dashboard/events/CreateEventDialog.tsx`

```typescript
interface CreateEventForm {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  description?: string;
  categories: EventCategory[];
  locationId?: string;
  disciplineId: string;
}

// Features:
// - Form validation with zod
// - Date picker for start/end
// - Category multi-select
// - Location autocomplete
// - Discipline dropdown
// - Auto-slug generation
// - Error handling with toast
```

### 1.4 EditEventDialog Component
**File:** `src/components/dashboard/events/EditEventDialog.tsx`

- Pre-populate form with existing event data
- Show event status with allowed transitions
- Division management section
- Round/bracket configuration

### 1.5 Delete Confirmation
**File:** `src/components/dashboard/events/DeleteEventDialog.tsx`

- Soft-delete with confirmation
- Show affected items (games, teams count)
- Archive option vs permanent delete

### 1.6 Events Page with RBAC
**File:** `src/app/(dashboard)/events/page.tsx`

```typescript
export default function EventsPage() {
  const { can } = usePermissions();

  // Only event_manager+ can see create button
  const canCreate = can('add_events');
  const canEdit = can('edit_events');
  const canDelete = can('delete_events');

  return (
    <>
      <PageHeader
        title="Events"
        action={canCreate && <CreateEventDialog />}
      />
      {/* Event cards with conditional edit/delete buttons */}
    </>
  );
}
```

---

## Sprint 2: Games Management Page

### 2.1 ScheduleGameDialog Component
**File:** `src/components/dashboard/games/ScheduleGameDialog.tsx`

```typescript
interface ScheduleGameForm {
  eventId: string;
  roundId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledTime: string;
  fieldLocationId?: string;
  allocatedTimeMinutes: number;
  scorekeeperId?: string;
}

// Features:
// - Event selection (filters teams/rounds)
// - Round selection within event
// - Team dropdowns (home vs away)
// - Date/time picker
// - Field selection from event locations
// - Duration input
// - Optional scorekeeper assignment
```

### 2.2 PlayerSelectionDialog for Scoring
**File:** `src/components/dashboard/games/PlayerSelectionDialog.tsx`

```typescript
interface PlayerSelectionProps {
  gameId: string;
  teamId: string;
  type: 'goal' | 'assist' | 'block' | 'turnover';
  onSelect: (playerId: string, minute: number, second: number) => void;
}

// Features:
// - Load roster for selected team
// - Search by player name/number
// - Quick select with jersey number
// - Time input (auto-filled from game timer)
// - Recent players shortcut
```

### 2.3 EditGameDialog Component
**File:** `src/components/dashboard/games/EditGameDialog.tsx`

- Reschedule game (time, field)
- Change scorekeeper
- Update teams (if not started)
- Status management

### 2.4 CancelGameDialog Component
**File:** `src/components/dashboard/games/CancelGameDialog.tsx`

- Reason input (required)
- Notify teams option
- Reschedule option

### 2.5 Games Page with RBAC
```typescript
// Permissions needed:
// - view_games: See games list (all users)
// - add_games: Schedule new games (event_manager+)
// - edit_games: Edit game details (event_manager+)
// - score_games: Record scores (scorekeeper+)
// - delete_games: Cancel games (event_manager+)
```

---

## Sprint 3: Teams Management Page

### 3.1 Create Authenticated Teams API Client
**File:** `src/lib/api/teams.ts`

```typescript
const teamsApi = {
  list: (params) => authFetch<Team[]>('/teams', { params }),
  get: (id) => authFetch<Team>(`/teams/${id}`),
  create: (data) => authFetch<Team>('/teams', { method: 'POST', body: data }),
  update: (id, data) => authFetch<Team>(`/teams/${id}`, { method: 'PUT', body: data }),
  delete: (id) => authFetch<void>(`/teams/${id}`, { method: 'DELETE' }),
  // Roster management
  getRoster: (id) => authFetch<Player[]>(`/teams/${id}/players`),
  addPlayer: (id, data) => authFetch<Player>(`/teams/${id}/players`, { method: 'POST', body: data }),
  removePlayer: (id, playerId) => authFetch<void>(`/teams/${id}/players/${playerId}`, { method: 'DELETE' }),
  updatePlayer: (id, playerId, data) => authFetch<Player>(`/teams/${id}/players/${playerId}`, { method: 'PUT', body: data }),
};
```

### 3.2 Backend: Add Missing Team Endpoints
**File:** `router.go`

```go
r.Route("/teams", func(r chi.Router) {
    r.Use(RequirePermission("manage_teams"))
    r.Post("/", opts.TeamHandler.CreateTeam)
    r.Put("/{id}", opts.TeamHandler.UpdateTeam)
    r.Delete("/{id}", opts.TeamHandler.DeleteTeam)
    // Roster management
    r.Get("/{id}/players", opts.TeamHandler.GetRoster)
    r.Post("/{id}/players", opts.TeamHandler.AddPlayer)
    r.Put("/{id}/players/{playerId}", opts.TeamHandler.UpdatePlayer)
    r.Delete("/{id}/players/{playerId}", opts.TeamHandler.RemovePlayer)
})
```

### 3.3 CreateTeamDialog Component
**File:** `src/components/dashboard/teams/CreateTeamDialog.tsx`

```typescript
interface CreateTeamForm {
  name: string;
  divisionPoolId: string;
  initialSeed?: number;
  logoUrl?: string; // Or file upload
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Features:
// - Logo upload with preview
// - Color picker for team colors
// - Division assignment
// - Initial seed input
// - Contact information
```

### 3.4 RosterManagementPanel Component
**File:** `src/components/dashboard/teams/RosterManagementPanel.tsx`

```typescript
// Features:
// - Player list with jersey numbers
// - Add player form (inline or dialog)
// - Edit player details
// - Remove player with confirmation
// - Captain/Spirit captain assignment
// - Import roster from CSV
// - Export roster
```

### 3.5 Teams Page with RBAC
```typescript
// Permissions:
// - view_teams: See teams (all users)
// - add_teams: Create teams (event_manager+)
// - edit_teams: Edit team details (team_manager for own team, event_manager+ for all)
// - manage_roster: Add/remove players (team_manager for own team)
// - delete_teams: Delete teams (event_manager+)
```

---

## Sprint 4: Admin Page (Complete Rewrite)

### 4.1 Create Admin API Client
**File:** `src/lib/api/admin.ts`

```typescript
const adminApi = {
  // User management
  listUsers: (params) => authFetch<User[]>('/admin/users', { params }),
  getUser: (id) => authFetch<User>(`/admin/users/${id}`),
  createUser: (data) => authFetch<User>('/admin/users', { method: 'POST', body: data }),
  updateUser: (id, data) => authFetch<User>(`/admin/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id) => authFetch<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUserRole: (id, role) => authFetch(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),

  // Audit logs
  listAuditLogs: (params) => authFetch<AuditLog[]>('/admin/audit-logs', { params }),

  // Score corrections
  listPendingScoreEdits: () => authFetch<ScoreEdit[]>('/admin/score-edits/pending'),
  approveScoreEdit: (id) => authFetch(`/admin/score-edits/${id}/approve`, { method: 'POST' }),
  rejectScoreEdit: (id, reason) => authFetch(`/admin/score-edits/${id}/reject`, { method: 'POST', body: { reason } }),

  // System
  getSystemHealth: () => authFetch('/admin/system/health'),
  exportData: (type, params) => authFetch(`/admin/export/${type}`, { params }),
};
```

### 4.2 Backend: Add Admin Endpoints
**File:** `router.go`

```go
r.Route("/admin", func(r chi.Router) {
    r.Use(RequireRole("admin"))

    // User management
    r.Get("/users", opts.AdminHandler.ListUsers)
    r.Post("/users", opts.AdminHandler.CreateUser)
    r.Get("/users/{id}", opts.AdminHandler.GetUser)
    r.Put("/users/{id}", opts.AdminHandler.UpdateUser)
    r.Delete("/users/{id}", opts.AdminHandler.DeleteUser)
    r.Put("/users/{id}/role", opts.AdminHandler.UpdateUserRole)

    // Audit logs
    r.Get("/audit-logs", opts.AdminHandler.ListAuditLogs)

    // Score corrections
    r.Get("/score-edits/pending", opts.AdminHandler.ListPendingScoreEdits)
    r.Post("/score-edits/{id}/approve", opts.AdminHandler.ApproveScoreEdit)
    r.Post("/score-edits/{id}/reject", opts.AdminHandler.RejectScoreEdit)

    // System
    r.Get("/system/health", opts.AdminHandler.GetSystemHealth)
    r.Get("/export/{type}", opts.AdminHandler.ExportData)
})
```

### 4.3 UserManagementTab Component
**File:** `src/components/dashboard/admin/UserManagementTab.tsx`

```typescript
// Features:
// - User table with pagination
// - Search/filter by name, email, role
// - Create user dialog
// - Edit user dialog
// - Role dropdown (admin, event_manager, team_manager, scorekeeper, spectator)
// - Activate/deactivate user
// - Delete user with confirmation
// - Last login display
```

### 4.4 AuditLogTab Component
**File:** `src/components/dashboard/admin/AuditLogTab.tsx`

```typescript
// Features:
// - Audit log table with pagination
// - Filter by action type, user, date range
// - Action details expand
// - Entity links (game, event, team)
// - Export filtered logs
```

### 4.5 ScoreEditApprovalTab Component
**File:** `src/components/dashboard/admin/ScoreEditApprovalTab.tsx`

```typescript
// Features:
// - Pending edits list
// - Before/after comparison
// - Requestor info
// - Reason display
// - Approve/reject buttons
// - Bulk actions
```

### 4.6 Admin Page with Guard
**File:** `src/app/(dashboard)/admin/page.tsx`

```typescript
export default function AdminPage() {
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return <AccessDenied message="Admin access required" />;
  }

  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="audit">Audit Log</TabsTrigger>
        <TabsTrigger value="scores">Score Edits</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>
      {/* Tab contents */}
    </Tabs>
  );
}
```

---

## Sprint 5: Analytics Page Fixes

### 5.1 Fix Authentication Header
**File:** `src/lib/api/analytics.ts`

```typescript
// ISSUE: Currently not including auth header
// FIX: Use authFetch instead of regular fetch

const analyticsApi = {
  query: async (question: string, userId: string) => {
    return authFetch('/analytics/query', {
      method: 'POST',
      body: { question, userId },
    });
  },
  // ... other methods with authFetch
};
```

### 5.2 Query Result Visualization
**File:** `src/components/dashboard/analytics/QueryResultView.tsx`

```typescript
// Features:
// - Detect result type (table, chart, number)
// - Render appropriate visualization
// - Table with sorting/filtering
// - Charts (bar, line, pie based on data)
// - Single stat display
// - Error state handling
```

### 5.3 Export Functionality
```typescript
// Features:
// - Export as CSV
// - Export as JSON
// - Export as PNG (charts)
// - Date range selection
// - Event filter
```

---

## Sprint 6: Settings Page Completion

### 6.1 Backend: Add User Settings Endpoints
**File:** `router.go`

```go
r.Route("/settings", func(r chi.Router) {
    r.Get("/profile", opts.UserHandler.GetProfile)
    r.Put("/profile", opts.UserHandler.UpdateProfile)
    r.Put("/password", opts.UserHandler.ChangePassword)
    r.Get("/sessions", opts.UserHandler.ListSessions)
    r.Delete("/sessions/{id}", opts.UserHandler.RevokeSession)
    r.Get("/notifications", opts.UserHandler.GetNotificationPrefs)
    r.Put("/notifications", opts.UserHandler.UpdateNotificationPrefs)
})
```

### 6.2 ProfileSection Component
**File:** `src/components/dashboard/settings/ProfileSection.tsx`

```typescript
// Features:
// - Edit name (with validation)
// - Display email (read-only or with verification flow)
// - Avatar upload
// - Save with loading state
// - Success/error toast
```

### 6.3 PasswordChangeSection Component
**File:** `src/components/dashboard/settings/PasswordChangeSection.tsx`

```typescript
// Features:
// - Current password input
// - New password with requirements display
// - Confirm password
// - Strength indicator
// - Submit with validation
```

### 6.4 SessionManagementSection Component
**File:** `src/components/dashboard/settings/SessionManagementSection.tsx`

```typescript
// Features:
// - List active sessions
// - Device info (browser, OS, location)
// - Last active time
// - Current session badge
// - Revoke other sessions
// - Revoke all sessions
```

---

## Shared Components Needed

### Form Components
- `FormField` - Label + input + error display
- `DateTimePicker` - Date and time selection
- `ColorPicker` - Team color selection
- `FileUpload` - Logo/avatar upload
- `SearchableSelect` - Team/player selection
- `MultiSelect` - Categories selection

### Dialog Components
- `ConfirmDialog` - Reusable confirmation
- `FormDialog` - Dialog with form state management

### Table Components
- `DataTable` - Sortable, filterable, paginated
- `TablePagination` - Page navigation
- `TableFilters` - Filter controls

### Permission Components
- `PermissionGuard` - Wrap content that needs permission
- `RoleGuard` - Wrap content that needs specific role
- `CanRender` - Conditionally render based on permission

---

## File Structure

```
src/
├── app/(dashboard)/
│   ├── events/
│   │   └── page.tsx                    # Events list with CRUD
│   ├── games/
│   │   ├── page.tsx                    # Games list with CRUD
│   │   └── [id]/page.tsx               # Game detail (existing)
│   ├── teams/
│   │   └── page.tsx                    # Teams list with CRUD
│   ├── admin/
│   │   └── page.tsx                    # Admin panel (rewritten)
│   ├── analytics/
│   │   └── page.tsx                    # Analytics (fixed)
│   └── settings/
│       └── page.tsx                    # Settings (completed)
├── components/dashboard/
│   ├── events/
│   │   ├── CreateEventDialog.tsx
│   │   ├── EditEventDialog.tsx
│   │   ├── DeleteEventDialog.tsx
│   │   └── EventStatusBadge.tsx
│   ├── games/
│   │   ├── ScheduleGameDialog.tsx
│   │   ├── EditGameDialog.tsx
│   │   ├── CancelGameDialog.tsx
│   │   └── PlayerSelectionDialog.tsx
│   ├── teams/
│   │   ├── CreateTeamDialog.tsx
│   │   ├── EditTeamDialog.tsx
│   │   ├── DeleteTeamDialog.tsx
│   │   └── RosterManagementPanel.tsx
│   ├── admin/
│   │   ├── UserManagementTab.tsx
│   │   ├── AuditLogTab.tsx
│   │   ├── ScoreEditApprovalTab.tsx
│   │   └── SystemHealthTab.tsx
│   ├── settings/
│   │   ├── ProfileSection.tsx
│   │   ├── PasswordChangeSection.tsx
│   │   └── SessionManagementSection.tsx
│   └── shared/
│       ├── ConfirmDialog.tsx
│       ├── FormDialog.tsx
│       ├── DataTable.tsx
│       └── PermissionGuard.tsx
└── lib/api/
    ├── events.ts                       # Events API client
    ├── teams.ts                        # Teams API client
    ├── admin.ts                        # Admin API client
    └── settings.ts                     # Settings API client
```

---

## Implementation Priority

1. **High Priority** (Core functionality)
   - Events CRUD (needed for tournament setup)
   - Games schedule/edit (needed for match management)
   - Player selection for scoring (needed for live games)

2. **Medium Priority** (Admin features)
   - Teams CRUD (can use existing read-only for now)
   - Admin user management
   - Analytics auth fix

3. **Lower Priority** (Polish)
   - Settings completion
   - Audit logs
   - Export functionality

---

## Testing Checklist

- [ ] Events: Create, edit, delete with proper permissions
- [ ] Games: Schedule, edit, cancel with proper permissions
- [ ] Games: Score recording with player selection
- [ ] Teams: Create, edit, delete with roster management
- [ ] Admin: User CRUD (admin only)
- [ ] Admin: Audit log viewing
- [ ] Analytics: Query with auth header
- [ ] Settings: Profile update, password change
- [ ] All pages: RBAC enforcement
- [ ] All forms: Validation and error handling
- [ ] All mutations: Optimistic updates with rollback