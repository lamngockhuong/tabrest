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
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome" alt="Manifest V3">
  <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?branch=main&logo=github" alt="CI Status">
  <img src="https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome" alt="Code Style: Biome">
  <img src="https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=black" alt="JavaScript ES Modules">
  <img src="https://img.shields.io/github/license/lamngockhuong/tabrest" alt="License">
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
- **Mehrsprachig** - Englisch und Vietnamesisch werden unterstützt

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

Demnächst verfügbar.

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
