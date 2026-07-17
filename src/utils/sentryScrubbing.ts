/**
 * Sentry payload scrubbing (S2 — privacy defense-in-depth).
 *
 * A prior commit deleted a handful of exact top-level `extra` keys
 * (latitude/longitude/...) inside `beforeSend`. That left two leaks the review
 * caught:
 *   1. Default fetch/XHR breadcrumbs still carry GPS coordinates inside the
 *      request URL's query string.
 *   2. Coordinates and full URLs survive at any depth below the top level of
 *      `extra`, and inside `contexts`, `request.url`, and exception values.
 *
 * These are the backstop: source-side sanitization (fetchWeather) is the
 * primary control, but nothing that leaves the device should ever carry a
 * precise location even if a call site forgets to sanitize. Everything here is
 * a pure, exported function so the guarantees are unit-testable.
 */
import type { Breadcrumb, Event } from "@sentry/react-native";

/**
 * Exact `extra` keys whose values are, by construction, precise coordinates.
 * Deleted outright (first pass) — mirrors the pre-existing beforeSend deletes,
 * now applied at every depth rather than only the top level.
 */
const COORD_KEYS = new Set([
  "latitude",
  "longitude",
  "lat",
  "long",
  "lon",
  "lng",
]);

/**
 * Breadcrumb categories whose fields can echo request URLs / logged strings.
 * Any other category (info, debug, ui.click, ...) is left untouched.
 */
const SCRUBBED_CATEGORIES = new Set([
  "xhr",
  "fetch",
  "http",
  "console",
  "navigation",
]);

/**
 * Matches an http(s) URL embedded anywhere in a larger string and captures the
 * portion BEFORE its query string / fragment. Used to drop `?...`/`#...` from
 * URLs that sit inside free-text (log messages, body previews) without
 * truncating the surrounding text.
 */
const EMBEDDED_URL = /(https?:\/\/[^\s?#]+)(?:\?[^\s#]*)?(?:#[^\s]*)?/gi;

/**
 * Matches a high-precision decimal (>= 3 fractional digits) adjacent to a
 * latitude/longitude-ish marker. The >= 3 decimals requirement keeps version
 * numbers (2.1.0) and temperatures (32.5) from being mistaken for coordinates.
 * Redacts the number while preserving the marker so the report still reads.
 */
const COORD_PATTERN =
  /\b(lat(?:itude)?|lon(?:g(?:itude)?)?|lng)\b(["'\s:=,]*)(-?\d+\.\d{3,})/gi;

/**
 * Remove the query string (and fragment) from a whole-URL value.
 * Query-first: everything from the first `?` or `#` is dropped.
 */
export function stripUrlQuery(url: string): string {
  if (typeof url !== "string") return url;
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

/**
 * Scrub a free-text string: strip query strings from any embedded URL and
 * redact coordinate-like numbers next to lat/lon markers. Safe to run on both
 * pure URLs and mixed log text.
 */
export function scrubText(value: string): string {
  if (typeof value !== "string") return value;
  return value
    .replace(EMBEDDED_URL, (_match, base: string) => base)
    .replace(
      COORD_PATTERN,
      (_match, marker: string, sep: string) => `${marker}${sep}[redacted]`,
    );
}

/**
 * Recursively walk a container (object/array), deleting exact coordinate keys
 * (first pass) and scrubbing every string value at every depth. Mutates in
 * place. Guards against cyclic references.
 */
function scrubContainer(node: unknown, seen: WeakSet<object>): void {
  if (node === null || typeof node !== "object") return;
  if (seen.has(node)) return;
  seen.add(node);

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const value = node[i];
      if (typeof value === "string") node[i] = scrubText(value);
      else scrubContainer(value, seen);
    }
    return;
  }

  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (COORD_KEYS.has(key)) {
      delete obj[key];
      continue;
    }
    const value = obj[key];
    if (typeof value === "string") obj[key] = scrubText(value);
    else scrubContainer(value, seen);
  }
}

/**
 * `beforeBreadcrumb` hook. For URL/log-bearing categories, strips query strings
 * from the URL fields and scrubs the free-text message. All other categories
 * pass through unchanged. Mutates and returns the breadcrumb.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (!breadcrumb || typeof breadcrumb !== "object") return breadcrumb;

  const { category } = breadcrumb;
  if (typeof category !== "string" || !SCRUBBED_CATEGORIES.has(category)) {
    return breadcrumb;
  }

  const data = breadcrumb.data;
  if (data && typeof data === "object") {
    // url/to/from are whole URLs — a clean query strip is exactly right.
    for (const field of ["url", "to", "from"] as const) {
      if (typeof data[field] === "string") {
        data[field] = stripUrlQuery(data[field]);
      }
    }
  }

  // message is free text that may contain a URL mid-string — scrub, don't split.
  if (typeof breadcrumb.message === "string") {
    breadcrumb.message = scrubText(breadcrumb.message);
  }

  return breadcrumb;
}

/**
 * `beforeSend` value-pass. Runs AFTER the existing top-level exact-key deletes.
 * Recursively scrubs `extra` (all depths) and `contexts`, plus `request.url`
 * and every `exception.values[].value`. Mutates and returns the event.
 */
export function scrubEventValues<E extends Event>(event: E): E {
  if (event === null || typeof event !== "object") return event;

  const seen = new WeakSet<object>();

  if (event.extra) scrubContainer(event.extra, seen);
  if (event.contexts) scrubContainer(event.contexts, seen);

  if (event.request && typeof event.request.url === "string") {
    event.request.url = scrubText(event.request.url);
  }

  const values = event.exception?.values;
  if (Array.isArray(values)) {
    for (const ex of values) {
      if (ex && typeof ex.value === "string") {
        ex.value = scrubText(ex.value);
      }
    }
  }

  return event;
}
