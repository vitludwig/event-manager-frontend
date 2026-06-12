# Oblíbené jako routa + oddělení od vyhledávání — Implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **Commity:** Pracovní strom má rozpracované necommitnuté změny z dřívějška
> (tag chipy, favorite badge, bottom-menu popisky). Tenhle plán **necommituje
> per-task** — seskupení commitů se domluví s uživatelem na konci (jinak by se
> bottom-menu změny smíchaly). Edituj, testuj, builduj normálně.

**Goal:** Rozdělit dnešní search dialog na dvě jasná tlačítka — **Oblíbené** jako
routovaný tab (jen oblíbené) a **Hledat** jako dialog bez filtru oblíbených — přes
jednu sdílenou komponentu `EventSearchListComponent`.

**Architecture:** Vytáhnout vyhledávání+filtr+seznam do standalone
`EventSearchListComponent` (signal inputy `events`/`onlyFavorite`/`showBackBtn`/
`emptyTitle`/`emptySubtitle`, output `back`). Search dialog ji hostí v módu „vše"
s back tlačítkem; nová routa `FavoritesComponent` ji hostí v módu „jen oblíbené"
bez backu, reaktivně přes `ProgramService.eventsLoading`.

**Tech Stack:** Angular 21 (standalone, signal inputs `input()`/`output()`,
`@if`), Angular Material, ngx-translate, Jasmine + Karma (`npm run test`).

---

## Struktura souborů

| Soubor | Odpovědnost | Akce |
|---|---|---|
| `…/program-vertical-list/components/event-search-list/event-search-list.component.{ts,html,scss,spec.ts}` | sdílené hledání+filtr+seznam | **vytvořit** |
| `…/program-vertical-list-dialog/program-vertical-list-dialog.component.{ts,html,scss}` | tenký dialog obal (search mód) | upravit |
| `…/program-vertical-list-dialog/program-vertical-list-dialog.component.spec.ts` | minimalizovat (přesun filteredEvents testů) | upravit |
| `src/app/modules/favorites/favorites.component.{ts,html,scss,spec.ts}` | routa Oblíbené (fav mód) | **vytvořit** |
| `src/app/common/types/ERoute.ts` | `FAVORITES` | upravit |
| `src/app/app-routing.module.ts` | lazy route | upravit |
| `src/assets/i18n/en.json` | `Oblíbené` | upravit |
| `…/layout/components/bottom-menu/bottom-menu.component.html` | tab Oblíbené | upravit |
| `…/layout/components/bottom-menu/bottom-menu.component.spec.ts` | test routy | upravit |

Zkratka cest:
`P = src/app/modules/program/components/program-vertical-list`

---

## Task 1: `ERoute.FAVORITES` + i18n klíč

**Files:**
- Modify: `src/app/common/types/ERoute.ts`
- Modify: `src/assets/i18n/en.json`

- [ ] **Step 1: Přidat hodnotu do ERoute**

V `src/app/common/types/ERoute.ts` přidej za `MAP = 'map',`:

```ts
	FAVORITES = 'favorites',
```

- [ ] **Step 2: Přidat i18n klíč**

V `src/assets/i18n/en.json` přidej (vedle `"Mapa"`/`"Notifikace"`) řádek:

```json
  "Oblíbené": "Favorites",
```

(Vlož ho jako další pár do objektu — dej pozor na čárky, ať zůstane validní JSON.)

- [ ] **Step 3: Ověřit build**

Run: `npm run build`
Expected: build projde (route na FavoritesComponent zatím nepřidáváme — přijde v Task 4).

---

## Task 2: Sdílená `EventSearchListComponent` (TDD)

**Files:**
- Create: `P/components/event-search-list/event-search-list.component.ts`
- Create: `P/components/event-search-list/event-search-list.component.html`
- Create: `P/components/event-search-list/event-search-list.component.scss`
- Test: `P/components/event-search-list/event-search-list.component.spec.ts`

- [ ] **Step 1: Napsat padající test**

Vytvoř `…/event-search-list/event-search-list.component.spec.ts`:

