# Proxy Hardening Spec — Weather Proxy (Denial-of-Wallet)

> **Status: DOCUMENT ONLY (plan decision D4 / §6 Worker M).**
> Nothing in this file has been deployed, and no change to the proxy or the app
> has been applied. This is an implementation spec for the **human owner** to
> apply to the proxy, which lives in a **separate repo** the owner controls
> (a Vercel serverless/edge function). All facts below were verified during the
> 2026-07 review. Code sketches are illustrative and self-contained; adapt to the
> proxy repo's actual structure before deploying.

---

## 1 · Threat summary (for the owner)

**Endpoint:** `https://open-weather-proxy-pi.vercel.app/api/v1/get-weather`
**Called as:** `GET .../get-weather?lat=<lat>&long=<lon>&lang=<locale>`

Verified posture of the proxy today:

| Property | Observed | Consequence |
| --- | --- | --- |
| Authentication | **None** — anyone can call it | Open relay to your paid weather API |
| CORS | `access-control-allow-origin: *` | Any website can embed it from a browser |
| Rate limiting | **No rate-limit headers, no throttling observed** | Unbounded request volume per client |

**The threat is denial-of-wallet, not data exposure.** The proxy fronts the
owner's metered upstream weather API (OpenWeather). Because it is unauthenticated
and unthrottled, a third party who discovers the URL (it ships in the app bundle
and is a plain public URL) can script millions of requests and **run up the
owner's upstream API bill / burn the monthly quota**, degrading service for real
users. The response data itself is low-sensitivity public forecast data — the
asset at risk is the **API quota / wallet**, and the availability of the service.

**What is NOT the threat:** leaking secrets (there are none in the response) or
CORS-based data theft (forecasts are public). This matters because it tells us
the **rate limit is the primary control**; CORS and an app token are
defense-in-depth that raise attacker effort but do not, by themselves, stop a
determined scripted attacker.

**Who calls the proxy (so we don't break them):**

- **iOS native** and **Android native** (app + home-screen widget). Native
  `fetch` does **not** send an `Origin` header and **ignores CORS entirely** —
  CORS changes can never break native clients.
- **Web demo** — the Expo web build hosted at **`https://dualtemp-weather.netlify.app/`**.
  This is the only browser client, and the only origin that needs to be on a
  CORS allowlist. (Confirmed read-only: the marketing site in this repo's
  `website/` directory does **not** call the proxy at all — it is a static
  Next.js landing page. The proxy-calling web app is the Netlify-hosted Expo web
  export above. Verify the exact deployed origin(s), incl. any custom domain or
  Netlify preview domains, before locking CORS.)

---

## 2 · How the app already handles a 429 (verified, read-only)

This is load-bearing for the proxy response shape. Source of truth:
`src/utils/fetchWeather.ts` and `src/utils/errors.ts`.

**Client 429 path (`fetchWeather.ts`):**

```ts
} else if (response.status === 429) {
  error = new RateLimitError(data?.retryAfter);
}
```

`data` is the **parsed JSON body** of the response (`parseJsonSafely(rawBody)`).
So the client reads a **numeric `retryAfter` field from the JSON body** — it does
**NOT** read the HTTP `Retry-After` header. Two consequences the proxy must honor:

1. To give users the precise "wait N seconds" message, the **429 body must be
   JSON** containing `{ "retryAfter": <seconds:number> }`. If the body is
   non-JSON (Vercel/Upstash default plaintext) or omits the field,
   `data?.retryAfter` is `undefined` and the user sees the generic fallback
   message instead — still correct, just less specific.
2. Also set the standard **`Retry-After: <seconds>`** header regardless. The app
   ignores it, but CDNs, proxies, and any future/native retry logic respect it,
   and it's the HTTP-correct thing to do.

**`RateLimitError` behavior (`errors.ts`):**

```ts
export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Too many requests. Please wait ${retryAfter} seconds.`
      : 'Too many requests. Please slow down and try again.';
    super('Rate limit exceeded', 429, message);
    this.code = 'RATE_LIMIT';
  }
}
```

`ApiError` sets `recoverable = statusCode >= 500`, so for status **429
`recoverable` is `false`** — the app shows the message but **no Retry button**.
Additionally, every 429 is reported to Sentry **exactly once** (tag
`error_type: "weather_api_error"`, `api_status: 429`).

**Design implication:** rate-limiting a legitimate user is a hard, non-recoverable
dead end in the UI *and* generates a Sentry event. Therefore the enforced
threshold **must sit comfortably above real per-client peak usage** — never
tune it down to where ordinary users trip it. (See rollout, §4.)

---

## 3 · Implementation options (Vercel, self-contained sketches)

All sketches target a Vercel **Edge Function** (lowest latency, and
`@upstash/ratelimit` supports it). A Node serverless function works the same way;
the only difference is how you read the client IP and return the `Response`.

### Option 1 — Per-IP token-bucket rate limit (primary control)

Two ways to do this. **1A (Upstash Redis via `@upstash/ratelimit`)** is the
recommended, portable approach. **1B (Vercel Firewall rule)** is a no-code
alternative if the project is on a plan that includes WAF rate-limiting.

#### 1A · Upstash Redis token bucket

Provisioning note: **"Vercel KV" is now provisioned through the Vercel
Marketplace as Upstash Redis** (Vercel deprecated the first-party KV product).
Whether you add "Redis" from the Vercel Marketplace or create an Upstash Redis DB
directly, you get the same `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
env vars used below. **Free-tier note:** Upstash's free plan is a per-month
command budget (historically ~10k commands/day; verify the current figure). A
per-IP hourly limit at this app's low request rate fits the free tier easily —
each check costs only a couple of Redis commands. If cost is a concern, prefer
`slidingWindow`/fixed-window (cheapest) over analytics-on token bucket.

