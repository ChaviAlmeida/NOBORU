const REPO = "ChaviAlmeida/NOBORU-parsers";
const TOKEN = process.env.GITHUB_TOKEN;

// First, fetch the file from the NOBORU main repo's branch
async function main() {
  console.log("=== Uploading [DF]MangaDex3.lua to fork ===\n");

  // Step 1: Fetch file content from the main NOBORU repo (project-overview branch)
  console.log("Fetching file from ChaviAlmeida/NOBORU...");
  const sourceUrl = "https://api.github.com/repos/ChaviAlmeida/NOBORU/contents/parsers/%5BDF%5DMangaDex3.lua?ref=project-overview";
  const srcRes = await fetch(sourceUrl, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!srcRes.ok) {
    console.log("ERROR fetching source:", srcRes.status, await srcRes.text());
    return;
  }

  const srcData = await srcRes.json();
  const fileContent = srcData.content; // already base64
  console.log(`Got file: ${srcData.name} (${srcData.size} bytes)\n`);

  // Step 2: Check if file already exists in parsers repo
  const targetPath = "parsers/%5BDF%5DMangaDex3.lua";
  const checkUrl = `https://api.github.com/repos/${REPO}/contents/${targetPath}`;
  const checkRes = await fetch(checkUrl, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  let existingSha = null;
  if (checkRes.ok) {
    const existing = await checkRes.json();
    existingSha = existing.sha;
    console.log(`File already exists with SHA: ${existingSha}, will update.`);
  } else {
    console.log("File does not exist yet, will create.");
  }

  // Step 3: Upload/update file
  const body = {
    message: "Add [DF]MangaDex3.lua parser (MangaDex API v5)",
    content: fileContent,
  };
  if (existingSha) {
    body.sha = existingSha;
  }

  const putRes = await fetch(checkUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (putRes.ok) {
    console.log("\nSUCCESS: [DF]MangaDex3.lua uploaded!");
  } else {
    const errText = await putRes.text();
    console.log(`\nFAILED (${putRes.status}): ${errText.substring(0, 500)}`);
  }
}

main().catch(console.error);
