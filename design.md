# defellox — Design System

> Brand version 1.1 — updated with liquid glassmorphism

---

## Colors

### Brand

| Token | Hex | Usage |
|---|---|---|
| `--brand` | `#3cb44f` | Primary CTA, active states, badges, links |
| `--brand-light` | `#5cb870` | Hover states, icon fills, highlights |
| `--brand-dark` | `#2d8a3e` | Pressed states, deep accents |

### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0d1a10` | Page / app background |
| `--bg-base` | `#111f14` | Default card surface |
| `--bg-surface` | `#172b1c` | Elevated card / sidebar |
| `--bg-raised` | `#1e3824` | Tooltip, dropdown, modal |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#d4edda` | Headings, body text |
| `--text-secondary` | `#7aab83` | Subtext, captions, placeholders |
| `--text-muted` | `#3d6645` | Disabled, overlines, dividers |

### Borders

| Token | Value | Usage |
|---|---|---|
| `--border` | `rgba(60, 180, 79, 0.14)` | Default card borders |
| `--border-strong` | `rgba(60, 180, 79, 0.25)` | Focused inputs, selected states |
| `--border-glass-top` | `rgba(180, 255, 180, 0.22)` | Glass card top edge — simulates light refraction |
| `--border-glass-left` | `rgba(180, 255, 180, 0.14)` | Glass card left edge — subtle light catch |
| `--border-glass-accent` | `rgba(60, 180, 79, 0.40)` | Accent-tier glass card border |
| `--border-glass-brand` | `rgba(100, 220, 110, 0.50)` | Brand-fill glass card border |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#3cb44f` | Confirmation, verified |
| `--color-warning` | `#e6a817` | Warnings, pending |
| `--color-error` | `#e05252` | Errors, destructive actions |
| `--color-info` | `#4a90d9` | Informational notices |

### CSS Variables (copy-paste ready)

```css
:root {
  /* Brand */
  --brand:           #3cb44f;
  --brand-light:     #5cb870;
  --brand-dark:      #2d8a3e;

  /* Backgrounds */
  --bg:              #0d1a10;
  --bg-base:         #111f14;
  --bg-surface:      #172b1c;
  --bg-raised:       #1e3824;

  /* Text */
  --text-primary:    #d4edda;
  --text-secondary:  #7aab83;
  --text-muted:      #3d6645;

  /* Borders */
  --border:               rgba(60, 180, 79, 0.14);
  --border-strong:        rgba(60, 180, 79, 0.25);
  --border-glass-top:     rgba(180, 255, 180, 0.22);
  --border-glass-left:    rgba(180, 255, 180, 0.14);
  --border-glass-accent:  rgba(60, 180, 79, 0.40);
  --border-glass-brand:   rgba(100, 220, 110, 0.50);

  /* Glass fills */
  --glass-base:    linear-gradient(135deg, rgba(60,180,79,0.08) 0%, rgba(13,26,16,0.60) 60%, rgba(30,56,36,0.30) 100%);
  --glass-accent:  linear-gradient(135deg, rgba(60,180,79,0.22) 0%, rgba(45,138,62,0.12) 50%, rgba(13,26,16,0.50) 100%);
  --glass-brand:   linear-gradient(135deg, rgba(60,180,79,0.85) 0%, rgba(45,138,62,0.90) 100%);
  --glass-blur:    blur(20px) saturate(180%);
  --glass-sheen:   linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%);
  --glass-glow:    radial-gradient(ellipse, rgba(60,180,79,0.07) 0%, transparent 70%);

  /* Semantic */
  --color-success:   #3cb44f;
  --color-warning:   #e6a817;
  --color-error:     #e05252;
  --color-info:      #4a90d9;
}
```

---

## Typography

### Typefaces

