import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mode = process.argv[2] ?? "--source";

function normalizeNewlines(value) {
  return value.replace(/\r\n/g, "\n");
}

async function readText(relativePath) {
  return normalizeNewlines(await readFile(path.join(root, relativePath), "utf8"));
}

function assertNoPrivateCredentials(label, text) {
  const forbidden = [
    /github_pat_[A-Za-z0-9_]{20,}/,
    /gh[pousr]_[A-Za-z0-9]{20,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /["']private_key["']\s*:/
  ];
  for (const pattern of forbidden) {
    assert.equal(pattern.test(text), false, `${label} contains a private credential pattern`);
  }
}

async function validateSource() {
  const cards = await readText("index.html");
  const rules = await readText("rules.html");
  const syncSource = (await readText("zh-rules-sync.js")).trimEnd();

  assert.match(cards, /^<!DOCTYPE html>/i, "index.html must be a complete HTML document");
  assert.match(cards, /<title>中文 · 100 Sentences<\/title>/, "sentence-card title is missing");
  assert.match(cards, /firebase-firestore-compat\.js/, "sentence-card Firestore client is missing");
  assert.match(cards, /\.collection\(['"]sync['"]\)/, "sentence-card sync collection changed unexpectedly");

  assert.match(rules, /^<!DOCTYPE html>/i, "rules.html must be a complete HTML document");
  assert.match(rules, /<title>Chinese · Grammar Rules<\/title>/, "grammar-rules title is missing");
  assert.equal(
    (rules.match(/<button type="button" class="review-btn"/g) ?? []).length,
    15,
    "rules.html must contain 15 review buttons"
  );
  assert.deepEqual(
    [...rules.matchAll(/data-title="Rule (\d+)"/g)].map((match) => Number(match[1])),
    Array.from({ length: 15 }, (_, index) => index + 1),
    "grammar-rule pages must remain in the intended 1-15 teaching order"
  );
  assert.match(rules, /data-topic="r14"/, "complement-comparison rule is missing");
  assert.match(
    rules,
    /Rule 15 — Комплементы \(补语\): сравнение Правил 9–14/,
    "complement-comparison title changed unexpectedly"
  );
  assert.match(rules, /Главная сравнительная таблица/, "complement comparison table is missing");
  assert.match(rules, /firebase-firestore-compat\.js/, "grammar-rules Firestore client is missing");
  assert.match(rules, /window\.__zhAudioLoaded/, "grammar-rules shared audio module is missing");
  assert.match(rules, /speechSynthesis\.addEventListener\(['"]voiceschanged['"]/, "audio voice readiness handling is missing");
  assert.match(rules, /new MutationObserver\(/, "audio support for dynamically injected content is missing");
  assert.match(rules, /data-zh-speak/, "audio unit markers are missing");
  assert.doesNotMatch(rules, /setAttribute\(['"]data-zh-audio['"]/, "stale audio processed flag can block rescanning injected content");
  assert.match(rules, /shiftKey/, "slow Shift-click audio mode is missing");
  assert.match(rules, /zh-CN/, "Mandarin voice selection is missing");
  assert.match(syncSource, /var COLLECTION\s*=\s*['"]rules_sync['"]/, "grammar-rules sync collection changed unexpectedly");

  const blocks = [...rules.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)]
    .map((match) => match[1])
    .filter((block) => block.includes("__rulesSyncLoaded"));
  assert.equal(blocks.length, 1, "rules.html must contain exactly one inlined sync module");
  assert.equal(blocks[0].replaceAll("<\\/script>", "</script>"), syncSource, "inlined rules sync is stale");

  assertNoPrivateCredentials("index.html", cards);
  assertNoPrivateCredentials("rules.html", rules);
  assertNoPrivateCredentials("zh-rules-sync.js", syncSource);
  console.log("Source validation passed for both apps.");
}

async function validatePublic() {
  const files = (await readdir(path.join(root, "public"))).sort();
  assert.deepEqual(files, ["index.html", "release.json", "rules.html"], "public/ contains an unexpected file");

  const [sourceCards, publicCards, sourceRules, publicRules] = await Promise.all([
    readFile(path.join(root, "index.html")),
    readFile(path.join(root, "public", "index.html")),
    readFile(path.join(root, "rules.html")),
    readFile(path.join(root, "public", "rules.html"))
  ]);
  assert.deepEqual(publicCards, sourceCards, "public/index.html differs from index.html");
  assert.deepEqual(publicRules, sourceRules, "public/rules.html differs from rules.html");

  const release = JSON.parse(await readText("public/release.json"));
  assert.deepEqual(release.routes, { "/": "index.html", "/rules.html": "rules.html" });
  assert.match(release.commit, /^(?:[0-9a-f]{7,40}|unknown)$/i, "release commit is invalid");
  assert.equal(Object.keys(release.sha256).length, 2, "release hashes are incomplete");
  console.log("Firebase public artifact validation passed.");
}

if (mode === "--source") {
  await validateSource();
} else if (mode === "--public") {
  await validatePublic();
} else {
  throw new Error(`Unknown validation mode: ${mode}`);
}