```ts
import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogModule} from '@angular/material/dialog';

import {EventSearchListComponent} from './event-search-list.component';
import {ProgramService} from '../../../../services/program/program.service';
import {IProgramEvent} from '../../../../types/IProgramPlace';

function createMockEvent(overrides: Partial<IProgramEvent> = {}): IProgramEvent {
	return {
		id: 'e1', nameCs: 'Test', nameEn: 'Test EN',
		descriptionCs: '', descriptionEn: '',
		startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T15:00:00Z',
		locationId: 'p1', location: {id: 'p1', name: 'Place 1'},
		favorite: false, eventType: {id: 't1', name: 'Concert', color: '#f00'},
		tags: [], startSegment: 0, segmentCount: 4,
		...overrides,
	} as IProgramEvent;
}

describe('EventSearchListComponent', () => {
	let component: EventSearchListComponent;
	let fixture: ReturnType<typeof TestBed.createComponent<EventSearchListComponent>>;

	const events: IProgramEvent[] = [
		createMockEvent({id: 'e1', nameCs: 'Rock Festival', favorite: true}),
		createMockEvent({id: 'e2', nameCs: 'Jazz Night', favorite: false}),
		createMockEvent({id: 'e3', nameCs: 'Rockový Koncert', favorite: true}),
	];

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [EventSearchListComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatDialogModule],
			providers: [{provide: ProgramService, useValue: {places: signal([]), days: signal({})}}],
		});
		fixture = TestBed.createComponent(EventSearchListComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('events', events);
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('filteredEvents', () => {
		it('returns all events by default (onlyFavorite false)', () => {
			expect((component as any).filteredEvents().length).toBe(3);
		});

		it('filters by accent- and case-insensitive search', () => {
			(component as any).search.set('rockovy');
			const f = (component as any).filteredEvents();
			expect(f.length).toBe(1);
			expect(f[0].id).toBe('e3');
		});

		it('filters favorites only when onlyFavorite=true', () => {
			fixture.componentRef.setInput('onlyFavorite', true);
			const f = (component as any).filteredEvents();
			expect(f.length).toBe(2);
			expect(f.every((e: any) => e.favorite)).toBeTrue();
		});

		it('combines favorites and search', () => {
			fixture.componentRef.setInput('onlyFavorite', true);
			(component as any).search.set('Jazz');
			expect((component as any).filteredEvents().length).toBe(0);
		});

		it('returns empty when nothing matches', () => {
			(component as any).search.set('nonexistent');
			expect((component as any).filteredEvents().length).toBe(0);
		});

		it('trims search whitespace', () => {
			(component as any).search.set('  Jazz  ');
			expect((component as any).filteredEvents().length).toBe(1);
		});
	});

	it('shows the back button and emits back when showBackBtn=true', () => {
		fixture.componentRef.setInput('showBackBtn', true);
		fixture.detectChanges();
		let emitted = false;
		component.back.subscribe(() => (emitted = true));
		const btn = fixture.nativeElement.querySelector('.event-list__header__back');
		expect(btn).toBeTruthy();
		btn.click();
		expect(emitted).toBeTrue();
	});

	it('hides the back button when showBackBtn=false', () => {
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('.event-list__header__back')).toBeNull();
	});
});
```

- [ ] **Step 2: Spustit test — ověřit, že padá**

Run: `npm run test`
Expected: FAIL (komponenta `event-search-list.component` neexistuje).

- [ ] **Step 3: Vytvořit komponentu (.ts)**

Vytvoř `…/event-search-list/event-search-list.component.ts`:

