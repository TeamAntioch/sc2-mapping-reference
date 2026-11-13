This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Doodad search

The doodads page searches in plain words through `/api/doodad-search`, using
[`@team-antioch/sc2-doodad-finder`](https://github.com/TeamAntioch/sc2-asset-catalog).
The other galleries keep the comma-separated name filter.

- **Build.** `pnpm build` first runs `scripts/build-search-index.mjs`. It writes
  `.search/` (git-ignored): the catalog extracted from SC2GameData (with the
  gallery listed from this checkout's `public/doodads`), the gte-small
  embeddings model, and every card's vector. `next.config.mjs` ships that
  folder and ONNX Runtime's Linux addon with the route. It takes about 40 s.
- **Ranking.** With `TYPESAFE_API_KEY` set, Jev ranks the narrowed candidates
  (about $0.0013 an ask). Without it, results come in the narrowing's order.
- **Limits.** They are kept in the project's Upstash Redis (`KV_REST_API_URL`,
  `KV_REST_API_TOKEN`):
  - every ask counts against a per-IP rate limit, `DOODAD_SEARCH_RATE_LIMIT`
    asks a minute (20 by default);
  - Jev is called only while the UTC day's spend is under
    `DOODAD_SEARCH_DAILY_BUDGET` US dollars (1 by default).

  Without Redis there is no rate limit and Jev isn't called. Changing either
  limit takes a redeploy.

The doodad descriptions are © their authors under CC BY 4.0, from
sc2-asset-catalog. The gallery pictures are Editor screenshots of Blizzard's
assets, kept for reference. This site is not affiliated with Blizzard
Entertainment.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
