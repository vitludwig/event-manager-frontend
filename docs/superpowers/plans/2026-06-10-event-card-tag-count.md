# Configurable Event-Card Tag Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin set a number (0–n) controlling how many tags show in the program-calendar event card; the mobile app reflects it (unset = 1, today's behavior).

**Architecture:** New customization key `eventCardTagCount` carried over the existing key-value flow (admin form → `bulkUpsert` → DB → `GET /public/customization` → mobile `CustomizationService`). Backend just allow-lists the key; the admin gets a `NumberInput`; the mobile `list-event` card slices `event.tags` to the configured count. Preview and full detail are untouched (always all tags).

**Tech Stack:** NestJS + Prisma + jest (backend), Next.js + Mantine (admin, no unit-test infra → typecheck), Angular 21 + jasmine/karma (mobile). festival-planner runs in Docker.

**Spec:** `docs/superpowers/specs/2026-06-10-event-card-tag-count-design.md` (in the event-manager-frontend repo).

---

## Repos & branches

- **festival-planner** — `/home/vitek/Projects/RZB-IT/festival-planner`. Tasks 1–2. Commit on the current branch (`feature/configurable-map-titles`). There is an unrelated uncommitted change in the tree (`apps/frontend/Dockerfile`); **never `git add -A`** — stage only the exact files each task lists.
- **event-manager-frontend** — `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`. Tasks 3–4. Commit on `mobile-app`. Unrelated uncommitted changes exist in this tree too — stage only the exact files listed.

## File Structure

**festival-planner:**
- Modify `apps/backend/src/customization/dto/upsert-customization.dto.ts` — add key to `ALLOWED_KEYS` + `PUBLIC_CUSTOMIZATION_KEYS`.
- Modify `apps/backend/src/customization/customization.service.spec.ts` — allow-list assertions.
- Modify `apps/frontend/src/app/admin/customization/page.tsx` — form field + `NumberInput`.

**event-manager-frontend:**
- Modify `src/app/common/services/customization/customization.service.ts` — `ICustomization` field + `eventCardTagCount` getter.
- Modify `src/app/common/services/customization/customization.service.spec.ts` — getter tests.
- Modify `.../list-event/list-event.component.ts` — inject `CustomizationService`, `visibleTags` getter.
- Modify `.../list-event/list-event.component.html` — loop over `visibleTags`.
- Modify `.../list-event/list-event.component.scss` — `.tags` container.
- Modify `.../list-event/list-event.component.spec.ts` — `CustomizationService` mock + `visibleTags` tests.

---

## Task 1: Backend — allow-list `eventCardTagCount`

**Files:**
- Modify: `apps/backend/src/customization/dto/upsert-customization.dto.ts`
- Test: `apps/backend/src/customization/customization.service.spec.ts`

Work from `/home/vitek/Projects/RZB-IT/festival-planner`. The backend runs in Docker; run jest inside the container.

- [ ] **Step 1: Write the failing test**

In `customization.service.spec.ts`, add this `describe` block right after the existing `describe('configurableButtonIcon key', ...)` block (it ends around line 44):

```typescript
  describe('eventCardTagCount key', () => {
    it('is an allowed customization key', () => {
      expect(ALLOWED_CUSTOMIZATION_KEYS).toContain('eventCardTagCount');
    });

    it('is exposed as a public customization key', () => {
      expect(PUBLIC_CUSTOMIZATION_KEYS).toContain('eventCardTagCount');
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose exec -T backend npx jest src/customization/customization.service.spec.ts`
Expected: FAIL — the two new assertions fail (`eventCardTagCount` not in the arrays).

- [ ] **Step 3: Add the key to both allow-lists**

In `upsert-customization.dto.ts`, add `'eventCardTagCount',` to `ALLOWED_KEYS` (after `'configurableButtonIcon',` on line 16):

```typescript
  'configurableButtonIcon',
  'eventCardTagCount',
  'festivalId',
```

And add `'eventCardTagCount',` to `PUBLIC_CUSTOMIZATION_KEYS` (after `'configurableButtonIcon',` on line 37):

