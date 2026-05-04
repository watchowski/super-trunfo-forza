# Super Trunfo Vertical MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first vertical playable Super Trunfo MVP: a Next.js/TypeScript app with tested game rules, sample complete car data, premium card UI, local room flow, and clear seams for Supabase sync and the full Forza Wiki importer.

**Architecture:** Start with pure TypeScript domain modules for cards, game state, deterministic rule resolution, and import validation, then layer React UI on top. Use sample data first so the game is playable before the networked Supabase implementation and full scraper are expanded in follow-up tasks.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, CSS Modules or global CSS, Supabase client types prepared but not required for local play in this vertical slice.

---

## Scope Note

The approved design covers multiple subsystems: web game, realtime rooms, Supabase persistence/storage, scraper/importer, dataset sync, deployment, documentation, and visual polish. This plan implements the first vertical slice that proves the product and rules end to end with sample data. After this plan passes, create follow-up plans for:

- Full Forza Wiki scraper and image download/storage.
- Supabase schema, realtime room sync, and Vercel deployment.
- Full catalog import, diff approval workflow, and storage sync.

This plan still keeps file boundaries and names aligned with those later phases.

## Planned File Structure

- `package.json` - project scripts and dependencies.
- `next.config.ts` - Next.js image config.
- `tsconfig.json` - TypeScript config.
- `vitest.config.ts` - Vitest config.
- `src/app/layout.tsx` - root layout.
- `src/app/page.tsx` - host/create/join entry screen.
- `src/app/room/[code]/page.tsx` - room route.
- `src/app/globals.css` - global premium game UI styling.
- `src/domain/cards.ts` - card and stat types.
- `src/domain/game.ts` - game-state types.
- `src/domain/game-engine.ts` - pure game rule functions.
- `src/domain/import-validation.ts` - sample import/card validation rules.
- `src/domain/i18n.ts` - translation dictionary and helpers.
- `src/data/sample-cards.ts` - complete sample cards for local play.
- `src/lib/room-store.ts` - browser-local room state store with a future Supabase-shaped interface.
- `src/components/CardView.tsx` - premium card rendering.
- `src/components/LanguageSelect.tsx` - per-player language selector.
- `src/components/RulesModal.tsx` - short rules modal.
- `src/components/LobbyView.tsx` - lobby and deck-size setup.
- `src/components/GameView.tsx` - match UI and round flow.
- `src/components/ResultView.tsx` - final result and rematch.
- `src/components/SoundToggle.tsx` - mute/unmute UI and simple sound trigger hook.
- `src/components/RoomApp.tsx` - route-level client orchestrator.
- `src/tests/game-engine.test.ts` - core game rule tests.
- `src/tests/import-validation.test.ts` - data validation tests.
- `src/tests/room-store.test.ts` - local room flow tests.
- `README.md` - setup, test, vertical-slice notes, and follow-up implementation map.

---

### Task 1: Scaffold Next.js TypeScript Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create project scripts and dependencies**

Create `package.json`:

```json
{
  "name": "super-trunfo-forza",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.4",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.3.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.3",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react": "^4.4.1",
    "eslint": "^9.25.1",
    "eslint-config-next": "^15.3.1",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.3",
    "vitest": "^3.1.2"
  }
}
```

- [ ] **Step 2: Create TypeScript and test config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: []
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 3: Create Next config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.nocookie.net" },
      { protocol: "https", hostname: "**.wikia.nocookie.net" },
      { protocol: "https", hostname: "**.fandom.com" }
    ]
  }
};

export default nextConfig;
```

- [ ] **Step 4: Create root layout and initial home**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Trunfo Forza",
  description: "Two-player Super Trunfo inspired by Forza Horizon cars"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Super Trunfo Forza Horizon</p>
        <h1>Crie uma sala e dispute carta por carta.</h1>
        <Link className="primaryAction" href="/room/new">
          Criar sala
        </Link>
      </section>
    </main>
  );
}
```

Create `src/app/globals.css` with a minimal reset that will be expanded in Task 7:

```css
:root {
  color-scheme: dark;
  --bg: #090b10;
  --panel: #111620;
  --line: rgba(255, 255, 255, 0.12);
  --text: #f4f7fb;
  --muted: #9ca8b8;
  --accent: #d5b66a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

a {
  color: inherit;
}

button,
input,
select {
  font: inherit;
}

.shell {
  width: min(1120px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.hero {
  min-height: 80vh;
  display: grid;
  align-content: center;
  gap: 20px;
}

.eyebrow {
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero h1 {
  max-width: 720px;
  margin: 0;
  font-size: clamp(2.4rem, 8vw, 5.5rem);
  line-height: 0.95;
  letter-spacing: 0;
}

.primaryAction {
  width: fit-content;
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 12px 18px;
  background: var(--accent);
  color: #12100a;
  font-weight: 800;
  text-decoration: none;
}
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 6: Run initial build check**

Run: `npm run build`

Expected: Next.js builds successfully.

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json vitest.config.ts src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: scaffold Next.js Super Trunfo app"
```

---

### Task 2: Add Domain Types And Sample Cards

**Files:**
- Create: `src/domain/cards.ts`
- Create: `src/domain/game.ts`
- Create: `src/data/sample-cards.ts`

- [ ] **Step 1: Create card domain types**

Create `src/domain/cards.ts`:

```ts
export type ComparableStat = "sp" | "ha" | "ac" | "ls" | "br";
export type DisplayStat = ComparableStat | "pl";
export type PlayerId = "host" | "guest";
export type Language = "pt-BR" | "en";

export type PerformanceClass = "D" | "C" | "B" | "A" | "S1" | "S2" | "X";

export interface PowerLevel {
  class: PerformanceClass;
  pi: number;
  label: string;
}

export interface CarStats {
  sp: number;
  ha: number;
  ac: number;
  ls: number;
  br: number;
  pl: PowerLevel;
}

export interface SourceInfo {
  game: "FH1" | "FH2" | "FH3" | "FH4" | "FH5" | "FH6";
  carPageUrl: string;
  imageSourceUrl: string;
}

export interface Card {
  id: string;
  normalizedName: string;
  name: string;
  manufacturer: string;
  year: number;
  country?: string;
  imageUrl: string;
  stats: CarStats;
  source: SourceInfo;
  isSuperTrunfo: boolean;
}

export const COMPARABLE_STATS: ComparableStat[] = ["sp", "ha", "ac", "ls", "br"];
```

- [ ] **Step 2: Create game-state types**

Create `src/domain/game.ts`:

