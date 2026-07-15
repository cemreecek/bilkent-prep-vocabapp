---
name: Academic Excellence System
colors:
  surface: '#f9f9fe'
  surface-dim: '#dad9de'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#381300'
  on-tertiary: '#ffffff'
  tertiary-container: '#592300'
  on-tertiary-container: '#d8885c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#723610'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 1rem
  container-padding-desktop: 2.5rem
  gutter: 1rem
  section-gap: 2rem
---

## Brand & Style

The design system is engineered for the Bilkent University Prep School ecosystem, balancing the rigor of academic life with the engaging mechanics of modern gamification. The visual language is **Corporate/Modern** with a focus on **Minimalism**, ensuring that the high-stakes nature of language learning remains focused and distraction-free.

The personality is authoritative yet encouraging. It avoids the "childish" tropes of many educational apps, instead opting for a sophisticated, structured environment that treats students as serious scholars. High-density information is mitigated by generous whitespace and a rigid grid, while gamified elements provide vibrant "pockets of energy" against a sober, professional backdrop.

## Colors

The palette is anchored by **Deep Bilkent Blue**, establishing immediate institutional trust and seriousness. This is contrasted by **Amber**, used exclusively for high-value gamification moments like streaks and level-ups to create a distinct psychological separation between "study" and "reward."

The neutral scale favors cool grays to maintain a crisp, clean environment. Semantic colors (Red/Green) are slightly desaturated to remain accessible and legible without causing visual fatigue during long study sessions.

## Typography

This design system utilizes a dual-font approach. **Geist** provides a technical, precise feel for headings and data-driven labels, reinforcing the academic atmosphere. **Inter** is utilized for all body copy to ensure maximum readability during long reading comprehension exercises.

Hierarchy is strictly enforced through weight: bold headings provide clear entry points into content, while labels use medium weights and slight tracking (letter spacing) to differentiate metadata from primary text.

## Layout & Spacing

The system follows a **Fluid Grid** model with a mobile-first philosophy. Layouts are primarily single-column for study content on mobile to minimize horizontal eye movement, expanding to a 12-column grid on desktop for dashboards.

Spacing is based on an **8px linear scale**. Margin and padding are used to create "focus zones"—tight spacing within cards to group related information, and generous external spacing to separate distinct study modules.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** rather than heavy shadows. The background remains a flat `#F8FAFC`, while interactive elements and content modules sit on `#FFFFFF` surfaces.

Depth is communicated through:
1.  **Level 0 (Background):** Utility areas and secondary navigation.
2.  **Level 1 (Surface):** Primary cards and content blocks. These use a very soft `0 1px 3px rgba(0,0,0,0.05)` shadow.
3.  **Level 2 (Interaction):** Active input states or floating gamification widgets, using a more pronounced ambient shadow to indicate priority.

## Shapes

The design system utilizes **Soft** rounding (0.25rem/4px base). This provides a subtle modern touch without compromising the professional, institutional aesthetic. 

- **Cards/Buttons:** 0.5rem (8px) for a balanced feel.
- **Input Fields:** 0.25rem (4px) to maintain a sharp, structured look.
- **Gamification Chips:** 1rem (16px) or fully rounded pill-shapes to differentiate "play" elements from "study" elements.

## Components

### Buttons
Primary buttons use the Deep Bilkent Blue with white text and no gradient. Secondary buttons use a subtle gray outline. Achievement buttons (e.g., "Claim Reward") utilize the Amber palette.

### Gamification Widgets
- **Streak Counters:** Displayed in the top navigation with an Amber flame icon (Lucide: `Flame`).
- **Error Score Widget:** A high-contrast card using the Soft Red palette to visualize "Error Debt," encouraging students to clear their backlog of mistakes.

### Content Blocks (Anti-Cheating)
Practice screens must implement `user-select: none` and `pointer-events: none` on specific reading passages to prevent copy-pasting into translation tools. These blocks are styled with a subtle vertical border on the left to indicate they are "protected" content.

### Inputs & Selectors
Use Geist for input labels. Active states are indicated by a 2px Deep Bilkent Blue border. Error states transition the border and label to Soft Red.

### Cards
Cards are the primary container for information. They should have a 1px border of `#E2E8F0` and no shadow in their default state, gaining a subtle shadow only on hover if they are interactive.