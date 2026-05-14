# Design System: Airtable (Bethflow adaptation)

# Applies to: Project Management, Timeline/Gantt, Card Katalog grid, Data tables

## 1. Visual Theme & Atmosphere

Clean, structured, grid-first aesthetic. Airtable communicates data density with confidence —
a light, airy foundation accented by bold color pops and a spreadsheet-native mental model.
Generous whitespace, strong grid lines, clear hierarchy between row data and metadata.

Applied to: Project timeline views, Gantt calendar, Catalog card grids, data management tables.

**Key Characteristics:**

- Light-mode-native: `#ffffff` base, `#f9fafb` alternating rows
- Inter / system-ui for all body text
- Bold color swatches per record type (customizable per catalog)
- Clear grid: 1px `#e1e4e8` borders everywhere
- Accent: deep teal `#166ee1` (Airtable blue) for interactive elements
- Row hover: `#f0f7ff` (light blue tint)
- Color-coded status chips

## 2. Color Palette

### Backgrounds

- `#ffffff` — primary surface
- `#f9fafb` — alternating table rows, sidebar
- `#f3f4f6` — secondary panel, toolbar bg
- `#eef2ff` — selected row / active state

### Text

- `#111827` — primary (near-black, high contrast)
- `#374151` — secondary (dark gray)
- `#6b7280` — tertiary (gray, metadata)
- `#9ca3af` — muted (placeholders, disabled)

### Brand & Accent

- `#166ee1` — primary blue (CTAs, links, active column headers)
- `#1d4ed8` — hover on blue
- `#3b82f6` — lighter blue (inline links, info states)
- `#eff6ff` — blue tint background (selected cells, active filters)

### Status / Record Colors (catalog color chips)

- `#ef4444` — red (urgent/blocked)
- `#f97316` — orange (at risk)
- `#eab308` — yellow (in review)
- `#22c55e` — green (done/active)
- `#3b82f6` — blue (in progress)
- `#8b5cf6` — purple (planned)
- `#6b7280` — gray (archived)

### Borders

- `#e1e4e8` — grid lines (standard)
- `#d1d5db` — slightly darker grid (header separator)
- `#bfdbfe` — blue border (selected cell/row)

## 3. Typography

Font: `Inter`, fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`
No special OpenType features required (this is data-dense UI, not editorial)

| Role            | Size | Weight | Color                      |
| --------------- | ---- | ------ | -------------------------- |
| Table header    | 11px | 600    | `#374151` uppercase        |
| Cell text       | 13px | 400    | `#111827`                  |
| Record title    | 14px | 600    | `#111827`                  |
| Sidebar label   | 13px | 500    | `#374151`                  |
| Field name      | 12px | 600    | `#6b7280` uppercase        |
| Timeline label  | 12px | 500    | `#374151`                  |
| Gantt bar label | 11px | 500    | `#ffffff` (on colored bar) |
| Button          | 13px | 500    | —                          |
| Badge / chip    | 11px | 600    | —                          |

## 4. Component Styles

### Grid Table

```css
/* Table wrapper */
border: 1px solid #e1e4e8;
border-radius: 8px;
overflow: hidden;

/* Header row */
background: #f9fafb;
border-bottom: 1px solid #d1d5db;
font-size: 11px;
font-weight: 600;
color: #374151;
text-transform: uppercase;
padding: 8px 12px;

/* Data row */
background: #ffffff;
border-bottom: 1px solid #e1e4e8;
padding: 10px 12px;
font-size: 13px;
color: #111827;

/* Alternating row */
background: #f9fafb;

/* Row hover */
background: #f0f7ff;

/* Selected row */
background: #eff6ff;
border: 1px solid #bfdbfe;

/* Cell */
border-right: 1px solid #e1e4e8;
padding: 8px 12px;
```

### Gantt / Timeline Bar

```css
/* Container */
background: #f9fafb;
border-radius: 4px;
border: 1px solid #e1e4e8;
overflow-x: auto;

/* Timeline header (months/weeks) */
background: #f3f4f6;
font-size: 11px;
font-weight: 600;
color: #6b7280;
text-transform: uppercase;
border-bottom: 1px solid #d1d5db;

/* Today line */
border-left: 2px solid #166ee1;

/* Gantt bar */
border-radius: 4px;
height: 24px;
font-size: 11px;
font-weight: 500;
color: #ffffff;
padding: 0 8px;
display: flex;
align-items: center;
/* Color from record's status color */

/* Weekend columns */
background: rgba(0, 0, 0, 0.02);
```

