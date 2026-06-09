# Configurable bottom-menu button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 4th bottom-menu button in the mobile app a generic "configurable button" — its icon (a Material Icons name) and link target (per language) come from administration; it hides when no URL is set and falls back to a `help` icon when no icon is set.

**Architecture:** Extend the existing key-value customization system with one new public key `configurableButtonIcon`. Reuse the existing `faqUrlCs`/`faqUrlEn` keys as the button's target URL. The mobile `BottomMenuComponent` reads both via `CustomizationService` and renders the button conditionally. No DB migration.

**Tech Stack:** Two repos — **festival-planner** (NestJS backend + Next.js/Mantine admin, jest) and **event-manager-frontend** (Angular 21 + Material, jasmine/karma). Mobile uses `npm run build` / `npm run test`; planner backend tests run in Docker via jest.

**Spec:** `event-manager-frontend/docs/superpowers/specs/2026-06-09-configurable-bottom-menu-button-design.md`

**Repo roots:**
- festival-planner: `/home/vitek/Projects/RZB-IT/festival-planner`
- event-manager-frontend: `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`

---

## File Structure

| Repo / File | Responsibility |
|-------------|----------------|
| festival-planner `apps/backend/src/customization/dto/upsert-customization.dto.ts` | Allow + publicly expose the `configurableButtonIcon` key. |
| festival-planner `apps/backend/src/customization/customization.service.spec.ts` | Test asserting the new key is allowed + public. |
| festival-planner `apps/frontend/src/app/admin/customization/page.tsx` | Admin form: rename section to "Configurable button" + add icon TextInput. |
| event-manager-frontend `src/app/common/services/customization/customization.service.ts` | Expose `configurableButtonIcon` on the customization model. |
| event-manager-frontend `src/app/modules/layout/components/bottom-menu/bottom-menu.component.ts` | Getters for url/icon/visibility + open handler. |
| event-manager-frontend `src/app/modules/layout/components/bottom-menu/bottom-menu.component.html` | Conditional render + configurable icon + click. |
| event-manager-frontend `.../bottom-menu/bottom-menu.component.spec.ts` | Behaviour tests (hide, icon, fallback, click). |

---

## Task 1: Allow + expose `configurableButtonIcon` (festival-planner backend, TDD)

**Files:**
- Modify: `apps/backend/src/customization/dto/upsert-customization.dto.ts`
- Test: `apps/backend/src/customization/customization.service.spec.ts`

All commands run from `/home/vitek/Projects/RZB-IT/festival-planner`.

- [ ] **Step 1: Write the failing test**

In `apps/backend/src/customization/customization.service.spec.ts`, add this import after the existing import of `PrismaService` (line 4):

```ts
import {
  ALLOWED_CUSTOMIZATION_KEYS,
  PUBLIC_CUSTOMIZATION_KEYS,
} from './dto/upsert-customization.dto';
```

Then add this `describe` block immediately after the opening `describe('CustomizationService', () => {` / `beforeEach` setup (e.g. right before the existing `describe('getAll', ...)`):

```ts
  describe('configurableButtonIcon key', () => {
    it('is an allowed customization key', () => {
      expect(ALLOWED_CUSTOMIZATION_KEYS).toContain('configurableButtonIcon');
    });

    it('is exposed as a public customization key', () => {
      expect(PUBLIC_CUSTOMIZATION_KEYS).toContain('configurableButtonIcon');
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose exec -T backend npx jest src/customization/customization.service.spec.ts 2>&1 | grep -viE "obsolete|prisma-config|deprecated" | tail -20`
Expected: FAIL — the two new assertions fail (`configurableButtonIcon` not in the arrays).

- [ ] **Step 3: Add the key to both allow-lists**

In `apps/backend/src/customization/dto/upsert-customization.dto.ts`, add `'configurableButtonIcon'` to `ALLOWED_KEYS` (between `'faqUrlEn'` and `'festivalId'`):

```ts
const ALLOWED_KEYS = [
  'themeCssUrl',
  'logoUrl',
  'faqUrlCs',
  'faqUrlEn',
  'configurableButtonIcon',
  'festivalId',
  'oneSignalAppId',
  'oneSignalApiKey',
  'walletApiUrl',
  'maps',
  'competitionsInfo',
  'tribesInfo',
] as const;
```

And add it to `PUBLIC_CUSTOMIZATION_KEYS`:

