/**
 * Script to sync parsers to ChaviAlmeida/NOBORU-parsers fork
 * - Uploads 3 new parsers
 * - Deletes dead/broken parsers
 *
 * Requires GITHUB_TOKEN environment variable with repo scope
 */

const OWNER = "ChaviAlmeida";
const REPO = "NOBORU-parsers";
const BRANCH = "master";
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/parsers`;

const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("ERROR: Set GITHUB_TOKEN environment variable first.");
  console.error("Create one at: https://github.com/settings/tokens/new");
  console.error("Scope needed: repo (Full control of private repositories)");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "NOBORU-Parser-Sync",
};

// --- Files to DELETE (dead sites) ---
const DEAD_PARSERS = [
  "[DF]MangaDex.lua",
  "[DF]MangaDex2.lua",
  "[EN]MangaOwl.lua",
  "[EN]Mangafast.lua",
  "[EN]HentaiCafe.lua",
  "[EN]HentaiCafeV2.lua",
  "[EN][IT]PervMangaEden.lua",
  "[ES]HeavenManga.lua",
  "[ES]Submanga.lua",
  "[EN]VLComic.lua",
  "[RAW]LoveHug.lua",
  "[RAW]RawDevArt.lua",
];

// --- Files to UPLOAD (new parsers) ---
const NEW_PARSERS = [
  {
    name: "[DF]MangaDex3.lua",
    localPath: "./parsers/[DF]MangaDex3.lua",
  },
  {
    name: "[EN]MangaPill.lua",
    localPath: "./parsers/[EN]MangaPill.lua",
  },
  {
    name: "[EN]MangaSee2.lua",
    localPath: "./parsers/[EN]MangaSee2.lua",
  },
];

async function getFileSha(filename) {
  const encodedName = encodeURIComponent(filename);
  const res = await fetch(`${API}/${encodedName}?ref=${BRANCH}`, { headers });
  if (res.ok) {
    const data = await res.json();
    return data.sha;
  }
  return null;
}

async function deleteFile(filename) {
  const sha = await getFileSha(filename);
  if (!sha) {
    console.log(`  SKIP (not found): ${filename}`);
    return;
  }
  const encodedName = encodeURIComponent(filename);
  const res = await fetch(`${API}/${encodedName}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({
      message: `Remove dead parser: ${filename}`,
      sha,
      branch: BRANCH,
    }),
  });
  if (res.ok) {
    console.log(`  DELETED: ${filename}`);
  } else {
    const err = await res.text();
    console.error(`  ERROR deleting ${filename}: ${res.status} ${err}`);
  }
}

async function uploadFile(filename, localPath) {
  const fs = await import("fs");
  const content = fs.readFileSync(localPath, "utf-8");
  const base64Content = Buffer.from(content).toString("base64");

  const sha = await getFileSha(filename);
  const encodedName = encodeURIComponent(filename);

  const body = {
    message: sha
      ? `Update parser: ${filename}`
      : `Add new parser: ${filename}`,
    content: base64Content,
    branch: BRANCH,
  };
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(`${API}/${encodedName}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (res.ok) {
    console.log(`  UPLOADED: ${filename}`);
  } else {
    const err = await res.text();
    console.error(`  ERROR uploading ${filename}: ${res.status} ${err}`);
  }
}

async function main() {
  console.log("=== NOBORU Parsers Fork Sync ===\n");

  console.log("Step 1: Deleting dead parsers...");
  for (const name of DEAD_PARSERS) {
    await deleteFile(name);
  }

  console.log("\nStep 2: Uploading new parsers...");
  for (const parser of NEW_PARSERS) {
    await uploadFile(parser.name, parser.localPath);
  }

  console.log("\nDone! Your fork is now updated.");
  console.log(
    `Check: https://github.com/${OWNER}/${REPO}/tree/${BRANCH}/parsers`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
