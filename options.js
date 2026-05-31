const VIDEOS = [
  { title: "I built an AI that codes better than me", channel: "Fireship", views: "1,4 Mio.", ago: "vor 8 Monaten", date: "2025-09-15T14:22:00", dur: "9:47", icon: "🔥" },
  { title: "CSS Grid in 20 minutes – Full Tutorial", channel: "Kevin Powell", views: "890 Tsd.", ago: "vor 1 Jahr", date: "2024-11-03T09:00:00", dur: "20:14", icon: "🎨" },
  { title: "Why I switched from VS Code to Neovim", channel: "ThePrimeagen", views: "2,1 Mio.", ago: "vor 2 Jahren", date: "2023-06-27T18:30:00", dur: "15:02", icon: "⌨️" },
  { title: "The most misunderstood concept in JavaScript", channel: "Computerphile", views: "3,8 Mio.", ago: "vor 3 Jahren", date: "2022-03-11T12:00:00", dur: "23:59", icon: "📐" },
  { title: "Building a browser extension in 30 minutes", channel: "Dev Ed", views: "412 Tsd.", ago: "vor 5 Monaten", date: "2025-12-01T10:15:00", dur: "30:05", icon: "🧩" },
  { title: "Linux is actually good now", channel: "Chris Titus Tech", views: "678 Tsd.", ago: "vor 11 Monaten", date: "2025-06-20T08:45:00", dur: "18:33", icon: "🐧" },
];

const DEFAULTS_DESIGN = {
  color: "#43c463", bgAlpha: 0, borderAlpha: 35,
  fontSize: 0.85, fontWeight: "300", lineHeight: 1.35,
  px: 5, py: 0, radius: 8, ml: 1, gap: 0, bw: 0.5,
  emoji: "📅", format: "DD.MM.YYYY", showTime: false, mode: "append",
};

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function formatDate(iso, fmt, showTime, emoji) {
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
  return (emoji ? emoji + " " : "") + s;
}

