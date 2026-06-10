# Konfigurovatelné nadpisy map (3 pevné sloty)

**Datum:** 2026-06-10
**Repozitáře:** `event-manager-frontend` (mobilní app), `festival-planner` (administrace — pouze frontend)

## Problém

Mapy se v administraci nahrávají dynamicky přes modal „Add Map" s ručně zadaným názvem (konvencí `map1`/`map2`/`map3`). V mobilní appce mají mapy **natvrdo zadané** názvy záložek (`Hlavní`, `Soutěže`→`Mapa`, `Atrakce&kmeny`→`Mapa`) a nejdou přejmenovat z administrace.

## Cíl

- V administraci **tři pevné sloty** `map1`/`map2`/`map3`, u každého: upload obrázku (jako dnes) + **nadpis** zvlášť pro CS a EN.
- V mobilní appce se nadpis ukáže jako **titulek horní záložky** dané mapy.
- Vždy max 3 mapy.

## Mimo rozsah (non-goals)

- Backend — žádná změna. `maps` je už veřejný JSON key-value v customization, rozšířený tvar prvků projde beze změny serializace.
- Počet map — vždy 3 pevné sloty (žádné dynamické přidávání).
- Data soutěží/kmenů (`competitionsInfo`/`tribesInfo`) — beze změny obsahu, jen přejmenování pod-záložky „Otevírací doba" → „další info".
- Překladový mechanismus (ngx-translate) — využíváme stávající.

## Zvolený přístup

Rozšířit prvky pole `maps` o `labelCs` / `labelEn`. Administrace ukládá tři pevné sloty; mobil čte labely a používá je jako titulky horních záložek, doprovodné info skládá do pod-záložky „další info".

**Zamítnutá alternativa:** samostatné customization klíče (`mapLabel1Cs`…) — pole `maps` je přirozený domov pro label vázaný na konkrétní mapu.

## Datový model

Customization klíč `maps` (pole), prvek:

```ts
{
  name: string;     // 'map1' | 'map2' | 'map3'
  value: string;    // URL obrázku (může být prázdné = slot bez obrázku)
  labelCs?: string; // nadpis CS
  labelEn?: string; // nadpis EN
}
```

Backend (`festival-planner`) ukládá/vrací `maps` jako neprůhledný JSON — **beze změny**. Stávající mapy bez labelů → labely prázdné → v mobilu fallback.

## Návrh

### 1. Administrace (festival-planner) — `apps/frontend/src/app/admin/customization/page.tsx`

- `MapItem` rozšířit o `labelCs: string; labelEn: string;`.
- Sekci „Maps" změnit z dynamického modalu + tabulky na **tři pevné sloty**. Konstanta `MAP_SLOTS = ['map1', 'map2', 'map3']`.
- `form.values.maps` je vždy pole **tří** prvků (v pořadí map1/map2/map3).
  - `loadData()`: z načtených `data.maps` poskládat tři sloty — pro každý `name` z `MAP_SLOTS` najít existující prvek (podle `name`), jinak `{ name, value: '', labelCs: '', labelEn: '' }`.
  - `handleSubmit()`: `maps: values.maps` (uloží se všechny tři sloty; prázdný slot má `value: ''`).
- UI: tři pevné řádky/karty, u každého slotu:
  - náhled obrázku (`<Image>` když `value`) + upload tlačítko → `handleUpload(file, url => form.setFieldValue(\`maps.${index}.value\`, url), ...)` + volitelně tlačítko smazat obrázek (`setFieldValue(\`maps.${index}.value\`, '')`).
  - `TextInput` **Label (CS)** → `form.getInputProps(\`maps.${index}.labelCs\`)`.
  - `TextInput` **Label (EN)** → `form.getInputProps(\`maps.${index}.labelEn\`)`.
- Odstranit dynamický „Add Map" modal (`mapForm`, `handleOpenMapModal`, `handleMapFileUpload`), `handleDeleteMap` a starou `mapRows` tabulku.

### 2. Mobil (event-manager-frontend)

**`src/app/common/services/customization/customization.service.ts`:**

- `IMapImage`: přidat `labelCs?: string;` a `labelEn?: string;`.
- Getter `maps` (mapuje a resolvuje URL) **musí propustit i labely** — dnes rekonstruuje prvek jen jako `{ name, value }`. Změnit na:
  ```ts
  this.resolvedMaps = (source ?? []).map(m => ({
      name: m.name,
      value: this.resolveUrl(m.value) ?? m.value,
      labelCs: m.labelCs,
      labelEn: m.labelEn,
  }));
  ```

**`src/app/modules/map/map.component.ts`:**

- Injektovat `TranslateService` a `ChangeDetectorRef`. Protože titulky jsou **dynamická data** (ne přes `| translate` pipe), pod `OnPush` je potřeba refresh při změně jazyka:
  ```ts
  this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  ```
- Pomocné gettery (vrací `IMapImage | undefined` per slot) a label resolver:
  ```ts
  private getMap(name: string): IMapImage | undefined {
      return this.customizationService.maps.find(m => m.name === name);
  }
  private mapLabel(map: IMapImage | undefined): string {
      const cs = this.translate.currentLang === 'cs';
      return (cs ? map?.labelCs : map?.labelEn)
          || (cs ? map?.labelEn : map?.labelCs)
          || this.translate.instant('Mapa');
  }
  ```
