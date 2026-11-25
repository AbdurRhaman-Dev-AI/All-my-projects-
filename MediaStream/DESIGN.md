---
name: Aurora Oceanic
colors:
  surface: '#04161c'
  surface-dim: '#04161c'
  surface-bright: '#2a3c42'
  surface-container-lowest: '#011016'
  surface-container-low: '#0c1e24'
  surface-container: '#102228'
  surface-container-high: '#1b2c33'
  surface-container-highest: '#26373e'
  on-surface: '#d3e6ee'
  on-surface-variant: '#b9cac4'
  inverse-surface: '#d3e6ee'
  inverse-on-surface: '#223339'
  outline: '#84948f'
  outline-variant: '#3b4a45'
  surface-tint: '#00dfbe'
  primary: '#70ffe0'
  on-primary: '#00382e'
  primary-container: '#00e5c3'
  on-primary-container: '#006152'
  inverse-primary: '#006b5a'
  secondary: '#45f885'
  on-secondary: '#003917'
  secondary-container: '#06db6c'
  on-secondary-container: '#005928'
  tertiary: '#ceedf6'
  on-tertiary: '#17343c'
  tertiary-container: '#b2d1da'
  on-tertiary-container: '#3e5a62'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#42fdda'
  primary-fixed-dim: '#00dfbe'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#64ff92'
  secondary-fixed-dim: '#23e373'
  on-secondary-fixed: '#00210b'
  on-secondary-fixed-variant: '#005224'
  tertiary-fixed: '#c9e8f1'
  tertiary-fixed-dim: '#adccd5'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#2e4b52'
  background: '#04161c'
  on-background: '#d3e6ee'
  surface-variant: '#26373e'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-tablet: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an immersive, cinematic streaming environment tailored for content explorers and high-fidelity media connoisseurs. The visual narrative combines the tranquility of abyssal oceanic depths with the vibrant phosphorescence of arctic auroras, creating an experience that feels fluid, luminous, and expansive.

The design movement anchors in **Glassmorphism married to deep atmospheric minimalism**:
- **Atmospheric Depth:** Deep-sea teal gradations form infinite spatial planes that let rich media imagery become the primary focal anchor.
- **Luminescent Energy:** Interactive points, playback triggers, and focal states radiate with high-intensity mint and cyan phosphorescence, guiding viewer attention intuitively without visual noise.
- **Translucent Materiality:** Multi-layered frosted glass panels simulate refractive optical glass, offering clear contextual separation while sustaining peripheral awareness of background streams and dynamic content art.

## Colors

The palette simulates the optical spectrum found in bioluminescent oceanic trenches:

- **Primary (`#00E5C3` - Aurora Cyan):** The primary beacon for active streaming indicators, key calls-to-action, scrubbers, and luminous hover halos.
- **Secondary (`#38EF7D` - Bio-Mint):** Used alongside cyan for energy transitions, progress fills, top-match indicators, and live status signals.
- **Tertiary (`#0D2C33` - Abyssal Surface Teal):** The intermediate structural ground. Powers elevated card substrates, navigation ribbons, and secondary interactive backdrops.
- **Neutral (`#06181E` - Trench Black-Teal):** The foundational substrate across viewport surfaces. Prevents optical fatigue during extended night viewing.

### Palette Tokens & Application Rules
- **Base Canvas:** Linear gradient spanning `180deg` from `#06181E` to `#0D2C33`.
- **Glass Panel Surface:** `rgba(13, 44, 51, 0.55)` layered atop `backdrop-filter: blur(24px) saturate(160%)`.
- **Luminescent Border Stroke:** `rgba(0, 229, 195, 0.15)` for dormant borders; elevating to `rgba(0, 229, 195, 0.65)` with an outer glow on active states.
- **Text Tiers:**
  - High Emphasis: `#FFFFFF` (Crisp Ice)
  - Medium Emphasis: `rgba(255, 255, 255, 0.72)` (Frost Silver)
  - Subtle / Metadata: `rgba(255, 255, 255, 0.44)` (Deep Mist)