#### Syne — Display & Headings
- Source: [Google Fonts](https://fonts.google.com/specimen/Syne)
- Weights used: **700**, **800**
- Use for: logo, page titles, section headings, marketing copy
- Character: geometric, bold, confident

#### DM Sans — Body & UI
- Source: [Google Fonts](https://fonts.google.com/specimen/DM+Sans)
- Weights used: **300**, **400**, **500**
- Use for: paragraphs, labels, buttons, inputs, captions
- Character: clean, modern, highly readable at small sizes

### Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

```css
--font-display: 'Syne', sans-serif;
--font-body:    'DM Sans', sans-serif;
```

### Type Scale

| Role | Font | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|---|
| Display | Syne | 48px | 800 | 1.05 | -0.02em |
| Heading 1 | Syne | 32px | 800 | 1.15 | -0.01em |
| Heading 2 | Syne | 22px | 700 | 1.25 | 0 |
| Heading 3 | Syne | 18px | 700 | 1.3 | 0 |
| Subheading | DM Sans | 17px | 500 | 1.5 | 0 |
| Body | DM Sans | 15px | 400 | 1.7 | 0 |
| Small / Caption | DM Sans | 13px | 400 | 1.6 | 0 |
| Overline | DM Sans | 11px | 600 | 1 | 0.12em |

### CSS Classes (copy-paste ready)

```css
.text-display {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.text-h1 {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.text-h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--text-primary);
}

.text-h3 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
}

.text-subheading {
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-primary);
}

.text-body {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.7;
  color: var(--text-primary);
}

.text-caption {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--text-secondary);
}

.text-overline {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brand);
}
```

## Glassmorphism

defellox uses a liquid glass aesthetic — cards feel like frosted green glass floating over a deep dark background. Every surface has depth, refraction, and an inner glow.

### Philosophy

Glass cards are built from five stacked layers. Each layer adds one quality:

| Layer | CSS property | What it adds |
|---|---|---|
| Fill | `background` gradient | Green-tinted translucency |
| Frost | `backdrop-filter: blur(20px) saturate(180%)` | Depth — blurs whatever is behind |
| Refraction | Asymmetric border (top/left brighter) | Simulates light hitting a glass edge |
| Sheen | `::before` gradient overlay | Surface highlight — the "wet" feel |
| Glow | `::after` radial gradient | Internal ambient light from the brand color |

### Card tiers

Three tiers control visual hierarchy — use them intentionally, not interchangeably.

| Class | Purpose | When to use |
|---|---|---|
| `.glass` | Base tier | Default content cards, data panels |
| `.glass-accent` | Mid tier | Stats, featured content, active states |
| `.glass-brand` | Top tier / opaque | Primary CTA, hero cards — use sparingly |

### CSS (copy-paste ready)

```css
/* Base glass card */
.glass {
  background: linear-gradient(
    135deg,
    rgba(60, 180, 79, 0.08) 0%,
    rgba(13, 26, 16, 0.60) 60%,
    rgba(30, 56, 36, 0.30) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(60, 180, 79, 0.18);
  border-top: 1px solid rgba(180, 255, 180, 0.22);
  border-left: 1px solid rgba(180, 255, 180, 0.14);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

/* Sheen — surface highlight */
.glass::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 50%);
  border-radius: inherit;
  pointer-events: none;
}

/* Glow — internal ambient light */
.glass::after {
  content: '';
  position: absolute;
  top: -60%;
  left: -20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(60, 180, 79, 0.07) 0%, transparent 70%);
  pointer-events: none;
}

/* Accent tier — more visible, brighter border */
.glass-accent {
  background: linear-gradient(
    135deg,
    rgba(60, 180, 79, 0.22) 0%,
    rgba(45, 138, 62, 0.12) 50%,
    rgba(13, 26, 16, 0.50) 100%
  );
  border: 1px solid rgba(60, 180, 79, 0.40);
  border-top: 1px solid rgba(180, 255, 180, 0.45);
}

/* Brand tier — opaque green, for primary CTAs only */
.glass-brand {
  background: linear-gradient(
    135deg,
    rgba(60, 180, 79, 0.85) 0%,
    rgba(45, 138, 62, 0.90) 100%
  );
  border: 1px solid rgba(100, 220, 110, 0.50);
  border-top: 1px solid rgba(200, 255, 200, 0.60);
}

/* Shimmer line — thin top accent on any card */
.glass-shimmer {
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200, 255, 200, 0.35), transparent);
  border-radius: 1px;
}

/* Glass input field */
.glass-input {
  background: rgba(13, 26, 16, 0.40);
  border: 1px solid rgba(60, 180, 79, 0.20);
  border-top: 1px solid rgba(180, 255, 180, 0.12);
  border-radius: 9999px;
  padding: 10px 16px;
  color: #d4edda;
  font-family: var(--font-body);
  font-size: 13px;
  outline: none;
  width: 100%;
}
.glass-input::placeholder {
  color: rgba(122, 171, 131, 0.40);
}
```

### Page background

The page background uses layered radial gradients to give glass cards something to refract against. Never use a flat solid color.

```css
.page-bg {
  background:
    radial-gradient(ellipse at 20% 30%, rgba(60, 180, 79, 0.18) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 70%, rgba(45, 138, 62, 0.14) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(17, 31, 20, 0.98) 0%, #0d1a10 100%);
  min-height: 100vh;
}
```

### Glow effects

Use box-shadow to make interactive elements feel lit from within.

```css
/* Glowing dot / status indicator */
.glow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3cb44f;
  box-shadow: 0 0 6px rgba(60, 180, 79, 0.8);
}

/* Glowing bar fill (charts, progress) */
.glow-bar {
  background: linear-gradient(90deg, #2d8a3e, #3cb44f);
  box-shadow: 0 0 8px rgba(60, 180, 79, 0.4);
}

/* Glowing avatar ring */
.glow-avatar {
  border: 1.5px solid rgba(60, 180, 79, 0.35);
  box-shadow: 0 0 10px rgba(60, 180, 79, 0.15);
}
```

### Rules

- `backdrop-filter` requires the parent to **not** have `overflow: hidden` set before the blur is applied — set `overflow: hidden` on the card itself, not a wrapper.
- Always set `position: relative` on glass cards so `::before` / `::after` pseudo-elements are contained.
- On mobile or low-end devices, `backdrop-filter` can be expensive. Provide a fallback: `@supports not (backdrop-filter: blur(1px)) { .glass { background: rgba(17, 31, 20, 0.92); } }`
- Never stack more than two glass cards directly on top of each other — the blur compounds and becomes muddy.
- `.glass-brand` text must always use `#0d1a10` (near-black), never `--text-primary`. The green background is too light for the soft white text.

---

## Notes

- All dark backgrounds are derived from `#3cb44f` — tinted toward green, never pure black or neutral gray. This keeps the dark theme feeling cohesive with the brand.
- Never use pure white (`#ffffff`) for text on dark backgrounds — always use `--text-primary` (`#d4edda`) to maintain the warm green tint.
- The brand green `#3cb44f` should represent roughly **10%** of the visual surface area. Overusing it dilutes its impact.
- Syne is decorative — do not use it for body text or UI labels smaller than 16px.
- Glass cards need a rich background to work — always use the `page-bg` radial gradient. Glass on a flat `#0d1a10` loses all its depth.
- The `.glass-brand` tier is for one card per layout maximum — it is the loudest element and draws the eye immediately. Use it for the primary CTA only.
- Always add `.glass-shimmer` as the first child element inside any glass card — it reinforces the glass-edge illusion at the top.
- Test on Safari — `-webkit-backdrop-filter` is required for WebKit browsers, always include it alongside `backdrop-filter`.