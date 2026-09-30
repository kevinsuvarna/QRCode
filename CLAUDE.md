# CLAUDE.md — Case File: Financial Literacy Game

This file is the project spec. Read it fully before making changes. When something here conflicts with a general best practice, follow this file. If a task seems to require breaking a rule here, stop and ask.

## 1. What we're building

A gamified web app that teaches students aged 13–15 basic banking terms (savings account, fixed deposit, recurring deposit, current account). The student works through a "case file" and answers questions by placing **physical cards with QR codes** under a webcam. The webcam runs in the background and is never shown on screen.

Current scope is **two screens only**:

1. **Choose screen** (`/`) — shows the four options as tiles and prompts the student to place a card under the camera.
2. **Result screen** (`/result/:cardId`) — shown automatically after a card is scanned. Says whether the choice was correct and explains the card.

For this case, **Savings Account is the correct answer.**

The developer is a new programmer. Prefer clear, boring, well-named code over clever code. Add short comments where the _why_ isn't obvious. Do not add libraries, abstractions or features that aren't listed here without asking first.

## 2. Tech stack

| Piece       | Choice                                                                                | Notes                                                  |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Framework   | React + TypeScript + Vite                                                             | `strict: true` in tsconfig, no `any`                   |
| Routing     | `react-router-dom`                                                                    | Two routes only                                        |
| Styling     | Tailwind CSS v4 via `@tailwindcss/vite`                                               | Theme tokens defined with `@theme` in `src/index.css`  |
| QR scanning | `qr-scanner` (Nimiq)                                                                  | Runs in a web worker; works with a hidden `<video>`    |
| UI icons    | `lucide-react`                                                                        | Fallback for any UI icon the developer hasn't supplied |
| Fonts       | Google Fonts: **Fredoka** (headings, buttons, tile labels) and **Nunito** (body text) | Loaded in `index.html` with `preconnect`               |
| Lint/format | ESLint + Prettier                                                                     | Scripts: `npm run lint`, `npm run format`              |
| Deploy      | Vercel (auto-deploys from GitHub; `vercel.json` rewrites all paths to `index.html`)   | **Camera access only works over HTTPS or `localhost`** |

Do NOT add: Redux/Zustand or any state library, a backend, a database, CSS-in-JS, UI component libraries (MUI, Chakra, etc.).

## 3. Folder structure

```
public/
  icons/                  # developer-supplied icons (see section 8)
src/
  main.tsx                # mounts <App/> inside <BrowserRouter>
  App.tsx                 # route table only
  index.css               # Tailwind import, @theme tokens, keyframes
  data/
    cards.ts              # SINGLE SOURCE OF TRUTH for cards + correct answer
  hooks/
    useQrScanner.ts       # hidden camera + QR decoding
  pages/
    ChoosePage.tsx        # Screen 1
    ResultPage.tsx        # Screen 2 (correct + incorrect variants)
  components/
    GameShell.tsx         # shared page background + header
    OptionTile.tsx        # one option tile
    CameraPrompt.tsx      # "place your card" panel + scanner status
    GameButton.tsx        # chunky game-style button (primary/secondary/danger)
```

Keep files small. One component per file. Card content never goes in JSX — it lives in `data/cards.ts`.

## 4. Data model — `src/data/cards.ts`

