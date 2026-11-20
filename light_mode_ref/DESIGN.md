---
name: Institutional Statistical Editorial
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#525f75'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0e1c2f'
  on-primary-container: '#77849c'
  inverse-primary: '#bac7e1'
  secondary: '#426086'
  on-secondary: '#ffffff'
  secondary-container: '#b3d1fd'
  on-secondary-container: '#3b5a7f'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00201d'
  on-tertiary-container: '#0c9488'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3fe'
  primary-fixed-dim: '#bac7e1'
  on-primary-fixed: '#0e1c2f'
  on-primary-fixed-variant: '#3a475c'
  secondary-fixed: '#d3e4ff'
  secondary-fixed-dim: '#aac9f4'
  on-secondary-fixed: '#001c38'
  on-secondary-fixed-variant: '#29486d'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  teal-accent: '#14B8A6'
  teal-surface: '#F0FDFA'
  canvas-slate: '#F8FAFC'
  surface-pure: '#FFFFFF'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 3.5rem
    fontWeight: '600'
    lineHeight: 4rem
  display-hero-mobile:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2.5rem
    fontWeight: '600'
    lineHeight: 3rem
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
  headline-md:
    fontFamily: Newsreader
    fontSize: 2rem
    fontWeight: '500'
    lineHeight: 2.5rem
  headline-md-mobile:
    fontFamily: Newsreader
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: 2rem
  headline-sm:
    fontFamily: Newsreader
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.75rem
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
  code-tabular:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an authoritative, institutional, and intellectually rigorous standard tailored for national-scale statistical governance and civil capacity-building. It merges classic editorial gravitas—conveying institutional permanence and public accountability—with precision-grade analytical tools.

The visual language rejects fleeting consumer trends in favor of disciplined editorial minimalism: crisp structural lines, generous breathing room, deliberate hierarchy, and uncompromised tabular clarity. The emotional tone projects credibility, constitutional diligence, analytical clarity, and modern civic governance.

## Colors

The palette establishes an immediate sense of institutional authority anchored in deep maritime navy tones (`#0B192C` and `#1E3E62`), offset by clean analytical teals (`#0D9488` and `#14B8A6`) that highlight key insights, completion states, and progress metrics.

- **Primary (`#0B192C`)**: Used for top-level headers, primary brand marks, and high-impact structural blocks.
- **Secondary (`#1E3E62`)**: Governs secondary actions, table headers, supporting titles, and focused navigation chrome.
- **Tertiary & Accent (`#0D9488`, `#14B8A6`)**: Reserved strictly for interactive data points, active milestones, metrics, and positive verification states.
- **Backgrounds & Neutrals**: Light, paper-like surfaces (`#F8FAFC`, `#FFFFFF`) framed by precise slate rules (`#E2E8F0`, `#CBD5E1`) prevent cognitive exhaustion during long analytical sessions.

## Typography

The typographic hierarchy pairs the editorial dignity of *Newsreader* for titles and page headlines with the hyper-utilitarian legibility of *Inter* for body text, data points, and technical documentation. *Plus Jakarta Sans* provides crisp structural definition across metadata tags, navigational links, and user controls.

- **Headlines (`Newsreader`)**: Evokes gazettes, academic whitepapers, and national registries. Use italic styles sparingly for secondary commentary and sub-headers.
- **Body & Data (`Inter`)**: Set with standard letter tracking and generous line heights. Tabular numerals must be enforced via `font-feature-settings: "tnum" 1` across all numerical columns and data summaries.
- **Controls & Labels (`Plus Jakarta Sans`)**: Applied in medium to semi-bold weights for badges, filter labels, and button actions to guarantee instant visual parsing.

## Layout & Spacing

The portal adheres to a 12-column fixed-max grid on desktop (capped at 1440px width) to ensure reading comfort and prevent wide data-table fragmentation. Tablet screens drop to an 8-column layout, and mobile screens collapse to a single 4-column flow.

