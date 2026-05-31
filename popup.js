const DEFAULTS = {
  enabled:  true,
  format:   "DD.MM.YYYY",
  mode:     "append",
  showTime: false,
  badgeDesign: {
    color: "#43c463", bgAlpha: 0, borderAlpha: 35,
    fontSize: 0.85, fontWeight: "300", lineHeight: 1.35,
    px: 5, py: 0, radius: 8, ml: 1, gap: 0, bw: 0.5,
    emoji: "📅",
  },
};

const SAMPLE_DATE = "2025-05-24T14:22:00";
const YT_REM      = 10; // YouTube nutzt html { font-size: 10px }

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni",
                   "Juli","August","September","Oktober","November","Dezember"];

/* ── Datum formatieren ─────────────────────────────────────────────── */
function formatDate(iso, fmt, showTime) {
  const d    = new Date(iso);
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let s;
  if (fmt === "YYYY-MM-DD")      s = `${yyyy}-${mm}-${dd}`;
  else if (fmt === "MM/DD/YYYY")  s = `${mm}/${dd}/${yyyy}`;
  else if (fmt === "D. Mon YYYY") s = `${d.getDate()}. ${MONTHS_DE[d.getMonth()]} ${yyyy}`;
  else                             s = `${dd}.${mm}.${yyyy}`;
  if (showTime) {
    s += ` ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  return s;
}

/* ── Preview-Badge mit gespeichertem Design aktualisieren ──────────── */
function updatePreview(design, fmt, showTime) {
  const d    = design || DEFAULTS.badgeDesign;
  const text = (d.emoji ? d.emoji + " " : "") + formatDate(SAMPLE_DATE, fmt, showTime);
  const badge = document.getElementById("preview-badge");
  badge.textContent = text;

  // Korrekte px-Größe: rem × YouTube-Basis (10px)
  const hex  = d.color;
  const r    = parseInt(hex.slice(1,3),16);
  const g    = parseInt(hex.slice(3,5),16);
  const b    = parseInt(hex.slice(5,7),16);
  const bgA  = (d.bgAlpha / 100).toFixed(2);
  const bdA  = (d.borderAlpha / 100).toFixed(2);

  Object.assign(badge.style, {
    gap:          d.gap + "px",
    marginLeft:   d.ml + "px",
    padding:      `${d.py}px ${d.px}px`,
    borderRadius: d.radius + "px",
    fontWeight:   d.fontWeight,
    fontSize:     (d.fontSize * YT_REM) + "px",
    lineHeight:   d.lineHeight,
    color:        d.color,
    background:   `rgba(${r},${g},${b},${bgA})`,
    border:       `${d.bw}px solid rgba(${r},${g},${b},${bdA})`,
  });
}

/* ── Versionsnummer vergleichen ────────────────────────────────────── */
function isNewer(remote, current) {
  const r = remote.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (r[i] > c[i]) return true;
    if (r[i] < c[i]) return false;
  }
  return false;
}

/* ── Update-XML von GitHub prüfen ──────────────────────────────────── */
async function checkForUpdate(currentVersion) {
  const chip = document.getElementById("ver-chip");
  try {
    const res = await fetch(
      chrome.runtime.getManifest().update_url + "?_=" + Date.now(),
      { cache: "no-store" }
    );
    if (!res.ok) return;
    const xml         = await res.text();
    const verMatch    = xml.match(/version='([^']+)'/);
    const crxMatch    = xml.match(/codebase='([^']+)'/);
    if (!verMatch) return;

    const remoteVer = verMatch[1];
    const crxUrl    = crxMatch ? crxMatch[1] : null;

    if (isNewer(remoteVer, currentVersion)) {
      chip.textContent = `↑ v${remoteVer} verfügbar`;
      chip.classList.add("update-available");
      chip.title = "Klicken zum Herunterladen";
      if (crxUrl) chip.addEventListener("click", () => chrome.tabs.create({ url: crxUrl }));
    } else {
      chip.textContent = `v${currentVersion} ✓`;
      chip.title       = "Aktuellste Version";
    }
  } catch (_) {
    // Offline oder Netzwerkfehler — still fail
    chip.textContent = `v${currentVersion}`;
  }
}

/* ── Tab-Messaging (keine unhandled-Promise-Fehler) ────────────────── */
function sendToActiveTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
  });
}

/* ── Enabled-Zustand anwenden ─────────────────────────────────────── */
function applyEnabled(val) {
  document.body.classList.toggle("disabled", !val);
}

/* ── Init ──────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  const manifest      = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  // Version anzeigen & Update-Check starten
  document.getElementById("ver-chip").textContent = `v${currentVersion}`;
  checkForUpdate(currentVersion);

  // Gespeicherte Einstellungen laden
  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    const design = { ...DEFAULTS.badgeDesign, ...(cfg.badgeDesign || {}) };

    document.getElementById("enabled").checked         = cfg.enabled;
    document.getElementById("format").value            = cfg.format;
    document.getElementById("mode").value              = cfg.mode;
    document.getElementById("showTime").checked        = cfg.showTime;
    document.getElementById("showDislikes").checked    = cfg.showDislikes   ?? true;
    document.getElementById("showExactViews").checked  = cfg.showExactViews ?? true;

    applyEnabled(cfg.enabled);
    updatePreview(design, cfg.format, cfg.showTime);
  });

  // Live-Vorschau beim Ändern der Einstellungen
  document.getElementById("format").addEventListener("change", refreshPreview);
  document.getElementById("showTime").addEventListener("change", refreshPreview);

  function refreshPreview() {
    chrome.storage.sync.get({ badgeDesign: DEFAULTS.badgeDesign }, (cfg) => {
      const design = { ...DEFAULTS.badgeDesign, ...(cfg.badgeDesign || {}) };
      updatePreview(design, document.getElementById("format").value,
                            document.getElementById("showTime").checked);
    });
  }

  document.getElementById("enabled").addEventListener("change", (e) => applyEnabled(e.target.checked));

  // Speichern
  document.getElementById("save-btn").addEventListener("click", () => {
    const cfg = {
      enabled:        document.getElementById("enabled").checked,
      format:         document.getElementById("format").value,
      mode:           document.getElementById("mode").value,
      showTime:       document.getElementById("showTime").checked,
      showDislikes:   document.getElementById("showDislikes").checked,
      showExactViews: document.getElementById("showExactViews").checked,
    };
    chrome.storage.sync.set(cfg, () => {
      sendToActiveTab({ type: "SETTINGS_UPDATED", cfg });
      const btn = document.getElementById("save-btn");
      btn.textContent = "✓ Gespeichert";
      setTimeout(() => { btn.textContent = "Speichern"; }, 1500);
    });
  });

  document.getElementById("open-options").addEventListener("click", () => chrome.runtime.openOptionsPage());

  document.getElementById("scan-btn").addEventListener("click", () => {
    sendToActiveTab({ type: "RESCAN" });
    window.close();
  });
});
