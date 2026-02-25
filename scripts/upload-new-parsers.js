import { readFileSync } from "node:fs";

const PARSERS_DIR = "/vercel/share/v0-project/parsers";

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

const NEW_PARSERS = [
  "[DF]MangaDex3.lua",
  "[EN]MangaPill.lua",
  "[EN]MangaSee2.lua",
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

async function uploadFile(filename) {
  const localPath = `${PARSERS_DIR}/${filename}`;
  console.log(`  Reading from: ${localPath}`);
  const content = readFileSync(localPath, "utf-8");
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
    console.log(`  UPLOADED: ${filename}`);
  } else {
    const err = await res.text();
    console.error(`  ERROR uploading ${filename}: ${res.status} ${err}`);
  }
}

async function main() {
  console.log("=== Uploading new parsers to fork ===\n");
  for (const name of NEW_PARSERS) {
    await uploadFile(name);
  }
  console.log(`\nDone! Check: https://github.com/${OWNER}/${REPO}/tree/${BRANCH}/parsers`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