```ts
import type { Card, ComparableStat, Language, PlayerId } from "./cards";

export type RoomPhase = "lobby" | "playing" | "revealed" | "finished";
export type FinishReason = "cards" | "abandonment" | "mutual";

export interface Player {
  id: PlayerId;
  nickname: string;
  language: Language;
  connectedAt: number;
  disconnectedAt?: number;
  wantsToEnd: boolean;
}

export interface RoundResult {
  attribute: ComparableStat;
  hostCard: Card;
  guestCard: Card;
  winner: PlayerId | "tie";
  reason: "attribute" | "super-trunfo" | "super-trunfo-attribute";
  pileSize: number;
}

export interface MatchResult {
  winner: PlayerId | "draw";
  reason: FinishReason;
}

export interface GameState {
  phase: RoomPhase;
  code: string;
  host?: Player;
  guest?: Player;
  activePlayer: PlayerId;
  decks: Record<PlayerId, Card[]>;
  tiePile: Card[];
  lastRound?: RoundResult;
  result?: MatchResult;
  maxDeckSize: number;
  selectedDeckSize: number;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 3: Create complete sample cards**

Create `src/data/sample-cards.ts`:

```ts
import type { Card } from "@/domain/cards";

export const sampleCards: Card[] = [
  {
    id: "2013-dodge-srt-viper-gts",
    normalizedName: "2013 dodge srt viper gts",
    name: "2013 Dodge SRT Viper GTS",
    manufacturer: "Dodge",
    year: 2013,
    country: "United States",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/8/82/FH1_Dodge_Viper_13.png",
    stats: { sp: 8.5, ha: 7.8, ac: 8.7, ls: 7.2, br: 7.6, pl: { class: "S1", pi: 834, label: "S1 834" } },
    source: { game: "FH1", carPageUrl: "https://forza.fandom.com/wiki/2013_Dodge_SRT_Viper_GTS", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/8/82/FH1_Dodge_Viper_13.png" },
    isSuperTrunfo: true
  },
  {
    id: "2014-lamborghini-huracan-lp-610-4",
    normalizedName: "2014 lamborghini huracan lp 610-4",
    name: "2014 Lamborghini Huracan LP 610-4",
    manufacturer: "Lamborghini",
    year: 2014,
    country: "Italy",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/3/37/FH2_Lamborghini_Huracan.png",
    stats: { sp: 8.3, ha: 8.1, ac: 9.0, ls: 9.4, br: 8.2, pl: { class: "S1", pi: 841, label: "S1 841" } },
    source: { game: "FH2", carPageUrl: "https://forza.fandom.com/wiki/2014_Lamborghini_Huracan_LP_610-4", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/3/37/FH2_Lamborghini_Huracan.png" },
    isSuperTrunfo: true
  },
  {
    id: "2016-lamborghini-centenario-lp-770-4",
    normalizedName: "2016 lamborghini centenario lp 770-4",
    name: "2016 Lamborghini Centenario LP 770-4",
    manufacturer: "Lamborghini",
    year: 2016,
    country: "Italy",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/d/de/FH3_Lamborghini_Centenario.png",
    stats: { sp: 8.7, ha: 8.9, ac: 9.4, ls: 9.6, br: 9.2, pl: { class: "S2", pi: 911, label: "S2 911" } },
    source: { game: "FH3", carPageUrl: "https://forza.fandom.com/wiki/2016_Lamborghini_Centenario_LP_770-4", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/d/de/FH3_Lamborghini_Centenario.png" },
    isSuperTrunfo: true
  },
  {
    id: "2018-mclaren-senna",
    normalizedName: "2018 mclaren senna",
    name: "2018 McLaren Senna",
    manufacturer: "McLaren",
    year: 2018,
    country: "United Kingdom",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/e/e5/FH4_McLaren_Senna.png",
    stats: { sp: 8.9, ha: 9.3, ac: 9.7, ls: 8.8, br: 10.0, pl: { class: "S2", pi: 998, label: "S2 998" } },
    source: { game: "FH4", carPageUrl: "https://forza.fandom.com/wiki/2018_McLaren_Senna", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/e/e5/FH4_McLaren_Senna.png" },
    isSuperTrunfo: true
  },
  {
    id: "2021-mercedes-amg-one",
    normalizedName: "2021 mercedes-amg one",
    name: "2021 Mercedes-AMG ONE",
    manufacturer: "Mercedes-AMG",
    year: 2021,
    country: "Germany",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/2/21/FH5_Mercedes-AMG_ONE.png",
    stats: { sp: 8.5, ha: 9.0, ac: 9.4, ls: 10.0, br: 9.5, pl: { class: "S2", pi: 927, label: "S2 927" } },
    source: { game: "FH5", carPageUrl: "https://forza.fandom.com/wiki/2021_Mercedes-AMG_ONE", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/2/21/FH5_Mercedes-AMG_ONE.png" },
    isSuperTrunfo: true
  },
  {
    id: "1992-ford-escort-rs-cosworth",
    normalizedName: "1992 ford escort rs cosworth",
    name: "1992 Ford Escort RS Cosworth",
    manufacturer: "Ford",
    year: 1992,
    country: "United States",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/9/9f/FH4_Ford_Escort_92.png",
    stats: { sp: 5.8, ha: 5.6, ac: 6.2, ls: 7.1, br: 5.1, pl: { class: "B", pi: 629, label: "B 629" } },
    source: { game: "FH4", carPageUrl: "https://forza.fandom.com/wiki/1992_Ford_Escort_RS_Cosworth", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/9/9f/FH4_Ford_Escort_92.png" },
    isSuperTrunfo: false
  },
  {
    id: "2017-ford-focus-rs",
    normalizedName: "2017 ford focus rs",
    name: "2017 Ford Focus RS",
    manufacturer: "Ford",
    year: 2017,
    country: "United States",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/7/70/FH4_Ford_Focus_RS.png",
    stats: { sp: 6.1, ha: 6.4, ac: 6.8, ls: 7.3, br: 6.2, pl: { class: "A", pi: 718, label: "A 718" } },
    source: { game: "FH4", carPageUrl: "https://forza.fandom.com/wiki/2017_Ford_Focus_RS", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/7/70/FH4_Ford_Focus_RS.png" },
    isSuperTrunfo: false
  },
  {
    id: "2016-ford-focus-rs-rx",
    normalizedName: "2016 ford focus rs rx",
    name: "2016 Ford Focus RS RX",
    manufacturer: "Ford",
    year: 2016,
    country: "United States",
    imageUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/e/e6/FH3_Ford_Focus_RS_RX.png",
    stats: { sp: 6.8, ha: 8.0, ac: 8.5, ls: 9.2, br: 7.1, pl: { class: "S1", pi: 808, label: "S1 808" } },
    source: { game: "FH3", carPageUrl: "https://forza.fandom.com/wiki/2016_Ford_Focus_RS_RX", imageSourceUrl: "https://static.wikia.nocookie.net/forzamotorsport/images/e/e6/FH3_Ford_Focus_RS_RX.png" },
    isSuperTrunfo: false
  }
];
```

- [ ] **Step 4: Run type check through build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 5: Commit domain types and sample data**

Run:

```bash
git add src/domain/cards.ts src/domain/game.ts src/data/sample-cards.ts
git commit -m "feat: add card domain model and sample data"
```

---

### Task 3: Implement Tested Game Engine

**Files:**
- Create: `src/domain/game-engine.ts`
- Create: `src/tests/game-engine.test.ts`

- [ ] **Step 1: Write failing game-engine tests**

Create `src/tests/game-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Card } from "@/domain/cards";
import {
  advanceAfterReveal,
  createInitialGame,
  requestMutualEnd,
  resolveRound
} from "@/domain/game-engine";

const card = (id: string, sp: number, superTrunfo = false): Card => ({
  id,
  normalizedName: id,
  name: id,
  manufacturer: "Test",
  year: 2024,
  imageUrl: "/test.png",
  stats: {
    sp,
    ha: sp,
    ac: sp,
    ls: sp,
    br: sp,
    pl: { class: "A", pi: 700, label: "A 700" }
  },
  source: { game: "FH5", carPageUrl: "https://example.com/car", imageSourceUrl: "https://example.com/image.png" },
  isSuperTrunfo: superTrunfo
});

describe("game engine", () => {
  it("creates an even split and random active player from a seed", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("a", 1), card("b", 2), card("c", 3), card("d", 4)],
      deckSize: 4,
      seed: "seed-a"
    });

    expect(game.phase).toBe("playing");
    expect(game.decks.host).toHaveLength(2);
    expect(game.decks.guest).toHaveLength(2);
    expect(["host", "guest"]).toContain(game.activePlayer);
  });

  it("rejects odd deck sizes", () => {
    expect(() =>
      createInitialGame({
        code: "1234",
        hostNickname: "Ana",
        guestNickname: "Leo",
        cards: [card("a", 1), card("b", 2), card("c", 3)],
        deckSize: 3,
        seed: "seed-a"
      })
    ).toThrow("Deck size must be even");
  });

  it("resolves a normal attribute win", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("host-top", 9), card("guest-top", 4), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "win-seed");

    expect(revealed.phase).toBe("revealed");
    expect(revealed.lastRound?.winner).toBe("host");
    expect(revealed.lastRound?.reason).toBe("attribute");
  });

  it("lets Super Trunfo beat a common card regardless of stat", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("super", 1, true), card("common", 10), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "super-seed");

    expect(revealed.lastRound?.winner).toBe("host");
    expect(revealed.lastRound?.reason).toBe("super-trunfo");
  });

  it("compares attribute when both cards are Super Trunfo", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("super-low", 1, true), card("super-high", 10, true), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "super-both");

    expect(revealed.lastRound?.winner).toBe("guest");
    expect(revealed.lastRound?.reason).toBe("super-trunfo-attribute");
  });

  it("keeps active player and accumulates pile on tie", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("h1", 5), card("g1", 5), card("h2", 9), card("g2", 1)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "tie-seed");
    const next = advanceAfterReveal(revealed);

    expect(revealed.lastRound?.winner).toBe("tie");
    expect(next.phase).toBe("playing");
    expect(next.activePlayer).toBe("host");
    expect(next.tiePile).toHaveLength(2);
  });

  it("ends by mutual agreement with draw on equal card counts", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("a", 1), card("b", 2), card("c", 3), card("d", 4)],
      deckSize: 4,
      seed: "ordered"
    });

    const hostRequested = requestMutualEnd(game, "host");
    const finished = requestMutualEnd(hostRequested, "guest");

    expect(finished.phase).toBe("finished");
    expect(finished.result).toEqual({ winner: "draw", reason: "mutual" });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/tests/game-engine.test.ts`

Expected: fails because `src/domain/game-engine.ts` does not exist.

- [ ] **Step 3: Implement game engine**

Create `src/domain/game-engine.ts`:

```ts
import type { Card, ComparableStat, PlayerId } from "./cards";
import type { GameState, MatchResult, Player, RoundResult } from "./game";

