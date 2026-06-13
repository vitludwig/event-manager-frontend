# Konfigurovatelné tlačítko ve spodním menu (configurable button)

**Datum:** 2026-06-09
**Repozitáře:** `event-manager-frontend` (mobilní app), `festival-planner` (administrace + backend)

## Problém

Spodní menu mobilní appky (`bottom-menu`) má 4 tlačítka: Program, Mapa, Notifikace a čtvrté „FAQ/HELP". To čtvrté:

- má **natvrdo zadanou ikonku** `<mat-icon>help</mat-icon>`,
- je **vždy viditelné**, i když cíl není nakonfigurovaný (`openFAQ()` jen nic neudělá),
- je sémanticky svázané s „FAQ", i když má být obecné.

Cíl odkazu už dnes konfigurovatelný je (`faqUrlCs` / `faqUrlEn` v customization), ale **ikonka ne** a tlačítko nejde skrýt.

## Cíl

Z administrace nastavitelné **obecné tlačítko** ve spodním menu, u kterého jde nastavit:

- **ikonku** (název Material Icons ligatury, zadaný do text inputu),
- **cílovou URL** (per jazyk CS/EN — už existuje).

Tlačítko se chová generericky (ne FAQ-specificky), s rozumnými fallbacky.

## Mimo rozsah (non-goals)

- Pouze **jedno** toto tlačítko (4. slot). Žádné generické přidávání více tlačítek.
- Žádný náhled ikonky v administraci (admin používá Tabler ikonky, ne Material) — jen text input.
- Žádná validace překlepů názvu ikony proti seznamu. Neplatná ligatura se u Material fontu vykreslí jako syrový text → odpovědnost administrátora.
- Label tlačítka zůstává přeložený `{{ 'FAQ' | translate }}` jako dnes (zobrazuje se jen na `INFO_PANEL` zařízení).
- Cíl odkazu interně zůstává na klíčích `faqUrlCs` / `faqUrlEn` (nulová migrace).

## Zvolený přístup

Rozšířit stávající **customization** systém o jeden nový veřejný klíč `configurableButtonIcon`. Cíl (URL) znovupoužít ze stávajících `faqUrlCs` / `faqUrlEn`. Mobil čte oba a vykreslí 4. tlačítko jako „configurable button" se skrytím při chybějící URL a fallback ikonou při chybějící ikoně.

Tento přístup kopíruje, jak už dnes fungují `logoUrl`, `faqUrlCs/En`, `festivalId` (key-value `Customization` tabulka → `GET /public/customization` → `CustomizationService` v mobilu). Žádný nový databázový model ani migrace.

**Zamítnutá alternativa:** generická mapa ikon/odkazů pro všechna tlačítka spodního menu — YAGNI, potřebujeme jen 4. tlačítko.

## Datový tok

```
Admin (customization/page.tsx)
  → PATCH /customization/bulk { configurableButtonIcon, faqUrlCs, faqUrlEn }
  → tabulka Customization (key-value)
  → GET /public/customization (getPublic → PUBLIC_CUSTOMIZATION_KEYS)
  → CustomizationService.load() (cache v localStorage)
  → BottomMenuComponent (4. tlačítko)
```

## Návrh

### 1. festival-planner — backend (allow-list)

Soubor `apps/backend/src/customization/dto/upsert-customization.dto.ts`:

- Do `ALLOWED_KEYS` přidat `'configurableButtonIcon'`.
- Do `PUBLIC_CUSTOMIZATION_KEYS` přidat `'configurableButtonIcon'`.

`faqUrlCs` / `faqUrlEn` už v obou seznamech jsou. Bez migrace (Customization je key-value `{ key, value: Json }`).

### 2. festival-planner — admin UI

Soubor `apps/frontend/src/app/admin/customization/page.tsx`:

- `useForm` `initialValues`: přidat `configurableButtonIcon: ''`.
- `loadData()` `form.setValues(...)`: přidat `configurableButtonIcon: data.configurableButtonIcon ?? ''`.
- `handleSubmit()` `items`: přidat `configurableButtonIcon: values.configurableButtonIcon`.
- Sekci `<Title order={4}>FAQ Links</Title>` přejmenovat na **`Configurable button`**.
- Dvě URL `TextInput` relabelovat (např. *„Button link (Czech)"* / *„Button link (English)"*), `getInputProps` zůstávají `faqUrlCs` / `faqUrlEn`.
- Přidat `TextInput` pro `configurableButtonIcon` — label *„Button icon (Material icon name)"*, placeholder `help`, description s pokynem zadat název Material ikony (např. `info`, `link`, `question_mark`).

