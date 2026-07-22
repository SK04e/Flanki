# Flanki Hub — UI/UX Prototype

A mobile-first, single-page interactive prototype for **Flanki Hub**, a companion
app for organizing, managing and tracking matches of a team-based outdoor student
game. Built with **React + TypeScript + Vite**, **Tailwind CSS**, shadcn-style UI
primitives and **lucide-react** icons.

The prototype runs entirely on mock data whose shapes and field names mirror the
Flask API in this repo (see `src/lib/types.ts` and `src/lib/mock-data.ts`).

## Getting started

```bash
cd flanki-hub
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # typecheck + production build
npm run lint     # oxlint
```

## Features / screens

- **Auth & onboarding** — login, register (with university → faculty reveal),
  forgot password, set new password.
- **Dashboard** — global stats bar, "Become a Host" create-game card with GPS /
  city location picker, and an accordion games browser with a 4-digit PIN join
  modal.
- **Lobby (core)** — glowing invite PIN, Faceit-style team columns
  (Unassigned / BLUE / RED), host controls (lock, mode toggle, shuffle, kick,
  start, destroy) and player controls (join team, leave).
- **Active game** — live timer, locked rosters, host result reporting and a
  full-screen match-summary overlay with countdown.
- **Leaderboard** — university/faculty filters, ranked table with gold/silver/
  bronze highlights and clickable public profiles.
- **Profile** — stat grid, match history table (WIN/LOSS verdicts), rules and
  achievements modals, account settings.

Navigation uses a state-driven **Bottom Tab Navigator** (Search / Lobby /
Leaderboard / Profile). All confirmations use custom modal overlays instead of
native browser dialogs.

## Structure

```
src/
├── components/
│   ├── ui/         # shadcn-style primitives (button, card, input, select, ...)
│   ├── screens/    # top-level screens
│   ├── modals/     # PIN, location, public profile, rules, achievements
│   └── bottom-nav.tsx
├── lib/
│   ├── types.ts    # types mirroring the Flask API
│   ├── mock-data.ts
│   ├── constants.ts
│   ├── display.ts
│   └── utils.ts
└── App.tsx         # app shell + state wiring
```

## Data shapes

Types intentionally use the backend field names verbatim (`game_id`, `host_id`,
`players_count`, `is_locked`, `game_mode`, `is_location_exact`, `winning_team`,
etc.), including the Polish keys of the match-history payload
(`"ID gry"`, `"Twoja drużyna"`, `"zwyciezcy"`, `"Status gry"`). The `SHUFFLE`
game mode is displayed as **Random** in the UI, matching the product copy.