### Catalog Card Grid

```css
/* Card */
background: #ffffff; border: 1px solid #e1e4e8;
border-radius: 8px; padding: 12px;
box-shadow: 0 1px 3px rgba(0,0,0,0.06);
hover: box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px);

/* Color swatch (top of card) */
height: 4px; border-radius: 8px 8px 0 0;
/* Background = record color */

/* Card title */
font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;

/* Card meta */
font-size: 12px; color: #6b7280;

/* Card date badge */
background: #f3f4f6; border-radius: 4px;
font-size: 11px; font-weight: 500; color: #374151; padding: 2px 6px;
```

### Status Chip / Badge

```css
border-radius: 9999px;
padding: 2px 8px;
font-size: 11px;
font-weight: 600;
display: inline-flex;
align-items: center;
gap: 4px;

/* Done */
background: #dcfce7;
color: #166534;
/* In Prog */
background: #dbeafe;
color: #1e40af;
/* Blocked */
background: #fee2e2;
color: #991b1b;
/* Review */
background: #fef9c3;
color: #854d0e;
/* Planned */
background: #ede9fe;
color: #5b21b6;
```

### Toolbar / Filter Bar

```css
background: #f3f4f6; border-bottom: 1px solid #e1e4e8;
padding: 8px 16px; display: flex; align-items: center; gap: 8px;

/* Filter button */
background: #ffffff; border: 1px solid #d1d5db;
border-radius: 6px; padding: 6px 10px;
font-size: 13px; font-weight: 500; color: #374151;
hover: background: #f9fafb; border-color: #9ca3af;

/* Active filter */
background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8;
```

### Buttons

```css
/* Primary */
background: #166ee1; color: #ffffff;
border-radius: 6px; padding: 8px 14px; font-size: 13px; font-weight: 500;
hover: background: #1d4ed8;

/* Secondary */
background: #ffffff; color: #374151;
border: 1px solid #d1d5db; border-radius: 6px;
hover: background: #f9fafb;

/* Ghost */
background: transparent; color: #374151;
hover: background: #f3f4f6;
```

## 5. Layout

- Page bg: `#f9fafb`
- Content area: white card with border-radius 8px, border `#e1e4e8`
- Sidebar: 220px, `#f9fafb`, border-right `#e1e4e8`
- Toolbar height: 44px
- Row height (table): 36px standard, 52px with media
- Spacing base: 4px (tight grid) → 8px → 12px → 16px → 24px

## 6. Calendar / Timeline Specific

```
Month header: uppercase bold, #6b7280, 11px
Day cell: 40px wide, hover background #f0f7ff
Current day: blue dot indicator below number
Task bar in calendar: colored pill, 20px height, rounded-full
Multi-day span: continuous pill with border-radius only on start/end
```

## 7. Do's and Don'ts

**Do:**

- Use grid borders `#e1e4e8` consistently — this IS the design
- Color-code catalog records with a left border or top swatch
- Keep font sizes small (11-14px) — data density is the goal
- Use blue `#166ee1` only for interactive/selected states
- Row hover `#f0f7ff` — it's subtle but essential for usability

**Don't:**

- Don't use dark backgrounds — this is a light-mode system
- Don't remove grid borders — the grid IS the layout
- Don't use large font sizes (18px+) inside table cells
- Don't use gradients in data cells

## 8. Agent Prompt Snippets

```
Project timeline: light bg #f9fafb, gantt rows alternate #fff/#f9fafb, today line 2px solid #166ee1, bars colored by status (green #22c55e done, blue #3b82f6 in-progress), bar text 11px white, month headers 11px uppercase #6b7280.

Catalog grid: 3-4 column card grid, each card white with 1px #e1e4e8 border, 4px color swatch top, 14px 600 title #111827, 12px #6b7280 meta, date badge #f3f4f6 background.

Data table: header row #f9fafb 11px uppercase 600 #374151, rows 36px 13px #111827, hover #f0f7ff, selected #eff6ff + bfdbfe border, status chips rounded-full colored by status.
```
