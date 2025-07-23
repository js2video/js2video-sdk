import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

async function exportVideo({ videoTemplateUrl }) {
  console.log("export video", videoTemplateUrl);

  const puppeteerArgs = [
    "--disable-web-security",
    "--enable-unsafe-webgpu",
    "--enable-webgl",
    "--ignore-gpu-blacklist",
    "--disable-software-rasterizer",
  ];

  const browser = await puppeteer.launch({
    args: puppeteerArgs,
    headless: true,
  });

  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    window.isPuppeteer = true;
  });

  page.on("console", async (msg) => {
    const args = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
    console.log(`[js2video/export:${msg.type()}]`, ...args);
  });

  console.log("goto", videoTemplateUrl);

  // open client
  await page.goto(videoTemplateUrl);

  console.log("opened", videoTemplateUrl);

  // wait until the render function is ready
  await page.waitForFunction("window.exportVideo !== undefined", {
    timeout: 3000,
  });

  console.log("window.exportVideo found");

  const tempDir = process.env.TEMP_DIR ?? os.tmpdir();

  console.log("temp dir", tempDir);

  const outputFile = path.join(tempDir, `video-${Date.now()}.mp4`);

  console.log("exporting file to", outputFile);

  const fileHandle = await fs.open(outputFile, "w");

  console.log("file handle created", outputFile);

  // page can now call writeChunk() from its exportVideo()
  await page.exposeFunction("writeChunk", async (chunk, position) => {
    const buffer = Buffer.from(chunk);
    await fileHandle.write(buffer, 0, buffer.length, position);
  });

  const result = await page.evaluate(
    async (options) => {
      return await window.exportVideo(options);
    },
    { foo: "bar" }
  );

  console.log(result);

  await page.close();

  await browser.close();

  console.log("done", outputFile);
}

export { exportVideo };
