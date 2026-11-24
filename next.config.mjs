// Read at run time in ways tracing can't follow: what scripts/build-search-index.mjs builds (with
// fs), and ONNX Runtime's addon (a require built from process.platform and process.arch).
const MODEL_FILES = [
  "./.search/models/**/*",
  "./node_modules/onnxruntime-node/{package.json,dist/**/*,bin/napi-v6/linux/x64/{libonnxruntime.so.1,onnxruntime_binding.node}}",
  "./node_modules/onnxruntime-common/**/*",
  // sharp, which transformers loads, finds libvips by a path tracing doesn't follow either.
  "./node_modules/@img/sharp-linux-x64/**/*",
  "./node_modules/@img/sharp-libvips-linux-x64/**/*",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Loaded from node_modules, unbundled: the catalog finds its data beside its own files
  // (import.meta.url), and the embeddings model runs on ONNX Runtime's native addon.
  serverExternalPackages: [
    "@team-antioch/sc2-asset-catalog",
    "@team-antioch/sc2-doodad-finder",
    "@team-antioch/sc2-finder-kit",
    "@team-antioch/sc2-set-finder",
    "@team-antioch/sc2-effect-finder",
    "@huggingface/transformers",
    "onnxruntime-node",
    "sharp",
  ],
  // Each search ships the model and its own part of .search/.
  outputFileTracingIncludes: {
    "/api/doodad-search": ["./.search/**/*", ...MODEL_FILES],
    "/api/set-search": [
      "./.search/data/set-looks.json",
      "./.search/sets-vectors-*.bin",
      ...MODEL_FILES,
    ],
    "/api/effect-search": [
      "./.search/data/effect-looks.json",
      "./.search/effects-vectors-*.bin",
      ...MODEL_FILES,
    ],
  },
};

export default nextConfig;
