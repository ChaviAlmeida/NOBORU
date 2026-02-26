import { execSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PROJECT = "/vercel/share/v0-project";
const SOURCE = join(PROJECT, "source");
const OUTPUT = join(PROJECT, "Noboru.vpk");

// Verify source directory exists
if (!existsSync(SOURCE)) {
  console.log("ERROR: source/ directory not found at", SOURCE);
  process.exit(1);
}

// Verify critical files
const critical = [
  "eboot.bin",
  "index.lua",
  "main.lua",
  "sce_sys/param.sfo",
  "sce_sys/icon0.png",
];

console.log("=== Verifying critical files ===\n");
for (const f of critical) {
  const fullPath = join(SOURCE, f);
  if (existsSync(fullPath)) {
    const size = statSync(fullPath).size;
    console.log(`  OK: ${f} (${size} bytes)`);
  } else {
    console.log(`  MISSING: ${f}`);
  }
}

// Count total files
function countFiles(dir) {
  let count = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

const totalFiles = countFiles(SOURCE);
console.log(`\nTotal files to package: ${totalFiles}\n`);

// Build VPK (it's just a ZIP with .vpk extension)
console.log("=== Building Noboru.vpk ===\n");

try {
  // Remove old VPK if exists
  execSync(`rm -f "${OUTPUT}"`);

  // Create ZIP from source directory contents
  // cd into source so paths inside ZIP are relative (no "source/" prefix)
  execSync(`cd "${SOURCE}" && zip -r "${OUTPUT}" . -x "*.DS_Store"`, {
    stdio: "pipe",
  });

  if (existsSync(OUTPUT)) {
    const vpkSize = statSync(OUTPUT).size;
    const vpkSizeMB = (vpkSize / (1024 * 1024)).toFixed(2);
    console.log(`SUCCESS: Noboru.vpk created (${vpkSizeMB} MB)`);
    console.log(`Location: ${OUTPUT}`);
  } else {
    console.log("ERROR: VPK file was not created");
  }
} catch (err) {
  console.log("ERROR during build:", err.message);
  if (err.stderr) console.log("STDERR:", err.stderr.toString());
}