- Veřejné gettery: `festivalMap`/`festivalMapLabel` (map1), `competitionMap`/`competitionMapLabel` (map2), `tribesMap`/`tribesMapLabel` (map3). `…Map` vrací `getMap(name)?.value`, `…MapLabel` vrací `mapLabel(getMap(name))`. `competitionsInfo`/`tribesInfo` beze změny.

**`src/app/modules/map/map.component.html`** — tři horní záložky titulkované labely:

```html
<mat-tab-group class="full-height">
  @if (festivalMap) {
    <mat-tab [label]="festivalMapLabel">
      <ng-template matTabContent>
        <pinch-zoom style="height: 100%"><div class="img-wrapper"><img [src]="festivalMap" alt="Map"></div></pinch-zoom>
      </ng-template>
    </mat-tab>
  }

  @if (competitionMap || competitionsInfo) {
    <mat-tab [label]="competitionMapLabel">
      <ng-template matTabContent>
        <mat-tab-group class="sub-tabs">
          @if (competitionMap) {
            <mat-tab [label]="'Mapa' | translate">
              <ng-template matTabContent><pinch-zoom style="height: 100%"><div class="img-wrapper"><img [src]="competitionMap" alt="Map"></div></pinch-zoom></ng-template>
            </mat-tab>
          }
          @if (competitionsInfo) {
            <mat-tab [label]="'další info' | translate">
              <ng-template matTabContent><app-competitions-info [data]="competitionsInfo!"/></ng-template>
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
              <ng-template matTabContent><pinch-zoom style="height: 100%"><div class="img-wrapper"><img [src]="tribesMap" alt="Map"></div></pinch-zoom></ng-template>
            </mat-tab>
          }
          @if (tribesInfo) {
            <mat-tab [label]="'další info' | translate">
              <ng-template matTabContent><app-tribes-info [data]="tribesInfo!"/></ng-template>
            </mat-tab>
          }
        </mat-tab-group>
      </ng-template>
    </mat-tab>
  }
</mat-tab-group>
```

**`src/assets/i18n/en.json`:** přidat `"další info": "More info"` (CS používá klíč napřímo, takže `cs.json` měnit netřeba). Stávající nepoužité klíče (`Hlavní`, `Soutěže`, `Atrakce&kmeny`, `Otevírací doba`) nechat být (neškodí).

## Hraniční případy / chování

- **map1 záložka** — jen když existuje obrázek map1.
- **map2 záložka** — když existuje obrázek map2 **nebo** `competitionsInfo`. Uvnitř: „Mapa" (když obrázek) + „další info" (když info). Když jen jedno, zobrazí se jen ta jedna pod-záložka.
- **map3 záložka** — analogicky s `tribesInfo`.
- **Prázdný label** — fallback: druhý jazyk → `'Mapa'` (přeložené).
- **Změna jazyka za běhu** — `onLangChange` → `markForCheck()` přerendruje titulky.
- **Stará data bez labelů** — labely prázdné → fallback `'Mapa'`.

## Dotčené soubory

**event-manager-frontend:**
- Změna: `src/app/common/services/customization/customization.service.ts` (`IMapImage` + `maps` getter propustí labely)
- Změna: `src/app/modules/map/map.component.ts` (label gettery, TranslateService, onLangChange)
- Změna: `src/app/modules/map/map.component.html` (restruktura záložek)
- Změna: `src/assets/i18n/en.json` (`další info`)
- Změna/nový: `src/app/modules/map/map.component.spec.ts` (testy)

**festival-planner:**
- Změna: `apps/frontend/src/app/admin/customization/page.tsx` (tři pevné sloty + labely)

## Testy

**event-manager-frontend (jasmine/karma):**
- `MapComponent`:
  - `…MapLabel` vrací CS label při jazyce `cs`, EN label při `en`.
  - fallback na druhý jazyk, když primární prázdný; fallback na `'Mapa'`, když oba prázdné.
  - `festivalMap`/`competitionMap`/`tribesMap` vrací `value` správné mapy podle `name`.
  - (mock `CustomizationService.maps` + `TranslateService`).

**festival-planner:** bez test runneru → ESLint + dev-server compile.

## Akceptační kritéria

1. V administraci jsou **tři pevné sloty** map1/map2/map3; u každého upload obrázku + Label (CS) + Label (EN).
2. Uložené labely se vrací z `GET /public/customization` v poli `maps` jako `labelCs`/`labelEn`.
3. V mobilu jsou horní záložky map **titulkované labely** podle zvoleného jazyka.
4. Pod-záložka doprovodného info se jmenuje **„další info"** (EN „More info"); „Mapa" pod-záložka zůstává.
5. Záložka mapy se zobrazí jen když má obrázek (map2/map3 i když existuje příslušné info).
6. Prázdný label → fallback (druhý jazyk → „Mapa"); změna jazyka za běhu titulky aktualizuje.
7. Buildy projdou; unit testy `MapComponent` projdou; admin ESLint čistý.
