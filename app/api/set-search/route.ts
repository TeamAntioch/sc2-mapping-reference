// GET /api/set-search?q=<ask>: cinematic sets for a plain-words ask, best first (lib/set-search).
// &kind=room,exterior keeps only sets of those kinds. As /api/doodad-search does, every ask counts
// against its IP's rate limit, and Jev is called only within today's budget: the two searches share
// both (lib/search-limits). GET /api/set-search?warm loads the search on this instance without
// asking anything.

import { type NextRequest, NextResponse } from "next/server";

import { openLimits } from "@/lib/search-limits";
import { kindsParam, searchSets, warmSetSearch } from "@/lib/set-search/search";

export const dynamic = "force-dynamic";

const limits = openLimits();

/** The caller's address as Vercel's proxy gives it. */
const clientIp = (request: NextRequest): string =>
  request.headers.get("x-real-ip") ??
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.has("warm")) {
    const started = performance.now();
    try {
      await warmSetSearch();
      return NextResponse.json(
        { warm: true, ms: Math.round(performance.now() - started) },
        { headers: { "cache-control": "no-store" } },
      );
    } catch (error) {
      console.error("[set-search] warm-up failed:", error);
      return NextResponse.json({ warm: false }, { status: 500 });
    }
  }

  const ask = params.get("q")?.trim() ?? "";
  if (!ask)
    return NextResponse.json(
      { error: "Ask for something with ?q=" },
      { status: 400 },
    );

  const rate = await limits.rate(clientIp(request));
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Too many searches: try again in ${rate.retryAfter} s` },
      { status: 429, headers: { "retry-after": String(rate.retryAfter) } },
    );
  }

  try {
    return NextResponse.json(
      await searchSets(ask, kindsParam(params.get("kind")), limits.budget),
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[set-search] search failed:", error);
    return NextResponse.json(
      { error: "The search couldn't run" },
      { status: 500 },
    );
  }
}
