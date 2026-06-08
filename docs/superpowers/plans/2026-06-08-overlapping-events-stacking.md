# Stacking překrývajících se eventů na stejném místě — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Když na jednom místě v překrývajícím se čase běží víc eventů, zobrazit je pod sebou ve vlastních vodorovných pruzích (lanes) místo přes sebe, opravit ztrátu eventů se shodným začátkem a u míst s překryvem ukázat zlatou sticky lištu vlevo.

**Architecture:** Hybrid — stávající flex grid (horizontální zarovnání s časovou osou) zůstává beze změny; přidává se jen vertikální nádstavba. Čistá funkce `layoutPlaceEvents()` spočítá přiřazení pruhů (greedy interval partitioning), datový model se mění z `Record<number, IProgramEvent>` (přepis klíčem startSegment → ztráta eventů) na `IProgramPlaceLayout` (pole eventů na buňku + počet pruhů). Event dostane jen vertikální `top = lane × laneStride`, řádek vyšší podle počtu pruhů.

**Tech Stack:** Angular 21 (signály, `computed`, `@for`/`@if` control flow, standalone komponenty, `ChangeDetectionStrategy.OnPush`), TypeScript, jasmine/karma, dayjs, Capacitor 7 (WKWebView iOS + Chromium Android).

**Spec:** `docs/superpowers/specs/2026-06-08-overlapping-events-stacking-design.md`

**Build:** `yarn run build` **Test:** `yarn run test`

---

## File Structure

| Soubor | Odpovědnost |
|--------|-------------|
| `full-program/types/IProgramPlaceLayout.ts` (nový) | Datový model: `IProgramEventLayout` (event + `lane`), `IProgramPlaceLayout` (eventy po start segmentu, `laneCount`, `hasOverlap`). |
| `full-program/utils/layout-place-events.ts` (nový) | Čistá funkce `layoutPlaceEvents()` — přiřazení pruhů, seskupení po start segmentu. |
| `full-program/utils/layout-place-events.spec.ts` (nový) | Unit testy algoritmu. |
| `full-program/FullProgramConfig.ts` (změna) | Konstanty `eventHeight`, `laneGap`, `laneStride`. |
| `full-program/full-program.component.ts` (změna) | `eventsByPlaces` → `Record<string, IProgramPlaceLayout>` (sbírá eventy do pole, volá `layoutPlaceEvents`). |
| `full-program/full-program.component.html` (změna) | Binding `[events]` → `[layout]`. |
| `full-program/components/list-place/list-place.component.{ts,html,scss}` (změna) | Vstup `layout`, vykreslení pole eventů na buňku, dynamická výška řádku, zlatá sticky lišta. |
| `full-program/components/list-event/list-event.component.{ts,html}` (změna) | Vertikální offset pruhu `[style.top.px]`. |
| Specs `full-program`, `list-place`, `list-event` (změna) | Přizpůsobení novému modelu. |

---

## Task 1: Datový model `IProgramPlaceLayout`

**Files:**
- Create: `src/app/modules/program/components/full-program/types/IProgramPlaceLayout.ts`

- [ ] **Step 1: Vytvořit soubor s typy**

`src/app/modules/program/components/full-program/types/IProgramPlaceLayout.ts`:

```ts
import {IProgramEvent} from '../../../types/IProgramPlace';

export interface IProgramEventLayout extends IProgramEvent {
	lane: number; // 0-based vodorovný pruh
}

export interface IProgramPlaceLayout {
	// víc eventů na stejný startovní segment → pole (žádný přepis)
	eventsByStartSegment: Record<number, IProgramEventLayout[]>;
	laneCount: number;   // ≥ 1; pro prázdné místo = 1 (řádek 65px jako dnes)
	hasOverlap: boolean; // laneCount > 1
}
```

- [ ] **Step 2: Ověřit, že se projekt zkompiluje**

Run: `yarn run build`
Expected: PASS (nový, zatím nepoužitý typový soubor build nerozbije).

- [ ] **Step 3: Commit**

