# Program Legend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact, mobile-first color/event-type legend to the program's collapsible secondary toolbar so users can tell what each calendar color means.

**Architecture:** A new standalone `EventLegendComponent` (`app-event-legend`) reads `ProgramService.eventTypes`, renders one wrapping chip (color dot + name) per type sorted alphabetically, and is placed inside `full-program__secondary-toolbar` below the existing refresh/language row. The toolbar's collapse animation moves from `mat-toolbar height` to the container's `max-height` so it grows to fit wrapped chips.

**Tech Stack:** Angular 21 (standalone components, `@if`/`@for` control flow, `inject()`), Angular Material toolbar, ngx-translate, jasmine/karma. Build: `npm run build`. Test: `npm run test`.

**Spec:** `docs/superpowers/specs/2026-06-10-program-legend-design.md`

---

## File Structure

- **Create:** `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.ts` — the legend component (getter returns alphabetically-sorted copy of `eventTypes`).
- **Create:** `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.html` — wrapping chips template.
- **Create:** `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.scss` — chip + swatch styling.
- **Create:** `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.spec.ts` — unit tests.
- **Modify:** `src/app/modules/program/components/full-program/full-program.component.ts` — import + register `EventLegendComponent`.
- **Modify:** `src/app/modules/program/components/full-program/full-program.component.html` — insert `<app-event-legend>` in the secondary toolbar.
- **Modify:** `src/app/modules/program/components/full-program/full-program.component.scss` — switch secondary-toolbar collapse to `max-height`.

> **Note on relative import depth:** `event-legend/` sits at the same depth as the existing `list-filter/`, so imports use the same prefixes: `../../../../services/program/program.service` and `../../../../types/IEventType`.

> **Note on change detection:** `EventLegendComponent` intentionally uses `ChangeDetectionStrategy.Default` (not OnPush). `ProgramService.eventTypes` is a plain array filled by `loadEventTypes()`, and **no signal fires after it is set** — an OnPush component without inputs would render empty and never refresh. Default CD re-reads the getter on the zone tick from the completed event-types HTTP request and on language change. The component is trivial, so the cost is negligible.

> **Note on indentation:** `full-program.component.scss` and `.ts` use **tabs**. Match the surrounding file's indentation when editing.

---

## Task 1: Scaffold EventLegendComponent (create test)

**Files:**
- Create: `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.spec.ts`
- Create: `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.ts`
- Create: `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.html`
- Create: `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.scss`

- [ ] **Step 1: Write the failing "should create" test**

Create `event-legend.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {EventLegendComponent} from './event-legend.component';
import {ProgramService} from '../../../../services/program/program.service';

describe('EventLegendComponent', () => {
	const mockProgramService = {
		eventTypes: [{id: 'concert', name: 'Concert', color: 'rgb(255, 0, 0)'}],
	};

	function createComponent() {
		TestBed.configureTestingModule({
			imports: [EventLegendComponent, TranslateModule.forRoot()],
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
			],
		});
		const fixture = TestBed.createComponent(EventLegendComponent);
		fixture.detectChanges();
		return fixture;
	}

	afterEach(() => {
		mockProgramService.eventTypes = [{id: 'concert', name: 'Concert', color: 'rgb(255, 0, 0)'}];
	});

	it('should create', () => {
		const fixture = createComponent();
		expect(fixture.componentInstance).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- --include='**/event-legend.component.spec.ts' --watch=false`
Expected: FAIL — cannot find module `./event-legend.component` (component not created yet).

> If the project's karma config does not support `--include`, run the full suite (`npm run test -- --watch=false`) and look for the `EventLegendComponent` failures.

- [ ] **Step 3: Create the component with minimal template + styles**

Create `event-legend.component.ts`:

```typescript
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {ProgramService} from '../../../../services/program/program.service';
import {IEventType} from '../../../../types/IEventType';
import {TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-event-legend',
	imports: [],
	templateUrl: './event-legend.component.html',
	styleUrls: ['./event-legend.component.scss'],
	// Default CD (not OnPush): programService.eventTypes is a plain array filled by an
	// HTTP request that emits no signal afterwards. An OnPush component without inputs
	// would render empty and never refresh. The component is trivial, so default CD is cheap.
	changeDetection: ChangeDetectionStrategy.Default,
})
export class EventLegendComponent {
	private readonly programService: ProgramService = inject(ProgramService);
	private readonly translate: TranslateService = inject(TranslateService);

	protected get eventTypes(): IEventType[] {
		return [...this.programService.eventTypes]
			.sort((a, b) => a.name.localeCompare(b.name, this.translate.currentLang));
	}
}
```

