---
name: Liquid Glass MediaVault
colors:
  surface: '#131317'
  surface-dim: '#131317'
  surface-bright: '#39393d'
  surface-container-lowest: '#0e0e12'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#2a292e'
  surface-container-highest: '#353439'
  on-surface: '#e4e1e7'
  on-surface-variant: '#c0c6d6'
  inverse-surface: '#e4e1e7'
  inverse-on-surface: '#303034'
  outline: '#8b91a0'
  outline-variant: '#414754'
  surface-tint: '#aac7ff'
  primary: '#aac7ff'
  on-primary: '#003064'
  primary-container: '#3e90ff'
  on-primary-container: '#002957'
  inverse-primary: '#005db8'
  secondary: '#c2c1ff'
  on-secondary: '#1800a7'
  secondary-container: '#3630bf'
  on-secondary-container: '#b1b1ff'
  tertiary: '#47e266'
  on-tertiary: '#003910'
  tertiary-container: '#00a73e'
  on-tertiary-container: '#00320d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00468d'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006b'
  on-secondary-fixed-variant: '#332dbc'
  tertiary-fixed: '#6cff82'
  tertiary-fixed-dim: '#47e266'
  on-tertiary-fixed: '#002106'
  on-tertiary-fixed-variant: '#00531a'
  background: '#131317'
  on-background: '#e4e1e7'
  surface-variant: '#353439'
typography:
  display:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.035em
  headline-lg:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  mono-meta:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  mono-badge:
    fontFamily: JetBrains Mono
    fontSize: 0.625rem
    fontWeight: '600'
    lineHeight: 0.75rem
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system defines an ethereal yet precision-engineered desktop application aesthetic. Drawing from contemporary macOS interface paradigms, Apple Liquid Glass, and Scandinavian minimalism, the visual environment treats the UI as precision-milled optical glass suspended over fluid media canvases. 

### Brand Personality & Emotional Impact
- **Optical Precision:** Ultra-thin specular hairlines, pure geometry, and calibrated refraction evoke tactile luxury and native desktop utility.
- **Deep Focus:** UI chrome recedes through variable frosted diffusion, directing complete visual attention toward scraped high-fidelity video, photography, and metadata streams.
- **Effortless Tactility:** Surfaces respond dynamically with gentle specular highlights, fluid transitions, and balanced inertia.

### Aesthetic Execution
- **Surface Materiality:** Dynamic multi-layered glass (`backdrop-blur-2xl` to `backdrop-blur-md`) infused with subtle neutral tints.
- **Edge Definition:** Sub-pixel inner rim lights (`inset 0 1px 0 0 rgba(255,255,255,0.2)`) and translucent exterior strokes framing each functional container.
- **Accents:** Electric Apple-inspired Azure (`#0A84FF`) against deep graphite and titanium neutrals, preserved with restrained surgical placement.

## Colors

The palette revolves around deep titanium and graphite tones calibrated for high-translucency interfaces, anchored by electric azure for primary actions and system states.

### Core Palettes
- **Primary (`#0A84FF`):** System focus, scraper execution indicators, download progress vectors, active selection outlines.
- **Secondary (`#5E5CE6`):** Deep indigo/electric violet used for platform sync status, collections, and smart batching tags.
- **Tertiary (`#30D158`):** Pristine emerald indicator for completed scrapes, live socket status, and healthy storage health.
- **Neutral (`#16161A`):** Pure obsidian-graphite base engineered to prevent optical muddying across blurred translucent layers.

### Platform Source Color Accents (Scraper Contexts)
- **X / Threads:** Slate Platinum (`#F5F5F7` dark / `#1C1C1E` light).
- **Instagram:** Sunset Magenta Gradient / Accent (`#E1306C` / `#FD1D1D`).
- **YouTube / Twitch:** Cinema Crimson (`#FF0033`) / Royal Violet (`#9146FF`).
- **Vimeo / Bluesky:** Cyan Drift (`#00ADEF` / `#0285FF`).

### Glass Tint Formulae
- **Dark Mode Glass Base:** `rgba(22, 22, 26, 0.72)` over canvas; `rgba(32, 32, 38, 0.55)` for floating panels.
- **Light Mode Glass Base:** `rgba(255, 255, 255, 0.75)` over canvas; `rgba(245, 245, 247, 0.60)` for elevated modals.
- **Specular Rim Border:** `rgba(255, 255, 255, 0.12)` in dark mode; `rgba(255, 255, 255, 0.65)` in light mode.

## Typography

The typographical structure draws immediate parallels to macOS system interfaces: Swiss precision, optical kerning, condensed tracking at display scales, and specialized monospaced metadata roles for scraping stats, codecs, resolutions, and file sizes.

### Hierarchy & Tuning
- **Headlines & Interface Titles (`Inter`):** Tightly tracked with negative letter spacing (`-0.015em` to `-0.035em`) to simulate native desktop font rendering engines.
- **Body & Controls (`Inter`):** Neutral, unobtrusive, prioritizing immediate scanability across dense grid and list layouts.
- **Data & Telemetry (`JetBrains Mono`):** Dedicated to technical media attributes (e.g., `4K ProRes 422`, `60fps`, `148.2 MB`, `GET 200 OK`). Provides structural alignment and clean visual parsing inside table views and asset inspectors.

## Layout & Spacing

The layout model is architected specifically for high-efficiency desktop media workflows, featuring persistent glass navigation sidebars, fluid media discovery surfaces, and contextual collapsible inspector sidecars.