function getSettings() {
  return {
    color:       document.getElementById("c-color").value,
    bgAlpha:     parseInt(document.getElementById("c-bg-alpha").value),
    borderAlpha: parseInt(document.getElementById("c-border-alpha").value),
    fontSize:    parseFloat(document.getElementById("c-fontsize").value),
    fontWeight:  document.getElementById("c-fontweight").value,
    lineHeight:  parseFloat(document.getElementById("c-lineheight").value),
    px:          parseInt(document.getElementById("c-px").value),
    py:          parseInt(document.getElementById("c-py").value),
    radius:      parseInt(document.getElementById("c-radius").value),
    ml:          parseInt(document.getElementById("c-ml").value),
    gap:         parseInt(document.getElementById("c-gap").value),
    bw:          parseFloat(document.getElementById("c-bw").value),
    emoji:       document.getElementById("c-emoji").value,
    format:      document.getElementById("c-format").value,
    showTime:    document.getElementById("c-time").checked,
    mode:        document.getElementById("c-mode").value,
  };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function badgeCSS(s) {
  const rgb = hexToRgb(s.color);
  const bgA = (s.bgAlpha / 100).toFixed(2);
  const bdA = (s.borderAlpha / 100).toFixed(2);
  // YouTube uses html { font-size: 10px }, so convert rem→px for accurate preview
  const YT_REM = 10;
  return {
    display: "inline-flex", alignItems: "center", gap: s.gap + "px",
    marginLeft: s.ml + "px", padding: `${s.py}px ${s.px}px`,
    borderRadius: s.radius + "px", fontWeight: s.fontWeight,
    fontSize: (s.fontSize * YT_REM) + "px",
    lineHeight: s.lineHeight,
    whiteSpace: "nowrap", color: s.color,
    background: `rgba(${rgb},${bgA})`,
    border: `${s.bw}px solid rgba(${rgb},${bdA})`,
  };
}

function updateBadges() {
  const s = getSettings();
  const css = badgeCSS(s);
  document.querySelectorAll(".xdate-badge:not(.xdate-wait):not(.xdate-err)").forEach(badge => {
    const vid = badge.dataset.vid;
    const v = VIDEOS.find(x => x.title === vid) || VIDEOS[0];
    badge.textContent = formatDate(v.date, s.format, s.showTime, s.emoji);
    Object.assign(badge.style, css);
  });
  document.querySelectorAll(".inline-metadata-item.ago-item").forEach(el => {
    el.style.display = s.mode === "replace" ? "none" : "";
  });
  updateCSSOutput(s);
}

function updateCSSOutput(s) {
  const rgb = hexToRgb(s.color);
  const bgA = (s.bgAlpha / 100).toFixed(2);
  const bdA = (s.borderAlpha / 100).toFixed(2);
  document.getElementById("css-output").textContent =
`.xdate-badge {
  display: inline-flex;
  align-items: center;
  gap: ${s.gap}px;
  margin-left: ${s.ml}px;
  padding: ${s.py}px ${s.px}px;
  border-radius: ${s.radius}px;
  font-weight: ${s.fontWeight};
  font-size: ${s.fontSize}rem;
  line-height: ${s.lineHeight};
  white-space: nowrap;
  color: ${s.color};
  background: rgba(${rgb},${bgA});
  border: ${s.bw}px solid rgba(${rgb},${bdA});
}`;
}

function buildCards() {
  const s = getSettings();
  const css = badgeCSS(s);

  ["grid-cards", "list-cards", "compact-cards"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });

  VIDEOS.forEach((v, i) => {
    // Grid (alle)
    {
      const el = document.createElement("div");
      el.className = "yt-card";
      el.innerHTML =
        `<div class="yt-thumb"><div class="yt-thumb-inner">${v.icon}</div><span class="yt-duration">${v.dur}</span></div>` +
        `<div class="yt-card-info"><div class="yt-avatar">${v.channel[0]}</div>` +
        `<div class="yt-meta"><div class="yt-title">${v.title}</div><div class="yt-channel">${v.channel}</div>` +
        `<div class="metadata-line"><span class="inline-metadata-item">${v.views} Aufrufe</span>` +
        `<span class="inline-metadata-item">&nbsp;•&nbsp;</span>` +
        `<span class="inline-metadata-item ago-item">${v.ago}</span></div></div></div>`;
      const badge = document.createElement("span");
      badge.className = "xdate-badge";
      badge.dataset.vid = v.title;
      badge.textContent = formatDate(v.date, s.format, s.showTime, s.emoji);
      Object.assign(badge.style, css);
      el.querySelector(".metadata-line").appendChild(badge);
      if (s.mode === "replace") el.querySelector(".ago-item").style.display = "none";
      document.getElementById("grid-cards").appendChild(el);
    }

    // List (erste 3)
    if (i < 3) {
      const el = document.createElement("div");
      el.className = "yt-list-card";
      el.innerHTML =
        `<div class="yt-list-thumb"><div class="yt-list-thumb-inner">${v.icon}</div><span class="yt-duration">${v.dur}</span></div>` +
        `<div class="yt-list-meta yt-meta"><div class="yt-title">${v.title}</div><div class="yt-channel">${v.channel}</div>` +
        `<div class="metadata-line"><span class="inline-metadata-item">${v.views} Aufrufe</span>` +
        `<span class="inline-metadata-item">&nbsp;•&nbsp;</span>` +
        `<span class="inline-metadata-item ago-item">${v.ago}</span></div></div>`;
      const badge = document.createElement("span");
      badge.className = "xdate-badge";
      badge.dataset.vid = v.title;
      badge.textContent = formatDate(v.date, s.format, s.showTime, s.emoji);
      Object.assign(badge.style, css);
      el.querySelector(".metadata-line").appendChild(badge);
      if (s.mode === "replace") el.querySelector(".ago-item").style.display = "none";
      document.getElementById("list-cards").appendChild(el);
    }

    // Compact (erste 4)
    if (i < 4) {
      const el = document.createElement("div");
      el.className = "yt-compact-card";
      el.innerHTML =
        `<div class="yt-compact-thumb"><div class="yt-compact-thumb-inner">${v.icon}</div><span class="yt-duration" style="font-size:10px">${v.dur}</span></div>` +
        `<div class="yt-compact-meta yt-meta"><div class="yt-title">${v.title}</div><div class="yt-channel">${v.channel}</div>` +
        `<div class="metadata-line"><span class="inline-metadata-item">${v.views}</span>` +
        `<span class="inline-metadata-item">&nbsp;•&nbsp;</span>` +
        `<span class="inline-metadata-item ago-item">${v.ago}</span></div></div>`;
      const badge = document.createElement("span");
      badge.className = "xdate-badge";
      badge.dataset.vid = v.title;
      badge.textContent = formatDate(v.date, s.format, s.showTime, s.emoji);
      Object.assign(badge.style, css);
      el.querySelector(".metadata-line").appendChild(badge);
      if (s.mode === "replace") el.querySelector(".ago-item").style.display = "none";
      document.getElementById("compact-cards").appendChild(el);
    }
  });
}