```ts
export const PUBLIC_CUSTOMIZATION_KEYS: readonly string[] = [
  'themeCssUrl',
  'logoUrl',
  'faqUrlCs',
  'faqUrlEn',
  'configurableButtonIcon',
  'festivalId',
  'maps',
  'competitionsInfo',
  'tribesInfo',
  'oneSignalAppId',
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker compose exec -T backend npx jest src/customization/customization.service.spec.ts 2>&1 | grep -viE "obsolete|prisma-config|deprecated" | tail -10`
Expected: PASS — all `CustomizationService` tests green, including the two new ones.

- [ ] **Step 5: Commit**

```bash
cd /home/vitek/Projects/RZB-IT/festival-planner
git commit apps/backend/src/customization/dto/upsert-customization.dto.ts apps/backend/src/customization/customization.service.spec.ts \
  -m "feat(customization): allow and expose configurableButtonIcon key" \
  -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Admin "Configurable button" section (festival-planner admin)

**Files:**
- Modify: `apps/frontend/src/app/admin/customization/page.tsx`

No frontend test runner exists in this app; verification is lint + the running dev server. Commands run from `/home/vitek/Projects/RZB-IT/festival-planner`.

- [ ] **Step 1: Add `configurableButtonIcon` to the form initial values**

In `apps/frontend/src/app/admin/customization/page.tsx`, in `useForm({ initialValues: { ... } })`, add the field after `faqUrlEn: '',`:

```ts
            faqUrlCs: '',
            faqUrlEn: '',
            configurableButtonIcon: '',
```

- [ ] **Step 2: Load it in `loadData`**

In `loadData()`'s `form.setValues({ ... })`, add after `faqUrlEn: data.faqUrlEn ?? '',`:

```ts
                    faqUrlCs: data.faqUrlCs ?? '',
                    faqUrlEn: data.faqUrlEn ?? '',
                    configurableButtonIcon: data.configurableButtonIcon ?? '',
```

- [ ] **Step 3: Save it in `handleSubmit`**

In `handleSubmit()`'s `const items: Record<string, unknown> = { ... }`, add after `faqUrlEn: values.faqUrlEn,`:

```ts
                faqUrlCs: values.faqUrlCs,
                faqUrlEn: values.faqUrlEn,
                configurableButtonIcon: values.configurableButtonIcon,
```

- [ ] **Step 4: Rename the section and add the icon input**

Replace the existing "FAQ Links" block:

```tsx
                    <Divider my="lg" />
                    <Title order={4} mb="sm">FAQ Links</Title>

                    <Stack gap="sm" mb="sm">
                        <TextInput
                            label="FAQ URL (Czech)"
                            placeholder="https://docs.google.com/..."
                            {...form.getInputProps('faqUrlCs')}
                        />
                        <TextInput
                            label="FAQ URL (English)"
                            placeholder="https://docs.google.com/..."
                            {...form.getInputProps('faqUrlEn')}
                        />
                    </Stack>
```

with:

```tsx
                    <Divider my="lg" />
                    <Title order={4} mb="sm">Configurable button</Title>

                    <Stack gap="sm" mb="sm">
                        <TextInput
                            label="Button link (Czech)"
                            placeholder="https://docs.google.com/..."
                            {...form.getInputProps('faqUrlCs')}
                        />
                        <TextInput
                            label="Button link (English)"
                            placeholder="https://docs.google.com/..."
                            {...form.getInputProps('faqUrlEn')}
                        />
                        <TextInput
                            label="Button icon (Material icon name)"
                            placeholder="help"
                            description="Material Icons name, e.g. info, link, question_mark. The mobile app falls back to a question mark if empty."
                            {...form.getInputProps('configurableButtonIcon')}
                        />
                    </Stack>
```

- [ ] **Step 5: Lint the changed file**

Run: `cd /home/vitek/Projects/RZB-IT/festival-planner/apps/frontend && npx eslint src/app/admin/customization/page.tsx`
Expected: exit 0, no errors (warnings, if any, are pre-existing).

- [ ] **Step 6: Verify the dev server compiles the page**

Run: `docker compose -f /home/vitek/Projects/RZB-IT/festival-planner/docker-compose.yml logs --tail=20 frontend 2>&1 | grep -viE "obsolete" | grep -iE "Compiled|error|⨯" | tail -10`
Expected: a `✓ Compiled` line and no error/`⨯` lines for the customization page after it hot-reloads. (The frontend dev container hot-reloads the bind-mounted source.)

- [ ] **Step 7: Commit**

```bash
cd /home/vitek/Projects/RZB-IT/festival-planner
git commit apps/frontend/src/app/admin/customization/page.tsx \
  -m "feat(admin): configurable button section with Material icon name input" \
  -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Expose `configurableButtonIcon` on the mobile customization model (event-manager-frontend)