Create `event-legend.component.html`:

```html
@if (eventTypes.length > 0) {
	<div class="event-legend">
		@for (type of eventTypes; track type.id) {
			<span class="event-legend__item">
				<span class="event-legend__swatch" [style.background-color]="type.color"></span>
				<span class="event-legend__label">{{ type.name }}</span>
			</span>
		}
	</div>
}
```

Create `event-legend.component.scss`:

```scss
.event-legend {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 12px;
	padding: 8px 16px 12px;

	&__item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
	}

	&__swatch {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	&__label {
		color: #ffffff;
		font-size: 12px;
		line-height: 1;
	}
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- --include='**/event-legend.component.spec.ts' --watch=false`
Expected: PASS (1 spec).

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/program/components/full-program/components/event-legend/
git commit -m "feat(program): scaffold event legend component"
```

---

## Task 2: Render, sort, and guard the legend chips

**Files:**
- Modify: `src/app/modules/program/components/full-program/components/event-legend/event-legend.component.spec.ts`

The component implementation from Task 1 already satisfies these behaviors. This task adds the tests that lock them in (rendering, name, color, alphabetical sort, empty guard, no-mutation). If any test fails, fix the component/template to match.

- [ ] **Step 1: Add the behavior tests**

Append these `it` blocks inside the `describe('EventLegendComponent', ...)` block in `event-legend.component.spec.ts` (after the `should create` test):

```typescript
	it('renders one chip per event type', () => {
		mockProgramService.eventTypes = [
			{id: 'a', name: 'Concert', color: 'rgb(255, 0, 0)'},
			{id: 'b', name: 'Workshop', color: 'rgb(0, 255, 0)'},
		];

		const fixture = createComponent();

		const items = fixture.nativeElement.querySelectorAll('.event-legend__item');
		expect(items.length).toBe(2);
	});

	it('shows the event type name', () => {
		const fixture = createComponent();

		const label = fixture.nativeElement.querySelector('.event-legend__label');
		expect(label.textContent.trim()).toBe('Concert');
	});

	it('sets the swatch background to the type color', () => {
		const fixture = createComponent();

		const swatch = fixture.nativeElement.querySelector('.event-legend__swatch');
		expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)');
	});

	it('sorts event types alphabetically by name', () => {
		mockProgramService.eventTypes = [
			{id: 'c', name: 'Cinema', color: 'rgb(0, 0, 0)'},
			{id: 'a', name: 'Adventure', color: 'rgb(0, 0, 0)'},
			{id: 'b', name: 'Ballet', color: 'rgb(0, 0, 0)'},
		];

		const fixture = createComponent();

		const labels = (Array.from(fixture.nativeElement.querySelectorAll('.event-legend__label')) as HTMLElement[])
			.map((el) => el.textContent?.trim());
		expect(labels).toEqual(['Adventure', 'Ballet', 'Cinema']);
	});

	it('renders nothing when there are no event types', () => {
		mockProgramService.eventTypes = [];

		const fixture = createComponent();

		expect(fixture.nativeElement.querySelector('.event-legend')).toBeNull();
	});

	it('does not mutate the service array', () => {
		mockProgramService.eventTypes = [
			{id: 'c', name: 'Cinema', color: 'rgb(0, 0, 0)'},
			{id: 'a', name: 'Adventure', color: 'rgb(0, 0, 0)'},
		];

		createComponent();

		expect(mockProgramService.eventTypes.map((t) => t.id)).toEqual(['c', 'a']);
	});
```

- [ ] **Step 2: Run the tests**

Run: `npm run test -- --include='**/event-legend.component.spec.ts' --watch=false`
Expected: PASS (7 specs). The swatch color test asserts `rgb(255, 0, 0)` because the mock supplies the color already in `rgb(...)` form (browsers normalize inline `background-color` to `rgb`, so this avoids hex-vs-rgb flakiness).

> If `does not mutate` fails, the component is sorting in place — confirm the getter spreads (`[...this.programService.eventTypes]`) before `.sort()`.

- [ ] **Step 3: Commit**

```bash
git add src/app/modules/program/components/full-program/components/event-legend/event-legend.component.spec.ts
git commit -m "test(program): cover event legend rendering, sorting, and guards"
```

---

## Task 3: Integrate the legend into the secondary toolbar

**Files:**
- Modify: `src/app/modules/program/components/full-program/full-program.component.ts`
- Modify: `src/app/modules/program/components/full-program/full-program.component.html`
- Modify: `src/app/modules/program/components/full-program/full-program.component.scss`

> The existing `full-program.component.spec.ts` mock (`MockProgramService`) already declares `eventTypes: IEventType[] = []`, so the embedded `<app-event-legend>` renders nothing and the suite stays green without changes.

- [ ] **Step 1: Register the component in `full-program.component.ts`**

Add the import near the other component imports (e.g. after the `LanguageMenuComponent` import on line 28):

```typescript
import {EventLegendComponent} from './components/event-legend/event-legend.component';
```

Add `EventLegendComponent` to the `imports` array of the `@Component` decorator (e.g. after `LanguageMenuComponent,`):

```typescript
    LanguageMenuComponent,
    EventLegendComponent,
    MatMenuModule,
