## ADDED Requirements

### Requirement: Dark mode color palette

The app SHALL provide a complete dark palette via `[data-theme="dark"]` CSS overrides on `<html>`.

#### Scenario: Dark background applied

- **WHEN** `data-theme="dark"` is set on `<html>`
- **THEN** `--color-background` resolves to `#1A1D23`
- **AND** `--color-surface` resolves to `#242830`
- **AND** `--color-text` resolves to `#E9ECEF`

#### Scenario: Brand colors softened for dark mode

- **WHEN** `data-theme="dark"` is set on `<html>`
- **THEN** `--color-primary` resolves to `#5D8AA8` (readable on dark surfaces)
- **AND** `--color-accent` resolves to `#F5B942` (slightly lighter gold)

#### Scenario: All components reflect dark palette without code changes

- **WHEN** dark mode is active
- **THEN** navbar, cards, forms, tables, badges, and buttons all use dark palette tokens
- **AND** no component SCSS files require modification
