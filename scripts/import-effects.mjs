// Imports the effect tour's footage (sc2-adjutant: npm run effect-tour, docs/reference/effect-tour.md)
// into public/effects, at each model's path under Assets/Effects, where sc2-asset-catalog's
// effectPictureUrl looks:
//
//   node scripts/import-effects.mjs <tour folder>
//
// For each effect of each batch filmed to its end (batch-NN/ with its index.html):
//
//   Protoss/Blink/Blink.jpg         its picture: its most detailed picked frame (the largest JPEG in
//                                   peaks/, the frame with most on screen), else its stand still,
//                                   else its first, at 960 px wide
//   Protoss/Blink/Blink_tn.jpg      the picture's middle half at 256 px: the tour frames an effect
//                                   loosely, and it always sits on the pad at the centre
//   Protoss/Blink/Blink.mp4         its clip, as H.264 so every browser plays it
//   Protoss/Blink/Blink-frames.jpg  its key frames side by side, 480 x 270 each: the picked frames
//                                   and the birth, stand and death stills cropped to their middle
//                                   half, the moving and after-destroy stills whole
//
// and public/effects/media.json: for each effect, its key frames' labels in the strip's order (the
// picked frames' times and the stills' names, read from the batch's index.html) and whether it has
// a clip. A strip is one file rather than one a frame, to keep the site's file count down. The
// effects' names and words come from sc2-asset-catalog's effect looks, not from here. Needs ffmpeg
// with libx264. Replaces public/effects.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const tour = process.argv[2];
if (!tour) {
  console.error("Usage: node scripts/import-effects.mjs <tour folder>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "effects");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const pad = (n) => String(n).padStart(4, "0");
const FRAME = { width: 480, height: 270 };
/** The stills shown whole: the host has slid out of the middle by then. */
const WHOLE = new Set(["moving", "after-destroy"]);

/** A batch index's captions: for each picked frame's file name, its caption ("+1.20 s"). */
function peakCaptions(index) {
  const captions = new Map();
  for (const match of index.matchAll(/src="peaks\/([^"]+)"><figcaption>([^<]*)</g)) captions.set(match[1], match[2]);
  return captions;
}

const jobs = [];
const media = {};
const seen = new Set();
for (const batch of readdirSync(tour).filter((name) => /^batch-\d+$/.test(name)).sort()) {
  const dir = path.join(tour, batch);
  if (!existsSync(path.join(dir, "index.html"))) {
    console.log(`${batch}: not filmed to its end, skipped`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const captions = peakCaptions(readFileSync(path.join(dir, "index.html"), "utf8"));
  const peaks = existsSync(path.join(dir, "peaks")) ? readdirSync(path.join(dir, "peaks")) : [];
  manifest.effects.forEach((effect, index) => {
    const number = pad(index + 1);
    const own = peaks
      .filter((file) => file.startsWith(`${number}-`) && file.endsWith(".jpg"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const stills = manifest.shots
      .filter((shot) => shot.effect === index)
      .map((shot) => ({ file: path.join(dir, "frames", `${pad(shot.stop)}.jpg`), label: shot.label }))
      .filter(({ file }) => existsSync(file));
    const biggest = [...own].sort((a, b) => statSync(path.join(dir, "peaks", b)).size - statSync(path.join(dir, "peaks", a)).size)[0];
    const source = biggest ? path.join(dir, "peaks", biggest) : (stills.find(({ label }) => label === "stand") ?? stills[0])?.file;
    if (!source) {
      console.log(`${effect.file}: no picture, skipped`);
      return;
    }
    const base = effect.file.replace(/^Assets\/Effects\//, "").replace(/\.m3$/i, "");
    if (seen.has(base.toLowerCase())) throw new Error(`two effects would both be ${base}`);
    seen.add(base.toLowerCase());
    const target = path.join(outDir, base);
    mkdirSync(path.dirname(target), { recursive: true });

    const frames = [
      ...own.map((file) => ({ file: path.join(dir, "peaks", file), label: `picked ${captions.get(file) ?? ""}`.trim(), crop: true })),
      ...stills.map(({ file, label }) => ({ file, label, crop: !WHOLE.has(label) })),
    ];
    const clip = path.join(dir, "clips", `${number}.mp4`);
    media[base] = { frames: frames.map(({ label }) => label), clip: existsSync(clip) };

    jobs.push(["-i", source, "-vf", "scale=960:-2", "-q:v", "4", `${target}.jpg`]);
    jobs.push(["-i", source, "-vf", "crop=iw/2:ih/2,scale=256:-2", "-q:v", "5", `${target}_tn.jpg`]);
    if (existsSync(clip)) jobs.push(["-i", clip, "-an", "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${target}.mp4`]);
    const scale = `scale=${FRAME.width}:${FRAME.height}`;
    const filters = frames.map(({ crop }, k) => `[${k}]${crop ? "crop=iw/2:ih/2," : ""}${scale}[f${k}]`);
    const stack = frames.length > 1 ? `${frames.map((_, k) => `[f${k}]`).join("")}hstack=inputs=${frames.length}` : "[f0]null";
    jobs.push([...frames.flatMap(({ file }) => ["-i", file]), "-filter_complex", `${filters.join(";")};${stack}`, "-frames:v", "1", "-q:v", "5", `${target}-frames.jpg`]);
  });
}

let done = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: Math.max(1, availableParallelism() - 2) }, async () => {
    for (let args = queue.shift(); args; args = queue.shift()) {
      await run("ffmpeg", ["-loglevel", "error", "-y", ...args]);
      if (++done % 1000 === 0) console.log(`${done} of ${jobs.length} files`);
    }
  }),
);

const sorted = Object.fromEntries(Object.entries(media).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(path.join(outDir, "media.json"), `${JSON.stringify(sorted)}\n`);
console.log(`${Object.keys(media).length} effects, ${jobs.length} files`);
