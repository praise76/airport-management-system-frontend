# NAMS: Airport Operations Management System (frontend)

The web app for running airport operations at Murtala Muhammed International Airport (MMIA), Lagos.
It has two parts:

- **Staff app** for FAAN staff: dashboard, documents and registry, duty rosters, attendance with
  geofenced check-in, leave and shift swaps, stakeholder management, inventory, inspections and reports.
- **Stakeholder portal** (`/stakeholder/...`) for airlines, concessionaires, contractors and vendors:
  registration, access permits, activities and invoices.

A user signed in to one part cannot open the other. The check lives in `src/routes/__root.tsx`.

## Running it

```bash
pnpm install
cp .env.example .env.local   # then set VITE_API_BASE_URL
pnpm dev                     # http://localhost:3011
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API, e.g. `https://<backend-host>/api`. Uploaded files and the live-update socket use the same server. |
| `VITE_API_URL` | Optional. Only set it if the live-update socket runs on a different server from the API. |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build into `dist/client` (deployed by Vercel, see `vercel.json`) |
| `pnpm check` | Lint and format check (Biome) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm generate:api` | Regenerate API types from `openapi.json` |

## How the code is organised

- `src/routes/`: one file per page (TanStack Router file-based routing). `routeTree.gen.ts` is generated, so don't edit it.
- `src/api/`: functions that call the backend, one file per area.
- `src/hooks/`: React Query hooks wrapping those API calls.
- `src/features/` and `src/components/`: screen sections and shared UI (shadcn/ui).
- `src/lib/access.ts`: role groups and route guards. Use `requireStaff(ROLE_GROUPS.x)` in a route's
  `beforeLoad` to limit a page to certain roles.
- `docs/`: module notes for each feature area.

## Tech

React 19, TypeScript, Vite, TanStack Router and Query, Tailwind CSS v4, shadcn/ui, Zustand, React Hook Form with Zod.