```bash
git add src/app/modules/program/components/full-program/types/IProgramPlaceLayout.ts
git commit -m "feat(program): add IProgramPlaceLayout data model for lane stacking"
```

---

## Task 2: Čistá funkce `layoutPlaceEvents` (TDD)

**Files:**
- Create: `src/app/modules/program/components/full-program/utils/layout-place-events.ts`
- Test: `src/app/modules/program/components/full-program/utils/layout-place-events.spec.ts`

- [ ] **Step 1: Napsat padající testy**

`src/app/modules/program/components/full-program/utils/layout-place-events.spec.ts`:

```ts
import {IProgramEvent} from '../../../types/IProgramPlace';
import {layoutPlaceEvents} from './layout-place-events';

function makeEvent(id: string, startSegment: number, segmentCount: number): IProgramEvent {
	return {
		id,
		nameCs: id, nameEn: id,
		descriptionCs: '', descriptionEn: '',
		startAt: '', endAt: '',
		locationId: 'p1',
		location: {id: 'p1', name: 'P1'},
		favorite: false,
		eventType: {id: 't1', name: 'T', color: '#000'},
		tags: [],
		startSegment, segmentCount,
	};
}

describe('layoutPlaceEvents', () => {
	it('returns a single empty lane for no events', () => {
		const layout = layoutPlaceEvents([]);
		expect(layout.laneCount).toBe(1);
		expect(layout.hasOverlap).toBeFalse();
		expect(layout.eventsByStartSegment).toEqual({});
	});

	it('puts a single event in one lane', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 4)]);
		expect(layout.laneCount).toBe(1);
		expect(layout.hasOverlap).toBeFalse();
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
	});

	it('shares one lane for touching edges (one ends where the next starts)', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 6), makeEvent('e2', 6, 2)]);
		expect(layout.laneCount).toBe(1);
		expect(layout.hasOverlap).toBeFalse();
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
		expect(layout.eventsByStartSegment[6][0].lane).toBe(0);
	});

	it('splits two time-overlapping events into two lanes', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 4), makeEvent('e2', 2, 4)]);
		expect(layout.laneCount).toBe(2);
		expect(layout.hasOverlap).toBeTrue();
		expect(layout.eventsByStartSegment[0][0].lane).toBe(0);
		expect(layout.eventsByStartSegment[2][0].lane).toBe(1);
	});

	it('keeps both events that share the same start segment (bug fix)', () => {
		const layout = layoutPlaceEvents([makeEvent('e1', 0, 2), makeEvent('e2', 0, 2)]);
		expect(layout.laneCount).toBe(2);
		expect(layout.hasOverlap).toBeTrue();
		expect(layout.eventsByStartSegment[0].length).toBe(2);
		const lanes = layout.eventsByStartSegment[0].map((e) => e.lane).sort();
		expect(lanes).toEqual([0, 1]);
	});

	it('grows to three lanes for three concurrent events', () => {
		const layout = layoutPlaceEvents([
			makeEvent('e1', 0, 6),
			makeEvent('e2', 1, 6),
			makeEvent('e3', 2, 6),
		]);
		expect(layout.laneCount).toBe(3);
		expect(layout.hasOverlap).toBeTrue();
	});

	it('assigns lanes deterministically regardless of input order', () => {
		const a = layoutPlaceEvents([makeEvent('late', 2, 2), makeEvent('early', 0, 4)]);
		const b = layoutPlaceEvents([makeEvent('early', 0, 4), makeEvent('late', 2, 2)]);
		expect(a.eventsByStartSegment[0][0].lane).toBe(0);
		expect(a.eventsByStartSegment[2][0].lane).toBe(1);
		expect(b.eventsByStartSegment[0][0].lane).toBe(0);
		expect(b.eventsByStartSegment[2][0].lane).toBe(1);
	});
});
```

- [ ] **Step 2: Spustit testy a ověřit, že padají**

Run: `yarn run test`
Expected: FAIL — `Cannot find module './layout-place-events'` / `layoutPlaceEvents is not a function`.

- [ ] **Step 3: Implementovat funkci**

