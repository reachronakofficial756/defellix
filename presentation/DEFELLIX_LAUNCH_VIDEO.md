# DEFELLIX — SaaS Launch Video
## Full Production Document: Script + Motion Graphics Bible
**Format:** After Effects Motion Graphics | **Duration:** 97 seconds | **Ratio:** 16:9 (1920×1080) | **FPS:** 60fps

---

> **DIRECTOR'S NOTE**
> This is not a product tour. It is an emotional argument.
> The first 22 seconds must make the viewer feel the pain viscerally.
> The next 55 seconds must make the solution feel inevitable.
> The last 20 seconds must make them act.
> Every frame earns its place or gets cut.

---

## BRAND PALETTE (After Effects Swatches)

| Role | Hex | RGB | Use |
|------|-----|-----|-----|
| Background | `#0D1A10` | 13, 26, 16 | Scene base |
| Brand Green | `#3CB44F` | 60, 180, 79 | CTAs, verified states, key accents |
| Brand Light | `#5CB870` | 92, 184, 112 | Hover highlights, glow sources |
| Surface | `#111F14` | 17, 31, 20 | Card fills |
| Elevated | `#172B1C` | 23, 43, 28 | Raised cards, modals |
| Text Primary | `#D4EDDA` | 212, 237, 218 | All body copy |
| Text Secondary | `#7AAB83` | 122, 171, 131 | Captions, metadata |
| Warning/Pain | `#E05252` | 224, 82, 82 | Problem scenes |
| Gold/Trust | `#E6A817` | 230, 168, 23 | Milestone amounts, value |
| Glass Border | `rgba(60,180,79,0.25)` | — | Card edges |

---

## TYPOGRAPHY (After Effects Character Panel)

| Role | Font | Weight | Size | Tracking |
|------|------|--------|------|---------|
| Display hero | Syne | 800 | 72–96pt | -20 |
| Section headline | Syne | 700 | 48pt | -15 |
| Sub-headline | Syne | 700 | 32pt | -10 |
| Body VO support | DM Sans | 400 | 22pt | 0 |
| UI labels | DM Sans | 500 | 16pt | 20 |
| Data callouts | Syne | 800 | 60pt | -25 |
| Overlines | DM Sans | 600 | 12pt | 150 |

> Install Syne + DM Sans from Google Fonts before opening any AE project.

---

## AFTER EFFECTS PROJECT STRUCTURE

```
📁 DEFELLIX_LAUNCH/
├── 📁 00_PRE-COMP_ASSETS/
│   ├── 📁 UI_Mockups/         ← All phone/screen mockups as pre-comps
│   ├── 📁 Data_Visuals/       ← Stat counters, charts, number builds
│   ├── 📁 FX_Library/         ← Glows, particles, blockchain nodes
│   └── 📁 Type_Animations/    ← Reusable text reveal pre-comps
├── 📁 01_SCENES/
│   ├── SC01_Hook              (0:00–0:08)
│   ├── SC02_Problem_Spiral    (0:08–0:22)
│   ├── SC03_Breaking_Point    (0:22–0:30)
│   ├── SC04_Transition        (0:30–0:35)
│   ├── SC05_Solution_Intro    (0:35–0:43)
│   ├── SC06_Feature_Contract  (0:43–0:57)
│   ├── SC07_Feature_Sign      (0:57–1:07)
│   ├── SC08_Feature_Proof     (1:07–1:17)
│   ├── SC09_Crystallize       (1:17–1:27)
│   └── SC10_CTA               (1:27–1:37)
└── 📁 MASTER_COMP/
    └── DEFELLIX_v1_MASTER     ← Final edit comp
```

---

## SOUND DESIGN BRIEF

**Music Mood**: Cinematic electronic. Builds with tension. Releases into optimistic momentum.
Think: Hans Zimmer's precision + a modern indie-electronic warmth.

**Reference Tracks** (Artlist / Musicbed search terms):
- `"cinematic tension build minimal"`
- `"emotional tech hopeful"`
- `"SaaS product launch orchestral electronic"`

**Music Arc:**
| Timecode | Mood | Instruction |
|----------|------|-------------|
| 0:00–0:22 | Tense, uneasy | Single sustained low note. Subtle percussion hits on pain moments. |
| 0:22–0:30 | Cracking point | Music drops to near silence. Single piano note holds. |
| 0:30–0:35 | Breath moment | One beat of silence. Then a soft chime. |
| 0:35–0:57 | Rising | Music re-enters. Melodic. Builds with each feature reveal. |
| 0:57–1:17 | Ascending | Full melody. Every UI reveal synced to a beat hit. |
| 1:17–1:27 | Triumphant | Full arrangement. Emotional peak. |
| 1:27–1:37 | Settled, confident | Music resolves. Clean, open chord holds to end. |

