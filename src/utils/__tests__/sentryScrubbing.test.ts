import type { Breadcrumb, Event } from "@sentry/react-native";

import {
  stripUrlQuery,
  scrubText,
  scrubBreadcrumb,
  scrubEventValues,
} from "../sentryScrubbing";

// Precise coordinates that must NEVER survive scrubbing anywhere in a payload.
const LAT = "32.0853421";
const LON = "34.7817676";

describe("stripUrlQuery", () => {
  it("drops the query string from a URL", () => {
    expect(
      stripUrlQuery(`https://proxy.example.com/weather?lat=${LAT}&long=${LON}`),
    ).toBe("https://proxy.example.com/weather");
  });

  it("drops the fragment as well", () => {
    expect(stripUrlQuery("https://proxy.example.com/weather#here")).toBe(
      "https://proxy.example.com/weather",
    );
  });

  it("leaves a query-less URL untouched", () => {
    expect(stripUrlQuery("https://proxy.example.com/weather")).toBe(
      "https://proxy.example.com/weather",
    );
  });
});

describe("scrubText", () => {
  it("strips the query from a URL embedded in free text without truncating it", () => {
    const input = `GET https://proxy.example.com/weather?lat=${LAT}&long=${LON} -> 200 OK`;
    const out = scrubText(input);
    expect(out).toBe("GET https://proxy.example.com/weather -> 200 OK");
    expect(out).not.toContain(LAT);
    expect(out).not.toContain(LON);
  });

  it("redacts high-precision coordinates next to lat/lon markers outside a URL", () => {
    const out = scrubText(`resolved lat=${LAT}, lon=${LON}`);
    expect(out).not.toContain(LAT);
    expect(out).not.toContain(LON);
    expect(out).toContain("[redacted]");
  });

  it("redacts coordinates in a JSON-ish body", () => {
    const out = scrubText(`{"latitude":${LAT},"longitude":${LON}}`);
    expect(out).not.toContain(LAT);
    expect(out).not.toContain(LON);
  });

  it("does not redact low-precision numbers or version strings", () => {
    expect(scrubText("app v2.1.0, temp 32.5")).toBe("app v2.1.0, temp 32.5");
  });
});

describe("scrubBreadcrumb", () => {
  it("strips coordinate query strings from an xhr breadcrumb url (spec 4a)", () => {
    const crumb: Breadcrumb = {
      category: "xhr",
      type: "http",
      data: {
        url: `https://proxy.example.com/weather?lat=${LAT}&long=${LON}`,
        method: "GET",
        status_code: 200,
      },
    };

    const out = scrubBreadcrumb(crumb);

    expect(out.data?.url).toBe("https://proxy.example.com/weather");
    expect(JSON.stringify(out)).not.toContain(LAT);
    expect(JSON.stringify(out)).not.toContain(LON);
    // Non-sensitive fields survive.
    expect(out.data?.method).toBe("GET");
    expect(out.data?.status_code).toBe(200);
  });

  it("strips query strings from data.to and data.from (navigation)", () => {
    const crumb: Breadcrumb = {
      category: "navigation",
      data: {
        from: `/a?lat=${LAT}`,
        to: `/b?lon=${LON}`,
      },
    };

    const out = scrubBreadcrumb(crumb);

    expect(out.data?.from).toBe("/a");
    expect(out.data?.to).toBe("/b");
  });

  it("scrubs URLs embedded in a console breadcrumb message", () => {
    const crumb: Breadcrumb = {
      category: "console",
      message: `fetching https://proxy.example.com/weather?lat=${LAT}&long=${LON} now`,
    };

    const out = scrubBreadcrumb(crumb);

    expect(out.message).toBe(
      "fetching https://proxy.example.com/weather now",
    );
    expect(out.message).not.toContain(LAT);
  });

  it("leaves non-http categories completely untouched", () => {
    const crumb: Breadcrumb = {
      category: "ui.click",
      message: `tapped https://proxy.example.com/weather?lat=${LAT}`,
      data: { url: `https://proxy.example.com/weather?lon=${LON}` },
    };

    const out = scrubBreadcrumb(crumb);

    // Unchanged — including the (untouched) sensitive strings.
    expect(out.message).toBe(
      `tapped https://proxy.example.com/weather?lat=${LAT}`,
    );
    expect(out.data?.url).toBe(
      `https://proxy.example.com/weather?lon=${LON}`,
    );
  });

  it("does not throw on a breadcrumb without data or message", () => {
    const crumb: Breadcrumb = { category: "fetch" };
    expect(() => scrubBreadcrumb(crumb)).not.toThrow();
  });
});

