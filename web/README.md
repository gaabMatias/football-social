# analysis_core — Frontend

React + TypeScript SPA implementing the analysis_core design system. Talks to the
`social` service (Node/Fastify on port 3000) via REST and renders Vega-Lite charts
embedded in feed cards.

## Stack

| Layer        | Choice                                           |
|--------------|--------------------------------------------------|
| Framework    | React 18 + TypeScript (strict)                   |
| Routing      | React Router v6 (`createBrowserRouter`)          |
| Data fetching| TanStack Query v5 (`useInfiniteQuery` for feed)  |
| Charts       | `react-vega` (renders `summary_json.chart_spec`) |
| Styling      | Plain CSS with design-token CSS variables        |
| HTTP         | `axios` with bearer-token interceptor            |
| Dev server   | Vite, port `5173`                                |
| Production   | nginx, port `80` (multi-stage Docker build)      |

## Layout

```
src/
├── tokens/        # design tokens (colors, typography, spacing, radii, shadows)
├── styles/        # global.css (CSS variables, resets) + components.css
├── api/           # axios client + endpoint wrappers (auth/feed/analyses/admin)
├── hooks/         # useAuth, useFeed, useAnalysis, useAdmin
├── components/
│   ├── ui/        # atomic: Button, Input, Badge, Avatar, MetricCard, …
│   ├── feed/      # FeedCard, FeedList (infinite scroll)
│   ├── analysis/  # AnalysisDetail, AnalysisForm, VegaChart
│   ├── admin/     # TeamsTable, MembersTable
│   └── layout/    # Sidebar, AppLayout, ProtectedRoute
├── pages/         # LoginPage, FeedPage, AnalysisDetailPage, NewAnalysisPage, AdminPage
├── router.tsx     # route definitions
├── App.tsx        # providers (QueryClient, AuthProvider, RouterProvider)
└── main.tsx       # entry
```

## Development

```bash
npm install
cp .env.example .env       # set VITE_API_BASE_URL if needed
npm run dev                # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:3000` (the `social` service)
so the frontend can call the API without CORS configuration.

## Production

Build the static bundle and serve it with nginx via Docker:

```bash
docker build -t analysis-core-frontend .
docker run --rm -p 8080:80 analysis-core-frontend
```

In production the `nginx.conf` reverse-proxies `/api/*` to the `social` service.
The `VITE_API_BASE_URL` build arg defaults to `/api` so the bundled JS hits the
same origin.

## Adding a new component

1. Build the markup as a small React component under `src/components/ui/`.
2. Add CSS for it to `src/styles/components.css`, using CSS variables
   (`var(--accent)`, `var(--text-primary)`, `var(--radius-md)`, …).
3. Never hardcode hex colors — every color must come from a token.

## Quality checklist

- [x] All colors come from CSS variables
- [x] Typography uses `display` / `body` / `mono` per token
- [x] `FeedCard` renders gracefully with `summary_json: null`
- [x] `FeedCard` renders gracefully with `dashboard_url: null`
- [x] Infinite scroll loads next page via `IntersectionObserver`
- [x] Filter changes reset the query through TanStack Query keys
- [x] Login form validates and shows errors with `--error`
- [x] Protected routes redirect to `/login` when unauthenticated
- [x] Admin tables are scrollable on small viewports
- [x] All interactive elements have hover/focus states
- [x] Scrollbar is themed (`--bg-primary` track, `--border-default` thumb)
- [x] Vega charts use transparent background and dark-theme axis colors