```ts
export type CardId = 'savings-account' | 'fixed-deposit' | 'recurring-deposit' | 'current-account';

export type Card = {
  id: CardId;
  title: string;
  icon: IconPath; // path under /public, e.g. '/icons/savings.svg' (IconPath lives in data/icons.ts)
  accent: 'mint' | 'gold' | 'sky' | 'lilac'; // theme color name
  explanation: string; // 2–3 short sentences, age 13–15 reading level
};

export const CARDS: Record<CardId, Card> = {
  'savings-account': {
    id: 'savings-account',
    title: 'Savings Account',
    icon: '/icons/savings.svg',
    accent: 'mint',
    explanation:
      "A savings account is a safe place in a bank to keep money you don't need right away. The bank pays you a little extra, called interest, for keeping it there. You can take your money out whenever you need it.",
  },
  'fixed-deposit': {
    id: 'fixed-deposit',
    title: 'Fixed Deposit',
    icon: '/icons/fixed-deposit.svg',
    accent: 'gold',
    explanation:
      "A fixed deposit locks away one lump sum of money for a set time, like one year. You earn more interest than a savings account, but you can't easily take the money out early.",
  },
  'recurring-deposit': {
    id: 'recurring-deposit',
    title: 'Recurring Deposit',
    icon: '/icons/recurring.svg',
    accent: 'sky',
    explanation:
      'A recurring deposit is where you put in the same small amount every month for a set time. It helps you build a savings habit, and you get it all back with interest at the end.',
  },
  'current-account': {
    id: 'current-account',
    title: 'Current Account',
    icon: '/icons/current.svg',
    accent: 'lilac',
    explanation:
      "A current account is made for businesses that move money in and out many times a day. It usually pays little or no interest, so it isn't meant for saving.",
  },
};

// Display order of tiles on the Choose screen
export const CARD_ORDER: CardId[] = [
  'savings-account',
  'fixed-deposit',
  'recurring-deposit',
  'current-account',
];

// The answer for THIS case. Change here only.
export const CORRECT_ANSWER: CardId = 'savings-account';

// Where "Go Next" goes. Placeholder until step 2 of the case exists.
export const NEXT_ROUTE = '/';

export function isCardId(value: string): value is CardId {
  return Object.prototype.hasOwnProperty.call(CARDS, value);
}
```

## 5. QR codes

- Each physical card's QR encodes **only the card ID string**, e.g. `savings-account`. No URLs, no JSON.
- Anything scanned that isn't a valid `CardId` is **silently ignored** (no navigation, no error popup).
- Scanned values must be `.trim()`-ed before checking.
- Generate locally: `npx qrcode -o qr-savings.png "savings-account"` (repeat per card). Print at least 3 cm square with a white border.

## 6. Routing and the decision logic

`App.tsx`:

- `/` → `ChoosePage`
- `/result/:cardId` → `ResultPage`
- `*` → redirect to `/`

`ResultPage.tsx` decision logic — keep it exactly this simple:

```ts
const { cardId } = useParams();
if (!cardId || !isCardId(cardId)) return <Navigate to="/" replace />;
const card = CARDS[cardId];
const isCorrect = cardId === CORRECT_ANSWER;
```

## 7. Scanner hook — `src/hooks/useQrScanner.ts`

Requirements:

