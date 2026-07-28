/**
 * logger → Sentry reporting shape.
 *
 * These lock the two properties that decide whether a Sentry issue is
 * actionable, both of which were previously wrong:
 *
 *  1. `logger.error("Widget render failed:", error)` used to be sent with
 *     `captureMessage`, which discards the exception type and the original
 *     throw-site stack — the report's attached stack pointed back into
 *     logger.ts, so every issue looked like it originated in the logger.
 *  2. Grouping keyed off the fully-formatted message, so interpolated values
 *     (error text, ids, coordinates) split a single log site across many
 *     Sentry issues, hiding its true frequency.
 *
 * They are asserted at the Sentry API boundary because that is the only place
 * the distinction is observable.
 */
import * as Sentry from "@sentry/react-native";
import { logger } from "../logger";

jest.mock("@sentry/react-native", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
}));

const mockedSentry = Sentry as unknown as Record<string, jest.Mock>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("logger.error — preserves the exception", () => {
  it("captures the original Error, not a formatted message", () => {
    const cause = new TypeError("Network request failed");

    logger.error("Forecast query error:", cause);

    expect(mockedSentry.captureMessage).not.toHaveBeenCalled();
    expect(mockedSentry.captureException).toHaveBeenCalledTimes(1);
    // The very same object — so Sentry keeps its type and throw-site stack.
    expect(mockedSentry.captureException.mock.calls[0][0]).toBe(cause);
  });

  it("keeps the call-site text as context without letting it drive grouping", () => {
    const cause = new Error("boom");

    logger.error("Widget render failed:", cause);

    const context = mockedSentry.captureException.mock.calls[0][1];
    expect(context.level).toBe("error");
    expect(context.tags.error_source).toBe("logger.error");
    expect(context.extra.log_message).toContain("Widget render failed:");
    // Grouping is left to Sentry's stack-based algorithm.
    expect(context.fingerprint).toBeUndefined();
  });

  it("finds the Error even when it is not the first argument", () => {
    const cause = new Error("deep");

    logger.error("context", { id: 7 }, cause);

    expect(mockedSentry.captureException).toHaveBeenCalledTimes(1);
    expect(mockedSentry.captureException.mock.calls[0][0]).toBe(cause);
  });
});

describe("logger.error — message fallback groups stably", () => {
  it("captures a message when no Error is present", () => {
    logger.error("No widget found with name: NoSuchWidget");

    expect(mockedSentry.captureException).not.toHaveBeenCalled();
    expect(mockedSentry.captureMessage).toHaveBeenCalledTimes(1);
  });

  it("fingerprints on the static label, so interpolated values don't fragment the issue", () => {
    logger.error("Failed to load location", { id: "abc" });
    logger.error("Failed to load location", { id: "xyz" });

    const [first, second] = mockedSentry.captureMessage.mock.calls;
    // Different message bodies…
    expect(first[0]).not.toEqual(second[0]);
    // …but one issue.
    expect(first[1].fingerprint).toEqual([
      "logger.error",
      "Failed to load location",
    ]);
    expect(second[1].fingerprint).toEqual(first[1].fingerprint);
  });
});
