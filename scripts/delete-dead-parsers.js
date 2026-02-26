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

async function main() {
  console.log("=== Fetching current file list from fork ===\n");

  const listRes = await fetch(API, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!listRes.ok) {
    console.log("ERROR: Could not fetch file list:", listRes.status, await listRes.text());
    return;
  }

  const files = await listRes.json();
  console.log(`Found ${files.length} files in parsers/\n`);

  // Debug: list all file names so we can see what the API returns
  for (const f of files) {
    console.log(`  -> "${f.name}"`);
  }
  console.log("");

  const fileMap = {};
  for (const f of files) {
    fileMap[f.name] = { sha: f.sha, selfUrl: f.url };
  }

  let deleted = 0;
  let skipped = 0;

  for (const name of DEAD_PARSERS) {
    process.stdout.write(`  ${name}: `);

    if (!fileMap[name]) {
      console.log("NOT FOUND (already deleted)");
      skipped++;
      continue;
    }

    const selfUrl = fileMap[name].selfUrl.split("?")[0];
    const sha = fileMap[name].sha;
    console.log(`    URL: ${selfUrl}`);
    console.log(`    SHA: ${sha}`);

    const delRes = await fetch(selfUrl, {
      method: "DELETE",
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Remove dead parser: ${name}`,
        sha: sha,
      }),
    });

    if (delRes.ok) {
      console.log("DELETED");
      deleted++;
    } else {
      const errText = await delRes.text();
      console.log(`FAILED (${delRes.status}): ${errText.substring(0, 200)}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nResults: ${deleted} deleted, ${skipped} skipped`);
  console.log(`Check: https://github.com/${REPO}/tree/master/parsers`);
}

main().catch(console.error);