- Returns `{ videoRef, status }` where `status` is `'starting' | 'waiting-for-lift' | 'ready' | 'denied' | 'no-camera'`.
- Creates the `QrScanner` when the component mounts; calls `scanner.stop()` and `scanner.destroy()` on unmount so the camera light turns off when leaving the Choose screen. Returning to `/` restarts it. The Result screen has no camera — the student must press a button to scan again.
- Stores the `onScan` callback in a ref so a new callback identity does **not** restart the camera. The effect runs once per mount.
- **Wait for the lift** (replaces the old "ignore the same value for 2000 ms" rule): a card is only accepted after the camera has seen no card for `LIFT_MS` (800 ms), counted from when the camera started. So a card left under the camera after Try Again / Go Back is ignored (status `'waiting-for-lift'`, "Lift your card off, then place it again.") until it's lifted and placed again.
- Once a valid card is detected and navigation fires, stop reacting to further scans on that page.
- Options: `returnDetailedScanResult: true`, `preferredCamera: 'environment'`, `maxScansPerSecond: 10`.
- Camera choice: `PREFERRED_CAMERA_LABEL` in the hook. Empty = browser default (laptop webcam). Set it to part of a camera's name (e.g. a USB document camera) to use that one instead.
- Maps errors: permission errors (`NotAllowedError` / message contains "permission" or "NotAllowed") → `'denied'`; anything else → `'no-camera'`. Also call `QrScanner.hasCamera()` first and set `'no-camera'` if false. Note: `qr-scanner` replaces permission errors with a generic "Camera not found.", so the hook also checks `navigator.permissions.query({ name: 'camera' })`.
- `qr-scanner` only scans a centered square (2/3 of the frame's shorter side), so the card must be roughly in the middle of the camera's view.

The `<video>` element must be in the DOM but invisible. **Do not use `display: none` / Tailwind `hidden`** — some browsers stop delivering frames. Use:

```tsx
<video
  ref={videoRef}
  muted
  playsInline
  aria-hidden="true"
  className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
/>
```

`qr-scanner` adds a highlight overlay by default; make sure `highlightScanRegion` and `highlightCodeOutline` are off (default false).

### Debug mode

If the URL has `?debug=1`, the option tiles on the Choose screen become clickable buttons that navigate to `/result/:cardId`. This lets the developer test without printed cards. Without `?debug=1`, tiles are display-only (not focusable, not clickable) — the physical card is the input.

Debug mode is only ever turned on by typing `?debug=1` yourself. If it's in the URL, every link and scan keeps it; if it isn't, nothing adds it.

## 8. Icons (supplied by the developer in `public/icons/`)

| File                | Used in                             |
| ------------------- | ----------------------------------- |
| `savings.svg`       | Savings tile, result page           |
| `fixed-deposit.svg` | Fixed deposit tile, result page     |
| `recurring.svg`     | Recurring deposit tile, result page |
| `current.svg`       | Current account tile, result page   |
| `camera.svg`        | Camera prompt panel                 |
| `case-file.svg`     | Header on both screens              |
| `check.svg`         | "Correct!" badge                    |
| `cross.svg`         | "Not correct" badge                 |
| `arrow-right.svg`   | Go Next button                      |
| `arrow-left.svg`    | Go Back button                      |
| `refresh.svg`       | Try Again button                    |
| `favicon.svg`       | Browser tab                         |

Until a file exists, use a `lucide-react` equivalent (PiggyBank, Lock, Repeat, Briefcase, Camera, FolderSearch, CircleCheck, CircleX, ArrowRight, ArrowLeft, RotateCcw). Never commit broken `<img>` paths — if an icon file is missing, fall back to the Lucide icon.

How: `src/data/icons.ts` lists every icon path, its Lucide fallback, and `AVAILABLE_ICON_FILES`. After adding a file to `public/icons/`, add its path to `AVAILABLE_ICON_FILES`; `components/AppIcon.tsx` then shows the file instead of the fallback. (`favicon.svg` is referenced directly from `index.html`; a placeholder is included.) All decorative icons get `alt=""` / `aria-hidden="true"`.

## 9. Visual design

### Palette — define in `src/index.css` with `@theme`

| Token        | Hex       | Use                                     |
| ------------ | --------- | --------------------------------------- |
| `ink`        | `#1E1B4B` | Page background (deep navy "night sky") |
| `panel`      | `#2A2760` | Card / panel surfaces                   |
| `panel-edge` | `#3B3785` | Panel borders                           |
| `mint`       | `#5EEAD4` | Savings tile; correct state             |
| `gold`       | `#FDE047` | Fixed deposit tile; headline highlight  |
| `sky`        | `#7DD3FC` | Recurring deposit tile                  |
| `lilac`      | `#C4B5FD` | Current account tile                    |
| `coral`      | `#FB7185` | Not-correct state; Try Again            |
| `snow`       | `#F8FAFC` | Text on dark backgrounds                |

Text on colored (mint/gold/sky/lilac/coral) surfaces is `ink`. Check contrast is at least WCAG AA.

Background: `ink` with a subtle radial glow or faint dotted grid pattern (CSS only, no images) to feel like a game map.

### Typography

- Headings, tile labels, buttons: **Fredoka**, weight 600–700.
- Body: **Nunito**, weight 400–600.
- Main headline ≥ 48px (use `clamp()` so it scales, e.g. `clamp(2.5rem, 5vw, 4rem)`).
- Body text ≥ 18px. Line height 1.5 for explanations. Max width ~60ch for paragraphs.

### Components

- **OptionTile**: rounded-2xl, filled with its accent color, `ink` text, icon on top (~64px), label below. Chunky "game button" look: 6px bottom border in a darker shade of the accent (use `color-mix` or a darker Tailwind shade). Subtle lift on hover only in debug mode.
- **GameButton**: variants `primary` (mint), `secondary` (outlined, snow text), `danger` (coral). Fredoka, rounded-xl, 6px darker bottom border, on press translate down 4px and shrink the border (arcade-button feel). Minimum 48px tall. Visible focus ring.
- **CameraPrompt**: panel in `panel` color with `panel-edge` border, camera icon, text "Place your card under the camera". Shows status:
  - `starting` → "Starting camera…"
  - `ready` → pulsing mint dot + "Scanning…"
  - `denied` → coral text: "Camera is blocked. Click the lock icon in the address bar and allow the camera, then reload."
  - `no-camera` → coral text: "No camera found. Plug one in and reload."
  - Status text lives in an `aria-live="polite"` region.
- **GameShell**: full-height `ink` background, top-left header with case-file icon + "CASE FILE #01" in small caps Fredoka, `<main>` centered content with 16–32px side padding.

### Screen 1 — Choose (`/`)

```
┌────────────────────────────────────────────────────────────┐
│  [case-file]  CASE FILE #01                                │
│                                                            │
│              What will you choose?          (h1, gold word │
│                                              "choose")     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ [icon]   │ │ [icon]   │ │ [icon]   │ │ [icon]   │      │
│  │ Savings  │ │ Fixed    │ │Recurring │ │ Current  │      │
│  │ Account  │ │ Deposit  │ │ Deposit  │ │ Account  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                            ┌─────────────┐ │
│                                            │ [camera]    │ │
│                                            │ Place your  │ │
│                                            │ card under  │ │
│                                            │ the camera  │ │
│                                            │ ● Scanning… │ │
│                                            └─────────────┘ │
└────────────────────────────────────────────────────────────┘
```

- Tiles: 2×2 grid below `lg`, 1×4 row at `lg` and up. Equal height.
- CameraPrompt: fixed to the bottom-right on `lg`+; below the tiles, centered, on smaller screens.

### Screen 2 — Result (`/result/:cardId`)

One large centered card (max-width ~640px) on the same shell.

**Correct** (mint border + soft mint glow):

- Badge at top: check icon + "Correct!"
- Card icon (~96px) + card title (h1)
- Explanation paragraph from `cards.ts`
- Bottom row: `Go Back` (secondary, left arrow) → `/` · `Go Next` (primary, right arrow) → `NEXT_ROUTE`

**Not correct** (coral border):

- Badge at top: cross icon + "Not correct"
- Card icon + title of the card that was scanned (h1)
- That card's explanation, prefixed with a short line: "Good try! Here's what this one is:"
- Bottom: single `Try Again` button (danger, refresh icon) → `/`

### Motion

- Choose screen: tiles fade up on mount, staggered ~60ms each.
- Result screen: card scales from 0.9 → 1 with fade. Not-correct variant also does a short horizontal shake (~400ms) once.
- All animations are CSS keyframes in `index.css`. Wrap them in `@media (prefers-reduced-motion: no-preference)`.
- No animation libraries.

## 10. Accessibility and quality rules

- Semantic HTML: one `<h1>` per page, `<main>`, real `<button>` / `<Link>` elements.
- All interactive elements keyboard-focusable with a visible focus ring.
- Set `document.title` per page ("What will you choose? · Case File", "Correct! · Case File", etc.).
- Works on a 1080p classroom display and a 13" laptop without scrolling on the Choose screen.
- No console errors or warnings in dev.
- `npm run lint` and `npm run build` must pass with zero errors before any task is considered done.

## 11. Commands

```
npm install        # install deps
npm run dev        # start dev server (http://localhost:5173)
npm run build      # production build
npm run preview    # serve the production build
npm run lint       # ESLint
npm run format     # Prettier
```

## 12. How to work in this repo (instructions for Claude Code)

- Do one task at a time. After each task: run `npm run lint` and `npm run build`, fix anything that fails, then summarize what changed in plain language.
- Explain new concepts briefly (1–2 sentences) the first time they appear — the developer is learning.
- Don't rename files or change the folder structure without asking.
- Don't change `CORRECT_ANSWER`, card text or the palette unless asked.
- Commit-sized changes: suggest a short git commit message at the end of each task.
