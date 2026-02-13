# Event Manager Frontend - Application Analysis

## Overview

A festival/event management mobile-first PWA built with **Angular 21** and **Capacitor 7** for native Android/iOS builds. The app displays event programs, interactive maps, notifications, and user wallet info (QR-based). It connects to a .NET backend via SignalR websockets for real-time event updates.

**App ID:** `cz.rzbit.eventApp` ("RZB Festival App")
**Current branch:** `mobile-app` (main: `master`)

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Angular 21 (standalone components) |
| UI Library | Angular Material 21 |
| Mobile | Capacitor 7 (Android + iOS) |
| State | Angular Signals (`signal()`, `computed()`, `toSignal()`, `rxResource()`) |
| i18n | `@ngx-translate/core` (CS/EN) |
| Realtime | `@microsoft/signalr` |
| Date | `dayjs` |
| QR Codes | `@zxing/ngx-scanner` (scan), `ng-qrcode` (generate) |
| Push | OneSignal (`onesignal-cordova-plugin`) |
| Testing | Karma + Jasmine, ChromeHeadless |
| Styling | SCSS, Angular Material theming |

---

## Project Structure

```
src/app/
├── app.component.ts          # Root - NOT standalone (uses standalone: false)
├── app.module.ts              # Root NgModule (still exists)
├── app-routing.module.ts      # Lazy-loaded routes via loadComponent()
│
├── common/
│   ├── components/
│   │   ├── language-menu/     # CS/EN language switcher
│   │   ├── qr-scanner/        # Reusable ZXing QR scanner with camera selection
│   │   └── user-info/         # Wallet info widget + detail dialog + scanner dialog
│   ├── decorators/
│   ├── directives/
│   ├── pipes/
│   ├── services/
│   │   ├── init/              # App initialization
│   │   ├── permissions/       # Capacitor camera permissions
│   │   ├── settings/          # Display device from query params (signal)
│   │   ├── theme/             # Dynamic theme loading from backend
│   │   └── user/              # Wallet user service
│   ├── types/
│   │   ├── EDisplayDevice.ts  # BASIC | INFO_PANEL
│   │   └── ERoute.ts          # PROGRAM | EVENT_DETAIL | NOTIFICATIONS | MAP
│   └── utils/
│
├── modules/
│   ├── layout/
│   │   └── components/
│   │       └── bottom-menu/   # Navigation bar (hidden in INFO_PANEL mode)
│   ├── map/
│   │   ├── map.component.ts   # Festival map, competitions info, tribes info (rxResource)
│   │   ├── services/map.service.ts
│   │   └── components/
│   │       ├── competitions-info/  # Accepts data via input()
│   │       └── tribes-info/        # Accepts data via input()
│   ├── notifications/
│   │   ├── notifications.component.ts
│   │   └── services/notification/  # Push + local notifications
│   └── program/               # THE CORE MODULE
│       ├── program.component.ts    # Tab container (full-program + vertical-list)
│       ├── services/
│       │   ├── event/event.service.ts     # SignalR websocket + HTTP
│       │   └── program/program.service.ts # Central state manager
│       ├── types/
│       │   ├── IEvent.ts
│       │   ├── IProgramPlace.ts   # Also has IProgramEvent (extends IEvent with segments)
│       │   ├── IEventType.ts
│       │   └── IEventTag.ts
│       ├── pipes/
│       │   └── translate-event-property/  # Translates name vs name_EN based on locale
│       └── components/
│           ├── full-program/      # Grid/timeline view of events
│           │   ├── full-program.component.ts  # Heavy computed signals
│           │   └── components/
│           │       ├── list-event/            # Single event cell in grid
│           │       ├── list-filter/           # Filter dialog
│           │       ├── list-timeline/         # Time axis with auto-scroll
│           │       └── event-detail-preview/  # Bottom sheet preview
│           ├── event-detail-full/   # Full event detail (dialog or routed)
│           ├── event-tags/          # Tag chips for an event
│           ├── export-favorites/    # QR export/import of favorites
│           └── program-vertical-list/  # Alternative vertical list view
│               └── components/
│                   └── program-vertical-list-dialog/  # Search/filter dialog
```

---

## Key Architecture Patterns

### State Management via ProgramService

`ProgramService` is the central state manager (`providedIn: 'root'`). It holds:

- **Private WritableSignals:** `#events`, `#places`, `#days` — mutated internally
- **Public ReadonlySignals:** `events`, `places`, `days` — exposed via `.asReadonly()`
- **Public WritableSignal:** `selectedDay` — writable by components
- **Plain properties:** `eventTypes`, `tags`, `allPlaces`, `favorites` — not reactive (arrays)
- **LocalStorage caching:** events, places, favorites, filter options persisted to localStorage

Data flow:
1. `loadCachedData()` → loads from localStorage on startup
2. `initWebsocket()` → connects SignalR, fetches fresh data, subscribes to `newEvent`/`updateEvent`
3. `loadProgramData()` → sets signals, calls `autoSelectDay()`, loads favorites/types/tags
4. Components read via `computed()` signals derived from service signals

### Component Patterns

- **All feature components are standalone** (no NgModules except root `AppModule`)
- **Lazy-loaded routes** via `loadComponent()` in routing
- **`AppComponent` is NOT standalone** (`standalone: false`) — still declared in `AppModule`
- **Dialog-heavy UI** — many features open as `MatDialog` or `MatBottomSheet`
- **Two display modes:** `BASIC` (mobile) and `INFO_PANEL` (kiosk display) controlled via `?display=info-panel` query param

