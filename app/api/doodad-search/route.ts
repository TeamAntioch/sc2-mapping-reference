// GET /api/doodad-search?q=<ask>: doodads for a plain-words ask, best first (lib/doodad-search).
// Every ask counts against its IP's rate limit; Jev is called only within today's budget.

import { type NextRequest, NextResponse } from "next/server";

import { openLimits } from "@/lib/doodad-search/limits";
import { searchDoodads } from "@/lib/doodad-search/search";

export const dynamic = "force-dynamic";

const limits = openLimits();

/** The caller's address as Vercel's proxy gives it. */
const clientIp = (request: NextRequest): string =>
  request.headers.get("x-real-ip") ??
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

export async function GET(request: NextRequest) {
  const ask = request.nextUrl.searchParams.get("q")?.trim() ?? "";
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
    return NextResponse.json(await searchDoodads(ask, limits.budget), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("[doodad-search] search failed:", error);
    return NextResponse.json(
      { error: "The search couldn't run" },
      { status: 500 },
    );
  }
}
