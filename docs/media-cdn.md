# Media out of git: options and a plan

Status: proposal, nothing built, nothing moved. Written 2026-11-24.

## The problem

All of the site's pictures and clips are checked in under `public/`, and they are nearly all of the repository:

| Folder              | Files      | Size        | What                                                     |
| ------------------- | ---------- | ----------- | -------------------------------------------------------- |
| `public/doodads`    | 4,682      | 880 MB      | doodad pictures and `_tn` thumbnails                     |
| `public/terrain`    | 3,048      | 747 MB      | terrain textures                                         |
| `public/effects`    | 5,253      | 174 MB      | picture, thumbnail, clip and key-frame strip per effect, and `media.json` |
| `public/tilesets`   | 1,700      | 117 MB      | tileset pictures                                         |
| `public/cliffs`     | 216        | 50 MB       | cliff pictures                                           |
| `public/sets`       | 1,066      | 32 MB       | cinematic set pictures                                   |
| **All of `public/`** | **15,967** | **2.07 GB** | 14,651 JPEGs, 1,313 MP4s, 2 SVGs, 1 JSON                 |

Measured on main at e3ebd24c:

- **`.git` is 1.9 GB, and the media is all of it.** Every media blob ever committed comes to 15,902 blobs and 2.00 GB on disk. Everything else in history comes to 192 blobs and 0.4 MB, plus 0.9 MB of trees and commits. History holds almost no deleted media yet. It is the current media, once.
- **Each Vercel deploy carries it.** In the latest production build, cloning took 38 s and "Deploying outputs" 19 s of the 2 min 48 s. Each deployment also stores its own 2 GB copy, so the project's Deployment Storage ran 53 to 68 GB a day this month (it costs $0.03 a month today, but it grows with each deployment kept).
- **The video is about to grow.** The 1,313 clips are 119 MB now (91 KB average, 1.5 MB at most). The tour is being re-filmed at higher quality (sc2-adjutant thread `adrianbw-tour-video-quality`). That's sized here at about 1 GB more. Committed, every re-film adds a full copy of the video to `.git` for good.

So the target is about **3.1 GB stored**, growing, kept out of the checkout.

### Traffic and current usage

Read with the Vercel CLI for the 30 days to 2026-11-24. The MCP connection wasn't authorized for the team's scope, so this came from `vercel api /v1/billing/charges` instead.

- Team Antioch is on **Pro**. The production domain is `screference.antioch.games`, and `antioch.games` uses **Vercel's nameservers**.
- This project transferred **3.5 GB** in **373,382 CDN requests** (pages included). Function invocations: 321. Billed: $0.00. All of it is inside Pro's included usage.
- The site serves media with `cache-control: public, max-age=0, must-revalidate`, so a browser revalidates each picture and clip on every view. Range requests already work (`206`, `accept-ranges: bytes`).

The sizing guesses below:

- **Now:** about 3 GB a month of media.
- **After the re-film:** 10 to 30 GB a month. The clips get about 4 times bigger, and the effects page is new.
- **A spike:** 500 GB in a month, for example a link on a big forum.

## What depends on the files being in git

Moving the files isn't only a matter of changing URLs. Four things read them from this repository:

