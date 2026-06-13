# Spec: Per-language names for locations and event types

**Datum:** 2026-06-11
**Repos:** festival-planner (backend) ↔ event-manager-frontend (mobilní app)
**Status:** Schváleno (vč. řazení podle localizedName)

## Cíl

Mobilní app zobrazuje jména **lokací** a **typů akcí** podle aktuálního jazyka:
v EN použít `nameEn`, jinak `name` (čeština). `name` je fallback, když je EN
a `nameEn` chybí/prázdné. EN překlady už existují v plánovací appce
(`Location.nameEn`, `EventType.nameEn`).

## Kontext (co už existuje)

- **festival-planner**: `Location` a `EventType` mají `nameEn String?`.
  - `/public/locations` (`getLocations`) vrací `{ id, name, nameEn, order }` ✓
  - `/public/event-types` (`getEventTypes`) vrací `{ id, name, nameEn, color }` ✓
  - `/public/events` (`getPublicEvents`) **embeduje** `location` jako `{ name }` a
    `eventType` jako `{ name, color }` — **bez `nameEn`** (to je díra).
- **mobile**: `IProgramPlace { id, name, order? }`, `IEventType { id, name, color }`
  — `nameEn` zahazují. `event.location` a `event.eventType` jsou tyto typy.

## Backend (festival-planner) — `nameEn` z jednoho zdroje

V `apps/backend/src/public/public.service.ts` zavést dvě sdílené projekce + mappery
(jediné místo, kde se `nameEn` pro danou entitu definuje):

```ts
const PUBLIC_LOCATION_SELECT = { name: true, nameEn: true } as const;
const PUBLIC_EVENT_TYPE_SELECT = { name: true, nameEn: true, color: true } as const;

const mapPublicLocation = (l: { name: string; nameEn: string | null }) => ({
  name: l.name,
  nameEn: l.nameEn,
});
const mapPublicEventType = (t: { name: string; nameEn: string | null; color: string }) => ({
  name: t.name,
  nameEn: t.nameEn,
  color: t.color,
});
```

Použití:
- `getPublicEvents`:
  - `include.location.select` → `PUBLIC_LOCATION_SELECT`
  - `include.eventType.select` → `PUBLIC_EVENT_TYPE_SELECT`
  - mapping: `location: mapPublicLocation(event.location)`,
    `eventType: mapPublicEventType(event.eventType)`
- `getLocations`: `select: { id: true, order: true, ...PUBLIC_LOCATION_SELECT }`,
  vrací `locations.map(l => ({ id: l.id, order: l.order, ...mapPublicLocation(l) }))`.
- `getEventTypes`: `select: { id: true, ...PUBLIC_EVENT_TYPE_SELECT }`,
  vrací `types.map(t => ({ id: t.id, ...mapPublicEventType(t) }))`.

➡️ `nameEn` pro lokaci/typ je definované **přesně jednou**; oba endpointy ho nesou.
Výstupní tvary zůstávají stejné (`/public/locations` = `{id,name,nameEn,order}`,
`/public/event-types` = `{id,name,nameEn,color}`), jen `/public/events` nově embeduje
`nameEn` u `location` a `eventType`.

## Mobile (event-manager-frontend)

### Typy
- `IProgramPlace`: přidat `nameEn?: string | null;`
- `IEventType`: přidat `nameEn?: string | null;`

### Sdílená logika
Čistá funkce + pipe (jeden zdroj pravdy pro výběr jazyka):

```ts
// localized-name.ts
export interface ILocalizedName { name: string; nameEn?: string | null; }
export function localizedName(obj: ILocalizedName, lang: string | undefined): string {
  return lang === 'en' && obj.nameEn ? obj.nameEn : obj.name;
}
```
```ts
// localized-name.pipe.ts
@Pipe({ name: 'localizedName', standalone: true })
export class LocalizedNamePipe implements PipeTransform {
  #translate = inject(TranslateService);
  transform(obj: ILocalizedName | null | undefined): string {
    if (!obj) return '';
    return localizedName(obj, this.#translate.currentLang);
  }
}
```
(Pure pipe — chování při přepnutí jazyka stejné jako stávající `translateEventProperty`.)

### Nasazení pipe (9 míst)
Jména **lokací**:
- `list-filter.component.html` — `{{ place.name }}` → `{{ place | localizedName }}`
- `list-place.component.html` — `{{ place.name }}` → `{{ place | localizedName }}`
- `program-vertical-list.component.html` — `{{ event.location.name }}` → `{{ event.location | localizedName }}`
- `event-detail-full.component.html` — `{{ place.name }}` → `{{ place | localizedName }}`

Jména **typů akcí**:
- `event-legend.component.html` — `{{ type.name }}` → `{{ type | localizedName }}`
- `list-filter.component.html` — `{{ item.name }}` → `{{ item | localizedName }}`
- `event-detail-full.component.html` — `{{ event.eventType.name }}` → `{{ event.eventType | localizedName }}`
- `event-detail-preview.component.html` — `{{ data.event.eventType.name }}` → `{{ data.event.eventType | localizedName }}`
- `program-vertical-list.component.html` — `{{ event.eventType.name }}` → `{{ event.eventType | localizedName }}`

(Každá komponenta, co pipe použije, ji přidá do `imports`.)

### Řazení podle zobrazovaného jména
- `list-filter.component.ts`: sort `places` a `eventTypes` přes `localizedName(x, currentLang)`
  místo `x.name` (tagy beze změny — mají vlastní `tagLabel`).
- `event-legend.component.ts`: sort přes `localizedName(type, currentLang)`.

## Fallback

| Jazyk | `nameEn` | Zobrazí |
|---|---|---|
| cs | cokoliv | `name` |
| en | vyplněno | `nameEn` |
| en | prázdné / null | `name` |

## Testy

**Mobile (jasmine/karma):**
- `localizedName` util: cs→name; en+nameEn→nameEn; en+''→name; en+null→name; chybějící obj→''.
- `LocalizedNamePipe`: stejné případy přes `currentLang`.
- `list-filter` řazení: ověřit, že v `en` se řadí podle `nameEn` (kde je), v `cs` podle `name`.

**Backend (jest), pokud existuje `public.service.spec`:**
- `getPublicEvents` vrací u `location` i `eventType` pole `nameEn`.
- `getLocations` / `getEventTypes` výstup beze změny (`nameEn` přítomno).

## Mimo rozsah
- `nameCs/nameEn` u jména/popisu akce (řeší `translateEventProperty`).
- Tagy (`nameCs/nameEn`, vlastní logika).
- Reaktivita na přepnutí jazyka beze změny (stejná jako u `translateEventProperty`).

## Dotčené soubory

**festival-planner:**
- `apps/backend/src/public/public.service.ts` (sdílené projekce + mappery, 3 metody)
- `apps/backend/src/public/public.service.spec.ts` (pokud existuje)

**event-manager-frontend:**
- `src/app/modules/program/types/IProgramPlace.ts` (+ `nameEn`)
- `src/app/modules/program/types/IEventType.ts` (+ `nameEn`)
- **Nové:** `localized-name.ts` (util) + `localized-name.pipe.ts` (+ specs)
- `list-filter.component.{html,ts}`, `list-place.component.html`,
  `program-vertical-list.component.html`, `event-detail-full.component.html`,
  `event-detail-preview.component.html`, `event-legend.component.{html,ts}`
  (+ jejich `imports` pro pipe)
