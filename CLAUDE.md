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

The mockups in `/design` are the source of truth for all visuals:
`design/choose-screen.jpeg`, `design/result-correct.jpeg`, `design/result-incorrect.jpeg`.
Target viewport: **1280×831**. All pixel values below are measured at that size.

Items marked **(estimated)** were sampled from the mockups, not supplied by the designer. Items marked **(PENDING)** are guesses waiting for the developer's answer — build the guess, but don't treat it as final.

### Colors — define in `src/index.css` with `@theme`

Designer-supplied (exact — do not change):

| Token          | Hex                  | Use                                                    |
| -------------- | -------------------- | ------------------------------------------------------ |
| `night`        | `#0B263C`            | Page background                                        |
| `folder-top`   | `#BDAD91`            | Folder ("Tile") gradient, top                          |
| `folder-bottom`| `#68644B`            | Folder ("Tile") gradient, bottom                       |
| `aqua`         | `#80FCF8`            | SCAN / NEXT / TRY AGAIN buttons                        |
| `stamp-green`  | `#376B4B`            | "Account identified" stamp (correct)                   |
| `stamp-red`    | `#641C21`            | "Not quite" stamp (incorrect)                          |

Estimated from the mockups (confirm or replace):

| Token          | Hex       | Use                                                            |
| -------------- | --------- | -------------------------------------------------------------- |
| `night-band`   | `#10304A` | Header band behind the stepper (estimated)                     |
| `grid-line`    | `#15344F` | Faint background grid lines (estimated)                        |
| `folder-edge`  | `#1A1714` | Thick rough outline of folder, notes, buttons (estimated)      |
| `note`         | `#D8CFBA` | Note-card paper (estimated)                                    |
| `note-glow`    | `#ECE7DC` | Lighter center of note cards (estimated)                       |
| `type-ink`     | `#1B1F2A` | Text on paper and on aqua buttons (estimated)                  |
| `cream`        | `#EFE8D6` | Text + dashed border on stamps; info-line text (estimated)     |
| `pin`          | `#4A3A2C` | Small pin dot on choose-screen notes (estimated)               |
| `pushpin`      | `#D0342C` | Red pushpin on result-screen note (estimated)                  |
| `stepper`      | `#22D3D6` | Stepper circles, connectors, labels (estimated)                |

Contrast: aim for WCAG AA. `type-ink` on paper/aqua and `cream` on the stamps pass easily. **Light text on the dark bottom of the folder gradient is only ~4:1** — keep the info line where the gradient is still light enough, or give it a subtle backing (check once real fonts are in).

### Fonts

| Token            | Font (designer-supplied)          | Used for                                                  |
| ---------------- | --------------------------------- | --------------------------------------------------------- |
| `--font-title`   | Fletcher Typewriter Bold, ALL CAPS | Folder headings: the question; result heading            |
| `--font-button`  | Typer Pro Mono Bold               | SCAN / NEXT / TRY AGAIN; stepper numbers (estimated)      |
| `--font-body`    | XXII HandTypeWriter               | Paragraphs, bullet list, info line, scanner status        |
| `--font-note`    | Typewriter Revo                   | Card names on the note cards (both screens)               |
| `--font-stamp`   | Typewriter Spool CLN Bold         | "ACCOUNT IDENTIFIED" / "NOT QUITE" stamps                 |

- None of these are on Google Fonts. **(PENDING)** The developer supplies licensed `.woff2` files in `public/fonts/`, loaded with `@font-face` in `index.css` (`font-display: swap`). Until a file exists, fall back to `'Courier New', Courier, monospace`. (Section 2 still lists Fredoka/Nunito — update it when the fonts land.)
- Stepper labels ("Call / Case / Solve") look like a plain sans-serif, not a typewriter — use `system-ui` until told otherwise **(PENDING)**.

### Type scale (at 1280 wide; scale with `clamp()` below that)

| Element                       | Size   | Notes                                 |
| ----------------------------- | ------ | ------------------------------------- |
| Choose question (h1)          | ~36px  | caps, line-height ~1.2, max 2 lines   |
| Result heading (h1)           | ~30px  | caps, line-height ~1.2                |
| Note-card label               | ~30px  | centered, line-height ~1.15           |
| Body / bullets / info line    | ~22px  | line-height ~1.45, max width ~34ch    |
| Stamp text                    | ~28px  | caps                                  |
| Button text                   | ~34px  | caps, with a long arrow (⟶ / ⟵)       |
| Stepper number / label        | ~16px / ~13px |                                |

