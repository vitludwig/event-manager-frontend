# Návrhy vylepšení — Festival Guide App

## Obsah

- [Bugy a technický dluh](#bugy-a-technický-dluh)
- [UX vylepšení](#ux-vylepšení)
- [Nové features](#nové-features)
- [Kvalita kódu](#kvalita-kódu)

---

## Bugy a technický dluh

### 🔴 Kritické

| # | Problém | Detail |
|---|---------|--------|
| B1 | **OneSignal API klíč v kódu** | API klíč je v `environment.ts` a posílá se z frontendu v HTTP hlavičce. Měl by jít přes backend proxy. |
| B2 | **Duplicitní `localStorage.setItem('places')`** | V `program.service.ts` `loadProgramData()` se volá dvakrát za sebou — copy-paste bug. |
| B3 | **Lokální notifikace hardcoded česky** | `AppComponent` posílá "Nadcházející akce" a "začíná za 10 minut" bez překladu. |

### 🟡 Střední

| # | Problém | Detail |
|---|---------|--------|
| B4 | **`ERoute.FAQ = 'afq'`** | Překlep — měl by být `'faq'`. Nerozbije nic (FAQ je external link), ale matoucí. |
| B5 | **Language switch reloaduje stránku** | `window.location.reload()` místo reaktivního přepnutí. Špatný UX, ztrácí stav. |
| B6 | **`environment.development.android.ts` = dev** | Identický s `environment.development.ts` — nemá lokální IP pro testování. |
| B7 | **`notification.worker.js` je mrtvý kód** | Celý obsah zakomentovaný. Smazat. |
| B8 | **`@capacitor/status-bar` nainstalovaný, nepoužitý** | Nakonfigurovat nebo odebrat. |
| B9 | **`html lang="en"` hardcoded** | Neaktualizuje se při přepnutí na češtinu. Screen readery čtou anglicky. |
| B10 | **Vertical list grouping ignoruje midnight events** | `getGroupedEventsByDay` používá `startOf('day')`, ale `filterEventsByDay` má 6 AM threshold. Nekonzistentní. |

---

## UX vylepšení

### Navigace a orientace

| # | Návrh | Priorita | Detail |
|---|-------|----------|--------|
| U1 | **Pull-to-refresh** | Vysoká | Na programu i mapě. Uživatel nemá jak vynutit refresh dat. `ion-refresher` nebo custom implementace. |
| U2 | **Splash/loading screen** | Střední | Při startu aplikace je prázdná obrazovka, než se načte program. Přidat skeleton/spinner. |
| U3 | **Swipe navigace mezi dny** | Střední | Místo klikání na toggle buttony umožnit swipe vlevo/vpravo pro přepínání dnů. |
| U4 | **"Právě teď" chip/filtr** | Vysoká | Zvýraznit aktuálně probíhající eventy. Přidat filtr "Právě teď" který zobrazí jen běžící akce. |
| U5 | **Empty states** | Střední | Když nejsou výsledky filtru nebo oblíbené, zobrazit ilustraci + text ("Žádné oblíbené" apod.), ne prázdnou plochu. |
| U6 | **Haptic feedback** | Nízká | Na mobilu při přidání/odebrání oblíbeného přidat vibrace (`@capacitor/haptics`). |

### Program (timeline)

| # | Návrh | Priorita | Detail |
|---|-------|----------|--------|
| U7 | **Legenda barev** | Vysoká | Event typy jsou rozlišeny pouze barvou. Přidat legendu nebo label na tile. Accessibility problém. |
| U8 | **Zoom controls** | Střední | Tlačítka +/- pro zoom vedle pinch-to-zoom. Pinch na webu nefunguje, na info panelu taky ne. |
| U9 | **Lepší favorite indikátor** | Nízká | Srdíčko na tile je malé. Přidat barvu/glow na celý tile pro oblíbené. |
| U10 | **Countdown na oblíbených** | Střední | U oblíbených eventů zobrazit "za 45 minut" místo absolutního času. |

### Mapa

| # | Návrh | Priorita | Detail |
|---|-------|----------|--------|
| U11 | **Mapa s POI markery** | Vysoká | Místo statického obrázku přidat interaktivní mapu (Leaflet/MapLibre) s POI body, navigací, a zoom na konkrétní stage. |
| U12 | **"Kde jsem" na mapě** | Střední | Ukázat aktuální polohu uživatele na mapě (GPS). |

### Notifikace

| # | Návrh | Priorita | Detail |
|---|-------|----------|--------|
| U13 | **Přečtené/nepřečtené** | Střední | Vizuálně odlišit přečtené notifikace. Badge s počtem nepřečtených na tab ikoně. |
| U14 | **Konfigurovatelné lokální notifikace** | Střední | Uživatel si nastaví, kolik minut předem chce upozornění (5/10/15/30 min). |

---

## Nové features

### 🌟 Vysoká hodnota

| # | Feature | Detail |
|---|---------|--------|
| F1 | **Osobní rozvrh** | Dedikovaná záložka/view se seznamem oblíbených eventů jako timeline/agenda view seřazený chronologicky. "Můj program" místo filtrování v hlavním gridu. |
| F2 | **Offline režim** | Service worker cachuje API odpovědi. Aplikace plně funkční offline s posledními daty. Indikátor offline stavu. |
| F3 | **Sdílení eventu** | Share button na event detailu — native share (Web Share API / Capacitor Share) s deep linkem. |
| F4 | **Fulltextové vyhledávání** | Globální search bar přístupný z hlavní navigace. Hledá v názvech, popisech, tazích, místech. |
| F5 | **Konflikt oblíbených** | Při přidání oblíbeného, který se překrývá s jiným oblíbeným, upozornit uživatele. |

### 🔧 Střední hodnota

| # | Feature | Detail |
|---|---------|--------|
| F6 | **Dark/light theme** | Přepínač motivu. Aktuálně jen dark theme. |
| F7 | **Onboarding** | Při prvním spuštění ukázat 2-3 screeny s hlavními funkcemi (swipe tutorial). |
| F8 | **Widget "další akce"** | Android widget zobrazující následující 2-3 oblíbené akce s countdown. |
| F9 | **Hodnocení eventů** | Po skončení akce umožnit ohodnotit 1-5 hvězdiček. Agregované hodnocení viditelné ostatním. |
| F10 | **FAQ v aplikaci** | Místo externího Google Docs odkazu zobrazit FAQ přímo v appce (stáhnout z backendu jako JSON/MD). |
| F11 | **Sociální feed** | Fotky/příspěvky od účastníků festivalu. Instagram-like feed. |

### 🎯 Nice to have

| # | Feature | Detail |
|---|---------|--------|
| F12 | **Kapacita stage** | Indikátor naplněnosti stage/stanu ("skoro plné"). Backend by reportoval scan dat. |
| F13 | **Počasí** | Widget s aktuální předpovědí pro lokaci festivalu. |
| F14 | **Ztráty a nálezy** | Sekce pro nahlášení/hledání ztracených věcí. |
| F15 | **Emergency notifikace** | Prioritní kanál pro důležité zprávy organizátorů (evakuace, změna programu). Jiný zvuk/vibrace. |

---

## Kvalita kódu

### Refaktoring

| # | Návrh | Detail |
|---|-------|--------|
| C1 | **Migrovat AppComponent na standalone** | Odebrat `AppModule`, přejít na `bootstrapApplication()`. Jediný zbývající NgModule. |
| C2 | **ProgramService — favorites/tags/eventTypes na signály** | Konzistentní reaktivita. Aktuálně plain arrays, components musí manuálně detekovat změny. |
| C3 | **Sjednotit `@Input()` vs `input()`** | Migrovat zbývající `@Input()` na signal `input()`. |
| C4 | **Tribe schedule do backendu** | 160 řádků hardcoded HTML v `tribes-info.component.html` patří do API. |
| C5 | **Odstranit mrtvý kód** | `notification.worker.js`, zakomentovaný `@font-face 3rd_man`, `EventEllipsisPipe` commented branch. |
| C6 | **Vyřešit `@ts-ignore`** | Opravit typování v `program-vertical-list` a `ProgramService.updateEvent()`. |
| C7 | **Error handling na SignalR** | Přidat user-facing indikátor stavu připojení (connected/reconnecting/disconnected). |
| C8 | **Přesunout notifikační polling do service** | Interval v `AppComponent` pro local notifications patří do `NotificationService`. |

### Performance

| # | Návrh | Detail |
|---|-------|--------|
| P1 | **Virtual scroll na vertical listu** | Při velkém počtu eventů (100+) by `cdk-virtual-scroll` zlepšil performance. |
| P2 | **`trackBy` na timeline grid** | `@for` cykly v `full-program` template nemají `track` — Angular re-renderuje celý grid při změně. |
| P3 | **Lazy load QR scanner** | `@zxing/ngx-scanner` je velký bundle. Načítat až při otevření skeneru. |
| P4 | **Image optimization** | Mapy jsou base64 v JSON. Lépe: URL na optimalizovaný obrázek s lazy loading. |

### Testování

| # | Návrh | Detail |
|---|-------|--------|
| T1 | **E2E testy pro notifikace a mapu** | Aktuálně pokryto jen program + zoom. |
| T2 | **Test offline režimu** | PWA service worker test — odpojit síť, ověřit funkčnost. |
| T3 | **Accessibility audit** | axe-core nebo Lighthouse a11y scan + opravit nalezené problémy. |

---

## Doporučené pořadí implementace

**Fáze 1 — Quick wins (bugy + malá UX vylepšení):**
B1–B10, U4 ("Právě teď"), U5 (empty states), U7 (legenda barev)

**Fáze 2 — Klíčové UX:**
U1 (pull-to-refresh), U2 (loading screen), F4 (search), F1 (osobní rozvrh)

**Fáze 3 — Nové features:**
F2 (offline), F3 (sdílení), F5 (konflikty), F10 (FAQ v appce)

**Fáze 4 — Refaktoring:**
C1–C8, P1–P4

**Průběžně:**
T1–T3 (testování), C5 (mrtvý kód)
