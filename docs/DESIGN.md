# Michaela OS Design System

## 1. Purpose

Michaela OS should feel like one cohesive personal application rather than a collection of unrelated widgets.

The visual identity is:

- Warm
- Bright
- Cozy
- Calm
- Friendly
- Polished
- Easy to scan
- Inspired by autumn without feeling dark or heavy

The interface should feel like a warm, airy version of Notion.

---

## 2. Design Architecture

Michaela OS uses two separate styling layers.

### Theme layer

Located at:

```text
css/system/cozy-autumn.css

The theme controls how Michaela OS looks.

It owns:

Fonts
Colors
Surface colors
Borders
Shadows
Corner radii
Progress colors
Spacing tokens
Motion timing

The theme must not control widget layouts.

Widget layer

Each widget owns its individual CSS file.

Examples:

css/health-summary-widget.css
css/nutrition-summary-widget.css
css/morning-focus-widget.css

Widget CSS controls:

Grid structure
Columns
Rows
Internal positioning
Widget-specific spacing
Responsive behavior
Unique visualizations
Functional states

The rule is:

Theme controls how it looks.
Widget CSS controls how it is arranged.

3. Required Stylesheets

Every widget must load the theme before its individual stylesheet.

<link
  rel="stylesheet"
  href="../../css/system/cozy-autumn.css"
/>

<link
  rel="stylesheet"
  href="../../css/example-widget.css"
/>

The widget stylesheet comes second so it can use and selectively override theme variables.

4. Visual Reference Widgets

The current visual reference widgets are:

Health
Nutrition
Morning Focus

New widgets should feel like they belong beside these three.

A new widget does not need to copy their layouts.

It should match their:

Outer card treatment
Header structure
Typography
Panel surfaces
Border weight
Shadow softness
Corner radii
Spacing rhythm
Hover behavior
Loading and error states
5. Page Background

Widgets are embedded inside Notion.

The page background should remain transparent.

body {
  background: var(--page-background, transparent);
}

Do not add a solid full-page background inside an embedded widget.

6. Outer Widget Card

The outer card is the primary container for each widget.

Recommended structure:

<main class="example-widget-shell">
  <article class="example-card">
    <!-- Widget content -->
  </article>
</main>

Recommended shell:

.example-widget-shell {
  width: 100%;
  padding: 8px;
}

Recommended outer card:

.example-card {
  width: 100%;
  min-width: 0;
  padding: 18px 20px 20px;

  color: var(--text-primary);
  background: var(--card-background);

  border: 1px solid var(--border-default);
  border-radius: var(--radius-card);

  box-shadow: var(--shadow-card);

  transition: var(--transition-widget);
}

Recommended hover state:

.example-card:hover {
  transform: translateY(-1px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-card-hover);
}

Avoid dramatic movement, scaling, or dark shadows.

7. Widget Header

Most dashboard widgets should use the standard Michaela OS header anatomy.

[Icon]  EYEBROW                     [Arrow]
        Widget Title

Recommended HTML:

<header class="example-card__header">
  <div class="example-card__heading">
    <span
      class="example-card__icon"
      aria-hidden="true"
    >
      ✦
    </span>

    <div>
      <p class="example-card__eyebrow">
        Today
      </p>

      <h1 class="example-card__title">
        Widget Name
      </h1>
    </div>
  </div>

  <a
    class="example-card__arrow"
    href="#"
    aria-label="Open Widget Name dashboard"
  >
    <span aria-hidden="true">→</span>
  </a>
</header>
Header spacing
.example-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  margin-bottom: 18px;
}
Heading group
.example-card__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}
8. Header Icon

The default header icon size is:

width: 37px;
height: 37px;
border-radius: var(--radius-icon);

Recommended structure:

.example-card__icon {
  display: grid;
  width: 37px;
  height: 37px;
  flex: 0 0 auto;
  place-items: center;

  font-size: 17px;
  line-height: 1;

  border-radius: var(--radius-icon);
}

Icons should be simple, recognizable, and visually balanced.

Current examples:

Health: heart
Nutrition: sparkle
Morning Focus: sun
Water: water drop
Walking: walking figure

Avoid mixing detailed illustrations with simple symbols.

9. Eyebrow Text

Eyebrow text provides context such as “Today” or “Dashboard.”

.example-card__eyebrow {
  margin: 0 0 2px;

  color: var(--text-secondary);

  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.1;
  text-transform: uppercase;
}

Eyebrows should be short.

Good examples:

Today
Dashboard
This Week
Overview
Progress
10. Widget Title

Widget titles use the heading font.

.example-card__title {
  margin: 0;

  color: var(--text-primary);
  font-family: var(--font-heading);

  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.05;
}

Do not use the heading font for small labels or body copy.

11. Header Arrow

Interactive widgets should use the circular arrow treatment.

.example-card__arrow {
  display: grid;
  width: 31px;
  height: 31px;
  flex: 0 0 auto;
  place-items: center;

  color: var(--accent-dark);
  text-decoration: none;

  font-size: 1rem;
  font-weight: 800;
  line-height: 1;

  background: var(--surface-accent);
  border: 1px solid var(--border-accent);
  border-radius: 50%;

  transition:
    transform var(--transition-fast),
    background var(--transition-fast);
}

Recommended hover:

.example-card:hover .example-card__arrow {
  transform: translateX(2px);
}

.example-card__arrow:hover {
  background: var(--surface-accent-strong);
}

Do not use plain text such as “Open” when the circular arrow fits.

12. Inner Panels

Inner panels group related content.

Examples include:

Water
Walking
Calories
Protein
Fiber
Today’s priorities
Morning reflections

Recommended treatment:

.example-panel {
  min-width: 0;
  padding: 18px 20px;

  background: var(--panel-background);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-panel);

  box-shadow: var(--shadow-panel);
}

Inner panels should feel lighter than the outer card.

Do not give every panel a large external drop shadow.

13. Divided Panels

Related values may share one panel divided into rows.

Morning Focus uses this pattern for:

Looking forward to
Leaving in yesterday
Grateful for

Recommended structure:

.divided-panel {
  overflow: hidden;

  background: var(--panel-background);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-panel);

  box-shadow: var(--shadow-panel);
}

.divided-panel__item {
  padding: 15px 18px;
}

.divided-panel__item
  + .divided-panel__item {
  border-top: 1px solid var(--border-soft);
}

Use divided panels when several small pieces of information belong together.

14. Panel Labels

Small panel labels should use uppercase body typography.

.metric-label {
  margin: 0 0 7px;

  color: var(--text-secondary);

  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

Labels should describe the value directly.

15. Primary Values

Large metric values should be easy to scan.

Recommended range:

font-size: clamp(1.65rem, 3vw, 2.25rem);
font-weight: 800;
letter-spacing: -0.04em;
line-height: 1;

Examples:

Water consumed
Miles walked
Calories consumed
Weight change
Money remaining
Books completed

Supporting units and goals should be smaller and lighter.

16. Body Copy

Default informational text should use:

color: var(--text-primary);
font-size: 0.8rem;
font-weight: 650;
line-height: 1.45;

Supporting text should use:

color: var(--text-secondary);
font-size: 0.72rem;
font-weight: 650;
line-height: 1.45;

Avoid very light text for important information.

17. Progress Bars

Recommended progress track:

.progress__track {
  width: 100%;
  height: 10px;
  overflow: hidden;

  background: var(--progress-track);
  border-radius: var(--radius-pill);
}

Recommended fill:

.progress__fill {
  width: 0;
  height: 100%;

  border-radius: inherit;

  transition:
    width 650ms
    cubic-bezier(0.22, 1, 0.36, 1);
}

Progress values may exceed their goals in the data, but the visual bar should normally stop at 100%.

18. Progress Rings

Progress rings should use the same track color as progress bars.

.progress-ring {
  --progress: 0deg;
  --ring-color: var(--accent);

  position: relative;

  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;

  background:
    conic-gradient(
      var(--ring-color) var(--progress),
      var(--progress-track) 0deg
    );

  border-radius: 50%;
}

The inner circle should be warm white and visually blend with its panel.

.progress-ring::before {
  position: absolute;
  inset: 8px;

  content: "";

  background: #fffdf9;
  border-radius: 50%;
}
19. Badges

Badges should be small, warm, and subtle.

.example-badge {
  padding: 7px 10px;

  color: var(--accent-dark);

  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1;

  background: var(--surface-accent);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-pill);
}

Badges should not compete with primary values.

20. Checkboxes

Checkboxes should be large enough to use comfortably.

.priority-item input {
  width: 18px;
  height: 18px;
  margin: 1px 0 0;

  accent-color: var(--widget-accent);
  cursor: pointer;
}

Completed items should remain readable but clearly secondary.

.priority-item input:checked + span {
  color: var(--text-soft);
  text-decoration: line-through;
}
21. Semantic Widget Accents

Each widget may use a subtle semantic accent while remaining inside the Cozy Autumn palette.

Current widget accents:

Widget	Accent direction
Health	Terracotta
Nutrition	Peach and food-specific colors
Morning Focus	Warm golden yellow
Water	Muted blue
Walking	Warm gold
Protein	Muted coral
Fiber	Soft sage

Potential future accents:

Widget	Suggested accent
Reading	Dusty blue
Finance	Warm olive or muted gold
Tasks	Soft clay
Habits	Sage
Projects	Muted plum
Events	Dusty rose

Accent colors should be used primarily for:

Header icon backgrounds
Small icons
Checkboxes
Progress fills
Badges
Small labels

Do not tint the entire widget strongly.

22. Color Rules

Use theme variables rather than hard-coded colors whenever possible.

Preferred:

color: var(--text-primary);
background: var(--panel-background);
border-color: var(--border-default);

Avoid:

color: #40342e;
background: #fffdf9;
border-color: rgba(91, 65, 49, 0.12);

Fallback values are allowed when they protect a widget from rendering incorrectly if the theme fails to load.

Example:

color: var(--text-primary, #40342e);
23. Spacing

The theme provides these spacing tokens:

--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 20px;
--space-2xl: 24px;

Recommended common spacing:

Use	Space
Tiny icon gap	4–8px
Label-to-value gap	4–7px
Header icon-to-title gap	11px
Related content gap	12px
Panel grid gap	16px
Header-to-content gap	18px
Standard horizontal panel padding	18–20px

Spacing should feel relaxed without creating excessively tall embeds.

24. Corner Radii

Use the theme radius variables.

--radius-card
--radius-panel
--radius-small
--radius-icon
--radius-pill

Typical usage:

Element	Radius
Outer widget	--radius-card
Inner panel	--radius-panel
Small button	--radius-small
Header icon	--radius-icon
Badge or progress bar	--radius-pill

Avoid introducing a new corner radius for every widget.

25. Shadows

Use only the standard shadows:

--shadow-card
--shadow-card-hover
--shadow-panel

Outer cards may use drop shadows.

Inner panels should use the subtle inset panel shadow.

Avoid:

Heavy black shadows
Sharp shadows
Multiple competing shadows
Glowing effects
Neumorphism
26. Motion

Motion should be subtle and functional.

Allowed:

Card lifting by 1px
Arrow moving by 2px
Progress animations
Slight button lift
Soft background transitions

Avoid:

Bouncing
Large scaling
Rotating cards
Long animations
Decorative constant movement

All animated widgets must respect reduced-motion settings.

@media (prefers-reduced-motion: reduce) {
  .example-card,
  .example-card__arrow,
  .progress__fill {
    transition: none;
  }
}
27. Loading States

Loading states should appear inside a panel.

.example-loading {
  padding: 15px;

  color: var(--text-secondary);
  text-align: center;

  font-size: 0.82rem;
  font-weight: 650;

  background: var(--panel-background-soft);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-panel);
}

Loading language should be short and specific.

Examples:

Loading today’s health…
Loading today’s nutrition…
Loading today’s focus…
28. Error States

Errors should use the same panel structure as loading states.

.example-error {
  padding: 15px;

  color: var(--color-danger);
  text-align: center;

  font-size: 0.82rem;
  font-weight: 650;

  background: rgba(185, 101, 91, 0.08);
  border: 1px solid rgba(185, 101, 91, 0.14);
  border-radius: var(--radius-panel);
}

Error language should be calm.

Use:

Nutrition data could not be loaded.

Avoid:

ERROR! FAILED TO FETCH DATA!

29. Empty States

Empty states should explain what is missing and provide one clear action when possible.

Recommended content:

A short title
One sentence of context
One primary action

Example:

Your morning focus is ready to begin.

Create today’s priorities and reflections.

[Start Today]

Do not make empty states feel like errors.

30. Responsive Behavior

Widgets are usually embedded in Notion, which may report narrow widths unexpectedly.

Do not shrink typography and padding too aggressively at medium breakpoints.

Preferred breakpoint behavior:

Around 700px
Convert multi-column content into one column when necessary.
Reduce grid gaps slightly.
Preserve readable panel padding.
Around 480px
Reduce outer card padding moderately.
Stack empty-state actions.
Keep touch targets large.

Do not assume that an apparently wide Notion embed reports a wide browser viewport.

31. Accessibility

Every widget should include:

Sufficient text contrast
Visible keyboard focus
Descriptive link and button labels
aria-hidden="true" on decorative icons
aria-live="polite" for update messages
Real buttons for actions
Real links for navigation
Reduced-motion support

Interactive outer cards must not contain invalid nested interactive elements.

Use an <article> outer card when it contains checkboxes, links, or buttons.

Use a <button> outer card only when the entire card is one action and it contains no other interactive controls.

32. CSS Naming

Widget classes should have a clear widget-specific prefix.

Examples:

health-
nutrition-
focus-
finance-
reading-

Recommended naming patterns:

widget-card
widget-card__header
widget-card__title
widget-card__icon

metric-panel
metric-panel__label
metric-panel__value

reflection-panel
reflection-panel__item
reflection-panel__label

Use modifier classes for variations:

progress__fill--water
progress-ring--protein
focus-message--update
reflection-item--wide

Do not use IDs for styling.

IDs are reserved for JavaScript hooks and accessibility relationships.

33. JavaScript Compatibility

When redesigning an existing widget:

Preserve all IDs used by JavaScript.
Preserve expected hidden states.
Preserve buttons, links, and inputs.
Preserve script paths.
Preserve API behavior.
Change class names only when the CSS and HTML are updated together.

Visual redesigns should not require rewriting working data logic unless the interaction itself changes.

34. New Widget Checklist

Before considering a widget complete, verify:

The Cozy Autumn theme loads first.
The widget owns its layout.
The outer card matches Health, Nutrition, and Morning Focus.
The header uses the standard hierarchy.
The icon has a subtle semantic color.
Inner content is grouped into panels.
Text is readable at Notion embed sizes.
Loading, empty, and error states are styled.
JavaScript IDs still work.
The widget responds cleanly on narrow screens.
Motion respects reduced-motion preferences.
The card does not feel darker or heavier than the existing widgets.
35. Design Principle

The final test for any design decision is:

Does this feel like another room in the same warm house?

Widgets may have different purposes and layouts, but they should share the same materials, lighting, and personality.


## Then commit it

Use a commit message such as:

```text
Add Michaela OS design system documentation

This file does not change the dashboard itself. It records the rules we have already established so future widgets stay cohesive.

The next file should be:

docs/WIDGET_GUIDELINES.md

That one will be the practical build template: exact starter HTML, starter CSS, required states, file naming, and the step-by-step process for converting or creating a widget.
