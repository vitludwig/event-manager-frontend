# Spec: Konfigurovatelný počet tagů v programové kartě

**Datum:** 2026-06-10
**Repos:** festival-planner (admin + backend) ↔ event-manager-frontend (mobilní app)
**Status:** Schváleno (klíč `eventCardTagCount`, default 1)

## Cíl

Umožnit adminovi nastavit jedním číslem (0–n), kolik tagů se zobrazí v obdélníčku
akce v programovém kalendáři mobilní appky (`list-event`). Cílem je lepší
viditelnost / čitelnost karty. **Náhled akce a plný detail nadále zobrazují vždy
všechny tagy — beze změny.**

## Kontext

- Programová karta (`list-event.component`) dnes zobrazuje **právě jeden** tag:
  `event.tags[0]` v pillu `.tag` (absolutně vpravo dole).
- Sdílená komponenta `app-event-tags` (náhled + plný detail) zobrazuje **všechny**
  `event.tags` — tu se NEdotýkáme.
- Customization je key-value úložiště (Prisma JSON). Hodnota se ukládá i vrací
  beze změny; mobilní strana si ji parsuje. Tok:
  admin formulář → `bulkUpsert` → DB → `GET /public/customization` →
  mobilní `CustomizationService`.

## Customization klíč

`eventCardTagCount` — číslo 0–n. Žádná DB migrace (jen rozšíření allow-listů).

## Backend (festival-planner)

`apps/backend/src/customization/dto/upsert-customization.dto.ts`:
- Přidat `'eventCardTagCount'` do `ALLOWED_KEYS`.
- Přidat `'eventCardTagCount'` do `PUBLIC_CUSTOMIZATION_KEYS`.

`getPublic()` vrací hodnotu beze změny (stejně jako ostatní klíče) — žádná další
úprava service.

## Admin (festival-planner)

`apps/frontend/src/app/admin/customization/page.tsx`:
- `initialValues`: přidat `eventCardTagCount: ''`.
- Load-mapování (po fetchnutí dat): `eventCardTagCount: data.eventCardTagCount ?? ''`.
- `handleSubmit` objekt: přidat `eventCardTagCount: values.eventCardTagCount`.
- UI: Mantine `NumberInput` (`min={0}`, `step={1}`, `allowDecimal={false}`),
  label např. „Počet tagů v kartě programu", `{...form.getInputProps('eventCardTagCount')}`.
  Prázdné pole = nenastaveno.

## Mobilní app (event-manager-frontend)

### `CustomizationService`
- `ICustomization`: přidat `eventCardTagCount?: number | string` (raw hodnota z API).
- Getter `eventCardTagCount(): number | undefined`:
  - **Nejdřív** ošetřit „nenastaveno": `value === undefined || value === null || value === ''`
    → `undefined`. (Pozor na past `Number('') === 0` — prázdný řetězec se MUSÍ
    vyřešit jako nenastaveno **před** voláním `Number()`, jinak by se z nenastaveno
    stala 0 = skryté tagy.)
  - jinak `const n = Number(value)`; pokud `Number.isNaN(n)` nebo `n < 0` → `undefined`,
  - jinak `Math.floor(n)` (celé číslo ≥ 0; **včetně 0**).

### `list-event.component.ts`
- Injektovat `CustomizationService`.
- Getter `visibleTags(): IEventTag[]`:
  - `const limit = this.customizationService.eventCardTagCount ?? 1;`
  - `return (this.event?.tags ?? []).slice(0, limit);`

### `list-event.component.html`
Nahradit blok jednoho tagu smyčkou:

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

### `list-event.component.scss`
- `.tags`: kontejner místo dnešního samostatného `.tag` — absolutně vpravo dole
  (`position: absolute; right: 5px; bottom: 3px;`), `display: flex; gap: 4px;`
  v jednom řádku, zarovnání doprava. Přebytek (víc pillů, než se vejde) ořízne
  stávající `overflow: hidden` karty.
- `.tag`: ponechat dosavadní styl pillu (font-size 11px, border, border-radius 5px,
  padding 2px 5px), jen už není sám absolutně pozicovaný (pozicuje obal `.tags`).

## Sémantika počtu

| Hodnota klíče | Chování v kartě |
|---|---|
| nenastaveno / prázdné | **1 tag** (dnešní chování, nerozbije existující nasazení) |
| `0` | žádný tag |
| `N` | prvních `N` tagů z `event.tags` |
| akce má méně tagů než `N` | zobrazí všechny, co má |

## Testy

**Mobile (jasmine/karma):**
- `CustomizationService.eventCardTagCount`: `undefined`→`undefined`, `''`→`undefined`,
  `'3'`→`3`, `'0'`→`0`, `'-2'`→`undefined`, `'abc'`→`undefined`, `2.7`→`2`.
- `ListEventComponent.visibleTags`: default (nenastaveno) → 1 tag; `0` → `[]`;
  `2` → první 2; akce se 3 tagy a limit 5 → všechny 3; akce bez tagů → `[]`.

**Backend (jest), pokud existuje test allow-listů:** ověřit, že `eventCardTagCount`
je v `ALLOWED_CUSTOMIZATION_KEYS` i `PUBLIC_CUSTOMIZATION_KEYS`. Jinak vynechat.

## Mimo rozsah

- „+X" indikátor skrytých tagů (jen ořez, bez indikace).
- Zalamování pillů do druhého řádku (jen jeden řádek vpravo dole).
- Změna `app-event-tags` (náhled / plný detail zůstávají = všechny tagy).
- Per-jazyk u počtu (počet je jedno číslo, jazykově neutrální).

## Dotčené soubory

**festival-planner:**
- `apps/backend/src/customization/dto/upsert-customization.dto.ts` (2 pole)
- `apps/frontend/src/app/admin/customization/page.tsx` (initialValues, load, submit, NumberInput)

**event-manager-frontend:**
- `src/app/common/services/customization/customization.service.ts` (ICustomization + getter)
- `.../list-event/list-event.component.ts` (CustomizationService + visibleTags)
- `.../list-event/list-event.component.html` (smyčka)
- `.../list-event/list-event.component.scss` (`.tags` kontejner)
