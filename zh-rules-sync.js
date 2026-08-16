/*
  Cross-device learning-progress sync for the Grammar Rules app, via Firebase Firestore.

  This file is the SOURCE OF TRUTH. rules.html inlines a verbatim copy of the
  IIFE below (between its last two <script> tags). If you edit this file, re-inline
  it into rules.html — tools/inline-sync.py in this folder does that automatically.

  Requires (loaded before this file):
    <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>

  Markup contract:
    - Header: <span id="reviewBadge"></span>
              <span id="rulesSyncStatus"></span>
              <button id="rulesSyncBtn"></button>
    - Per rule:  <button class="review-btn" data-rule="r1" onclick="toggleReviewed('r1')">
    - Optional:  <input type="checkbox" data-sync-id="someUniqueId">  (auto-detected, no wiring needed)

  What is synced (persistent learning progress only):
    reviewed   : string[]  — ids of rules marked as reviewed
    checkboxes : map       — { syncId: true } for any checked [data-sync-id] checkbox
    updatedAt  : server timestamp
  What is deliberately NOT synced: accordion open/closed state, scroll position,
  current page, hover/focus — those stay in localStorage only (key
  'chineseGrammarAccordionState') because they are transient UI state.

  Loop protection (three independent guards, see pushSync/handleSnapshot):
    1. Snapshots carrying our own un-acked write (metadata.hasPendingWrites) are ignored.
    2. `applyingRemote` is set while remote data is written into local state, and
       scheduleSync() refuses to run while it is set — a remote update never
       triggers a write back.
    3. `lastSyncedJSON` holds the exact payload last seen on/sent to the server;
       a write is skipped entirely when the current state serialises identically.

  SECURITY NOTE: the sync code is a shared secret, NOT authentication. Anyone who
  learns or guesses a code can read and overwrite that code's progress. Newly
  generated codes are 24 random characters (~120 bits), which is not practically
  guessable, but the model itself provides no per-user identity. If real account
  protection is ever needed, move to Firebase Authentication and key documents by uid.
*/
(function () {
  if (window.__rulesSyncLoaded) return;
  window.__rulesSyncLoaded = true;

  var firebaseConfig = {
    apiKey: "AIzaSyAs5erZk85FoC2WT17WWM5iPKoYhF2s1f4",
    authDomain: "chinese-flashcards-6e922.firebaseapp.com",
    projectId: "chinese-flashcards-6e922",
    storageBucket: "chinese-flashcards-6e922.firebasestorage.app",
    messagingSenderId: "110784026042",
    appId: "1:110784026042:web:6b46320c6e36aaf233f983"
  };

  var COLLECTION    = 'rules_sync';
  var CODE_KEY      = 'zh100_synccode_v1';   // shared with the 100-sentences app on purpose
  var REVIEWED_KEY  = 'rules_reviewed_v1';   // pre-existing local key — kept for backward compat
  var CHECKBOX_KEY  = 'rules_checkboxes_v1';
  var DEBOUNCE_MS   = 700;                   // one write per burst of clicks
  var LEGACY_MIN    = 6;                     // codes already in the wild stay valid
  var GENERATED_LEN = 24;

  // ---------- local storage helpers ----------
  function load(k, d) {
    try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  // ---------- state ----------
  var reviewed   = new Set(load(REVIEWED_KEY, []));
  var checkboxes = load(CHECKBOX_KEY, {}) || {};
  var syncCode   = load(CODE_KEY, null);

  var db = null, syncDocRef = null, unsubscribeSync = null;
  var applyingRemote = false;      // guard 2
  var lastSyncedJSON = null;       // guard 3
  var pushTimer = null;
  var firstSnapshot = true;        // controls the one-time union merge
  var badgeEl, syncBtn, statusEl;

  // ---------- payload ----------
  // Deterministic serialisation so "did anything actually change?" is a string compare.
  function currentPayload() {
    var ids = [];
    Object.keys(checkboxes).forEach(function (k) { if (checkboxes[k]) ids.push(k); });
    ids.sort();
    var cb = {};
    ids.forEach(function (k) { cb[k] = true; });
    return { reviewed: Array.from(reviewed).sort(), checkboxes: cb };
  }
  function payloadJSON(p) {
    return JSON.stringify([p.reviewed, Object.keys(p.checkboxes).sort()]);
  }

  // ---------- status ----------
  // 'off' | 'on' | 'saving' | 'error'
  function setStatus(kind, detail) {
    if (!statusEl) return;
    var text = { off: '', on: '✓ Synced', saving: '… Saving', error: '⚠ Sync error' }[kind] || '';
    statusEl.textContent = text;
    statusEl.className = 'sync-status ' + kind;
    statusEl.title = detail || '';
    statusEl.style.display = text ? '' : 'none';
  }

  // ---------- rendering ----------
  function totalRules() { return document.querySelectorAll('.review-btn').length; }

  function render() {
    document.querySelectorAll('.review-btn').forEach(function (btn) {
      var id = btn.getAttribute('data-rule');
      var done = reviewed.has(id);
      btn.classList.toggle('done', done);
      btn.textContent = done ? '✅ Reviewed' : '☐ Mark as Reviewed';
    });
    document.querySelectorAll('input[type="checkbox"][data-sync-id]').forEach(function (box) {
      box.checked = !!checkboxes[box.getAttribute('data-sync-id')];
    });
    if (badgeEl) badgeEl.textContent = reviewed.size + ' / ' + totalRules() + ' reviewed';
  }

  function persistLocal() {
    save(REVIEWED_KEY, Array.from(reviewed));
    save(CHECKBOX_KEY, checkboxes);
  }

  // ---------- local mutations ----------
  window.toggleReviewed = function (id) {
    if (reviewed.has(id)) reviewed.delete(id); else reviewed.add(id);
    persistLocal();
    render();
    scheduleSync();
  };

  function onCheckboxChange(e) {
    var box = e.target;
    if (!box || !box.matches || !box.matches('input[type="checkbox"][data-sync-id]')) return;
    var id = box.getAttribute('data-sync-id');
    if (box.checked) checkboxes[id] = true; else delete checkboxes[id];
    persistLocal();
    scheduleSync();
  }

  // ---------- writing ----------
  function scheduleSync() {
    // Guard 2: never write while we are applying data that came FROM the server.
    if (applyingRemote || !syncDocRef) return;
    // Guard 3: skip entirely when nothing actually changed.
    if (payloadJSON(currentPayload()) === lastSyncedJSON) return;
    setStatus('saving');
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushSync, DEBOUNCE_MS);
  }

  function pushSync() {
    pushTimer = null;
    if (!syncDocRef || applyingRemote) return;
    var payload = currentPayload();
    var json = payloadJSON(payload);
    if (json === lastSyncedJSON) { setStatus('on'); return; }
    syncDocRef.set({
      reviewed: payload.reviewed,
      checkboxes: payload.checkboxes,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function () {
      lastSyncedJSON = json;
      setStatus('on');
    }).catch(function (err) {
      setStatus('error', String(err && err.message || err));
      console.warn('[rules-sync] write failed:', err && err.code, err && err.message);
    });
  }

  // ---------- reading ----------
  function handleSnapshot(doc) {
    // Guard 1: this snapshot is the local echo of our own not-yet-acknowledged
    // write. Applying it would be a no-op at best and a flicker at worst.
    if (doc.metadata && doc.metadata.hasPendingWrites) return;

    if (!doc.exists) {
      // First device on this code — seed the cloud from whatever is local.
      firstSnapshot = false;
      lastSyncedJSON = null;
      pushSync();
      return;
    }

    var data = doc.data() || {};
    var remoteReviewed = Array.isArray(data.reviewed) ? data.reviewed : [];
    var remoteBoxes = (data.checkboxes && typeof data.checkboxes === 'object') ? data.checkboxes : {};

    applyingRemote = true;
    if (firstSnapshot) {
      // Reconnection case: union local and remote once, so progress made while
      // offline (or before this device was linked) is never silently discarded.
      remoteReviewed.forEach(function (id) { reviewed.add(id); });
      Object.keys(remoteBoxes).forEach(function (k) { if (remoteBoxes[k]) checkboxes[k] = true; });
      firstSnapshot = false;
    } else {
      // Steady state: the server is authoritative, so un-marking on one device
      // propagates as an un-mark everywhere instead of being resurrected.
      reviewed = new Set(remoteReviewed);
      checkboxes = {};
      Object.keys(remoteBoxes).forEach(function (k) { if (remoteBoxes[k]) checkboxes[k] = true; });
    }
    persistLocal();
    render();
    // Record what the server currently holds, so the code below can tell whether
    // the union actually added anything worth pushing back. Built through the
    // same normalisation as currentPayload() so the comparison is apples-to-apples.
    var serverBoxes = {};
    Object.keys(remoteBoxes).forEach(function (k) { if (remoteBoxes[k]) serverBoxes[k] = true; });
    lastSyncedJSON = payloadJSON({
      reviewed: remoteReviewed.slice().sort(),
      checkboxes: serverBoxes
    });
    applyingRemote = false;

    // Only after the flag is cleared, and only if the merge genuinely produced
    // something the server does not have yet, do we write once.
    if (payloadJSON(currentPayload()) !== lastSyncedJSON) pushSync();
    else setStatus('on');
  }

  function connectSync() {
    if (unsubscribeSync) { unsubscribeSync(); unsubscribeSync = null; }  // no duplicate listeners
    if (!syncCode || !db) { syncDocRef = null; setStatus('off'); return; }
    firstSnapshot = true;
    lastSyncedJSON = null;
    syncDocRef = db.collection(COLLECTION).doc(syncCode);
    setStatus('saving');
    unsubscribeSync = syncDocRef.onSnapshot(handleSnapshot, function (err) {
      setStatus('error', String(err && err.message || err));
      console.warn('[rules-sync] listener failed:', err && err.code, err && err.message);
    });
  }

  // ---------- sync code ----------
  function generateCode() {
    var alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'; // no l/o/0/1 — easier to retype
    var out = '';
    var buf = new Uint8Array(GENERATED_LEN);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(buf);
    else for (var j = 0; j < GENERATED_LEN; j++) buf[j] = Math.floor(Math.random() * 256);
    for (var i = 0; i < GENERATED_LEN; i++) {
      if (i > 0 && i % 6 === 0) out += '-';
      out += alphabet[buf[i] % alphabet.length];
    }
    return out; // e.g. "k7bqxz-m4tdpr-9swhne-c2gjfy"
  }

  function updateSyncBtn() {
    if (!syncBtn) return;
    syncBtn.textContent = syncCode ? '🔗 Cloud Sync: On' : '🔗 Cloud Sync: Off';
    syncBtn.classList.toggle('on', !!syncCode);
  }

  function setupSyncCode() {
    var suggestion = syncCode || generateCode();
    var entered = prompt(
      syncCode
        ? 'Cloud Sync is ON.\n\nYour code:\n' + syncCode +
          '\n\nCopy it and paste the SAME code on your other devices.\n' +
          'Paste a different code to switch, or clear the box and press OK to turn sync off.'
        : 'A new private sync code has been generated for you:\n\n' + suggestion +
          '\n\nPress OK to use it, then paste this exact code on your other devices.\n' +
          '(Already have a code from another device? Paste it here instead.)\n\n' +
          'Anyone who has this code can see and change your progress — keep it to yourself.',
      suggestion
    );
    if (entered === null) return; // cancelled

    var trimmed = entered.trim();
    if (!trimmed) {                               // explicit opt-out
      syncCode = null; save(CODE_KEY, null);
      if (unsubscribeSync) { unsubscribeSync(); unsubscribeSync = null; }
      syncDocRef = null;
      updateSyncBtn();
      setStatus('off');
      return;
    }
    if (trimmed.length < LEGACY_MIN) {            // legacy codes stay valid, junk does not
      alert('Please use a sync code of at least ' + LEGACY_MIN + ' characters.');
      return;
    }
    syncCode = trimmed;
    save(CODE_KEY, syncCode);
    connectSync();
    updateSyncBtn();
  }

  // ---------- init ----------
  function init() {
    badgeEl  = document.getElementById('reviewBadge');
    syncBtn  = document.getElementById('rulesSyncBtn');
    statusEl = document.getElementById('rulesSyncStatus');

    render();
    updateSyncBtn();
    setStatus('off');

    if (syncBtn) syncBtn.addEventListener('click', setupSyncCode);
    document.addEventListener('change', onCheckboxChange);

    if (typeof firebase === 'undefined') {
      // Offline / CDN blocked: the app still works, backed by localStorage only.
      console.warn('[rules-sync] Firebase SDK unavailable — running local-only.');
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
    } catch (e) {
      console.warn('[rules-sync] Firebase init failed:', e && e.message);
      return;
    }
    if (syncCode) connectSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
