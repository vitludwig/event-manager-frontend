# Stacking překrývajících se eventů na stejném místě

**Datum:** 2026-06-08
**Modul:** `src/app/modules/program/components/full-program`
**Branch (návrh):** `mobile-app`

## Problém

Program je horizontální časová osa: osa X je čas rozdělený na 15min segmenty, každé **místo** (location) je jeden vodorovný řádek a eventy se v něm pozicují absolutně podle času. Když dva eventy na stejném místě sdílejí čas:

1. **Vizuální překryv** — eventy s různým začátkem, ale překrývajícím se časem se kreslí přes sebe ve stejném 65px pásu (`position:absolute; top` fixní, `z-index:1`, `opacity:0.8`). Druhý event částečně zakryje první → nečitelné.
2. **Skrytý bug / ztráta dat** — `full-program.component.ts` plní `eventsByPlaces` jako `result[locationId][startSegment] = event`. **Pokud dva eventy na stejném místě začnou ve stejném segmentu, druhý přepíše první a z UI úplně zmizí.**

## Cíl

- Překrývající se eventy na stejném místě zobrazit **pod sebou** ve vlastních vodorovných pruzích (lanes), vodorovná pozice (= čas) i šířka (= délka) zůstávají.
- **Rozpoznatelnost**, že jde o stejné místo: u míst s překryvem **zlatá svislá lišta vlevo** (sticky), v barvě názvu místa.
- Opravit ztrátu eventů se shodným začátkem.

## Mimo rozsah (non-goals)

- Žádný strop počtu pruhů ani „+N další" overflow — řádek roste donekonečna (typicky max 2–3 souběžné).
- Žádné unikátní barvy per místo — lišta je jednotná zlatá (`#b08d00`).
- Žádná změna časové mřížky, zoomu, filtrů, detailu eventu.

## Zvolený přístup

**Hybrid: zachovat stávající flex grid (horizontála) + přidat pruhy jako vertikální nádstavbu.**

