#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate random filename like ab12cd34.html
const randomName =
  "video-template-" + crypto.randomBytes(4).toString("hex") + ".html";
const srcPath = path.join(__dirname, "lib", "template.html");
const destPath = path.join(process.cwd(), randomName);

try {
  await fs.copyFile(srcPath, destPath);
  console.log(`✅ Copied template to ./${randomName}`);
  console.log(`🌐 Serving at http://localhost:3003/${randomName}`);
  execSync(`npx live-server ${randomName} --port=3003 --open=${randomName}`, {
    stdio: "inherit",
  });
} catch (err) {
  console.error("❌ Failed to run:", err);
  process.exit(1);
}