### Signal Patterns (Post-Migration)

- `signal()` for local mutable state (e.g., `cameraNotFound`, `userInfo`, `search`, `onlyFavorite`)
- `computed()` for derived state (e.g., `filteredEvents`, `places`, `allSegments` in full-program)
- `toSignal()` for converting observables (e.g., `SettingsService.device` from route query params)
- `rxResource()` for HTTP-fetched data with loading/error states (e.g., maps, competitions, tribes)
- `input()` / `input.required()` for component inputs as signals
- `DestroyRef.onDestroy()` for interval cleanup (replaces `OnDestroy` + `clearInterval`)
- `takeUntilDestroyed()` for subscription cleanup (replaces `Subject` + `takeUntil` + `OnDestroy`)

### Bilingual Support

All user-facing entities have dual properties: `name` / `name_EN`, `description` / `description_EN`. The `TranslateEventPropertyPipe` selects the correct one based on current locale. App supports `cs` and `en`.

---

## Testing Conventions

- **Test runner:** Karma + Jasmine with `ChromeHeadlessNoSandbox`
- **Run command:** `CHROME_BIN=/opt/google/chrome/google-chrome npx ng test --no-watch`
- **131 tests** total, all passing
- **Standalone components** use `imports: [Component]` in TestBed (not `declarations`)
- **Services mocked** with plain objects matching the signal/method interface:
  ```typescript
  const mockProgramService = {
    events: signal([]),
    places: signal([]),
    days: signal({}),
    selectedDay: signal(undefined),
  };
  ```
- **`fakeAsync` + `tick()`** for async code testing (timers, promises)
- **`NoopAnimationsModule`** needed for components using Angular Material animations
- **`TranslateModule.forRoot()`** needed for any component importing `TranslateModule`
- **Signal inputs** set via `fixture.componentRef.setInput('name', value)`
- **`@Input()` decorators** set via `component.property = value` directly
- **Protected/private access** via `(component as any).propertyName`

### Common Test Pitfalls

| Issue | Solution |
|---|---|
| `NG0201: No provider for TranslateService` | Add `TranslateModule.forRoot()` to imports |
| `NG0201: No provider for MAT_DIALOG_DATA` | Provide `{provide: MAT_DIALOG_DATA, useValue: {...}}` |
| `NG0303: Can't set input` | Check if `input()` vs `@Input()` — use `setInput()` for signal inputs |
| Standalone in `declarations` | Use `imports: [Component]` not `declarations` |
| `NG0101: recursive ApplicationRef.tick` | Don't write signals inside `effect()` — move logic to imperative code |
| DatePipe invalid date | `lastChecked` must be ISO string, not `"12:00"` |
| `rxResource` `loader` not found | Angular 21 uses `stream` property, not `loader` |
| `clearInterval` spy not called | Ensure the code path that creates the interval actually runs |

---

## Environment Configuration

- **Production:** `https://program.rusthaven.cz` (API + SignalR)
- **Dev:** proxy via `proxy.conf.json`
- **Dev Android/iOS:** separate environment files with Capacitor-specific URLs
- **Backend API:** `/api/v1/` prefix
- **Public assets:** `/public/` (themes, JSON configs, maps loaded dynamically from backend)
- **Theme:** loaded dynamically from `/public/themes/` (logo, colors)

---

## Build & Deploy

```bash
npm start              # Dev server
npm run build          # Production build
npm run android        # Build + sync + open Android Studio
npm run ios            # Build + sync + open Xcode
npm test               # Run tests (Karma)
```

---

## Key Files Quick Reference

| Purpose | File |
|---|---|
| Root component | `src/app/app.component.ts` (standalone: false) |
| Root module | `src/app/app.module.ts` |
| Routing | `src/app/app-routing.module.ts` |
| Central state | `src/app/modules/program/services/program/program.service.ts` |
| WebSocket service | `src/app/modules/program/services/event/event.service.ts` |
| Main program view | `src/app/modules/program/components/full-program/full-program.component.ts` |
| Settings (display mode) | `src/app/common/services/settings/settings.service.ts` |
| Theme loading | `src/app/common/services/theme/theme.service.ts` |
| Capacitor config | `capacitor.config.ts` |
| Angular config | `angular.json` |
| Environments | `src/environments/environment*.ts` |

---

## Known Technical Debt / Notes

1. **AppComponent is `standalone: false`** — still uses root NgModule pattern while all other components are standalone
2. **ProgramService mixes signals and plain properties** — `eventTypes`, `tags`, `allPlaces`, `favorites` are plain arrays, not signals. Only `events`, `places`, `days`, `selectedDay` are signals.
3. **LocalStorage as primary cache** — events, places, favorites, filter options all cached in localStorage with a `appEventId` invalidation mechanism
4. **`@ts-ignore` in ProgramService** — `updateEvent()` uses ts-ignore for dynamic property assignment
5. **Event times use string dates** — `start`/`end` are ISO strings parsed with dayjs throughout
6. **`short-uuid` used for QR favorites export** — compresses UUIDs for shorter QR codes
7. **OneSignal integration** — push notifications via OneSignal SDK (web + native)
8. **SignalR reconnection** — handled by `EventService`, not visible in `ProgramService`
