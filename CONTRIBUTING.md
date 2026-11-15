# Contributing

Thanks for helping. Small fixes can go straight to a pull request; for anything
bigger, open an issue first so we can agree on the approach.

## Setup

Follow [Running it locally](README.md#running-it-locally). You need Node.js
22.18+ and pnpm 12.18.0. Use pnpm only: `pnpm-lock.yaml` is the lockfile that
counts.

## Making a change

1. Fork the repo and branch from `main`.
2. Make your change, keeping it focused: one idea per pull request.
3. Run `pnpm lint` and `pnpm exec tsc --noEmit`. Run `pnpm build` too if you
   touched the search, `next.config.mjs` or `scripts/`.
4. Open the app in a browser and try your change, including at phone width and
   with the keyboard if you touched the UI.
5. Open a pull request against `main`. Say what changed and why, and add a
   screenshot for visual changes.

## Guidelines

- TypeScript, formatted like the code around it.
- Style with Tailwind classes; reuse the existing console look (`font-display`,
  cyan accents) rather than adding new patterns.
- Keep it accessible: labels on icon-only controls, visible focus, no
  information carried by colour alone.
- Don't commit secrets or `.env*` files. The search works without any keys.
- Don't commit `.search/`; it is built.

## Adding or fixing gallery entries

Galleries live in `public/<cliffs|doodads|tilesets|terrain>/`. Each asset has a
full-size `Name.jpg` and a thumbnail `Name_tn.jpg`, and an entry in
`app/(gallery)/<name>/<name>-list.ts`. If you add a doodad, run
`pnpm build-search-index` so the search sees it.

Only submit screenshots you took yourself in the StarCraft II Editor.

## Licence

By contributing you agree your contribution is released under the project's
[MIT License](LICENSE).
