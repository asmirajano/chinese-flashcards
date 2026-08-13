/*
  Learning Videos — right-hand slide-out sidebar.
  Mirrors the look, behavior and animation of the left "Grammar Terms"
  panel (grammar-glossary.js) exactly, just anchored to the opposite edge.

  Include on any lesson page with:
    <script src="video-data.js"></script>       (page-specific data — see that file)
    <script src="video-sidebar.js" defer></script>

  How topic detection works (zero config for new pages):
    - Give each top-level lesson section a `data-topic="r1"` (etc.) attribute
      and a `.page` class, same convention already used by the accordion
      component. Whichever `.page` currently has class="active" decides
      which key is read out of window.VIDEO_RECOMMENDATIONS.
    - A MutationObserver watches for that "active" class flipping (e.g. when
      the existing pagination's goTo() runs) and automatically re-renders
      the video list — no event wiring needed on the page's side.
    - The panel's subtitle is pulled straight from that page's .ruletitle
      text, so it always matches whatever's on screen.

  To reuse this on a page with a totally different navigation model (no
  .page/.active pagination at all), just call window.__videoSidebarRender(key)
  yourself whenever the topic changes — everything else still works.
*/
(function () {
  if (window.__videoSidebarLoaded) return;
  window.__videoSidebarLoaded = true;

  var CSS = ""
    + ".vs-tab{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9998;"
    + "background:linear-gradient(135deg,#e63946,#f4a259);color:#fff;border:none;"
    + "border-radius:12px 0 0 12px;padding:14px 8px;cursor:pointer;box-shadow:-2px 0 12px rgba(0,0,0,.18);"
    + "font-family:\"Segoe UI\",-apple-system,\"Helvetica Neue\",Arial,sans-serif;font-weight:700;"
    + "font-size:.72rem;letter-spacing:.5px;writing-mode:vertical-rl;text-orientation:mixed;"
    + "transition:.18s;line-height:1.3;}"
    + ".vs-tab:hover{padding-right:12px;box-shadow:-4px 0 16px rgba(0,0,0,.26);}"
    + ".vs-backdrop{position:fixed;inset:0;background:rgba(34,34,59,.35);z-index:9999;"
    + "opacity:0;pointer-events:none;transition:opacity .2s;}"
    + ".vs-backdrop.vs-open{opacity:1;pointer-events:auto;}"
    + ".vs-panel{position:fixed;right:0;top:0;height:100%;width:340px;max-width:88vw;"
    + "background:#fff7ef;z-index:10000;box-shadow:-6px 0 30px rgba(0,0,0,.22);"
    + "transform:translateX(100%);transition:transform .25s ease;display:flex;flex-direction:column;"
    + "font-family:\"Segoe UI\",-apple-system,\"Helvetica Neue\",Arial,sans-serif;color:#22223b;}"
    + ".vs-panel.vs-open{transform:translateX(0);}"
    + ".vs-head{background:linear-gradient(135deg,#e63946,#f4a259);color:#fff;padding:16px 18px;"
    + "display:flex;align-items:center;justify-content:space-between;flex:none;gap:10px;}"
    + ".vs-head h2{margin:0;font-size:1.05rem;font-weight:800;}"
    + ".vs-head .vs-sub{font-size:.72rem;opacity:.9;margin-top:2px;font-weight:400;"
    + "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}"
    + ".vs-close{background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.5);color:#fff;"
    + "border-radius:50%;width:28px;height:28px;font-size:1rem;cursor:pointer;line-height:1;flex:none;}"
    + ".vs-close:hover{background:rgba(255,255,255,.38);}"
    + ".vs-list{overflow-y:auto;padding:12px 14px 20px;flex:1;}"
    + ".vs-card{background:#fff;border:1px solid #f0e2d0;border-radius:14px;overflow:hidden;"
    + "margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.05);transition:.15s;}"
    + ".vs-card:hover{box-shadow:0 6px 16px rgba(0,0,0,.1);transform:translateY(-1px);}"
    + ".vs-thumb{position:relative;width:100%;height:96px;display:flex;align-items:center;"
    + "justify-content:center;font-size:1.8rem;color:#fff;}"
    + ".vs-thumb.tc-1{background:linear-gradient(135deg,#e63946,#f4a259);}"
    + ".vs-thumb.tc-2{background:linear-gradient(135deg,#4361ee,#4cc9f0);}"
    + ".vs-thumb.tc-3{background:linear-gradient(135deg,#2a9d8f,#8ecae6);}"
    + ".vs-thumb.tc-4{background:linear-gradient(135deg,#f4a259,#f9c74f);}"
    + ".vs-thumb.tc-5{background:linear-gradient(135deg,#7209b7,#e63946);}"
    + ".vs-thumb img{width:100%;height:100%;object-fit:cover;}"
    + ".vs-lang{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.55);border-radius:8px;"
    + "padding:2px 6px;font-size:.7rem;line-height:1.3;}"
    + ".vs-body{padding:10px 12px 12px;}"
    + ".vs-title{font-weight:700;font-size:.88rem;line-height:1.3;margin:0 0 4px;}"
    + ".vs-channel{font-size:.78rem;color:#6c757d;margin:0 0 10px;}"
    + ".vs-watch{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#e63946,#f4a259);"
    + "color:#fff;text-decoration:none;border-radius:10px;padding:7px 12px;font-size:.78rem;font-weight:700;"
    + "transition:.15s;}"
    + ".vs-watch:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(230,57,70,.3);}"
    + ".vs-empty{color:#6c757d;font-size:.88rem;text-align:center;padding:30px 10px;}"
    + ".vs-foot{padding:10px 16px 14px;font-size:.7rem;color:#6c757d;text-align:center;flex:none;"
    + "border-top:1px solid #f0e2d0;}"
    + "@media(max-width:480px){.vs-tab{font-size:.66rem;padding:12px 6px;}.vs-panel{width:88vw;}}";

  function injectCss() {
    var style = document.createElement("style");
    style.id = "vs-style";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildPanel() {
    var backdrop = document.createElement("div");
    backdrop.className = "vs-backdrop";

    var panel = document.createElement("div");
    panel.className = "vs-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Recommended learning videos");

    var head = document.createElement("div");
    head.className = "vs-head";
    head.innerHTML =
      '<div style="min-width:0"><h2>🎬 Learning Videos</h2><div class="vs-sub" id="vs-sub">Pick a rule to see recommendations</div></div>' +
      '<button class="vs-close" aria-label="Close">✕</button>';

    var list = document.createElement("div");
    list.className = "vs-list";
    list.id = "vs-list";

    var foot = document.createElement("div");
    foot.className = "vs-foot";
    foot.textContent = "Curated per grammar rule — 🇷🇺 Russian & 🇬🇧 English picks";

    panel.appendChild(head);
    panel.appendChild(list);
    panel.appendChild(foot);

    var tab = document.createElement("button");
    tab.className = "vs-tab";
    tab.textContent = "🎬 Learning Videos";
    tab.setAttribute("aria-label", "Open recommended learning videos");

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    document.body.appendChild(tab);

    function open() {
      panel.classList.add("vs-open");
      backdrop.classList.add("vs-open");
    }
    function close() {
      panel.classList.remove("vs-open");
      backdrop.classList.remove("vs-open");
    }
    function toggle() {
      if (panel.classList.contains("vs-open")) close();
      else open();
    }

    tab.addEventListener("click", toggle);
    head.querySelector(".vs-close").addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    return { list: list, sub: head.querySelector("#vs-sub") };
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function youtubeSearchUrl(entry) {
    if (entry.url) return entry.url;
    var q = entry.query || (entry.channel + " " + entry.title);
    return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  }

  function renderCard(entry) {
    var flag = entry.lang === "ru" ? "🇷🇺" : "🇬🇧";
    var thumbInner = entry.thumb
      ? '<img src="' + escapeHtml(entry.thumb) + '" alt="">'
      : "▶️";
    var thumbClass = entry.thumb ? "" : (entry.thumbClass || "tc-1");
    return (
      '<div class="vs-card">' +
        '<div class="vs-thumb ' + thumbClass + '">' + thumbInner +
          '<span class="vs-lang" title="' + (entry.lang === "ru" ? "Russian" : "English") + '">' + flag + '</span>' +
        '</div>' +
        '<div class="vs-body">' +
          '<div class="vs-title">' + escapeHtml(entry.title) + '</div>' +
          '<div class="vs-channel">' + escapeHtml(entry.channel) + '</div>' +
          '<a class="vs-watch" href="' + youtubeSearchUrl(entry) + '" target="_blank" rel="noopener noreferrer">▶ Watch on YouTube</a>' +
        '</div>' +
      '</div>'
    );
  }

  var refs = null;

  function currentTopicKey() {
    var activePage = document.querySelector(".page.active[data-topic]");
    return activePage ? activePage.getAttribute("data-topic") : null;
  }

  function currentTopicLabel() {
    var activePage = document.querySelector(".page.active");
    if (!activePage) return "";
    var titleEl = activePage.querySelector(".ruletitle");
    return titleEl ? titleEl.textContent.trim() : "";
  }

  function render(key) {
    if (!refs) return;
    key = key || currentTopicKey();
    var data = (window.VIDEO_RECOMMENDATIONS && window.VIDEO_RECOMMENDATIONS[key]) || [];
    refs.sub.textContent = currentTopicLabel() || "Pick a rule to see recommendations";
    if (!data.length) {
      refs.list.innerHTML = '<div class="vs-empty">No video recommendations yet for this rule.</div>';
      return;
    }
    refs.list.innerHTML = data.map(renderCard).join("");
  }
  window.__videoSidebarRender = render;

  function watchTopicChanges() {
    var pagesWrap = document.querySelector(".pages") || document.body;
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === "class") { render(); return; }
      }
    });
    observer.observe(pagesWrap, { attributes: true, attributeFilter: ["class"], subtree: true });
  }

  function init() {
    injectCss();
    refs = buildPanel();
    render();
    watchTopicChanges();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