```ts
import {Component, computed, input, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {TranslateModule} from '@ngx-translate/core';
import {ProgramVerticalListComponent} from '../../program-vertical-list.component';
import {IEvent} from '../../../../types/IEvent';
import {Utils} from '../../../../../../common/utils/Utils';

@Component({
	selector: 'app-event-search-list',
	imports: [
		FormsModule,
		MatButtonModule,
		MatIconModule,
		MatInputModule,
		TranslateModule,
		ProgramVerticalListComponent,
	],
	templateUrl: './event-search-list.component.html',
	styleUrls: ['./event-search-list.component.scss'],
})
export class EventSearchListComponent {
	public readonly events = input<IEvent[] | null>([]);
	public readonly onlyFavorite = input<boolean>(false);
	public readonly showBackBtn = input<boolean>(false);
	public readonly emptyTitle = input<string>('Dnes tu není žádná akce');
	public readonly emptySubtitle = input<string>('Zkontrolujte nastavení filtrů');

	public readonly back = output<void>();

	protected readonly search = signal('');

	protected readonly filteredEvents = computed<IEvent[]>(() => {
		let events = this.events() ?? [];

		if (this.onlyFavorite()) {
			events = events.filter((event) => event.favorite);
		}

		const searchTerm = this.search();
		if (searchTerm) {
			const normalized = Utils.replaceCzechAccentSymbols(searchTerm.toLowerCase().trim());
			events = events.filter((event) =>
				Utils.replaceCzechAccentSymbols(event.nameCs.toLowerCase().trim()).includes(normalized),
			);
		}

		return events;
	});
}
```

- [ ] **Step 4: Vytvořit šablonu (.html)**

Vytvoř `…/event-search-list/event-search-list.component.html`:

```html
<div class="event-list">
  <div class="event-list__header">
    @if (showBackBtn()) {
      <button mat-icon-button
        class="event-list__header__back"
        aria-label="Back"
        (click)="back.emit()">
        <mat-icon>keyboard_backspace</mat-icon>
      </button>
    }

    <mat-form-field appearance="outline"
      class="event-list__header__search-input">
      <input matInput
        [placeholder]="'Vyhledat' | translate"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)">
      <mat-icon matPrefix class="my-icon">search</mat-icon>
    </mat-form-field>
  </div>

  <div class="event-list__content">
    <app-program-vertical-list [events]="filteredEvents()"></app-program-vertical-list>

    @if (filteredEvents().length === 0) {
      <div class="event-list__content__no-events">
        <h2>{{ emptyTitle() | translate }}</h2>
        <h4>{{ emptySubtitle() | translate }}</h4>
      </div>
    }
  </div>
</div>
```

- [ ] **Step 5: Vytvořit styly (.scss)**

Vytvoř `…/event-search-list/event-search-list.component.scss` (přeneseno z dialog
scss, přejmenováno + back tlačítko + header flex):

```scss
:host {
	display: block;
	height: 100%;
}

::ng-deep {
	.event-list__header__search-input {
		.mat-mdc-form-field-subscript-wrapper {
			display: none;
		}
	}
}

.event-list {
	min-height: 100%;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	&__header {
		display: flex;
		align-items: center;
		padding: 15px 15px 15px 0;

		&__back {
			flex-shrink: 0;
			margin-left: 4px;
		}

		&__search-input {
			flex: 1;
			margin: auto 15px;
		}
	}

	&__content {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 100%;

		&__no-events {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			height: 100%;
		}
	}
}
```

- [ ] **Step 6: Spustit test — ověřit, že prochází**

Run: `npm run test`
Expected: PASS (všech 8 testů `EventSearchListComponent`).

---

## Task 3: Refaktor search dialogu na obal

**Files:**
- Modify: `P/components/program-vertical-list-dialog/program-vertical-list-dialog.component.ts`
- Modify: `P/components/program-vertical-list-dialog/program-vertical-list-dialog.component.html`
- Modify: `P/components/program-vertical-list-dialog/program-vertical-list-dialog.component.scss`
- Modify: `P/components/program-vertical-list-dialog/program-vertical-list-dialog.component.spec.ts`

- [ ] **Step 1: Přepsat dialog komponentu (.ts)**

Nahraď celý obsah `program-vertical-list-dialog.component.ts`:

```ts
import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {IProgramEvent} from '../../../../types/IProgramPlace';
import {EventSearchListComponent} from '../event-search-list/event-search-list.component';

@Component({
	selector: 'app-program-vertical-list-dialog',
	imports: [MatDialogModule, EventSearchListComponent],
	templateUrl: './program-vertical-list-dialog.component.html',
	styleUrls: ['./program-vertical-list-dialog.component.scss'],
})
export class ProgramVerticalListDialogComponent {
	protected readonly data: {events: IProgramEvent[]} = inject(MAT_DIALOG_DATA);
	private readonly dialogRef = inject(MatDialogRef<ProgramVerticalListDialogComponent>);

	protected close(): void {
		this.dialogRef.close();
	}
}
```

- [ ] **Step 2: Přepsat dialog šablonu (.html)**

Nahraď celý obsah `program-vertical-list-dialog.component.html`:

```html
<div mat-dialog-content class="event-list-dialog">
  <app-event-search-list
    [events]="data.events"
    [onlyFavorite]="false"
    [showBackBtn]="true"
    (back)="close()">
  </app-event-search-list>
</div>
```

- [ ] **Step 3: Zjednodušit dialog styly (.scss)**

Nahraď celý obsah `program-vertical-list-dialog.component.scss` (list styly se
přesunuly do sdílené komponenty; zůstává jen padding dialog-contentu):

```scss
:host {
	display: block;
	height: 100%;

	.mat-mdc-dialog-content {
		padding: 0 !important;
	}
}

.event-list-dialog {
	height: 100%;
}
```

- [ ] **Step 4: Přepsat dialog spec na minimální**

Nahraď celý obsah `program-vertical-list-dialog.component.spec.ts` (testy
`filteredEvents`/`toggleFavorite` se přesunuly do `EventSearchListComponent`):

```ts
import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateModule} from '@ngx-translate/core';

import {ProgramVerticalListDialogComponent} from './program-vertical-list-dialog.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('ProgramVerticalListDialogComponent', () => {
	let component: ProgramVerticalListDialogComponent;
	const closeSpy = jasmine.createSpy('close');

	beforeEach(() => {
		closeSpy.calls.reset();

		TestBed.configureTestingModule({
			imports: [
				ProgramVerticalListDialogComponent,
				NoopAnimationsModule,
				TranslateModule.forRoot(),
				MatDialogModule,
			],
			providers: [
				{provide: MAT_DIALOG_DATA, useValue: {events: []}},
				{provide: MatDialogRef, useValue: {close: closeSpy}},
				{provide: ProgramService, useValue: {places: signal([]), days: signal({})}},
			],
		});

		const fixture = TestBed.createComponent(ProgramVerticalListDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('close() closes the dialog', () => {
		(component as any).close();
		expect(closeSpy).toHaveBeenCalled();
	});
});
```

- [ ] **Step 5: Spustit testy + build**

Run: `npm run test`
Expected: PASS (dialog spec 2 testy; `FullProgramComponent.showEventList()` se nemění
— dál otevírá dialog s `{events: allEvents}`, datová struktura `{events}` zůstává).

Run: `npm run build`
Expected: build projde.

---

## Task 4: `FavoritesComponent` + routa (TDD)

**Files:**
- Create: `src/app/modules/favorites/favorites.component.ts`
- Create: `src/app/modules/favorites/favorites.component.html`
- Create: `src/app/modules/favorites/favorites.component.scss`
- Test: `src/app/modules/favorites/favorites.component.spec.ts`
- Modify: `src/app/app-routing.module.ts`

- [ ] **Step 1: Napsat padající test**

Vytvoř `src/app/modules/favorites/favorites.component.spec.ts`:

```ts
import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogModule} from '@angular/material/dialog';

import {FavoritesComponent} from './favorites.component';
import {ProgramService} from '../program/services/program/program.service';
import {IEvent} from '../program/types/IEvent';

function createMockEvent(overrides: Partial<IEvent> = {}): IEvent {
	return {
		id: 'e1', nameCs: 'Test', nameEn: 'Test EN',
		descriptionCs: '', descriptionEn: '',
		startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T15:00:00Z',
		locationId: 'p1', location: {id: 'p1', name: 'Place 1'},
		favorite: false, eventType: {id: 't1', name: 'Concert', color: '#f00'},
		tags: [],
		...overrides,
	} as IEvent;
}

describe('FavoritesComponent', () => {
	let component: FavoritesComponent;

	const mockProgramService = {
		eventsLoading: signal(false),
		places: signal([]),
		days: signal({}),
		allEvents: [] as IEvent[],
	};

	beforeEach(() => {
		mockProgramService.eventsLoading.set(false);
		mockProgramService.allEvents = [
			createMockEvent({id: 'e1', favorite: true}),
			createMockEvent({id: 'e2', favorite: false}),
		];

		TestBed.configureTestingModule({
			imports: [FavoritesComponent, NoopAnimationsModule, TranslateModule.forRoot(), MatDialogModule],
			providers: [{provide: ProgramService, useValue: mockProgramService}],
		});

		const fixture = TestBed.createComponent(FavoritesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('exposes allEvents', () => {
		expect((component as any).events().length).toBe(2);
	});

	it('recomputes when eventsLoading changes', () => {
		mockProgramService.allEvents = [createMockEvent({id: 'e9', favorite: true})];
		mockProgramService.eventsLoading.set(true);
		expect((component as any).events().map((e: any) => e.id)).toEqual(['e9']);
	});
});
```

- [ ] **Step 2: Spustit test — ověřit, že padá**

Run: `npm run test`
Expected: FAIL (`favorites.component` neexistuje).

- [ ] **Step 3: Vytvořit komponentu (.ts)**

Vytvoř `src/app/modules/favorites/favorites.component.ts`:

```ts
import {Component, computed, inject} from '@angular/core';
import {ProgramService} from '../program/services/program/program.service';
import {IEvent} from '../program/types/IEvent';
import {EventSearchListComponent} from '../program/components/program-vertical-list/components/event-search-list/event-search-list.component';

@Component({
	selector: 'app-favorites',
	imports: [EventSearchListComponent],
	templateUrl: './favorites.component.html',
	styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent {
	private readonly programService = inject(ProgramService);

	protected readonly events = computed<IEvent[]>(() => {
		// Re-read once the program finishes loading (allEvents is not a signal).
		this.programService.eventsLoading();
		return this.programService.allEvents;
	});
}
```

- [ ] **Step 4: Vytvořit šablonu (.html)**

Vytvoř `src/app/modules/favorites/favorites.component.html`:

```html
<app-event-search-list
  [events]="events()"
  [onlyFavorite]="true"
  [emptyTitle]="'Zatím žádné oblíbené'"
  [emptySubtitle]="'Označ si akce srdíčkem v programu'">
</app-event-search-list>
```

- [ ] **Step 5: Vytvořit styly (.scss)**

Vytvoř `src/app/modules/favorites/favorites.component.scss`:

```scss
:host {
	display: block;
	height: 100%;
	overflow: hidden;
}
```

- [ ] **Step 6: Přidat lazy route**

V `src/app/app-routing.module.ts` přidej za blok `path: ERoute.MAP` (před
`path: '**'`):

```ts
	{
		path: ERoute.FAVORITES,
		loadComponent: () => import('./modules/favorites/favorites.component').then((c) => c.FavoritesComponent),
	},
```

- [ ] **Step 7: Spustit test + build**

Run: `npm run test`
Expected: PASS (3 testy `FavoritesComponent`).

Run: `npm run build`
Expected: build projde (route se vyresolvuje na FavoritesComponent).

---

## Task 5: Bottom-menu tab Oblíbené

**Files:**
- Modify: `src/app/modules/layout/components/bottom-menu/bottom-menu.component.html`
- Modify: `src/app/modules/layout/components/bottom-menu/bottom-menu.component.spec.ts`

- [ ] **Step 1: Přidat tlačítko Oblíbené**

V `bottom-menu.component.html` vlož **mezi** uzavírací `</button>` tlačítka
Notifikace a blok `@if (showConfigurableButton) {` tento nový tab:

```html
		<button mat-button
			routerLinkActive="bottom-menu__button--active"
			class="bottom-menu__button"
			[class.with-text]="settingsService.device() === EDisplayDevice.INFO_PANEL"
			[routerLink]="ERoute.FAVORITES"
			[queryParamsHandling]="'merge'"
		>
			<span class="bottom-menu__inner">
				<mat-icon>favorite</mat-icon>
				<span class="bottom-menu__label">{{ 'Oblíbené' | translate }}</span>
			</span>
		</button>
```

- [ ] **Step 2: Přidat test routy do bottom-menu spec**

V `bottom-menu.component.spec.ts` přidej importy nahoru (k existujícím):

```ts
import {By} from '@angular/platform-browser';
import {RouterLink} from '@angular/router';
import {ERoute} from '../../../../common/types/ERoute';
```

a přidej testy dovnitř hlavního `describe(...)` (např. za test `should create`):

```ts
	it('renders Oblíbené as a routed tab', () => {
		setup();
		const labels = Array.from(fixture.nativeElement.querySelectorAll('.bottom-menu__label'))
			.map((e: any) => e.textContent.trim());
		expect(labels).toContain('Oblíbené');
	});

	it('Oblíbené is a router link to the favorites route', () => {
		setup();
		const links = fixture.debugElement.queryAll(By.directive(RouterLink));
		// Program, Mapa, Notifikace, Oblíbené (configurable button has no routerLink)
		expect(links.length).toBe(4);
		const targets = links.map((l) => l.injector.get(RouterLink));
		expect(targets.some((rl: any) => rl.routerLink === ERoute.FAVORITES)).toBeTrue();
	});
```

> Pozn.: `setup()` a `fixture` už v tom spec existují (viz stávající testy). Default
> `mockCustomization = {}` → konfig. tlačítko se nezobrazí, takže routerLinků jsou 4.

- [ ] **Step 3: Spustit testy**

Run: `npm run test`
Expected: PASS (nové bottom-menu testy + beze změny stávající).

---

## Task 6: Finální ověření

**Files:** (bez změn)

- [ ] **Step 1: Plná sada testů**

Run: `npm run test`
Expected: PASS, 0 failures.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: úspěšný build.

- [ ] **Step 3: Manuální ověření v appce**

Spusť app (dev server / zařízení) a ověř:
- Spodní menu má **Oblíbené** (srdce) za Notifikace; je to tab se zvýrazněním
  (jako Program/Mapa/Notifikace), **bez** back tlačítka.
- Oblíbené zobrazí jen oblíbené akce; vyhledávací pole nahoře filtruje **mezi
  oblíbenými**; dlouhý seznam scrolluje; prázdný stav ukáže „Zatím žádné oblíbené".
- 🔍 v toolbaru Programu otevře **dialog** s **back tlačítkem** vedle search inputu,
  hledá ve **všech** akcích, a **už nemá** přepínač srdíčka.

- [ ] **Step 4: Commit — domluvit s uživatelem**

Necommitovat automaticky (pracovní strom má rozpracované dřívější změny). Nahlásit
hotovo a domluvit seskupení commitů.

---

## Self-review (autor plánu)

- **Pokrytí specu:** sdílená komponenta + inputy/output → Task 2; dialog obal
  (showBackBtn=true, bez srdíčka, (back)→close) → Task 3; routa Oblíbené
  (onlyFavorite=true, eventsLoading reaktivita) → Task 4; bottom-menu tab (routerLink)
  → Task 5; ERoute+route+i18n → Task 1/Task 4; empty-stavy → Task 2 (inputy) + Task 4
  (hodnoty); testy → Task 2/3/4/5.
- **Bez placeholderů:** plný kód všech nových souborů i edit-stringů.
- **Konzistence jmen:** `EventSearchListComponent`/`app-event-search-list`,
  inputy `events`/`onlyFavorite`/`showBackBtn`/`emptyTitle`/`emptySubtitle`, output
  `back`, `filteredEvents`, `FavoritesComponent`/`app-favorites`, `ERoute.FAVORITES`
  — použito konzistentně napříč tasky.
- **`userFilterOptions.onlyFavorite`:** po Task 3 už ho dialog nečte; jako dead-config
  se neřeší (viz spec „Mimo rozsah"); ponecháno beze změny.
```