**SFX (Sync to visuals):**
- `whoosh_soft` — every major scene transition
- `notification_chime` — blockchain verification moment
- `glass_tap` — client signing tap
- `lock_click` — contract locked on chain
- `verified_ding` — green checkmark appearances
- `keyboard_type` — contract creation UI
- `paper_rip` — pain montage (WhatsApp message ignored)

---

---

# SCENE-BY-SCENE PRODUCTION GUIDE

---

## SCENE 01 — THE HOOK
**Timecode:** `0:00 → 0:08` | **Duration:** 8s

### VO (Voiceover):
> *"You did the work."*
> *(2s pause)*
> *"They didn't pay."*

**VO Delivery**: Male voice. Low, measured, slightly tired. Not angry — defeated. Like someone who's been through it. Indian-accented English is perfect for this. Not overly dramatic.

---

### VISUAL SEQUENCE:

**Frame 0:00–0:02**
- **BG**: Pure `#0D1A10`. Absolute darkness. No elements.
- A mobile phone screen fades in from black — centred, slight 3D perspective tilt (15° Y-axis rotation). Screen shows a WhatsApp conversation.
- The chat shows:
  ```
  You: "Project is complete. Invoice sent."
  [Read 3 days ago]
  [No reply]
  ```
- The "Read" receipt is in `#E05252` red. Pulsing slightly — like a wound.
- **Typeface on phone screen**: DM Sans, realistic, WhatsApp green UI.

**AE TECHNIQUE**: Phone mockup as a shape layer group. Screen content as a nested pre-comp. Fade-in: Opacity 0→100% over 20 frames, eased. Subtle parallax depth using `null object + expression link` on X/Y position.

**Frame 0:02–0:04**
- VO says *"You did the work."*
- On the word "work" — the phone slightly shakes (position wiggle expression: `wiggle(3, 4)`) as if the freelancer is checking it anxiously.
- A soft red ambient glow pulses behind the phone: `radial gradient, #E05252, 8% opacity, 0→15% opacity pulse, 1.5s cycle`.

**Frame 0:04–0:08**
- **CUT** — hard cut, no transition — to a second phone screen.
- This one shows a Gmail compose window. A half-written email:
  ```
  Subject: Payment Follow-up (3rd reminder)
  "Hi, just following up again on the invoice..."
  ```
- The cursor is blinking at the end of the sentence. The email looks tired, like it's been sent many times.
- VO says *"They didn't pay."*
- On the word "pay" — the email screen goes dark. Fade to black. Hard cut.

**AE TECHNIQUE**: Both phone screens built as shape layer mockups (rounded rect 44px radius, `#1A1A2E` screen bg). No stock footage. Pure shape layers + text.

---

## SCENE 02 — THE PROBLEM SPIRAL
**Timecode:** `0:08 → 0:22` | **Duration:** 14s

### VO:
> *"Eighty-five percent of freelancers are paid late."*
> *"Sixty-six percent face payment disputes — every single year."*
> *"Thirty-six percent have no contract at all."*
> *"And without one — the average dispute takes over a year to resolve."*

**VO Delivery**: Rhythm picks up slightly. Each stat delivered cleanly, without emotion — letting the numbers do the work. Short pause between each.

---

### VISUAL SEQUENCE:

**Frame 0:08–0:10** — Stat Card #1
- Background `#0D1A10`. Three horizontal columns fade in — divided by thin `rgba(60,180,79,0.15)` vertical lines. Feels like a data dashboard.
- **Left column** activates first:
  - Overline text rises from bottom: `FREELANCERS PAID LATE` in `#7AAB83`, 12pt, 150 tracking
  - Then the number builds: counter animation from 0 → **85%**
  - Font: Syne 800, 96pt, `#D4EDDA`
  - The `%` symbol glows softly in `#E05252`

**AE TECHNIQUE**: Number counter — use `Text Source Expression`:
```javascript
Math.round(effect("Slider Control")("Slider")) + "%"
```
Keyframe Slider from 0→85 over 1.5s. Ease: `easeInOut(0.3, 1.0)`.

**Frame 0:10–0:13** — Stat Card #2
- Middle column activates:
  - Overline: `PAYMENT DISPUTES ANNUALLY`
  - Counter builds: 0 → **66%**
  - Color: `#E6A817` (warning gold — money issue)
  - A thin horizontal red line crawls across the full width of the frame behind all columns as a stress indicator.

