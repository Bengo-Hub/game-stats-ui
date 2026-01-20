# Frontend Sprint 3: Real-time & Advanced Features

**Duration**: 2-3 weeks
**Focus**: SSE integration, timers, brackets, analytics, admin

---

## Sprint Goals

- ✅ Real-time score updates via SSE
- ✅ Game timer with countdown
- ✅ Tournament brackets visualization
- ✅ AI analytics with Tremor charts
- ✅ Spirit scores interface
- ✅ Admin dashboard

---

## Tasks

### Week 1: Real-time & Timers

#### Day 1-3: SSE Integration
- [ ] Create SSE hook:
  ```tsx
  function useGameStream(gameId: string) {
    const [gameState, setGameState] = useState();
    
    useEffect(() => {
      const eventSource = new EventSource(`/api/games/${gameId}/stream`);
      // Handle events
    }, [gameId]);
  }
  ```
- [ ] Handle SSE events (goal_scored, game_started, etc.)  
- [ ] Update UI optimistically
- [ ] Add reconnection logic
- [ ] Show connection status

**Deliverable**: Live updates

---

#### Day 4-6: Game Timer
- [ ] Build timer display component
- [ ] Implement countdown logic
- [ ] Show stoppages
- [ ] Add timer controls (start/pause/end)
- [ ] Display game status badges  
- [ ] Add time-based notifications

**Deliverable**: Game timer

---

### Week 2: Brackets & Analytics

#### Day 7-10: Tournament Brackets
- [ ] Fetch bracket data from API
- [ ] Create bracket visualization:
  - Tree structure
  - Match cards
  - Team names and scores
  - Status indicators
- [ ] Make brackets responsive
- [ ] Add zoom/pan functionality
- [ ] Support different bracket types

**Deliverable**: Bracket visualization

---

#### Day 11-15: Analytics Dashboard
- [ ] Build analytics page
- [ ] Create natural language query input
- [ ] Integrate with Tremor charts:
  - BarChart for top scorers
  - LineChart for trends
  - DonutChart for distributions
- [ ] Embed Metabase dashboards via iframe
- [ ] Add saved queries
- [ ] Build export functionality

**Deliverable**: Analytics features

---

### Week 3: Spirit Scores & Admin

#### Day 16-18: Spirit Scores
- [ ] Create spirit score form
- [ ] Build spirit leaderboard
- [ ] Show MVP nominations
- [ ] Add spirit score history

**Deliverable**: Spirit interface

---

#### Day 19-21: Admin Features
- [ ] Build admin dashboard
- [ ] Add score editing UI with audit trail
- [ ] Create user management
- [ ] Add bulk operations
- [ ] Build data export tools

**Deliverable**: Admin panel

---

**Next**: [Frontend Sprint 4: PWA & Polish](./FRONTEND_SPRINT_4.md)
