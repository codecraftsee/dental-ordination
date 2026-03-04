## Context

The Angular Material migration converted most pages to `mat-card`. Eight `<div class="stat-card">` elements in two files were missed. They rely on custom SCSS rules (`.stat-card`) and do not respond to the global `--mdc-*` CSS token overrides, causing visual inconsistency — especially in dark mode where the card background does not switch correctly.

## Goals / Non-Goals

**Goals:**
- Replace all remaining `<div class="stat-card">` with `<mat-card>` and `<mat-card-content>`
- Remove the now-dead `.stat-card` SCSS rules
- Ensure dark mode and theming works via the existing global MDC token overrides in `styles.scss`

**Non-Goals:**
- Changing the stat card layout (icon + value + label grid stays as-is)
- Modifying any other component or page
- Redesigning the visual appearance of the stat cards

## Decisions

**Use `mat-card` with inner `mat-card-content`** rather than a flat `mat-card` with custom padding.
Rationale: Consistent with every other card already migrated; `mat-card-content` provides the standard 16px inset expected by the design system.

**Keep inner content structure unchanged.**
The icon, value, and label elements inside each stat card remain exactly the same — only the wrapper element and its class change.

**Remove `.stat-card` SCSS** once replaced.
Dead styles add noise; the global `mat-mdc-card` overrides in `styles.scss` already handle elevation, border-radius, and background.

## Risks / Trade-offs

- [Minimal visual shift in padding/spacing] → Inspect after implementation; adjust inner padding via `mat-card-content` override if needed.
- [Breaking spec tests that reference `.stat-card`] → No existing tests target `.stat-card`; risk is negligible.
