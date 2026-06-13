# Oprava překryvu obsahu u krátkých akcí — Implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **NECOMMITOVAT:** Uživatel požádal, aby se v tomto sezení nic necommitovalo.
> Commit kroky jsou níže označené jako **ODLOŽENO** — neprovádět je, dokud to
> uživatel výslovně neschválí. Vše ostatní (editace, testy, build) proběhne normálně.

**Goal:** U krátkých akcí (15/30 min) s dlouhým názvem nebo tagy se obsah karty
nikdy nepřekrývá — název se ořízne ellipsisem, tagy mají rezervovaný dolní pruh a
na nejužších kartách se skryjí.

**Architecture:** Překryv se řeší konstrukčně. (1) CSS line-clamp na názvu zaručí,
že nepřeroste svůj řádkový rozpočet. (2) Když jsou tagy, `.card-content` má
`padding-bottom` rezervující dolní pruh, takže vycentrovaný název nedosáhne na
absolutně pozicované tagy. (3) Komponenta filtruje tagy přes tři navrstvené limity
(konfigurovaný strop → pod 60 min max 1 → moc úzká karta 0). Pipe `eventEllipsis`
(křehké znakové zkracování) se ruší, CSS clamp ho nahrazuje.

**Tech Stack:** Angular (standalone komponenty, control-flow `@if/@for`), SCSS,
dayjs, Jasmine + Karma (`npm run test` → headless Chrome, jeden běh).

---

## Struktura souborů

| Soubor | Odpovědnost | Akce |
|---|---|---|
| `.../full-program/FullProgramConfig.ts` | konstanta `minTagWidthPx` (potřebuje TS) | upravit |
| `.../list-event/list-event.component.ts` | `cardWidthPx` + navrstvené limity ve `visibleTags`, dayjs import, odebrat pipe | upravit |
| `.../list-event/list-event.component.html` | `[class.has-tags]`, odebrat `\| eventEllipsis` | upravit |
| `.../list-event/list-event.component.scss` | line-clamp názvu + rezervovaný pruh přes `.has-tags` | upravit |
| `.../list-event/list-event.component.spec.ts` | testy navrstvených limitů | upravit |
| `.../list-event/pipes/event-ellipsis.pipe.ts` | (rušený pipe) | **smazat** |
| `.../list-event/pipes/event-ellipsis.pipe.spec.ts` | (test rušeného pipe) | **smazat** |

> Pozn. k umístění konstant: `minTagWidthPx` žije ve `FullProgramConfig`, protože
> ho čte TS (`visibleTags`). Zbylé hodnoty ze specu (`tagStripHeight`,
> `titleMaxLines`, `titleMaxLinesWithTags`) jsou čistě CSS záležitost a v plánu žijí
> jako SCSS proměnné u stylů, které je používají (čitelnější než provazovat
> `-webkit-line-clamp` přes CSS custom property z TS). Vědomá drobná odchylka od specu.

Všechny cesty jsou relativní k:
`src/app/modules/program/components/full-program/`

---

## Task 1: Navrstvené limity ve `visibleTags` (TS + testy)

**Files:**
- Modify: `src/app/modules/program/components/full-program/FullProgramConfig.ts`
- Modify: `.../components/list-event/list-event.component.ts`
- Test: `.../components/list-event/list-event.component.spec.ts`

- [ ] **Step 1: Napsat padající testy**

V `list-event.component.spec.ts` přidej **dovnitř** bloku `describe('visibleTags', () => { ... })`
(za poslední `it(...)`, před jeho uzavírací `});` na řádku 106) tyto tři testy —
využívají už existující konstantu `tags` a `afterEach`, který resetuje
`eventCardTagCount`:

```ts
it('caps to a single tag for events shorter than 60 minutes', () => {
    mockCustomizationService.eventCardTagCount = 3;
    component.event = {
        ...component.event,
        startAt: '2025-07-10T14:00:00Z',
        endAt: '2025-07-10T14:30:00Z',   // 30 min
        segmentCount: 2,                  // ~88px — dost široká na 1 tag
        tags,
    } as any;
    expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a']);
});

it('hides all tags when the card is too narrow (15-minute event)', () => {
    mockCustomizationService.eventCardTagCount = 3;
    component.event = {
        ...component.event,
        startAt: '2025-07-10T14:00:00Z',
        endAt: '2025-07-10T14:15:00Z',   // 15 min
        segmentCount: 1,                  // ~43px < minTagWidthPx
        tags,
    } as any;
    expect((component as any).visibleTags).toEqual([]);
});

it('still shows multiple tags for a 60-minute (wide) event', () => {
    mockCustomizationService.eventCardTagCount = 3;
    component.event = {
        ...component.event,
        startAt: '2025-07-10T14:00:00Z',
        endAt: '2025-07-10T15:00:00Z',   // 60 min — strop pod 60 min se NEuplatní
        segmentCount: 4,                  // široká
        tags,
    } as any;
    expect((component as any).visibleTags.map((t: any) => t.id)).toEqual(['a', 'b', 'c']);
});
```