describe("scrubEventValues", () => {
  function makeEvent(): Event {
    return {
      // Pre-existing top-level exact-key deletes are covered here too.
      extra: {
        latitude: 32.0853421,
        longitude: 34.7817676,
        // (b) body_preview echoing a full URL
        body_preview: `POST https://proxy.example.com/weather?lat=${LAT}&long=${LON}`,
        status: 200,
        // (c) nested request_url at depth
        foo: {
          request_url: `https://proxy.example.com/geo?lat=${LAT}&lon=${LON}`,
          name: "weather",
          deeper: {
            note: `saw coords lat=${LAT} lon=${LON} in payload`,
          },
        },
        list: [`https://proxy.example.com/x?lat=${LAT}`, "safe-string"],
      },
      contexts: {
        location: {
          lat: 32.0853421,
          city: "Tel Aviv",
        },
      },
      request: {
        url: `https://proxy.example.com/weather?lat=${LAT}&long=${LON}`,
        method: "GET",
      },
      // (d) exception value containing a URL
      exception: {
        values: [
          {
            type: "Error",
            value: `Weather API error for https://proxy.example.com/weather?lat=${LAT}&long=${LON}`,
          },
        ],
      },
    };
  }

  it("removes every coordinate and query string across the whole event", () => {
    const out = scrubEventValues(makeEvent());
    const serialized = JSON.stringify(out);

    expect(serialized).not.toContain(LAT);
    expect(serialized).not.toContain(LON);
    expect(serialized).not.toContain("32.0853421");
    expect(serialized).not.toContain("34.7817676");
    expect(serialized).not.toContain("?lat=");
    expect(serialized).not.toContain("?lon=");
  });

  it("deletes exact coordinate keys at top level and nested", () => {
    const out = scrubEventValues(makeEvent());
    const extra = out.extra as Record<string, unknown>;

    expect(extra.latitude).toBeUndefined();
    expect(extra.longitude).toBeUndefined();

    const location = (out.contexts as Record<string, Record<string, unknown>>)
      .location;
    expect(location.lat).toBeUndefined();
  });

  it("strips query strings from body_preview, nested request_url and request.url", () => {
    const out = scrubEventValues(makeEvent());
    const extra = out.extra as Record<string, any>;

    expect(extra.body_preview).toBe(
      "POST https://proxy.example.com/weather",
    );
    expect(extra.foo.request_url).toBe("https://proxy.example.com/geo");
    expect(out.request?.url).toBe("https://proxy.example.com/weather");
  });

  it("redacts coordinates embedded in deep note strings", () => {
    const out = scrubEventValues(makeEvent());
    const note = (out.extra as Record<string, any>).foo.deeper.note as string;

    expect(note).not.toContain(LAT);
    expect(note).not.toContain(LON);
    expect(note).toContain("[redacted]");
  });

  it("scrubs strings inside arrays", () => {
    const out = scrubEventValues(makeEvent());
    const list = (out.extra as Record<string, any>).list as string[];

    expect(list[0]).toBe("https://proxy.example.com/x");
    expect(list[1]).toBe("safe-string");
  });

  it("cleans the URL out of the exception value", () => {
    const out = scrubEventValues(makeEvent());
    const value = out.exception?.values?.[0]?.value ?? "";

    expect(value).toBe(
      "Weather API error for https://proxy.example.com/weather",
    );
    expect(value).not.toContain(LAT);
  });

  it("preserves non-sensitive fields", () => {
    const out = scrubEventValues(makeEvent());
    const extra = out.extra as Record<string, any>;

    expect(extra.status).toBe(200);
    expect(extra.foo.name).toBe("weather");
    expect(
      (out.contexts as Record<string, Record<string, unknown>>).location.city,
    ).toBe("Tel Aviv");
    expect(out.request?.method).toBe("GET");
    expect(out.exception?.values?.[0]?.type).toBe("Error");
  });

  it("does not throw on an empty event", () => {
    expect(() => scrubEventValues({})).not.toThrow();
  });

  it("tolerates cyclic extra without infinite recursion", () => {
    const cyclic: Record<string, any> = { name: "loop" };
    cyclic.self = cyclic;
    const event: Event = { extra: cyclic };
    expect(() => scrubEventValues(event)).not.toThrow();
  });
});
