# StarCraft 2 Mapping Reference

A browsable reference for people making StarCraft II maps. It shows pictures of
what the Map Editor has to offer, so you can see an asset before you hunt for it
in the Editor's lists:

- **Cliffs**: every cliff type.
- **Doodads**: every doodad, with a plain-words search.
- **Tilesets**: every tileset.
- **Terrain**: every terrain texture.
- **Sets**: the cinematic sets Blizzard's campaign cutscenes are filmed in, with
  a plain-words search.

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
- **Plain-words set search.** On the Sets page, describe the place your scene is
  in ("the bridge of a small starship", "a jungle clearing at night") and get the
  cutscene sets whose looks fit. It works as the doodad search does (exact
  matches first, the same checkboxes and certainty slider), and the kind chips
  (room, exterior, space, props, effects) narrow it to those kinds.
- **A page for each set**: its look, facets, what it could stand in for, the
  places in it, how sure the look is and what is wrong with its pictures, and the
  Cutscene Editor files it is in; then each picture (a Blender render) beside the
  same view filmed in game, and the set's plan and overview, in the lightbox.
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

The plain-words doodad and set searches need their index first. Build it once (about 40 s,
and it downloads the embeddings model the first time):

```bash
pnpm build-search-index
```

Without `.search/` the Doodads and Sets pages still work with the name filter,
but the semantic matches don't appear.

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
locally. Without any, the app runs, and the doodad and set searches work without
Jev ranking or limits.

| Variable                                      | What it does                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `TYPESAFE_API_KEY`                            | Lets the search call Jev, the model that grades how well each candidate doodad fits an ask (about $0.0013 an ask). Without it, results come in the narrowing's order. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN`        | An [Upstash Redis](https://upstash.com/) REST endpoint, where the limits below are kept. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` work too. Without Redis there is no rate limit and Jev isn't called. |
| `DOODAD_SEARCH_RATE_LIMIT`                    | Asks a minute one IP may make, of the doodad and set searches together. Default `20`.                                                     |
| `DOODAD_SEARCH_DAILY_BUDGET`                  | US dollars Jev may spend per UTC day, on both searches together. Default `1`. Once spent, results come in the narrowing's order until midnight UTC. |

Jev is only called when both `TYPESAFE_API_KEY` and Redis are set. Changing a
limit takes a restart or redeploy.

## How the data is built

**Galleries.** Each gallery is a folder of pictures in `public/` (`cliffs`,
`doodads`, `tilesets`, `terrain`), a thumbnail (`*_tn.jpg`) beside each full-size
picture, and a list in the matching `app/(gallery)/<name>/<name>-list.ts`. The
pictures are Editor screenshots and the lists are checked in; no script in this
repo generates them. To add an asset, add its two pictures and a list entry
(`name`, `url`, `tags`).

**Sets.** The sets' pictures are in `public/sets/<set id>/` (`card/<n>.jpg`, its
in-game frame `card/<n>-game.jpg`, `plan.jpg` and `overview.jpg`, each with a
`_tn` thumbnail), and their looks come from `@team-antioch/sc2-asset-catalog`'s
`data/set-looks.json`. The Sets page and each set's page are built from the looks
at build time, with the pictures served from this site.

**Search index.** `pnpm build-search-index` (run by `pnpm build`) runs
`scripts/build-search-index.mjs`, which writes `.search/` (git-ignored):

1. copies the shipped doodad descriptions, "Doodad Uses" and set looks out of
   [`@team-antioch/sc2-asset-catalog`](https://github.com/TeamAntioch/sc2-asset-catalog);
2. extracts the catalog's fields (names, packages, categories, tilesets) from
   SC2Mapster's SC2GameData, listing the gallery from this checkout's
   `public/doodads` so the catalog matches the pictures being deployed;
3. downloads the gte-small embeddings model;
4. embeds every doodad card and every set card, so a request only has to embed
   its own ask. It stops if a set has no folder in `public/sets`.

At run time `GET /api/doodad-search?q=<ask>` reads only `.search/`. It narrows
candidates by keyword and embeddings
([`@team-antioch/sc2-doodad-finder`](https://github.com/TeamAntioch/sc2-asset-catalog)),
then has Jev grade them when the key and budget allow.

`GET /api/set-search?q=<ask>` does the same for sets with
[`@team-antioch/sc2-set-finder`](https://github.com/TeamAntioch/sc2-asset-catalog),
cut to the best 24; `&kind=room,exterior` keeps only those kinds. Both routes
translate asks in other languages first (with `VERCEL_API_GATEWAY_KEY`), and
share one per-IP rate limit and one daily Jev budget. `?warm` loads either
search without asking anything. `next.config.mjs` ships each route's part of
`.search/` and ONNX Runtime's Linux addon with it, for Vercel.

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