- **Desktop (≥ 1024px)**: Outer margin set to `3rem` (`48px`) with `1.5rem` (`24px`) gutters.
- **Tablet (768px – 1023px)**: Outer margin scales to `2rem` (`32px`) with `1.25rem` (`20px`) gutters.
- **Mobile (< 768px)**: Outer margin reduces to `1rem` (`16px`) with `1rem` gutters; multi-column analytical panels stack sequentially.

Component density prioritizes clear visual rhythm: high-density statistical forms adopt `space-sm` (`8px`) vertical gaps, while narrative and curriculum landing sections use `space-xl` (`40px`) spacing.

## Elevation & Depth

To preserve an official, clean editorial atmosphere, this design system avoids heavy, artificial drop shadows. Visual depth is established through subtle surface shifts and fine borders.

- **Level 0 (Base Canvas)**: `#F8FAFC` provides the foundational background for long reading sessions.
- **Level 1 (Card & Module Layer)**: `#FFFFFF` paired with a 1px border of `#E2E8F0`. No shadow is applied under static states.
- **Level 2 (Interactive Floating)**: Navigational drop-downs and focused hover cards apply an ambient, diffused shadow: `0 4px 20px -2px rgba(11, 25, 44, 0.06)` with a matching border transition to `#CBD5E1`.
- **Level 3 (Modal & System Drawer)**: `0 20px 40px -8px rgba(11, 25, 44, 0.14)` over a 40% opacity navy backdrop veil (`rgba(11, 25, 44, 0.4)`).

## Shapes

The interface uses a disciplined, soft geometry (`roundedness: 1`), keeping corner radii between `4px` and `8px`. This maintains an institutional architectural line while avoiding stark, harsh edges.

- **Inputs, Buttons, and Cards**: Standard corner radius of `0.25rem` (`4px`) ensures a clean, calibrated appearance.
- **Panels, Dialogue Modals, and Elevated Containers**: `rounded-lg` of `0.5rem` (`8px`) creates gentle framing.
- **Badge Chips & Indicator Tags**: Full pill radii (`9999px`) are strictly reserved for numeric indicators, active status chips, and categorization markers.

## Components

### Buttons
- **Primary**: Solid `#0B192C` fill with `#FFFFFF` text (`Plus Jakarta Sans`, 600 weight). Subtle hover shift to `#1E3E62`. 4px radius, `padding: 0.625rem 1.25rem`.
- **Secondary / Tactical**: White surface with a 1px `#CBD5E1` border and `#0B192C` text. Hover state introduces `#F8FAFC` surface fill and `#0B192C` border tint.
- **Tertiary / Statistical Accent**: `#0D9488` background with `#FFFFFF` text for core conversion actions (e.g., "Begin Assessment", "Generate Report").

### Badges & Status Chips
- Height: `24px` with a pill radius (`9999px`).
- Inactive / General: `#F1F5F9` background, `#475569` text, `0.75rem` font size.
- Certified / Active: `#F0FDFA` background, `#0D9488` border (1px), and `#0F766E` text.

### Data Cards
- Pure white background (`#FFFFFF`) framed with a 1px `#E2E8F0` border.
- Headers are separated with a 1px divider, featuring a `Newsreader` headline and an optional right-aligned metadata badge.
- Interactive states switch the border to `#0D9488` or `#1E3E62` alongside a gentle 2px upward translation.

### Form Inputs & Selectors
- Standard text input uses an inset `#FFFFFF` surface with a 1px `#CBD5E1` border.
- Active focus state applies a crisp 2px outline in `#0D9488` without glow or blur.
- Placeholder text is set in `#94A3B8` (`Inter`, 400 weight).

### Selection Controls
- Checkboxes and radio targets use a 1px `#CBD5E1` frame that turns `#0D9488` when active. Checkmarks are rendered in clean white SVG strokes.

### Tabs & Navigation
- Editorial underline style: transparent base background, `#64748B` label text.
- Active tab features `#0B192C` text paired with a 2px bottom border in `#0D9488`, ensuring clear focus and hierarchy across administrative modules.