# Configurable map titles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the 3 fixed maps an admin-editable per-language title (CS/EN); the mobile map screen shows each map as a top-level tab titled by its label, with accompanying competitions/tribes info folded into a "další info" sub-tab.

**Architecture:** Extend each `maps` customization entry with `labelCs`/`labelEn` (the `maps` key is already a public free-form JSON value — backend unchanged). The mobile `MapComponent` reads the labels (by current language, with fallback) and restructures its tabs; the admin customization page replaces the dynamic "Add Map" UI with 3 fixed slots (image + CS/EN label).

**Tech Stack:** Two repos — **event-manager-frontend** (Angular 21 + Material, jasmine/karma, npm) and **festival-planner** (Next.js/Mantine admin, no test runner). Mobile: `npm run build` / `npm run test`.

**Spec:** `event-manager-frontend/docs/superpowers/specs/2026-06-10-configurable-map-titles-design.md`

**Repo roots:**
- event-manager-frontend: `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend`
- festival-planner: `/home/vitek/Projects/RZB-IT/festival-planner`

---

## File Structure

| Repo / File | Responsibility |
|-------------|----------------|
| event-manager-frontend `src/app/common/services/customization/customization.service.ts` | `IMapImage` gains `labelCs`/`labelEn`; `maps` getter passes them through. |
| event-manager-frontend `src/app/common/services/customization/customization.service.spec.ts` (new) | Test: maps getter keeps labels. |
| event-manager-frontend `src/app/modules/map/map.component.ts` | Per-language label getters + lang-change refresh. |
| event-manager-frontend `src/app/modules/map/map.component.html` | Tabs titled by labels; "další info" sub-tab. |
| event-manager-frontend `src/app/modules/map/map.component.spec.ts` | Label/fallback + value-by-name tests. |
| event-manager-frontend `src/assets/i18n/en.json` | `"další info": "More info"`. |
| festival-planner `apps/frontend/src/app/admin/customization/page.tsx` | 3 fixed map slots (image + CS/EN label). |

---

## Task 1: Pass map labels through `CustomizationService` (event-manager-frontend, TDD)

**Files:**
- Modify: `src/app/common/services/customization/customization.service.ts`
- Test (new): `src/app/common/services/customization/customization.service.spec.ts`

Commands run from `/home/vitek/Projects/RZB-IT/event-app/event-manager-frontend` (branch `mobile-app`). npm.

- [ ] **Step 1: Add `labelCs`/`labelEn` to `IMapImage`**

In `src/app/common/services/customization/customization.service.ts`, change the `IMapImage` interface (currently `{ name: string; value: string; }`) to:

```ts
export interface IMapImage {
	name: string;
	value: string;
	labelCs?: string;
	labelEn?: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `src/app/common/services/customization/customization.service.spec.ts`:

```ts
import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {CustomizationService} from './customization.service';

describe('CustomizationService', () => {
	let service: CustomizationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()],
		});
		service = TestBed.inject(CustomizationService);
	});

	it('keeps labelCs/labelEn on map entries', () => {
		(service as any).data.set({
			maps: [{name: 'map1', value: 'https://x.test/p.png', labelCs: 'CS', labelEn: 'EN'}],
		});

		const maps = service.maps;
		expect(maps[0].name).toBe('map1');
		expect(maps[0].value).toBe('https://x.test/p.png');
		expect(maps[0].labelCs).toBe('CS');
		expect(maps[0].labelEn).toBe('EN');
	});
});
```

- [ ] **Step 3: Run the test to verify it FAILS**

Run: `CHROME_BIN=/opt/google/chrome/google-chrome npx ng test --watch=false --include='**/customization.service.spec.ts' 2>&1 | tail -15`
Expected: FAIL — `labelCs`/`labelEn` are `undefined` because the `maps` getter rebuilds entries as `{name, value}` only.

- [ ] **Step 4: Pass labels through the `maps` getter**

In the same file, the `maps` getter builds `resolvedMaps`. Change the mapping to include the labels:

```ts
			this.resolvedMaps = (source ?? []).map(m => ({
				name: m.name,
				value: this.resolveUrl(m.value) ?? m.value,
				labelCs: m.labelCs,
				labelEn: m.labelEn,
			}));
```

- [ ] **Step 5: Run the test to verify it PASSES**

Run: `CHROME_BIN=/opt/google/chrome/google-chrome npx ng test --watch=false --include='**/customization.service.spec.ts' 2>&1 | tail -10`
Expected: PASS — `TOTAL: 1 SUCCESS`.

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git commit src/app/common/services/customization/customization.service.ts src/app/common/services/customization/customization.service.spec.ts -m "feat(customization): carry per-language labels on map entries" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Map tabs titled by labels (event-manager-frontend, TDD)

**Files:**
- Modify: `src/app/modules/map/map.component.ts`
- Modify: `src/app/modules/map/map.component.html`
- Modify: `src/assets/i18n/en.json`
- Test: `src/app/modules/map/map.component.spec.ts`

Commands run from the event-manager-frontend root. The label getters resolve by `translate.currentLang`; tests set the language explicitly.

- [ ] **Step 1: Replace the spec with label/value tests**

Replace the entire contents of `src/app/modules/map/map.component.spec.ts` with:

```ts
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