**Frame 0:13–0:17** — Stat Card #3
- Right column activates:
  - Overline: `FREELANCERS WITH NO CONTRACT`
  - Counter builds: 0 → **36%**
  - Color: `#E05252` (red — danger)

**Frame 0:17–0:22** — Data climax
- All three numbers are now visible simultaneously.
- Camera (virtual — using position/scale on main comp) slowly zooms in toward the center.
- A fourth element appears centered BELOW all three stats — smaller, body size:
  - `"Without a contract — average dispute: 12.5 months"`
  - This line types on character by character (`Text Animator → Character Offset` or per-character reveal).
  - The number `12.5` is highlighted in `#E05252` with a glowing underline.
- The three columns slowly fade — the `12.5 months` line stays, getting larger, until it fills frame.
- CUT.

**AE TECHNIQUE**: All stat cards built with `Glass card` pre-comp:
- Shape layer rounded rect, `rgba(60,180,79,0.06)` fill, `1px rgba(60,180,79,0.25)` stroke
- Top edge: separate 1px line, `rgba(180,255,180,0.22)` — simulates glass refraction
- Entrance: scale from 96%→100% + opacity 0→100%, 18 frames, `easeOut`

---

## SCENE 03 — THE BREAKING POINT
**Timecode:** `0:22 → 0:30` | **Duration:** 8s

### VO:
> *"Eight point eight trillion dollars."*
> *"That's what the world loses every year — because people don't trust each other."*

**VO Delivery**: Slower. Weightier. Each number lands like a stone being dropped.

---

### VISUAL SEQUENCE:

**Frame 0:22–0:26**
- Pure black screen. The number `$8.8T` materialises from nothing — assembled particle by particle (each character drawn by 50–80 tiny `#3CB44F` dots converging into letterforms).
- Font: Syne 800. Size: 120pt. Color: `#D4EDDA`. Centered.
- Subtle green ambient glow behind it, pulsing slowly.

**AE TECHNIQUE**: Particle text assembly — use `CC Particle World` or `Trapcode Particular`:
- Emit particles from a large area
- Use `Textured Disc` as particle type
- Drive particles toward a path using `Attractor` or manual keyframe to assembled position
- Timeline: particles visible 0:22, converge to letterform by 0:24.

**Frame 0:26–0:30**
- The `$8.8T` number remains but dims to 40% opacity as background element.
- Foreground: A globe wireframe (minimal, just latitude/longitude lines in `rgba(60,180,79,0.12)`) fades in behind the number. Slowly rotating, 0.3 RPM.
- VO continues over this.
- At `0:29` — everything SHATTERS. The globe and the number both explode outward into particles — not violently, but like they dissolve, fragment, drift apart.
- The screen goes to near-black.
- A single beat of silence.

**AE TECHNIQUE**:
- Globe: Use `CC Sphere` on a grid-textured solid, set to wireframe mode. Tint `#3CB44F`, opacity 15%.
- Shatter effect: `Shatter` plugin on the number layer (set to `Glass` type, `Gravity: 0.2`, `Radius: 0.4`). Trigger at 0:29.

---

## SCENE 04 — THE BREATH / TRANSITION
**Timecode:** `0:30 → 0:35` | **Duration:** 5s

### VO:
> *"What if you never had to worry about this again?"*

**VO Delivery**: Tone shifts completely. Softer. Curious. Almost a whisper.

---

### VISUAL SEQUENCE:

**Frame 0:30–0:33**
- True black. No elements.
- From the absolute center of the frame, a single point of green light (`#3CB44F`) appears. 2px circle.
- It pulses once. Twice. Like a heartbeat.
- Then it begins to expand outward — not as a ring but as a soft radial glow, illuminating the scene from nothing.

**Frame 0:33–0:35**
- As the glow expands, the Defellix wordmark assembles itself in the center:
  - Font: Syne 800, 72pt, `#D4EDDA`
  - Characters slide in from slight downward offset (Y: +20px → 0, opacity 0→100%, staggered 3 frames per character, total 18 frames)
  - Below it, a thin overline: `THE TRUST LAYER FOR FREELANCE WORK` in `#7AAB83`, 11pt, 150 tracking — fades in after wordmark completes.

**AE TECHNIQUE**:
- Radial glow: Shape layer ellipse, `radial gradient fill`, `#3CB44F` center → transparent edge, scale 0%→800% over 1.5s, opacity 100%→0% simultaneously.
- Wordmark: Each character on its own text layer for individual stagger, OR use `Text Animator → Range Selector → Position` with offset stagger.

