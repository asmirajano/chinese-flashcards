/*
  Shared Grammar Terminology panel.
  Include on any grammar-rule page with:
    <script src="grammar-glossary.js" defer></script>
  (glossary.js must sit in the same folder as the page, or adjust the src path.)

  Two separate, logically-ordered lists:
    - POS_TERMS      → Parts of Speech (Части речи) — what a word IS.
    - SENTENCE_TERMS  → Parts of a Sentence (Члены предложения) — what a word DOES.
  To add a term later: push a new { en, ru, example } object into whichever list it
  belongs to, keeping each list ordered from most foundational to most supplementary.
  New recurring grammar terms introduced by future lessons should be added here so every
  page — past and future — picks them up automatically the next time it's opened.
*/
(function () {
  if (window.__grammarGlossaryLoaded) return; // avoid double-init if included twice
  window.__grammarGlossaryLoaded = true;

  // List 1 — Parts of Speech (Части речи): what a word IS, on its own.
  // Sorted from most foundational (core content words every sentence needs)
  // to most supplementary (function words, then the English-only footnote).
  var POS_TERMS = [
    { en: "Noun", ru: "существительное", example: "дом, студент, яблоко" },
    { en: "Verb", ru: "глагол", example: "идти, жить, говорить" },
    { en: "Adjective", ru: "прилагательное", example: "большой, красивый, новый" },
    { en: "Pronoun", ru: "местоимение", example: "я, он, они" },
    { en: "Numeral", ru: "числительное", example: "один, второй, сто" },
    { en: "Adverb", ru: "наречие", example: "быстро, здесь, сегодня" },
    { en: "Preposition", ru: "предлог", example: "в, на, с" },
    { en: "Conjunction", ru: "союз", example: "и, а, но, потому что" },
    { en: "Particle", ru: "частица", example: "же, ли, бы" },
    { en: "Negation", ru: "отрицание", example: "не, нет" },
    { en: "Interjection", ru: "междометие", example: "ой, ура, ах" },
    { en: "Article", ru: "артикль", example: "a, an, the — только в английском, в русском не используется" }
  ];

  // List 2 — Parts of a Sentence (Члены предложения): what a word DOES
  // in a specific sentence. Sorted from the two obligatory core roles,
  // through the object family, to the more specialized modifiers.
  var SENTENCE_TERMS = [
    { en: "Subject", ru: "подлежащее", example: "Я, студент, книга" },
    { en: "Predicate", ru: "сказуемое", example: "читаю, находится, учится" },
    { en: "Object", ru: "дополнение", example: "книгу, письмо, китайский язык" },
    { en: "Direct Object (DO)", ru: "прямое дополнение", example: "книгу, ручку, письмо" },
    { en: "Indirect Object (IO)", ru: "косвенное дополнение", example: "тебе, ему, учителю" },
    { en: "Adverbial of place", ru: "обстоятельство места", example: "там, здесь, дома" },
    { en: "Complement (补语)", ru: "дополнительный член (комплемент)", example: "得很好, 得很快" },
    { en: "Result Complement (结果补语)", ru: "результативный комплемент", example: "写完, 洗干净, 摔破" }
  ];

  var CSS = ""
    + ".gg-tab{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:9998;"
    + "background:linear-gradient(135deg,#e63946,#f4a259);color:#fff;border:none;"
    + "border-radius:0 12px 12px 0;padding:14px 8px;cursor:pointer;box-shadow:2px 0 12px rgba(0,0,0,.18);"
    + "font-family:\"Segoe UI\",-apple-system,\"Helvetica Neue\",Arial,sans-serif;font-weight:700;"
    + "font-size:.72rem;letter-spacing:.5px;writing-mode:vertical-rl;text-orientation:mixed;"
    + "transition:.18s;line-height:1.3;}"
    + ".gg-tab:hover{padding-left:12px;box-shadow:4px 0 16px rgba(0,0,0,.26);}"
    + ".gg-backdrop{position:fixed;inset:0;background:rgba(34,34,59,.35);z-index:9999;"
    + "opacity:0;pointer-events:none;transition:opacity .2s;}"
    + ".gg-backdrop.gg-open{opacity:1;pointer-events:auto;}"
    + ".gg-panel{position:fixed;left:0;top:0;height:100%;width:320px;max-width:86vw;"
    + "background:#fff7ef;z-index:10000;box-shadow:6px 0 30px rgba(0,0,0,.22);"
    + "transform:translateX(-100%);transition:transform .25s ease;display:flex;flex-direction:column;"
    + "font-family:\"Segoe UI\",-apple-system,\"Helvetica Neue\",Arial,sans-serif;color:#22223b;}"
    + ".gg-panel.gg-open{transform:translateX(0);}"
    + ".gg-head{background:linear-gradient(135deg,#e63946,#f4a259);color:#fff;padding:16px 18px;"
    + "display:flex;align-items:center;justify-content:space-between;flex:none;}"
    + ".gg-head h2{margin:0;font-size:1.05rem;font-weight:800;}"
    + ".gg-head .gg-sub{font-size:.72rem;opacity:.9;margin-top:2px;font-weight:400;}"
    + ".gg-close{background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.5);color:#fff;"
    + "border-radius:50%;width:28px;height:28px;font-size:1rem;cursor:pointer;line-height:1;flex:none;}"
    + ".gg-close:hover{background:rgba(255,255,255,.38);}"
    + ".gg-list{overflow-y:auto;padding:12px 14px 20px;flex:1;}"
    + ".gg-section-title{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.4px;"
    + "color:#e63946;margin:18px 0 4px;padding-bottom:6px;border-bottom:2px solid #f0e2d0;}"
    + ".gg-section-title:first-child{margin-top:2px;}"
    + ".gg-section-sub{font-size:.74rem;font-weight:400;text-transform:none;letter-spacing:0;color:#6c757d;"
    + "display:block;margin-top:2px;}"
    + ".gg-item{background:#fff;border:1px solid #f0e2d0;border-radius:12px;padding:10px 13px;"
    + "margin-bottom:9px;box-shadow:0 2px 6px rgba(0,0,0,.04);}"
    + ".gg-term{font-weight:700;font-size:.92rem;}"
    + ".gg-term .gg-en{color:#e63946;}"
    + ".gg-term .gg-dash{color:#6c757d;font-weight:400;margin:0 4px;}"
    + ".gg-term .gg-ru{color:#4361ee;}"
    + ".gg-example{margin-top:3px;font-size:.83rem;color:#6c757d;font-style:italic;}"
    + ".gg-foot{padding:10px 16px 14px;font-size:.72rem;color:#6c757d;text-align:center;flex:none;"
    + "border-top:1px solid #f0e2d0;}"
    + "@media(max-width:480px){.gg-tab{font-size:.66rem;padding:12px 6px;}}";

  function injectCss() {
    var style = document.createElement("style");
    style.id = "gg-style";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildPanel() {
    var backdrop = document.createElement("div");
    backdrop.className = "gg-backdrop";

    var panel = document.createElement("div");
    panel.className = "gg-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Grammar terminology glossary");

    var head = document.createElement("div");
    head.className = "gg-head";
    head.innerHTML =
      '<div><h2>📖 Grammar Terms</h2><div class="gg-sub">Термины грамматики — краткий словарь</div></div>' +
      '<button class="gg-close" aria-label="Close">✕</button>';

    var list = document.createElement("div");
    list.className = "gg-list";

    function renderSection(titleHtml, terms) {
      var title = document.createElement("div");
      title.className = "gg-section-title";
      title.innerHTML = titleHtml;
      list.appendChild(title);
      terms.forEach(function (t) {
        var item = document.createElement("div");
        item.className = "gg-item";
        item.innerHTML =
          '<div class="gg-term"><span class="gg-en">' + t.en + '</span>' +
          '<span class="gg-dash">—</span><span class="gg-ru">' + t.ru + '</span></div>' +
          '<div class="gg-example">' + t.example + '</div>';
        list.appendChild(item);
      });
    }

    renderSection(
      '1. Parts of Speech<span class="gg-section-sub">Части речи — what a word IS</span>',
      POS_TERMS
    );
    renderSection(
      '2. Parts of a Sentence<span class="gg-section-sub">Члены предложения — what a word DOES</span>',
      SENTENCE_TERMS
    );

    var foot = document.createElement("div");
    foot.className = "gg-foot";
    foot.textContent = "Shared glossary — grows as new terms appear in the lessons";

    panel.appendChild(head);
    panel.appendChild(list);
    panel.appendChild(foot);

    var tab = document.createElement("button");
    tab.className = "gg-tab";
    tab.textContent = "📖 Grammar Terms";
    tab.setAttribute("aria-label", "Open grammar terminology glossary");

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    document.body.appendChild(tab);

    function open() {
      panel.classList.add("gg-open");
      backdrop.classList.add("gg-open");
    }
    function close() {
      panel.classList.remove("gg-open");
      backdrop.classList.remove("gg-open");
    }

    tab.addEventListener("click", open);
    head.querySelector(".gg-close").addEventListener("click", close);
    backdrop.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  function init() {
    injectCss();
    buildPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
