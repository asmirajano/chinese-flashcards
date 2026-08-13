/*
  Chinese Hover Glossary — one reusable tooltip for every Chinese word/expression
  on the page.

  How it works (zero config for new content):
    - window.ZH_GLOSSARY (see zh-glossary-data.js) maps each known Chinese word
      or fixed expression to [pinyin, english].
    - On load, every text node in <body> is scanned left-to-right. At each
      position we try the LONGEST dictionary entry that matches starting
      there first (so a compound word like 图书馆 wins over matching 图 alone,
      while something merely adjacent-but-unrelated like 五辆 correctly falls
      back to matching 五 and 辆 as two separate, independently meaningful
      hovers). Matches get wrapped in <span class="zh-term">; everything else
      is left completely untouched.
    - A single tooltip element is reused for every term — hovering, focusing
      (Tab key), or tapping (touch) a term shows Chinese + pinyin + English
      right above/below it.
    - A MutationObserver re-runs the same scan on anything added later
      (accordion content that was always in the DOM needs no re-scan, but
      the Pattern Visualization popups and the two sidebars inject fresh
      HTML at runtime — this catches those automatically, with no changes
      needed anywhere else).

  To teach the glossary a new word for future rules, just add a line to
  window.ZH_GLOSSARY in zh-glossary-data.js — this file never needs to change.
*/
(function () {
  if (window.__zhGlossaryLoaded) return;
  window.__zhGlossaryLoaded = true;

  var DICT = window.ZH_GLOSSARY || {};
  var MAX_LEN = 0;
  for (var k in DICT) { if (k.length > MAX_LEN) MAX_LEN = k.length; }
  var CJK_TEST = /[一-鿿]/;

  var CSS = ""
    + ".zh-term{cursor:help; border-bottom:1px dotted rgba(108,117,125,.5); "
    + "-webkit-tap-highlight-color:transparent;}"
    + ".zh-term:focus-visible{outline:2px solid var(--red,#e63946); outline-offset:1px; border-radius:2px;}"
    + "#zh-tip-popover{position:fixed; z-index:99999; max-width:230px; "
    + "background:var(--card,#fff); color:var(--ink,#22223b); "
    + "border:1px solid var(--line,#f0e2d0); border-radius:10px; "
    + "box-shadow:0 8px 24px rgba(0,0,0,.18); padding:9px 12px; "
    + "font-family:\"Segoe UI\",-apple-system,\"Helvetica Neue\",Arial,sans-serif; "
    + "font-size:.86rem; line-height:1.35; pointer-events:none; "
    + "opacity:0; transform:translateY(2px); transition:opacity .12s ease, transform .12s ease;}"
    + "#zh-tip-popover.zh-tip-open{opacity:1; transform:translateY(0);}"
    + "#zh-tip-popover .zh-tip-cn{font-weight:800; font-size:1rem; margin-bottom:2px;}"
    + "#zh-tip-popover .zh-tip-py{color:var(--red,#e63946); font-style:italic; font-weight:600; margin-bottom:2px;}"
    + "#zh-tip-popover .zh-tip-en{color:var(--soft,#6c757d);}";

  function injectCss() {
    var style = document.createElement("style");
    style.id = "zh-tip-style";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ---- tooltip component (single, reused instance) ----
  var tip, tipCn, tipPy, tipEn, currentTarget = null, tipOpen = false;

  function buildTip() {
    tip = document.createElement("div");
    tip.id = "zh-tip-popover";
    tip.setAttribute("role", "tooltip");
    tipCn = document.createElement("div"); tipCn.className = "zh-tip-cn";
    tipPy = document.createElement("div"); tipPy.className = "zh-tip-py";
    tipEn = document.createElement("div"); tipEn.className = "zh-tip-en";
    tip.appendChild(tipCn); tip.appendChild(tipPy); tip.appendChild(tipEn);
    document.body.appendChild(tip);
  }

  function positionTip(target) {
    var r = target.getBoundingClientRect();
    tip.style.left = "0px";
    tip.style.top = "0px";
    tip.style.visibility = "hidden";
    tip.classList.add("zh-tip-open");
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.classList.remove("zh-tip-open");

    var left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));

    var top = r.top - th - 8;
    if (top < 8) top = r.bottom + 8; // not enough room above -> show below

    tip.style.left = left + "px";
    tip.style.top = top + "px";
    tip.style.visibility = "";
  }

  function showTip(target) {
    var word = target.getAttribute("data-zh");
    var entry = DICT[word];
    if (!entry) return;
    currentTarget = target;
    tipCn.textContent = word;
    tipPy.textContent = entry[0];
    tipEn.textContent = entry[1];
    positionTip(target);
    requestAnimationFrame(function () { tip.classList.add("zh-tip-open"); });
    tipOpen = true;
  }

  function hideTip() {
    if (!tipOpen) return;
    tip.classList.remove("zh-tip-open");
    tipOpen = false;
    currentTarget = null;
  }

  // ---- wrapping: scan text nodes, wrap dictionary matches ----
  function shouldSkip(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return true;
    return !!el.closest("script, style, textarea, #zh-tip-popover, .zh-term");
  }

  function findMatch(text, i) {
    var maxTry = Math.min(MAX_LEN, text.length - i);
    for (var len = maxTry; len >= 1; len--) {
      var sub = text.substr(i, len);
      if (Object.prototype.hasOwnProperty.call(DICT, sub)) return sub;
    }
    return null;
  }

  function wrapTextNode(node) {
    if (shouldSkip(node)) return;
    var text = node.nodeValue;
    if (!text || !CJK_TEST.test(text)) return;

    var frag = null, lastIndex = 0, i = 0, found = false;
    while (i < text.length) {
      if (CJK_TEST.test(text[i])) {
        var match = findMatch(text, i);
        if (match) {
          if (!frag) frag = document.createDocumentFragment();
          if (i > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, i)));
          var span = document.createElement("span");
          span.className = "zh-term";
          span.tabIndex = 0;
          span.setAttribute("data-zh", match);
          span.textContent = match;
          frag.appendChild(span);
          i += match.length;
          lastIndex = i;
          found = true;
          continue;
        }
      }
      i++;
    }
    if (found) {
      if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { wrapTextNode(root); return; }
    if (root.nodeType !== 1) return;
    if (root.closest && root.closest("script, style, textarea, #zh-tip-popover")) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return shouldSkip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    var n;
    while ((n = tw.nextNode())) nodes.push(n);
    for (var i = 0; i < nodes.length; i++) wrapTextNode(nodes[i]);
  }

  // ---- events: hover, keyboard focus, tap ----
  var isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;

  document.addEventListener("mouseover", function (e) {
    if (isTouch) return;
    var t = e.target.closest && e.target.closest(".zh-term");
    if (t) showTip(t);
  });
  document.addEventListener("mouseout", function (e) {
    if (isTouch) return;
    var t = e.target.closest && e.target.closest(".zh-term");
    if (t) hideTip();
  });
  document.addEventListener("focusin", function (e) {
    var t = e.target.closest && e.target.closest(".zh-term");
    if (t) showTip(t);
  });
  document.addEventListener("focusout", function (e) {
    var t = e.target.closest && e.target.closest(".zh-term");
    if (t) hideTip();
  });
  document.addEventListener("click", function (e) {
    if (!isTouch) return;
    var t = e.target.closest && e.target.closest(".zh-term");
    if (t) {
      e.preventDefault();
      if (tipOpen && currentTarget === t) hideTip();
      else showTip(t);
      return;
    }
    if (!(e.target.closest && e.target.closest("#zh-tip-popover"))) hideTip();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hideTip();
  });
  window.addEventListener("scroll", hideTip, true);
  window.addEventListener("resize", hideTip);

  // ---- watch for dynamically injected content (popups, sidebars) ----
  function observe() {
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.target && m.target.closest && m.target.closest("#zh-tip-popover")) continue;
        if (m.type === "childList") {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 1 && node.id === "zh-tip-popover") return;
            walk(node);
          });
        } else if (m.type === "characterData") {
          wrapTextNode(m.target);
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function init() {
    injectCss();
    buildTip();
    walk(document.body);
    observe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