---

## SCENE 05 — SOLUTION INTRODUCTION
**Timecode:** `0:35 → 0:43` | **Duration:** 8s

### VO:
> *"Defellix gives every freelancer something powerful."*
> *"A contract your client can't deny."*
> *"Signed in two minutes. From any phone. No lawyer needed."*

**VO Delivery**: Clear, confident, measured. Not salesy. Honest.

---

### VISUAL SEQUENCE:

**Frame 0:35–0:38**
- The Defellix wordmark slides upward and settles in the top-left corner — transforming from hero element to brand lockup. (Position keyframe + scale from 100% to 40%, 20 frames, easeInOut).
- The background transitions: `#0D1A10` → layered radial gradients appear (two soft green orbs at `20% 30%` and `80% 70%`, 18% opacity). The brand environment materialises.
- Three glass cards float in from below (staggered entry, 8 frames apart):

**Card 01 — CENTER** (largest, `.glass-accent` tier):
```
┌─────────────────────────────────┐
│  🔐                             │
│  LEGALLY VERIFIED CONTRACT      │
│  Tamper-proof. Time-stamped.    │
│  Permanent.                     │
└─────────────────────────────────┘
```
Lock icon in `#3CB44F`. Subtle glow.

**Card 02 — LEFT** (smaller, offset up):
```
┌─────────────────┐
│  ✍️              │
│  CLIENT SIGNS   │
│  No account     │
│  needed         │
└─────────────────┘
```

**Card 03 — RIGHT** (smaller, offset down):
```
┌─────────────────┐
│  📋             │
│  FREE LEGAL     │
│  CERTIFICATE    │
│  Section 65B    │
└─────────────────┘
```

**Frame 0:38–0:43**
- Cards are fully visible. They float with gentle, independent sinusoidal motion:
  - Card 1: `sin(time * 0.8) * 4` Y offset
  - Card 2: `sin(time * 0.6 + 1) * 5` Y offset
  - Card 3: `sin(time * 0.7 + 2) * 3` Y offset
- VO completes over this.

**AE TECHNIQUE**:
- Card float expressions (apply to Position Y):
```javascript
// Card gentle float
var t = time;
var freq = 0.8; // adjust per card
var amp = 4;    // pixels
value + [0, Math.sin(t * freq) * amp];
```
- Glass card: Shape layer (RR 20px) + gradient fill + border + shimmer line at top.

---

## SCENE 06 — FEATURE REVEAL 01: CREATE THE CONTRACT
**Timecode:** `0:43 → 0:57` | **Duration:** 14s

### VO:
> *"Start a project. Fill in the details — scope, milestones, payment terms."*
> *"Defellix even suggests milestone structures using AI."*
> *"In two minutes, your contract is ready."*

**VO Delivery**: Clear walkthrough tone. Slightly faster. Showing, not selling.

---

### VISUAL SEQUENCE:

**Frame 0:43–0:47** — Dashboard entrance
- A laptop mockup slides in from the right (subtle 3D perspective, 10° Y rotation, `#111F14` body color). Screen shows the Defellix dashboard.
- Dashboard elements build in sequentially (each appearing on a subtle upward slide, 10 frames, staggered):

**Left sidebar** (vertical, `#111F14` bg, `#3CB44F` accent left border):
```
DEFELLIX
────────────────
⬡ Dashboard
📋 Contracts
👤 Profile
```

**Main content area** (center):
```
Good morning, Ravi.

[+ Create Contract]  [← Drafts (2)]

────────── Active Contracts ──────────
  Website Redesign    Pending Sign    ₹45,000
  Logo Package        Draft           ₹8,000
```

The `[+ Create Contract]` button glows in `#3CB44F`.

**Frame 0:47–0:52** — Contract creation form
- The `[+ Create Contract]` button gets a soft click animation (scale 100%→97%→100%, 6 frames), then a smooth slide transition — the dashboard slides left out of frame while the contract creation form slides in from right.

**Contract form UI** (glass card, fills center stage):
```
Create a New Contract
─────────────────────────────────────

Project Name        [ Website Redesign — E-commerce ]
Client Name         [ Priya Sharma ]
Client Email        [ priya@techstartup.in ]
Project Value       [ ₹45,000 ]
Due Date            [ March 30, 2026 ]

Milestones          [+ Add Milestone]
  ◉ Design mockup        ₹15,000  — Mar 10
  ◉ Development          ₹20,000  — Mar 22
  ◉ Final delivery       ₹10,000  — Mar 30

✨ AI Suggestion: "Add a revision limit clause"  [Add →]
```

