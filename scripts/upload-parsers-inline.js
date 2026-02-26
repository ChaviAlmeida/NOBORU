const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "ChaviAlmeida";
const REPO = "NOBORU-parsers";
const BRANCH = "master";
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/parsers`;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "NOBORU-Parser-Sync",
};

async function getFileSha(filename) {
  const encodedName = encodeURIComponent(filename);
  const res = await fetch(`${API}/${encodedName}?ref=${BRANCH}`, { headers });
  if (res.ok) {
    const data = await res.json();
    return data.sha;
  }
  return null;
}

async function uploadFile(filename, content) {
  console.log(`  Uploading: ${filename} (${content.length} bytes)`);
  const base64Content = Buffer.from(content).toString("base64");
  const sha = await getFileSha(filename);
  const encodedName = encodeURIComponent(filename);

  const body = {
    message: sha ? `Update parser: ${filename}` : `Add new parser: ${filename}`,
    content: base64Content,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${API}/${encodedName}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (res.ok) {
    console.log(`  OK: ${filename}`);
    return true;
  } else {
    const err = await res.text();
    console.error(`  FAIL ${filename}: ${res.status} - ${err.substring(0, 200)}`);
    return false;
  }
}

async function main() {
  console.log("=== Uploading 3 new parsers to ChaviAlmeida/NOBORU-parsers ===\n");

  // Fetch each parser file directly from the v0 project's git (already committed)
  const files = [
    "[DF]MangaDex3.lua",
    "[EN]MangaPill.lua",
    "[EN]MangaSee2.lua",
  ];

  let success = 0;
  let fail = 0;

  for (const name of files) {
    // Fetch from the raw GitHub content of this project
    const rawUrl = `https://raw.githubusercontent.com/ChaviAlmeida/NOBORU/project-overview/parsers/${encodeURIComponent(name)}`;
    console.log(`  Fetching: ${rawUrl}`);
    const resp = await fetch(rawUrl);
    if (!resp.ok) {
      console.error(`  Could not fetch ${name} from project repo: ${resp.status}`);
      // Try alternate: read from API
      const apiUrl = `https://api.github.com/repos/ChaviAlmeida/NOBORU/contents/parsers/${encodeURIComponent(name)}?ref=project-overview`;
      console.log(`  Trying API: ${apiUrl}`);
      const apiResp = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github.v3.raw",
          "User-Agent": "NOBORU-Parser-Sync",
        },
      });
      if (!apiResp.ok) {
        console.error(`  Could not fetch ${name} from API either: ${apiResp.status}`);
        fail++;
        continue;
      }
      const content = await apiResp.text();
      if (await uploadFile(name, content)) success++;
      else fail++;
      continue;
    }
    const content = await resp.text();
    if (await uploadFile(name, content)) success++;
    else fail++;
  }

  console.log(`\nResults: ${success} uploaded, ${fail} failed`);
  console.log(`Check: https://github.com/${OWNER}/${REPO}/tree/${BRANCH}/parsers`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