1. **The site's pages** use paths on the site itself: `/doodads/<file>` (`app/page.tsx`, `app/components/palette-panel.tsx` and the gallery pages, through the `*-list.ts` files), `EFFECT_MEDIA_BASE = "/effects"` (`lib/effect-search/effects.ts`), `SET_PICTURES_BASE = "/sets"` (`lib/set-search/sets.ts`), and `fetch("/effects/media.json")` (`app/(gallery)/effects/effect-viewer.tsx`).
2. **The build** reads `public/`. `scripts/build-search-index.mjs` lists `public/doodads` to stand in for the catalog's gallery listing. It also throws if a set has no folder in `public/sets`, or an effect has no picture in `public/effects`.
3. **sc2-asset-catalog's published packages link to the files on GitHub.** `CLIFF_GALLERY_URL`, `DOODAD_GALLERY_URL`, `EFFECT_GALLERY_URL`, `SET_GALLERY_URL` and `TEXTURE_GALLERY_URL` are all `https://raw.githubusercontent.com/TeamAntioch/sc2-mapping-reference/main/public/<folder>`. They are in versions 0.2.0 to 0.5.0, which had 1,745 downloads in the last month. Most of the helpers take a `base` override, but two places don't:
   - `pictureOf` in `catalog/doodad-search.ts` (line 553) builds the doodad search's picture URL from `DOODAD_GALLERY_URL` directly, with no override. sc2-adjutant's doodad search page puts that URL in its `<img>` tags, and its tests pin it.
   - sc2-research's `asset-catalog/build-review.py` hard-codes the doodad URL.
4. **The catalog lists the gallery from this repository's tree.** `galleryFileNames` (`catalog/extract-catalog.ts`) asks GitHub's API for `git/trees/main?recursive=1`, falling back to a blobless git clone, and keeps the files under `public/doodads/` (and `public/cliffs/`, `public/tilesets/` for the cliff and texture extractors). It runs:
   - in sc2-adjutant's `extract-catalog.mjs`;
   - in the Doodad Finder's `ensureCatalog` on **every installed copy's first run**.

   If the folders leave main's tree, the listing comes back empty and doesn't fail. Every doodad quietly loses its picture.

