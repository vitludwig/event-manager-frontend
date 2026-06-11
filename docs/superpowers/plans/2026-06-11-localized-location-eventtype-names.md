# Localized Location & Event-Type Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show location and event-type names per language in the mobile app (EN → `nameEn`, else `name`), with `name` as fallback, sourced from the festival-planner public API.

**Architecture:** A single pure `localizedName(obj, lang)` helper + a standalone `LocalizedNamePipe` drive every display site in the mobile app; list sorts use the same helper. On the backend, one shared Prisma select + mapper per entity (location, event type) defines `nameEn` once and is reused by `/public/events`, `/public/locations`, and `/public/event-types`.

**Tech Stack:** Angular 21 (standalone pipe, jasmine/karma) for mobile; NestJS + Prisma (Docker, no public.service spec → verify via the running endpoint) for festival-planner.

**Spec:** `docs/superpowers/specs/2026-06-11-localized-location-eventtype-names-design.md`

**Repos & branches:**
- mobile: `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`, branch `mobile-app`. Build `npm run build`, test `npm run test`. TABS. Unrelated uncommitted changes exist — stage only listed files.
- backend: `/home/vitek/Projects/RZB-IT/festival-planner`, branch `feature/festival-admin-features`. Runs in Docker (service `backend`, hot-reload). Unrelated uncommitted `Dockerfile` change exists — never `git add -A`.

---

## File Structure

**mobile (new):**
- `src/app/modules/program/pipes/localized-name/localized-name.ts` — `ILocalizedName` interface + pure `localizedName(obj, lang)`.
- `src/app/modules/program/pipes/localized-name/localized-name.spec.ts` — helper tests.
- `src/app/modules/program/pipes/localized-name/localized-name.pipe.ts` — `LocalizedNamePipe`.
- `src/app/modules/program/pipes/localized-name/localized-name.pipe.spec.ts` — pipe tests.

**mobile (modified):**
- `src/app/modules/program/types/IProgramPlace.ts`, `.../types/IEventType.ts` — add `nameEn?`.
- 6 templates + their components' `imports`, and 2 sort sites (list-filter, event-legend).

**backend (modified):**
- `apps/backend/src/public/public.service.ts` — shared selects + mappers.

---

## Task 1: `localizedName` helper

**Files:**
- Create: `src/app/modules/program/pipes/localized-name/localized-name.ts`
- Test: `src/app/modules/program/pipes/localized-name/localized-name.spec.ts`

Work from the **mobile** repo.

- [ ] **Step 1: Write the failing tests**

Create `localized-name.spec.ts`:

```typescript
import {localizedName} from './localized-name';

describe('localizedName', () => {
	it('returns name when language is not en', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: 'Main stage'}, 'cs')).toBe('Hlavní stage');
	});

	it('returns name when language is undefined (default)', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: 'Main stage'}, undefined)).toBe('Hlavní stage');
	});

	it('returns nameEn when language is en and nameEn is set', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: 'Main stage'}, 'en')).toBe('Main stage');
	});

	it('falls back to name when language is en but nameEn is empty', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: ''}, 'en')).toBe('Hlavní stage');
	});

	it('falls back to name when language is en but nameEn is null', () => {
		expect(localizedName({name: 'Hlavní stage', nameEn: null}, 'en')).toBe('Hlavní stage');
	});

	it('falls back to name when nameEn is undefined', () => {
		expect(localizedName({name: 'Hlavní stage'}, 'en')).toBe('Hlavní stage');
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- --include='**/localized-name.spec.ts' --watch=false`
Expected: FAIL — cannot find module `./localized-name`.

- [ ] **Step 3: Implement the helper**

Create `localized-name.ts`:

```typescript
export interface ILocalizedName {
	name: string;
	nameEn?: string | null;
}

/**
 * Per-language display name: English uses nameEn when present, otherwise the
 * Czech `name` is used (both for Czech and as the English fallback).
 */
export function localizedName(obj: ILocalizedName, lang: string | undefined): string {
	return lang === 'en' && obj.nameEn ? obj.nameEn : obj.name;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- --include='**/localized-name.spec.ts' --watch=false`
