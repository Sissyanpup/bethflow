# Design System: Figma (Bethflow adaptation)

# Applies to: Guest Dashboard, My Social Link profile, Promotions, Contact, Public pages

## 1. Visual Theme & Atmosphere

Vibrant, multi-color, playful yet professional. Figma's design language signals creativity,
collaboration, and approachability. This system applies to all public-facing and expressive
pages — Guest discovery, Social Link profiles, promotional sections, and onboarding flows.

Applied to: Guest Dashboard (search, promotions, contact), My Social Link public profile `/u/:username/links`,
feedback pages, promotional banners.

**Key Characteristics:**

- Light base with vibrant multi-color accents — purple, blue, green, orange, pink, teal
- Rounded, friendly geometry (high border-radius)
- Bold display typography (600–800 weight headings)
- Gradient-heavy hero sections and feature cards
- Card-first layout with generous shadows and hover lifts
- Color-coded platform buttons for social links
- Playful microinteractions implied throughout

## 2. Color Palette

### Base

- `#ffffff` — primary surface
- `#f8f7ff` — subtle purple-tinted page bg
- `#f3f4f6` — secondary surface, dividers
- `#1b1b26` — rich near-black for headings (not pure black)

### Text

- `#1b1b26` — primary heading
- `#374151` — body text
- `#6b7280` — secondary / caption
- `#9ca3af` — placeholder / muted

### Brand Multi-Color Accent System

- `#7c3aed` — purple (primary brand, CTAs, featured)
- `#a855f7` — medium purple (gradient endpoint, hover)
- `#2563eb` — blue (info, links)
- `#10b981` — green (success, active)
- `#f59e0b` — amber (warning, featured)
- `#ef4444` — red (error, urgent)
- `#ec4899` — pink (creative, expressive)
- `#06b6d4` — cyan (discovery, public)

### Gradients (key)

```
Hero gradient:     linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)
Card accent 1:     linear-gradient(135deg, #f59e0b, #ef4444)
Card accent 2:     linear-gradient(135deg, #10b981, #2563eb)
Card accent 3:     linear-gradient(135deg, #ec4899, #7c3aed)
Social link btn:   per-platform color (see section 6)
```

### Shadows

- Card default: `0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)`
- Card hover: `0 8px 32px rgba(124,58,237,0.15), 0 2px 8px rgba(0,0,0,0.08)`
- Feature card: `0 20px 60px rgba(124,58,237,0.12)`
- Button: `0 4px 12px rgba(124,58,237,0.3)`

## 3. Typography

Font: `Inter`, fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`
Optional display: `Plus Jakarta Sans` or `DM Sans` for headings if available

| Role            | Size    | Weight | Color                          |
| --------------- | ------- | ------ | ------------------------------ |
| Hero headline   | 56–64px | 800    | `#1b1b26` or white-on-gradient |
| Section heading | 36–40px | 700    | `#1b1b26`                      |
| Sub-heading     | 24px    | 600    | `#1b1b26`                      |
| Card title      | 18–20px | 600    | `#1b1b26`                      |
| Body large      | 18px    | 400    | `#374151`                      |
| Body            | 16px    | 400    | `#374151`                      |
| Caption         | 14px    | 400    | `#6b7280`                      |
| Label           | 13px    | 500    | `#374151`                      |
| Button          | 15–16px | 600    | —                              |
| Badge           | 12px    | 600    | —                              |

**Rules:**

- Hero at 56px+, bold (700–800), with tight letter-spacing `-0.5px to -1px`
- Body text stays 400 weight at 16–18px, line-height 1.6–1.7
- All-caps sparingly: badge labels only

## 4. Component Styles

### Hero Section (Guest Dashboard)

```css
background: linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%);
min-height: 480px;
display: flex;
align-items: center;
justify-content: center;
padding: 80px 24px;
text-align: center;

/* Headline */
font-size: clamp(40px, 6vw, 64px);
font-weight: 800;
color: #ffffff;
letter-spacing: -1px;
line-height: 1.1;

/* Subtext */
font-size: 18px;
color: rgba(255, 255, 255, 0.85);
max-width: 560px;
margin: 16px auto;

/* Search bar */
background: #ffffff;
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
padding: 8px 8px 8px 20px;
max-width: 480px;
margin: 32px auto;
```

### Feature / Promo Cards

```css
background: #ffffff;
border-radius: 16px;
border: 1px solid #f3f4f6;
box-shadow:
  0 1px 4px rgba(0, 0, 0, 0.08),
  0 4px 16px rgba(0, 0, 0, 0.06);
padding: 24px;
overflow: hidden;

/* Accent bar (top gradient) */
height: 4px;
border-radius: 16px 16px 0 0;
/* background: use gradient per card type */

hover: {
  transform: translateY(-4px);
  box-shadow:
    0 8px 32px rgba(124, 58, 237, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### User Success Graph Card

```css
background: linear-gradient(
  135deg,
  rgba(124, 58, 237, 0.08),
  rgba(37, 99, 235, 0.06)
);
border: 1px solid rgba(124, 58, 237, 0.15);
border-radius: 16px;
padding: 24px;

/* Graph line color */
stroke: #7c3aed;
/* Graph fill */
fill: rgba(124, 58, 237, 0.1);
/* Axis text */
font-size: 12px;
color: #9ca3af;
/* Hover dot */
fill: #7c3aed;
r: 6;
```

### Buttons

```css
/* Primary */
background: #7c3aed; color: #ffffff;
border-radius: 10px; padding: 12px 24px;
font-size: 15px; font-weight: 600;
box-shadow: 0 4px 12px rgba(124,58,237,0.3);
hover: background: #6d28d9; transform: translateY(-1px);