`src/app/modules/program/components/full-program/utils/layout-place-events.ts`:

```ts
import {IProgramEvent} from '../../../types/IProgramPlace';
import {IProgramEventLayout, IProgramPlaceLayout} from '../types/IProgramPlaceLayout';

/**
 * Greedy interval partitioning — přiřadí každému eventu nejnižší volný pruh,
 * čímž naskládá časově se překrývající eventy pod sebe s minimem pruhů.
 * Dotykové hrany (jeden končí v segmentu N, druhý začíná v N) sdílejí pruh.
 */
export function layoutPlaceEvents(events: IProgramEvent[]): IProgramPlaceLayout {
	const sorted = [...events].sort((a, b) => {
		if (a.startSegment !== b.startSegment) {
			return a.startSegment - b.startSegment;
		}
		return b.segmentCount - a.segmentCount;
	});

	const lanesEnd: number[] = []; // koncový segment (exkluzivně) posledního eventu v pruhu
	const eventsByStartSegment: Record<number, IProgramEventLayout[]> = {};

	for (const event of sorted) {
		const end = event.startSegment + event.segmentCount;

		let lane = lanesEnd.findIndex((laneEnd) => laneEnd <= event.startSegment);
		if (lane === -1) {
			lane = lanesEnd.length;
		}
		lanesEnd[lane] = end;

		const layoutEvent: IProgramEventLayout = {...event, lane};
		if (!eventsByStartSegment[event.startSegment]) {
			eventsByStartSegment[event.startSegment] = [];
		}
		eventsByStartSegment[event.startSegment].push(layoutEvent);
	}

	const laneCount = Math.max(1, lanesEnd.length);

	return {
		eventsByStartSegment,
		laneCount,
		hasOverlap: laneCount > 1,
	};
}
```

- [ ] **Step 4: Spustit testy a ověřit, že prošly**

Run: `yarn run test`
Expected: PASS — všech 7 testů `layoutPlaceEvents` zelených.

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/program/components/full-program/utils/layout-place-events.ts src/app/modules/program/components/full-program/utils/layout-place-events.spec.ts
git commit -m "feat(program): add layoutPlaceEvents lane partitioning util with tests"
```

---

## Task 3: Konstanty pruhů v `FullProgramConfig`

**Files:**
- Modify: `src/app/modules/program/components/full-program/FullProgramConfig.ts`

- [ ] **Step 1: Přidat konstanty**

V `src/app/modules/program/components/full-program/FullProgramConfig.ts` za pole `segmentDuration` (řádek 10, před zakomentovaným blokem `eventTypes`) vložit:

```ts
	/**
	 * Height of a single event / lane in px
	 */
	public static eventHeight: number = 65;

	/**
	 * Vertical gap between stacked lanes in px
	 */
	public static laneGap: number = 4;

	/**
	 * Vertical distance between lane tops in px (eventHeight + laneGap)
	 */
	public static laneStride: number = 69;