Horizontální layout (flex řada N segmentových buněk po `segmentWidth` + dnešní mechanismus rozpětí eventu přes `left:0` / `right` / `width`) zůstává **beze změny** — je odzkoušený na obou platformách a zaručuje zarovnání s časovou osou *strukturálně* (viz [Webview rizika](#webview-rizika-ios-wkwebview--android-chromium)). Nově se přidá jen:

1. **víc eventů na buňku** (pole místo přepisu klíčem `startSegment`) → opraví ztrátu eventů,
2. **vertikální offset `top = lane × laneStride`** na eventu → naskládá překryvy pod sebe,
3. **vyšší řádek** (`rowHeight` podle počtu pruhů),
4. **zlatá sticky lišta** u míst s překryvem.

Počet pruhů a jejich přiřazení spočítá samostatná čistá funkce (unit-testovatelná).

**Zamítnutá alternativa — čistý track** (jeden relativní kontejner na plnou šířku, event absolutně `left = startSegment × segmentWidth`): méně DOM uzlů, ale zarovnání přestává být strukturální a stává se aritmetickým → pod neceločíselným `zoom` (pinch 0.4–1.0) hrozí ~1–2px drift eventů vůči mřížce, **jinak zaokrouhlený ve WebKitu (iOS) než v Blinku (Android)**. Hybrid tomu předchází.

## Návrh

### 1. Přiřazení pruhů — čistá funkce

Nový soubor `full-program/utils/layout-place-events.ts`:

```ts
export function layoutPlaceEvents(events: IProgramEvent[]): IProgramPlaceLayout
```

Algoritmus (greedy interval partitioning, minimální počet pruhů):

1. Seřadit eventy podle `startSegment` vzestupně, při shodě podle `segmentCount` sestupně (deterministické).
2. Vést `lanesEnd: number[]` = koncový segment (exkluzivně) posledního eventu v každém pruhu.
3. Pro každý event: `end = startSegment + segmentCount`. Najít nejmenší index pruhu, kde `lanesEnd[i] <= startSegment` (pruh je volný). Přiřadit `event.lane = i`, nastavit `lanesEnd[i] = end`. Pokud žádný volný není, založit nový pruh.
4. `laneCount = Math.max(1, lanesEnd.length)` (prázdné pole → 1), `hasOverlap = laneCount > 1`.

Dotykové hrany se nepovažují za překryv: event končící v segmentu 6 a event začínající v segmentu 6 sdílejí pruh (`6 <= 6`).

### 2. Datový model

Nový soubor `full-program/types/IProgramPlaceLayout.ts`:

```ts
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

`layoutPlaceEvents()` vrací rovnou tuto strukturu: interně přiřadí pruhy nad zploštělým seřazeným polem (kvůli korektnosti a testovatelnosti algoritmu), pak eventy seskupí podle `startSegment` do `eventsByStartSegment` (kvůli vykreslení po buňkách).

`full-program.component.ts` — `eventsByPlaces` se změní z
`Signal<Record<string, Record<number, IProgramEvent>>>`
na
`Signal<Record<string, IProgramPlaceLayout>>`.

Výpočet `startSegment`/`segmentCount` zůstává stejný, ale eventy se per místo **sbírají do pole** (žádné přiřazení klíčem `result[loc][startSegment] = event`, tedy žádný přepis) a na konec se per místo zavolá `layoutPlaceEvents(...)`.

### 3. Vykreslení

**`list-place`** si **ponechá** stávající flex řadu segmentových buněk (`@for (segment of segments)`), jen:

- Vstup se změní z `events: Record<number, IProgramEvent>` na `layout: IProgramPlaceLayout`.
- V každé buňce se místo jednoho eventu vykreslí **pole** eventů, které v daném segmentu začínají:
  ```html
  @for (event of layout.eventsByStartSegment[segment.index] ?? []; track event.id) {
    <app-list-event [event]="event" (eventSelect)="…"></app-list-event>
  }
  ```
- **Výška řádku/buňky** se nastaví dynamicky: `[style.height.px]="rowHeight(layout.laneCount)"`, kde
  `rowHeight(n) = n × laneStride − laneGap` (pro `n=1` vyjde 65px = **dnešní výška, beze změny**).

**`list-event`** zůstane horizontálně **beze změny** (`left:0` + `right`/`width` span = odzkoušené zarovnání). Přidá se jediné: vertikální offset pruhu na tlačítku
```html
[style.top.px]="fullProgramConfig.laneStride * event.lane"
```
(`event.lane` nese `IProgramEventLayout`). Pro `lane=0` je `top:0` → jednopruhové eventy vypadají identicky jako dnes.

**Konstanty** v `FullProgramConfig`: přidat `eventHeight = 65`, `laneGap = 4`, `laneStride = eventHeight + laneGap = 69`. Výška eventu (65px) zůstává.

#### Zarovnání s časovou osou (proč hybrid)

Horizontální zarovnání zůstává **strukturální a nezměněné**: timeline i řádek místa jsou dál **dvě flex řady N buněk po `segmentWidth`** uvnitř společného `.list-horizontal` (sdílený `zoom` i scroll). Ať engine pod `zoom` (i neceločíselným z pinche) zaokrouhlí buňku jakkoli, udělá to pro timeline i místo **identicky** → sloupec `k` má v obou stejnou kumulativní pozici. Pruhy přidávají jen **vertikální** offset (`top`), který se zarovnáním s časovou osou nesouvisí. Tím je zarovnání imunní vůči rozdílu zaokrouhlování WebKit vs Blink (na rozdíl od zamítnutého čistého tracku).

### 4. Rozpoznatelnost — zlatá lišta vlevo

Lišta se vykreslí jako **sourozenec** uvnitř `.place` (stejný sticky kontext jako název místa), když `layout.hasOverlap`:

- `width: 4px`, `background: #b08d00`, `border-radius: 3px`, výška = `rowHeight(layout.laneCount)`.
- **Sticky vlevo** (`position: sticky; left: 15px`) — při horizontálním scrollu zůstane přilepená vlevo, stejně jako už teď sticky název místa.
- Bez překryvu (`!hasOverlap`) lišta není.

> ⚠️ **Pravidlo kvůli iOS WKWebView:** na lištu ani na žádného jejího nového předka (`.place`, `.place__segment-list`, buňky) **nepřidávat** `overflow: hidden/auto`, `transform`, `filter`, `contain` ani `will-change` — WebKit by sticky pozicování utnul nebo přesměroval. Sticky název místa dnes funguje právě proto, že žádný jeho předek neclipuje/netransformuje; lišta musí zůstat ve stejném režimu.

## Hraniční případy

- **Stejný start segment** — oba eventy dostanou různé pruhy, oba viditelné (oprava bugu).
- **Dotykové hrany** (jeden končí, druhý začíná ve stejném segmentu) — sdílejí pruh, řádek neroste.
- **3+ souběžných** — tolik pruhů, kolik je potřeba; řádek roste.
- **Prázdné místo** — `eventsByStartSegment: {}`, `laneCount: 1`, `hasOverlap: false`; řádek 65px jako dnes, žádná lišta.
- **Event přes půlnoc / brzy ráno** — beze změny logiky; `startSegment`/`segmentCount` se počítají jako dnes.

## Webview rizika (iOS WKWebView / Android Chromium)

App běží v Capacitoru 7 (WKWebView na iOS, System WebView/Chromium na Androidu). `zoom` (0.4–1.0) i `position: sticky` se v této obrazovce **už dnes používají v produkci**, takže fungují na obou platformách — riziko nejsou ony, ale to, jak se o ně nový kód opře.

| # | Riziko | Jak hybrid řeší |
|---|--------|-----------------|
| 1 | **Zarovnání pod neceločíselným `zoom`** se rozjede mezi WebKit a Blink, pokud event pozicujeme spočítaným `left` místo přes flex grid. | Flex grid **zachován** → zarovnání zůstává strukturální a engine-nezávislé (viz §3). |
| 2 | **Sticky lišta se na iOS utne**, je-li uvnitř předka s `overflow`/`transform`/`contain`. | Lišta je sticky sourozenec ve stejném (neclipovaném) kontextu jako název; zákaz clip/transform na předcích (viz §4). |
| 3 | **Vyšší řádky + `100vh` mřížka** na iOS (visual viewport / safe-area). | Mřížka je `sticky` z timeline → pokrývá viditelnou oblast i u vyšších řádků; beze změny chování. Pouze ověřit vizuálně. |

Mimo dosah feature (existující, nezhoršené): `getBoundingClientRect`+`zoom` ve scroll-to-now (čte `segmentNow` v timeline, nezměněno); safe-area insety (řešeno v jiných komponentách).

## Dotčené soubory

- **Nový:** `full-program/utils/layout-place-events.ts` + `layout-place-events.spec.ts`
- **Nový:** `full-program/types/IProgramPlaceLayout.ts`
- **Změna:** `full-program/full-program.component.ts` (`eventsByPlaces` → `IProgramPlaceLayout`)
- **Změna:** `full-program/full-program.component.html` (binding `[events]` → `[layout]`)
- **Změna:** `list-place/list-place.component.{ts,html,scss}` (pole eventů na buňku, `rowHeight`, sticky lišta) — **flex buňky i horizontální mechanismus zůstávají**
- **Změna:** `list-event/list-event.component.{ts,html,scss}` (přidat `[style.top.px]` pro pruh) — **horizontální `left`/`right`/`width` beze změny**
- **Změna:** `FullProgramConfig.ts` (`eventHeight`, `laneGap`, `laneStride`)
- **Změna specs:** `list-place`, `list-event`, `full-program` (přizpůsobit novému modelu)

## Testy (TDD)

Unit testy pro `layoutPlaceEvents`:
- žádný překryv → 1 pruh, `hasOverlap=false`
- dotykové hrany → 1 pruh
- dva překrývající se → 2 pruhy, správné `lane`
- stejný start segment → 2 pruhy, oba v `eventsByStartSegment` (oba zachovány)
- 3+ souběžných → 3 pruhy
- prázdné pole → `laneCount=1`, `hasOverlap=false`, `eventsByStartSegment={}`
- determinismus řazení

Aktualizace stávajících specs `list-place` / `list-event` / `full-program` na nový datový model.

## Akceptační kritéria

1. Dva časově se překrývající eventy na stejném místě jsou v samostatných pruzích pod sebou, **oba plně viditelné**.
2. Dva eventy se **shodným začátkem** na stejném místě jsou oba viditelné (žádná ztráta).
3. Místo **bez** překryvu má nezměněnou výšku a **žádnou lištu**.
4. Místo **s** překryvem má zlatou sticky lištu vlevo.
5. Vodorovná pozice odpovídá času, šířka délce; **zarovnání s časovou osou je pixelově identické s dneškem** i pod neceločíselným pinch-zoomem (žádná regrese na iOS ani Androidu).
6. **Jednopruhový řádek má stále výšku 65px** (žádná vizuální regrese u míst bez překryvu).
7. 3+ souběžných eventů → odpovídající počet pruhů, řádek roste.
8. Sticky lišta drží přilepená vlevo při horizontálním scrollu na iOS i Androidu (žádný předek neclipuje/netransformuje).
9. `yarn run build` projde; unit testy `layoutPlaceEvents` i upravené specs projdou (`yarn run test`).
