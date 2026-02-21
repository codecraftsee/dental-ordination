## 1. Sidebar & Layout

- [x] 1.1 `app.scss` — single column grid on mobile, overlay backdrop styles
- [x] 1.2 `sidebar.scss` — fixed overlay, transform-based show/hide on mobile, hide collapse button
- [x] 1.3 `sidebar.ts` — init collapsed on mobile (ignore localStorage)
- [x] 1.4 `app.ts` — close sidebar on NavigationEnd when on mobile
- [x] 1.5 `app.html` — add overlay backdrop div

## 2. Home Page

- [x] 2.1 `home.scss` — stats grid 2×2, actions stacked, reduced padding on mobile
- [x] 2.2 `home.html` — wrap recent visits table in `.table-scroll` div

## 3. Global

- [x] 3.1 `styles.scss` — `.container` removes padding on mobile
- [x] 3.2 `styles.scss` — `.form-row` single column on mobile
- [x] 3.3 `styles.scss` — `.page-header` stack on mobile
- [x] 3.4 `styles.scss` — `.detail-grid` single column on mobile
- [x] 3.5 `styles.scss` — `.form-actions` wrap on mobile

## 4. Verify

- [ ] 4.1 Test on Galaxy S8 (360px) — no horizontal overflow on any page
- [ ] 4.2 Sidebar opens/closes as overlay, backdrop works
- [ ] 4.3 Home page: 2×2 stats, stacked buttons, table scrolls horizontally
- [ ] 4.4 Run `ng build` — no compilation errors
