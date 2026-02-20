## ADDED Requirements

### Requirement: Widget header style

A `.widget-header` utility class SHALL provide the DocClinic-style orange section title styling.

#### Scenario: Widget header appearance

- **WHEN** an element has class `widget-header`
- **THEN** it has background `var(--color-highlight)` (#e58d34 orange)
- **AND** text color is white
- **AND** padding is `10px 15px`

#### Scenario: btn-secondary defined

- **WHEN** an element has class `btn btn-secondary`
- **THEN** it renders with a visible background using `var(--color-text-secondary)`
- **AND** white text
