const REPO = "ChaviAlmeida/NOBORU-parsers";
const TOKEN = process.env.GITHUB_TOKEN;
const API = `https://api.github.com/repos/${REPO}/contents/parsers`;

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
  "[ES]TumangaOnline.lua",
  "[EN]VLComic.lua",
  "[RAW]LoveHug.lua",
];

async function getFileSha(filename) {
  const encoded = encodeURIComponent(filename);
  const res = await fetch(`${API}/${encoded}`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha;
}

async function deleteFile(filename, sha) {
  const encoded = encodeURIComponent(filename);
  const res = await fetch(`${API}/${encoded}`, {
    method: "DELETE",
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Remove dead parser: ${filename}`,
      sha: sha,
    }),
  });
  return res.ok;
}

async function main() {
  console.log(`=== Deleting ${DEAD_PARSERS.length} dead parsers from ${REPO} ===\n`);
  let deleted = 0;
  let skipped = 0;

  for (const name of DEAD_PARSERS) {
    process.stdout.write(`  ${name}: `);
    const sha = await getFileSha(name);
    if (!sha) {
      console.log("NOT FOUND (already deleted or never existed)");
      skipped++;
      continue;
    }
    const ok = await deleteFile(name, sha);
    if (ok) {
      console.log("DELETED");
      deleted++;
    } else {
      console.log("FAILED");
    }
  }

  console.log(`\nResults: ${deleted} deleted, ${skipped} skipped`);
  console.log(`Check: https://github.com/${REPO}/tree/master/parsers`);
}

main().catch(console.error);