interface CreateInitialGameInput {
  code: string;
  hostNickname: string;
  guestNickname: string;
  cards: Card[];
  deckSize: number;
  seed: string;
}

function now() {
  return Date.now();
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) / 4294967296);
  };
}

export function shuffleCards(cards: Card[], seed: string) {
  if (seed === "ordered") return [...cards];
  const random = seededRandom(seed);
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makePlayer(id: PlayerId, nickname: string): Player {
  return {
    id,
    nickname,
    language: "pt-BR",
    connectedAt: now(),
    wantsToEnd: false
  };
}

export function createInitialGame(input: CreateInitialGameInput): GameState {
  if (input.deckSize % 2 !== 0) throw new Error("Deck size must be even");
  if (input.deckSize > input.cards.length) throw new Error("Deck size exceeds available cards");
  const selected = shuffleCards(input.cards, input.seed).slice(0, input.deckSize);
  const random = seededRandom(`${input.seed}:active`);
  const activePlayer: PlayerId = random() >= 0.5 ? "host" : "guest";
  const timestamp = now();

  return {
    phase: "playing",
    code: input.code,
    host: makePlayer("host", input.hostNickname),
    guest: makePlayer("guest", input.guestNickname),
    activePlayer,
    decks: {
      host: selected.filter((_, index) => index % 2 === 0),
      guest: selected.filter((_, index) => index % 2 === 1)
    },
    tiePile: [],
    maxDeckSize: input.cards.length,
    selectedDeckSize: input.deckSize,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function compareCards(hostCard: Card, guestCard: Card, attribute: ComparableStat): RoundResult["winner"] {
  if (hostCard.isSuperTrunfo && !guestCard.isSuperTrunfo) return "host";
  if (!hostCard.isSuperTrunfo && guestCard.isSuperTrunfo) return "guest";
  const hostValue = hostCard.stats[attribute];
  const guestValue = guestCard.stats[attribute];
  if (hostValue === guestValue) return "tie";
  return hostValue > guestValue ? "host" : "guest";
}

function resultReason(hostCard: Card, guestCard: Card): RoundResult["reason"] {
  if (hostCard.isSuperTrunfo && guestCard.isSuperTrunfo) return "super-trunfo-attribute";
  if (hostCard.isSuperTrunfo || guestCard.isSuperTrunfo) return "super-trunfo";
  return "attribute";
}

export function resolveRound(game: GameState, attribute: ComparableStat, seed: string): GameState {
  if (game.phase !== "playing") throw new Error("Round can only resolve during playing phase");
  const hostCard = game.decks.host[0];
  const guestCard = game.decks.guest[0];
  if (!hostCard || !guestCard) throw new Error("Both players need a card");

  const hostDeck = game.decks.host.slice(1);
  const guestDeck = game.decks.guest.slice(1);
  const winner = compareCards(hostCard, guestCard, attribute);
  const currentPile = [...game.tiePile, hostCard, guestCard];
  const lastRound: RoundResult = {
    attribute,
    hostCard,
    guestCard,
    winner,
    reason: resultReason(hostCard, guestCard),
    pileSize: currentPile.length
  };

  if (winner === "tie") {
    return {
      ...game,
      phase: "revealed",
      decks: { host: hostDeck, guest: guestDeck },
      tiePile: currentPile,
      lastRound,
      updatedAt: now()
    };
  }

  const wonCards = shuffleCards(currentPile, seed);
  const decks = {
    host: winner === "host" ? [...hostDeck, ...wonCards] : hostDeck,
    guest: winner === "guest" ? [...guestDeck, ...wonCards] : guestDeck
  };

  const result = getCardsFinishResult(decks);
  return {
    ...game,
    phase: result ? "finished" : "revealed",
    activePlayer: winner,
    decks,
    tiePile: [],
    lastRound,
    result,
    updatedAt: now()
  };
}

function getCardsFinishResult(decks: GameState["decks"]): MatchResult | undefined {
  if (decks.host.length === 0) return { winner: "guest", reason: "cards" };
  if (decks.guest.length === 0) return { winner: "host", reason: "cards" };
  return undefined;
}

export function advanceAfterReveal(game: GameState): GameState {
  if (game.phase !== "revealed") throw new Error("Can only advance after reveal");
  const result = getCardsFinishResult(game.decks);
  return {
    ...game,
    phase: result ? "finished" : "playing",
    result,
    updatedAt: now()
  };
}

export function requestMutualEnd(game: GameState, playerId: PlayerId): GameState {
  const player = game[playerId];
  if (!player) throw new Error("Player is not in room");
  const updatedPlayer = { ...player, wantsToEnd: !player.wantsToEnd };
  const next = { ...game, [playerId]: updatedPlayer, updatedAt: now() } satisfies GameState;

  if (next.host?.wantsToEnd && next.guest?.wantsToEnd) {
    const hostCount = next.decks.host.length;
    const guestCount = next.decks.guest.length;
    const winner = hostCount === guestCount ? "draw" : hostCount > guestCount ? "host" : "guest";
    return {
      ...next,
      phase: "finished",
      result: { winner, reason: "mutual" }
    };
  }

  return next;
}
```

- [ ] **Step 4: Run game-engine tests**

Run: `npm test -- src/tests/game-engine.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit game engine**

Run:

```bash
git add src/domain/game-engine.ts src/tests/game-engine.test.ts
git commit -m "feat: add tested Super Trunfo game engine"
```

---

### Task 4: Implement Import Validation

**Files:**
- Create: `src/domain/import-validation.ts`
- Create: `src/tests/import-validation.test.ts`

- [ ] **Step 1: Write failing import validation tests**

Create `src/tests/import-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Card } from "@/domain/cards";
import {
  dedupeNewestByName,
  parsePowerLevel,
  validateCompleteCard,
  validateRequiredSuperTrunfos
} from "@/domain/import-validation";
import { sampleCards } from "@/data/sample-cards";

describe("import validation", () => {
  it("parses class and PI from expected PL labels", () => {
    expect(parsePowerLevel("S1 900")).toEqual({ class: "S1", pi: 900, label: "S1 900" });
    expect(parsePowerLevel("A 718")).toEqual({ class: "A", pi: 718, label: "A 718" });
  });

  it("rejects invalid PL labels", () => {
    expect(parsePowerLevel("900")).toBeNull();
    expect(parsePowerLevel("S3 900")).toBeNull();
  });

  it("validates complete cards", () => {
    expect(validateCompleteCard(sampleCards[0]).ok).toBe(true);
  });

  it("rejects cards without a usable PL", () => {
    const broken: Card = {
      ...sampleCards[0],
      stats: { ...sampleCards[0].stats, pl: { class: "S1", pi: Number.NaN, label: "bad" } }
    };
    expect(validateCompleteCard(broken)).toEqual({ ok: false, reason: "Invalid PL" });
  });

  it("keeps variants with different normalized names", () => {
    const focus = sampleCards.find((card) => card.id === "2017-ford-focus-rs")!;
    const rx = sampleCards.find((card) => card.id === "2016-ford-focus-rs-rx")!;
    const deduped = dedupeNewestByName([focus, rx]);
    expect(deduped.map((card) => card.id).sort()).toEqual(["2016-ford-focus-rs-rx", "2017-ford-focus-rs"]);
  });

  it("uses newest game for exact normalized duplicate", () => {
    const oldCard: Card = { ...sampleCards[0], source: { ...sampleCards[0].source, game: "FH3" } };
    const newCard: Card = { ...sampleCards[0], id: "newer", source: { ...sampleCards[0].source, game: "FH5" } };
    expect(dedupeNewestByName([oldCard, newCard])[0].id).toBe("newer");
  });

  it("fails when a required Super Trunfo is incomplete", () => {
    const broken = { ...sampleCards[0], imageUrl: "" };
    expect(() => validateRequiredSuperTrunfos([broken], [broken.normalizedName])).toThrow("Required Super Trunfo is incomplete");
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/tests/import-validation.test.ts`

Expected: fails because `src/domain/import-validation.ts` does not exist.

- [ ] **Step 3: Implement validation helpers**

Create `src/domain/import-validation.ts`:

```ts
import type { Card, PerformanceClass, PowerLevel } from "./cards";

const classOrder: Record<string, number> = {
  FH1: 1,
  FH2: 2,
  FH3: 3,
  FH4: 4,
  FH5: 5,
  FH6: 6
};

const validClasses = new Set<PerformanceClass>(["D", "C", "B", "A", "S1", "S2", "X"]);

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function parsePowerLevel(value: string): PowerLevel | null {
  const match = value.trim().match(/^(D|C|B|A|S1|S2|X)\s+(\d{3,4})$/);
  if (!match) return null;
  const performanceClass = match[1] as PerformanceClass;
  const pi = Number(match[2]);
  if (!validClasses.has(performanceClass) || !Number.isFinite(pi)) return null;
  return { class: performanceClass, pi, label: `${performanceClass} ${pi}` };
}

export function validateCompleteCard(card: Card): ValidationResult {
  if (!card.name.trim()) return { ok: false, reason: "Missing name" };
  if (!card.normalizedName.trim()) return { ok: false, reason: "Missing normalized name" };
  if (!card.imageUrl.trim()) return { ok: false, reason: "Missing image" };
  if (!card.manufacturer.trim()) return { ok: false, reason: "Missing manufacturer" };
  if (!Number.isInteger(card.year)) return { ok: false, reason: "Missing year" };
  for (const key of ["sp", "ha", "ac", "ls", "br"] as const) {
    if (!Number.isFinite(card.stats[key])) return { ok: false, reason: `Invalid ${key.toUpperCase()}` };
  }
  const pl = card.stats.pl;
  if (!validClasses.has(pl.class) || !Number.isFinite(pl.pi) || parsePowerLevel(pl.label) === null) {
    return { ok: false, reason: "Invalid PL" };
  }
  if (!card.source.carPageUrl.trim() || !card.source.imageSourceUrl.trim()) {
    return { ok: false, reason: "Missing source" };
  }
  return { ok: true };
}

export function dedupeNewestByName(cards: Card[]): Card[] {
  const byName = new Map<string, Card>();
  for (const card of cards) {
    const existing = byName.get(card.normalizedName);
    if (!existing || classOrder[card.source.game] > classOrder[existing.source.game]) {
      byName.set(card.normalizedName, card);
    }
  }
  return [...byName.values()];
}

export function validateRequiredSuperTrunfos(cards: Card[], requiredNormalizedNames: string[]) {
  for (const name of requiredNormalizedNames) {
    const card = cards.find((candidate) => candidate.normalizedName === name && candidate.isSuperTrunfo);
    if (!card) throw new Error(`Required Super Trunfo is missing: ${name}`);
    const result = validateCompleteCard(card);
    if (!result.ok) throw new Error(`Required Super Trunfo is incomplete: ${name} (${result.reason})`);
  }
}
```

- [ ] **Step 4: Run import validation tests**

Run: `npm test -- src/tests/import-validation.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit validation**

Run:

```bash
git add src/domain/import-validation.ts src/tests/import-validation.test.ts
git commit -m "feat: validate imported card data"
```

---

### Task 5: Add Local Room Store

**Files:**
- Create: `src/lib/room-store.ts`
- Create: `src/tests/room-store.test.ts`

- [ ] **Step 1: Write failing room-store tests**

Create `src/tests/room-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, kickGuest, sanitizeNickname } from "@/lib/room-store";
import { sampleCards } from "@/data/sample-cards";

describe("room store", () => {
  it("sanitizes nicknames and rejects invalid lengths", () => {
    expect(sanitizeNickname(" Ana ")).toBe("Ana");
    expect(sanitizeNickname("<b>Ana</b>")).toBe("Ana");
    expect(() => sanitizeNickname("A")).toThrow("Nickname must be 2 to 16 characters");
  });

  it("creates a 4 digit room with host only", () => {
    const room = createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards });
    expect(room.code).toMatch(/^\d{4}$/);
    expect(room.host?.nickname).toBe("Ana");
    expect(room.guest).toBeUndefined();
    expect(room.phase).toBe("lobby");
  });

  it("joins first guest and rejects second guest", () => {
    const room = createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards });
    const joined = joinRoom(room, "Leo");
    expect(joined.guest?.nickname).toBe("Leo");
    expect(() => joinRoom(joined, "Mia")).toThrow("Room is full");
  });

  it("kicks guest before match starts", () => {
    const room = joinRoom(createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards }), "Leo");
    expect(kickGuest(room).guest).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/tests/room-store.test.ts`

Expected: fails because `src/lib/room-store.ts` does not exist.

- [ ] **Step 3: Implement local room store helpers**

Create `src/lib/room-store.ts`:

```ts
import type { Card } from "@/domain/cards";
import type { GameState, Player } from "@/domain/game";