function bindSlider(id, labelId, suffix, rebuild) {
  const el = document.getElementById(id);
  const lbl = document.getElementById(labelId);
  el.addEventListener("input", () => {
    lbl.textContent = el.value + suffix;
    rebuild ? buildCards() : updateBadges();
  });
}

bindSlider("c-bg-alpha",    "c-bg-alpha-val",    "%",  false);
bindSlider("c-border-alpha","c-border-alpha-val","%",  false);
bindSlider("c-fontsize",    "c-fontsize-val",    "",   false);
bindSlider("c-lineheight",  "c-lineheight-val",  "",   false);
bindSlider("c-px",          "c-px-val",          "px", false);
bindSlider("c-py",          "c-py-val",          "px", false);
bindSlider("c-radius",      "c-radius-val",      "px", false);
bindSlider("c-ml",          "c-ml-val",          "px", false);
bindSlider("c-gap",         "c-gap-val",         "px", false);
bindSlider("c-bw",          "c-bw-val",          "px", false);

["c-color","c-fontweight","c-emoji","c-format","c-time","c-mode"].forEach(id =>
  document.getElementById(id).addEventListener("change", () => buildCards())
);

document.getElementById("copy-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("css-output").textContent).then(() => {
    const btn = document.getElementById("copy-btn");
    btn.textContent = "✓ Kopiert!";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = "Kopieren"; btn.classList.remove("copied"); }, 1800);
  });
});

document.getElementById("save-btn").addEventListener("click", () => {
  const s = getSettings();
  const cfg = {
    format: s.format, mode: s.mode, showTime: s.showTime,
    badgeDesign: {
      color: s.color, bgAlpha: s.bgAlpha, borderAlpha: s.borderAlpha,
      fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight,
      px: s.px, py: s.py, radius: s.radius, ml: s.ml, gap: s.gap, bw: s.bw,
      emoji: s.emoji,
    },
  };
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.set(cfg, () => {
      const btn = document.getElementById("save-btn");
      btn.textContent = "✓ Gespeichert!";
      btn.classList.add("saved");
      setTimeout(() => { btn.textContent = "In Extension speichern"; btn.classList.remove("saved"); }, 2000);
    });
  } else {
    alert("Nur innerhalb der Extension verfügbar. CSS über 'Kopieren' übernehmen.");
  }
});

// ── Design-Werte auf alle Controls anwenden (zentral) ───────────────
function applyDesignToControls(d) {
  const set = (id, val, label, suffix = "") => {
    const el = document.getElementById(id);
    if (el == null || val == null) return;
    el.value = val;
    if (label) {
      const lbl = document.getElementById(label);
      if (lbl) lbl.textContent = val + suffix;
    }
  };
  set("c-color",        d.color);
  set("c-bg-alpha",     d.bgAlpha,     "c-bg-alpha-val",     "%");
  set("c-border-alpha", d.borderAlpha, "c-border-alpha-val", "%");
  set("c-fontsize",     d.fontSize,    "c-fontsize-val");
  set("c-fontweight",   d.fontWeight);
  set("c-lineheight",   d.lineHeight,  "c-lineheight-val");
  set("c-px",           d.px,          "c-px-val",     "px");
  set("c-py",           d.py,          "c-py-val",     "px");
  set("c-radius",       d.radius,      "c-radius-val", "px");
  set("c-ml",           d.ml,          "c-ml-val",     "px");
  set("c-gap",          d.gap,         "c-gap-val",    "px");
  set("c-bw",           d.bw,          "c-bw-val",     "px");
  if (d.emoji != null) set("c-emoji", d.emoji);
  buildCards();
  updateCSSOutput(getSettings());
}

function loadSavedDesign() {
  if (typeof chrome === "undefined" || !chrome.storage) { return; }
  chrome.storage.sync.get({ badgeDesign: DEFAULTS_DESIGN, format: "DD.MM.YYYY", mode: "append", showTime: false }, (cfg) => {
    if (chrome.runtime.lastError) { return; }
    applyDesignToControls(cfg.badgeDesign || DEFAULTS_DESIGN);
    document.getElementById("c-format").value = cfg.format;
    document.getElementById("c-time").checked = cfg.showTime;
    document.getElementById("c-mode").value   = cfg.mode;
    buildCards();
    updateCSSOutput(getSettings());
  });
}

