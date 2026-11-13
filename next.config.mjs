/** @type {import('next').NextConfig} */
const nextConfig = {
  // Loaded from node_modules, unbundled: the catalog finds its data beside its own files
  // (import.meta.url), and the embeddings model runs on ONNX Runtime's native addon.
  serverExternalPackages: [
    "@team-antioch/sc2-asset-catalog",
    "@team-antioch/sc2-doodad-finder",
    "@huggingface/transformers",
    "onnxruntime-node",
    "sharp",
  ],
  // Read at run time in ways tracing can't follow: what scripts/build-search-index.mjs builds (with
  // fs), and ONNX Runtime's addon (a require built from process.platform and process.arch).
  outputFileTracingIncludes: {
    "/api/doodad-search": [
      "./.search/**/*",
      "./node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/{package.json,dist/**/*,bin/napi-v6/linux/x64/{libonnxruntime.so.1,onnxruntime_binding.node}}",
      "./node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-common/**/*",
    ],
  },
};

export default nextConfig;
