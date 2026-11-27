// Imports the effect tour's footage (sc2-adjutant: npm run effect-tour, docs/reference/effect-tour.md)
// into public/effects, at each model's path under Assets/Effects, where sc2-asset-catalog's
// effectPictureUrl looks:
//
//   node scripts/import-effects.mjs [--jobs N] [--threads N] <tour folder>
//
// --pictures-only remakes the pictures, thumbnails, strips and media.json and leaves the clips as
// they are, so a change to the pictures doesn't put another copy of the clips in git.
//
// --jobs is how many ffmpegs run at once (default: the cores less two), and --threads how many
// threads each encoder may use (default: ffmpeg's own choice, every core). Lower both to share the
// machine, for example while the game is filming.
//
// For each effect of each batch filmed to its end (batch-NN/ with its index.html):
//
//   Protoss/Blink/Blink.jpg         its picture: its most detailed picked frame (the largest JPEG in
//                                   peaks/, the frame with most on screen), else its stand still,
//                                   else its first, at 960 px wide
//   Protoss/Blink/Blink_tn.jpg      the picture's middle half at 256 px: the tour frames an effect
//                                   loosely, and it sits on the pad at the centre. A missile's or
//                                   ribbon model's frame picked during the move is cut around the
//                                   host instead: the camera follows it there, three quarters
//                                   across, with the trail behind it
//   Protoss/Blink/Blink.mp4         its clip, as H.264 so every browser plays it, at the tour's
//                                   size and CRF 23: CRF 28 washes out sparks and thin trails
//   Protoss/Blink/Blink-frames.jpg  its key frames side by side, 960 x 540 each, as sharp as the
//                                   picture when one is shown in the clip's place: the picked frames
//                                   and the birth, stand and death stills cropped to their middle
//                                   half (or around the host, as above), the moving and
//                                   after-destroy stills whole
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
import { parseArgs, promisify } from "node:util";

const run = promisify(execFile);
const { values: options, positionals } = parseArgs({
  options: { jobs: { type: "string" }, threads: { type: "string" }, "pictures-only": { type: "boolean" } },
  allowPositionals: true,
});
const tour = positionals[0];
const parallel = options.jobs ? Number(options.jobs) : Math.max(1, availableParallelism() - 2);
const threads = options.threads ? ["-threads", options.threads] : [];
if (!tour || !(parallel >= 1) || (options.threads && !(Number(options.threads) >= 1))) {
  console.error("Usage: node scripts/import-effects.mjs [--pictures-only] [--jobs N] [--threads N] <tour folder>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "effects");
const picturesOnly = options["pictures-only"] ?? false;
if (!picturesOnly) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const pad = (n) => String(n).padStart(4, "0");
const FRAME = { width: 960, height: 540 };
/** The stills shown whole: the host has slid out of the middle by then. */
const WHOLE = new Set(["moving", "after-destroy"]);
/** The crops: an effect's middle half, where the pad is, or the half around its host during the move. */
const CROP = { middle: "crop=iw/2:ih/2", host: "crop=iw/2:ih/2:iw*3/8:ih/4" };

/**
 * When a re-cut clip shows its host's move, in seconds into the clip: from the batch manifest's
 * `cuts`, each clip's kept spans of the recording, joined in order. Undefined when there are none.
 */
function moveInClip(manifest, index) {
  const cut = manifest.cuts?.find((each) => each.effect === index);
  let at = 0;
  for (const span of cut?.spans ?? []) {
    const length = span.to - span.from;
    if (span.parts.includes("move")) return { from: at, to: at + length };
    at += length;
  }
  return undefined;
}

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

    // Only a missile or a model with ribbons is followed by the camera; anything else is left on
    // the pad or moves with a host that slides out of the middle, and is better cut at the middle.
    const trails = Boolean(effect.placement?.missile || effect.placement?.ribbons);
    const move = trails ? moveInClip(manifest, index) : undefined;
    /** A picked frame's crop: around the host if it was picked during the move (its caption is "+1.20 s" into the clip). */
    const pickedCrop = (file) => {
      const seconds = Number.parseFloat((captions.get(file) ?? "").replace("+", ""));
      return move && seconds >= move.from && seconds <= move.to ? CROP.host : CROP.middle;
    };
    const frames = [
      ...own.map((file) => ({ file: path.join(dir, "peaks", file), label: `picked ${captions.get(file) ?? ""}`.trim(), crop: pickedCrop(file) })),
      ...stills.map(({ file, label }) => ({ file, label, crop: WHOLE.has(label) ? undefined : CROP.middle })),
    ];
    const clip = path.join(dir, "clips", `${number}.mp4`);
    media[base] = { frames: frames.map(({ label }) => label), clip: existsSync(clip) };

    jobs.push(["-i", source, "-vf", "scale=960:-2", "-q:v", "4", `${target}.jpg`]);
    const sourceCrop = biggest ? pickedCrop(biggest) : CROP.middle;
    jobs.push(["-i", source, "-vf", `${sourceCrop},scale=256:-2`, "-q:v", "5", `${target}_tn.jpg`]);
    if (existsSync(clip) && !picturesOnly) jobs.push(["-i", clip, "-an", "-c:v", "libx264", ...threads, "-crf", "23", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${target}.mp4`]);
    const scale = `scale=${FRAME.width}:${FRAME.height}`;
    const filters = frames.map(({ crop }, k) => `[${k}]${crop ? `${crop},` : ""}${scale}[f${k}]`);
    const stack = frames.length > 1 ? `${frames.map((_, k) => `[f${k}]`).join("")}hstack=inputs=${frames.length}` : "[f0]null";
    jobs.push([...frames.flatMap(({ file }) => ["-i", file]), "-filter_complex", `${filters.join(";")};${stack}`, "-frames:v", "1", "-q:v", "5", `${target}-frames.jpg`]);
  });
}

let done = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: parallel }, async () => {
    for (let args = queue.shift(); args; args = queue.shift()) {
      await run("ffmpeg", ["-loglevel", "error", "-y", ...args]);
      if (++done % 1000 === 0) console.log(`${done} of ${jobs.length} files`);
    }
  }),
);

const sorted = Object.fromEntries(Object.entries(media).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(path.join(outDir, "media.json"), `${JSON.stringify(sorted)}\n`);
console.log(`${Object.keys(media).length} effects, ${jobs.length} files`);
