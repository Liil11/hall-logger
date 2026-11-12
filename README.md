# Hall Logger

Hall booking app: React + TypeScript + Vite + Tailwind frontend, PocketBase backend.

Routes:

- `/` — halls list
- `/halls/:id` — hall detail with its schedule list (admin can add/delete)
- `/login` — admin login (no registration in the frontend)

Public visitors can view halls and schedules. Hall management and schedule
controls appear only after admin login; app admin accounts are created from the
PocketBase dashboard.

## Layout

```
frontend/                       Vite app (React, TypeScript, Tailwind v4)
  src/
    components/                 shared UI (TopBar)
    pages/                      HallsPage, HallDetailPage, LoginPage
    hooks/                      useLocalStorage, useTasks
    services/                   PocketBase client and collection services
    types/                      shared types
    utils/                      date helpers
backend/
  bin/pocketbase                PocketBase 0.41.1 binary (gitignored)
  pb_data/                      runtime data (gitignored)
  pb_migrations/                schema migrations (committed)
  pb_hooks/                     JS hooks (committed)
graphify-out/                   generated knowledge graph (gitignored)
```

## Setup

Dependencies are already installed. Fresh clone:

```bash
npm --prefix frontend install
```

## Run

Two terminals:

```bash
npm run dev:pb     # PocketBase on http://127.0.0.1:8090
npm run dev:web    # Vite on http://localhost:5173
```

PocketBase dashboard: http://127.0.0.1:8090/_/

Vite proxies `/api` to PocketBase, so the SDK can use a relative base URL.

## Commands

| Command               | Does                                  |
| --------------------- | ------------------------------------- |
| `npm run dev:web`     | Start Vite dev server                 |
| `npm run dev:pb`      | Start PocketBase with dev logging     |
| `npm run build`       | Type-check and build frontend         |
| `npm run lint`        | Lint frontend                         |
| `npm run pb:migrate`  | Apply pending PocketBase migrations   |
| `npm run pb:update`   | Update PocketBase binary              |

## Schema

`backend/pb_migrations` creates:

- `admins` — auth collection for the app admin. Seeded account:
  `admin@hall.local` / `halllogger123`. Change the password after first login.
  PocketBase superusers (dashboard) are separate.
- `halls` — bookable places: `name` (unique), `color`.
- `bookings` — `title`, `hall` (relation), `dateKey` (`YYYY-MM-DD`), `start` and
  `end` (`HH:MM`). Seeded halls: Aula A, Aula B.

Anyone can read halls and bookings (calendar is public). Only authenticated
`admins` records can create, update, or delete. The overlap rule lives in
`backend/pb_hooks/bookings.pb.js`: two bookings for the same hall and date cannot
have intersecting `[start, end)` intervals, and `end` must be after `start`.
Adjacent slots (10:00-13:00 then 13:00-15:00) are allowed.

Admins can manage halls and schedules from the app UI after login. Admin
accounts themselves are created from the PocketBase dashboard.