```typescript
  'configurableButtonIcon',
  'eventCardTagCount',
  'festivalId',
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker compose exec -T backend npx jest src/customization/customization.service.spec.ts`
Expected: PASS (all `CustomizationService` specs green, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/customization/dto/upsert-customization.dto.ts \
        apps/backend/src/customization/customization.service.spec.ts
git commit -m "feat(customization): allow-list eventCardTagCount key"
```

---

## Task 2: Admin — `NumberInput` for the tag count

**Files:**
- Modify: `apps/frontend/src/app/admin/customization/page.tsx`

Work from `/home/vitek/Projects/RZB-IT/festival-planner`. No unit-test infra for the admin app — verify with a TypeScript typecheck in the frontend container. There is no TDD here; make the edits, then typecheck.

- [ ] **Step 1: Import `NumberInput`**

In `page.tsx`, the `@mantine/core` import currently begins (line 4):

```tsx
    Title, Paper, Button, Group, TextInput, Textarea,
```

Add `NumberInput`:

```tsx
    Title, Paper, Button, Group, TextInput, Textarea, NumberInput,
```

- [ ] **Step 2: Add the field to `initialValues`**

In the `useForm({ initialValues: { ... } })` block, add after `configurableButtonIcon: '',` (line 33):

```tsx
            configurableButtonIcon: '',
            eventCardTagCount: '' as string | number,
            festivalId: '',
```

(The `as string | number` lets the field hold either the empty string "unset" or the `NumberInput`'s numeric value without a TS mismatch.)

- [ ] **Step 3: Map it on load**

In `loadData`'s `form.setValues({ ... })`, add after `configurableButtonIcon: data.configurableButtonIcon ?? '',` (line 59):

```tsx
                    configurableButtonIcon: data.configurableButtonIcon ?? '',
                    eventCardTagCount: data.eventCardTagCount ?? '',
                    festivalId: data.festivalId ?? '',
```

- [ ] **Step 4: Include it in the submit payload**

In `handleSubmit`'s `const items: Record<string, unknown> = { ... }`, add after `configurableButtonIcon: values.configurableButtonIcon,` (line 133):

```tsx
                configurableButtonIcon: values.configurableButtonIcon,
                eventCardTagCount: values.eventCardTagCount,
                festivalId: values.festivalId,
```

- [ ] **Step 5: Add the `NumberInput` to the form UI**

Right after the configurable-button `</Stack>` (line 273) and before the `<Divider my="lg" />` that precedes the "Integrations" title (line 275), insert:

```tsx
                    <Divider my="lg" />
                    <Title order={4} mb="sm">Program</Title>
                    <NumberInput
                        label="Event card tag count"
                        description="How many tags to show on a program-calendar event card. Empty = 1 (default). 0 = none."
                        placeholder="1"
                        min={0}
                        step={1}
                        allowDecimal={false}
                        clampBehavior="strict"
                        {...form.getInputProps('eventCardTagCount')}
                        mb="sm"
                    />
```

- [ ] **Step 6: Typecheck**

Run: `docker compose exec -T frontend npx tsc --noEmit`
Expected: no type errors. (If the standalone `tsc` run surfaces Next-generated config noise unrelated to this change, fall back to confirming the `/admin/customization` route recompiles cleanly: `docker compose logs --tail=30 frontend` should show a successful compile with no errors after the file is saved.)

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/app/admin/customization/page.tsx
git commit -m "feat(customization): admin NumberInput for event card tag count"
```

---

## Task 3: Mobile — `CustomizationService.eventCardTagCount` getter

**Files:**
- Modify: `src/app/common/services/customization/customization.service.ts`
- Test: `src/app/common/services/customization/customization.service.spec.ts`

Work from `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`.

- [ ] **Step 1: Write the failing tests**

In `customization.service.spec.ts`, add this `describe` block inside the top-level `describe('CustomizationService', ...)`, after the existing `it('keeps labelCs/labelEn ...')` test:

```typescript
	describe('eventCardTagCount', () => {
		it('returns undefined when unset', () => {
			(service as any).data.set({});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('returns undefined for an empty string', () => {
			(service as any).data.set({eventCardTagCount: ''});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('parses a numeric string', () => {
			(service as any).data.set({eventCardTagCount: '3'});
			expect(service.eventCardTagCount).toBe(3);
		});

		it('treats 0 as a valid value', () => {
			(service as any).data.set({eventCardTagCount: '0'});
			expect(service.eventCardTagCount).toBe(0);
		});

		it('returns undefined for negative values', () => {
			(service as any).data.set({eventCardTagCount: '-2'});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('returns undefined for non-numeric values', () => {
			(service as any).data.set({eventCardTagCount: 'abc'});
			expect(service.eventCardTagCount).toBeUndefined();
		});

		it('floors a fractional number', () => {
			(service as any).data.set({eventCardTagCount: 2.7});
			expect(service.eventCardTagCount).toBe(2);
		});
	});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- --include='**/customization.service.spec.ts' --watch=false`
Expected: FAIL — `service.eventCardTagCount` does not exist yet (compile error / undefined property).

- [ ] **Step 3: Add the field and getter**

In `customization.service.ts`, add to the `ICustomization` interface (after `configurableButtonIcon?: string;` on line 18):

```typescript
	configurableButtonIcon?: string;
	eventCardTagCount?: number | string;
```

Add the getter after the `configurableButtonIcon` getter (which ends around line 83):

```typescript
	public get eventCardTagCount(): number | undefined {
		const raw = this.data().eventCardTagCount;
		// Guard "unset" BEFORE Number(): Number('') === 0 would otherwise hide all tags.
		if (raw === undefined || raw === null || raw === '') {
			return undefined;
		}
		const n = Number(raw);
		if (Number.isNaN(n) || n < 0) {
			return undefined;
		}
		return Math.floor(n);
	}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- --include='**/customization.service.spec.ts' --watch=false`
Expected: PASS (the original map test + 7 new specs).

- [ ] **Step 5: Commit**

```bash
git add src/app/common/services/customization/customization.service.ts \
        src/app/common/services/customization/customization.service.spec.ts
git commit -m "feat(customization): parse eventCardTagCount from public customization"
```

---

## Task 4: Mobile — `list-event` card renders N tags

**Files:**
- Modify: `.../list-event/list-event.component.ts`
- Modify: `.../list-event/list-event.component.html`
- Modify: `.../list-event/list-event.component.scss`
- Test: `.../list-event/list-event.component.spec.ts`

Full directory: `src/app/modules/program/components/full-program/components/list-event/`. Work from `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`.

> **DI note:** `ListEventComponent` will now inject `CustomizationService`. The existing spec must provide a mock for it, or even the existing `should create` test breaks (the real service injects `HttpClient`). Step 1 adds that mock.

- [ ] **Step 1: Write the failing tests (and add the CustomizationService mock)**

Edit `list-event.component.spec.ts`. Add the import near the existing imports:

```typescript
import {CustomizationService} from '../../../../../../common/services/customization/customization.service';
```

Add a mock object next to `mockProgramService` (after its declaration, before `beforeEach`):

```typescript
	const mockCustomizationService = {
		eventCardTagCount: undefined as number | undefined,
	};
```

Add it to the `providers` array in `TestBed.configureTestingModule`:

```typescript
			providers: [
				{provide: ProgramService, useValue: mockProgramService},
				{provide: CustomizationService, useValue: mockCustomizationService},
			],
```

Then add this `describe` block after the existing `should create` test:

```typescript
	describe('visibleTags', () => {
		const tags = [
			{id: 'a', nameCs: 'A', nameEn: 'A', color: '#000'},
			{id: 'b', nameCs: 'B', nameEn: 'B', color: '#000'},
			{id: 'c', nameCs: 'C', nameEn: 'C', color: '#000'},
		];

		afterEach(() => {
			mockCustomizationService.eventCardTagCount = undefined;
		});

		it('shows one tag by default (unset)', () => {
			mockCustomizationService.eventCardTagCount = undefined;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a']);
		});

		it('shows no tags when the count is 0', () => {
			mockCustomizationService.eventCardTagCount = 0;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags).toEqual([]);
		});

		it('shows the first N tags', () => {
			mockCustomizationService.eventCardTagCount = 2;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a', 'b']);
		});

		it('shows all tags when the count exceeds the available tags', () => {
			mockCustomizationService.eventCardTagCount = 5;
			component.event = {...component.event, tags} as any;
			expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a', 'b', 'c']);
		});

		it('returns an empty array when the event has no tags', () => {
			mockCustomizationService.eventCardTagCount = 3;
			component.event = {...component.event, tags: []} as any;
			expect((component as any).visibleTags).toEqual([]);
		});
	});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- --include='**/list-event.component.spec.ts' --watch=false`
Expected: FAIL — `visibleTags` does not exist on the component yet.

- [ ] **Step 3: Add the injection and `visibleTags` getter**

In `list-event.component.ts`, add the imports near the existing ones:

```typescript
import {CustomizationService} from '../../../../../../common/services/customization/customization.service';
import {IEventTag} from '../../../../types/IEventTag';
```

Add the injected service next to the existing `translate` field (around line 28):

```typescript
	protected readonly translate: TranslateService = inject(TranslateService);
	private readonly customizationService: CustomizationService = inject(CustomizationService);
```

Add the getter (e.g. after the injected fields, before `showDetail`):

```typescript
	protected get visibleTags(): IEventTag[] {
		const limit = this.customizationService.eventCardTagCount ?? 1;
		return (this.event?.tags ?? []).slice(0, limit);
	}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- --include='**/list-event.component.spec.ts' --watch=false`
Expected: PASS (the `should create` test + 5 `visibleTags` specs).

- [ ] **Step 5: Update the template to loop over `visibleTags`**

In `list-event.component.html`, replace the current single-tag block (lines 19–27):

```html
    @if(event.tags && event.tags.length > 0) {
      <div class="tag">
        @if(translate.currentLang === 'cs') {
          {{ event.tags[0].nameCs }}
        } @else {
          {{ event.tags[0].nameEn }}
        }
      </div>
    }
```

with:

```html
    @if (visibleTags.length > 0) {
      <div class="tags">
        @for (tag of visibleTags; track tag.id) {
          <div class="tag">
            @if (translate.currentLang === 'cs') {
              {{ tag.nameCs }}
            } @else {
              {{ tag.nameEn }}
            }
          </div>
        }
      </div>
    }
```

- [ ] **Step 6: Update the SCSS — `.tags` container, `.tag` pill**

In `list-event.component.scss`, replace the existing top-level `.tag` rule (lines 70–78):

```scss
.tag {
	font-size: 11px;
	position: absolute;
	right: 5px;
	bottom: 3px;
	border: 1px solid #00000060;
	border-radius: 5px;
	padding: 2px 5px;
}
```

with:

```scss
.tags {
	position: absolute;
	right: 5px;
	bottom: 3px;
	display: flex;
	gap: 4px;
}

.tag {
	font-size: 11px;
	border: 1px solid #00000060;
	border-radius: 5px;
	padding: 2px 5px;
	white-space: nowrap;
}
```

- [ ] **Step 7: Build to verify template + SCSS compile**

Run: `npm run build`
Expected: build succeeds with no template/SCSS errors.

- [ ] **Step 8: Run the full mobile test suite (no regressions)**

Run: `npm run test -- --watch=false`
Expected: PASS — the new specs pass and nothing else regresses.

- [ ] **Step 9: Commit**

```bash
git add src/app/modules/program/components/full-program/components/list-event/list-event.component.ts \
        src/app/modules/program/components/full-program/components/list-event/list-event.component.html \
        src/app/modules/program/components/full-program/components/list-event/list-event.component.scss \
        src/app/modules/program/components/full-program/components/list-event/list-event.component.spec.ts
git commit -m "feat(program): render configurable number of tags on event card"
```

---

## Self-Review

**Spec coverage:**
- Backend allow-list (ALLOWED + PUBLIC) → Task 1.
- Admin `NumberInput` (initialValues, load, submit, UI) → Task 2.
- `CustomizationService` field + parsing getter (empty→undefined, '0'→0, negative/NaN→undefined, floor) → Task 3, with the `Number('')===0` trap guarded explicitly.
- `list-event` `visibleTags` slice with default 1 → Task 4 (ts + tests).
- Template loop + `.tags` container SCSS → Task 4 (steps 5–6).
- Semantics table (unset→1, 0→none, N→first N, fewer→all) → Task 3 getter + Task 4 `visibleTags` tests cover every row.
- Untouched: `app-event-tags` (preview / full detail) — no task modifies it. ✓

**Placeholder scan:** none — every code/command step is concrete.

**Type/name consistency:** key string `eventCardTagCount` identical across backend arrays, backend spec, admin form field, mobile interface, getter, and component. Getter name `eventCardTagCount` matches between service and component usage. `visibleTags` consistent between component getter, template, and spec. Import depth `../../../../../../common/...` (6 levels: list-event → components → full-program → components → program → modules → app) and `../../../../types/IEventTag` (4 levels → program/types) match the file locations.

**Cross-repo isolation:** every task stages explicit files (never `git add -A`), so the unrelated `Dockerfile` change in festival-planner and the unrelated working-tree changes in event-manager-frontend are not swept into commits.
