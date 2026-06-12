# Spec: Oblíbené jako routa + oddělení od vyhledávání

**Datum:** 2026-06-13
**Repo:** event-manager-frontend (mobilní app)
**Status:** Schváleno

## Cíl

Rozdělit dnešní jednu „search" obrazovku (která hledá ve všech akcích **a** má
přepínač „jen oblíbené") na **dvě jasná tlačítka**:

1. **Oblíbené** — nová **routovaná stránka** (tab ve spodním menu jako
   Program/Mapa/Notifikace), defaultně zobrazí jen oblíbené akce; textové pole
   filtruje mezi oblíbenými.
2. **Hledat** — stávající fullscreen **dialog** (🔍 v toolbaru Programu), ze
   kterého **zmizí přepínač oblíbených** a hledá ve všech akcích.

Společné jádro (vyhledávací pole + filtr + seznam) se vytáhne do jedné sdílené
komponenty, kterou hostí oba vstupní body.

## Kontext (současný stav)

- Search je `ProgramVerticalListDialogComponent` (MatDialog, `panelClass: 'full-overlay'`),
  otevíraný z `FullProgramComponent.showEventList()` s `data: { events: allEvents }`.
  Header dialogu = back tlačítko (`keyboard_backspace`, `mat-dialog-close`) +
  search input + přepínač srdíčka. Pak `app-program-vertical-list` + empty-hláška.
- Filtr: `search` signál + `onlyFavorite` signál (seedovaný z
  `programService.userFilterOptions.onlyFavorite`) → `filteredEvents` computed
  (favorite filtr → text filtr přes `Utils.replaceCzechAccentSymbols`, hledá v `nameCs`).
- `ProgramService.allEvents` je getter nad polem `#allEvents` (ne signál).
  `events` signál jsou *filtrované* eventy programu (ne vhodné pro oblíbené).
  `eventsLoading` je signál → na něj se navěsí reaktivita stránky Oblíbené.
- Bottom menu: Program / Mapa / Notifikace / (konfigurovatelné). Search v bottom
  menu není (je to toolbar ikona).
- Routy: `app-routing.module.ts`, `ERoute` enum; lazy `loadComponent` stránky.

## Návrh

### Sdílená komponenta `EventSearchListComponent` (nová)

Standalone, v program modulu (vedle `program-vertical-list`). Dialog-agnostická.

**Vstupy (signal inputs):**
- `events: IProgramEvent[]` — zdrojové akce (default `[]`).
- `onlyFavorite: boolean` — default `false`; když `true`, filtruje na `event.favorite`.
- `showBackBtn: boolean` — default `false`; když `true`, zobrazí back tlačítko
  **inline před** search inputem (NE nad ním).
- `emptyTitle: string`, `emptySubtitle: string` — texty empty-stavu (translation
  klíče); defaulty = stávající search hlášky.

**Výstup:** `back: EventEmitter<void>` — emituje při kliku na back tlačítko.

**Stav/šablona:** vlastní `search` signál; `filteredEvents` computed
(`onlyFavorite` filtr → text filtr, stejná logika jako dnes). Šablona:
header (řádek: `@if(showBackBtn()) { <back btn (click)="back.emit()"> }` + search
input inline) + `app-program-vertical-list [events]="filteredEvents()"` +
empty-stav (`emptyTitle`/`emptySubtitle`) když `filteredEvents().length === 0`.

> Back tlačítko zůstává v jednom řádku se search inputem (zachová vzhled dnešního
> dialogu). Akce zavření řeší host přes `(back)`, ne `mat-dialog-close` uvnitř
> sdílené komponenty.

### Search dialog `ProgramVerticalListDialogComponent` (úprava)

Ztenčí se na obal nad sdílenou komponentou:
- Šablona: `<app-event-search-list [events]="data.events" [onlyFavorite]="false"
  [showBackBtn]="true" (back)="close()">`.
- `close()` → `MatDialogRef.close()` (injektovat `MatDialogRef`).
- **Odebrat:** přepínač srdíčka + `toggleFavorite()` + `onlyFavorite` signál +
  seedování z `userFilterOptions` + vlastní `search`/`filteredEvents` (přesunuto do
  sdílené komponenty).
- Chování searche beze změny (jen bez srdíčka): hledá ve všech `allEvents`.