- [ ] **Step 2: Spustit testy — ověřit, že padají**

Run: `npm run test`
Expected: FAIL — první nový test vrátí `['a','b','c']` místo `['a']` (strop pod
60 min ještě neexistuje), druhý vrátí `['a']` místo `[]` (šířkové hradlo neexistuje).

- [ ] **Step 3: Přidat konstantu `minTagWidthPx` do `FullProgramConfig`**

V `FullProgramConfig.ts` přidej za `laneStride` (řádek 25) novou konstantu:

```ts
	/**
	 * Minimální šířka karty (px), při které se ještě zobrazují tagy.
	 * Pod ní (typicky 15min akce, ~43px) se tagy skryjí, aby se nepřekrývaly s názvem.
	 */
	public static minTagWidthPx: number = 60;
```

- [ ] **Step 4: Upravit `visibleTags` a přidat `cardWidthPx` v komponentě**

V `list-event.component.ts` přidej na začátek import dayjs (za stávající importy,
např. pod řádek s `IEventTag`):

```ts
import dayjs from 'dayjs';
```

Nahraď stávající getter `visibleTags` (řádky 33–36) tímto:

```ts
	protected get cardWidthPx(): number {
		return FullProgramConfig.segmentWidth * (this.event?.segmentCount ?? 0) - 2;
	}

	protected get visibleTags(): IEventTag[] {
		let limit = this.customizationService.eventCardTagCount ?? 1;

		const durationMinutes = dayjs(this.event?.endAt).diff(dayjs(this.event?.startAt), 'minutes');
		if (durationMinutes < 60) {
			limit = Math.min(limit, 1);
		}

		if (this.cardWidthPx < FullProgramConfig.minTagWidthPx) {
			limit = 0;
		}

		return (this.event?.tags ?? []).slice(0, limit);
	}
```

- [ ] **Step 5: Spustit testy — ověřit, že prochází**

Run: `npm run test`
Expected: PASS — všech 5 testů ve `visibleTags` (3 nové + zachované staré, protože
existující event je přesně 60 min `segmentCount: 4`, takže strop „pod 60 min" se
neuplatní a šířka 178px ≥ 60).

- [ ] **Step 6: Commit — ODLOŽENO** (necommitovat, viz poznámka nahoře)

---

## Task 2: Zrušit pipe `eventEllipsis`

**Files:**
- Modify: `.../components/list-event/list-event.component.html:17`
- Modify: `.../components/list-event/list-event.component.ts` (import + `imports` pole)
- Delete: `.../components/list-event/pipes/event-ellipsis.pipe.ts`
- Delete: `.../components/list-event/pipes/event-ellipsis.pipe.spec.ts`

- [ ] **Step 1: Odebrat pipe ze šablony**

V `list-event.component.html` řádek 17 změň z:

```html
      <div class="card-title">{{ event | translateEventProperty: 'name' | eventEllipsis: event }}</div>
```

na:

```html
      <div class="card-title">{{ event | translateEventProperty: 'name' }}</div>
```

- [ ] **Step 2: Odebrat pipe z komponenty**

V `list-event.component.ts` smaž import (řádek 9):

```ts
import {EventEllipsisPipe} from './pipes/event-ellipsis.pipe';
```

a v `imports` poli `@Component` (řádek 17) odeber `EventEllipsisPipe`, takže zůstane:

```ts
    imports: [MatButtonModule, MatIconModule, TranslateEventPropertyPipe],
```

- [ ] **Step 3: Ověřit, že pipe nikde jinde není**

Run: `grep -rn "eventEllipsis\|EventEllipsisPipe" src`
Expected: žádný výstup (jediná použití byla právě odebrána).

- [ ] **Step 4: Smazat soubory pipe**

Run:
```bash
rm src/app/modules/program/components/full-program/components/list-event/pipes/event-ellipsis.pipe.ts
rm src/app/modules/program/components/full-program/components/list-event/pipes/event-ellipsis.pipe.spec.ts
```

- [ ] **Step 5: Spustit testy + build — ověřit zelenou**

Run: `npm run test`
Expected: PASS — sada projde i bez `event-ellipsis.pipe.spec.ts`; `ListEventComponent`
se sestaví bez chybějícího importu.

- [ ] **Step 6: Commit — ODLOŽENO** (necommitovat, viz poznámka nahoře)

---

## Task 3: CSS — ořez názvu + rezervovaný pruh pro tagy

**Files:**
- Modify: `.../components/list-event/list-event.component.html` (`[class.has-tags]`)
- Modify: `.../components/list-event/list-event.component.scss`

- [ ] **Step 1: Přidat `has-tags` třídu na kartu**

V `list-event.component.html` přidej na `<button>` (řádky 2–8) binding třídy.
Za řádek `[style.background-color]="..."` (ř. 6) přidej:

```html
    [class.has-tags]="visibleTags.length > 0"
```

Výsledné otevření tagu:

```html
  <button class="place__segment__event text-overflow-ellipsis"
    [style.right]="-(fullProgramConfig.segmentWidth * (event.segmentCount - 1)) + 'px'"
    [style.width]="(fullProgramConfig.segmentWidth * (event.segmentCount - 1)) + fullProgramConfig.segmentWidth - 2 + 'px'"
    [style.top.px]="fullProgramConfig.laneStride * event.lane"
    [style.background-color]="event.eventType.color + ' !important'"
    [class.has-tags]="visibleTags.length > 0"
    (click)="showDetail(event)"
    >
```

- [ ] **Step 2: Přidat SCSS proměnné nahoru do stylu**

Na úplný začátek `list-event.component.scss` (před `.place__segment__event {`) přidej:

```scss
// Layout konstanty pro ořez obsahu krátkých karet
// (viz docs/superpowers/specs/2026-06-12-short-event-card-overlap-design.md).
// minTagWidthPx (skrytí tagů podle šířky) žije ve FullProgramConfig, protože ho čte TS.
$tag-strip-height: 24px;          // rezervovaný dolní pruh pro řádek tagů
$title-max-lines: 3;              // ořez názvu bez tagů
$title-max-lines-with-tags: 2;    // ořez názvu s tagy (vejde se nad rezervovaný pruh)
```

- [ ] **Step 3: Ořez názvu (line-clamp) na `.card-title`**

V `list-event.component.scss` nahraď stávající blok `.card-title` (řádky 46–50):

```scss
	.card-title {
		//font-weight: 700;
		//letter-spacing: 0.5px;
		font-size: 13px;
	}
```

tímto:

```scss
	.card-title {
		//font-weight: 700;
		//letter-spacing: 0.5px;
		font-size: 13px;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: $title-max-lines;
		line-clamp: $title-max-lines;
		overflow: hidden;
		overflow-wrap: anywhere;   // zlomí i dlouhý jednoslovný název
	}
```

- [ ] **Step 4: Rezervace dolního pruhu + menší ořez, když jsou tagy**

V `list-event.component.scss` přidej **dovnitř** selektoru `.place__segment__event`
(např. hned za blok `.card-title`, stále uvnitř `.place__segment__event { ... }`,
před jeho uzavírací `}` na řádku 68) tento vnořený blok:

```scss
	&.has-tags {
		.card-content {
			padding-bottom: $tag-strip-height;   // místo pro absolutně pozicovaný řádek tagů
		}

		.card-title {
			-webkit-line-clamp: $title-max-lines-with-tags;
			line-clamp: $title-max-lines-with-tags;
		}
	}
```

- [ ] **Step 5: Build — ověřit, že SCSS i šablona projdou**

Run: `npm run build`
Expected: build projde bez chyb (žádný neznámý symbol v šabloně, validní SCSS).

- [ ] **Step 6: Commit — ODLOŽENO** (necommitovat, viz poznámka nahoře)

---

## Task 4: Finální ověření

**Files:** (žádné změny — jen verifikace)

- [ ] **Step 1: Plná testovací sada**

Run: `npm run test`
Expected: PASS, 0 failures.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: úspěšný build.

- [ ] **Step 3: Manuální kontrola v appce**

Spusť app (`npm start` / dev server), otevři programový kalendář a ověř na scénářích
ze screenshotu z 2026-06-12:
- 30min akce s dlouhým názvem + 1 tag („Latexová módní přehlídka" + „Móda"):
  název ořezaný `…` ve 2 řádcích, tag v dolním pruhu, **žádný překryv**.
- 15min akce: žádné tagy, název dostane celou kartu, ořez `…`.
- dlouhá akce (≥ 60 min) s víc tagy (`eventCardTagCount ≥ 2`): tagy beze změny,
  název na 3 řádky max.
- akce s hvězdičkou (favorite) + krátká: sidebar nerozbíjí layout, žádný překryv.

- [ ] **Step 4: Commit — ODLOŽENO** (necommitovat, viz poznámka nahoře)

---

## Self-review (vyplněno autorem plánu)

- **Pokrytí specu:** clamp názvu → Task 3 Step 3; rezervace pruhu → Task 3 Step 4;
  šířkové hradlo + strop pod 60 min → Task 1 Step 4; `minTagWidthPx` konstanta →
  Task 1 Step 3; zrušení pipe → Task 2; testy → Task 1 Step 1; manuální ověření →
  Task 4 Step 3. Konstanty `tagStripHeight`/`titleMaxLines*` → Task 3 Step 2 (jako
  SCSS proměnné, vědomá odchylka zdokumentovaná výše).
- **Bez placeholderů:** všechny kroky obsahují konkrétní kód/příkaz.
- **Konzistence typů/jmen:** `visibleTags`, `cardWidthPx`, `minTagWidthPx`,
  `has-tags`, `$tag-strip-height`, `$title-max-lines`, `$title-max-lines-with-tags`
  použité konzistentně napříč TS/HTML/SCSS.
