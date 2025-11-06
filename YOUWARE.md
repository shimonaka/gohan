# Project Overview

## Technology Stack
- React 19 + TypeScript
- Vite 7 for build tooling
- Custom design system in `src/design-system.css`
- React Router DOM 7 for page routing
- ESLint 9 configuration for linting

## Common Commands
- `npm run dev` — start Vite development server
- `npm run build` — run TypeScript project references build then Vite production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint across the repository

## Application Architecture
- `src/main.tsx` mounts React with `App` and imports the design system styles
- `src/App.tsx` renders the layout shell using `.app-shell`/`.app-main` classes
- `src/components/Navigation.tsx` renders the header navigation using the design system chip UI
- `src/data/menuData.ts` defines the menu library (`MENU_LIBRARY`) with metadata (id/category/ingredients) and exposes helper constants
- `src/utils/planner.ts` contains meal-planning logic: fridge-aware plan generation, coverage scoring, shopping list state syncing and persistence (localStorage)
- Screens in `src/screens/` consume planner helpers to render the UI flows:
  - `InitialSetupScreen` introduces the workflow and navigational steps
  - `RefrigeratorScreen` manages localStorage-backed ingredient inventory
  - `MenuSuggestionScreen` derives weekly plans from fridge items, shows coverage metrics, and exposes regenerate actions
  - `ShoppingListScreen` loads planner state to display auto/manual shopping lists, supports manual additions, and synchronises with menu suggestions
- Local persistence relies on localStorage keys:
  - `refrigeratorItems`
  - `weeklyMealPlan`
  - `shoppingListState`

## Styling & Design System
- `src/index.css` now simply imports `design-system.css`; avoid re-introducing Tailwind utilities
- `design-system.css` exposes tokens (colors, shadows, radii) and utility classes for cards, plan summaries, shopping lists, etc. Reuse existing semantic class names when extending UI

## Build Artifacts
- Production bundles output to `dist/`; hashed asset names (`index-*.css`/`index-*.js`) are generated on build
- The project is frontend-only with no backend deployment requirements