**Files:**
- Modify: `src/app/common/services/customization/customization.service.ts`

Commands run from `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`.

- [ ] **Step 1: Add the field to `ICustomization`**

In `src/app/common/services/customization/customization.service.ts`, add to the `ICustomization` interface after `faqUrlEn?: string;`:

```ts
	faqUrlCs?: string;
	faqUrlEn?: string;
	configurableButtonIcon?: string;
```

- [ ] **Step 2: Add the getter**

After the existing `faqUrlEn` getter (the block ending `}` around line 76), add:

```ts
	public get configurableButtonIcon(): string | undefined {
		return this.data().configurableButtonIcon;
	}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: PASS (an added optional field + getter does not break the build).

- [ ] **Step 4: Commit**

```bash
git commit src/app/common/services/customization/customization.service.ts \
  -m "feat(customization): expose configurableButtonIcon" \
  -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Configurable bottom-menu button (event-manager-frontend, TDD)

**Files:**
- Modify: `src/app/modules/layout/components/bottom-menu/bottom-menu.component.ts`
- Modify: `src/app/modules/layout/components/bottom-menu/bottom-menu.component.html`
- Test: `src/app/modules/layout/components/bottom-menu/bottom-menu.component.spec.ts`

Commands run from `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`. The button URL getter uses the English URL when the current language is not `cs`; tests use `faqUrlEn` so they don't depend on language setup (default `currentLang` is undefined → English branch).

- [ ] **Step 1: Replace the spec with the new behaviour tests**

Replace the entire contents of `src/app/modules/layout/components/bottom-menu/bottom-menu.component.spec.ts` with:

```ts
import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateModule} from '@ngx-translate/core';

import {BottomMenuComponent} from './bottom-menu.component';
import {SettingsService} from '../../../../common/services/settings/settings.service';
import {EDisplayDevice} from '../../../../common/types/EDisplayDevice';
import {CustomizationService} from '../../../../common/services/customization/customization.service';

describe('BottomMenuComponent', () => {
	let component: BottomMenuComponent;

	const mockSettingsService = {
		device: signal(EDisplayDevice.BASIC),
	};

	let mockCustomization: {
		faqUrlCs?: string;
		faqUrlEn?: string;
		configurableButtonIcon?: string;
	};

	function setup(): void {
		TestBed.configureTestingModule({
			imports: [BottomMenuComponent, RouterTestingModule, TranslateModule.forRoot()],
			providers: [
				{provide: SettingsService, useValue: mockSettingsService},
				{provide: CustomizationService, useValue: mockCustomization},
			],
		});

		const fixture = TestBed.createComponent(BottomMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	beforeEach(() => {
		mockCustomization = {};
	});

	it('should create', () => {
		setup();
		expect(component).toBeTruthy();
	});

	it('hides the configurable button when no URL is set', () => {
		mockCustomization = {};
		setup();
		expect((component as any).showConfigurableButton).toBeFalse();
	});

	it('shows the configurable button with the configured icon when URL and icon are set', () => {
		mockCustomization = {faqUrlEn: 'https://example.test/help', configurableButtonIcon: 'info'};
		setup();
		expect((component as any).showConfigurableButton).toBeTrue();
		expect((component as any).configurableButtonIcon).toBe('info');
	});

	it('falls back to the help icon when URL is set but icon is missing', () => {
		mockCustomization = {faqUrlEn: 'https://example.test/help'};
		setup();
		expect((component as any).showConfigurableButton).toBeTrue();
		expect((component as any).configurableButtonIcon).toBe('help');
	});

	it('opens the configured URL in a new tab on click', () => {
		mockCustomization = {faqUrlEn: 'https://example.test/help'};
		setup();
		const openSpy = spyOn(window, 'open');
		(component as any).openConfigurableButton();
		expect(openSpy).toHaveBeenCalledWith('https://example.test/help', '_blank');
	});
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `BottomMenuComponent` build/tests fail because `showConfigurableButton`, `configurableButtonIcon`, and `openConfigurableButton` don't exist yet.

- [ ] **Step 3: Implement the component getters + handler**

Replace the entire contents of `src/app/modules/layout/components/bottom-menu/bottom-menu.component.ts` with:

```ts
import {Component, inject} from '@angular/core';