```

- [ ] **Step 2: Insert the legend in `full-program.component.html`**

In the secondary toolbar block, add `<app-event-legend>` as a sibling immediately after the closing `</mat-toolbar>`, still inside `#secondaryToolbar`. Replace:

```html
        <div #secondaryToolbar class="full-program__secondary-toolbar">
            <mat-toolbar>
                <button mat-icon-button (click)="refreshApp()">
                    <mat-icon>refresh</mat-icon>
                </button>
                <div class="full-program__secondary-toolbar__actions">
                    <app-language-menu></app-language-menu>
```

…leave the commented-out blocks and the `</div>` / `</mat-toolbar>` as they are, and insert the legend right after `</mat-toolbar>`:

```html
                </div>
            </mat-toolbar>
            <app-event-legend></app-event-legend>
        </div>
```

The final structure of that block must be:

```html
        <div #secondaryToolbar class="full-program__secondary-toolbar">
            <mat-toolbar>
                <button mat-icon-button (click)="refreshApp()">
                    <mat-icon>refresh</mat-icon>
                </button>
                <div class="full-program__secondary-toolbar__actions">
                    <app-language-menu></app-language-menu>
                </div>
            </mat-toolbar>
            <app-event-legend></app-event-legend>
        </div>
```

- [ ] **Step 3: Switch the collapse animation to `max-height` in `full-program.component.scss`**

Replace the entire `&__secondary-toolbar { ... }` block (currently animating `mat-toolbar` height 0→60px) with:

```scss
	&__secondary-toolbar {
		background-color: #151515;
		max-height: 0;
		overflow: hidden;
		transition: max-height 0.3s ease-in-out;

		mat-toolbar {
			background-color: #151515;
			height: 60px;
		}

		&.opened {
			max-height: 50vh;
			overflow: auto;
		}

		&__actions {
			margin-left: auto;
			display: flex;
			align-items: center;
		}
	}
```

(Use tabs to match the file. The `.opened` class is toggled on the `.full-program__secondary-toolbar` element by `toggleSecondaryToolbar()`, so the whole section — toolbar row + legend — now expands/collapses together.)

- [ ] **Step 4: Build to verify the template/imports compile**

Run: `npm run build`
Expected: build succeeds with no template or import errors.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test -- --watch=false`
Expected: PASS — the new `EventLegendComponent` specs pass and the existing `FullProgramComponent` suite stays green (its mock provides `eventTypes: []`).

- [ ] **Step 6: Commit**

```bash
git add src/app/modules/program/components/full-program/full-program.component.ts \
        src/app/modules/program/components/full-program/full-program.component.html \
        src/app/modules/program/components/full-program/full-program.component.scss
git commit -m "feat(program): show event-type legend in secondary toolbar"
```

---

## Self-Review

**Spec coverage:**
- New `EventLegendComponent` (standalone, default CD, sorted-copy getter) → Task 1.
- Template (chip = swatch + name, `@if` guard, `@for` track by id) → Task 1, asserted in Task 2.
- Alphabetical sort, color binding, empty guard, no-mutation → Task 2 tests.
- Default CD rationale → documented in component comment (Task 1) and plan note.
- Placement in secondary toolbar + import registration → Task 3 steps 1–2.
- `max-height` collapse animation (toolbar grows to fit wrapped chips) → Task 3 step 3.
- Edge cases (0 types hidden, many types wrap, long name no inner break) → covered by `@if` guard + `flex-wrap` + `white-space: nowrap`.
- Mobile-first wrapping (user choice "zalamovat — toolbar roste") → `flex-wrap: wrap` + container `max-height` growth.

**Out of scope (correctly omitted):** click-to-filter, per-language type names, backend/admin changes.

**Type consistency:** `IEventType { id; name; color }` used consistently. Selector `app-event-legend` and class `EventLegendComponent` match across component, spec, and `full-program` import. Getter name `eventTypes` matches template usage. CSS class names (`event-legend`, `__item`, `__swatch`, `__label`) match between template, scss, and spec selectors.

**No placeholders:** every step contains the full code/commands.