```

- [ ] **Step 2: Ověřit build**

Run: `yarn run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/modules/program/components/full-program/FullProgramConfig.ts
git commit -m "feat(program): add eventHeight/laneGap/laneStride config constants"
```

---

## Task 4: Datový model end-to-end (`eventsByPlaces` → `list-place`)

Atomická typová změna napříč producentem (`eventsByPlaces`), wiringem (`full-program.component.html`) a konzumentem (`list-place`). Musí proběhnout v jednom kroku, jinak se rozbije typová kontrola šablon.

**Files:**
- Modify: `src/app/modules/program/components/full-program/full-program.component.ts`
- Modify: `src/app/modules/program/components/full-program/full-program.component.html:93`
- Modify: `src/app/modules/program/components/full-program/components/list-place/list-place.component.ts`
- Modify: `src/app/modules/program/components/full-program/components/list-place/list-place.component.html`
- Modify: `src/app/modules/program/components/full-program/components/list-place/list-place.component.scss`
- Test: `src/app/modules/program/components/full-program/full-program.component.spec.ts:296-342`
- Test: `src/app/modules/program/components/full-program/components/list-place/list-place.component.spec.ts`

- [ ] **Step 1: Upravit padající testy `eventsByPlaces` na nový model**

V `src/app/modules/program/components/full-program/full-program.component.spec.ts` nahradit **celý** `describe('eventsByPlaces computed signal', …)` (řádky 296–342) tímto blokem:

```ts
	describe('eventsByPlaces computed signal', () => {
		it('should return empty object when no events', () => {
			expect((component as any).eventsByPlaces()).toEqual({});
		});

		it('should group events by locationId', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
				createMockEvent({id: 'e2', locationId: 'p2', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).minute(30).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const result = (component as any).eventsByPlaces();
			expect(Object.keys(result)).toContain('p1');
			expect(Object.keys(result)).toContain('p2');
		});

		it('should produce a single-lane layout with startSegment/segmentCount', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({
					id: 'e1',
					locationId: 'p1',
					startAt: baseDay.hour(10).toISOString(),
					endAt: baseDay.hour(11).toISOString(),
				}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const layout = (component as any).eventsByPlaces()['p1'];
			expect(layout).toBeDefined();
			expect(layout.laneCount).toBe(1);
			expect(layout.hasOverlap).toBeFalse();

			const startEvents = layout.eventsByStartSegment[0];
			expect(startEvents.length).toBe(1);
			expect(startEvents[0].segmentCount).toBe(4);
			expect(startEvents[0].lane).toBe(0);
		});

		it('should keep both events that share the same start segment (no data loss)', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
				createMockEvent({id: 'e2', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const layout = (component as any).eventsByPlaces()['p1'];
			expect(layout.laneCount).toBe(2);
			expect(layout.hasOverlap).toBeTrue();
			expect(layout.eventsByStartSegment[0].length).toBe(2);
		});

		it('should split two time-overlapping events into two lanes', () => {
			const baseDay = dayjs('2025-07-10');
			const day = baseDay.startOf('day').valueOf();
			const events = [
				createMockEvent({id: 'e1', locationId: 'p1', startAt: baseDay.hour(10).toISOString(), endAt: baseDay.hour(11).toISOString()}),
				createMockEvent({id: 'e2', locationId: 'p1', startAt: baseDay.hour(10).minute(30).toISOString(), endAt: baseDay.hour(11).minute(30).toISOString()}),
			];
			mockProgramService.events.set(events);
			mockProgramService.selectedDay.set(day);

			TestBed.flushEffects();

			const layout = (component as any).eventsByPlaces()['p1'];
			expect(layout.laneCount).toBe(2);
			expect(layout.hasOverlap).toBeTrue();
		});
	});
```

- [ ] **Step 2: Spustit testy a ověřit, že padají**

Run: `yarn run test`
Expected: FAIL — staré testy nahrazeny; nové selžou, protože `eventsByPlaces` zatím vrací starý tvar (`layout.laneCount` je `undefined`).

- [ ] **Step 3: Přepsat `eventsByPlaces` v komponentě**

V `src/app/modules/program/components/full-program/full-program.component.ts` přidat importy za řádek 5 (`import {IProgramEvent, IProgramPlace} from '../../types/IProgramPlace';`):

```ts
import {IProgramPlaceLayout} from './types/IProgramPlaceLayout';
import {layoutPlaceEvents} from './utils/layout-place-events';
```

Pak nahradit **celý** getter `eventsByPlaces` (řádky 177–207) tímto:

```ts
	protected readonly eventsByPlaces: Signal<Record<string, IProgramPlaceLayout>> = computed(() => {
		const allEvents = this.filteredEvents();
		const firstEventAt = this.#firstEventAt();
		const selectedDay = this.programService.selectedDay();
		if(!firstEventAt || !selectedDay) {
			return {};
		}

		const eventsByLocation: Record<string, IProgramEvent[]> = {};

		for(const event of allEvents) {
			const selectedDayJs = dayjs(selectedDay);
			const eventStart = dayjs(event.startAt);
			const eventEnd = dayjs(event.endAt);
			const dayStart = eventStart.set('hour', firstEventAt.hour()).set('minutes', firstEventAt.minute()).set('date', selectedDayJs.get('date'));
			const startSegment = this.getSegmentsFromMilliseconds(Math.abs(dayStart.diff(eventStart)));
			const segmentCount = this.getSegmentsFromMilliseconds(Math.abs(eventStart.diff(eventEnd)));

			if(!eventsByLocation[event.locationId]) {
				eventsByLocation[event.locationId] = [];
			}

			eventsByLocation[event.locationId].push({
				...event,
				startSegment,
				segmentCount,
			});
		}

		const result: Record<string, IProgramPlaceLayout> = {};
		for(const locationId of Object.keys(eventsByLocation)) {
			result[locationId] = layoutPlaceEvents(eventsByLocation[locationId]);
		}

		return result;
	});
```

- [ ] **Step 4: Přepojit binding v rodičovské šabloně**

V `src/app/modules/program/components/full-program/full-program.component.html` na řádku 93 změnit binding z `[events]` na `[layout]`:

```html
                            <app-list-place [place]="place"
                                            [layout]="eventsByPlaces()[place.id]"
                                            [segments]="allSegments()"
                                            (placeSelect)="showEventDetail($event, place)"
                            >
```

- [ ] **Step 5: Upravit `list-place` komponentu (vstup + výška řádku)**

Nahradit **celý** obsah `src/app/modules/program/components/full-program/components/list-place/list-place.component.ts`:

```ts
import {Component, EventEmitter, Input, Output} from '@angular/core';

import {FullProgramConfig} from '../../FullProgramConfig';
import {ListEventComponent} from '../list-event/list-event.component';
import {IProgramEvent, IProgramPlace} from '../../../../types/IProgramPlace';
import {IProgramSegment} from '../../types/IProgramSegment';
import {IProgramPlaceLayout} from '../../types/IProgramPlaceLayout';

@Component({
    selector: 'app-list-place',
    imports: [ListEventComponent],
    templateUrl: './list-place.component.html',
    styleUrls: ['./list-place.component.scss']
})
export class ListPlaceComponent {
	@Input()
	public place: IProgramPlace;

	@Input()
	public segments: IProgramSegment[];

	@Input()
	public layout: IProgramPlaceLayout;

	@Output()
	public placeSelect: EventEmitter<IProgramEvent> = new EventEmitter<IProgramEvent>();

	protected readonly FullProgramConfig = FullProgramConfig;

	/** Výška řádku/buňky podle počtu pruhů; pro 1 pruh = 65px (dnešní výška). */
	protected rowHeight(): number {
		return this.layout.laneCount * FullProgramConfig.laneStride - FullProgramConfig.laneGap;
	}

	protected showEventDetail(event: IProgramEvent): void {
		this.placeSelect.emit(event);
	}
}
```

- [ ] **Step 6: Upravit `list-place` šablonu (pole eventů na buňku + lišta)**

Nahradit **celý** obsah `src/app/modules/program/components/full-program/components/list-place/list-place.component.html`:

```html
@if (layout) {
  <div class="place">
    <div class="place__title">
      <span class="place__title__text"
      >{{place.name}}</span>
    </div>
    <div class="place__segment-list">
      @if (layout.hasOverlap) {
        <div class="place__rail" [style.height.px]="rowHeight()"></div>
      }
      @for (segment of segments; track segment) {
        <div class="place__segment"
          [style.width]="FullProgramConfig.segmentWidth + 'px'"
          [style.height.px]="rowHeight()"
          >
          @for (event of layout.eventsByStartSegment[segment.index] ?? []; track event.id) {
            <app-list-event [event]="event"
            (eventSelect)="showEventDetail($event)"></app-list-event>
          }
        </div>
      }
    </div>
  </div>
}
```

- [ ] **Step 7: Upravit `list-place` styly (dynamická výška + zlatá sticky lišta)**

Nahradit **celý** obsah `src/app/modules/program/components/full-program/components/list-place/list-place.component.scss`:

```scss
.place {
  margin-bottom: 15px;

  &__title {
    padding: 10px;

    &__text {
      position: sticky;
      left: 15px;
      border: 1px solid transparent;
      border-radius: 13px;
      padding: 5px 10px;
      background-color: #b08d00;
    }
  }

  &__segment-list {
    display: flex;
    flex-direction: row;

    .place__segment {
      position: relative;
    }
  }

  // Zlatá lišta u míst s překryvem — sticky vlevo jako název místa.
  // margin-right: -4px → nezabírá místo ve flex řadě, takže segmenty
  // zůstanou zarovnané s časovou osou (nezačnou o 4px doprava).
  // ⚠ Žádný předek nesmí mít overflow/transform/filter/contain/will-change,
  //   jinak iOS WKWebView sticky utne.
  &__rail {
    position: sticky;
    left: 15px;
    z-index: 2;
    flex-shrink: 0;
    align-self: flex-start;
    width: 4px;
    margin-right: -4px;
    background: #b08d00;
    border-radius: 3px;
  }
}
```

- [ ] **Step 8: Aktualizovat `list-place` spec na nový vstup**

Nahradit **celý** obsah `src/app/modules/program/components/full-program/components/list-place/list-place.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPlaceComponent } from './list-place.component';

