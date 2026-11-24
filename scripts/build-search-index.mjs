// Builds what the doodad, set and effect search routes read, into .search/ (git-ignored), before
// `next build`:
//
//   .search/data/         the shipped descriptions, Doodad Uses, set looks and effect looks,
//                         copied out of the package
//   .search/extracted/    the catalog's fields, extracted from SC2GameData, with the gallery
//                         listed from this checkout's public/doodads rather than GitHub's API
//   .search/models/       the embeddings model's weights
//   .search/vectors-*.bin every doodad card embedded, so a request only embeds its ask
//   .search/sets-vectors-*.bin
//                         every set card embedded, likewise
//   .search/effects-vectors-*.bin
//                         every effect card embedded, likewise
//
// No route downloads or embeds the catalog: everything it needs is here, and
// next.config.mjs ships the folder with the function.

import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOODAD_DESCRIPTIONS_PATH,
  DOODAD_USES_DIR,
  EFFECT_LOOKS_PATH,
  SET_LOOKS_PATH,
} from "@team-antioch/sc2-asset-catalog/catalog/catalog-dirs.js";
import { readStockDoodadSources } from "@team-antioch/sc2-asset-catalog/catalog/doodad-search.js";
import {
  extractCatalog,
  GALLERY_TREE_URL,
} from "@team-antioch/sc2-asset-catalog/catalog/extract-catalog.js";
import { readEffectLooks } from "@team-antioch/sc2-asset-catalog/catalog/effect-looks.js";
import { readSetLooks } from "@team-antioch/sc2-asset-catalog/catalog/set-looks.js";
import { localEmbedder } from "@team-antioch/sc2-doodad-finder/embedder.js";
import {
  openFinder,
  vectorCacheFile,
} from "@team-antioch/sc2-doodad-finder/finder.js";
import {
  openSetFinder,
  setCards,
  setVectorCacheFile,
} from "@team-antioch/sc2-set-finder";
import {
  effectCards,
  effectVectorCacheFile,
  openEffectFinder,
} from "@team-antioch/sc2-effect-finder";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, ".search");
const dataDir = path.join(out, "data");
const extractedDir = path.join(out, "extracted");
const modelsDir = path.join(out, "models");
const log = (line) => console.log(`[search-index] ${line}`);

// Rebuilt whole each time, so a removed description or an old model's vectors can't linger.
rmSync(dataDir, { recursive: true, force: true });
rmSync(extractedDir, { recursive: true, force: true });
for (const file of existsSync(out) ? readdirSync(out) : [])
  if (
    file.startsWith("vectors-") ||
    file.startsWith("sets-vectors-") ||
    file.startsWith("effects-vectors-")
  )
    rmSync(path.join(out, file));

cpSync(
  DOODAD_DESCRIPTIONS_PATH,
  path.join(dataDir, "doodad-descriptions.json"),
);
cpSync(DOODAD_USES_DIR, path.join(dataDir, "doodad-uses"), { recursive: true });
cpSync(SET_LOOKS_PATH, path.join(dataDir, "set-looks.json"));
cpSync(EFFECT_LOOKS_PATH, path.join(dataDir, "effect-looks.json"));

// The extractor lists the gallery through GitHub's API. Answer that one call from this checkout,
// so the catalog matches the pictures being deployed and a build never meets the API's rate limit.
const galleryTree = () => ({
  truncated: false,
  tree: readdirSync(path.join(root, "public/doodads")).map((file) => ({
    path: `public/doodads/${file}`,
  })),
});
const fetchWithLocalGallery = (url, init) =>
  String(url) === GALLERY_TREE_URL
    ? Promise.resolve(Response.json(galleryTree()))
    : globalThis.fetch(url, init);

const sourcesOptions = {
  cacheDir: out,
  extractedDir,
  descriptionsFile: path.join(dataDir, "doodad-descriptions.json"),
  usesDir: path.join(dataDir, "doodad-uses"),
};

await extractCatalog({
  extractedDir,
  descriptionsFile: sourcesOptions.descriptionsFile,
  fetch: fetchWithLocalGallery,
  log,
});

const embedder = await localEmbedder({ cacheDir: modelsDir });
const finder = await openFinder({
  load: async () => readStockDoodadSources(sourcesOptions),
  embedder,
  cacheFile: vectorCacheFile(embedder.model, out),
});
log(`${finder.cards.size} cards, ${finder.embeddedOnOpen} embedded -> ${out}`);
finder.close();

// The sets: their cards' text doesn't depend on where the pictures are, so the vectors are the
// route's whatever base it gives. Every set's pictures must be in public/sets.
const looks = readSetLooks(path.join(dataDir, "set-looks.json"));
const missing = [...looks.keys()].filter(
  (id) => !existsSync(path.join(root, "public/sets", id)),
);
if (missing.length)
  throw new Error(`No pictures in public/sets for: ${missing.join(", ")}`);
const setFinder = await openSetFinder({
  cards: setCards(looks, { base: "/sets" }),
  embedder,
  cacheFile: setVectorCacheFile(embedder.model, out),
});
log(
  `${setFinder.cards.size} set cards, ${setFinder.embeddedOnOpen} embedded -> ${out}`,
);
setFinder.close();

// The effects, likewise. Every effect's media must be in public/effects, at its model's path.
const effectLooks = readEffectLooks(path.join(dataDir, "effect-looks.json"));
const noMedia = [...effectLooks.keys()].filter(
  (file) =>
    !existsSync(
      path.join(
        root,
        "public/effects",
        `${file.replace(/^Assets\/Effects\//, "").replace(/\.m3$/i, "")}.jpg`,
      ),
    ),
);
if (noMedia.length)
  throw new Error(
    `No picture in public/effects for ${noMedia.length} effects, such as ${noMedia.slice(0, 3).join(", ")}`,
  );
const effectFinder = await openEffectFinder({
  cards: effectCards(effectLooks, { base: "/effects" }),
  embedder,
  cacheFile: effectVectorCacheFile(embedder.model, out),
});
log(
  `${effectFinder.cards.size} effect cards, ${effectFinder.embeddedOnOpen} embedded -> ${out}`,
);
effectFinder.close();