import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {ERoute} from '../../../../common/types/ERoute';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {SettingsService} from "../../../../common/services/settings/settings.service";
import {EDisplayDevice} from "../../../../common/types/EDisplayDevice";
import {CustomizationService} from "../../../../common/services/customization/customization.service";

@Component({
    selector: 'app-bottom-menu',
    templateUrl: './bottom-menu.component.html',
    styleUrls: ['./bottom-menu.component.scss'],
    imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    FormsModule,
    RouterModule,
    TranslateModule
]
})
export class BottomMenuComponent {
	protected readonly ERoute = ERoute;
	protected readonly settingsService: SettingsService = inject(SettingsService);
	private readonly translate: TranslateService = inject(TranslateService);
	private readonly customizationService = inject(CustomizationService);

	protected EDisplayDevice = EDisplayDevice;

	protected get configurableButtonUrl(): string | undefined {
		return this.translate.currentLang === 'cs'
			? this.customizationService.faqUrlCs
			: this.customizationService.faqUrlEn;
	}

	protected get configurableButtonIcon(): string {
		return this.customizationService.configurableButtonIcon || 'help';
	}

	protected get showConfigurableButton(): boolean {
		return !!this.configurableButtonUrl;
	}

	protected openConfigurableButton(): void {
		const url = this.configurableButtonUrl;
		if (url) {
			window.open(url, '_blank');
		}
	}
}
```

- [ ] **Step 4: Update the template (conditional render + configurable icon + click)**

In `src/app/modules/layout/components/bottom-menu/bottom-menu.component.html`, replace the 4th button block:

```html
		<button mat-button
			routerLinkActive="bottom-menu__button--active"
			class="bottom-menu__button"
            [class.with-text]="settingsService.device() === EDisplayDevice.INFO_PANEL"
			(click)="openFAQ()"
		>
			<mat-icon>help</mat-icon>
            @if(settingsService.device() === EDisplayDevice.INFO_PANEL) {
                {{ 'FAQ' | translate }}
            }
		</button>
```

with:

```html
		@if (showConfigurableButton) {
			<button mat-button
				routerLinkActive="bottom-menu__button--active"
				class="bottom-menu__button"
				[class.with-text]="settingsService.device() === EDisplayDevice.INFO_PANEL"
				(click)="openConfigurableButton()"
			>
				<mat-icon>{{ configurableButtonIcon }}</mat-icon>
				@if(settingsService.device() === EDisplayDevice.INFO_PANEL) {
					{{ 'FAQ' | translate }}
				}
			</button>
		}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test`
Expected: PASS — all 5 `BottomMenuComponent` tests green, and the rest of the suite remains green.

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: PASS — the template references `showConfigurableButton`, `configurableButtonIcon`, `openConfigurableButton`, all defined on the component.

- [ ] **Step 7: Commit**

```bash
git commit src/app/modules/layout/components/bottom-menu/bottom-menu.component.ts src/app/modules/layout/components/bottom-menu/bottom-menu.component.html src/app/modules/layout/components/bottom-menu/bottom-menu.component.spec.ts \
  -m "feat(bottom-menu): configurable button with icon, url and fallback" \
  -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: End-to-end manual verification

**Files:** none — verification.

- [ ] **Step 1: Configure in admin**

In the festival-planner admin → Customization → "Configurable button": set "Button link (English)" to a URL and "Button icon (Material icon name)" to e.g. `info`. Save.

- [ ] **Step 2: Verify the public API exposes it**

Run: `curl -s http://localhost:3001/public/customization | grep -o 'configurableButtonIcon[^,}]*'`
Expected: shows `configurableButtonIcon":"info"` (the saved value).

- [ ] **Step 3: Verify in the mobile app (manual)**

- [ ] With a button URL set + icon `info` → the bottom-menu 4th button shows the `info` icon and opens the URL.
- [ ] Clear the icon, keep the URL → the button shows the generic `help` (question mark).
- [ ] Clear the URL → the 4th button is not shown.

---

## Done

After Task 5: admin sets icon + link, mobile renders the configurable button (hidden without URL, `help` fallback without icon), tests green in both repos.
