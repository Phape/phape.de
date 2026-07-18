# Spec: Links-Seite Redesign (phape.de/links)

## Objective
Die persönliche Link-Portalseite (`links/index.html`) modernisieren:
- **Schneller**: aktuell blockieren viele einzelne Favicon-Requests (jede Domain liefert ihr eigenes, oft langsames/unzuverlässiges `favicon.ico`) sowie ungenutzte Bootstrap/jQuery/Popper-CDN-Assets das Rendering.
- **Moderner**: neue, dezente Farbwelt statt Neon-auf-Schwarz, mit automatischem Dark/Light-Umschalten nach Systemeinstellung (`prefers-color-scheme`).
- **Simpel bleiben**: kein Build-Step, keine Frameworks — die Seite bleibt statisches HTML/CSS/JS, das per Git-Push direkt live geht.
- **Einfacher pflegbar**: neue Links sollen als ein kurzer Eintrag in einer zentralen Datenstruktur hinzugefügt werden können, nicht als HTML-Block.

Nutzer: nur Phape selbst (persönliche Startseite/Bookmarks). Erfolg = spürbar schnelleres Laden, aufgeräumteres Aussehen, und "einen Link hinzufügen" dauert < 30 Sekunden.

## Tech Stack
- Reines HTML5 / CSS3 (custom properties, `prefers-color-scheme`, Flexbox/Grid)
- Vanilla JavaScript (ES6+, kein Framework, kein Bundler)
- Keine Build-Pipeline, keine npm-Abhängigkeiten — Dateien werden direkt vom Server ausgeliefert
- Icons über einen schnellen, gecachten Favicon-Proxy (Google `s2/favicons`-Dienst) statt direktem Zugriff auf `favicon.ico` jeder Zieldomain

## Commands
Kein Build/Test-Tooling vorhanden oder nötig.
- Vorschau: Datei lokal im Browser öffnen oder z.B. `npx serve links` für einen lokalen Static-Server
- Deploy: `git push` (Server deployed direkt, siehe README.md)

## Project Structure
```
links/
  index.html      → Markup-Grundgerüst, Suchleiste, Theme-Toggle, <template>/Container für gerenderte Links
  design.css      → Styles: CSS-Variablen für Farbwelt, Light/Dark via prefers-color-scheme, responsives Grid
  links-data.js   → Zentrale Datenstruktur aller Links, gruppiert nach Kategorie (einzige Stelle zum Hinzufügen neuer Links)
  app.js          → Rendering-Logik (Daten → DOM), Icon-Lazy-Loading, Suchfilter, Theme-Handling
```

## Code Style
Daten-Eintrag für einen neuen Link (Ziel: ein Objekt = ein neuer Link, kein HTML nötig):
```js
// links-data.js
export const categories = [
  {
    id: "news",
    title: "News",
    links: [
      { title: "Google News", url: "https://news.google.com/" },
      { title: "Spiegel Online", url: "https://www.spiegel.de/" },
    ],
  },
  // weitere Kategorien...
];
```
- Icon-URL ist optional: wird automatisch aus `url` per Favicon-Proxy abgeleitet (`icon` kann überschrieben werden, falls nötig)
- Kategorisierung: 2-Leerzeichen-Einrückung, `const`/`let` statt `var`, keine Semikolon-Diskussion nötig (Projektstil: mit Semikolon, wie bisherige Dateien im Repo nicht konsistent sind — neue Dateien konsequent mit Semikolon)
- CSS: BEM-artige, aber schlanke Klassennamen (`.link-card`, `.category`, `.search-bar`), CSS-Variablen in `:root` und `@media (prefers-color-scheme: dark)`

## Testing Strategy
Kein automatisiertes Test-Framework (unangemessen für eine statische persönliche Seite ohne Build-Step). Stattdessen manuelle Smoke-Checkliste vor jedem Deploy:
- [ ] Alle Kategorien und alle bisherigen Links sind vorhanden (keiner verloren gegangen)
- [ ] Icons laden lazy (Netzwerk-Tab: Icons erst bei Scroll/Sichtbarkeit) und Seite ist ohne wartende Icons interaktiv
- [ ] Suchfeld filtert Links in Echtzeit (Tippen ohne Reload)
- [ ] Theme folgt System-Einstellung (Dark/Light) korrekt
- [ ] Layout funktioniert auf Mobile (schmaler Viewport, eine Spalte) und Desktop (mehrspaltig)
- [ ] Keine Bootstrap/jQuery/Popper-Requests mehr im Netzwerk-Tab
- [ ] Neuen Link hinzufügen erfordert nur einen Eintrag in `links-data.js`, keine HTML-Änderung

## Boundaries
- **Always**: Seite bleibt zero-build statisches HTML/CSS/JS; jeder neue Link = ein Datensatz in `links-data.js`; alle bestehenden Links werden übernommen (nur neu gruppiert, nichts kommentarlos gelöscht); vor Abschluss die manuelle Smoke-Checkliste durchgehen.
- **Ask first**: neue externe Laufzeit-Abhängigkeiten/CDNs hinzufügen; Datei-/Ordnerstruktur außerhalb von `links/` verändern; Löschen einzelner Links (statt nur Umgruppieren).
- **Never**: einen Build-Schritt/Bundler einführen; andere Seiten des Repos (`index.html`, `entscheidungsbaum/`, `login-window/`, `programming/`, `test/`) verändern; Secrets/Keys committen.

## Kategorien (neu geclustert, grob statt feingranular)
Basierend auf bestehenden Links, zu sinnvollen, nicht zu kleinteiligen Gruppen zusammengefasst:
1. **News** — bisherige `news`-Links unverändert
2. **Entertainment** — bisheriges `s|p|aas` (YouTube, Netflix, Twitch, Reddit, WhatsApp, neal.fun, classicReload, Mixer) + Streaming-Empfehlungsseiten aus `tools` (Reelgood, WerStreamt.es, Best similar)
3. **Shopping & Finanzen** — bisheriges `shoppin'` (mydealz, Amazon, eBay, Kleinanzeigen, N26, VB-Kraichgau, PayPal) + bisheriges `mon€y` (LS Exchange, Der Aktionär)
4. **Dev & Tools** — bisheriges `c0de` + restliche `tools`-Links (PDF-Tools, draw.io, Photopea, Statista, Temp Mail, WayBack Machine, Abfallkalender)
5. **Arbeit & Uni** — bisheriges `sonstiges` (Cofinpro Portal/Wiki, DHBW Moodle/RaPla, Duolingo)
6. **Musik** — bisheriges `music` unverändert

## Success Criteria
- Keine Bootstrap/jQuery/Popper-CDN-Requests mehr vorhanden
- Icons werden lazy geladen über einen einzigen schnellen Favicon-Proxy statt Direktzugriff auf jede Zieldomain
- 6 klare Kategorien statt 8 kleinteiligeren, alle ursprünglichen Links erhalten
- Neuer Link = ein Eintrag in `links-data.js`, kein HTML nötig
- Automatisches Dark/Light-Theme nach Systemeinstellung, moderne (nicht Neon-)Farbwelt
- Responsives Layout (Mobile + Desktop)
- Client-seitiges Suchfeld filtert Links live
- Weiterhin zero-build, direkt deploybar per Git-Push

## Open Questions
Keine offenen Fragen mehr — alle Kernentscheidungen wurden im Interview geklärt.
