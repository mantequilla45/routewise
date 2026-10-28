# RouteWise

Jeepney route finder for commuters in the Philippines. Three projects in one repo, no workspace
linking: each has its own `package.json`, lockfile and `node_modules`.

| Folder     | What                                 | Stack                      | Deploy        |
| ---------- | ------------------------------------ | -------------------------- | ------------- |
| `app/`     | Mobile app, frontend only            | Expo (React Native), TS    | EAS           |
| `backend/` | API the mobile app talks to          | Hono on Node, pg, Supabase | Vercel (sin1) |
| `admin/`   | Admin dashboard, frontend only       | Next.js, TS                | Vercel        |
| `docs/`    | Design docs, presentation, task list | Markdown                   | –             |

Database and auth are Supabase. Neither frontend holds server secrets: every data request from
`app/` and `admin/` goes through `backend/`. Admin uses Supabase Auth in the browser (public key
only) to sign in, then sends that session token to the backend, which checks `users.is_admin`. `backend/db/` has the SQL for the PostGIS functions.

## Commands

Run from the repo root (needs `pnpm install` here once for Prettier):

```bash
pnpm format        # Prettier, whole repo
pnpm lint          # ESLint in all three projects
pnpm typecheck     # tsc in all three projects
pnpm check         # all of the above, what CI should run
```

Per project: `pnpm dev` (backend), `pnpm dev` (admin), `pnpm ios` / `pnpm android` / `pnpm start`
(app). Each project README has setup steps and env vars; copy `.env.example` to `.env`.

## Conventions

**Formatting.** Prettier owns it: 2 spaces, single quotes, semicolons, 100 columns. Don't hand-format;
run `pnpm format` or enable format-on-save (`.vscode/settings.json` does this).

**TypeScript.** `strict` everywhere. No `any`; use `unknown` and narrow, or type the shape. Validate
request bodies at the edge (route handlers) and keep services typed.

**Logging.** No `console.log` in committed code. `console.warn`/`console.error` for real failures.
Backend request-time output goes through a logger in `src/lib` (to be added) so it can be
leveled; until then, keep it to warn/error.

**Imports.** `@/` alias in `app/` and `admin/`. Relative paths only in `backend/` (Vercel's
builder doesn't rewrite aliases). Don't add `"type": "module"` to the backend.

**Naming.** Components `PascalCase.tsx`, everything else `camelCase.ts`. Route files follow
expo-router / Next conventions. No version suffixes in names (`calculateRoutes`, not
`calculateRoutesV2`); if something is replaced, delete the old one.

**Files.** Keep screens and pages under ~300 lines; pull data-fetching into `lib/`/`services/`
and UI pieces into `components/`. Delete dead code instead of commenting it out; git has it.

**Backend.** Routes in `src/routes/` validate input and call `src/services/`. Throw `HttpError`
from services for non-500 responses. Protected routes use `requireAuth`, which sets `profile`
(the `users` table row; its `id` is the app user id, not the Supabase auth uid).

**Admin.** `src/lib/api.ts` is the only place that calls the backend; admin-only endpoints live
under `/admin/*` behind `requireAdmin`. Don't add Next.js API routes or database access to admin.

**Mobile.** `lib/api.ts` is the only place that calls the backend. Add new endpoints there with
types, then use `api.*` from screens. Auth state lives in `context/auth.tsx`.

**Git.** Work directly on `main` while in development. Never commit `.env` files or emulator
bug reports (both gitignored).