function now() {
  return Date.now();
}

export function sanitizeNickname(raw: string): string {
  const stripped = raw.replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ");
  if (stripped.length < 2 || stripped.length > 16) {
    throw new Error("Nickname must be 2 to 16 characters");
  }
  return stripped;
}

function makeCode(existingCodes: Set<string>) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const code = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    if (!existingCodes.has(code)) return code;
  }
  throw new Error("Could not generate room code");
}

function makePlayer(id: "host" | "guest", nickname: string): Player {
  return {
    id,
    nickname: sanitizeNickname(nickname),
    language: "pt-BR",
    connectedAt: now(),
    wantsToEnd: false
  };
}

export function createRoom(input: { hostNickname: string; existingCodes: Set<string>; cards: Card[] }): GameState {
  const timestamp = now();
  return {
    phase: "lobby",
    code: makeCode(input.existingCodes),
    host: makePlayer("host", input.hostNickname),
    activePlayer: "host",
    decks: { host: [], guest: [] },
    tiePile: [],
    maxDeckSize: input.cards.length,
    selectedDeckSize: input.cards.length % 2 === 0 ? input.cards.length : input.cards.length - 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function joinRoom(room: GameState, nickname: string): GameState {
  if (room.guest) throw new Error("Room is full");
  if (room.phase !== "lobby") throw new Error("Match already started");
  return { ...room, guest: makePlayer("guest", nickname), updatedAt: now() };
}

export function kickGuest(room: GameState): GameState {
  if (room.phase !== "lobby") throw new Error("Guest can only be kicked before match starts");
  return { ...room, guest: undefined, updatedAt: now() };
}

export function saveRoom(room: GameState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`super-trunfo-room-${room.code}`, JSON.stringify(room));
}

export function loadRoom(code: string): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`super-trunfo-room-${code}`);
  return raw ? (JSON.parse(raw) as GameState) : null;
}
```

- [ ] **Step 4: Run room-store tests**

Run: `npm test -- src/tests/room-store.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit room store**

