---
name: Academic Precision
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
  on-surface-variant: '#40484b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#70787c'
  outline-variant: '#c0c8cb'
  surface-tint: '#306576'
  primary: '#003441'
  on-primary: '#ffffff'
  primary-container: '#0f4c5c'
  on-primary-container: '#87bbce'
  inverse-primary: '#9acee1'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#482700'
  on-tertiary: '#ffffff'
  tertiary-container: '#623d13'
  on-tertiary-container: '#dda975'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b6ebfe'
  primary-fixed-dim: '#9acee1'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#114d5d'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#f3bc87'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#643e14'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered for high-density information environments where clarity and authority are paramount. It targets educators, administrators, and students who require a tool that feels institutional yet cutting-edge. The brand personality is scholarly, disciplined, and reliable, evoking a sense of calm efficiency amidst complex data.

The aesthetic follows a **Corporate / Modern** style with strong **Minimalist** influences. It prioritizes content over container, utilizing generous whitespace to prevent cognitive overload. Every visual element serves a functional purpose, ensuring that the interface remains unobtrusive while guiding the user through administrative workflows with surgical precision.

## Colors

The palette is anchored by "Deep Academic Teal," a color that strikes a balance between traditional university blue and modern SaaS aesthetics. This primary hue is used for global navigation, primary actions, and brand identification.

- **Primary:** Used for the heaviest interactive elements and headers to establish authority.
- **Success Green:** Reserved strictly for "Approved," "Completed," or "Verified" statuses.
- **Warning Orange:** High-visibility color for "Pending," "In-Review," or "Action Required" items.
- **Neutral:** A range of slate grays provides a balanced framework for borders, secondary text, and iconography, ensuring the UI feels grounded.
- **Surface:** A cool, off-white background reduces eye strain during long administrative sessions.

## Typography

This design system utilizes **Inter** for its exceptional readability in data-heavy layouts. The typographic scale is optimized for hierarchy, using weight and subtle letter-spacing adjustments to differentiate between instructional text and data points.

Headlines use a tighter tracking and heavier weight to appear more authoritative. Body text maintains a standard 1.5x line-height ratio to ensure legibility in long-form reports or course descriptions. Labels and metadata utilize a smaller, semi-bold treatment to remain legible while occupying minimal space.

## Layout & Spacing

This design system employs a **Fixed Grid** approach for desktop views to maintain structural integrity in complex dashboards, transitioning to a fluid model for mobile responsiveness. 

- **Grid:** A 12-column grid is used for main layouts, with elements spanning 3, 4, 6, or 12 columns.
- **Rhythm:** A 4px baseline grid ensures consistent vertical rhythm.
- **Margins:** Large 32px outer margins provide "breathing room" for the data-dense content area.
- **Gutters:** 24px gutters provide clear separation between data cards and sidebars.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows. This maintains a clean, modern aesthetic that doesn't distract from the data.

- **Level 0 (Background):** The base `#F8FAFC` surface.
- **Level 1 (Cards/Containers):** White surfaces with a 1px border in a light neutral shade (`#E2E8F0`). 
- **Level 2 (Dropdowns/Modals):** White surfaces with a very soft, diffused ambient shadow (0px 4px 20px rgba(15, 76, 92, 0.08)) to indicate interactivity and temporary state.
- **Level 3 (Pop-overs):** Slightly higher contrast borders to separate them from the primary workspace.

## Shapes

The shape language is **Soft** and systematic. A universal radius of `0.25rem` (4px) is applied to standard components like input fields, buttons, and small containers. This creates a professional, organized look that avoids the "playfulness" of highly rounded corners while remaining more modern than sharp edges. Larger containers like modals or cards use `0.5rem` (8px) to provide a subtle distinction in the visual hierarchy.

## Components

- **Buttons:** Primary buttons use the Deep Teal background with white text. Secondary buttons are outlined in Neutral grays. Success and Warning buttons are reserved for final confirmations of their respective actions.
- **Input Fields:** Minimalist styling with a 1px border that shifts to Deep Teal on focus. Labels sit clearly above the field in `label-caps` style.
- **Data Tables:** The core of the system. High-density, no vertical borders, alternating row highlights for readability, and semi-bold headers.
- **Status Chips:** Small, rounded badges using a 10% opacity background of the status color (Green/Orange) with 100% opacity text for high legibility without visual clutter.
- **Progress Indicators:** Linear bars using the Success Green for completion and the Primary Teal for active states.
- **Sidebar Navigation:** A vertical, dark-themed sidebar using the primary color to provide a strong anchor to the interface, with active states indicated by a left-hand accent border.