// ── CSS-Code parsen (für Import von Freunden) ───────────────────────
function rgbaAlpha(str) {
  const m = str.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (!m) return null;
  return m[1] !== undefined ? parseFloat(m[1]) : 1;
}

function normalizeHex(c) {
  c = c.trim();
  if (c.startsWith("#")) {
    if (c.length === 4) return "#" + c[1]+c[1] + c[2]+c[2] + c[3]+c[3];
    return c.slice(0, 7);
  }
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    const h = n => parseInt(n).toString(16).padStart(2, "0");
    return "#" + h(m[1]) + h(m[2]) + h(m[3]);
  }
  return null;
}

function parseCSS(css) {
  const block = css.includes("{") ? css.slice(css.indexOf("{") + 1, css.lastIndexOf("}")) : css;
  const props = {};
  block.split(";").forEach(decl => {
    const i = decl.indexOf(":");
    if (i === -1) return;
    const k = decl.slice(0, i).trim().toLowerCase();
    const v = decl.slice(i + 1).trim();
    if (k) props[k] = v;
  });

  const d = { ...DEFAULTS_DESIGN };
  let found = 0;
  const num = (key, target, fb) => {
    if (props[key] != null) { const n = parseFloat(props[key]); if (!isNaN(n)) { d[target] = n; found++; } }
  };

  if (props.color)         { const h = normalizeHex(props.color); if (h) { d.color = h; found++; } }
  num("gap",          "gap");
  num("margin-left",  "ml");
  num("border-radius","radius");
  num("font-size",    "fontSize");
  num("line-height",  "lineHeight");
  if (props["font-weight"]) { const w = parseInt(props["font-weight"]); if (!isNaN(w)) { d.fontWeight = String(w); found++; } }

  if (props.padding != null) {
    const p = props.padding.split(/\s+/).map(parseFloat).filter(n => !isNaN(n));
    if (p.length === 1)      { d.py = p[0]; d.px = p[0]; found++; }
    else if (p.length >= 2)  { d.py = p[0]; d.px = p[1]; found++; }
  }
  if (props.background != null) {
    const a = rgbaAlpha(props.background);
    if (a !== null) { d.bgAlpha = Math.round(a * 100); found++; }
  }
  if (props.border != null) {
    const bw = parseFloat(props.border);
    if (!isNaN(bw)) { d.bw = bw; found++; }
    const a = rgbaAlpha(props.border);
    if (a !== null) { d.borderAlpha = Math.round(a * 100); found++; }
  }

  return found >= 2 ? d : null;  // mind. 2 erkannte Properties = gültiges CSS
}

// ── Exportieren: aktuelles CSS in Textarea + Zwischenablage ─────────
document.getElementById("export-btn").addEventListener("click", () => {
  const css = document.getElementById("css-output").textContent;
  document.getElementById("share-code").value = css;
  navigator.clipboard.writeText(css).then(() => {
    const btn = document.getElementById("export-btn");
    btn.textContent = "✓ Kopiert!";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = "Exportieren"; btn.classList.remove("copied"); }, 1800);
  });
});

// ── Importieren: CSS (oder altes JSON) aus Textarea übernehmen ──────
document.getElementById("import-btn").addEventListener("click", () => {
  const raw = document.getElementById("share-code").value.trim();
  if (!raw) return;

  let design = null;
  // 1) Versuch: CSS parsen
  if (raw.includes("{") || raw.includes(":")) design = parseCSS(raw);
  // 2) Fallback: altes JSON-Format
  if (!design) {
    try {
      const j = JSON.parse(raw);
      if (j && "color" in j && "fontSize" in j) design = { ...DEFAULTS_DESIGN, ...j };
    } catch (_) {}
  }

  const btn = document.getElementById("import-btn");
  if (design) {
    applyDesignToControls(design);
    btn.textContent = "✓ Importiert!";
    btn.style.background = "#2e7d32";
    btn.style.color = "#fff";
    setTimeout(() => { btn.textContent = "Importieren"; btn.style.background = ""; btn.style.color = ""; }, 1800);
  } else {
    btn.textContent = "✗ Ungültiges CSS";
    btn.style.background = "#7d2e2e";
    btn.style.color = "#fff";
    setTimeout(() => { btn.textContent = "Importieren"; btn.style.background = ""; btn.style.color = ""; }, 2000);
  }
});

// Sofort mit Standardwerten rendern, dann Storage-Werte nachladen
buildCards();
updateCSSOutput(getSettings());
loadSavedDesign();