- Each field fills in with a typing animation — cursor appears, text types at 60wpm speed.
- The AI suggestion pill (`#172B1C` bg, `#3CB44F` text, subtle glow) bounces in from the bottom of the form.

**AE TECHNIQUE**:
- Typing animation: Use `Text Animator → Character Range → Opacity 0→100%` with `Based On: Characters` + `Start: 0% → 100%` keyframe over duration.
- The `₹` symbol on milestone amounts always renders in `#E6A817` gold — suggests real value.

**Frame 0:52–0:57** — Complete + ready to send
- All form fields are filled. A progress bar at the top of the form reaches 100% in `#3CB44F`.
- A `[Send to Client →]` button appears at the bottom — glass-brand tier, glowing.
- Small text below the button: `"Contract will be time-stamped and verified upon signing."`
- The button pulses once — inviting the click.

---

## SCENE 07 — FEATURE REVEAL 02: CLIENT SIGNS
**Timecode:** `0:57 → 1:07` | **Duration:** 10s

### VO:
> *"Your client gets a link. They open it on their phone."*
> *"No account. No registration. No confusion."*
> *"They read the terms. They sign."*
> *"And the moment they do — something extraordinary happens."*

**VO Delivery**: Pace quickens. On "extraordinary" — pull back slightly. Create anticipation.

---

### VISUAL SEQUENCE:

**Frame 0:57–1:01** — The client experience
- Laptop slides out left. A phone slides in center — upright, facing us, slight 5° rotation for depth.
- Phone screen: Mobile browser. URL bar shows `defellix.com/c/xyz123`.
- A clean contract review page fills the phone screen:
```
Contract: Website Redesign
───────────────────────────
Client:  Priya Sharma
From:    Ravi Kumar (defellix.com/ravi_dev)
Value:   ₹45,000
Due:     March 30, 2026

Milestones:
  ○ Design mockup    ₹15,000
  ○ Development      ₹20,000
  ○ Final delivery   ₹10,000

[Scroll to review terms ↓]

──────────────
[✓ Sign Contract]
```

- A finger cursor (custom drawn — simple white oval with slight shadow) scrolls through the contract. The page scrolls smoothly. 3 second browse.

**Frame 1:01–1:05** — The signing moment
- Finger taps `[✓ Sign Contract]`.
- Button press animation: scale 100%→97%→100%, color flash to brighter `#5CB870`.
- A signature-style text appears — `Priya Sharma` in a cursive-style font (DM Sans Italic works), fading in with a slight draw-on effect.
- The button transforms into a `✓ Signed` state — green checkmark, glass-accent tier.

**AE TECHNIQUE**:
- Cursive signature draw-on: Use `Stroke` effect on a shape layer path that traces the signature form. `Start: 0% → End: 100%` over 18 frames.
- Phone screen content: Pre-comp. Scale down to fit inside phone mockup screen bounds using `Track Matte` on screen shape layer.

**Frame 1:05–1:07** — PAUSE before the magic
- Screen holds on the signed state.
- Music drops to near-silence.
- VO says: *"something extraordinary happens."*
- Hold. 12 frames of near-silence and stillness.

---

## SCENE 08 — FEATURE REVEAL 03: THE VERIFICATION
**Timecode:** `1:07 → 1:17` | **Duration:** 10s

### VO:
> *"The contract is recorded — permanently — on the blockchain."*
> *"Tamper-proof. Time-stamped. Legally verifiable."*
> *"And you get a Section 65B certificate — free — that Indian courts accept."*

**VO Delivery**: Awe. Not excitement — awe. Like witnessing something precise and powerful.

---

### VISUAL SEQUENCE:

**Frame 1:07–1:09** — Blockchain pulse
- Phone slides back. The background opens up — full canvas.
- From the center of the screen, a pulse ring expands outward: thin `#3CB44F` circle, `1px stroke`, scales from 0% to 300% while opacity drops 100%→0%. Duration: 18 frames.
- A SECOND pulse follows, offset by 12 frames. Then a third.
- These look like sonar rings — the contract "signal" broadcasting to the chain.

**Frame 1:09–1:13** — Blockchain node network
- A network of connected nodes materialises across the frame (think: simplified neural network / blockchain visualization):
  - ~20 nodes as small circles, `#3CB44F`, 4px, with `0 0 8px rgba(60,180,79,0.8)` glow
  - Lines connecting them: `1px rgba(60,180,79,0.3)` stroke
  - Nodes gently pulse (opacity flicker, random seeds)
- In the CENTER node — slightly larger than the rest — a card animates in:

