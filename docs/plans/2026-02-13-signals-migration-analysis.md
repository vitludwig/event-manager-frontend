# Signals Migration Analysis

## Already migrated
- `ProgramService` - WritableSignals for events, places, days, selectedDay
- `FullProgramComponent` - computed signals for days, filteredEvents, allSegments, eventsByPlaces, places
- `NotificationsComponent` - computed for eventsById
- `ProgramVerticalListComponent` - computed for placesById, groupEvents
- `MapComponent` - rxResource for maps, competitionsInfo, tribesInfo
- `CompetitionsInfoComponent` / `TribesInfoComponent` - input signals

---

## 1. SettingsService (HIGH - has existing TODO)

**File:** `src/app/common/services/settings/settings.service.ts`

**Problem:** Leaking subscription, mutable property, existing TODO comment says "rewrite to signals".
```typescript
public device: EDisplayDevice = EDisplayDevice.BASIC;

public determineDisplayDevice() {
  this.route.queryParams.subscribe((param) => {  // never unsubscribed
    this.device = param['display'] ?? EDisplayDevice.BASIC;
  })
}
```

**Fix:** Replace with `toSignal()`. Remove imperative `determineDisplayDevice()` call.
```typescript
readonly device = toSignal(
  this.route.queryParams.pipe(map(p => p['display'] ?? EDisplayDevice.BASIC)),
  { initialValue: EDisplayDevice.BASIC }
);
```

**Impact:** Consumers read `settingsService.device` - after migration they read `settingsService.device()`. Affects:
- `AppComponent` (lines 40, 24)
- `FullProgramComponent` template

---

## 2. AppComponent (HIGH - memory leaks)

**File:** `src/app/app.component.ts`

**Problems:**
- `router.events.subscribe()` (line 50) - never unsubscribed, leaks
- `setInterval()` in `handleLocalNotifications` (line 97) - never cleared, leaks
- Imperative `settingsService.determineDisplayDevice()` call goes away once SettingsService uses signals

**Fix:**
- Router subscription: use `takeUntilDestroyed()` from `@angular/core/rxjs-interop`
- Notification interval: use `DestroyRef.onDestroy()` to clear interval
- Remove `determineDisplayDevice()` call after SettingsService migration

---

## 3. ListTimelineComponent (MEDIUM - memory leak)

**File:** `src/app/modules/program/components/full-program/components/list-timeline/list-timeline.component.ts`

**Problem:** `setInterval()` in constructor (line 29) never cleaned up - leaks on every navigation.
```typescript
constructor() {
  setInterval(() => {
    this.setRoundedNow();
    // ...
  }, 300000);
}
```
Also: `segments` and `parentContainer` use `@Input()` decorator instead of `input()` signal.

**Fix:**
- Store interval ID + clear in `DestroyRef.onDestroy()`
- Convert `@Input()` to `input()` signal functions
- Convert `timeNow` / `segmentNowLeft` to signals

---

## 4. QrScannerComponent (MEDIUM - Subject+takeUntil pattern)

**File:** `src/app/common/components/qr-scanner/qr-scanner.component.ts`

**Problems:**
- `destroy: Subject<void>` + `takeUntil` + `OnDestroy` pattern (lines 45, 64, 72-78)
- `setInterval` with manual cleanup (lines 56, 68, 73-75)
- Mutable `cameraNotFound` property

**Fix:**
- Replace `destroy` Subject with `takeUntilDestroyed()`
- Use `DestroyRef.onDestroy()` for interval cleanup
- Convert `cameraNotFound` to `signal<boolean>(false)`
- Convert `@Output() scanned` to `output<string>()`

---

## 5. UserInfoComponent (MEDIUM - leak + subscription)

**File:** `src/app/common/components/user-info/user-info.component.ts`

**Problems:**
- `dialog.afterClosed().subscribe()` (line 50) - never unsubscribed (one-shot so technically OK, but pattern is inconsistent)
- `setInterval()` in ngOnInit (line 28) - never cleared, leaks
- Mutable `userInfo` property

**Fix:**
- Clear interval via `DestroyRef.onDestroy()`
- Convert `userInfo` to `signal<IUserInfo | undefined>(undefined)`

---

## 6. ProgramVerticalListDialogComponent (LOW - imperative filtering)

**File:** `src/app/modules/program/components/program-vertical-list/components/program-vertical-list-dialog/program-vertical-list-dialog.component.ts`

**Problem:** `filteredEvents`, `search`, `onlyFavorite` are plain mutable properties. Filtering is done imperatively in `searchEvents()` and `toggleFavorite()`.

**Fix:** Convert to signals + computed:
```typescript
search = signal('');
onlyFavorite = signal(false);
filteredEvents = computed(() => {
  let events = this.data.events;
  if (this.onlyFavorite()) events = events.filter(e => e.favorite);
  const s = this.search();
  if (s) events = events.filter(e => /* match */);
  return events;
});
```

---

## 7. EventDetailFullComponent (LOW - unnecessary OnInit)

**File:** `src/app/modules/program/components/event-detail-full/event-detail-full.component.ts`

**Problem:** `ngOnInit` just copies dialog data to local properties. `loading` flag wraps synchronous code.

**Fix:** Remove `OnInit`, assign directly from injected data. Remove `loading` (it's always false - the try/catch wraps synchronous assignment).

---

## 8. ListFilterComponent (LOW - plain properties)

**File:** `src/app/modules/program/components/full-program/components/list-filter/list-filter.component.ts`

**Problem:** All filter state is plain mutable properties populated in `ngOnInit` from dialog data.

**Fix:** Minor - could initialize properties directly from injected data, remove `OnInit`. Not urgent since this is a dialog with short lifecycle.

---

## Migration order

| # | Target | Severity | Effort | Reason |
|---|--------|----------|--------|--------|
| 1 | SettingsService | HIGH | Small | Has TODO, leaking subscription, blocks AppComponent cleanup |
| 2 | AppComponent | HIGH | Small | Memory leaks from subscription + interval |
| 3 | ListTimelineComponent | MEDIUM | Small | Memory leak from interval |
| 4 | QrScannerComponent | MEDIUM | Medium | Subject+takeUntil pattern, interval leak |
| 5 | UserInfoComponent | MEDIUM | Small | Interval leak |
| 6 | ProgramVerticalListDialogComponent | LOW | Small | Code quality - computed filtering |
| 7 | EventDetailFullComponent | LOW | Tiny | Remove dead code |
| 8 | ListFilterComponent | LOW | Tiny | Remove unnecessary OnInit |
