🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 **Deutsch** • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Geben Sie Ihren Tabs eine Pause und befreien Sie Ihren Arbeitsspeicher - eine Chrome-Erweiterung, die inaktive Tabs automatisch entladen.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/v/agajndkecodedlklmpnjgikglkpeopib?label=chrome&style=flat-square&logo=googlechrome&logoColor=white&color=4285F4" alt="Chrome Web Store Version">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/users/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=6ee7b7" alt="Chrome Web Store Users">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/rating/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=facc15" alt="Chrome Web Store Rating">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?style=flat-square&label=CI&color=22c55e" alt="CI">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/lamngockhuong/tabrest?style=flat-square&color=60a5fa" alt="MIT License">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/stargazers">
    <img src="https://img.shields.io/github/stars/lamngockhuong/tabrest?style=flat-square&color=f59e0b" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/badge/Install_from-Chrome_Web_Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
  </a>
  <a href="https://tabrest.ohnice.app">
    <img src="https://img.shields.io/badge/Visit-Website-8957e5?style=for-the-badge&logo=astro&logoColor=white" alt="Website">
  </a>
</p>

<p align="center">
  <a href="https://unikorn.vn/p/tabrest?ref=embed-tabrest" target="_blank"><img src="https://unikorn.vn/api/widgets/badge/tabrest?theme=light" alt="TabRest on Unikorn.vn" width="200" height="50" /></a>
  &nbsp;
  <a href="https://launch.j2team.dev/products/tabrest?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-tabrest" target="_blank" rel="noopener noreferrer"><img src="https://launch.j2team.dev/badge/tabrest/neutral" alt="TabRest - Launched on J2TEAM Launch" width="200" height="43" /></a>
</p>

## Funktionen

- **Automatisches Entladen inaktiver Tabs** - Konfigurierbarer Timer (5 Min. bis 4 Std.)
- **Speicherschwelle** - Entladen, wenn der RAM 60-95 % überschreitet
- **Tab-spezifisches Speicherlimit** - Entladen von Tabs mit mehr als 100 MB-1 GB JS heap
- **Entladen beim Start** - Arbeitsspeicher beim Öffnen des Browsers freigeben
- **Manuelle Steuerung** - Aktuellen Tab, linke/rechte oder alle anderen Tabs entladen
- **Doppelte Tabs schließen** - Ein-Klick-Deduplizierung im aktuellen Fenster
- **Tab-Suche** - Echtzeit-Filterung der Tab-Liste nach Titel oder URL
- **Tab-Gruppen** - Ganze Tab-Gruppen entladen
- **Seitenleisten-Modus** - TabRest in Chromes Seitenleiste öffnen (opt-in)
- **Tabs/Seiten snoozen** - Tabs oder Domains vorübergehend schützen (30 Min.-2 Std.)
- **Warnhinweis vor dem Entladen** - 3-Sekunden-Hinweis auf der Seite vor dem automatischen Verwerfen
- **Visueller Indikator** - Anpassbares Präfix (💤) in Tab-Titeln verworfener Tabs
- **Whitelist** - Seiten vor dem automatischen Entladen schützen (unterstützt localhost und IP)
- **Import/Export** - Whitelists, Blacklists und Sitzungen als JSON sichern
- **Sitzungen** - Tab-Sets speichern und wiederherstellen
- **Scroll-Wiederherstellung** - Scroll-Position beim erneuten Laden von Tabs wiederherstellen
- **YouTube-Zeitstempel** - Videos nach dem Neuladen an der zuletzt gesehenen Stelle fortsetzen
- **Offline überspringen** - Tabs nicht verwerfen, wenn keine Netzwerkverbindung besteht
- **Nur-Inaktiv-Modus** - Automatisches Entladen nur bei Computerinaktivität
- **Energiemodus** - Profile für Akkuschonbetrieb, Normalbetrieb oder Hochleistung
- **Benachrichtigungen beim automatischen Entladen** - Benachrichtigung erhalten, wenn Tabs entladen werden
- **Speicher-Tooltip** - Berechtigten Statistiken anzeigen, um geschätzten RAM-Verbrauch je Tab zu sehen
- **Einrichtungsassistent** - Interaktiver mehrstufiger Einrichtungsdialog beim ersten Start
- **Optionale Fehlermeldungen** - Anonyme Absturzberichte über Sentry (standardmäßig deaktiviert) sowie manuelle Fehlermeldung
- **Automatisches Öffnen des Änderungsprotokolls** - Änderungsprotokoll bei Neben- und Hauptversionen öffnen
- **Optionale Host-Berechtigungen** - Formularschutz fordert Zugriff nur bei Aktivierung an
- **RAM-Anzeige** - Live-RAM-Prozentsatz in der Popup-Kopfzeile
- **Statistiken** - Entladene Tabs und gesparten Speicher verfolgen
- **Mehrsprachig** - 11 Sprachen werden unterstützt