Run:

```bash
git add src/lib/room-store.ts src/tests/room-store.test.ts
git commit -m "feat: add local room store"
```

---

### Task 6: Add Internationalization Helpers

**Files:**
- Create: `src/domain/i18n.ts`
- Create: `src/components/LanguageSelect.tsx`

- [ ] **Step 1: Create i18n dictionary**

Create `src/domain/i18n.ts`:

```ts
import type { ComparableStat, DisplayStat, Language } from "./cards";

type TranslationKey =
  | "createRoom"
  | "joinRoom"
  | "nickname"
  | "startMatch"
  | "roomFull"
  | "howToPlay"
  | "nextRound"
  | "requestEnd"
  | "cancelEnd"
  | "rematch"
  | "winner"
  | "draw"
  | `stat.${DisplayStat}`;

const dictionary: Record<Language, Record<TranslationKey, string>> = {
  "pt-BR": {
    createRoom: "Criar sala",
    joinRoom: "Entrar",
    nickname: "Apelido",
    startMatch: "Iniciar partida",
    roomFull: "Sala cheia",
    howToPlay: "Como jogar",
    nextRound: "Proxima rodada",
    requestEnd: "Encerrar partida",
    cancelEnd: "Cancelar encerramento",
    rematch: "Revanche",
    winner: "Vencedor",
    draw: "Empate",
    "stat.sp": "Velocidade",
    "stat.ha": "Controle",
    "stat.ac": "Aceleracao",
    "stat.ls": "Largada",
    "stat.br": "Frenagem",
    "stat.pl": "Classe/PI"
  },
  en: {
    createRoom: "Create room",
    joinRoom: "Join",
    nickname: "Nickname",
    startMatch: "Start match",
    roomFull: "Room full",
    howToPlay: "How to play",
    nextRound: "Next round",
    requestEnd: "End match",
    cancelEnd: "Cancel end request",
    rematch: "Rematch",
    winner: "Winner",
    draw: "Draw",
    "stat.sp": "Speed",
    "stat.ha": "Handling",
    "stat.ac": "Acceleration",
    "stat.ls": "Launch",
    "stat.br": "Braking",
    "stat.pl": "Class/PI"
  }
};

export function t(language: Language, key: TranslationKey) {
  return dictionary[language][key];
}

export function statLabel(language: Language, stat: ComparableStat | "pl") {
  return t(language, `stat.${stat}`);
}
```