```ts
// proxy repo: api/v1/get-weather.ts  (Vercel Edge Function)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = Redis.fromEnv(); // UPSTASH_REDIS_REST_URL / _TOKEN

// Token bucket: capacity 20 (burst), refills 1 token every 60s => 60 req/hr
// sustained per IP. Bursts of up to 20 are absorbed; sustained rate is capped.
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(1, "60 s", 20),
  prefix: "wx", // keep proxy keys namespaced
  analytics: false, // set true only if you want the Upstash dashboard counters
});

function clientIp(req: Request): string {
  // Vercel populates x-forwarded-for; take the first (client) hop.
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

export default async function handler(req: Request): Promise<Response> {
  const ip = clientIp(req);

  // FAIL OPEN (§4 step 2 invariant): if Redis is unreachable, @upstash/ratelimit
  // rejects — without this try/catch the handler would throw, Vercel would
  // return 500, and a Redis outage would take the weather app down. On limiter
  // failure we serve the request unthrottled instead.
  let verdict: { success: boolean; limit: number; remaining: number; reset: number };
  try {
    verdict = await ratelimit.limit(ip);
    // If analytics: true, flush pending writes without blocking the response:
    // ctx.waitUntil(verdict.pending)  (edge handler's 2nd arg / RequestContext).
  } catch (err) {
    console.warn("rate limiter unavailable — failing open", err);
    verdict = { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  const { success, limit, remaining, reset } = verdict;

  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return new Response(
      // JSON body with `retryAfter` (seconds) — REQUIRED for the app's
      // RateLimitError(data.retryAfter) to show "wait N seconds" (§2).
      JSON.stringify({
        message: "Rate limit exceeded. Please slow down.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retryAfter),           // HTTP-standard header
          "x-ratelimit-limit": String(limit),
          "x-ratelimit-remaining": String(remaining),
          "x-ratelimit-reset": String(reset),          // epoch ms
        },
      }
    );
  }

  // ...existing proxy logic: read lat/long/lang, call upstream, return JSON...
  // (unchanged)
}
```

Caveats to keep the limit from over-blocking real users:

- **CGNAT / shared IPs:** mobile carriers and corporate NATs put many real users
  behind one public IP. A too-tight per-IP limit will collectively block them.
  This is a second reason to keep the threshold generous (§4) — or to combine
  per-IP with a broader global ceiling rather than tightening per-IP.
- **`x-forwarded-for` spoofing:** on Vercel the platform sets this header from the
  real connection, so trust it; do not accept a caller-supplied XFF from your own
  code paths.
- **Fail open on limiter failure (§4 step 2 invariant):** keep the try/catch
  around `ratelimit.limit()` — a Redis outage must degrade to "unthrottled" (serve
  the request), never to a 500 that takes the weather app down. If you enable
  `analytics: true`, flush the returned `pending` promise via
  `ctx.waitUntil(verdict.pending)` instead of awaiting it in the request path.