Points 3 and 4 are why the catalog has to move first (see [The catalog's links](#3-the-catalogs-links)).

## 1. Candidates

Prices are list prices checked on 2026-11-24 (sources at the end). The scenarios are 3.1 GB stored, and 30 GB / about 1 M requests a month, with a 500 GB spike month.

| | Vercel Blob (public) | Cloudflare R2 + custom domain | S3 + CloudFront | Bunny Storage + CDN |
|---|---|---|---|---|
| **Storage** | $0.023/GB-mo → $0.07 | $0.015/GB-mo, first 10 GB free → **$0** | $0.023/GB-mo → $0.07 | $0.01–0.02/GB-mo a region → $0.03–0.06 |
| **Egress** | Blob Data Transfer $0.05/GB on demand. Pro's docs say the team's 1 TB Flat Rate CDN covers it, but Vercel's pages disagree on Pro's allowances (see the note below the table) | **free**, always | CloudFront always-free tier: 1 TB and 10 M requests a month, then about $0.085/GB. S3 to CloudFront is free | $0.01/GB North America and Europe, $0.03–0.06 elsewhere |
| **Requests** | simple ops (cache misses) $0.40/M; puts and lists $5/M. A full upload of 16k files ≈ $0.08 | 1 M writes and 10 M reads a month free, then $4.50/M and $0.36/M. Cached hits don't read R2 | PUT $0.005/1k (full upload ≈ $0.08); GET on a cache miss $0.0004/1k | included |
| **Our month** | **$0–2** | **$0** | **≈ $0.10** | **$1** (the $1 monthly minimum) |
| **Spike month (500 GB)** | $0 if the 1 TB allowance covers Blob, else about $25 | $0 | $0 (under 1 TB) | about $5 |
| **Limits** | up to 5 TB a file, but blobs over 512 MB aren't cached (ours are ≤ 1.5 MB, and maybe 10 MB after the re-film) | r2.dev URLs are rate-limited and dev-only. The CDN caches files up to 512 MB on the Free plan | none that matter here | none that matter here |
| **Video** | public blobs are served through Vercel's CDN; check range requests in the spike (step 0) | Range GETs; `.mp4` is in Cloudflare's default cached extensions | Range GETs, and CloudFront caches ranges | Range GETs |
| **Custom domain** | **No native custom domain for public stores.** URLs are `<store id>.public.blob.vercel-storage.com`. A hostname we own means a rewrite through a Vercel project | **The domain must be a zone on Cloudflare** in the same account. `antioch.games` is on Vercel DNS. Partial (CNAME) setup is Business plan only, and subdomain zones are Enterprise only. So it means moving `antioch.games`'s DNS to Cloudflare or buying another domain | CNAME from Vercel DNS, with a free ACM certificate (us-east-1) | CNAME from Vercel DNS, free TLS |
| **Uploads** | `@vercel/blob` `put()` (`addRandomSuffix: false`, `allowOverwrite: true`) or `vercel blob put`. The token is `BLOB_READ_WRITE_TOKEN`, set on the project when the store is connected, and `vercel env pull` gets it locally. No sync: our script diffs against a manifest | S3 API (`@aws-sdk/client-s3`, `rclone sync`) or `wrangler r2 object put`. An R2 API token with access to one bucket | `aws s3 sync --cache-control …` only sends changed files. Keyless CI through GitHub OIDC and an IAM role | the storage HTTP API (a PUT per file with the zone's AccessKey), or its S3-compatible API |
| **New accounts** | none (the team already has a Blob store, `bettridge-database-blob`) | Cloudflare account, and the DNS move | AWS account, IAM, bucket, distribution and cert | Bunny account |
| **Lock-in** | medium. A proprietary API and the store's own hostname, but it's only files at plain paths: to leave, copy them and repoint the rewrite | low (S3 API) | low (S3 API), but AWS setup takes the longest | low to medium (its own upload API) |

On Vercel's Pro allowances for Blob: the [Blob pricing page](https://vercel.com/docs/vercel-blob/usage-and-pricing) lists Pro as "usage-based" with a monthly credit. The [Blob guide](https://vercel.com/kb/guide/vercel-blob) says Blob Data Transfer is covered by Flat Rate CDN's 1 TB. The 2025 launch post said 5 GB storage and 100 GB transfer. At our size each reading costs less than $2 a month, so it doesn't change the choice. Check it on the team's invoice after step 1.

Considered and rejected:

- **Git LFS.** It doesn't take the media out of the checkout. Vercel's LFS support downloads every LFS file on each build. GitHub's free org quota is 10 GB of bandwidth a month, and each 3 GB build would use it up. raw.githubusercontent.com serves the pointer files, not the content, so it would break the catalog's links as well.
- **A second git repository for the media** (served from GitHub Pages or raw URLs). That moves the problem without solving it. Pages has a 1 GB soft limit, and raw.githubusercontent.com isn't a CDN for production.
- **Backblaze B2 behind Cloudflare.** Its free egress needs the same Cloudflare zone as R2, and R2 is simpler.
- **A static media-only Vercel project** (a folder deployed with `vercel deploy`). It needs no new vendor and gives instant rollbacks, but every deploy needs the whole 3 GB folder on the deploying machine, and it keeps paying Deployment Storage for each copy.

### Recommendation

**Vercel Blob (one public store), always reached through a URL we own: `https://screference.antioch.games/media/...`, rewritten to the store.**

- The costs are within a couple of dollars of each other at our size, so the choice comes down to setup and the URL.
- Blob needs no new account, no DNS move and no keys outside Vercel. It's billed with the rest of the team, and the team already runs a store.
- Its one weak point, the store's own hostname, doesn't matter if nothing ever links to it. The site and the catalog both use `/media/...` on our domain, so changing stores later means copying files and changing one rewrite. It never means another catalog release.

The runner-up is **S3 + CloudFront** at the same `/media` path (or a `media.antioch.games` CNAME). Switch to it if the spike (step 0) shows that Blob through a rewrite doesn't serve ranges or doesn't cache. Use **R2** only if `antioch.games` moves to Cloudflare DNS for some other reason. It's the cheapest, but not worth a DNS move by itself.

## 2. How the site refers to media

| Option | Verdict |
| --- | --- |
| **A base URL env var** (`NEXT_PUBLIC_MEDIA_BASE`) | It works, but puts the store's hostname into the HTML. Local dev needs it unset or pointed somewhere. Cross-origin, so `media.json` needs CORS. |
| **next.config rewrites** | **Recommended.** Pages keep same-origin paths (`/media/doodads/x.jpg`). A `fallback` rewrite sends `/media/:path*` to the store, and fallback rewrites only apply when no file in `public/` matches. |
| **A Next image loader** | Doesn't fit. The site uses plain `<img>` and `<video>`, not `next/image`. The thumbnails already exist. Vercel's image optimization is billed per transformation and doesn't cover video. |

The pieces:

- `lib/media.ts` holds one helper, `mediaUrl(folder, file)`, which returns `/media/<folder>/<file>`. Every reference listed in point 1 uses it. `EFFECT_MEDIA_BASE` becomes `/media/effects` and `SET_PICTURES_BASE` becomes `/media/sets`.
- `next.config.mjs` gets:

  ```js
  async rewrites() {
    const origin = process.env.MEDIA_ORIGIN;
    return {
      fallback: origin ? [{ source: "/media/:path*", destination: `${origin}/:path*` }] : [],
    };
  }
  ```

  `MEDIA_ORIGIN` is the store's public URL, set in the project's environment (without it, the rewrite isn't added).
- **Local dev without the CDN, at no cost.** Put a copy in `public/media/` (git-ignored) and Next serves it directly. Without one, the fallback rewrite fetches from the store. `import-effects.mjs` writes to `public/media/effects` from then on, so a fresh import shows up locally before it's uploaded.
- **Caching.** Paths stay stable: the catalog builds them from model paths and file names, so they can't carry hashes.
  - Upload with `cacheControlMaxAge` of 1 day.
  - The site adds `?v=<first 8 hex of the file's sha256>` from the manifest to its own URLs. Its views pick up a re-import at once, and browsers can keep everything else.
  - Catalog users get changes within a day.
  - This also fixes today's `max-age=0, must-revalidate`.
- **Old site paths.** After step 6, add `redirects` from `/(cliffs|doodads|effects|sets|terrain|tilesets)/:file*` (files only, so the patterns match on an extension) to `/media/...`, so links to the old paths still work.

### The manifest

`media/manifest.json` is checked in. It holds each file's path, size and sha256 (about 1.5 MB for 16k entries). It does the jobs the files in git did:

- the build checks sets and effects against it, and lists the doodad gallery from it, instead of reading `public/`;
- `scripts/upload-media.mjs` uses it to send only what changed;
- it's uploaded to the store as `/media/manifest.json`, where the catalog lists the gallery (see section 3);
- a PR that changes media shows which files changed.

## 3. The catalog's links

The old URLs are on `raw.githubusercontent.com/.../main/public/...`, a host we don't control. The only way to keep them working is to **leave the files in `public/` on main**. There's no redirect we can set there. A repo rename doesn't help either, because the site's code has to stay at this name.

The options:

- **Hard cut.** Release catalog 0.6.0 with new defaults and delete the files the same day. Every installed 0.2–0.5 copy loses its pictures at once, and every Doodad Finder that extracts afterwards silently loses its doodad pictures (point 4 above).
- **Grace period.** Release first, then remove the files a few weeks later. The checkout keeps the media for those weeks.
- **Keep the old URLs forever.** That keeps the checkout as it is, which defeats the purpose.

**Recommended: release first, then a short grace period, then accept that old versions break.** The packages are 0.x and two weeks old, and their users are mostly Team Antioch's own tools, so a few weeks is enough.

Catalog 0.6.0 would change:

1. The defaults become `https://screference.antioch.games/media/<folder>`, a URL that stays the same whichever store is behind it.
2. `pictureOf` in `doodad-search.ts` takes the `base` like the other helpers do.
3. `galleryFileNames` reads `https://screference.antioch.games/media/manifest.json` instead of GitHub's tree. That also ends the 60-an-hour API limit and the git-clone fallback.
4. The release notes, and `npm deprecate` on 0.2.0–0.5.0, say the old picture links stop working on the removal date.

Then:

- sc2-adjutant takes 0.6.0, and its doodad-search tests change to the new URL;
- sc2-research's `build-review.py` changes;
- the removal waits until the per-version download counts (`api.npmjs.org/versions/@team-antioch%2Fsc2-asset-catalog/last-week`) show 0.6 has taken over, or for 3 weeks, whichever is later.

## 4. Getting it out of the checkout

| | Remove from the tree | Rewrite history (`git filter-repo`) |
| --- | --- | --- |
| Working tree | −2.07 GB | −2.07 GB |
| `.git` in existing clones | still 1.9 GB | still 1.9 GB until re-cloned |
| A fresh full clone | still 1.9 GB (the media is in history) | **under 5 MB** |
| Vercel's clone | small once its shallow clone no longer reaches a commit with media | small at once |
| Reversible | yes: `git revert` brings the files back | only by force-pushing the backup, and only until new work is built on the new history |

A fresh clone can skip historical blobs with `git clone --filter=blob:none`, which is worth putting in CONTRIBUTING either way. But only a rewrite makes `.git` small for everyone, and it stays small when the re-filmed video lands.

What a rewrite costs here:

- **Open branches: none to save.** All 13 remote branches are merged into main, and the two that aren't ancestors (`llm-doodad-search`, `scifi-theme`) were merged as PRs #3 and #4. There are no open PRs. Delete the stale branches first, and only main (and this branch, once merged) gets rewritten.
- **Forks: none** (`forkCount` is 0). Nobody outside has to rebase.
- **Local worktrees: 8.** Each needs its branch landed or dropped, then a fresh clone (or `git fetch && git reset --hard origin/main` per branch).
- **What stays the same:**
  - Every commit SHA changes. Links to commits in old PRs and issues still open, because GitHub keeps PR refs (`refs/pull/*`) and the objects they reach. That also means GitHub's stored size won't shrink without asking GitHub Support. Clones don't fetch those refs, so they're small anyway.
  - Vercel's existing deployments keep working, and instant rollback uses the stored deployment, not a rebuild.
- **Old commits no longer build** (their media is gone). Nothing rebuilds old commits.
- **The CDN becomes the only copy of the media**, unless we keep one. Before rewriting, take a mirror clone (`git clone --mirror`, 1.9 GB) and keep it somewhere durable: a private archive repository, or an external drive.

**Recommendation: rewrite, once, as the last step.** It's as cheap now as it will ever be: one maintainer, no forks, no open work. Each re-film it waits for adds another copy of the video to the history it removes.

The rewrite command:

```bash
git filter-repo --invert-paths \
  --path public/cliffs --path public/doodads --path public/effects \
  --path public/sets --path public/terrain --path public/tilesets
```

`public/next.svg` and `public/vercel.svg` are left alone.

## 5. Migration plan

Each step is its own PR or action, and each leaves the site working. Steps marked **(ask)** create resources or change Vercel settings, so they wait for a yes.

| # | Step | Undo |
|---|---|---|
| 0 | **(ask) Spike.** Create one public Blob store, `sc2-mapping-reference-media`, and connect it to the project, which adds `BLOB_READ_WRITE_TOKEN`. Upload one JPEG, one MP4 and `media.json`. On a preview deployment with the fallback rewrite, check: `Range: bytes=0-99` gives `206`, the second request shows `x-vercel-cache: HIT`, `content-type` is right, and the clip plays and seeks in Safari and Chrome. If any check fails, run the same spike on S3 + CloudFront instead. | Delete the store. Nothing serves from it. |
| 1 | **Copy up.** Add `scripts/upload-media.mjs` (it walks the media folders, hashes them, diffs against `media/manifest.json`, `put()`s what changed with a 1-day max age, and rewrites the manifest), then commit the manifest. Upload all of `public/<folder>` to the store at the same relative paths (`doodads/...`, `effects/...`). Check it with `list()` against the manifest. About $0.08 in operations. | Nothing reads the store yet. Delete its contents. |
| 2 | **(ask: sets `MEDIA_ORIGIN` on the project) The site reads `/media`.** Add `lib/media.ts` and the fallback rewrite, and move every reference in point 1 to `/media/...` with `?v=`. The files are still in `public/<folder>`, so the old paths keep working. Check that every gallery, a set page and an effect clip load on the preview, with no 404s in the network panel. | Revert the PR. |
| 3 | **The build stops reading `public/`.** `build-search-index.mjs` reads the manifest for the doodad listing and the set and effect checks. `import-effects.mjs` writes to `public/media/effects`. Add `pnpm upload-media`. Update the README's "How the data is built". | Revert the PR. |
| 4 | **Catalog 0.6.0** (in sc2-asset-catalog): the new defaults, `pictureOf`'s base, the gallery listing from the manifest, and `npm deprecate` on 0.2–0.5. Then sc2-adjutant and sc2-research move to it. | Publish 0.6.1 with the old defaults. They still work, because the files are still on main. |
| 5 | **Grace period.** At least 3 weeks, and until the per-version download counts show 0.6 has taken over. Announce the removal date. | n/a |
| 6 | **Remove from the tree.** `git rm -r public/{cliffs,doodads,effects,sets,terrain,tilesets}`, git-ignore `public/media/`, add the old-path redirects, and add a `--filter=blob:none` note to CONTRIBUTING. Old catalog versions' links break here. | `git revert` brings the files back, and old URLs work again. |
| 7 | **The re-filmed tour lands.** Run `import-effects.mjs`, then `upload-media`, and commit the manifest. Git grows by the manifest diff only. | Upload the previous files again. They're in the mirror clone, or in history until step 8. |
| 8 | **(ask) Rewrite history.** Take the mirror clone and store it. Delete the merged remote branches. Run `filter-repo`, force-push main, re-clone the worktrees, and turn on "Automatically delete head branches" if it isn't on. | Force-push the mirror back. Only clean before any new work is built on the rewritten main. |

Steps 0–3 change nothing for catalog users. Step 6 is the one that breaks old catalog versions. Step 8 is the one that's hard to undo.

## Sources

- Vercel Blob: [usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing), [the complete guide](https://vercel.com/kb/guide/vercel-blob), [SDK reference](https://vercel.com/docs/vercel-blob/using-blob-sdk), [CLI](https://vercel.com/docs/vercel-blob/manage-blob-storage), [private storage and custom domains](https://vercel.com/docs/vercel-blob/private-storage), [Vercel pricing](https://vercel.com/docs/pricing)
- Cloudflare R2: [pricing](https://developers.cloudflare.com/r2/pricing/), [public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/), [limits](https://developers.cloudflare.com/r2/platform/limits/), [caching R2](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)
- AWS: [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/), [flat-rate plans](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html)
- Bunny: [storage pricing](https://bunny.net/docs/storage/pricing), [CDN pricing](https://bunny.net/pricing/cdn/)
- GitHub: [Git LFS billing](https://docs.github.com/billing/managing-billing-for-git-large-file-storage/about-billing-for-git-large-file-storage)
- Measured here: `git cat-file --batch-check` over `git rev-list --all --objects`; `vercel api /v1/billing/charges` (2026-10-24 to 2026-11-24); `vercel inspect --logs` for dpl_7QXbgF15CkxA1oJQ86DJ5d8v4QEA; `curl -H 'Range: bytes=0-99'` against the site and raw.githubusercontent.com.