- [ ] **Step 2: Create language selector component**

Create `src/components/LanguageSelect.tsx`:

```tsx
"use client";

import type { Language } from "@/domain/cards";

interface LanguageSelectProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <label className="languageSelect">
      <span>Language</span>
      <select value={value} onChange={(event) => onChange(event.target.value as Language)}>
        <option value="pt-BR">PT-BR</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4: Commit i18n**

Run:

```bash
git add src/domain/i18n.ts src/components/LanguageSelect.tsx
git commit -m "feat: add bilingual UI helpers"
```

---

### Task 7: Build Premium Card UI

**Files:**
- Create: `src/components/CardView.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create CardView**

Create `src/components/CardView.tsx`:

```tsx
import clsx from "clsx";
import type { Card, Language } from "@/domain/cards";
import { COMPARABLE_STATS } from "@/domain/cards";
import { statLabel } from "@/domain/i18n";

interface CardViewProps {
  card?: Card;
  hidden?: boolean;
  language: Language;
  revealLabel?: string;
}

export function CardView({ card, hidden, language, revealLabel }: CardViewProps) {
  if (hidden || !card) {
    return (
      <article className="gameCard cardBack">
        <div className="cardBackMark">ST</div>
        <p>{revealLabel ?? "Hidden card"}</p>
      </article>
    );
  }

  return (
    <article className={clsx("gameCard", `tier-${card.stats.pl.class.toLowerCase()}`, card.isSuperTrunfo && "superTrunfo")}>
      <div className="cardTopline">
        <span>{card.stats.pl.label}</span>
        {card.isSuperTrunfo && <strong>SUPER TRUNFO</strong>}
      </div>
      <div className="cardImageWrap">
        <img src={card.imageUrl} alt={card.name} className="cardImage" />
      </div>
      <div className="cardIdentity">
        <h2>{card.name}</h2>
        <p>
          {card.manufacturer} · {card.year}
        </p>
      </div>
      <dl className="statGrid">
        {COMPARABLE_STATS.map((stat) => (
          <div className="statRow" key={stat} title={statLabel(language, stat)}>
            <dt>{stat.toUpperCase()}</dt>
            <dd>{card.stats[stat].toFixed(1)}</dd>
          </div>
        ))}
        <div className="statRow mutedStat" title={statLabel(language, "pl")}>
          <dt>PL</dt>
          <dd>{card.stats.pl.label}</dd>
        </div>
      </dl>
    </article>
  );
}
```

- [ ] **Step 2: Replace global CSS with premium layout primitives**

Modify `src/app/globals.css` to include the existing reset plus these classes:

```css
.gameCard {
  position: relative;
  width: min(100%, 320px);
  aspect-ratio: 2.5 / 3.5;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 10px;
  padding: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: linear-gradient(160deg, #171d27, #090b10);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
}

.gameCard::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  opacity: 0.35;
}

.superTrunfo {
  border-color: #d8b35f;
  box-shadow: 0 24px 80px rgba(216, 179, 95, 0.2);
}

.superTrunfo::after {
  content: "";
  position: absolute;
  inset: -40%;
  background: conic-gradient(from 90deg, transparent, rgba(216, 179, 95, 0.18), transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: holo 8s linear infinite;
  pointer-events: none;
}

@keyframes holo {
  to { transform: rotate(1turn); }
}

.cardTopline,
.cardIdentity,
.statGrid,
.cardImageWrap {
  position: relative;
  z-index: 1;
}

.cardTopline {
  display: flex;
  min-height: 24px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #f7d889;
  font-size: 0.78rem;
  font-weight: 900;
}

.cardImageWrap {
  min-height: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #202733;
}

.cardImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.cardIdentity h2 {
  margin: 0;
  font-size: 1rem;
  line-height: 1.1;
}

.cardIdentity p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.statGrid {
  display: grid;
  gap: 4px;
  margin: 0;
}

.statRow {
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 4px;
}

.statRow dt {
  color: #f7d889;
  font-size: 0.78rem;
  font-weight: 900;
}

.statRow dd {
  margin: 0;
  text-align: right;
  font-weight: 800;
}

.mutedStat dt,
.mutedStat dd {
  color: var(--muted);
}

.cardBack {
  place-items: center;
  text-align: center;
}

.cardBackMark {
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  border: 1px solid var(--accent);
  border-radius: 50%;
  color: var(--accent);
  font-weight: 900;
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4: Commit card UI**

Run:

```bash
git add src/components/CardView.tsx src/app/globals.css
git commit -m "feat: add premium card UI"
```

---

### Task 8: Build Room And Match UI

**Files:**
- Create: `src/components/RulesModal.tsx`
- Create: `src/components/SoundToggle.tsx`
- Create: `src/components/LobbyView.tsx`
- Create: `src/components/GameView.tsx`
- Create: `src/components/ResultView.tsx`
- Create: `src/components/RoomApp.tsx`
- Create: `src/app/room/[code]/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create RulesModal**

Create `src/components/RulesModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Language } from "@/domain/cards";

export function RulesModal({ language }: { language: Language }) {
  const [open, setOpen] = useState(false);
  const isPt = language === "pt-BR";
  return (
    <>
      <button className="ghostButton" type="button" onClick={() => setOpen(true)}>
        {isPt ? "Como jogar" : "How to play"}
      </button>
      {open && (
        <div className="modalBackdrop" role="presentation" onClick={() => setOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>{isPt ? "Como jogar" : "How to play"}</h2>
            <p>
              {isPt
                ? "Compare SP, HA, AC, LS ou BR. O maior valor vence a rodada. Empates acumulam cartas para a proxima rodada."
                : "Compare SP, HA, AC, LS, or BR. The higher value wins the round. Ties bank cards for the next round."}
            </p>
            <p>
              {isPt
                ? "Uma carta Super Trunfo vence cartas comuns automaticamente, mas contra outra Super Trunfo compara o atributo escolhido."
                : "A Super Trunfo beats common cards automatically, but against another Super Trunfo it compares the chosen attribute."}
            </p>
            <button className="primaryButton" type="button" onClick={() => setOpen(false)}>
              OK
            </button>
          </section>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Create SoundToggle**

Create `src/components/SoundToggle.tsx`:

```tsx
"use client";