describe('ListPlaceComponent', () => {
  let component: ListPlaceComponent;
  let fixture: ComponentFixture<ListPlaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ListPlaceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListPlaceComponent);
    component = fixture.componentInstance;
    component.place = {id: 'p1', name: 'Place 1'};
    component.segments = [];
    component.layout = {eventsByStartSegment: {}, laneCount: 1, hasOverlap: false};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes 65px row height for a single lane', () => {
    expect((component as any).rowHeight()).toBe(65);
  });

  it('grows the row height for multiple lanes', () => {
    component.layout = {eventsByStartSegment: {}, laneCount: 2, hasOverlap: true};
    expect((component as any).rowHeight()).toBe(134);
  });
});
```

- [ ] **Step 9: Spustit testy a ověřit, že prošly**

Run: `yarn run test`
Expected: PASS — `FullProgramComponent` `eventsByPlaces` (5 testů), `ListPlaceComponent` (3 testy) i zbytek suite zelené.

- [ ] **Step 10: Ověřit build**

Run: `yarn run build`
Expected: PASS — typová kontrola šablon prochází (binding `[layout]`, `layout.eventsByStartSegment[...]`).

- [ ] **Step 11: Commit**

```bash
git add src/app/modules/program/components/full-program/full-program.component.ts src/app/modules/program/components/full-program/full-program.component.html src/app/modules/program/components/full-program/full-program.component.spec.ts src/app/modules/program/components/full-program/components/list-place/
git commit -m "feat(program): stack overlapping events into lanes with gold rail"
```

---

## Task 5: Vertikální offset pruhu v `list-event`

Bez tohoto kroku se eventy v různých pruzích kreslí na sebe (top:0). Přidává jen vertikální `top` — horizontální `left`/`right`/`width` zůstává beze změny.

**Files:**
- Modify: `src/app/modules/program/components/full-program/components/list-event/list-event.component.ts`
- Modify: `src/app/modules/program/components/full-program/components/list-event/list-event.component.html`
- Test: `src/app/modules/program/components/full-program/components/list-event/list-event.component.spec.ts:29-36`

- [ ] **Step 1: Doplnit `lane` do eventu ve specu (padající kvůli typu)**

V `src/app/modules/program/components/full-program/components/list-event/list-event.component.spec.ts` doplnit `lane: 0` do objektu `component.event` (řádky 29–36) — výsledek:

```ts
		component.event = {
			id: 'e1', nameCs: 'Test', nameEn: 'Test EN',
			descriptionCs: '', descriptionEn: '',
			startAt: '2025-07-10T14:00:00Z', endAt: '2025-07-10T15:00:00Z',
			locationId: 'p1', favorite: false,
			eventType: {id: 't1', name: 'Concert', color: '#f00'},
			tags: [], startSegment: 0, segmentCount: 4, lane: 0,
		} as any;
