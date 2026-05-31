/* =====================================================================
   YouTube – Exaktes Upload-Datum + Dislikes + Exakte Aufrufe
   ===================================================================== */

(() => {
  "use strict";

  /* ---------- Standard-Einstellungen -------------------------------- */
  const DEFAULTS = {
    enabled:        true,
    format:         "DD.MM.YYYY",
    mode:           "append",
    showTime:       false,
    showDislikes:   true,
    showExactViews: true,
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
      const m1 = u.pathname.match(/\/shorts\/([\w-]{6,})/);
      if (m1) return m1[1];
      const m2 = u.pathname.match(/\/embed\/([\w-]{6,})/);
      if (m2) return m2[1];
    } catch (_) {}
    return null;
  }

  /* ---------- Formatierung ----------------------------------------- */

  const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni",
                     "Juli","August","September","Oktober","November","Dezember"];

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const dd   = String(d.getDate()).padStart(2, "0");
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    let s;
    if      (CONFIG.format === "YYYY-MM-DD")      s = `${yyyy}-${mm}-${dd}`;
    else if (CONFIG.format === "MM/DD/YYYY")       s = `${mm}/${dd}/${yyyy}`;
    else if (CONFIG.format === "D. Mon YYYY")      s = `${d.getDate()}. ${MONTHS_DE[d.getMonth()]} ${yyyy}`;
    else                                           s = `${dd}.${mm}.${yyyy}`;
    if (CONFIG.showTime)
      s += ` ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    const emoji = CONFIG.badgeDesign?.emoji ?? "📅";
    return (emoji ? emoji + " " : "") + s;
  }

  function formatCount(n) {
    return n.toLocaleString("de-DE");
  }

  /* ---------- Cache ------------------------------------------------- */

  const mem = new Map();
  function cacheGet(key) {
    if (mem.has(key)) return mem.get(key);
    try {
      const v = sessionStorage.getItem(key);
      if (v !== null) { mem.set(key, v); return v; }
    } catch (_) {}
    return undefined;
  }
  function cacheSet(key, v) {
    mem.set(key, v);
    try { sessionStorage.setItem(key, v); } catch (_) {}
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

  /* ---------- Video-Daten von Seite holen (Datum + Aufrufe) --------- */

  async function fetchVideoData(id) {
    const res  = await fetch("https://www.youtube.com/watch?v=" + id, { credentials: "include" });
    const html = await res.text();
    const dateM  = html.match(/"uploadDate":"([^"]+)"/) || html.match(/"publishDate":"([^"]+)"/);
    const viewsM = html.match(/"viewCount":"(\d+)"/);
    return {
      date:  dateM  ? dateM[1]              : null,
      views: viewsM ? parseInt(viewsM[1], 10) : null,
    };
  }

  /* ---------- Datum auflösen (+ Views als Nebeneffekt cachen) ------- */

  function resolveDate(id) {
    const c = cacheGet("xdate:" + id);
    if (c !== undefined) return Promise.resolve(c === "NA" ? null : c);
    return new Promise(res => {
      enqueue(async () => {
        const again = cacheGet("xdate:" + id);
        if (again !== undefined) { res(again === "NA" ? null : again); return; }
        try {
          const data = await fetchVideoData(id);
          cacheSet("xdate:"  + id, data.date  || "NA");
          cacheSet("xviews:" + id, data.views !== null ? String(data.views) : "NA");
          res(data.date);
        } catch (_) {
          cacheSet("xdate:"  + id, "NA");
          cacheSet("xviews:" + id, "NA");
          res(null);
        }
      });
    });
  }

  /* ---------- Aufrufe auflösen (aus Cache oder nach Date-Fetch) ------ */

  function resolveViews(id) {
    const c = cacheGet("xviews:" + id);
    if (c !== undefined) return Promise.resolve(c === "NA" ? null : parseInt(c, 10));
    // Wird als Nebeneffekt von resolveDate befüllt
    return resolveDate(id).then(() => {
      const v = cacheGet("xviews:" + id);
      return (v && v !== "NA") ? parseInt(v, 10) : null;
    });
  }

  /* ---------- Dislikes von RYD-API auflösen ------------------------- */

  function resolveDislikes(id) {
    const c = cacheGet("xdislike:" + id);
    if (c !== undefined) return Promise.resolve(c === "NA" ? null : parseInt(c, 10));
    return new Promise(res => {
      enqueue(async () => {
        const again = cacheGet("xdislike:" + id);
        if (again !== undefined) { res(again === "NA" ? null : parseInt(again, 10)); return; }
        try {
          const r    = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${id}`);
          const json = await r.json();
          const count = typeof json.dislikes === "number" ? json.dislikes : null;
          cacheSet("xdislike:" + id, count !== null ? String(count) : "NA");
          res(count);
        } catch (_) {
          cacheSet("xdislike:" + id, "NA");
          res(null);
        }
      });
    });
  }

  /* ---------- Metadata-Line finden (robust) ------------------------- */

  function findMetadataLine(el) {
    const byId =
      el.querySelector("#metadata-line") ||
      el.querySelector(".metadata-line") ||
      el.querySelector("ytd-video-meta-block #metadata-line") ||
      el.querySelector("ytd-video-meta-block") ||
      el.querySelector("#metadata") ||
      el.querySelector("#details #meta");
    if (byId) return byId;
    const span = el.querySelector("span.inline-metadata-item, .inline-metadata-item");
    return span ? span.parentElement : null;
  }

  /* ---------- Badge-CSS aus Einstellungen --------------------------- */

  function buildBadgeCSS() {
    const d   = CONFIG.badgeDesign || DEFAULTS.badgeDesign;
    const hex = d.color;
    const r   = parseInt(hex.slice(1,3),16);
    const g   = parseInt(hex.slice(3,5),16);
    const b   = parseInt(hex.slice(5,7),16);
    const bgA = (d.bgAlpha / 100).toFixed(2);
    const bdA = (d.borderAlpha / 100).toFixed(2);
    const base = `
      display:inline-flex;align-items:center;vertical-align:middle;
      gap:${d.gap}px;margin-left:${d.ml}px;
      padding:${d.py}px ${d.px}px;border-radius:${d.radius}px;
      font-weight:${d.fontWeight};font-size:${d.fontSize}rem;
      line-height:${d.lineHeight};white-space:nowrap;
    `;
    return `
      .xdate-badge{
        ${base}
        color:${d.color};
        background:rgba(${r},${g},${b},${bgA});
        border:${d.bw}px solid rgba(${r},${g},${b},${bdA});
      }
      .xdate-badge.xdate-wait{
        color:#9aa0a6;background:rgba(154,160,166,.14);
        border-color:rgba(154,160,166,.30);font-weight:400;
      }
      .xdate-badge.xdate-err{
        color:#e0a030;background:rgba(224,160,48,.14);
        border-color:rgba(224,160,48,.30);
      }
      .xdate-badge.xdate-views{
        color:#5b9bd5;background:rgba(91,155,213,0.00);
        border-color:rgba(91,155,213,0.30);
      }
      .xdate-badge.xdate-dislike{
        color:#e05555;background:rgba(224,85,85,0.00);
        border-color:rgba(224,85,85,0.30);
      }
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
      'a#thumbnail[href], a#video-title-link[href], a#video-title[href], ' +
      'a[href*="/watch?v="], a[href*="/shorts/"]'
    );
    if (!a) return;
    const id = idFromHref(a.getAttribute("href"));
    if (!id) return;
    const line = findMetadataLine(el);
    if (!line) return;

    el.dataset.xdate = "1";

    // ── Datum-Badge ──────────────────────────────────────────────────
    const dateBadge = document.createElement("span");
    dateBadge.className = "xdate-badge xdate-wait";
    dateBadge.textContent = "…";
    line.appendChild(dateBadge);

    resolveDate(id).then(iso => {
      const f = iso ? formatDate(iso) : null;
      if (!f) {
        dateBadge.className = "xdate-badge xdate-err";
        dateBadge.textContent = "📅 ?";
        dateBadge.title = "Datum nicht ermittelbar";
        return;
      }
      dateBadge.className = "xdate-badge";
      dateBadge.textContent = f;
      dateBadge.title = "Exaktes Hochladedatum";
      if (CONFIG.mode === "replace") {
        const items = [...line.querySelectorAll(".inline-metadata-item")]
          .filter(i => !i.classList.contains("xdate-badge"));
        if (items.length) items[items.length - 1].style.display = "none";
      }
    });

    // ── Exakte Aufrufe ───────────────────────────────────────────────
    if (CONFIG.showExactViews) {
      const viewsBadge = document.createElement("span");
      viewsBadge.className = "xdate-badge xdate-views xdate-wait";
      viewsBadge.textContent = "…";
      line.appendChild(viewsBadge);

      resolveViews(id).then(views => {
        if (views === null) { viewsBadge.remove(); return; }
        viewsBadge.className = "xdate-badge xdate-views";
        viewsBadge.textContent = "👁 " + formatCount(views);
        viewsBadge.title = "Exakte Aufrufzahl";
      });
    }

    // ── Dislikes (Return YouTube Dislike API) ─────────────────────────
    if (CONFIG.showDislikes) {
      const dislikeBadge = document.createElement("span");
      dislikeBadge.className = "xdate-badge xdate-dislike xdate-wait";
      dislikeBadge.textContent = "…";
      line.appendChild(dislikeBadge);

      resolveDislikes(id).then(dislikes => {
        if (dislikes === null) { dislikeBadge.remove(); return; }
        dislikeBadge.className = "xdate-badge xdate-dislike";
        dislikeBadge.textContent = "👎 " + formatCount(dislikes);
        dislikeBadge.title = "Dislikes (Return YouTube Dislike)";
      });
    }
  }

  /* ---------- Reset + Scan ------------------------------------------ */

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

  /* ---------- Einstellungen laden ---------------------------------- */

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
    if (msg.type === "RESCAN") resetBadges();
  });

  /* ---------- Observer + YouTube-Navigation ------------------------ */

  const debouncedScan = debounce(scan, 200);
  new MutationObserver(debouncedScan).observe(document.documentElement, { childList: true, subtree: true });
  ["yt-navigate-finish", "yt-page-data-updated"].forEach(ev =>
    window.addEventListener(ev, () => setTimeout(scan, 400))
  );
  setInterval(scan, 1000);

  loadSettings(scan);
})();
