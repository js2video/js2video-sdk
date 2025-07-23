#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate random filename
const randomName =
  "video-template-" + crypto.randomBytes(4).toString("hex") + ".html";
const srcPath = path.join(__dirname, "lib", "template.html");
const destPath = path.join(process.cwd(), randomName);

try {
  await fs.copyFile(srcPath, destPath);
  console.log(`✅ Copied template to ./${randomName}`);
  console.log(`🌐 Serving at http://localhost:3003/${randomName}`);

  // Resolve live-server CLI entry
  const liveServerBin = require.resolve("live-server/bin/live-server.js");

  // Run the live-server CLI directly via node
  execSync(
    `${process.execPath} ${liveServerBin} ${randomName} --port=3003 --open=${randomName}`,
    { stdio: "inherit" }
  );
} catch (err) {
  console.error("❌ Failed to run:", err);
  console.error(err);
  process.exit(1);
}