```

- [ ] **Step 2: Změnit typ vstupu `event` na `IProgramEventLayout`**

V `src/app/modules/program/components/full-program/components/list-event/list-event.component.ts` přidat import za řádek 4 (`import {IProgramEvent} from '../../../../types/IProgramPlace';`):

```ts
import {IProgramEventLayout} from '../../types/IProgramPlaceLayout';
```

A změnit typ vstupu (řádky 19–20) z `public event: IProgramEvent;` na:

```ts
	@Input()
	public event: IProgramEventLayout;
```

> `IProgramEventLayout extends IProgramEvent`, takže `showDetail(event: IProgramEvent)` i `eventSelect: EventEmitter<IProgramEvent>` zůstávají beze změny.

- [ ] **Step 3: Přidat vertikální offset do šablony**

V `src/app/modules/program/components/full-program/components/list-event/list-event.component.html` přidat na `<button>` (za řádek 4 s `[style.width]`) binding `[style.top.px]`:

```html
@if (event) {
  <button class="place__segment__event text-overflow-ellipsis"
    [style.right]="-(fullProgramConfig.segmentWidth * (event.segmentCount - 1)) + 'px'"
    [style.width]="(fullProgramConfig.segmentWidth * (event.segmentCount - 1)) + fullProgramConfig.segmentWidth - 2 + 'px'"
    [style.top.px]="fullProgramConfig.laneStride * event.lane"
    [style.background-color]="event.eventType.color + ' !important'"
    (click)="showDetail(event)"
    >
```

(Zbytek šablony — `@if(event.favorite)`, `card-content`, `tag` — beze změny.)

- [ ] **Step 4: Spustit testy a ověřit, že prošly**

Run: `yarn run test`
Expected: PASS — `ListEventComponent` i celá suite zelené.

- [ ] **Step 5: Ověřit build**

Run: `yarn run build`
Expected: PASS — šablona čte `event.lane` (typ `IProgramEventLayout`).

- [ ] **Step 6: Commit**

```bash
git add src/app/modules/program/components/full-program/components/list-event/
git commit -m "feat(program): offset stacked events vertically by lane"
```

---

## Task 6: Finální ověření (build, testy, vizuální kontrola)

**Files:** žádné změny — verifikace.

- [ ] **Step 1: Plný build**

Run: `yarn run build`
Expected: PASS, bez chyb.

- [ ] **Step 2: Plný běh testů**

Run: `yarn run test`
Expected: PASS — všechny suites, včetně nových `layoutPlaceEvents` (7) a upravených `full-program`/`list-place`/`list-event`.

- [ ] **Step 3: Manuální vizuální kontrola (akceptační kritéria, která nejdou pokrýt unit testy)**

Spustit aplikaci a na dni s překrývajícími se eventy ověřit (ideálně na iOS WKWebView i Android Chromium):

- [ ] AK1: dva časově se překrývající eventy na stejném místě jsou pod sebou, oba plně viditelné.
- [ ] AK2: dva eventy se shodným začátkem jsou oba viditelné (žádná ztráta).
- [ ] AK3/AK6: místo bez překryvu má nezměněnou výšku 65px a žádnou lištu.
- [ ] AK4/AK8: místo s překryvem má zlatou sticky lištu vlevo; při horizontálním scrollu zůstane přilepená na `left:15px` (jako název místa) na obou platformách.
- [ ] AK5: vodorovná pozice/šířka eventu sedí s časovou osou nahoře i pod pinch-zoomem (0.4–1.0) — žádný drift.
- [ ] AK7: 3+ souběžných eventů → odpovídající počet pruhů, řádek roste.

- [ ] **Step 4: Commit (jen pokud manuální kontrola vyžádala drobnou korekci; jinak přeskočit)**

```bash
git add -A
git commit -m "fix(program): adjust overlapping-events layout after device check"
```

---

## Hotovo

Po Task 6 je feature kompletní: žádná ztráta eventů, překryvy naskládané pod sebou, zlatá sticky lišta u míst s překryvem, horizontální zarovnání s časovou osou nezměněné (strukturální flex grid).
