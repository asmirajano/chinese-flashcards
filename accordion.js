/*
  Reusable Accordion Component — shared across all Chinese grammar lesson pages.
  Include on any lesson page with:
    <script src="accordion.js" defer></script>
  Pair with accordion.css (same folder) for styling.

  Markup contract per section:
    <section class="acc" id="r1-quick-reference" data-group="intro|learning" data-default-open="true|false">
      <button class="acc-header" id="r1-quick-reference-header" aria-expanded="false" aria-controls="r1-quick-reference-body">
        <span class="acc-chevron" aria-hidden="true">▶</span>
        <span class="acc-icon">🔗</span>
        <span class="acc-title">Quick Reference</span>
        <span class="acc-count">(3)</span>
      </button>
      <div class="acc-body-wrap">
        <div class="acc-body" id="r1-quick-reference-body" role="region" aria-labelledby="r1-quick-reference-header">
          ...content...
        </div>
      </div>
    </section>

  Bulk controls — any element with these classes toggles every .acc section within the
  closest ancestor that has class "page" (falls back to the whole document if none):
    .acc-expand-all       .acc-collapse-all
    .acc-expand-learning  .acc-collapse-learning   (only sections with data-group="learning")

  Hash navigation — an id like "#r3-quick-reference" will, on load or hashchange:
    1) ask window.__grammarGoTo(ruleIndex) to switch to that rule's page, if defined
    2) force the target section open
    3) smoothly scroll it into view
    4) briefly highlight it (.acc-flash)

  State persistence — expand/collapse state is remembered per section id in
  localStorage (survives reloads). Sections not yet seen fall back to their
  data-default-open attribute.
*/
(function () {
  if (window.__accordionLoaded) return;
  window.__accordionLoaded = true;

  var STORAGE_KEY = 'chineseGrammarAccordionState';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* localStorage unavailable — state just won't persist across reloads */ }
  }

  var state = loadState();

  function setOpen(section, open, persist) {
    var body = section.querySelector('.acc-body');
    var header = section.querySelector('.acc-header');
    section.classList.toggle('acc-open', open);
    if (header) header.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (body) {
      body.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) body.removeAttribute('inert');
      else body.setAttribute('inert', '');
    }
    if (persist !== false) {
      state[section.id] = open;
      saveState(state);
    }
  }

  function initSection(section) {
    var header = section.querySelector('.acc-header');
    if (!header) return;
    var stored = state.hasOwnProperty(section.id) ? state[section.id] : (section.dataset.defaultOpen === 'true');
    setOpen(section, stored, false);
    header.addEventListener('click', function () {
      setOpen(section, !section.classList.contains('acc-open'));
    });
  }

  function sectionsIn(scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll('.acc'));
  }

  function scopeFor(el) {
    return (el.closest && el.closest('.page')) || document;
  }

  function goToHash() {
    var id = decodeURIComponent(location.hash || '').replace('#', '');
    if (!id) return;
    var section = document.getElementById(id);
    if (!section || !section.classList.contains('acc')) return;

    var m = id.match(/^r(\d+)-/);
    if (m && typeof window.__grammarGoTo === 'function') {
      window.__grammarGoTo(parseInt(m[1], 10) - 1);
    }

    setOpen(section, true);

    setTimeout(function () {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      section.classList.add('acc-flash');
      setTimeout(function () { section.classList.remove('acc-flash'); }, 1600);
    }, 60);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    sectionsIn().forEach(initSection);

    document.addEventListener('click', function (e) {
      var t = e.target;
      var trigger = t.closest && (
        t.closest('.acc-expand-all') || t.closest('.acc-collapse-all') ||
        t.closest('.acc-expand-learning') || t.closest('.acc-collapse-learning')
      );
      if (!trigger) return;

      var scope = scopeFor(trigger);
      var open = trigger.classList.contains('acc-expand-all') || trigger.classList.contains('acc-expand-learning');
      var learningOnly = trigger.classList.contains('acc-expand-learning') || trigger.classList.contains('acc-collapse-learning');

      sectionsIn(scope)
        .filter(function (s) { return !learningOnly || s.dataset.group === 'learning'; })
        .forEach(function (s) { setOpen(s, open); });
    });

    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('acc-header')) {
        e.preventDefault();
        e.target.click();
      }
    });

    goToHash();
    window.addEventListener('hashchange', goToHash);
  });
})();
