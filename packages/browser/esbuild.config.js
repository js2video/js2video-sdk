import * as esbuild from "esbuild";

const isDev = process.argv.includes("--watch");

console.log("building. isDev?", isDev);

const ctx = await esbuild.context({
  entryPoints: ["src/index.js"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  sourcemap: isDev,
  minify: !isDev,
});

if (isDev) {
  await ctx.watch();
  console.log("👀 Watching for changes...");
} else {
  await ctx.rebuild();
  console.log("✅ Build complete");
  await ctx.dispose();
}
