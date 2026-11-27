// Makes the galleries' middle-sized thumbnails, beside each picture and its 128 px (320 px for
// sets) _tn, so a grid whose thumbnails can be enlarged can pick between them with srcset:
//
//   node scripts/make-medium-thumbnails.mjs [--force] [--jobs N] [--limit N] [--quality Q] [gallery ...]
//
//   doodads/Name.jpg      the picture, as imported
//   doodads/Name_tn.jpg   its thumbnail, as imported
//   doodads/Name_md.jpg   made here: the picture at 512 px wide, its aspect kept, as a JPEG
//
// The galleries are cliffs, doodads, terrain, tilesets and sets (default: all of them); sets are
// walked into, for their cards, overviews and plans. Effects aren't here: their _md is cut from the
// picture's middle like their _tn, so scripts/import-effects.mjs makes it.
//
// A picture narrower than 512 px is kept at its own width rather than blown up. A _md newer than its
// picture is left alone unless --force. --jobs is how many pictures are worked on at once (default:
// the cores less two), --limit how many each gallery makes at most (for trying a setting on a
// sample), and --quality the JPEG quality (default 85: a doodad's _md near 40 KB, a tileset's 46,
// a terrain's 32, as they are shorter).
import { readdirSync, statSync } from "node:fs";
import { availableParallelism } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const GALLERIES = ["cliffs", "doodads", "terrain", "tilesets", "sets"];
const WIDTH = 512;
const { values: options, positionals } = parseArgs({
  options: {
    force: { type: "boolean" },
    jobs: { type: "string" },
    limit: { type: "string" },
    quality: { type: "string" },
  },
  allowPositionals: true,
});
const galleries = positionals.length ? positionals : GALLERIES;
const parallel = options.jobs ? Number(options.jobs) : Math.max(1, availableParallelism() - 2);
const limit = options.limit ? Number(options.limit) : Infinity;
const quality = options.quality ? Number(options.quality) : 85;
const unknown = galleries.filter((name) => !GALLERIES.includes(name));
if (unknown.length || !(parallel >= 1) || !(limit >= 1) || !(quality >= 1 && quality <= 100)) {
  if (unknown.length) console.error(`Not a gallery: ${unknown.join(", ")} (they are ${GALLERIES.join(", ")})`);
  console.error("Usage: node scripts/make-medium-thumbnails.mjs [--force] [--jobs N] [--limit N] [--quality Q] [gallery ...]");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");

/** A gallery's pictures: its images, less the thumbnails made from them and effects-style strips. */
function pictures(gallery) {
  const dir = path.join(root, "public", gallery);
  return readdirSync(dir, { recursive: true })
    .filter((file) => /\.(jpg|png|gif)$/i.test(file) && !/(_tn|_md|-frames)\.\w+$/i.test(file))
    .sort()
    .map((file) => path.join(dir, file));
}

const mediumOf = (file) => file.replace(/\.\w+$/, "_md.jpg");
const isFresh = (source, target) => {
  try {
    return statSync(target).mtimeMs >= statSync(source).mtimeMs;
  } catch {
    return false;
  }
};

const jobs = [];
for (const gallery of galleries) {
  const due = pictures(gallery).filter((file) => options.force || !isFresh(file, mediumOf(file)));
  jobs.push(...due.slice(0, limit).map((file) => ({ gallery, file })));
}

const made = Object.fromEntries(galleries.map((gallery) => [gallery, { count: 0, bytes: 0 }]));
const failed = [];
let done = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: parallel }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        // The first frame of a GIF; flattened onto black, as the editor's pictures are shown.
        const { size } = await sharp(job.file)
          .flatten({ background: "#000" })
          .resize({ width: WIDTH, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toFile(mediumOf(job.file));
        made[job.gallery].count++;
        made[job.gallery].bytes += size;
      } catch (error) {
        failed.push(`${path.relative(root, job.file)}: ${error.message}`);
      }
      if (++done % 500 === 0) console.log(`${done} of ${jobs.length} pictures`);
    }
  }),
);

for (const [gallery, { count, bytes }] of Object.entries(made)) {
  if (count) console.log(`${gallery}: ${count} made, ${(bytes / 1e6).toFixed(1)} MB, ${(bytes / count / 1e3).toFixed(0)} KB each`);
}
if (failed.length) {
  console.error(`${failed.length} failed:\n  ${failed.join("\n  ")}`);
  process.exitCode = 1;
}
if (!jobs.length) console.log("Nothing to do: every _md is newer than its picture (--force remakes them)");