### Shared layout

```
┌───────────────────────────── header band (~105px, torn bottom edge) ───┐
│                                           (1)────(2)────(3)            │
│                                           Call   Case   Solve          │
└────────────────────────────────────────────────────────────────────────┘
      ┌──────────────────────── folder ~1015×528, tilted ~-1° ──────┐
      │  (content — see each screen)                                │
      │                                                             │
      │                                        ┌─────────────────┐  │
      └────────────────────────────────────────┤  BUTTON  ⟶      ├──┘
                                               └─────────────────┘
```

- **Page**: `night` background + faint square grid of 1px `grid-line` lines, ~64px cells (CSS gradients, no images).
- **Header band**: full width, ~105px tall, `night-band`, torn/uneven bottom edge. **No "CASE FILE #01" text or case-file icon** — the mockups don't show one **(PENDING)**.
- **Stepper** (top-right, ~70px from the right edge): 3 circles ~36px, `stepper` fill, ~3px dark ring, dark number; ~80px × 3px connectors; label ~13px below each. All three look identical in the mockups. Guess: decorative (not interactive), step 3 "Solve" is current on both screens, marked with `aria-current="step"` **(PENDING)**.
- **Folder** (the designer's "Tile"): x ≈ 145–1160, y ≈ 190–718 at 1280×831 (~79% of the width, slightly right of center). Rotated ~-1°. Vertical gradient `folder-top` → `folder-bottom`, subtle paper grain, ~5px rough `folder-edge` outline, ~16px corner radius. Inner padding ~52px left, ~65px top.
- **Action button** (`GameButton`): `aqua` fill, ~260×80 (TRY AGAIN ~280 wide), ~28px radius (pill-like), rotated ~-2°, rough ~3px `folder-edge` outline, soft aqua glow, `type-ink` text. Placed straddling the folder's bottom edge (half inside, half outside), ~70px in from the folder's right edge. No 3D bottom edge; on press translate down ~2px and dim the glow. Visible focus ring. Minimum 48px tall.
- **Rough / torn edges and paper grain**: CSS + one inline SVG filter (`feTurbulence` + `feDisplacementMap`) — no image files **(PENDING)**.
- **Tilts** are fixed decoration (not animation), so they stay on with reduced motion.

### Components

- **NoteCard** (replaces `OptionTile`): `note` paper with a `note-glow` radial center, rough dotted edge, ~215×190. Each note has its own small fixed tilt (about -1°, +1°, -0.5°, +1.5°) and vertical offset (±10px). **No icon.** Label in `--font-note`, ~30px, `type-ink`. Choose screen: small `pin` dot (~12px) at top-left. Result screen: red pushpin (~30px) at top-left.
  In debug mode (`?debug=1`) the note is a real `<button>` with a small lift on hover; otherwise display-only.
- **Stamp**: rounded rect (~14px radius), rotated ~-8°, darker vignette toward the edges, cream dashed inner border (~2px, inset ~10px), `cream` text in `--font-stamp`. Correct: `stamp-green`, "✓ ACCOUNT IDENTIFIED" (~370×105). Incorrect: `stamp-red`, "✕ NOT QUITE" (~290×105). Overlaps the folder's top-left corner. It is a label, not a button (the notes call it a "button"/"pill" — it has no action).
- **Info line** (replaces the `CameraPrompt` panel): navy (`night`) circle ~34px with a 2px white ring and a white "i", then "Scan the card in the file" in `--font-body`, `cream`, ~22px. Bottom-left of the folder. Scanner status (starting / waiting-for-lift / scanning / denied / no-camera — same messages as before) shows as a smaller line under it, in an `aria-live="polite"` region; error messages in `stamp-red` on a `cream` backing **(PENDING)**.
- **GameShell**: header band + stepper, `<main>` holding the folder.

### Screen 1 — Choose (`/`)

```
      ┌─────────────────────────────────────────────────────────────┐
      │  WHAT TYPE OF BANK ACCOUNT DOES ANANYA                      │
      │  HAVE?                                                      │
      │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                    │
      │  │•      │ │•      │ │•      │ │•      │   (4 notes, tilted)│
      │  │Savings│ │ Fixed │ │Recurr.│ │Current│                    │
      │  │Account│ │Deposit│ │Deposit│ │Account│                    │
      │  └───────┘ └───────┘ └───────┘ └───────┘                    │
      │  (i) Scan the card in the file                              │
      │      ● Scanning…                       ┌─────────────────┐  │
      └────────────────────────────────────────┤   SCAN  ⟶       ├──┘
                                               └─────────────────┘
```

- h1 = the case question (caps via CSS). Text lives in `cards.ts`, not JSX **(PENDING — needs a new field, see section 4)**.
- Notes: one row of 4, ~15–20px gaps, starting ~45px below the question. 2×2 below `lg`.
- Note labels use the card titles from `cards.ts` ("Savings Account", "Fixed Deposit", …). The mockup's "Fixed Deposit Account" / "Reccuring Deposit Account" wording and its typo are **not** copied **(PENDING)**.
- **SCAN ⟶ button** **(PENDING — behavior)**: scanning is currently automatic. Guess: SCAN is a real button that turns the camera on; status starts as "Press SCAN, then place your card".

### Screen 2 — Result (`/result/:cardId`)

```
 ┌──────────────────────┐
 │ ✓ ACCOUNT IDENTIFIED │  (stamp, tilted, overlapping the corner)
 └───┬──────────────────┴──────────────────────────────────────┐
     │                         YES; IT'S A SAVINGS ACCOUNT!    │
     │   📌┌─────────┐          Ananya uses her account to …   │
     │     │ Savings │                                         │
     │     │ Account │          A savings account lets her:    │
     │     └─────────┘            • Put money in               │
     │                            • Keep it safe  …            │
     │                                      ┌──────────────┐   │
     └──────────────────────────────────────┤  NEXT  ⟶     ├───┘
                                            └──────────────┘
```

- Two columns inside the folder: left ~40% (pinned note of the scanned card, vertically centered), right ~60% (text, starting ~430px into the folder, top ~80px below the folder top). Stack vertically below `lg`.
- **Correct**: `stamp-green` stamp "✓ ACCOUNT IDENTIFIED"; h1 "YES; IT'S A SAVINGS ACCOUNT!"; paragraph; "A savings account lets her:" + bullet list; **NEXT ⟶ only** → `NEXT_ROUTE`. The old Go Back button is removed **(PENDING)**.
- **Incorrect**: `stamp-red` stamp "✕ NOT QUITE"; h1 "A <CARD TITLE> IS USED WHEN..."; paragraph about that account; paragraph about Ananya; **⟵ TRY AGAIN** (aqua, arrow on the left) → `/`. The old "Good try!" line and the coral colour are removed.
- No card icon on this screen.
- All result copy is case-specific and lives in `cards.ts` **(PENDING — new fields in section 4; mockups only give text for Savings and Current Account, the others must be written and approved)**.

### Motion

- Choose screen: notes drop in (fade + small fall) on mount, staggered ~60ms each.
- Result screen: folder fades/scales 0.96 → 1; the stamp "thunks" in shortly after (scale ~1.3 → 1 + fade, ~250ms). Incorrect: the folder also does one short horizontal shake (~400ms).
- All animations are CSS keyframes in `index.css`, wrapped in `@media (prefers-reduced-motion: no-preference)`. No animation libraries. (Static tilts are not animations and always show.)

### Responsive

- Must work without scrolling on the Choose screen at 1920×1080 and on a 13" laptop (~1280×650 visible): the folder and type scale down with `clamp()`/viewport units so the header + folder + overlapping button fit.
- Below `lg`: notes 2×2, result columns stack, stamp sits above the folder content, button sits below the content instead of straddling the edge.

<!-- Previous design (archived — replaced by the mockups above): -->
<!-- ### Palette — define in `src/index.css` with `@theme`

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
- No animation libraries. -->

## 10. Accessibility and quality rules

- Semantic HTML: one `<h1>` per page, `<main>`, real `<button>` / `<Link>` elements.
- All interactive elements keyboard-focusable with a visible focus ring.
- Set `document.title` per page ("What will you choose? · Case File", "Correct! · Case File", etc.).
- Works on a 1080p classroom display and a 13" laptop without scrolling on the Choose screen.
- No console errors or warnings in dev. Two known warnings from inside `qr-scanner` are accepted (the developer approved them): "The camera stream is only accessible if the page is transferred via https" (shows on `http://localhost` only, not on Vercel) and the browser's Canvas2D "willReadFrequently" performance hint. Don't hack around them.
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
