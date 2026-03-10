const TOKEN = process.env.GITHUB_TOKEN;
const REPO = "ChaviAlmeida/NOBORU-parsers";
const API_BASE = `https://api.github.com/repos/${REPO}/contents/parsers`;

const PARSERS = [
  {
    name: "[DF]MangaDex3.lua",
    content: `if u8c then
    MangaDex3 = Parser:new("MangaDex", "https://mangadex.org", "DIF", "MANGADEX3", 3)
    -- Full content will be fetched from NOBORU repo
end`
  },
  {
    name: "[EN]MangaPill.lua",
    content: ""
  },
  {
    name: "[EN]MangaSee2.lua", 
    content: ""
  }
];

async function fetchParserFromNoboru(filename) {
  const url = `https://raw.githubusercontent.com/ChaviAlmeida/NOBORU/v0/chavialmeida-a3c3a645/parsers/${encodeURIComponent(filename)}`;
  console.log(`Fetching ${filename} from NOBORU repo...`);
  console.log(`URL: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`Failed to fetch ${filename}: ${res.status}`);
    return null;
  }
  return await res.text();
}

async function uploadParser(name, content) {
  console.log(`\nUploading ${name}...`);
  
  // Check if file exists
  const checkUrl = `${API_BASE}/${encodeURIComponent(name)}`;
  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `token ${TOKEN}` }
  });
  
  let sha = null;
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
    console.log(`  File exists, will update (sha: ${sha.substring(0, 7)})`);
  } else {
    console.log(`  File does not exist, will create`);
  }

  const body = {
    message: `Add/update ${name}`,
    content: Buffer.from(content).toString("base64"),
    branch: "master"
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(checkUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (putRes.ok) {
    console.log(`  SUCCESS: ${name} uploaded`);
    return true;
  } else {
    const err = await putRes.text();
    console.log(`  FAILED: ${putRes.status} - ${err}`);
    return false;
  }
}

async function main() {
  console.log("=== Uploading 3 new parsers to NOBORU-parsers fork ===\n");

  const filenames = ["[DF]MangaDex3.lua", "[EN]MangaPill.lua", "[EN]MangaSee2.lua"];
  
  for (const filename of filenames) {
    const content = await fetchParserFromNoboru(filename);
    if (content) {
      await uploadParser(filename, content);
    } else {
      console.log(`Skipping ${filename} - could not fetch content`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