### Layout Anatomy
- **Desktop Grid:** Fluid 12-column foundation anchored by fixed-width functional zones:
  - **Sidebar:** 260px fixed width, frosted glass substrate with deep background blur (`backdrop-blur-2xl`).
  - **Main Canvas:** Flexible column grid for asset display, adjusting dynamically from 2 to 6 cards wide based on viewport size.
  - **Inspector Drawer:** 340px fixed width, docked right, hosting scrape telemetry and batch operation details.
- **Responsive Adaptations:**
  - **Desktop (1280px+):** Tri-pane layout active concurrently.
  - **Tablet / Small Desktop (768px - 1279px):** Inspector tucks into an overlay modal sheet; sidebar collapses into an icon rail (68px).
  - **Mobile (< 768px):** Single canvas with bottom floating navigation bar utilizing full liquid glass styling.

## Elevation & Depth

Visual hierarchy does not rely on opaque dropshadows; rather, depth is expressed through variable diffusion levels, edge luminosity, and physical layer stacking.

### The Liquid Glass Depth Architecture
1. **Level 0 (Canvas Base):** Deep graphite/obsidian canvas (`#0D0D11`). Background media and canvas glows bleed through here.
2. **Level 1 (Docked Surfaces & Sidebars):** Translucent fill (`rgba(22, 22, 26, 0.70)`) with `backdrop-blur-xl`, bounded by a delicate 1px hairline border (`rgba(255, 255, 255, 0.08)`).
3. **Level 2 (Interactive Asset Cards & Toolbars):** Elevated glass (`rgba(35, 35, 42, 0.65)`), `backdrop-blur-lg`, featuring dual border effects:
   - Outer Stroke: `1px solid rgba(255, 255, 255, 0.12)`.
   - Top Specular Lip: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.22)`.
   - Drop Shadow: Ultra-diffuse, tinted ambient shadow `0 16px 36px -8px rgba(0, 0, 0, 0.45)`.
4. **Level 3 (Modals, Context Menus & Scraper Dialogs):** High refraction glass (`rgba(45, 45, 54, 0.85)`), `backdrop-blur-3xl`, framed with an energetic ambient glow:
   - Border: `1px solid rgba(255, 255, 255, 0.24)`.
   - Shadow: `0 24px 64px -12px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(255, 255, 255, 0.1)`.

### Lighting & Highlights
All raised elements feature top-down directional lighting: the top border contains double the specular alpha of the bottom border, simulating physical glass catching overhead ambient light.

## Shapes

The design system employs continuous Apple-style corner squircle radii. Sharp 90-degree corners are strictly prohibited to maintain liquid glass optical continuity.

### Shape Scale
- **Cards & Modals:** `rounded-2xl` (1rem to 1.25rem continuous curvature).
- **Controls, Input Fields & Segmented Buttons:** `rounded-lg` (0.5rem to 0.75rem).
- **Badges, Status Chips & URL Pills:** Fully pill-shaped (`rounded-full` / 9999px) for streamlined visual tension against media thumbnails.

## Components

### Buttons & Interactive Controls
- **Primary Glass Action:** Azure accent gradient (`linear-gradient(180deg, #0A84FF 0%, #0066CC 100%)`), 1px white specular top edge (`inset 0 1px 0 rgba(255,255,255,0.3)`), subtle outer glow on hover.
- **Secondary Liquid Glass:** Neutral translucent fill (`rgba(255, 255, 255, 0.08)`), hover shifts to `rgba(255, 255, 255, 0.14)`. Active state produces a gentle 0.98 scale compression.

### Universal Scraper Input Bar
- Floating unified URL ingest component spanning the header.
- High-blur frosted capsule (`rounded-full`), padded with leading protocol badge, inline auto-detecting platform glyph (e.g., dynamic Instagram/YouTube icon switch), and an embedded action trigger.
- Focused state activates an electric azure specular ring (`box-shadow: 0 0 0 1px #0A84FF, 0 0 20px rgba(10, 132, 255, 0.25)`).

### Media Asset Cards
- **Structure:** Aspect-ratio locked media canvas enclosed by `rounded-xl` glass frames.
- **Hover Micro-interaction:** Subtle 1.02 scale zoom with a top-down light sweep animation across the border stroke (`border-white/30`).
- **Telemetry Badges:** Suspended bottom pills displaying duration (`03:42`), resolution (`4K`), and platform origin mark using `mono-badge` micro-typography.

### Context Menus & Dropdowns
- Compact frosted sheets (`backdrop-blur-2xl`, `bg-neutral/80`), itemized with 4px inner padding, separated by 1px translucent hairline dividers (`rgba(255,255,255,0.06)`).
- Hover selection applies an iOS-style azure highlight with rounded inner corners.

### Progress & Telemetry Strips
- Ultra-thin 3px frosted tracks with animated luminous cyan fill indicators.
- Emits soft ambient bloom (`drop-shadow(0 0 4px #0A84FF)`) during active batch scraping.

## Generated Stitch Screens (Project ID: 16578747289573414516)
- **Main Library Dashboard:** projects/16578747289573414516/screens/38a8721f6a83435c807e58ef321542ec
- **URL Preview & Format Picker Modal:** projects/16578747289573414516/screens/bbcc59e6b85740338a9abb5a9026bf50
- **Active Download Queue Drawer:** projects/16578747289573414516/screens/f69eb578e6994c0aab63b11865215ceb