import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  muted: boolean;
  onToggle: () => void;
}

export function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  const Icon = muted ? VolumeX : Volume2;
  return (
    <button className="iconButton" type="button" onClick={onToggle} aria-label={muted ? "Unmute" : "Mute"}>
      <Icon size={18} />
    </button>
  );
}
```

- [ ] **Step 3: Create LobbyView**

Create `src/components/LobbyView.tsx`:

```tsx
"use client";

import type { GameState } from "@/domain/game";

interface LobbyViewProps {
  room: GameState;
  onStart: () => void;
  onDeckSizeChange: (size: number) => void;
  onKickGuest: () => void;
}

export function LobbyView({ room, onStart, onDeckSizeChange, onKickGuest }: LobbyViewProps) {
  const deckOptions = Array.from({ length: Math.floor(room.maxDeckSize / 2) }, (_, index) => (index + 1) * 2);
  return (
    <section className="panel">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Lobby</p>
          <h1>Sala {room.code}</h1>
        </div>
      </div>
      <div className="playerGrid">
        <div className="playerSlot">
          <span>Host</span>
          <strong>{room.host?.nickname}</strong>
        </div>
        <div className="playerSlot">
          <span>Guest</span>
          <strong>{room.guest?.nickname ?? "Aguardando..."}</strong>
          {room.guest && (
            <button className="ghostButton" type="button" onClick={onKickGuest}>
              Expulsar
            </button>
          )}
        </div>
      </div>
      <label className="field">
        <span>Cartas na partida</span>
        <select value={room.selectedDeckSize} onChange={(event) => onDeckSizeChange(Number(event.target.value))}>
          {deckOptions.map((size) => (
            <option key={size} value={size}>
              {size === room.maxDeckSize ? `${size} (todas)` : size}
            </option>
          ))}
        </select>
      </label>
      <button className="primaryButton" type="button" disabled={!room.guest} onClick={onStart}>
        Iniciar partida
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Create GameView and ResultView**

Create `src/components/GameView.tsx`:

```tsx
"use client";

import type { ComparableStat, Language, PlayerId } from "@/domain/cards";
import { COMPARABLE_STATS } from "@/domain/cards";
import type { GameState } from "@/domain/game";
import { statLabel } from "@/domain/i18n";
import { CardView } from "./CardView";

interface GameViewProps {
  room: GameState;
  viewer: PlayerId;
  language: Language;
  onChoose: (stat: ComparableStat) => void;
  onNextRound: () => void;
  onToggleEnd: () => void;
}

export function GameView({ room, viewer, language, onChoose, onNextRound, onToggleEnd }: GameViewProps) {
  const ownCard = room.decks[viewer][0];
  const opponent = viewer === "host" ? "guest" : "host";
  const revealedOpponentCard = opponent === "host" ? room.lastRound?.hostCard : room.lastRound?.guestCard;
  const opponentCard = room.phase === "revealed" ? revealedOpponentCard : undefined;
  const isActive = room.activePlayer === viewer && room.phase === "playing";

  return (
    <section className="matchLayout">
      <div className="cardColumn">
        <h2>Sua carta</h2>
        <CardView card={ownCard} language={language} />
      </div>
      <div className="roundPanel">
        <p className="eyebrow">Rodada</p>
        {room.phase === "playing" && (
          <>
            <h1>{isActive ? "Escolha um atributo" : "Aguardando escolha"}</h1>
            <div className="statButtons">
              {COMPARABLE_STATS.map((stat) => (
                <button className="statButton" type="button" key={stat} disabled={!isActive} onClick={() => onChoose(stat)}>
                  <strong>{stat.toUpperCase()}</strong>
                  <span>{statLabel(language, stat)}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {room.phase === "revealed" && (
          <>
            <h1>{room.lastRound?.winner === "tie" ? "Empate" : `${room.lastRound?.winner} venceu`}</h1>
            <p>Monte em disputa: {room.lastRound?.pileSize}</p>
            <button className="primaryButton" type="button" onClick={onNextRound}>
              Proxima rodada
            </button>
          </>
        )}
        <button className="ghostButton" type="button" onClick={onToggleEnd}>
          {room[viewer]?.wantsToEnd ? "Cancelar encerramento" : "Encerrar partida"}
        </button>
      </div>
      <div className="cardColumn opponentColumn">
        <h2>Carta oponente</h2>
        <CardView card={opponentCard} hidden={room.phase !== "revealed"} language={language} revealLabel="Revela apos a escolha" />
      </div>
    </section>
  );
}
```

Create `src/components/ResultView.tsx`:

```tsx
"use client";

import type { GameState } from "@/domain/game";

export function ResultView({ room, onRematch }: { room: GameState; onRematch: () => void }) {
  const winner = room.result?.winner === "draw" ? "Empate" : room[room.result?.winner ?? "host"]?.nickname;
  return (
    <section className="panel resultPanel">
      <p className="eyebrow">Resultado</p>
      <h1>{winner}</h1>
      <p>Motivo: {room.result?.reason}</p>
      <button className="primaryButton" type="button" onClick={onRematch}>
        Revanche
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Create RoomApp orchestrator**

Create `src/components/RoomApp.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import type { ComparableStat, Language, PlayerId } from "@/domain/cards";
import type { GameState } from "@/domain/game";
import { advanceAfterReveal, createInitialGame, requestMutualEnd, resolveRound } from "@/domain/game-engine";
import { sampleCards } from "@/data/sample-cards";
import { createRoom, joinRoom, kickGuest } from "@/lib/room-store";
import { GameView } from "./GameView";
import { LanguageSelect } from "./LanguageSelect";
import { LobbyView } from "./LobbyView";
import { ResultView } from "./ResultView";
import { RulesModal } from "./RulesModal";
import { SoundToggle } from "./SoundToggle";

export function RoomApp({ code }: { code: string }) {
  const [viewer, setViewer] = useState<PlayerId>("host");
  const [language, setLanguage] = useState<Language>("pt-BR");
  const [muted, setMuted] = useState(false);
  const [room, setRoom] = useState<GameState>(() => {
    if (code === "new") return createRoom({ hostNickname: "Host", existingCodes: new Set(), cards: sampleCards });
    return joinRoom(createRoom({ hostNickname: "Host", existingCodes: new Set([code]), cards: sampleCards }), "Guest");
  });

  const displayCode = useMemo(() => (code === "new" ? room.code : code), [code, room.code]);

  function startMatch() {
    if (!room.host || !room.guest) return;
    setRoom(
      createInitialGame({
        code: displayCode,
        hostNickname: room.host.nickname,
        guestNickname: room.guest.nickname,
        cards: sampleCards,
        deckSize: room.selectedDeckSize,
        seed: `${displayCode}:${Date.now()}`
      })
    );
  }

  function choose(stat: ComparableStat) {
    setRoom((current) => resolveRound(current, stat, `${displayCode}:${Date.now()}:round`));
  }

  function rematch() {
    startMatch();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <strong>Super Trunfo Forza</strong>
        <div className="topbarActions">
          <button className="ghostButton" type="button" onClick={() => setViewer(viewer === "host" ? "guest" : "host")}>
            Ver como {viewer === "host" ? "Guest" : "Host"}
          </button>
          <LanguageSelect value={language} onChange={setLanguage} />
          <RulesModal language={language} />
          <SoundToggle muted={muted} onToggle={() => setMuted((value) => !value)} />
        </div>
      </header>
      {room.phase === "lobby" && (
        <LobbyView
          room={room}
          onStart={startMatch}
          onDeckSizeChange={(selectedDeckSize) => setRoom((current) => ({ ...current, selectedDeckSize }))}
          onKickGuest={() => setRoom((current) => kickGuest(current))}
        />
      )}
      {(room.phase === "playing" || room.phase === "revealed") && (
        <GameView
          room={room}
          viewer={viewer}
          language={language}
          onChoose={choose}
          onNextRound={() => setRoom((current) => advanceAfterReveal(current))}
          onToggleEnd={() => setRoom((current) => requestMutualEnd(current, viewer))}
        />
      )}
      {room.phase === "finished" && <ResultView room={room} onRematch={rematch} />}
    </main>
  );
}
```

- [ ] **Step 6: Wire route pages**

Create `src/app/room/[code]/page.tsx`:

```tsx
import { RoomApp } from "@/components/RoomApp";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomApp code={code} />;
}
```

Modify `src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Super Trunfo Forza Horizon</p>
        <h1>Crie uma sala e dispute carta por carta.</h1>
        <div className="homeActions">
          <Link className="primaryAction" href="/room/new">
            Criar sala
          </Link>
          <Link className="secondaryAction" href="/room/1234">
            Entrar em sala demo
          </Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Add layout CSS**

Append to `src/app/globals.css`:

```css
.topbar,
.topbarActions,
.homeActions,
.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.secondaryAction,
.ghostButton,
.primaryButton,
.iconButton,
.statButton {
  border: 1px solid var(--line);
  border-radius: 8px;
  min-height: 42px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
}

.primaryButton {
  background: var(--accent);
  color: #12100a;
  font-weight: 900;
  padding: 0 16px;
}

.ghostButton,
.secondaryAction {
  padding: 10px 14px;
  text-decoration: none;
}

.iconButton {
  width: 42px;
  display: grid;
  place-items: center;
}

.panel {
  margin-top: 28px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}

.playerGrid,
.matchLayout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.matchLayout {
  grid-template-columns: minmax(260px, 320px) minmax(260px, 1fr) minmax(260px, 320px);
  align-items: start;
  margin-top: 28px;
}

.playerSlot,
.roundPanel {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.field,
.languageSelect {
  display: grid;
  gap: 6px;
}

.field select,
.languageSelect select {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #0e131b;
  color: var(--text);
  padding: 0 10px;
}

.statButtons {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.statButton {
  display: grid;
  gap: 2px;
  padding: 10px;
}

.statButton:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.modalBackdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.65);
  padding: 16px;
}

.modal {
  width: min(520px, 100%);
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #111620;
  padding: 22px;
}

@media (max-width: 900px) {
  .matchLayout,
  .playerGrid {
    grid-template-columns: 1fr;
  }

  .opponentColumn {
    order: 3;
  }

  .statButtons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 8: Run build**

Run: `npm run build`

Expected: build succeeds and routes compile.

- [ ] **Step 9: Commit room UI**

Run:

```bash
git add src/components src/app/page.tsx src/app/room/[code]/page.tsx src/app/globals.css
git commit -m "feat: add playable room interface"
```

---

### Task 9: Add README And Vertical Slice Notes

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

Create `README.md`:

```md
# Super Trunfo Forza Horizon

Two-player online Super Trunfo inspired by Forza Horizon cars.

## Current State

This repository currently implements the first vertical slice:

- Next.js + TypeScript app.
- Tested Super Trunfo game engine.
- Sample complete car cards.
- Local room/lobby/match flow.
- Premium collectible card UI.
- PT-BR and English UI helpers.

The full MVP still requires the Forza Wiki scraper, image download/storage, Supabase realtime sync, full catalog import, and Vercel deployment.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Supabase Environment For Later Phases

The next implementation phase will add Supabase sync. Expected local variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=card-images
```

Do not commit `.env` files.

## Data Source Notes

The target catalog comes from Forza Wiki/Fandom pages listed in `docs/superpowers/specs/2026-05-04-super-trunfo-mvp-design.md`. Images should be downloaded from each car page thumb/infobox and source URLs preserved in the dataset.

## Follow-Up Implementation Plans

After this vertical slice:

1. Build the Forza Wiki scraper, normalization, image download, and diff approval workflow.
2. Add Supabase schema, Storage sync, Realtime room sync, and opportunistic cleanup.
3. Import the complete eligible catalog and deploy to Vercel.
```

- [ ] **Step 2: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and build succeeds.

- [ ] **Step 3: Commit README**

Run:

```bash
git add README.md
git commit -m "docs: add vertical slice setup notes"
```

---

## Self-Review Checklist

- Spec coverage in this plan:
  - Two-player game rules: covered in Tasks 3 and 8.
  - Super Trunfo behavior: covered in Tasks 2, 3, 4, 7, and 8.
  - `PL` display but not comparison: covered in Tasks 2, 3, 4, 7, and 8.
  - PT-BR and English support: covered in Task 6.
  - Premium card UI: covered in Task 7.
  - Local lobby and code flow: covered in Tasks 5 and 8.
  - Import validation foundation: covered in Task 4.
  - Full scraper, Supabase, storage, deploy, and complete catalog: intentionally deferred to follow-up plans because the approved spec spans multiple subsystems.
- Placeholder scan:
  - No task uses TBD/TODO/fill-in placeholders.
  - Deferred work is explicitly scoped as follow-up plans, not hidden inside implementation steps.
- Type consistency:
  - `Card`, `GameState`, `ComparableStat`, `PlayerId`, and `Language` are defined before use.
  - Game engine function names used in tests match implementation names.
  - UI components consume the same domain types.
