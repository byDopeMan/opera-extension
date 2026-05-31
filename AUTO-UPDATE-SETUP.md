# Auto-Update Setup – Schritt für Schritt

Ziel: Du änderst Dateien auf deinem PC, pushst zu GitHub, und Opera GX lädt die Extension
automatisch bei allen Nutzern neu — ohne dass jemand manuell updaten muss.

---

## Voraussetzungen

- Git installiert
- GitHub-Account
- Opera GX mit installierter Extension (als entpackte Erweiterung)

---

## Schritt 1 – GitHub Repository anlegen

1. Geh zu [github.com](https://github.com) → **New repository**
2. Name: `yt-exact-date` (oder beliebig)
3. **Public** auswählen (GitHub Pages funktioniert nur mit Public-Repos im Free-Plan)
4. Repository erstellen

---

## Schritt 2 – Git initialisieren und pushen

Im Extension-Ordner `E:\Coding\browser\yt-exact-date\`:

```bash
git init
git add .
git commit -m "Initial extension release v1.1.0"
git branch -M main
git remote add origin https://github.com/DEIN_USERNAME/yt-exact-date.git
git push -u origin main
```

---

## Schritt 3 – GitHub Pages aktivieren

1. Auf GitHub: Repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Speichern

→ Deine Seite ist jetzt erreichbar unter:
`https://DEIN_USERNAME.github.io/yt-exact-date/`

Warten bis GitHub Pages bereit ist (~1–2 Minuten), dann testen:
`https://DEIN_USERNAME.github.io/yt-exact-date/update.xml`

---

## Schritt 4 – Extension-ID herausfinden

1. Opera GX → `opera://extensions`
2. **Entwicklermodus** aktivieren (oben rechts)
3. Bei deiner Extension steht die **ID** — eine lange Zeichenkette wie:
   `hjcjfpamagcpfajoaojnihkloekekgio`

---

## Schritt 5 – Extension packen (.crx erstellen)

1. Opera GX → `opera://extensions` → **Erweiterung packen**
2. **Extension-Stammverzeichnis:** `E:\Coding\browser\yt-exact-date`
3. **PEM-Schlüsseldatei:** leer lassen beim ersten Mal → Opera erstellt eine `.pem`-Datei
4. Klick **Erweiterung packen**

→ Es werden erstellt:
- `yt-exact-date.crx` — die paketierte Extension
- `yt-exact-date.pem` — dein privater Schlüssel (SICHER AUFBEWAHREN, NIE COMMITTEN!)

> ⚠️ Die `.pem`-Datei NIEMALS in Git pushen — sie ist dein Signierungsschlüssel.
> Für alle zukünftigen Updates dieselbe `.pem`-Datei verwenden.

---

## Schritt 6 – update.xml und .crx befüllen

`update.xml` öffnen und anpassen:

```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='hjcjfpamagcpfajoaojnihkloekekgio'>
    <updatecheck
      status='ok'
      version='1.1.0'
      codebase='https://DEIN_USERNAME.github.io/yt-exact-date/yt-exact-date.crx'
    />
  </app>
</gupdate>
```

Ersetze:
- `hjcjfpamagcpfajoaojnihkloekekgio` → deine echte Extension-ID
- `DEIN_USERNAME` → dein GitHub-Username

---

## Schritt 7 – update_url in manifest.json eintragen

`manifest.json` öffnen, folgende Zeile hinzufügen:

```json
{
  "manifest_version": 3,
  "name": "YouTube – Exaktes Upload-Datum",
  "version": "1.1.0",
  "update_url": "https://DEIN_USERNAME.github.io/yt-exact-date/update.xml",
  ...
}
```

---

## Schritt 8 – .crx und update.xml nach GitHub pushen

```bash
# .crx-Datei in den Extension-Ordner kopieren
# Dann:
git add update.xml manifest.json yt-exact-date.crx
git commit -m "Add update.xml and packaged .crx for auto-update"
git push
```

---

## Schritt 9 – Extension als .crx installieren (statt entpackt)

Damit Auto-Update funktioniert, muss die Extension als `.crx` installiert sein,
nicht als "entpackte Erweiterung":

1. Opera GX → `opera://extensions`
2. Bestehende Extension entfernen
3. `yt-exact-date.crx` aus dem Ordner auf die Erweiterungsseite ziehen (Drag & Drop)
4. Installieren bestätigen

> Hinweis: Chromium-basierte Browser akzeptieren `.crx`-Dateien normalerweise nur
> aus dem Chrome Web Store automatisch. Opera GX erlaubt lokale `.crx`-Installation
> über Drag & Drop. Auto-Updates funktionieren jedoch nur bei signierten und über
> den Store oder eine eigene Update-URL installierten Extensions.

---

## So veröffentlichst du ein Update

Wenn du eine neue Version veröffentlichen willst:

1. **Code ändern** (neue Features, Bug-Fixes, Design-Änderungen)
2. **Version erhöhen** in `manifest.json`:
   ```json
   "version": "1.2.0"
   ```
3. **Extension neu packen** (Schritt 5 wiederholen — dieselbe `.pem`-Datei verwenden!)
4. **`update.xml` aktualisieren:**
   ```xml
   version='1.2.0'
   codebase='https://DEIN_USERNAME.github.io/yt-exact-date/yt-exact-date.crx'
   ```
5. **Alles pushen:**
   ```bash
   git add manifest.json update.xml yt-exact-date.crx
   git commit -m "Release v1.2.0 – [was geändert wurde]"
   git push
   ```

→ Opera GX prüft regelmäßig (alle paar Stunden) die `update_url` und installiert
die neue Version automatisch bei allen Nutzern, die die Extension haben.

---

## .gitignore empfehlung

Erstelle eine `.gitignore` im Extension-Ordner:

```
# Privater Schlüssel — NIEMALS committen!
*.pem

# Playground-Server
.claude/
node_modules/
```

---

## Zusammenfassung

| Was | Wo |
|---|---|
| Extension-ID | `opera://extensions` (Entwicklermodus) |
| .crx packen | `opera://extensions` → Erweiterung packen |
| GitHub Pages URL | `https://USERNAME.github.io/yt-exact-date/` |
| Update auslösen | Version erhöhen + neu packen + pushen |
| Nutzer bekommen Update | Automatisch (Browser prüft update_url) |