## Tastenkürzel

| Tastenkürzel  | Aktion                 |
| ------------- | ---------------------- |
| `Alt+Shift+D` | Aktuellen Tab entladen |
| `Alt+Shift+O` | Andere Tabs entladen   |
| `Alt+Shift+→` | Tabs rechts entladen   |
| `Alt+Shift+←` | Tabs links entladen    |

## Installation

### Aus dem Quellcode

1. Dieses Repository klonen
2. `chrome://extensions` in Chrome öffnen
3. "Entwicklermodus" aktivieren (oben rechts)
4. Auf "Entpackte Erweiterung laden" klicken
5. Den Projektordner auswählen

### Aus dem Chrome Web Store

[TabRest aus dem Chrome Web Store installieren](https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib).

## Funktionsweise

TabRest verwendet Chromes native `chrome.tabs.discard()`-API, um Tabs zu entladen. Verworfene Tabs:

- Bleiben in der Tab-Leiste sichtbar
- Behalten ihre Scroll-Position und Formulardaten
- Werden beim Anklicken sofort neu geladen
- Geben Arbeitsspeicher frei, während sie inaktiv sind

## Projektstruktur

```text
tabrest/
├── manifest.json           # Erweiterungskonfiguration (MV3)
├── _locales/               # i18n-Übersetzungen (en, vi)
├── src/
│   ├── background/         # Service-Worker-Module
│   ├── content/            # Formular-Prüfer, YouTube-Tracker
│   ├── popup/              # Popup / Seitenleisten-Benutzeroberfläche
│   ├── options/            # Einstellungsseite
│   ├── pages/              # Einführung, Änderungsprotokoll
│   └── shared/             # Gemeinsam genutzte Hilfsfunktionen
├── icons/                  # Erweiterungssymbole
├── website/                # Astro-Dokumentationsseite (tabrest.ohnice.app)
└── docs/                   # Projektdokumentation
```

## Entwicklung

```bash
pnpm install          # Abhängigkeiten installieren
pnpm run lint         # Code mit Biome prüfen
pnpm run lint:fix     # Lint-Probleme automatisch beheben
pnpm run format       # Code formatieren
pnpm run ci           # Vollständige CI ausführen (Validierung + Lint)
```

## Werbematerialien

Werbebilder für den Chrome Web Store befinden sich als SVG-Quellen im Verzeichnis `assets/`.

```bash
./scripts/generate-promo-images.sh   # PNG-Dateien generieren
```

## Datenschutz

- Keine Datenerfassung
- Keine externen Server
- Alle Einstellungen werden lokal gespeichert
- Siehe [Datenschutzrichtlinie](docs/privacy-policy.md)

## Sponsoring

Wenn Sie diese Erweiterung nützlich finden, unterstützen Sie bitte deren Weiterentwicklung:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## Andere Projekte

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Browserübergreifende Erweiterung, die die GitHub-Oberfläche mit Produktivitätsfunktionen erweitert
- [Termote](https://github.com/lamngockhuong/termote) - Remote-Steuerung für CLI-Tools (Claude Code, GitHub Copilot, beliebige Terminals) von Mobil- oder Desktop-Geräten per PWA

## Lizenz

MIT
