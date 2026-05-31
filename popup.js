const DEFAULTS = {
  enabled: true,
  format: "DD.MM.YYYY",
  mode: "append",
  showTime: false,
};

const SAMPLE_DATE = "2025-05-24T14:22:00";

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function formatDate(iso, fmt, showTime) {
  const d = new Date(iso);
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let s;
  if (fmt === "YYYY-MM-DD")      s = `${yyyy}-${mm}-${dd}`;
  else if (fmt === "MM/DD/YYYY")  s = `${mm}/${dd}/${yyyy}`;
  else if (fmt === "D. Mon YYYY") s = `${d.getDate()}. ${MONTHS_DE[d.getMonth()]} ${yyyy}`;
  else                             s = `${dd}.${mm}.${yyyy}`;
  if (showTime) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    s += ` ${hh}:${mi}`;
  }
  return "📅 " + s;
}

function updatePreview() {
  const fmt     = document.getElementById("format").value;
  const showTime = document.getElementById("showTime").checked;
  document.getElementById("preview-badge").textContent = formatDate(SAMPLE_DATE, fmt, showTime);
}

function applyEnabled(val) {
  document.body.classList.toggle("disabled", !val);
}

function sendToActiveTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const manifest = chrome.runtime.getManifest();
  document.getElementById("ver").textContent = "v" + manifest.version;

  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    document.getElementById("enabled").checked  = cfg.enabled;
    document.getElementById("format").value     = cfg.format;
    document.getElementById("mode").value       = cfg.mode;
    document.getElementById("showTime").checked = cfg.showTime;
    applyEnabled(cfg.enabled);
    updatePreview();
  });

  document.getElementById("format").addEventListener("change", updatePreview);
  document.getElementById("showTime").addEventListener("change", updatePreview);
  document.getElementById("enabled").addEventListener("change", (e) => applyEnabled(e.target.checked));

  document.getElementById("save-btn").addEventListener("click", () => {
    const cfg = {
      enabled:  document.getElementById("enabled").checked,
      format:   document.getElementById("format").value,
      mode:     document.getElementById("mode").value,
      showTime: document.getElementById("showTime").checked,
    };
    chrome.storage.sync.set(cfg, () => {
      sendToActiveTab({ type: "SETTINGS_UPDATED", cfg });
      const btn = document.getElementById("save-btn");
      btn.textContent = "✓ Gespeichert";
      setTimeout(() => { btn.textContent = "Speichern"; }, 1500);
    });
  });

  document.getElementById("open-options").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("scan-btn").addEventListener("click", () => {
    sendToActiveTab({ type: "RESCAN" });
    window.close();
  });
});
