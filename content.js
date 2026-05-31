/* =====================================================================
   YouTube – Exaktes Upload-Datum
   Holt für jedes Video das echte Hochladedatum direkt von der
   Video-Seite (uploadDate aus den Metadaten) und blendet es als Badge ein.
   Einstellungen werden aus chrome.storage.sync geladen.
   ===================================================================== */

(() => {
  "use strict";

  /* ---------- Standard-Einstellungen -------------------------------- */
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

  let CONFIG = { ...DEFAULTS };

  /* ---------- Renderer-Selektoren ----------------------------------- */
  const RENDERERS = [
    "ytd-video-renderer",
    "ytd-rich-item-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-video-renderer",
    "ytd-playlist-panel-video-renderer",
  ].join(", ");

  /* ---------- Helfer ------------------------------------------------ */

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function idFromHref(href) {
    if (!href) return null;
    try {
      const u = new URL(href, location.origin);
      if (u.pathname === "/watch") return u.searchParams.get("v");
      let m = u.pathname.match(/\/shorts\/([\w-]{6,})/);
      if (m) return m[1];
      m = u.pathname.match(/\/embed\/([\w-]{6,})/);
      if (m) return m[1];
    } catch (_) {}
    return null;
  }

  const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const dd   = String(d.getDate()).padStart(2, "0");
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    let s;
    if (CONFIG.format === "YYYY-MM-DD")      s = `${yyyy}-${mm}-${dd}`;
    else if (CONFIG.format === "MM/DD/YYYY")  s = `${mm}/${dd}/${yyyy}`;
    else if (CONFIG.format === "D. Mon YYYY") s = `${d.getDate()}. ${MONTHS_DE[d.getMonth()]} ${yyyy}`;
    else                                      s = `${dd}.${mm}.${yyyy}`;
    if (CONFIG.showTime) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      s += ` ${hh}:${mi}`;
    }
    const emoji = CONFIG.badgeDesign?.emoji ?? "📅";
    return (emoji ? emoji + " " : "") + s;
  }

  /* ---------- Cache ------------------------------------------------- */

  const mem = new Map();
  function cacheGet(id) {
    if (mem.has(id)) return mem.get(id);
    try { const v = sessionStorage.getItem("xdate:" + id); if (v !== null) { mem.set(id, v); return v; } } catch (_) {}
    return undefined;
  }
  function cacheSet(id, v) {
    mem.set(id, v);
    try { sessionStorage.setItem("xdate:" + id, v); } catch (_) {}
  }

  /* ---------- Warteschlange ----------------------------------------- */

  const queue = [];
  let active = 0;
  function enqueue(task) { queue.push(task); pump(); }
  function pump() {
    while (active < 4 && queue.length) {
      const task = queue.shift();
      active++;
      task().finally(() => { active--; pump(); });
    }
  }

  /* ---------- Datum von Video-Seite holen --------------------------- */

  async function fetchUploadDate(id) {
    const res = await fetch("https://www.youtube.com/watch?v=" + id, { credentials: "include" });
    const html = await res.text();
    let m = html.match(/"uploadDate":"([^"]+)"/);
    if (m) return m[1];
    m = html.match(/"publishDate":"([^"]+)"/);
    if (m) return m[1];
    return null;
  }

  function resolve(id) {
    const c = cacheGet(id);
    if (c !== undefined) return Promise.resolve(c === "NA" ? null : c);
    return new Promise((res) => {
      enqueue(async () => {
        const again = cacheGet(id);
        if (again !== undefined) { res(again === "NA" ? null : again); return; }
        try {
          const iso = await fetchUploadDate(id);
          cacheSet(id, iso || "NA");
          res(iso);
        } catch (_) { res(null); }
      });
    });
  }

  /* ---------- Badge-CSS aus Einstellungen berechnen ---------------- */

  function buildBadgeCSS() {
    const d = CONFIG.badgeDesign || DEFAULTS.badgeDesign;
    const hex = d.color;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    const bgA = (d.bgAlpha / 100).toFixed(2);
    const bdA = (d.borderAlpha / 100).toFixed(2);
    return `
      .xdate-badge{
        display:inline-flex;
        align-items:center;
        gap:${d.gap}px;
        margin-left:${d.ml}px;
        padding:${d.py}px ${d.px}px;
        border-radius:${d.radius}px;
        font-weight:${d.fontWeight};
        font-size:${d.fontSize}rem;
        line-height:${d.lineHeight};
        white-space:nowrap;
        color:${d.color};
        background:rgba(${r},${g},${b},${bgA});
        border:${d.bw}px solid rgba(${r},${g},${b},${bdA});
      }
      .xdate-badge.xdate-wait{color:#9aa0a6;background:rgba(154,160,166,.14);border-color:rgba(154,160,166,.30);font-weight:400;}
      .xdate-badge.xdate-err{color:#e0a030;background:rgba(224,160,48,.14);border-color:rgba(224,160,48,.30);}
    `;
  }

  /* ---------- Style injizieren ------------------------------------- */

  function injectStyle() {
    let s = document.getElementById("xdate-style");
    if (!s) {
      s = document.createElement("style");
      s.id = "xdate-style";
      (document.head || document.documentElement).appendChild(s);
    }
    s.textContent = buildBadgeCSS();
  }

  /* ---------- Badge einblenden ------------------------------------- */

  function annotate(el) {
    if (el.dataset.xdate) return;
    const a = el.querySelector(
      'a#thumbnail[href], a#video-title-link[href], a#video-title[href], a[href*="/watch?v="], a[href*="/shorts/"]'
    );
    if (!a) return;
    const id = idFromHref(a.getAttribute("href"));
    if (!id) return;
    const line = el.querySelector("#metadata-line") || el.querySelector(".metadata-line") || el.querySelector("#metadata");
    if (!line) return;

    el.dataset.xdate = "1";
    const badge = document.createElement("span");
    badge.className = "xdate-badge xdate-wait";
    badge.textContent = "lädt…";
    line.appendChild(badge);

    resolve(id).then((iso) => {
      const f = iso ? formatDate(iso) : null;
      if (!f) {
        badge.className = "xdate-badge xdate-err";
        badge.textContent = "📅 ?";
        badge.title = "Datum konnte nicht ermittelt werden";
        return;
      }
      badge.className = "xdate-badge";
      badge.textContent = f;
      badge.title = "Exaktes Hochladedatum";

      if (CONFIG.mode === "replace") {
        const items = line.querySelectorAll(".inline-metadata-item");
        if (items.length) items[items.length - 1].style.display = "none";
      }
    });
  }

  /* ---------- Alle Badges zurücksetzen und neu rendern ------------- */

  function resetBadges() {
    document.querySelectorAll("[data-xdate]").forEach(el => {
      delete el.dataset.xdate;
      el.querySelectorAll(".xdate-badge").forEach(b => b.remove());
      el.querySelectorAll(".inline-metadata-item").forEach(i => i.style.display = "");
    });
    scan();
  }

  function scan() {
    if (!CONFIG.enabled) return;
    injectStyle();
    document.querySelectorAll(RENDERERS).forEach(annotate);
  }

  /* ---------- Einstellungen laden & anwenden ----------------------- */

  function loadSettings(callback) {
    chrome.storage.sync.get(DEFAULTS, (cfg) => {
      CONFIG = { ...DEFAULTS, ...cfg };
      if (cfg.badgeDesign) CONFIG.badgeDesign = { ...DEFAULTS.badgeDesign, ...cfg.badgeDesign };
      if (callback) callback();
    });
  }

  /* ---------- Messages vom Popup ----------------------------------- */

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SETTINGS_UPDATED") {
      CONFIG = { ...CONFIG, ...msg.cfg };
      if (msg.cfg.badgeDesign) CONFIG.badgeDesign = { ...CONFIG.badgeDesign, ...msg.cfg.badgeDesign };
      injectStyle();
      resetBadges();
    }
    if (msg.type === "RESCAN") {
      resetBadges();
    }
  });

  /* ---------- Observer + YouTube-Navigation ------------------------ */

  const debouncedScan = debounce(scan, 250);
  const observer = new MutationObserver(debouncedScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  ["yt-navigate-finish", "yt-page-data-updated"].forEach((ev) =>
    window.addEventListener(ev, () => setTimeout(scan, 300))
  );

  setInterval(scan, 1500);

  /* ---------- Start ------------------------------------------------ */

  loadSettings(scan);
})();
