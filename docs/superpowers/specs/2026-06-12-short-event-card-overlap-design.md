# Spec: Oprava překryvu obsahu u krátkých akcí v programové kartě

**Datum:** 2026-06-12
**Repo:** event-manager-frontend (mobilní app)
**Status:** Schváleno
**Komponenta:** `list-event` (programový kalendář / `full-program`)

## Cíl

U krátkých akcí (typicky 30 min, často i 15 min) se dlouhý název a/nebo tagy
vzájemně **překrývají** (viz screenshot z 2026-06-12 — „Latexová módní přehlídka"
+ tag „Móda", „Masovej pohon" + „Trigger Warning"). Cílem je, aby se obsah karty
**nikdy nepřekrýval**, bez ohledu na délku názvu a počet tagů.

## Příčina

- Výška karty je **pevných 65px** (`FullProgramConfig.eventHeight`), zatímco
  **šířka** roste s délkou akce (`segmentWidth * segmentCount`). 30min akce má
  šířku ~88px, 15min akce ~43px.
- Název (`.card-title`) je volně tekoucí text bez omezení počtu řádků — dlouhý
  název se **zalomí na 2–3 řádky** a vyplní celou výšku karty.
- Tagy (`.tags`) jsou `position: absolute; right: 5px; bottom: 3px`, takže plovou
  přes pravý dolní roh. Zalomený text názvu na ně narazí → **překryv**.
- Pipe `eventEllipsis` zkracuje název podle délky akce (≤60 min → 28 znaků), ale
  28 znaků je na 88px kartu pořád moc a větev `≤30 min → 8 znaků` je zakomentovaná
  (`event-ellipsis.pipe.ts:19-21`). Zkracování podle počtu znaků je navíc křehké
  (čeština vs. angličtina, 25px sidebar s hvězdičkou, proměnná šířka tagů).

## Návrh řešení

Překryv řešíme **konstrukčně** (aby byl fyzicky nemožný), ne hádáním počtu znaků.
Tři koordinované změny:

### 1. Ořez názvu na pevný počet řádků (CSS)

`.card-title` se stane line-clamp boxem:

```scss
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: <N>;      // z configu (viz níže)
overflow: hidden;
overflow-wrap: anywhere;       // zlomí i dlouhé jednoslovné názvy
```

Tím název **nikdy nepřeroste** svůj řádkový rozpočet — skutečný pixelový ellipsis,
který nahrazuje křehký znakový pipe.

### 2. Rezervace dolního pruhu pro tagy (CSS)

Když jsou tagy přítomné, dostane `.card-content` `padding-bottom: <tagStripHeight>`.
Protože je název svisle vycentrovaný (`justify-content: center`), posune se nahoru
do volné oblasti a tagy vlastní dolní pruh. **Překryv se stává konstrukčně
nemožným** — i kdyby byl řádek tagů širší než karta, stávající `overflow: hidden`
ho jen **ořízne**, nikdy nedopadne na text názvu.

Když jsou tagy zobrazené, ořez názvu klesne na nižší `N` (vejde se do zmenšené
výšky); bez tagů má název celou výšku.

### 3. Skrytí tagů u úzkých karet + strop podle délky (TS)

`list-event.component.ts` spočítá pixelovou šířku karty z `event.segmentCount`
a tagy filtruje přes **tři navrstvené limity** (v tomto pořadí):

```ts
let limit = this.customizationService.eventCardTagCount ?? 1;   // konfigurovaný strop
if (durationMinutes < 60)         limit = Math.min(limit, 1);    // pod 60 min → max 1 tag
if (cardWidthPx < minTagWidthPx)  limit = 0;                     // moc úzká karta → 0 tagů
return (this.event?.tags ?? []).slice(0, limit);
```

`durationMinutes = dayjs(event.endAt).diff(event.startAt, 'minutes')` — stejný
výpočet, jaký používal rušený pipe, teď žije v komponentě.
`cardWidthPx = segmentWidth * segmentCount - 2` (stejný vzorec jako inline
`[style.width]` v šabloně).

## Pravidlo viditelnosti tagů

| Akce | Šířka | Zobrazené tagy |
|---|---|---|
| ≥ 60 min | široká | až `eventCardTagCount` (config, default 1) |
| < 60 min, ≥ ~30 min | ~88px+ | **právě 1** |
| < ~30 min (15 min) | ~43px | **0** (název dostane celou kartu) |

Pozn.: chování se mění jen pro nasazení, která mají `eventCardTagCount ≥ 2`
(default je už dnes 1). Dlouhé akce můžou zobrazit víc tagů, cokoli pod hodinu je
zastropované na jeden.

## Config — nové konstanty v `FullProgramConfig.ts`

| Konstanta | ~Hodnota | Účel |
|---|---|---|
| `tagStripHeight` | ~22px | rezervovaný `padding-bottom` pro řádek tagů |
| `titleMaxLines` | 3 | ořez řádků názvu, **když nejsou** tagy |
| `titleMaxLinesWithTags` | 2 | ořez řádků názvu, **když jsou** tagy (vejde se do zmenšené výšky) |
| `minTagWidthPx` | ~60px | pod touto šířkou karty se tagy skryjí |

Přesné pixely se doladí při implementaci proti reálné geometrii (65px výška,
15px line-height, 11px font tagu + padding/border).

## Cleanup

Pipe `eventEllipsis` je teď nadbytečný (CSS clamp ho nahrazuje). Odstranit:
- pipe `event-ellipsis.pipe.ts` a jeho `.spec.ts`,
- použití `| eventEllipsis: event` v `list-event.component.html:17`,
- import `EventEllipsisPipe` v `list-event.component.ts`.

Ponechat dvojí (znakové + CSS) zkracování by vedlo k podivnému dvojitému ořezu.

## Dotčené soubory

- `.../full-program/FullProgramConfig.ts` — 4 nové konstanty
- `.../list-event/list-event.component.ts` — `cardWidthPx`, navrstvené limity ve
  `visibleTags`, příznak `hasTags` pro šablonu, odstranit import pipe
- `.../list-event/list-event.component.html` — `[class.has-tags]` binding, odstranit
  `| eventEllipsis`
- `.../list-event/list-event.component.scss` — line-clamp názvu, `.has-tags`
  `padding-bottom`, počet řádků podle stavu tagů
- `.../list-event/pipes/event-ellipsis.pipe.ts` + `.spec.ts` — smazat

## Testy

**Mobile (jasmine/karma):**
- `ListEventComponent.visibleTags` / šířkový výpočet:
  - akce ≥ 60 min, široká, `eventCardTagCount` nenastaveno → 1 tag;
  - akce ≥ 60 min, široká, `eventCardTagCount = 3`, akce má 3 tagy → 3 tagy;
  - akce 30 min (segmentCount 2, ~88px), `eventCardTagCount = 3` → **1 tag**
    (strop pod 60 min);
  - akce 15 min (segmentCount 1, ~43px) → **0 tagů** (pod `minTagWidthPx`);
  - akce bez tagů → `[]`.
- `hasTags` odpovídá tomu, jestli `visibleTags` je neprázdné.
- Odstranit `event-ellipsis.pipe.spec.ts`.

**Manuální:** ověřit karty ze screenshotu (30min dlouhý název + tag; 15min) — žádný
překryv; dlouhý název na široké kartě se ořízne ellipsisem, ne přeteče.

> Pozn.: CSS line-clamp a `padding-bottom` se v unit testech neověřují spolehlivě
> (chybí layout engine) — pokrývá je manuální kontrola; unit testy hlídají logiku
> viditelnosti tagů.

## Mimo rozsah

- Změna pevné výšky karty (65px) nebo přechod na výšku úměrnou délce akce.
- „+X" indikátor skrytých tagů (jen ořez/skrytí, bez indikace).
- Zalamování tagů do druhého řádku.
- Konfigurovatelnost prahů přes API (zatím hard-coded v `FullProgramConfig`).
- Změna náhledu akce / plného detailu (`app-event-tags` — beze změny).