## Typography

Typography blends geometric clarity with technical legibility:

- **Display & Headings (Plus Jakarta Sans):** Selected for its wide aperture, clean geometric curvatures, and optimistic, modern presence. In display weights (700-800), tight letter-spacing delivers punchy media titles and dramatic hero headers.
- **Body & Data (Inter):** Employs uniform micro-metrics and exceptional horizontal rhythm, preserving total legibility in content descriptions, subtext, credits, and search suggestion lists even across dense darkened backgrounds.
- **Labels, Pills, & Badges (Plus Jakarta Sans):** Employs slight positive tracking in small caps (`label-sm`) to ensure glanceable visibility on duration tags, ratings, resolution stamps (4K, HDR), and live indicators.

## Layout & Spacing

The layout is architected around a fluid, responsive 12-column grid designed to accommodate horizontal streaming carousels, responsive search query facets, and billboard-style hero media stages.

### Layout Rhythm
- **Desktop (1200px+):** 12 columns with `1.5rem` (`24px`) gutters and `3rem` (`48px`) outer canvas margins. Maximizes browse surface area while preserving an uncluttered perimeter.
- **Tablet (768px – 1199px):** 8 columns with `1rem` (`16px`) gutters and `2rem` (`32px`) margins. Media cards reflow from 5–6 items per row down to 3–4 items per row, or horizontal swipe rails.
- **Mobile (< 768px):** 4 columns with `0.75rem` (`12px`) gutters and `1rem` (`16px`) margins. Search inputs and featured items snap to 4-column full widths. Media rails use full-bleed negative margin clipping with trailing snap-stops.

### Spacing Tokens
- `space-xs` (4px): Micro-gaps between badge icons and text strings.
- `space-sm` (8px): Padding within compact tags, rating indicators, and pill items.
- `space-md` (16px): Internal padding for media cards, search input fields, and stack item gaps.
- `space-lg` (24px): Inter-section grouping gaps, carousel header offsets, and modal paddings.
- `space-xl` (40px): Major structural vertical offsets between thematic streaming rails.

## Elevation & Depth

Spatial separation avoids opaque shadows, relying instead on refractive glass surfaces, luminescence mapping, and color luminance strata:

- **Level 0 (Canvas Base):** Deep ambient gradient `#06181E` to `#0D2C33`. Non-interactive, absorbing glare.
- **Level 1 (Submerged Containers & Inactive Panels):** `rgba(13, 44, 51, 0.45)` with `backdrop-filter: blur(20px)`, framed by a 1px border of `rgba(0, 229, 195, 0.12)`. No drop shadow.
- **Level 2 (Hovered Cards & Persistent Floating Chrome):** `rgba(13, 44, 51, 0.75)` with `backdrop-filter: blur(28px)`, framed by `rgba(0, 229, 195, 0.28)`. Supported by a soft directional ambient shadow: `0 12px 32px -4px rgba(2, 10, 13, 0.65), 0 0 16px -2px rgba(0, 229, 195, 0.15)`.
- **Level 3 (Modals, Active Popovers, Expanded Search Overlay):** `rgba(6, 24, 30, 0.88)` with `backdrop-filter: blur(36px)`, surrounded by a continuous dual-ring: 1px inner rim of `rgba(255, 255, 255, 0.10)` and outer glow `rgba(0, 229, 195, 0.25)`.
- **The Aurora Aura (Focus & Active Media Playback):** Direct luminous glow applied via `box-shadow: 0 0 24px rgba(0, 229, 195, 0.40), 0 0 4px rgba(56, 239, 125, 0.60)`. Used selectively on primary play buttons, active scrubber heads, and keyboard-focused cards.

## Shapes

The design uses a balanced rounded contour scale (`roundedness: 2`), reflecting tactile, polished pebble and optical lens forms:

