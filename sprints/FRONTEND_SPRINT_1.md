# Frontend Sprint 1: Foundation & Design System

**Duration**: 2 weeks
**Focus**: Next.js setup, design system, authentication UI, layout

---

## Sprint Goals

- ✅ Next.js 15 + React 19 project setup
- ✅ Design system with shadcn/ui + Tailwind
- ✅ Authentication UI (login, register)
- ✅ Layout components and navigation
- ✅ Feature-based folder structure
- ✅ PWA foundation

---

## Tasks

### Week 1: Project Setup & Design System

#### Day 1-2: Project Initialization
- [x] Initialize Next.js 15 project:
  ```bash
  npx create-next-app@latest game-stats-ui --typescript --tailwind --app
  ```
- [x] Install dependencies:
  - shadcn/ui
  - Zustand
  - React Hook Form + Zod
  - next-pwa
  - Tremor (for charts later)
- [x] Configure folder structure:
  ```
  app/
  ├── (auth)/
  ├── (dashboard)/
  ├── api/
  components/
  ├── ui/
  ├── features/
  ├── layout/
  lib/
  stores/
  ```
- [ ] Set up environment variables
- [ ] Configure TypeScript strict mode

**Deliverable**: Configured Next.js project (Initialized)

---

#### Day 3-5: Design System
- [ ] Install shadcn/ui components:
  ```bash
  npx shadcn@latest add button card input label ...
  ```
- [ ] Create design tokens in `globals.css`:
  - Color palette
  - Typography scale
  - Spacing system
  - Border radius
  - Shadows
- [ ] Build base components:
  - Button variants (primary, secondary, outline, ghost)
  - Input fields
  - Cards
  - Badges
  - Avatars
- [ ] Create Typography component
- [ ] Build loading skeletons
- [ ] Add dark mode support

**Deliverable**: Complete design system

---

### Week 2: Authentication & Layout

#### Day 6-7: Authentication UI
- [ ] Create auth pages:
  - `app/(auth)/login/page.tsx`
  - `app/(auth)/register/page.tsx`
  - `app/(auth)/forgot-password/page.tsx`
- [ ] Build auth forms with React Hook Form:
  ```tsx
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  ```
- [ ] Create auth store (Zustand):
  ```tsx
  interface AuthStore {
    user: User | null;
    login: (credentials) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
  }
  ```
- [ ] Implement API client for auth endpoints
- [ ] Add form validation and error handling
- [ ] Create protected route wrapper

**Deliverable**: Complete auth flow

---

#### Day 8-10: Layout Components
- [ ] Build main layout:
  - Header with navigation
  - Sidebar
  - Footer
  - Breadcrumbs
- [ ] Create navigation menu:
  - Dashboard
  - Events
  - Games
  - Teams
  - Players
  - Analytics
- [ ] Build user menu dropdown
- [ ] Add mobile responsive nav
- [ ] Create page templates:
  - List view template
  - Detail view template
  - Form template
- [ ] Implement loading states

**Deliverable**: Complete layout system

---

## Definition of Done

✅ Next.js 15 + React 19 running  
✅ Design system implemented  
✅ Authentication UI complete  
✅ Layout and navigation functional  
✅ TypeScript strict mode passing  
✅ Responsive design working  
✅ Dark mode support  

---

**Next**: [Frontend Sprint 2: Core Features](./FRONTEND_SPRINT_2.md)
