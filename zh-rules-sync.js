/*
  Cross-device "reviewed" tracking for Grammar Rules.html, via Firebase Firestore.

  Mirrors the sync pattern already used in 6_Cards_Sentences/Chinese_Cards_2.html:
    - Same Firebase project (chinese-flashcards-6e922).
    - Same sync-code storage key ('zh100_synccode_v1') on purpose, so entering the
      same code in either app shares one identity — no need to remember two codes.
    - A SEPARATE Firestore collection ('rules_sync' instead of 'sync') so this
      app's field names never collide with the sentence app's doc shape.
    - Same shape: onSnapshot listener applies remote state and re-renders,
      guarded by `applyingRemote` so that doesn't immediately re-trigger a push.

  Requires (loaded before this file, same order as Chinese_Cards_2.html):
    <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>

  Markup contract:
    - Header: <span id="reviewBadge"></span> + <button id="rulesSyncBtn"></button>
    - Per rule: <button class="review-btn" data-rule="r1" onclick="toggleReviewed('r1')">
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

  if (typeof firebase === "undefined") {
    console.warn("Firebase SDK not loaded — cloud sync disabled for Grammar Rules.");
    return;
  }
  firebase.initializeApp(firebaseConfig);
  var db = firebase.firestore();

  function load(k, d) {
    try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  // Same key as Chinese_Cards_2.html on purpose — one sync code, shared identity.
  var syncCode = load('zh100_synccode_v1', null);
  var syncDocRef = null, unsubscribeSync = null, applyingRemote = false;
  var reviewed = new Set(load('rules_reviewed_v1', []));

  var badgeEl, syncBtn;

  function totalRules() {
    return document.querySelectorAll(".review-btn").length;
  }

  function render() {
    document.querySelectorAll(".review-btn").forEach(function (btn) {
      var id = btn.getAttribute("data-rule");
      var done = reviewed.has(id);
      btn.classList.toggle("done", done);
      btn.textContent = done ? "✅ Reviewed" : "☐ Mark as Reviewed";
    });
    if (badgeEl) badgeEl.textContent = reviewed.size + " / " + totalRules() + " reviewed";
  }

  window.toggleReviewed = function (id) {
    if (reviewed.has(id)) reviewed.delete(id);
    else reviewed.add(id);
    save('rules_reviewed_v1', [...reviewed]);
    render();
    pushSync();
  };

  function applyRemoteData(data) {
    applyingRemote = true;
    if (Array.isArray(data.reviewed)) {
      reviewed = new Set(data.reviewed);
      save('rules_reviewed_v1', [...reviewed]);
    }
    render();
    applyingRemote = false;
  }

  function connectSync() {
    if (unsubscribeSync) { unsubscribeSync(); unsubscribeSync = null; }
    if (!syncCode) { syncDocRef = null; return; }
    syncDocRef = db.collection('rules_sync').doc(syncCode);
    unsubscribeSync = syncDocRef.onSnapshot(function (doc) {
      if (doc.exists) applyRemoteData(doc.data());
      else pushSync(); // first device with this code: seed the cloud with local state
    }, function (err) { console.warn('Cloud sync error:', err); });
  }

  function pushSync() {
    if (!syncDocRef || applyingRemote) return;
    syncDocRef.set({
      reviewed: [...reviewed],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(function (err) { console.warn('Cloud sync push failed:', err); });
  }

  function updateSyncBtn() {
    if (!syncBtn) return;
    syncBtn.textContent = syncCode ? '🔗 Cloud Sync: On' : '🔗 Cloud Sync: Off';
    syncBtn.classList.toggle('on', !!syncCode);
  }

  function setupSyncCode() {
    var entered = prompt(
      syncCode
        ? 'Cloud Sync is ON (code: "' + syncCode + '").\n\nEnter a different code to switch, or clear the box and press OK to turn sync off.\n\nTip: this is the same code as your 100-sentences app — enter the same one there to link both.'
        : 'Enter a sync code (use the exact same code on every device — and the same one as your 100-sentences app, if you want a single shared code):',
      syncCode || ''
    );
    if (entered === null) return; // cancelled
    var trimmed = entered.trim();
    if (!trimmed) {
      syncCode = null; save('zh100_synccode_v1', null);
      if (unsubscribeSync) { unsubscribeSync(); unsubscribeSync = null; }
      syncDocRef = null;
      updateSyncBtn();
      return;
    }
    if (trimmed.length < 6) { alert('Please use a sync code of at least 6 characters.'); return; }
    syncCode = trimmed; save('zh100_synccode_v1', syncCode);
    connectSync();
    updateSyncBtn();
  }

  function init() {
    badgeEl = document.getElementById('reviewBadge');
    syncBtn = document.getElementById('rulesSyncBtn');
    render();
    updateSyncBtn();
    if (syncBtn) syncBtn.addEventListener('click', setupSyncCode);
    if (syncCode) connectSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
