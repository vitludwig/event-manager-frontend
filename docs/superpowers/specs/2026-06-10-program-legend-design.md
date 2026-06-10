# Spec: Legenda typů akcí v sekundárním toolbaru programu

**Datum:** 2026-06-10
**Repo:** event-manager-frontend (mobilní app), branch `mobile-app`
**Status:** Schváleno (design + abecední řazení potvrzeno uživatelem)

## Cíl

Do rozbalovacího sekundárního toolbaru programu (`full-program__secondary-toolbar`)
přidat kompaktní, mobile-first **legendu** mapující barvu na název typu akce, aby
uživatel poznal, co která barva v kalendáři znamená.

## Kontext

- Sekundární toolbar je sbalitelný tmavý (`#151515`) pruh pod hlavním toolbarem
  programu. Otevírá se tlačítkem `more_vert` (`toggleSecondaryToolbar()`), které
  přidá/odebere třídu `opened` na `#secondaryToolbar` elementu.
- Dnes obsahuje řádek: tlačítko `refresh` (vlevo) + `app-language-menu` (vpravo).
- Typy akcí: `programService.eventTypes: IEventType[]`, kde
  `IEventType = { id: string; name: string; color: string }`.
- `eventTypes` je **prosté pole**, plněné v `loadEventTypes()` na konci
  `loadProgramData()`. Po jeho naplnění **nevystřelí žádný signál** — data dorazí
  HTTP requestem, jehož dokončení spustí zone CD tick.

## Návrh

### Nová komponenta `EventLegendComponent` (`app-event-legend`)

- Standalone, samostatná komponenta ve
  `src/app/modules/program/components/full-program/components/event-legend/`.
- Injektuje `ProgramService` (zdroj typů) a `TranslateService` (locale pro řazení).
- Vystaví getter `eventTypes`, který vrací **kopii** `programService.eventTypes`
  seřazenou **abecedně** podle `name`:
  `[...this.programService.eventTypes].sort((a, b) => a.name.localeCompare(b.name, this.translate.currentLang))`
  (kopie kvůli neměnnosti pole ve service; konzistentní s řazením v `ListFilterComponent`).
- **`ChangeDetectionStrategy.Default`** (záměrná výjimka z OnPush konvence appky):
  `eventTypes` není signál a po jeho naplnění nevystřelí žádný signál, takže OnPush
  komponenta bez inputů by zůstala prázdná. Default CD znovu přečte getter při zone
  ticku z dokončeného event-types HTTP requestu i při změně jazyka. Komponenta je
  triviální (pár chipů), náklad default CD je zanedbatelný. Rationale zdokumentovat
  komentářem u dekorátoru.

### Šablona

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

- Žádné typy → nevykreslí se nic.
- `name` se zobrazuje přímo (`IEventType` má jen jednojazyčný `name`).

### Styl (mobile-first)

- `.event-legend`: `display: flex; flex-wrap: wrap;` s mezerou (`gap`), padding po
  stranách shodný s toolbarem. Chipy se na úzkém mobilu zalomí do více řádků
  (rozhodnutí uživatele: „zalamovat — toolbar roste“). Žádný horizontální scroll.
- `.event-legend__item`: `display: inline-flex; align-items: center;` malá mezera mezi
  tečkou a textem; `white-space: nowrap` (název se uvnitř chipu nezalomí).
- `.event-legend__swatch`: malá kulatá tečka (~12px), `border-radius: 50%`,
  `background-color` = `type.color`, `flex-shrink: 0`.
- `.event-legend__label`: světlý text (kontrast na `#151515`), drobné písmo (~12–13px).

### Integrace do `full-program.component.html`

Sekundární toolbar přestrukturovat tak, aby se sbalovala **celá** sekce (řádek
ovládání + legenda) společně, ne jen `mat-toolbar`:

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

`FullProgramComponent` doplnit do `imports` `EventLegendComponent`.

### Animace / výška (SCSS)

Collapse animaci přesunout z `mat-toolbar height` na `max-height` kontejneru
`.full-program__secondary-toolbar`, aby pojal libovolně zalomené chipy:

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

(`50vh` = dostatečná rezerva pro mnoho typů; `overflow: auto` v otevřeném stavu
zajistí scroll v krajním případě extrémně mnoha typů.)

## Hraniční případy

- 0 typů akcí → legenda se nevykreslí (toolbar = jen stávající řádek).
- Mnoho typů → chipy se zalomí, toolbar roste do výšky (max `50vh`, pak scroll).
- Dlouhý název → chip se nezalomí uvnitř, zlom je mezi chipy.
- Změna jazyka → default CD znovu seřadí (locale) i překreslí.

## Testy

`event-legend.component.spec.ts` (jasmine/karma) s mockem `ProgramService`:

1. Vytvoří se.
2. Vykreslí jeden chip na každý typ akce.
3. Chip zobrazuje `name` typu.
4. Swatch má `background-color` = `type.color`.
5. Typy jsou seřazené abecedně podle `name`.
6. Prázdné `eventTypes` → žádný chip.
7. Nemutuje `programService.eventTypes` (řadí kopii).

## Mimo rozsah

- Klik na legendu = filtr (legenda je jen informativní).
- Per-language názvy typů (`IEventType` má jen `name`).
- Změny backendu / administrace (typy akcí už existují přes `/public/event-types`).

## Dotčené soubory

- **Nové:** `components/event-legend/event-legend.component.{ts,html,scss,spec.ts}`
- **Upravené:** `full-program.component.html` (vložení `<app-event-legend>` + restrukturace
  sekundárního toolbaru), `full-program.component.ts` (import komponenty),
  `full-program.component.scss` (max-height animace).