### 3. event-manager-frontend — mobil

**`src/app/common/services/customization/customization.service.ts`:**

- Do `ICustomization` přidat `configurableButtonIcon?: string;`.
- Přidat getter:
  ```ts
  public get configurableButtonIcon(): string | undefined {
      return this.data().configurableButtonIcon;
  }
  ```

**`src/app/modules/layout/components/bottom-menu/bottom-menu.component.ts`:**

- Přidat gettery (znovupoužít stávající `faqUrlCs/En` přes `CustomizationService`):
  ```ts
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
  ```
- `openFAQ()` přejmenovat na `openConfigurableButton()`; tělo používá `this.configurableButtonUrl` a `window.open(url, '_blank')`.

**`src/app/modules/layout/components/bottom-menu/bottom-menu.component.html`:**

- Čtvrté tlačítko obalit `@if (showConfigurableButton) { ... }`.
- Ikona: `<mat-icon>{{ configurableButtonIcon }}</mat-icon>`.
- Klik: `(click)="openConfigurableButton()"`.
- Label ponechat `{{ 'FAQ' | translate }}` (zobrazuje se jen na `INFO_PANEL`).

Celý Material Icons font (128 KB, `src/assets/fonts/material-icons.woff2`) je už v appce, takže jakýkoli platný název ligatury se vykreslí.

## Hraniční případy / chování

- **Není URL** (pro aktuální jazyk) → tlačítko se **nevykreslí** (`@if (showConfigurableButton)`).
- **Je URL, chybí/prázdná ikona** → `help` (generický otazník) — check výhradně na straně mobilu (`|| 'help'`).
- **Je URL + ikona** → daná ikona; klik otevře URL v novém tabu.
- **URL jen pro jeden jazyk** (např. `faqUrlCs` nastaveno, `faqUrlEn` ne) → v daném jazyce viditelné, ve druhém skryté (odpovídá dnešní per-language logice `openFAQ`).
- **Neplatný název ikony** (překlep) → Material font vykreslí syrový text (mimo rozsah, odpovědnost admina).

## Dotčené soubory

**festival-planner:**
- Změna: `apps/backend/src/customization/dto/upsert-customization.dto.ts` (allow-list + public klíč)
- Změna: `apps/frontend/src/app/admin/customization/page.tsx` (form + sekce „Configurable button")

**event-manager-frontend:**
- Změna: `src/app/common/services/customization/customization.service.ts` (`ICustomization` + getter)
- Změna: `src/app/modules/layout/components/bottom-menu/bottom-menu.component.ts` (gettery + přejmenování metody)
- Změna: `src/app/modules/layout/components/bottom-menu/bottom-menu.component.html` (`@if`, ikona, klik)
- Změna specs: `bottom-menu.component.spec.ts`, `customization.service.spec.ts` (dle potřeby)

## Testy

**event-manager-frontend (jasmine/karma):**
- `BottomMenuComponent`:
  - tlačítko se **nevykreslí**, když není `configurableButtonUrl`,
  - tlačítko se vykreslí a ukáže **konfigurovanou ikonu**, když je URL + ikona,
  - **fallback `help`**, když je URL ale ikona chybí/prázdná,
  - klik volá `window.open` s konfigurovanou URL (per jazyk).
- `CustomizationService`: vystaví `configurableButtonIcon` z načtených dat.

**festival-planner (jest):**
- `CustomizationService.getPublic()` vrací `configurableButtonIcon`, je-li uložené (klíč je v `PUBLIC_CUSTOMIZATION_KEYS`).
- `upsert` přijme `configurableButtonIcon` (je v `ALLOWED_CUSTOMIZATION_KEYS`).

## Akceptační kritéria

1. V administraci (customization) lze zadat **název Material ikony** a **URL tlačítka** (CS/EN).
2. Mobil ve spodním menu zobrazí 4. tlačítko **jen když je nastavená URL** (pro aktuální jazyk).
3. Tlačítko ukazuje **konfigurovanou ikonu**; klik otevře **konfigurovanou URL** v novém tabu.
4. Když je URL nastavená, ale **ikona chybí** → tlačítko ukáže generický **`help`** (otazník).
5. Když **URL chybí** → tlačítko se nevykreslí.
6. `configurableButtonIcon` se ukládá a vrací z `GET /public/customization`.
7. Buildy projdou v obou repozitářích; relevantní unit testy projdou.
