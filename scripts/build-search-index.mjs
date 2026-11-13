// Builds what the doodad search route reads, into .search/ (git-ignored), before `next build`:
//
//   .search/data/         the shipped descriptions and Doodad Uses, copied out of the package
//   .search/extracted/    the catalog's fields, extracted from SC2GameData, with the gallery
//                         listed from this checkout's public/doodads rather than GitHub's API
//   .search/models/       the embeddings model's weights
//   .search/vectors-*.bin every card embedded, so a request only embeds its ask
//
// The route never downloads or embeds the catalog: everything it needs is here, and
// next.config.mjs ships the folder with the function.

import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOODAD_DESCRIPTIONS_PATH,
  DOODAD_USES_DIR,
} from "@team-antioch/sc2-asset-catalog/catalog/catalog-dirs.js";
import { readStockDoodadSources } from "@team-antioch/sc2-asset-catalog/catalog/doodad-search.js";
import {
  extractCatalog,
  GALLERY_TREE_URL,
} from "@team-antioch/sc2-asset-catalog/catalog/extract-catalog.js";
import { localEmbedder } from "@team-antioch/sc2-doodad-finder/embedder.js";
import {
  openFinder,
  vectorCacheFile,
} from "@team-antioch/sc2-doodad-finder/finder.js";

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
  if (file.startsWith("vectors-")) rmSync(path.join(out, file));

cpSync(
  DOODAD_DESCRIPTIONS_PATH,
  path.join(dataDir, "doodad-descriptions.json"),
);
cpSync(DOODAD_USES_DIR, path.join(dataDir, "doodad-uses"), { recursive: true });

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
