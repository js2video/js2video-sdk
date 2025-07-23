#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate random HTML filename
const randomName = `video-template-${crypto
  .randomBytes(4)
  .toString("hex")}.html`;
const srcPath = path.join(__dirname, "lib", "template.html");
const destPath = path.join(process.cwd(), randomName);

// Copy the template
await fs.copyFile(srcPath, destPath);
console.log(`✅ Copied template to ./${randomName}`);
console.log(`🌐 Serving at http://localhost:3003/${randomName}`);

// ✅ Resolve and run http-server directly
try {
  execSync(`http-server . -p 3003 -c-1 -o ${randomName}`, {
    stdio: "inherit",
  });
} catch (err) {
  console.error("❌ Failed to start http-server:", err.message);
  process.exit(1);
}