```
┌─────────────────────────────────┐
│  BLOCK #19,284,771              │
│  Transaction: 0x3a7f...c92d     │
│  Contract:  Website Redesign    │
│  Parties:   Ravi ↔ Priya        │
│  Timestamp: 2026-03-22 14:32:05 │
│  Status:    ✓ VERIFIED          │
└─────────────────────────────────┘
```

- The card is `.glass-accent` style. The `✓ VERIFIED` badge is `#3CB44F` with full glow.

**AE TECHNIQUE**:
- Node network: Use `CC Particle World` with `Line` type particles set to very low gravity, or manually place 20 circle shape layers with position expressions:
```javascript
// Organic drift
var xDrift = Math.sin(time * 0.5 + index * 1.2) * 3;
var yDrift = Math.cos(time * 0.3 + index * 0.8) * 3;
value + [xDrift, yDrift];
```
- Lines: Use `Beam` effects between null objects positioned at each node.
- Card entrance: Scale 90%→100%, opacity 0→100%, 15 frames, spring easing.

**Frame 1:13–1:17** — Section 65B certificate
- The blockchain visualization fades to background. A document slides in from the right:

```
╔═══════════════════════════════════════╗
║     SECTION 65B CERTIFICATE           ║
║     Indian Evidence Act, 1872         ║
╠═══════════════════════════════════════╣
║  Contract: Website Redesign           ║
║  Freelancer: Ravi Kumar               ║
║  Client: Priya Sharma                 ║
║  Signed: March 22, 2026               ║
║  Blockchain Tx: 0x3a7f...c92d         ║
║                                       ║
║  ✓ Court Admissible                   ║
║  ✓ Tamper-Proof                       ║
║  ✓ Free                               ║
╠═══════════════════════════════════════╣
║  [⬇ Download Certificate]   DEFELLIX  ║
╚═══════════════════════════════════════╝
```

- The certificate is styled as a formal document with a subtle `#0D1A10` dark paper texture, `#3CB44F` heading bar, `#D4EDDA` body text.
- Three green checkmarks build in sequentially: `✓ Court Admissible` → `✓ Tamper-Proof` → `✓ Free` — each with a small pop animation (scale 130%→100%, 8 frames).
- The word `Free` is highlighted: `#3CB44F` with underline glow. Holds on screen.

---

## SCENE 09 — CRYSTALLIZATION / BEFORE & AFTER
**Timecode:** `1:17 → 1:27` | **Duration:** 10s

### VO:
> *"No more chasing invoices."*
> *"No more 'I never agreed to that.'"*
> *"No more losing a year of your life in a dispute."*
> *"Just work. Get paid. Build a reputation that's yours forever."*

**VO Delivery**: Declarative. Each line is a resolution. Builds in pace and confidence.

---

### VISUAL SEQUENCE:

**Frame 1:17–1:20** — Split screen setup
- Screen divides vertically down the center with a thin `rgba(60,180,79,0.4)` glowing line.

**LEFT SIDE** (dim, desaturated, slight red tint):
- Overline: `BEFORE` in `#E05252`, 12pt, 150 tracking
- Quick-fire icons + text build on, one per VO line:
  ```
  ✗  Invoice ignored
  ✗  Scope changed
  ✗  12 months in dispute
  ✗  Reputation lost
  ```
  Each `✗` is `#E05252`. Text in muted grey. Slightly grayed-out, faded look.

**RIGHT SIDE** (full color, vibrant, green-tinted):
- Overline: `WITH DEFELLIX` in `#3CB44F`, 12pt, 150 tracking
- Same positions, opposite outcomes:
  ```
  ✓  Contract enforced
  ✓  Scope locked
  ✓  Proof in seconds
  ✓  Reputation on chain
  ```
  Each `✓` is `#3CB44F` with small glow. Text bright `#D4EDDA`.

**AE TECHNIQUE**:
- Left side: Apply `Hue/Saturation` effect to all left-side layers. Reduce saturation to -60%. Tint slightly red.
- Each line enters on a beat hit from the music — sync `Opacity 0→100%` keyframes to audio waveform markers in timeline.

**Frame 1:20–1:24** — Reputation score reveal
- The split-screen collapses. Right side wins — expands to full frame.
- A freelancer profile card materialises:

```
┌──────────────────────────────────────┐
│                                      │
│   👤  Ravi Kumar                     │
│       Full-stack Developer           │
│       defellix.com/ravi_dev          │
│                                      │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                      │
│   CREDIBILITY SCORE                  │
│                                      │
│        ████████░  87 / 100           │
│                                      │
│   12 verified contracts   ★ 4.9      │
│   On-time: 100%   Disputes: 0        │
│                                      │
│   [View Profile →]                   │
│                                      │
└──────────────────────────────────────┘
```