import {MapComponent} from './map.component';
import {CustomizationService} from '../../common/services/customization/customization.service';

describe('MapComponent', () => {
	let component: MapComponent;
	let fixture: ComponentFixture<MapComponent>;
	let translate: TranslateService;

	const mockCustomization = {
		maps: [
			{name: 'map1', value: 'u1', labelCs: 'Hlavní mapa', labelEn: 'Main map'},
			{name: 'map2', value: 'u2', labelCs: '', labelEn: 'Comp map'},
			{name: 'map3', value: '', labelCs: '', labelEn: ''},
		],
		competitionsInfo: undefined,
		tribesInfo: undefined,
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [MapComponent, TranslateModule.forRoot()],
			providers: [
				{provide: CustomizationService, useValue: mockCustomization},
			],
		});
		fixture = TestBed.createComponent(MapComponent);
		component = fixture.componentInstance;
		translate = TestBed.inject(TranslateService);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('returns the CS label when language is cs', () => {
		translate.use('cs');
		expect((component as any).festivalMapLabel).toBe('Hlavní mapa');
	});

	it('returns the EN label when language is en', () => {
		translate.use('en');
		expect((component as any).festivalMapLabel).toBe('Main map');
	});

	it('falls back to the other language when the current-language label is empty', () => {
		translate.use('cs');
		expect((component as any).competitionMapLabel).toBe('Comp map');
	});

	it('falls back to "Mapa" when both labels are empty', () => {
		translate.use('cs');
		expect((component as any).tribesMapLabel).toBe('Mapa');
	});

	it('returns the map value by name', () => {
		expect((component as any).festivalMap).toBe('u1');
		expect((component as any).competitionMap).toBe('u2');
		expect((component as any).tribesMap).toBe('');
	});
});
```

- [ ] **Step 2: Run the tests to verify they FAIL**

Run: `CHROME_BIN=/opt/google/chrome/google-chrome npx ng test --watch=false --include='**/map.component.spec.ts' 2>&1 | tail -15`
Expected: FAIL — `festivalMapLabel`/`competitionMapLabel`/`tribesMapLabel` don't exist yet.

- [ ] **Step 3: Implement the component**

Replace the entire contents of `src/app/modules/map/map.component.ts` with:

```ts
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatTabsModule} from '@angular/material/tabs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {TribesInfoComponent} from './components/tribes-info/tribes-info.component';
import {CompetitionsInfoComponent} from './components/competitions-info/competitions-info.component';
import {PinchZoomComponent} from "@meddv/ngx-pinch-zoom";
import {CustomizationService, IMapImage} from "../../common/services/customization/customization.service";