Expected: PASS (6 specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/program/pipes/localized-name/localized-name.ts \
        src/app/modules/program/pipes/localized-name/localized-name.spec.ts
git commit -m "feat(program): localizedName helper for per-language names"
```

---

## Task 2: `LocalizedNamePipe`

**Files:**
- Create: `src/app/modules/program/pipes/localized-name/localized-name.pipe.ts`
- Test: `src/app/modules/program/pipes/localized-name/localized-name.pipe.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `localized-name.pipe.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {LocalizedNamePipe} from './localized-name.pipe';

describe('LocalizedNamePipe', () => {
	function makePipe(lang: string | undefined): LocalizedNamePipe {
		TestBed.configureTestingModule({
			providers: [LocalizedNamePipe, {provide: TranslateService, useValue: {currentLang: lang}}],
		});
		return TestBed.inject(LocalizedNamePipe);
	}

	it('returns the Czech name when language is cs', () => {
		expect(makePipe('cs').transform({name: 'Hlavní', nameEn: 'Main'})).toBe('Hlavní');
	});

	it('returns nameEn when language is en', () => {
		expect(makePipe('en').transform({name: 'Hlavní', nameEn: 'Main'})).toBe('Main');
	});

	it('falls back to name when en but nameEn is null', () => {
		expect(makePipe('en').transform({name: 'Hlavní', nameEn: null})).toBe('Hlavní');
	});

	it('returns an empty string for null/undefined input', () => {
		expect(makePipe('en').transform(null)).toBe('');
		expect(makePipe('en').transform(undefined)).toBe('');
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- --include='**/localized-name.pipe.spec.ts' --watch=false`
Expected: FAIL — cannot find module `./localized-name.pipe`.

- [ ] **Step 3: Implement the pipe**

Create `localized-name.pipe.ts`:

```typescript
import {inject, Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ILocalizedName, localizedName} from './localized-name';

@Pipe({
	name: 'localizedName',
	standalone: true,
})
export class LocalizedNamePipe implements PipeTransform {
	readonly #translate: TranslateService = inject(TranslateService);

	public transform(obj: ILocalizedName | null | undefined): string {
		if (!obj) {
			return '';
		}
		return localizedName(obj, this.#translate.currentLang);
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- --include='**/localized-name.pipe.spec.ts' --watch=false`
Expected: PASS (4 specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/program/pipes/localized-name/localized-name.pipe.ts \
        src/app/modules/program/pipes/localized-name/localized-name.pipe.spec.ts
git commit -m "feat(program): LocalizedNamePipe (per-language name display)"
```

---

## Task 3: Add `nameEn` to types and wire the pipe + sorts into all sites

**Files:**
- Modify: `src/app/modules/program/types/IProgramPlace.ts`
- Modify: `src/app/modules/program/types/IEventType.ts`
- Modify (templates + imports): `list-filter.component.{html,ts}`, `list-place.component.{html,ts}`, `program-vertical-list.component.{html,ts}`, `event-detail-full.component.{html,ts}`, `event-detail-preview.component.{html,ts}`, `event-legend.component.{html,ts}`

> **Pipe import paths** (from each component file to the pipe at `src/app/modules/program/pipes/localized-name/`):
> - `full-program/components/<x>/` (list-filter, list-place, event-legend, event-detail-preview): `../../../../pipes/localized-name/localized-name.pipe`
> - `program/components/<x>/` (program-vertical-list, event-detail-full): `../../pipes/localized-name/localized-name.pipe`
> The sort sites also import the helper `localizedName` from `.../localized-name/localized-name` (same prefix, no `.pipe`).

- [ ] **Step 1: Add `nameEn` to the two types**

In `IProgramPlace.ts`, the `IProgramPlace` interface:
```typescript
export interface IProgramPlace {
	id: string;
	name: string;
	nameEn?: string | null;
	order?: number;
}
```

In `IEventType.ts`:
```typescript
export interface IEventType {
	id: string;
	name: string;
	nameEn?: string | null;
	color: string;
}
```

- [ ] **Step 2: Wire the pipe into the place-name templates**

For each, add `LocalizedNamePipe` to the component's `@Component` `imports` array and the import line (path per the note above), then change the template:

- `list-place.component.html` line 5: `{{place.name}}` → `{{ place | localizedName }}`
- `program-vertical-list.component.html` line 33: `{{event.location.name }}` → `{{ event.location | localizedName }}`
- `event-detail-full.component.html` line 19: `{{ place.name }}` → `{{ place | localizedName }}`
- `list-filter.component.html` line 24: `{{ place.name }}` → `{{ place | localizedName }}`

- [ ] **Step 3: Wire the pipe into the event-type-name templates**

(Some components were already touched in Step 2 — add the pipe import/imports-array only once per component.)

- `event-legend.component.html` line 7: `{{ type.name }}` → `{{ type | localizedName }}`
- `list-filter.component.html` line 39: `{{ item.name }}` → `{{ item | localizedName }}`
- `event-detail-full.component.html` line 15: `{{ event.eventType.name }}` → `{{ event.eventType | localizedName }}`
- `event-detail-preview.component.html` line 9: `{{ data.event.eventType.name }}` → `{{ data.event.eventType | localizedName }}`
- `program-vertical-list.component.html` line 31: `{{ event.eventType.name }}` → `{{ event.eventType | localizedName }}`

(Do NOT touch `list-filter.component.html` line 55 — that is the tag label, which uses `nameCs/nameEn`.)

- [ ] **Step 4: Sort by the localized name in list-filter**

In `list-filter.component.ts`, add the helper import:
```typescript
import {localizedName} from '../../../../pipes/localized-name/localized-name';
```
Change the `places` and `eventTypes` field sorts (leave `tags` as-is):
```typescript
	protected places: IProgramPlace[] = [...this.programService.allPlaces]
		.sort((a, b) => localizedName(a, this.translate.currentLang)
			.localeCompare(localizedName(b, this.translate.currentLang), this.translate.currentLang));
	protected eventTypes: IEventType[] = [...this.programService.eventTypes()]
		.sort((a, b) => localizedName(a, this.translate.currentLang)
			.localeCompare(localizedName(b, this.translate.currentLang), this.translate.currentLang));
```

- [ ] **Step 5: Sort by the localized name in event-legend**

In `event-legend.component.ts`, add:
```typescript
import {localizedName} from '../../../../pipes/localized-name/localized-name';
```
Change the getter sort:
```typescript
	protected get eventTypes(): IEventType[] {
		const lang = this.translate.currentLang;
		return [...this.programService.eventTypes()]
			.sort((a, b) => localizedName(a, lang).localeCompare(localizedName(b, lang), lang));
	}
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: build succeeds — every component that uses `| localizedName` must have `LocalizedNamePipe` in its `imports` (a missing one fails the template build with "No pipe found with name 'localizedName'").

- [ ] **Step 7: Run the full test suite**

Run: `npm run test -- --watch=false`
Expected: PASS — existing suites green (list-filter sorting tests still pass: in the default test language, `localizedName` returns `name`, so ordering is unchanged).

- [ ] **Step 8: Commit**

```bash
git add src/app/modules/program/types/IProgramPlace.ts \
        src/app/modules/program/types/IEventType.ts \
        src/app/modules/program/components/full-program/components/list-filter/list-filter.component.html \
        src/app/modules/program/components/full-program/components/list-filter/list-filter.component.ts \
        src/app/modules/program/components/full-program/components/list-place/list-place.component.html \
        src/app/modules/program/components/full-program/components/list-place/list-place.component.ts \
        src/app/modules/program/components/full-program/components/event-legend/event-legend.component.html \
        src/app/modules/program/components/full-program/components/event-legend/event-legend.component.ts \
        src/app/modules/program/components/full-program/components/event-detail-preview/event-detail-preview.component.html \
        src/app/modules/program/components/full-program/components/event-detail-preview/event-detail-preview.component.ts \
        src/app/modules/program/components/program-vertical-list/program-vertical-list.component.html \
        src/app/modules/program/components/program-vertical-list/program-vertical-list.component.ts \
        src/app/modules/program/components/event-detail-full/event-detail-full.component.html \
        src/app/modules/program/components/event-detail-full/event-detail-full.component.ts
git commit -m "feat(program): display location & event-type names per language"
```

---

## Task 4: Backend — single-source `nameEn` projection on `/public/events`

**Files:**
- Modify: `apps/backend/src/public/public.service.ts`

Work from the **festival-planner** repo (`/home/vitek/Projects/RZB-IT/festival-planner`). No unit-test infra for PublicService — verify via the running endpoint (backend hot-reloads).

- [ ] **Step 1: Add the shared selects + mappers**

In `public.service.ts`, after the imports and before the `@Injectable()` class declaration, add:

```typescript
const PUBLIC_LOCATION_SELECT = { name: true, nameEn: true } as const;
const PUBLIC_EVENT_TYPE_SELECT = { name: true, nameEn: true, color: true } as const;

const mapPublicLocation = (l: { name: string; nameEn: string | null }) => ({
  name: l.name,
  nameEn: l.nameEn,
});
const mapPublicEventType = (t: {
  name: string;
  nameEn: string | null;
  color: string;
}) => ({
  name: t.name,
  nameEn: t.nameEn,
  color: t.color,
});
```

- [ ] **Step 2: Use them in `getPublicEvents`**

In the `findMany` `include`, replace the `location` and `eventType` selects:
```typescript
        location: {
          select: PUBLIC_LOCATION_SELECT,
        },
        eventType: {
          select: PUBLIC_EVENT_TYPE_SELECT,
        },
```
In the `.map(...)` return object, replace the `location` and `eventType` lines:
```typescript
      location: mapPublicLocation(event.location),
      eventType: mapPublicEventType(event.eventType),
```

- [ ] **Step 3: Use them in `getLocations` and `getEventTypes`**

`getLocations`:
```typescript
  async getLocations() {
    const locations = await this.prisma.location.findMany({
      select: { id: true, order: true, ...PUBLIC_LOCATION_SELECT },
      orderBy: { order: 'asc' },
    });

    return locations.map((l) => ({
      id: l.id,
      order: l.order,
      ...mapPublicLocation(l),
    }));
  }
```

`getEventTypes`:
```typescript
  async getEventTypes() {
    const types = await this.prisma.eventType.findMany({
      select: { id: true, ...PUBLIC_EVENT_TYPE_SELECT },
    });

    return types.map((t) => ({
      id: t.id,
      ...mapPublicEventType(t),
    }));
  }
```

- [ ] **Step 4: Verify the backend compiled and the endpoints expose nameEn**

The backend hot-reloads. Confirm a clean compile and that `/public/events` now embeds `nameEn`:

```bash
docker compose -f /home/vitek/Projects/RZB-IT/festival-planner/docker-compose.yml logs --tail=20 backend 2>&1 | grep -iE "error|compiled|Nest application" | tail -5
curl -s http://localhost:3001/public/events | python3 -c "import sys,json; d=json.load(sys.stdin); e=d[0] if d else {}; print('location keys:', list((e.get('location') or {}).keys())); print('eventType keys:', list((e.get('eventType') or {}).keys()))"
curl -s http://localhost:3001/public/locations | python3 -c "import sys,json; d=json.load(sys.stdin); print('locations[0] keys:', list((d[0] if d else {}).keys()))"
curl -s http://localhost:3001/public/event-types | python3 -c "import sys,json; d=json.load(sys.stdin); print('event-types[0] keys:', list((d[0] if d else {}).keys()))"
```
Expected: `location keys` and `eventType keys` from `/public/events` both include `nameEn`; `/public/locations` keys = `id, name, nameEn, order`; `/public/event-types` keys = `id, name, nameEn, color`. No compile errors in the logs.

- [ ] **Step 5: Commit (stage only public.service.ts)**

```bash
cd /home/vitek/Projects/RZB-IT/festival-planner
git add apps/backend/src/public/public.service.ts
git commit -m "feat(public): expose location & event-type nameEn from a single source"
```

---

## Self-Review

**Spec coverage:**
- Backend single-source selects + mappers used by all 3 methods → Task 4. `/public/events` now embeds `nameEn` for location + eventType → Task 4 Step 2, verified Step 4.
- `nameEn?` on `IProgramPlace` + `IEventType` → Task 3 Step 1.
- `localizedName` helper (en+nameEn→nameEn; else name; empty/null→name) → Task 1.
- `LocalizedNamePipe` → Task 2.
- Pipe at all 9 sites (4 place + 5 event-type) → Task 3 Steps 2–3.
- Sort by localized name in list-filter (places + eventTypes) and event-legend → Task 3 Steps 4–5.
- Tags untouched (line 55) → explicitly excluded in Task 3 Step 3.
- Fallback table (cs→name, en+nameEn→nameEn, en+empty→name) → covered by `localizedName` + its tests (Task 1).

**Placeholder scan:** none — every step has concrete code/commands.

**Type/name consistency:** `localizedName(obj, lang)` and `ILocalizedName` identical across helper, pipe, and the two sort sites. Pipe name `localizedName` matches all template usages. `nameEn?: string | null` identical on both interfaces and the backend mappers (`nameEn: string | null`). Import path prefixes match each component's directory depth (4-deep for `full-program/components/*`, 2-deep for `program/components/*`).