#### 1B · Vercel Firewall rate-limit rule (no-code alternative)

If the project is on a plan that includes WAF rate-limiting, configure a Vercel
**Firewall** rule scoped to path `/api/v1/get-weather` — e.g. "rate limit by IP,
N requests per 60s, action: deny (429)". This needs **no Redis and no code
change**, and runs before the function (so it also saves function invocations).
Downsides vs 1A: the 429 body/shape is platform-controlled (likely **not** the
JSON `{retryAfter}` the app wants — so users get the generic message), and
availability/limits depend on the plan tier. Reasonable as a fast first line;
1A gives you control over the response shape.

### Option 2 — CORS allowlist (defense-in-depth, browser-only)

CORS only constrains **browser** callers; it does nothing against scripted/native
attackers (they don't honor it). So this is not the wallet control — it just stops
casual embedding of the proxy from arbitrary third-party websites. Replace the
current `access-control-allow-origin: *` with an **echo-back allowlist** limited to
the web demo origin. Native apps send no `Origin` and are unaffected.

```ts
const ALLOWED_ORIGINS = new Set<string>([
  "https://dualtemp-weather.netlify.app",
  // add any custom domain / Netlify preview origins the web demo actually uses
]);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    // `Vary: Origin` is REQUIRED once ACAO depends on the request Origin, so
    // shared caches don't serve one origin's ACAO to another.
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin; // echo, not "*"
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "content-type, x-app-token";
    headers["Access-Control-Max-Age"] = "86400";
  }
  // Requests with no Origin (native apps, curl, server-to-server): return NO
  // ACAO header. Native fetch ignores CORS, so this does not break them; it just
  // means browsers from other origins get no cross-origin read access.
  return headers;
}

// Handle the CORS preflight explicitly:
if (req.method === "OPTIONS") {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
// ...and spread corsHeaders(req) into every real response (200 and 429 alike).
```

Note: because CORS is not a wallet control, **do not gate the request on Origin**
(i.e. do not 403 a missing/unknown Origin) — that would break native clients,
which legitimately have no Origin. Only the ACAO *header* is conditional.

### Option 3 — Optional lightweight app token (raises attacker effort)

A shared secret header `x-app-token` checked server-side. **Be honest about its
value:** the token is compiled into the app bundle and can be extracted by anyone
who unpacks the APK/IPA or reads network traffic — so it does **not** stop a
motivated attacker. It raises the effort bar (casual scrapers hitting the bare URL
get rejected) and lets you distinguish "traffic that looks like our app" from
"traffic that clearly isn't." **The rate limit (Option 1) remains the real
control.**

**Server side (proxy):**

```ts
const APP_TOKEN = process.env.WEATHER_APP_TOKEN; // set in proxy's Vercel env

// WARN-ONLY at first (see rollout §4): count/log missing-or-wrong tokens but
// still serve, so already-installed app versions (which send no token) keep
// working. Flip `ENFORCE_APP_TOKEN` to true only after §4's conditions are met.
const ENFORCE_APP_TOKEN = false;

const token = req.headers.get("x-app-token");
const tokenOk = !!APP_TOKEN && token === APP_TOKEN;
if (!tokenOk) {
  // e.g. increment a Redis counter "wx:no-token:<day>" for observability
  if (ENFORCE_APP_TOKEN) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json", ...corsHeaders(req) },
    });
  }
}
```

> Note the app maps a proxy **401** (or a message containing "401"/"Unauthorized")
> to a **non-recoverable `AuthenticationError`** ("Weather service temporarily
> unavailable"). If you ever hard-enforce the token, returning **403** (as above)
> avoids that specific auth-error copy and falls through to the app's generic
> `ApiError` path. Either way, an enforced token rejection is user-visible — which
> is exactly why enforcement must wait until old app versions have aged out (§4).

**Matching client change — SPECIFIED BUT NOT APPLIED (do not commit to this repo
as part of D4):**

In `src/utils/fetchWeather.ts`, the fetch is currently:

```ts
const response = await fetchWithTimeout(url, 10_000);
```

`fetchWithTimeout(url, timeoutMs, options?: RequestInit)` already accepts an
options arg (`src/utils/httpClient.ts`), so the one-line change is:

```ts
const response = await fetchWithTimeout(url, 10_000, {
  headers: { "x-app-token": process.env.EXPO_PUBLIC_WEATHER_APP_TOKEN ?? "" },
});
```

with `EXPO_PUBLIC_WEATHER_APP_TOKEN` added to the app's EAS/Expo env. (`EXPO_PUBLIC_`
vars are inlined into the bundle — consistent with the "extractable, effort-raising
only" caveat above.) This ships in a new app release; the proxy must stay in
warn-only mode until those releases dominate the install base.

### Option 4 — Basic anomaly alerting

Goal: know when the wallet is under attack, ideally before the bill arrives.
Layered, cheapest-first:

1. **Hard cap at the upstream provider (the ultimate backstop).** Set an
   OpenWeather (or whichever upstream) monthly call ceiling / spend cap so the
   wallet cannot be drained past a known maximum even if everything else fails.
   This is zero-risk to the app and should be done first.
2. **Daily counter + threshold alert.** Cheaply `INCR` a Redis key per day
   (`wx:count:<YYYY-MM-DD>`), and run a **Vercel Cron** function (e.g. hourly)
   that reads it and fires a webhook/email if it exceeds an expected ceiling.
   Also counts rejected/no-token requests separately for a clean "attack vs
   growth" signal.
3. **Platform signals.** Vercel **usage/spend alerts** and (on Pro) **Log Drains**
   to a sink (Datadog/Logtail/etc.) for per-request visibility and alerting on
   429 spikes or single-IP concentration.
4. **Existing client signal (secondary).** The app already emits a Sentry event
   per 429 (`weather_api_error`, `api_status: 429`). A spike there is a
   corroborating indicator, but note attack traffic won't come from the app, so
   the **server-side counter (2) is the authoritative signal**; Sentry mainly
   tells you if *legitimate users* are being over-limited.

---

## 4 · Rollout order (never breaks live apps)

Ordered so each step is either invisible to users or fails safe. **Deploy
rate-limit → observe → tighten.**

0. **Backstop first (no app risk):** set the upstream provider's hard monthly
   cap (Option 4.1). The wallet is now bounded even before any proxy change.
1. **Observe-only baseline:** deploy the daily/hourly counters (Option 4.2) with
   **no blocking**. Collect a few days of real traffic to learn the legitimate
   per-IP and global request distribution (this app polls the widget ~every
   30 min plus foreground refreshes, so legitimate per-IP/hour is low). Zero user
   impact.
2. **Rate limit, generous + fail-safe (Option 1):** deploy with the threshold set
   **well above** the observed legitimate peak (e.g. the 60/hr-with-burst-20
   default is already far above normal app usage). If the rate-limiter backend is
   unreachable, **fail open** (serve the request) rather than 429 — a Redis
   outage must not take the app down. Confirm the 429 response is the JSON
   `{retryAfter}` shape from §2. Watch the counters and Sentry 429 rate for a few
   days.
3. **CORS allowlist (Option 2):** echo the verified web-demo origin
   (`https://dualtemp-weather.netlify.app` + any real custom/preview domains),
   add `Vary: Origin`. **Native is unaffected** (no Origin). The only failure mode
   is a wrong/missing web-demo origin — so verify the live origin(s) before this
   step and load the web demo afterward to confirm it still fetches.
4. **App token in WARN-ONLY (Option 3):** deploy the server check counting
   missing/invalid tokens but still serving everyone. Ship the one-line client
   change in a new app release. **Do not enforce yet** — already-installed
   versions send no token and cannot be force-updated.
5. **Tighten:** once counters show token-bearing traffic dominates (old versions
   aged out) and the rate-limit threshold has proven safe, optionally lower the
   rate limit toward observed peaks and/or flip `ENFORCE_APP_TOKEN` to true.
   Tighten incrementally, watching the Sentry 429 rate as the guardrail for
   "are we now hurting real users?" Because an in-app 429 is **non-recoverable
   (no Retry button, §2)**, never tighten past the point where ordinary users
   start tripping it.

**Invariants that keep live apps safe throughout:**
- Native clients ignore CORS and send no Origin → CORS steps can't break them.
- Rate limit stays above real peak; limiter backend failure fails **open**.
- App-token enforcement waits for old installs to age out; warn-only until then.
- 429 body is JSON with numeric `retryAfter`; also set `Retry-After` header.
