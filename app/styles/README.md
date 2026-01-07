# Theme System Architecture

This directory contains the CSS architecture for the Fusion/Cortex application. The system is designed to be modular, themeable, and maintainable.

## Directory Structure

```
app/styles/
├── base.css           # Core variable definitions & default root variables
├── components.css     # Component-specific styles & legacy token overrides
├── utilities.css      # Utility classes setup
└── themes/            # Individual theme definition files
    ├── dark.css
    ├── light.css
    ├── high-contrast.css
    ├── warm-night.css
    ├── warm-day.css
    ├── glass-neumorphism.css
    ├── business-fluent.css
    ├── on-brand.css
    └── on-brand-glass.css
```

## How Theming Works

1.  **Variable Definitions**: All design values (colors, spacing, shadows) are defined as CSS Custom Properties (Variables) in the individual theme files.
2.  **Activation**: Themes are applied via the `data-theme` attribute on the root `<html>` or `<body>` element.
    ```css
    [data-theme="warm-night"] {
        --color-bg: #1c1917;
        /* ... */
    }
    ```
3.  **Import Order**: imports are managed in `app/globals.css`. The order is important:
    1.  Tailwind Directives
    2.  `base.css` (Defaults)
    3.  `themes/*.css` (Theme definitions)
    4.  `components.css` (Overrides)
    5.  `utilities.css`

## Adding a New Theme

1.  **Create File**: Create a new CSS file in `app/styles/themes/` (e.g., `solar-punk.css`).
2.  **Define Scope**: targeted the theme using the attribute selector:
    ```css
    [data-theme="solar-punk"] {
        /* ... variables ... */
    }
    ```
3.  **Copy Template**: You can copy the variables from `dark.css` or `light.css` as a starting point.
4.  **Register**: Import the new file in `app/globals.css`:
    ```css
    @import './styles/themes/solar-punk.css';
    ```
5.  **Enable in UI**: Add the theme key to the `THEMES` array in your theme switcher component (usually in `components/layout/ThemeSelector` or similar config).

## Guidelines

-   **Do not** put theme-specific variables in `base.css`.
-   **Do not** hardcode colors in React components; always use Tailwind classes that map to these variables (e.g., `bg-[var(--color-bg)]` or configured Tailwind utility `bg-background`).
-   **High Contrast**: The `high-contrast.css` theme is special. It enforces strict black/white values and distinct 2px borders for accessibility. When adding new components, check them against High Contrast mode.