- The score bar animates: fills from 0%→87% over 1.2 seconds. Color: `#3CB44F` gradient with glow.
- Each stat counter (12, 4.9, 100%, 0) counts up from 0.
- This card floats gently as established.

**Frame 1:24–1:27** — Card constellation
- The Ravi Kumar card shrinks and drifts left.
- Three more profile cards materialise — different freelancers, different disciplines:
  - `Anjali Mehta — UI/UX Designer — Score: 94`
  - `Dev Sharma — Video Editor — Score: 81`
  - `Sana Khan — Content Writer — Score: 78`
- They form a loose grid constellation. All glowing softly. All verified.
- The network of TRUST is visible. This is the platform at scale.

---

## SCENE 10 — THE CTA
**Timecode:** `1:27 → 1:37` | **Duration:** 10s

### VO:
> *"Defellix."*
> *"Free to start. Built for India."*
> *"Sign up at defellix.com"*

**VO Delivery**: Final. Settled. Each phrase its own sentence. Not rushed. The last word — "defellix.com" — is said once, clearly, and then the video holds.

---

### VISUAL SEQUENCE:

**Frame 1:27–1:29** — Logo moment
- All profile cards drift back to dark, fading out.
- The screen is dark again — but not the same dark as the opening. This dark feels earned, warm.
- The Defellix wordmark assembles again — but this time from left to right, each letter scaling in (scale 40%→100%, staggered 5 frames per letter, with slight overshoot).
- Brand green ambient glow behind the wordmark.

**Frame 1:29–1:33** — Full CTA frame
- Below the wordmark, three elements appear with staggered entry (8 frames apart):
  1. Tag: `THE TRUST LAYER FOR FREELANCE WORK` — `#7AAB83`, 12pt, 150 tracking
  2. Horizontal divider: thin `rgba(60,180,79,0.3)` line, draws from center outward
  3. The CTA pill button — `.glass-brand` tier:
  ```
  [ Start Free — defellix.com → ]
  ```
  Button: `#3CB44F` background, `#0D1A10` text (dark on green), 32px border-radius, `0 0 20px rgba(60,180,79,0.5)` glow.

**Frame 1:33–1:35** — Feature pillars recap
- Three small pills appear below the CTA button, fading in simultaneously:
  - `🔐 Tamper-proof contracts`
  - `📋 Free legal certificates`
  - `⭐ Portable reputation`
- Color: `rgba(60,180,79,0.1)` bg, `#7AAB83` text, `rgba(60,180,79,0.3)` border. Clean, minimal.

**Frame 1:35–1:37** — Hold and fade
- All elements hold.
- The ambient glow pulses once, slowly.
- Fade to `#0D1A10` black — not a hard cut. A 1-second fade.
- Final frame: Pure black. 12 frames.

**AE TECHNIQUE**:
- CTA button glow pulse: `Box Shadow effect` with expression:
```javascript
// Breathing glow
var t = time;
var pulse = (Math.sin(t * 2) + 1) / 2; // 0 to 1
var spread = 15 + pulse * 10;
// use slider control linked to box shadow spread
```

---

---

# AFTER EFFECTS MASTER COMP SETTINGS

```
Composition Name: DEFELLIX_LAUNCH_v1
Width: 1920px
Height: 1080px
Pixel Aspect Ratio: Square Pixels
Frame Rate: 60fps
Resolution: Full
Duration: 0:01:37:00
Background Color: #0D1A10
```

---

# REUSABLE PRE-COMP LIBRARY

Build these once. Use everywhere.

## PC_GlassCard_Base
- Shape layer: 400×240px, RR 20px
- Fill: `rgba(60,180,79,0.08)` → `rgba(13,26,16,0.60)` gradient (135°)
- Stroke: `1px rgba(60,180,79,0.25)`, top edge: `1px rgba(180,255,180,0.22)`
- Shimmer line at top: `1px` rect, `rgba(200,255,200,0.35)` → transparent → `rgba(200,255,200,0.35)`, width 80% of card
- Entry expression on `Scale`: `easeIn(0, 16, 0.95, 1.0)` + `easeIn(0, 16, 0, 1)` on Opacity

## PC_GlowDot_Green
- 8×8px circle, `#3CB44F`, `box-shadow: 0 0 8px rgba(60,180,79,0.9)`
- Opacity pulse: `(Math.sin(time * 3) + 1) / 2 * 50 + 50`

