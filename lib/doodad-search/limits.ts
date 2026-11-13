// What keeps the public doodad search from running up a bill or being hammered: a per-IP rate limit
// on every ask, and a daily budget on Jev shared by every function instance. Both live in the
// project's Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN).
//
// The two fail differently when Redis can't be reached. The rate limit lets the ask through, since
// narrowing costs nothing but compute. The budget refuses, so an outage never means unmetered Jev
// calls: the ask is answered in the narrowing's order instead.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** US dollars a UTC day may spend on Jev unless DOODAD_SEARCH_DAILY_BUDGET says otherwise. */
export const DEFAULT_DAILY_BUDGET = 1;
/** Asks a minute one IP may make unless DOODAD_SEARCH_RATE_LIMIT says otherwise. */
export const DEFAULT_RATE_LIMIT = 20;

const PREFIX = "doodad-search";
/** Spend is counted in millionths of a dollar, so INCRBY stays on integers. */
const MICRO = 1e6;

const positiveNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return value !== undefined &&
    value.trim() !== "" &&
    Number.isFinite(parsed) &&
    parsed >= 0
    ? parsed
    : fallback;
};

export type RateCheck =
  { readonly ok: true } | { readonly ok: false; readonly retryAfter: number };

export type DailyBudget = {
  readonly limit: number;
  /** Whether another Jev call is allowed today, and if not, why. */
  check(): Promise<
    | { readonly allowed: true }
    | { readonly allowed: false; readonly reason: string }
  >;
  record(cost: number): Promise<void>;
};

export type Limits = {
  rate(ip: string): Promise<RateCheck>;
  readonly budget: DailyBudget;
};

/** Today's spend key: one per UTC day, kept two days so a late write to yesterday's can't linger. */
const spendKey = (now: Date = new Date()): string =>
  `${PREFIX}:spend:${now.toISOString().slice(0, 10)}`;

function redisFromEnv(env: NodeJS.ProcessEnv): Redis | undefined {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : undefined;
}

export function openLimits(env: NodeJS.ProcessEnv = process.env): Limits {
  const redis = redisFromEnv(env);
  const budgetLimit = positiveNumber(
    env.DOODAD_SEARCH_DAILY_BUDGET,
    DEFAULT_DAILY_BUDGET,
  );
  const perMinute = Math.max(
    1,
    Math.floor(
      positiveNumber(env.DOODAD_SEARCH_RATE_LIMIT, DEFAULT_RATE_LIMIT),
    ),
  );

  if (!redis) {
    // Without the store there is nothing shared to count against: no rate limit, and no Jev.
    return {
      rate: async () => ({ ok: true }),
      budget: {
        limit: budgetLimit,
        check: async () => ({
          allowed: false,
          reason:
            "no shared budget is configured (KV_REST_API_URL), so Jev isn't called",
        }),
        record: async () => {},
      },
    };
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(perMinute, "1 m"),
    prefix: `${PREFIX}:rate`,
    analytics: false,
  });

  return {
    async rate(ip) {
      try {
        const { success, reset } = await ratelimit.limit(ip);
        return success
          ? { ok: true }
          : {
              ok: false,
              retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
            };
      } catch (error) {
        console.error(
          "[doodad-search] rate limit unavailable, letting the ask through:",
          error,
        );
        return { ok: true };
      }
    },
    budget: {
      limit: budgetLimit,
      async check() {
        try {
          const spent =
            Number((await redis.get<number>(spendKey())) ?? 0) / MICRO;
          return spent < budgetLimit
            ? { allowed: true }
            : {
                allowed: false,
                reason: `today's Jev budget of $${budgetLimit.toFixed(2)} is spent, so results are in the narrowing's order until midnight UTC`,
              };
        } catch (error) {
          console.error(
            "[doodad-search] budget unavailable, not calling Jev:",
            error,
          );
          return {
            allowed: false,
            reason:
              "the budget can't be checked right now, so Jev isn't called",
          };
        }
      },
      async record(cost) {
        if (!(cost > 0)) return;
        const key = spendKey();
        try {
          await redis
            .pipeline()
            .incrby(key, Math.ceil(cost * MICRO))
            .expire(key, 2 * 24 * 60 * 60)
            .exec();
        } catch (error) {
          console.error(
            `[doodad-search] couldn't record $${cost} of Jev spend:`,
            error,
          );
        }
      },
    },
  };
}