### Stránka Oblíbené `FavoritesComponent` (nová routa)

- Nový modul `src/app/modules/favorites/favorites.component.{ts,html,scss}`.
- `events = computed(() => { this.programService.eventsLoading(); return this.programService.allEvents; })`
  — reaktivně se naplní po načtení programu.
- Šablona: `<app-event-search-list [events]="events()" [onlyFavorite]="true"
  [emptyTitle]="'Zatím žádné oblíbené'" [emptySubtitle]="'Označ si akce srdíčkem v programu'">`
  (bez `showBackBtn` → default `false`, žádný back; je to tab, spodní menu zůstává).

### Routing / ERoute / i18n

- `ERoute.FAVORITES = 'favorites'`.
- `app-routing.module.ts`: `{ path: ERoute.FAVORITES, loadComponent: () =>
  import('./modules/favorites/favorites.component').then(c => c.FavoritesComponent) }`.
- i18n: `Oblíbené` → `Favorites` (en.json); cs použije klíč.

### Bottom menu (úprava)

Nové tlačítko **Oblíbené** za Notifikace, před konfigurovatelným:
- `[routerLink]="ERoute.FAVORITES"` + `routerLinkActive="bottom-menu__button--active"`
  (plnohodnotný tab se zvýrazněním, jako ostatní), ikona `favorite`, label
  `{{ 'Oblíbené' | translate }}` ve struktuře `.bottom-menu__inner` (jako ostatní).

## Data flow

- Tap **Oblíbené** (bottom menu) → router `/favorites` → `FavoritesComponent` →
  `EventSearchListComponent(onlyFavorite=true)` → jen oblíbené; text filtruje mezi nimi.
- Tap **🔍** (toolbar) → `ProgramVerticalListDialogComponent` →
  `EventSearchListComponent(onlyFavorite=false, showBackBtn=true)` → hledá ve všech,
  back zavře dialog.

## Dotčené soubory

- **Nový** `…/program/components/program-vertical-list/event-search-list/event-search-list.component.{ts,html,scss}` (+ `.spec.ts`)
- `…/program-vertical-list-dialog/program-vertical-list-dialog.component.{ts,html}` — ztenčit, odebrat srdíčko, `(back)="close()"`
- **Nový** `…/modules/favorites/favorites.component.{ts,html,scss}` (+ `.spec.ts`)
- `…/common/types/ERoute.ts` — `FAVORITES`
- `…/app-routing.module.ts` — lazy route
- `…/layout/components/bottom-menu/bottom-menu.component.{html}` (+ spec) — tlačítko Oblíbené
- `src/assets/i18n/en.json` — `Oblíbené`

## Testy

- `EventSearchListComponent.filteredEvents`: `onlyFavorite=true` → jen oblíbené;
  `onlyFavorite=true` + text → jen oblíbené odpovídající textu; `onlyFavorite=false`
  + text → ve všech; prázdno → `[]`. `back` output emituje. `showBackBtn` ovládá
  zobrazení back tlačítka.
- `FavoritesComponent`: předává `allEvents` a `onlyFavorite=true`; po změně
  `eventsLoading` se `events()` přepočítá.
- `BottomMenuComponent`: má routerLink na `ERoute.FAVORITES`.
- `ProgramVerticalListDialogComponent`: už nemá srdíčko-přepínač; `(back)` zavře dialog.

## Mimo rozsah

- Vlastní titulek/toolbar stránky Oblíbené (identitu nese zvýrazněný tab).
- Live odebrání řádku z výpisu při odznačení oblíbeného během zobrazení (zachová se
  dnešní chování dialogu — položka zmizí až při dalším otevření/přepočtu).
- Hledání i v `nameEn`/popisu (zůstává `nameCs` jako dnes).
- Úklid `userFilterOptions.onlyFavorite`, pokud se po odebrání přepínače nikde
  nepoužívá (ověřit; jinak nechat být).

## Pozn. k vejití do lišty

S konfigurovatelným tlačítkem má bottom menu až 5 položek (Program/Mapa/Notifikace/
Oblíbené/konfig.). Na úzkém telefonu (~320px) jsou popisky těsné — řeší stávající
`min-width:0` + malý padding; případné zmenšení fontu popisku je možný follow-up,
ne součást tohoto specu.