## PC_VerifiedBadge
- Rounded pill: 120×32px
- `#3CB44F` fill for background, `#0D1A10` text
- Text: `✓ VERIFIED` — Syne 700, 13pt
- Glow: outer `rgba(60,180,79,0.4)`, 12px

## PC_StatCounter
- Expression controller for any number count animation
- Null object with `Slider Control`
- Text layer: `Math.round(effect("Slider Control")("Slider"))` + custom suffix
- Ease curve: slow start, fast middle, slight overshoot at end

## PC_NodeNetwork
- 20 null objects positioned in organic cluster
- Each null has position expression: `value + [sin(time*freq+seed)*amp, cos(time*freq2+seed2)*amp]`
- 30 `Beam` effects connecting pairs (manually selected for aesthetic layout)
- All node circles: PC_GlowDot_Green instances

## PC_PulseRing
- Ellipse shape layer, `0` fill, `2px #3CB44F` stroke
- Scale: `[100,100]` → `[400,400]` over 30 frames
- Opacity: `100` → `0` over 30 frames, easeIn
- Stack 3 instances with 12-frame offset each

---

# MOTION PRINCIPLES

| Principle | Application |
|-----------|-------------|
| **Ease everything** | No linear keyframes. Always `easeIn` entrance, `easeOut` exit. |
| **Elements enter from below** | Y offset +20px → 0. Never from the sides unless a deliberate "slide" moment. |
| **Scale on entrance** | 96%→100% is invisible but adds weight. 80%→100% is dramatic. Use intentionally. |
| **Overshoot sparingly** | Only on CTAs and badge pop-ins. Never on text. |
| **Hold after revelation** | After any major reveal, hold for 8–12 frames before introducing next element. Trust the pause. |
| **30% rule** | No more than 30% of the frame should be moving at any one time. |
| **Respect the brand green** | Never overuse. It is ~10% of visual surface area. When it appears, it must mean something. |

---

# RENDER SETTINGS

## For YouTube / Social (Master)
```
Format: H.264 (via Adobe Media Encoder)
Preset: YouTube 1080p HD
Bitrate: VBR 2-pass, Target 16 Mbps, Max 24 Mbps
Audio: AAC, 320kbps, Stereo
Color: sRGB
```

## For LinkedIn / Twitter / Instagram Crop
- Create a 1:1 (1080×1080) alternate version of the master comp
- Scale main comp to fit
- Extend the `#0D1A10` background to fill
- Add subtle animated logo lockup in top-left corner throughout

## For Lossless Archive
```
Format: ProRes 4444
For: Client handoff, future editing
```

---

# PRODUCTION CHECKLIST

**Pre-production**
- [ ] Install Syne + DM Sans fonts system-wide
- [ ] Set up AE project folder structure as above
- [ ] Import all UI design assets (export from Figma as SVG)
- [ ] Set up audio track — place music on dedicated audio layer, locked
- [ ] Place audio markers at key beats for sync reference

**Scene production order** (recommended)
- [ ] PC_GlassCard_Base (all scenes use this)
- [ ] PC_StatCounter (Scenes 02, 09)
- [ ] PC_NodeNetwork (Scene 08)
- [ ] PC_PulseRing (Scene 08)
- [ ] SC04 + SC10 (logo scenes — establish brand lockup)
- [ ] SC01, SC02, SC03 (pain scenes — establish dark tone)
- [ ] SC05–SC09 (feature scenes — build on each other)
- [ ] Master comp assembly + timing polish

**Quality check**
- [ ] Watch at 0.5x speed — do all eases look natural?
- [ ] Watch at 1x speed with audio — are stat callouts readable for full 2 seconds?
- [ ] Check that no element exceeds 30% frame motion simultaneously
- [ ] Verify brand green appears only on intentional moments
- [ ] Export 10-second preview (0:22–0:32) to confirm pain→solution transition lands

---

# REPURPOSED CUTS (from master)

| Cut | Timecode | Platform | Purpose |
|-----|----------|----------|---------|
| **Pain hook** | 0:00–0:22 | Instagram Reels | Cold audience |
| **Feature demo** | 0:43–1:17 | LinkedIn | Warm professional audience |
| **Stats slam** | 0:08–0:30 | Twitter/X | Viral data play |
| **CTA only** | 1:17–1:37 | Retargeting ads | Already aware audience |
| **15s teaser** | 0:00–0:08 + 1:27–1:37 | YouTube pre-roll | Pure awareness |

---

*DEFELLIX — Launch Video Production Bible v1.0*
*Created March 2026 | Total runtime: 97 seconds | After Effects CC 2024+*
