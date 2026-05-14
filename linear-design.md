# Design System: Linear (Bethflow adaptation)

# Applies to: Board, Card List, User Dashboard, Admin Dashboard, Comms Queue

## 1. Visual Theme & Atmosphere

Dark-mode-native engineering aesthetic. Near-black canvas where content surfaces from darkness.
Extreme precision: every element in a calibrated luminance hierarchy.
Applied to: Board views, Card management, User/Admin dashboards, comms queue UI.

**Key Characteristics:**

- Dark-mode-native: `#08090a` base, `#0f1011` panels, `#191a1b` elevated surfaces
- Inter Variable with `"cv01", "ss03"` globally
- Signature weight 510 for UI text
- Brand indigo-violet: `#5e6ad2` / `#7170ff` — the only chromatic color
- Semi-transparent white borders: `rgba(255,255,255,0.05)–rgba(255,255,255,0.08)`
- Success green `#27a644` for task completion indicators only

## 2. Color Palette

### Backgrounds

- `#010102` / `#08090a` — deepest canvas (page bg)
- `#0f1011` — sidebar, panel bg
- `#191a1b` — card bg, dropdown, elevated surface
- `#28282c` — hover state surface

### Text

- `#f7f8f8` — primary (near-white, not pure white)
- `#d0d6e0` — secondary (silver-gray, body)
- `#8a8f98` — tertiary (muted, metadata)
- `#62666d` — quaternary (timestamps, disabled)

### Brand & Accent

- `#5e6ad2` — brand indigo (CTA buttons, active states)
- `#7170ff` — accent violet (links, interactive)
- `#828fff` — hover on accent
- `#7a7fad` — security/muted indigo

### Status

- `#27a644` — success / in-progress indicator
- `#10b981` — completion badge

### Borders

- `rgba(255,255,255,0.05)` — subtle (default)
- `rgba(255,255,255,0.08)` — standard (cards, inputs)
- `#23252a` — solid dark border

## 3. Typography

Font: `Inter Variable` · Fallback: `SF Pro Display, -apple-system, system-ui`
Monospace: `Berkeley Mono` · Fallback: `ui-monospace, SF Mono`
OpenType: `font-feature-settings: "cv01", "ss03"` — ALWAYS applied globally

| Role        | Size | Weight  | Letter Spacing |
| ----------- | ---- | ------- | -------------- |
| Display XL  | 72px | 510     | -1.584px       |
| Display     | 48px | 510     | -1.056px       |
| Heading 1   | 32px | 400     | -0.704px       |
| Heading 2   | 24px | 400     | -0.288px       |
| Heading 3   | 20px | 590     | -0.24px        |
| Body Large  | 18px | 400     | -0.165px       |
| Body        | 16px | 400     | normal         |
| Body Medium | 16px | 510     | normal         |
| Small       | 15px | 400     | -0.165px       |
| Caption     | 13px | 400–510 | -0.13px        |
| Label       | 12px | 400–590 | normal         |

**Rules:**

- Weight 510 = default emphasis (navigation, labels)
- Weight 590 = strong emphasis (card titles, headings)
- Weight 400 = reading (body text)
- NEVER use weight 700 — max is 590

## 4. Component Styles

### Buttons

```css
/* Primary CTA */
background: #5e6ad2; color: #fff; padding: 8px 16px; border-radius: 6px;
hover: background: #828fff;

/* Ghost */
background: rgba(255,255,255,0.02); color: #e2e4e7;
border: 1px solid rgb(36,40,44); border-radius: 6px;

/* Subtle */
background: rgba(255,255,255,0.04); color: #d0d6e0;
padding: 0 6px; border-radius: 6px;

/* Icon (circle) */
background: rgba(255,255,255,0.03); border-radius: 50%;
border: 1px solid rgba(255,255,255,0.08);
```

### Cards (Board cards)

```css
background: rgba(255, 255, 255, 0.02); /* or #191a1b for solid */
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 8px;
/* Hover: increase bg opacity slightly */
/* Title: 15px Inter 590, #f7f8f8 */
/* Body: 13px Inter 400, #8a8f98 */
```

### Inputs

```css
background: rgba(255, 255, 255, 0.02);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 6px;
padding: 12px 14px;
color: #d0d6e0;
font-size: 15px;
```

### Kanban List Column

```css
background: #0f1011;
border: 1px solid rgba(255, 255, 255, 0.05);
border-radius: 8px;
min-width: 272px;
/* Header: 14px Inter 590, #f7f8f8 */
```

### Status Badge

```css
/* Done */
background: #10b981;
color: #f7f8f8;
border-radius: 50%;
font-size: 10px;
font-weight: 510;
/* In Progress */
background: #27a644;
color: #fff;
/* Blocked */
background: #ef4444;
color: #fff;
```

### Navigation (sidebar)

```css
background: #0f1011;
border-right: 1px solid rgba(255, 255, 255, 0.05);
/* Nav items: 14px Inter 510, #d0d6e0 */
/* Active: color #f7f8f8, background rgba(255,255,255,0.05) */
/* Icons: 16px, color inherit */
```

## 5. Layout

- Base unit: 8px
- Board canvas: horizontal scroll, columns flex row, gap: 12px
- Sidebar: 240px fixed, content fills remainder
- Card spacing: padding 12px, gap 8px between cards
- Border radius scale: 2px micro → 6px buttons → 8px cards → 12px panels → 9999px pills

## 6. Board-Specific Patterns

### Drag & Drop

- Dragging card: `opacity: 0.5`, `box-shadow: 0 8px 24px rgba(0,0,0,0.4)`
- Drop zone active: `background: rgba(94,106,210,0.08)`, dashed indigo border

### Add Card Button

```css
background: transparent; color: #8a8f98;
hover: background: rgba(255,255,255,0.04); color: #d0d6e0;
border-radius: 6px; padding: 8px 10px; width: 100%;
font-size: 14px; text-align: left;
```

### Card Quick Actions (on hover)

- Edit icon, Delete icon: `rgba(255,255,255,0.5)` → `#f7f8f8` on hover
- Appear on card hover only

## 7. Do's and Don'ts

**Do:**

- Always `font-feature-settings: "cv01", "ss03"` on all Inter text
- Semi-transparent white borders — never opaque dark borders on dark bg
- Weight 510 as default UI weight
- Indigo `#5e6ad2` only for primary interactive/CTA

**Don't:**

- No pure `#ffffff` text — use `#f7f8f8`
- No solid colored button backgrounds (except indigo CTA)
- No weight 700
- No warm colors in UI chrome

## 8. Agent Prompt Snippets

```
Board view: dark canvas #08090a, sidebar #0f1011, kanban columns #0f1011 with border rgba(255,255,255,0.05), cards #191a1b with border rgba(255,255,255,0.08), all text Inter Variable "cv01" "ss03", drag-drop highlight rgba(94,106,210,0.08).

Admin table: background #0f1011, header row rgba(255,255,255,0.04), row hover rgba(255,255,255,0.02), text #d0d6e0 14px 510, borders rgba(255,255,255,0.05).

User dashboard graph: background #191a1b, chart line #7170ff, area fill rgba(113,112,255,0.1), grid lines rgba(255,255,255,0.05), axis labels 12px #62666d.
```
