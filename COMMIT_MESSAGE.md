feat: initial implementation of Airport Operations Management System

This commit introduces a production-grade frontend application for managing
airport operations with a modern, enterprise-grade UI and comprehensive
feature set.

## Architecture & Tech Stack

- **Framework**: React 19 + TypeScript with TanStack Start
- **Routing**: TanStack Router with file-based routing, nested layouts, and route guards
- **Data Fetching**: TanStack Query v5 with optimistic updates and cache invalidation
- **HTTP Client**: Axios with interceptors for auth tokens, 401 refresh, and error normalization
- **State Management**: Zustand for global UI state (auth, selected organization)
- **Forms**: React Hook Form + Zod for schema validation
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui components (Button, Input, Select, Dialog, Badge, etc.)
- **Icons**: Lucide React
- **Charts**: Recharts for reports and analytics
- **Notifications**: Sonner for toast notifications
- **Command Palette**: cmdk for quick navigation

## Design System

Implemented comprehensive design system with CSS variables:

- **Colors**: Dark/light mode support with semantic color tokens
  - Primary: Indigo-600 (#4F46E5)
  - Secondary: Emerald-500 (#10B981)
  - Accent: Amber-500 (#F59E0B)
  - Status colors: Danger, Warning, Success, Info
- **Typography**: Inter for UI, JetBrains Mono for code/metadata
- **Spacing**: 4px scale with consistent component padding
- **Radius**: 12px default, 9999px for pills
- **Shadows**: Subtle elevation with focus rings for accessibility
- **Motion**: 150-200ms ease-out transitions

## Core Infrastructure

### Authentication System
- Login/logout flow with JWT token management
- Automatic token refresh on 401 responses
- Route guards with SSR-safe token checking
- Auth store with localStorage persistence
- Protected routes with redirect to login

### API Client
- Centralized Axios instance with base URL configuration
- Request interceptor for attaching auth tokens
- Response interceptor for 401 handling and token refresh
- Error normalization with detailed error messages
- Support for various backend response shapes

### App Shell
- Top header with organization switcher, global search, notifications, user menu
- Left navigation sidebar with RBAC-aware menu visibility
- Theme toggle (dark/light mode)
- Responsive layout with mobile sidebar toggle
- Organization context persistence

### Routing
- File-based routing with TanStack Router
- Nested route layouts
- Route guards with `beforeLoad` hooks
- SSR-safe authentication checks
- Deep linking support for detail pages

## Implemented Modules

### Dashboard (`/`)
- KPI cards showing key metrics
- Latest documents widget
- Quick action links
- Upcoming certifications
- Attendance summary
- Real-time data integration

### Authentication (`/auth`)
- **Login**: Email/password form with validation, error handling, toast notifications
- **Register**: Stubbed route for future implementation

### Organizations (`/organizations`)
- Full CRUD operations (Create, Read, Update, Delete)
- List view with pagination
- Organization detail page
- Edit organization page
- Organization creation form
- API integration with TanStack Query hooks
- Organization switcher in App Shell

### Documents (`/documents`)
- Document registry with filtering (status, type, direction)
- Document list with pagination
- Document detail page with workflow timeline
- Workflow actions: forward, return, approve, reject
- Status tracking with visual timeline
- File upload support (stubbed)
- Integration with document workflow API

### Departments (`/departments`)
- Hierarchical tree view of departments
- Head of Department (HOD) assignment/removal
- Department creation and management
- Tree navigation with expand/collapse
- HOD badge indicators

### Attendance (`/attendance`)
- Geofence-based check-in/check-out
- Real-time attendance status display
- Geolocation API integration
- Attendance history with date filtering
- Geofence zone display
- Check-in/out buttons with location validation
- Attendance summary statistics

### Certifications (`/certifications`)
- Certification type management (admin)
- Employee certifications list
- Certification type creation dialog
- Expiry tracking with visual badges
- Renewal workflow (stubbed)
- Certification upload support (stubbed)

### Reports (`/reports`)
- Document flow analytics
- Attendance summary charts
- Recharts integration for data visualization
- Export functionality (stubbed)

## Stubbed Routes (Future Implementation)

- **Messages** (`/messages`): Split pane conversation list + thread
- **Tasks** (`/tasks`): List view and quick editor, optional kanban
- **Inspections** (`/inspections`): Template builder, fill-and-submit UI
- **Stakeholders** (`/stakeholders`): Airlines, vendors, regulatory submissions
- **RGM** (`/rgm`): Role-specific KPIs and actions
- **Security** (`/security`): ACOS announcements and management
- **Admin** (`/admin`): Global dashboard, RBAC management, system settings

## Reusable UI Components

Created comprehensive component library:

- **Button**: Multiple variants (default, outline, ghost, destructive)
- **Input**: Text input with label support
- **Select**: Dropdown select with search
- **Textarea**: Multi-line text input
- **Badge**: Status and category badges
- **StatusPill**: Colored status indicators
- **Dialog**: Modal dialogs with header/footer
- **ConfirmDialog**: Confirmation dialogs for destructive actions
- **Tooltip**: Hover tooltips
- **Timeline**: Workflow timeline component
- **Switch**: Toggle switches
- **Slider**: Range sliders
- **Toaster**: Toast notification system

## Features

### Command Palette
- Global command palette (Cmd/Ctrl+K)
- Quick navigation to all routes
- Entity creation shortcuts
- Keyboard-first navigation

### RBAC (Role-Based Access Control)
- Menu visibility based on user roles
- Route guards for role-specific pages
- Support for roles: RGM, ACOS, SUPER_ADMIN
- Dynamic navigation filtering

### Error Handling
- Global error boundary
- Route-level error components
- API error normalization
- User-friendly error messages
- Toast notifications for mutations

### Loading States
- Skeleton loaders for initial loads
- Loading indicators for queries
- Optimistic UI updates for mutations
- TanStack Query loading states

### Data Management
- TanStack Query hooks for all API interactions
- Optimistic updates for mutations
- Cache invalidation strategies
- Query key organization by resource
- Background refetching

## Developer Experience

- **TypeScript**: Full type safety across the application
- **OpenAPI Integration**: Type generation script for API types
- **DevTools**: TanStack Router and Query devtools
- **Linting**: Biome for formatting and linting
- **Hot Reload**: Vite dev server with HMR
- **Path Aliases**: `@/` alias for `src/` directory

## File Structure

```
src/
├── api/              # Axios API clients by resource
├── components/       # Reusable UI components
│   ├── layout/      # AppShell and layout components
│   ├── theme/       # Theme toggle
│   └── ui/          # shadcn/ui components
├── hooks/           # TanStack Query hooks
├── routes/          # File-based routes
├── stores/          # Zustand stores (auth, ui)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Configuration

- **Vite**: Build tool with React plugin
- **Tailwind CSS**: v4 with CSS variables
- **Biome**: Code formatting and linting
- **TypeScript**: Strict mode enabled
- **OpenAPI**: Type generation from `openapi.json`

## Notes

- All routes include SSR-safe authentication guards
- API client handles various backend response shapes
- Theme system supports dark/light mode switching
- Organization context persists across sessions
- Token refresh logic handles 401 responses automatically
- Error boundaries provide graceful error handling

This initial commit establishes the foundation for a production-ready airport
operations management system with a modern tech stack and comprehensive
feature set.

