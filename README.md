# EventProgram

Mobile-first festival guide for the RZB events. It shows the
festival program on an interactive timeline grid, festival maps, favorites, push and
local notifications, and a QR-based user wallet. Program data is loaded from the
backend over HTTP and kept up to date in real time via socket.io.

Built with **Angular 21** (standalone components + signals, Angular Material M3) and
shipped in three forms:

- **PWA** — installable web app with a service worker (production build only)
- **Android** and **iOS** — native wrappers via **Capacitor 7**

App ID: `cz.rzbit.eventApp` · UI languages: CS / EN (`@ngx-translate`)

## Getting started

### Prerequisites

- Node.js 20+ (developed on 24) and npm
- For native builds: Android Studio (Android) / Xcode + CocoaPods (iOS)
- For unit tests: a local Chrome binary

### Install

```bash
npm install
```

### Development server

```bash
npm start          # ng serve → http://localhost:4200/
```

The dev server proxies `/public/**` and `/socket.io/**` to `http://localhost:3000`
(see `src/proxy.conf.json`). The backend base URL itself comes from the environment
files in `src/environments/`:

| Configuration | Environment file | API URL |
|---|---|---|
| `development` | `environment.development.ts` | `http://localhost:3001` |
| `development-android` / `development-ios` | `environment.development.{android,ios}.ts` | hosted API |
| `production` (default) | `environment.ts` | `https://event-planner.rzbit.cz/api` |

### Build

```bash
npm run build          # production build → dist/event-program/browser
npm run build:mobile   # production build used for native releases
```

Only the production configuration enables the service worker (`ngsw-config.json`),
so PWA behaviour has to be verified on a production build.

### Native (Capacitor)

```bash
npm run android        # dev build + cap sync + open Android Studio
npm run ios            # dev build + cap sync + open Xcode
npm run android:prod   # same, from the production build
npm run ios:prod
```

`npx cap sync` copies `dist/event-program/browser` into the `android/` and `ios/`
projects; the app is then built and run from Android Studio / Xcode.

### Tests and lint

```bash
npm test           # Karma + Jasmine, single run (expects CHROME_BIN)
npm run test:e2e   # Playwright, against http://localhost:4200
npm run lint       # ESLint
```

## Notes

### Generating PWA icons
- https://pwa-icon-generator.vercel.app/
- https://github.com/pverhaert/ngx-pwa-icons

### Generating m3 scheme
- `ng generate @angular/material:m3-theme`

### Further reading
- `docs/app-analysis.md` — detailed architecture overview