/* Secondary */
background: #ffffff; color: #7c3aed;
border: 2px solid #7c3aed; border-radius: 10px;
hover: background: #f8f7ff;

/* Ghost */
background: transparent; color: #374151;
border-radius: 10px; padding: 12px 24px;
hover: background: #f3f4f6;
```

## 5. My Social Link Profile (Public `/u/:username/links`)

This is the flagship expressive page — each user's unique, colorful link-in-bio.

### Profile Card (top)

```css
/* Container */
max-width: 480px;
margin: 0 auto;
padding: 24px 16px;
background: #f8f7ff;
min-height: 100vh;

/* Avatar */
width: 80px;
height: 80px;
border-radius: 50%;
border: 3px solid #7c3aed;
box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.1);

/* Username */
font-size: 20px;
font-weight: 700;
color: #1b1b26;

/* Bio */
font-size: 14px;
color: #6b7280;
text-align: center;
max-width: 300px;
```

### Social Link Buttons (per platform)

Each button has a platform-specific brand color:

```css
/* Base link button */
display: flex; align-items: center; gap: 12px;
width: 100%; padding: 14px 20px;
border-radius: 14px; border: none;
font-size: 15px; font-weight: 600; color: #ffffff;
box-shadow: 0 2px 8px rgba(0,0,0,0.12);
margin-bottom: 10px; cursor: pointer;
transition: transform 0.15s, box-shadow 0.15s;
hover: transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.18);

/* Platform colors */
--facebook:   #1877f2;
--instagram:  linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
--twitter:    #000000;
--tiktok:     #010101;  /* with teal/pink icon accent */
--linkedin:   #0a66c2;
--youtube:    #ff0000;
--telegram:   #2ca5e0;
--whatsapp:   #25d366;
--github:     #24292e;
--gitlab:     #fc6d26;
--email:      #ea4335;
--discord:    #5865f2;
--twitch:     #9146ff;
--snapchat:   #fffc00;  /* with black text */
--pinterest:  #e60023;
--reddit:     #ff4500;
--mastodon:   #6364ff;
--bluesky:    #0085ff;
--threads:    #000000;
--spotify:    #1db954;
--soundcloud: #ff5500;
--patreon:    #ff424d;
--kofi:       #29abe0;
--behance:    #1769ff;
--dribbble:   #ea4c89;
--medium:     #000000;
--substack:   #ff6719;
--website:    #374151;  /* neutral */
--custom:     #7c3aed;  /* brand purple */
```

### Social Link Edit UI (user settings)

```css
/* Drag handle */
color: #9ca3af; cursor: grab;

/* Link row */
background: #ffffff; border: 1px solid #f3f4f6;
border-radius: 12px; padding: 12px 16px;
display: flex; align-items: center; gap: 12px;
margin-bottom: 8px;
hover: border-color: #c4b5fd;

/* Platform icon */
width: 36px; height: 36px; border-radius: 8px;
/* background: platform color, white icon */

/* Toggle (visible/hidden) */
/* ON: background #7c3aed */
/* OFF: background #e5e7eb */
```

## 6. Feedback & Contact Section

```css
/* Feedback card */
background: linear-gradient(135deg, #f8f7ff, #eff6ff);
border: 1px solid rgba(124,58,237,0.12); border-radius: 16px; padding: 32px;

/* Star rating */
color: #f59e0b; font-size: 24px;

/* Submit button */ background: #7c3aed; (same as primary)
```

## 7. Layout

- Page bg: `#f8f7ff` (subtle purple tint for public pages)
- Max content width: 1200px, centered
- Section padding: 80px vertical, 24px horizontal (mobile: 48px / 16px)
- Card grid: 3 col desktop → 2 col tablet → 1 col mobile
- Border radius: 10px (buttons) → 14px (social link btns) → 16px (cards) → 24px (hero elements)
- Animation: `transition: all 0.2s ease` on interactive elements

## 8. Do's and Don'ts

**Do:**

- Use vibrant gradients on hero and feature sections — this signals creativity and energy
- Per-platform brand colors on social link buttons — recognition is UX
- High border-radius (14–16px) on cards and buttons — friendly, modern
- Lift cards on hover (translateY -2px to -4px) — playful interactivity
- Bold (700–800) headings — impact matters on public pages

**Don't:**

- Don't use the dark Linear palette here — completely different context
- Don't use the data-grid Airtable style — this is expressive, not analytical
- Don't use the same purple for every social link button — brand recognition is essential
- Don't forget hover animations — this page is primarily interactive

## 9. Agent Prompt Snippets

```
Guest hero: gradient bg 135deg #7c3aed→#2563eb→#06b6d4, 64px 800 weight headline white, 18px body rgba(255,255,255,0.85), search bar white card border-radius 16px shadow.

Social link public page: max-width 480px centered, bg #f8f7ff, avatar 80px circular purple border, link buttons 100% width border-radius 14px per-platform brand colors, 15px 600 weight white text, hover translateY(-2px).

Promo cards: white bg, 16px radius, top 4px gradient accent bar, 20px 600 title #1b1b26, hover lift shadow rgba(124,58,237,0.15).
```