@Component({
    selector: 'app-map',
    imports: [MatTabsModule, MatProgressSpinnerModule, TranslateModule, CompetitionsInfoComponent, TribesInfoComponent, PinchZoomComponent],
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent {
    private readonly customizationService = inject(CustomizationService);
    private readonly translate = inject(TranslateService);
    private readonly cdr = inject(ChangeDetectorRef);

    constructor() {
        // Tab titles are dynamic data (not via the translate pipe), so refresh on language change under OnPush.
        this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
    }

    protected get festivalMap(): string | undefined {
        return this.getMap('map1')?.value;
    }

    protected get festivalMapLabel(): string {
        return this.mapLabel(this.getMap('map1'));
    }

    protected get competitionMap(): string | undefined {
        return this.getMap('map2')?.value;
    }

    protected get competitionMapLabel(): string {
        return this.mapLabel(this.getMap('map2'));
    }

    protected get tribesMap(): string | undefined {
        return this.getMap('map3')?.value;
    }

    protected get tribesMapLabel(): string {
        return this.mapLabel(this.getMap('map3'));
    }

    protected get competitionsInfo() {
        return this.customizationService.competitionsInfo;
    }

    protected get tribesInfo() {
        return this.customizationService.tribesInfo;
    }

    private getMap(name: string): IMapImage | undefined {
        return this.customizationService.maps.find(m => m.name === name);
    }

    private mapLabel(map: IMapImage | undefined): string {
        const cs = this.translate.currentLang === 'cs';
        return (cs ? map?.labelCs : map?.labelEn)
            || (cs ? map?.labelEn : map?.labelCs)
            || this.translate.instant('Mapa');
    }
}
```

- [ ] **Step 4: Update the template**

Replace the entire contents of `src/app/modules/map/map.component.html` with:

```html
<mat-tab-group class="full-height">
    @if (festivalMap) {
        <mat-tab [label]="festivalMapLabel">
            <ng-template matTabContent>
                <pinch-zoom style="height: 100%">
                    <div class="img-wrapper">
                        <img [src]="festivalMap" alt="Map">
                    </div>
                </pinch-zoom>
            </ng-template>
        </mat-tab>
    }

    @if (competitionMap || competitionsInfo) {
        <mat-tab [label]="competitionMapLabel">
            <ng-template matTabContent>
                <mat-tab-group class="sub-tabs">
                    @if (competitionMap) {
                        <mat-tab [label]="'Mapa' | translate">
                            <ng-template matTabContent>
                                <pinch-zoom style="height: 100%">
                                    <div class="img-wrapper">
                                        <img [src]="competitionMap" alt="Map">
                                    </div>
                                </pinch-zoom>
                            </ng-template>
                        </mat-tab>
                    }

                    @if (competitionsInfo) {
                        <mat-tab [label]="'další info' | translate">
                            <ng-template matTabContent>
                                <app-competitions-info [data]="competitionsInfo!"/>
                            </ng-template>
                        </mat-tab>
                    }
                </mat-tab-group>
            </ng-template>
        </mat-tab>
    }

    @if (tribesMap || tribesInfo) {
        <mat-tab [label]="tribesMapLabel">
            <ng-template matTabContent>
                <mat-tab-group class="sub-tabs">
                    @if (tribesMap) {
                        <mat-tab [label]="'Mapa' | translate">
                            <ng-template matTabContent>
                                <pinch-zoom style="height: 100%">
                                    <div class="img-wrapper">
                                        <img [src]="tribesMap" alt="Map">
                                    </div>
                                </pinch-zoom>
                            </ng-template>
                        </mat-tab>
                    }

                    @if (tribesInfo) {
                        <mat-tab [label]="'další info' | translate">
                            <ng-template matTabContent>
                                <app-tribes-info [data]="tribesInfo!"/>
                            </ng-template>
                        </mat-tab>
                    }
                </mat-tab-group>
            </ng-template>
        </mat-tab>
    }
</mat-tab-group>
```

- [ ] **Step 5: Add the English translation for "další info"**

In `src/assets/i18n/en.json`, add a `"další info": "More info"` entry next to the existing `"Otevírací doba": "Opening hours",` line (keep valid JSON — ensure a comma separates entries):

```json
  "Otevírací doba": "Opening hours",
  "další info": "More info",
```

- [ ] **Step 6: Run the tests to verify they PASS**

Run: `npm run test`
Expected: PASS — all 6 `MapComponent` tests green, and the rest of the suite remains green.

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git commit src/app/modules/map/map.component.ts src/app/modules/map/map.component.html src/app/modules/map/map.component.spec.ts src/assets/i18n/en.json -m "feat(map): tab titles from per-language map labels" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Three fixed map slots in admin (festival-planner)

**Files:**
- Modify: `apps/frontend/src/app/admin/customization/page.tsx`

No test runner; verify via ESLint + dev-server compile. Commands run from `/home/vitek/Projects/RZB-IT/festival-planner`. The controller will have created/checked out a dedicated branch before this task; commit only the one file.

- [ ] **Step 1: Extend `MapItem` and add the slot constant**

In `apps/frontend/src/app/admin/customization/page.tsx`, change the `MapItem` interface:

```ts
interface MapItem {
    name: string;
    value: string;
    labelCs: string;
    labelEn: string;
}

const MAP_SLOTS = ['map1', 'map2', 'map3'];
```

- [ ] **Step 2: Update the imports (remove now-unused, keep the rest)**

Replace the Mantine import block and the tabler-icons import so unused symbols (`Modal`, `Table`, `useDisclosure`, `IconPlus`, `IconPhoto`) are gone:

```tsx
import {
    Title, Paper, Button, Group, TextInput, Textarea,
    LoadingOverlay, Divider, Text, ActionIcon, Stack,
    Image, FileButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
```

(Remove the `import { useDisclosure } from '@mantine/hooks';` line entirely.)

- [ ] **Step 3: Initialise `maps` as three fixed slots**

In `useForm({ initialValues: { ... } })`, replace `maps: [] as MapItem[],` with:

```ts
            maps: MAP_SLOTS.map((name) => ({ name, value: '', labelCs: '', labelEn: '' })) as MapItem[],
```

Remove the `mapForm` `useForm({...})` block entirely.

Remove the map-modal disclosure state line:
```ts
    const [mapModalOpened, { open: openMapModal, close: closeMapModal }] = useDisclosure(false);
```

- [ ] **Step 4: Build the three slots in `loadData`**

In `loadData()`'s `form.setValues({ ... })`, replace `maps: data.maps ?? [],` with:

```ts
                    maps: MAP_SLOTS.map((name) => {
                        const existing = (data.maps ?? []).find((m: MapItem) => m.name === name);
                        return {
                            name,
                            value: existing?.value ?? '',
                            labelCs: existing?.labelCs ?? '',
                            labelEn: existing?.labelEn ?? '',
                        };
                    }),
```

(`handleSubmit`'s `maps: values.maps,` stays unchanged — it saves all three slots.)

- [ ] **Step 5: Remove the dynamic-map handlers and rows**

Delete these now-unused declarations entirely: `handleOpenMapModal`, `handleMapFileUpload`, `handleDeleteMap`, and the `mapRows` constant. (Keep `handleUpload` and `resolveUrl` — used elsewhere.)

- [ ] **Step 6: Replace the Maps section JSX**

Replace the existing Maps section (from `<Divider my="lg" />` + `<Title order={4}>Maps</Title>` through the maps table / "No maps configured." block, i.e. the `<Group justify="space-between" mb="sm">` with the "Add Map" button and the `{form.values.maps.length > 0 ? (<Table ...>) : (<Text ...>)}` block) with:

```tsx
                    <Divider my="lg" />
                    <Title order={4} mb="sm">Maps</Title>

                    <Stack gap="lg" mb="sm">
                        {form.values.maps.map((map, index) => (
                            <Paper key={map.name} withBorder p="md">
                                <Text fw={600} mb="sm">{map.name}</Text>

                                <Group gap="sm" mb="sm">
                                    {map.value && (
                                        <Image src={resolveUrl(map.value)} alt={map.name} h={50} w="auto" fit="contain" />
                                    )}
                                    <FileButton
                                        onChange={(file) => handleUpload(file, (url) => form.setFieldValue(`maps.${index}.value`, url), `Map "${map.name}"`)}
                                        accept="image/*"
                                    >
                                        {(props) => (
                                            <Button variant="light" size="xs" leftSection={<IconUpload size={14} />} loading={uploading === `Map "${map.name}"`} {...props}>
                                                {map.value ? 'Change image' : 'Upload image'}
                                            </Button>
                                        )}
                                    </FileButton>
                                    {map.value && (
                                        <ActionIcon variant="subtle" color="red" onClick={() => form.setFieldValue(`maps.${index}.value`, '')}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    )}
                                </Group>

                                <Group grow>
                                    <TextInput label="Label (CS)" placeholder="Hlavní mapa" {...form.getInputProps(`maps.${index}.labelCs`)} />
                                    <TextInput label="Label (EN)" placeholder="Main map" {...form.getInputProps(`maps.${index}.labelEn`)} />
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
```

- [ ] **Step 7: Remove the "Add Map" modal JSX**

Delete the entire `<Modal opened={mapModalOpened} ...> ... </Modal>` block near the end of the returned JSX (the modal that contained the "Map Name" input and "Choose Map Image" button).

- [ ] **Step 8: Lint the changed file**

Run: `cd /home/vitek/Projects/RZB-IT/festival-planner/apps/frontend && npx eslint src/app/admin/customization/page.tsx`
Expected: exit 0, no errors (no unused-var errors for the removed symbols; pre-existing warnings are fine).

- [ ] **Step 9: Type-check**

Run: `cd /home/vitek/Projects/RZB-IT/festival-planner/apps/frontend && npx tsc --noEmit 2>&1 | grep -iE "customization/page" | head`
Expected: no output (no type errors in this file).

- [ ] **Step 10: Commit** (only the one file):

```bash
cd /home/vitek/Projects/RZB-IT/festival-planner
git commit apps/frontend/src/app/admin/customization/page.tsx -m "feat(admin): three fixed map slots with per-language labels" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: End-to-end manual verification

**Files:** none — verification.

- [ ] **Step 1: Configure in admin**

festival-planner admin → Customization → Maps: upload an image to `map1`, set Label (CS) = "Hlavní mapa" / Label (EN) = "Main map". Save.

- [ ] **Step 2: Verify the public API carries labels**

Run: `curl -s http://localhost:3001/public/customization | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const m=(JSON.parse(s).maps||[]).find(x=>x.name==='map1'); console.log(JSON.stringify(m))})"`
Expected: the `map1` entry includes `labelCs` and `labelEn`.

- [ ] **Step 3: Verify in the mobile app (manual)**

- [ ] The first map tab is titled by the label (CS label in Czech, EN label after switching language).
- [ ] Competitions/tribes info appears under a "další info" / "More info" sub-tab.
- [ ] A slot with no image shows no tab; a label left empty falls back to "Mapa".

---

## Done

After Task 4: admin sets per-language map titles in 3 fixed slots; the mobile map screen shows label-titled tabs with "další info" sub-tabs; tests green in the mobile repo, admin lint/type-check clean.
