import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const publicDir = path.join(root, "public");
const sources = [
  { source: "index.html", target: "index.html", route: "/" },
  { source: "rules.html", target: "rules.html", route: "/rules.html" }
];

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

const hashes = {};
for (const entry of sources) {
  const sourcePath = path.join(root, entry.source);
  const targetPath = path.join(publicDir, entry.target);
  const bytes = await readFile(sourcePath);
  await copyFile(sourcePath, targetPath);
  hashes[entry.route] = createHash("sha256").update(bytes).digest("hex");
}

let commit = process.env.GITHUB_SHA;
if (!commit) {
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8"
    }).trim();
  } catch {
    commit = "unknown";
  }
}

const release = {
  commit,
  builtAt: new Date().toISOString(),
  routes: {
    "/": "index.html",
    "/rules.html": "rules.html"
  },
  sha256: hashes
};

await writeFile(
  path.join(publicDir, "release.json"),
  `${JSON.stringify(release, null, 2)}\n`,
  "utf8"
);

console.log(`Built ${sources.length} apps in public/ for commit ${commit.slice(0, 12)}.`);
