# Event Manager Frontend - Application Analysis

## Overview

A festival guide mobile-first PWA built with **Angular 21** and **Capacitor 7** for native Android/iOS builds. The app displays event programs on an interactive timeline grid, festival maps, push notifications, and user wallet info (QR-based). It connects to a .NET backend via SignalR websockets for real-time event updates.

**App ID:** `cz.rzbit.eventApp` ("RZB Festival App")
**Version:** 1.2.3 (versionCode 6)
**Festivals:** Roztočfest, Rusthaven (post-apocalyptic themed)

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| UI Library | Angular Material 21 (M3 dark theme) |
| Mobile | Capacitor 7 (Android + iOS) |
| State | Angular Signals (`signal()`, `computed()`, `toSignal()`, `rxResource()`) |
| i18n | `@ngx-translate/core` (CS/EN) |
| Realtime | `@microsoft/signalr` |
| Date | `dayjs` |
| QR Codes | `@zxing/ngx-scanner` (scan), `ng-qrcode` (generate) |
| Push | OneSignal (`onesignal-cordova-plugin`) |
| Maps | `@meddv/ngx-pinch-zoom` (pinch-to-zoom on map images) |
| Testing | Karma + Jasmine (unit), Playwright (e2e) |
| Styling | SCSS, Angular Material M3 theming, dynamic theme loading |

---

## Project Structure

```
src/app/
├── app.component.ts          # Root - NOT standalone (uses standalone: false)
├── app.module.ts              # Root NgModule (still exists)
├── app-routing.module.ts      # 4 lazy-loaded routes via loadComponent()
├── app-initializer.factory.ts # APP_INITIALIZER — loads theme + cached data
│
├── common/
│   ├── components/
│   │   ├── language-menu/     # CS/EN language switcher (flag images, reloads page)
│   │   ├── qr-scanner/        # Reusable ZXing QR scanner with camera selection
│   │   └── user-info/         # Wallet info widget + detail dialog + scanner dialog
│   │       └── components/
│   │           ├── user-info-detail/    # Balance display + transaction list
│   │           └── user-info-scanner/   # QR scan + manual code entry
│   ├── decorators/debounce.ts
│   ├── directives/auto-uppercase.directive.ts
│   ├── pipes/
│   │   ├── ellipsis/              # Truncates text with "…" (conditional)
│   │   ├── truncate/              # Always truncates
│   │   └── string-to-json/        # Safe JSON.parse
│   ├── services/
│   │   ├── init/              # Boots themeService + programService
│   │   ├── permissions/       # Capacitor camera + local notifications permissions
│   │   ├── settings/          # Reads ?display= query param as Signal
│   │   ├── theme/             # Fetches CSS bundle from backend at runtime
│   │   └── user/              # Wallet token/userId in localStorage
│   ├── types/
│   │   ├── EDisplayDevice.ts  # BASIC | INFO_PANEL
│   │   ├── EFestivalID.ts     # ROZTOCFEST | RUSTHAVEN
│   │   └── ERoute.ts          # program | event-detail | notifications | map | afq
│   └── utils/Utils.ts         # Czech diacritic stripping for search
│
└── modules/
    ├── layout/
    │   └── components/bottom-menu/  # Bottom navigation bar (4 tabs)
    ├── map/
    │   ├── map.component.ts         # Festival maps + competitions + tribes (rxResource)
    │   ├── services/map.service.ts  # HTTP fetch with shareReplay(1)
    │   └── components/
    │       ├── competitions-info/   # Opening hours list
    │       └── tribes-info/         # Expandable panels with tribe details
    ├── notifications/
    │   ├── notifications.component.ts
    │   └── services/notification/   # Push (OneSignal) + local notifications
    └── program/                     # === CORE MODULE ===
        ├── program.component.ts     # Tab container (full-program + vertical-list)
        ├── services/
        │   ├── event/event.service.ts      # SignalR WebSocket + HTTP
        │   └── program/program.service.ts  # Central state manager (signals)
        ├── types/
        │   ├── IEvent.ts
        │   ├── IProgramPlace.ts    # Also has IProgramEvent (extends IEvent with segments)
        │   ├── IEventType.ts
        │   └── IEventTag.ts
        ├── pipes/
        │   └── translate-event-property/  # Selects name vs name_EN by locale
        └── components/
            ├── full-program/        # Timeline grid view (the main view)
            │   ├── full-program.component.ts  # Heavy computed signals
            │   └── components/
            │       ├── list-event/            # Single event cell in grid
            │       ├── list-filter/           # Filter dialog (place, type, tags)
            │       ├── list-timeline/         # Time axis with auto-scroll
            │       ├── list-day-select/       # Day toggle buttons
            │       ├── list-place/            # Place (stage) label column
            │       └── event-detail-preview/  # Bottom sheet preview
            ├── event-detail-full/   # Full event detail (full-screen dialog or route)
            ├── event-tags/          # Tag chips
            ├── export-favorites/    # QR export/import of favorites
            └── program-vertical-list/  # Alternative list view with search
                └── components/
                    └── program-vertical-list-dialog/  # Searchable event list dialog
```

---

## Key Architecture Patterns

### State Management via ProgramService

`ProgramService` (`providedIn: 'root'`) is the central state manager:

- **Private WritableSignals:** `#events`, `#places`, `#days` — mutated internally
- **Public ReadonlySignals:** `events`, `places`, `days` — exposed via `.asReadonly()`
- **Public WritableSignal:** `selectedDay` — writable by components
- **Plain properties:** `eventTypes`, `tags`, `allPlaces`, `favorites` — NOT reactive (arrays)
- **LocalStorage caching:** events, places, favorites, filter options persisted

Data flow:
1. `APP_INITIALIZER` → `InitService.init()` → loads theme CSS + cached data from localStorage
2. `AppComponent.ngOnInit()` → `ProgramService.initWebsocket()` → SignalR connection
3. SignalR fetches fresh events/places, HTTP fetches eventTypes/tags
4. `newEvent`/`updateEvent` handlers update signals in real-time
5. Components read via `computed()` signals derived from service signals

### SignalR WebSocket

- Hub URL: `/signalr/events`
- Reconnection: `[0, 2000, 5000, 10000, 30000]` ms
- Methods: `getEvents()`, `getPlaces()` (invoked, not HTTP)
- Subscriptions: `newEvent`, `updateEvent` (real-time updates)
- On reconnect: full program data reload

### Timeline Grid (Core UI)

The timeline grid is the most complex piece:
- Events rendered as colored buttons spanning N × 15-minute segments
- Grid CSS: sticky time axis, horizontal scroll, current-time gold marker
- Segment width: 45px, configurable
- Midnight-spanning events: 6 AM threshold configurable
- Custom pinch-to-zoom via `CSS zoom` property (range 0.4–1.0)
- Auto-scroll to current time on load

### Two Display Modes

- **BASIC** (default): Mobile app layout with bottom tab bar
- **INFO_PANEL**: Kiosk/TV display — reversed layout, text labels on nav, `?display=info-panel` query param

### Bilingual Support

All entities have dual properties: `name`/`name_EN`, `description`/`description_EN`. `TranslateEventPropertyPipe` selects by locale. Supports `cs` and `en`.

---

## Capacitor Native Features

| Plugin | Usage |
|---|---|
| `@capacitor/app` | Hardware back button handling (dialog close → navigate back → exit) |
| `@capacitor/camera` | Camera permissions for QR scanner |
| `@capacitor/local-notifications` | Scheduled 10min-before-event reminders for favorites |
| `@capacitor/status-bar` | Listed but not actively configured in code |
| `onesignal-cordova-plugin` | Push notifications (web + native) |

### PWA

- `@angular/service-worker` with `ngsw-config.json`
- `manifest.webmanifest`: standalone display, theme `#fecc00`, 7 icon sizes
- Offline: app shell prefetched, assets lazy-cached

---

## Testing

### Unit Tests (Karma + Jasmine)
- **131 tests**, all passing
- **26 spec files** covering all components, services, pipes, directives
- Run: `npm test` (ChromeHeadless)
- Patterns: `MockProgramService` with signal stubs, `fakeAsync`+`tick()`, `HttpTestingController`

### E2E Tests (Playwright)
- `program.spec.ts`: day switching, filters (place, type, tags, favorites)
- `map-zoom-pan.spec.ts`: pinch zoom, touch pan, CSS touch-action regression
- Uses route interception + localStorage mocking + CDP for touch events

---

## Environment Configuration

| Config | API URL |
|---|---|
| Production | `https://program.rusthaven.cz` |
| Development | Proxy via `proxy.conf.json` to rusthaven.cz |
| Dev Android | Same as dev (bug — should be local IP) |
| Dev iOS | `http://192.168.0.133:8080` |

---

## Key Files Quick Reference

| Purpose | File |
|---|---|
| Root component | `src/app/app.component.ts` |
| Root module | `src/app/app.module.ts` |
| Routing | `src/app/app-routing.module.ts` |
| Central state | `src/app/modules/program/services/program/program.service.ts` |
| WebSocket | `src/app/modules/program/services/event/event.service.ts` |
| Timeline grid | `src/app/modules/program/components/full-program/full-program.component.ts` |
| Capacitor config | `capacitor.config.ts` |
| Environments | `src/environments/environment*.ts` |
| Theme service | `src/app/common/services/theme/theme.service.ts` |
| Notification svc | `src/app/modules/notifications/services/notification/notification.service.ts` |

---

## Known Technical Debt

1. **AppComponent `standalone: false`** — only component still using NgModule pattern
2. **ProgramService mixes signals and plain arrays** — `eventTypes`, `tags`, `favorites` are not reactive
3. **`ERoute.FAQ = 'afq'`** — typo (should be `'faq'`)
4. **Duplicate `localStorage.setItem('places')`** in `loadProgramData` (copy-paste bug)
5. **Hardcoded Czech** in local notification text (not using `ngx-translate`)
6. **`@ts-ignore`** in `program-vertical-list.component.ts` and `ProgramService.updateEvent()`
7. **Language switch reloads page** instead of reactive translation update
8. **OneSignal API key exposed** in frontend environment files
9. **Hardcoded tribe schedule HTML** (160 lines) in `tribes-info.component.html` — should be backend data
10. **`notification.worker.js`** entirely commented out — dead file
11. **`environment.development.android.ts`** identical to dev — not pointing to local IP
12. **`@capacitor/status-bar`** installed but not configured
13. **Mixed `@Input()` vs `input()`** patterns across components
