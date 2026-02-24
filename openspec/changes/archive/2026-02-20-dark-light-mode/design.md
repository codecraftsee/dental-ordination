## Context

The brand token system (`src/styles.scss` `:root`) uses CSS custom properties for all colors. Components reference only `var(--color-*)` tokens — no hardcoded colors remain after the theme change. This means dark mode only requires redefining the token values under a `[data-theme="dark"]` selector on `<html>` — zero component changes needed.

## Goals / Non-Goals

**Goals:**
- Light / dark toggle in the navbar, persisted to `localStorage`
- OS preference (`prefers-color-scheme`) used on first visit if no saved preference
- Signal-based `ThemeService` — reactive, injectable, consistent with the codebase pattern

**Non-Goals:**
- Per-component theme overrides
- More than two themes (light + dark)
- Animated transitions between themes (can be added later as a one-liner)

## Decisions

### Decision 1: `[data-theme="dark"]` attribute on `<html>` — not a CSS class

Using a `data-` attribute avoids conflicts with utility class names and is the modern standard (used by Bootstrap 5, shadcn, etc.). The `ThemeService` sets/removes `document.documentElement.setAttribute('data-theme', 'dark')`.

### Decision 2: Dark palette token values

The dark palette keeps the warm dental white brand identity but inverts surfaces and softens the navy primary for readability on dark backgrounds:

| Token | Light | Dark |
|---|---|---|
| `--color-primary` | `#2C3E50` | `#5D8AA8` (softened navy-blue) |
| `--color-primary-light` | `#34495E` | `#7BA7C2` |
| `--color-primary-dark` | `#1A252F` | `#3A6B8A` |
| `--color-accent` | `#F39C12` | `#F5B942` (slightly lighter gold) |
| `--color-background` | `#FAFAFA` | `#1A1D23` |
| `--color-surface` | `#FFFFFF` | `#242830` |
| `--color-surface-variant` | `#F2F3F4` | `#2D3138` |
| `--color-text` | `#212529` | `#E9ECEF` |
| `--color-text-secondary` | `#6C757D` | `#ADB5BD` |
| `--color-border` | `#DEE2E6` | `#3D4148` |

Semantic tokens (success, warning, danger, info backgrounds) are slightly desaturated in dark mode for comfort.

### Decision 3: Signal-based `ThemeService` — consistent with codebase

`ThemeService` exposes a `theme = signal<'light' | 'dark'>('light')` and an `isDark = computed(...)`. Toggle via `toggleTheme()`. On init, reads `localStorage` then falls back to `prefers-color-scheme`. Applying the theme sets the `data-theme` attribute as a side effect.

### Decision 4: Toggle button in navbar — not a settings page

A single icon button (☀️ / 🌙) in the navbar is the least disruptive placement. No new route or settings page needed.

## Risks / Trade-offs

- [FOUC] Flash of unstyled content on page load before Angular initializes → Mitigation: add a tiny inline `<script>` in `index.html` that reads `localStorage` and sets `data-theme` synchronously before Angular boots
- [Print] Dark backgrounds waste ink → Mitigation: existing `@media print` already forces `background: white`, no change needed
