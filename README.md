# StarCraft 2 Mapping Reference

A browsable reference for people making StarCraft II maps. It shows pictures of
what the Map Editor has to offer, so you can see an asset before you hunt for it
in the Editor's lists:

- **Cliffs**: every cliff type.
- **Doodads**: every doodad, with a plain-words search.
- **Tilesets**: every tileset.
- **Terrain**: every terrain texture.

Live site: see the repository's "About" link. Source:
<https://github.com/TeamAntioch/sc2-mapping-reference>.

## Features

- **Galleries** of thumbnails that open full size in a lightbox
  ([PhotoSwipe](https://photoswipe.com/)).
- **Name filter** on every gallery: type words, separated by commas, to narrow it.
- **Plain-words doodad search.** On the Doodads page, ask for what you mean ("a
  ruined stone wall", "something glowing") and get doodads whose descriptions fit,
  even if the name doesn't contain your words.
  - *Exact matches* (the name contains your text) are listed first; *semantic
    matches* follow.
  - Two checkboxes turn either kind off, and a *semantic certainty* slider
    (Very strict to Very loose) sets how good a semantic match has to be.
  - These settings are kept in your browser's `localStorage`.
- **Doodad palette.** Collect doodads in a side panel while you browse, so you
  have a shortlist to build from. It is also kept in `localStorage`.
- A sci-fi console look, built with Tailwind CSS.

## Running it locally

You need **Node.js 22.18 or newer** and **pnpm 12.18.0** (the repo pins it in
`packageManager`; with [Corepack](https://nodejs.org/api/corepack.html) enabled,
`pnpm` picks the right version itself).

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The galleries work straight away.

The plain-words doodad search needs its index first. Build it once (about 40 s,
and it downloads the embeddings model the first time):

```bash
pnpm build-search-index
```

Without `.search/` the Doodads page still works with the name filter, but the
semantic matches don't appear.

Other commands:

| Command                   | What it does                                      |
| ------------------------- | ------------------------------------------------- |
| `pnpm dev`                | Start the dev server                              |
| `pnpm build`              | Build the search index, then the production build |
| `pnpm start`              | Serve the production build                        |
| `pnpm lint`               | Run ESLint                                        |
| `pnpm build-search-index` | Build only `.search/`                             |

`pnpm-workspace.yaml` holds pnpm's settings for the repo (a flat `node_modules`,
and which dependencies may run install scripts). Use pnpm, not npm or yarn.

## Environment variables

All of them are optional. Put them in `.env.local` (git-ignored) to set them
locally. Without any, the app runs, and the doodad search works without Jev
ranking or limits.

| Variable                                      | What it does                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `TYPESAFE_API_KEY`                            | Lets the search call Jev, the model that grades how well each candidate doodad fits an ask (about $0.0013 an ask). Without it, results come in the narrowing's order. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN`        | An [Upstash Redis](https://upstash.com/) REST endpoint, where the limits below are kept. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` work too. Without Redis there is no rate limit and Jev isn't called. |
| `DOODAD_SEARCH_RATE_LIMIT`                    | Asks a minute one IP may make. Default `20`.                                                                                              |
| `DOODAD_SEARCH_DAILY_BUDGET`                  | US dollars Jev may spend per UTC day. Default `1`. Once spent, results come in the narrowing's order until midnight UTC.                 |

Jev is only called when both `TYPESAFE_API_KEY` and Redis are set. Changing a
limit takes a restart or redeploy.

## How the data is built

**Galleries.** Each gallery is a folder of pictures in `public/` (`cliffs`,
`doodads`, `tilesets`, `terrain`), a thumbnail (`*_tn.jpg`) beside each full-size
picture, and a list in the matching `app/(gallery)/<name>/<name>-list.ts`. The
pictures are Editor screenshots and the lists are checked in; no script in this
repo generates them. To add an asset, add its two pictures and a list entry
(`name`, `url`, `tags`).

**Doodad search index.** `pnpm build-search-index` (run by `pnpm build`) runs
`scripts/build-search-index.mjs`, which writes `.search/` (git-ignored):

1. copies the shipped doodad descriptions and "Doodad Uses" out of
   [`@team-antioch/sc2-asset-catalog`](https://github.com/TeamAntioch/sc2-asset-catalog);
2. extracts the catalog's fields (names, packages, categories, tilesets) from
   SC2Mapster's SC2GameData, listing the gallery from this checkout's
   `public/doodads` so the catalog matches the pictures being deployed;
3. downloads the gte-small embeddings model;
4. embeds every doodad card, so a request only has to embed its own ask.

At run time `GET /api/doodad-search?q=<ask>` reads only `.search/`. It narrows
candidates by keyword and embeddings
([`@team-antioch/sc2-doodad-finder`](https://github.com/TeamAntioch/sc2-asset-catalog)),
then has Jev grade them when the key and budget allow. `next.config.mjs` ships
`.search/` and ONNX Runtime's Linux addon with the route, for Vercel.

## Deploying

The project is set up for [Vercel](https://vercel.com/). Set the environment
variables above in the project settings; `pnpm build` does the rest.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License and credits

The code is released under the [MIT License](LICENSE).

The licence covers the code only:

- The doodad descriptions are © their authors under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), from
  sc2-asset-catalog.
- The gallery pictures are Editor screenshots of Blizzard Entertainment's
  assets, kept for reference. StarCraft is a trademark of Blizzard
  Entertainment, and this site is not affiliated with it.