- **Standard Elements (0.5rem / 8px):** Search dropdown items, contextual menu popups, thumbnail corners, and technical data tags.
- **Panels & Cards (`rounded-lg` - 1rem / 16px):** Primary media preview cards, modal dialogues, floating bottom playback controllers, and hero banner canvases.
- **Feature Enclosures (`rounded-xl` - 1.5rem / 24px):** Large-scale hero promotional spotlight panels and global search hubs.
- **Pill Primitives (`rounded-full` / 9999px):** Streaming duration pills, rating tags, filter chips, audio channel labels (Dolby Atmos / 5.1), and round playback trigger buttons.

## Components

### Media Cards
- **Base Style:** Built on `rounded-lg` frames using the Level 1 glass tier (`rgba(13, 44, 51, 0.45)`, 1px border `rgba(0, 229, 195, 0.15)`).
- **Poster Aspect Ratios:** 16:9 for episodic streaming rails; 2:3 for cinematic film discover views.
- **Image Treatment:** Bottom edge blends into the card container via an inner linear gradient overlay (`transparent 40%` to `rgba(6, 24, 30, 0.95) 100%`).
- **Interactive State:** Hover shifts the card upward by `-4px`, border color brightens to `rgba(0, 229, 195, 0.60)`, and triggers the Level 2 shadow with cyan bloom.

### Play Triggers
- **Card Hover Play Action:** A centered 48px circle (`rounded-full`) composed of `rgba(0, 229, 195, 0.20)` frosted backdrop with a 1px `rgba(0, 229, 195, 0.50)` border and a crisp white play icon. 
- **Hero Primary Stream Button:** Filled with a directional gradient (`135deg`, `#00E5C3` to `#38EF7D`), sharp `#06181E` typography (`label-lg`), and an ambient glow of `0 0 20px rgba(0, 229, 195, 0.45)`.

### Duration Pills & Rating Badges
- **Duration Pill:** Floating glass pill positioned at the bottom-right of poster art. Dark glass backdrop (`rgba(6, 24, 30, 0.70)`), text in `label-sm` (`#FFFFFF`), with `padding: 2px 8px`.
- **Rating Badge:** Anchored at the top-left of media cards. Gradient stroke border with an icon colored in `#38EF7D` (Bio-Mint) and text in `label-md` (`#FFFFFF`).

### Interactive Search Bar & Flyout Hub
- **Idle State:** 48px height, `rounded-xl`, filled with `rgba(13, 44, 51, 0.35)`, border `rgba(0, 229, 195, 0.15)`. Placeholder text set in `body-md` (`rgba(255, 255, 255, 0.44)`).
- **Active / Focused State:** Border transitions to `#00E5C3`, supported by an outer aura `0 0 16px rgba(0, 229, 195, 0.25)`.
- **Search Dropdown Flyout:** Level 3 glass container that anchors to the search input with a 4px gap. Displays recent queries, trending live tags, and live-match poster strips separated by subtle dividers (`rgba(0, 229, 195, 0.08)`).

### Buttons & Chips
- **Secondary Buttons:** Glass frame (`rgba(13, 44, 51, 0.50)`), 1px border `rgba(255, 255, 255, 0.20)`, text in `#FFFFFF`. Hover elevates border to `rgba(0, 229, 195, 0.50)`.
- **Filter Chips:** Pill shape (`rounded-full`), `space-xs` vertical by `space-md` horizontal padding. Selected state carries a solid fill of `rgba(0, 229, 195, 0.18)` with a 1px border in `#00E5C3` and active `#00E5C3` text.

### Form Inputs, Checkboxes & Radios
- **Inputs:** Uniform 44px height, background `rgba(6, 24, 30, 0.60)`, border `rgba(0, 229, 195, 0.20)`, text `#FFFFFF`.
- **Selection Controls:** 18px boxes/circles with a 1.5px border in `rgba(0, 229, 195, 0.30)`. When checked, filled with `#00E5C3` and a deep `#06181E` checkmark/dot indicator accompanied by a micro-glow.