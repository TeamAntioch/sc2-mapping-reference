// Imports the effect tour's pictures (sc2-adjutant: npm run effect-tour, docs/reference/effect-tour.md)
// into the Effects gallery.
//
//   node scripts/import-effects.mjs <tour folder>
//
// For each effect of each batch filmed to its end (batch-NN/ with its index.html), takes its most
// detailed picked frame (the largest JPEG in peaks/, the frame with most on screen), else its
// stand still, else its first, and writes public/effects/<name>.jpg at 960 px wide and
// <name>_tn.jpg, its middle half at 256 px, then app/(gallery)/effects/effect-list.ts. Needs ffmpeg. Replaces
// public/effects.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const tour = process.argv[2];
if (!tour) {
  console.error("Usage: node scripts/import-effects.mjs <tour folder>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "effects");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

/** Protoss/ZeratulBlinkOut/ZeratulBlinkOut.m3 -> ["Protoss", "ZeratulBlinkOut"]: the folder that repeats the file's name is dropped. */
function parts(file) {
  const segments = file.replace(/^Assets\/Effects\//, "").replace(/\.m3$/i, "").split("/");
  const name = segments.pop();
  if (segments.at(-1) === name) segments.pop();
  return [...segments, name];
}

const pad = (n) => String(n).padStart(4, "0");
const entries = [];
const seen = new Set();
for (const batch of readdirSync(tour).filter((name) => /^batch-\d+$/.test(name)).sort()) {
  const dir = path.join(tour, batch);
  if (!existsSync(path.join(dir, "index.html"))) {
    console.log(`${batch}: not filmed to its end, skipped`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const peaks = existsSync(path.join(dir, "peaks")) ? readdirSync(path.join(dir, "peaks")) : [];
  manifest.effects.forEach((effect, index) => {
    const own = peaks.filter((file) => file.startsWith(`${pad(index + 1)}-`) && file.endsWith(".jpg")).map((file) => path.join(dir, "peaks", file));
    const stills = manifest.shots
      .filter((shot) => shot.effect === index)
      .sort((a, b) => (b.label === "stand") - (a.label === "stand"))
      .map((shot) => path.join(dir, "frames", `${pad(shot.stop)}.jpg`))
      .filter((file) => existsSync(file));
    const source = own.sort((a, b) => statSync(b).size - statSync(a).size)[0] ?? stills[0];
    if (!source) {
      console.log(`${effect.file}: no picture, skipped`);
      return;
    }
    const segments = parts(effect.file);
    const base = segments.join("_").replace(/[^A-Za-z0-9_-]/g, "_");
    if (seen.has(base.toLowerCase())) throw new Error(`two effects would both be ${base}.jpg`);
    seen.add(base.toLowerCase());
    // The picture is the whole frame; the thumbnail its middle half, since the tour frames an
    // effect loosely and it always sits on the pad at the centre, a speck in a small tile otherwise.
    for (const [suffix, filter, quality] of [["", "scale=960:-2", 4], ["_tn", "crop=iw/2:ih/2,scale=256:-2", 5]]) {
      execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", source, "-vf", filter, "-q:v", String(quality), path.join(outDir, `${base}${suffix}.jpg`)]);
    }
    entries.push({ name: `${segments.at(-1)} (${segments.slice(0, -1).join(" / ") || "Effects"})`, url: `${base}.jpg`, tags: "" });
  });
}
entries.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(
  path.join(root, "app", "(gallery)", "effects", "effect-list.ts"),
  `import { GalleryEntry } from "@/lib/types";

// Written by scripts/import-effects.mjs from sc2-adjutant's effect tour; don't edit by hand.
const effects: GalleryEntry[] = ${JSON.stringify(entries, null, 2)};

export default effects;
`,
);
console.log(`${entries.length} effects`);
