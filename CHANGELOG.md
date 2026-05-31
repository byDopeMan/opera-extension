# Changelog

## [1.2.3] – 2026-05-31

- Entfernt: Exakte-Aufrufe-Badge und separates Dislike-Badge aus Listen
- Neu: Dislike-Zahl wird direkt am Dislike-Button der Video-Seite angezeigt (nativer Stil)
- Neu: Exaktes Datum jetzt auch in der Hauptzeile der Video-Seite (nicht mehr 'vor 2 Monaten')

## [1.2.2] – 2026-05-31

- Neu: Inhalt-Einstellungen (Emoji, Format, Modus, Uhrzeit) werden bei Design-Export/Import mit uebertragen (als CSS-Kommentar)
- Neu: Update-Chip im Popup loest jetzt sofortiges Update aus (requestUpdateCheck + reload) statt nur Download

## [1.2.1] – 2026-05-31

- Aenderung: Design-Import/Export nutzt jetzt echtes CSS statt JSON (einfach CSS einfuegen)
- Fix: Update-Check im Popup las versehentlich XML-Header statt updatecheck-Version
- Fix: bump-version.js update.xml Regex praezisiert

## [1.2.0] – 2026-05-31

- Neu: Return YouTube Dislike Integration (Dislike-Anzahl via RYD-API)
- Neu: Exakte Aufrufzahl statt gerundeter Angaben (1.234.567)
- Neu: Design Import/Export zum Teilen von Settings mit Freunden
- Neu: Toggles fuer Dislikes und exakte Aufrufe im Popup
- Fix: update.xml Regex-Bug (XML-Header wurde faelschlich ueberschrieben)

## [1.1.4] – 2026-05-31

- Fix: Popup-Vorschau zeigt korrekte YouTube-Groesse (rem zu px)
- Fix: Popup-Vorschau uebernimmt gespeichertes badgeDesign
- Neu: Version-Chip mit Auto-Update-Check beim Oeffnen des Popups
- Neu: Klickbarer Update-Button wenn neue Version verfuegbar
- Neu: host_permissions fuer GitHub Pages (Update-Check)

## [1.1.3] – 2026-05-31

- Fix: findMetadataLine() mit inline-metadata-item Fallback fuer alle Renderer
- Fix: ytd-rich-grid-media + ytd-shelf-renderer entfernt (Doppel-Badges)
- Fix: Scan-Interval 1500ms auf 1000ms reduziert
- Fix: vertical-align middle auf Badge

## [1.1.2] – 2026-05-31

- Fix: Badge auf Startseite
- Fix: Preview-Skala korrigiert
- Neu: .gitignore hinzugefügt

## [1.1.1] – 2026-05-31

- Preview-Skala korrigiert (Youtube 10px-Basis), Startseite-Support verbessert, gitignore hinzugefuegt

