/**
 * Worker K (Phase 3) — the userMessageKey mechanism (introduced additively by
 * Worker F for the two UserErrors) is extended to the rest of the taxonomy so
 * every rendered error message localizes at render via i18n.t(userMessageKey),
 * falling back to the English userMessage when a key is absent.
 *
 * These assertions lock:
 *   - each leaf error class carries the right userMessageKey,
 *   - userMessage / recoverable are UNCHANGED (additive, non-behavioral),
 *   - the base-class `if (!userMessage)` guard: a caller-supplied userMessage
 *     keeps rendering (no generic key clobbers it — protects fetchWeather's
 *     invalid-response ApiError), while the default-message path gets the key,
 *   - toAppError's generic fallbacks carry keys.
 */
import {
  AppError,
  NetworkError,
  NoConnectionError,
  TimeoutError,
  PermissionDeniedError,
  LocationUnavailableError,
  PositionTimeoutError,
  ApiError,
  RateLimitError,
  ServerError,
  NotFoundError,
  BadRequestError,
  AuthenticationError,
  toAppError,
} from "../errors";

describe("error taxonomy — userMessageKey extension", () => {
  it.each<[string, AppError, string]>([
    ["NoConnectionError", new NoConnectionError(), "ErrNoConnection"],
    ["TimeoutError", new TimeoutError(), "ErrTimeout"],
    ["PermissionDeniedError", new PermissionDeniedError(), "ErrPermissionDenied"],
    ["LocationUnavailableError", new LocationUnavailableError(), "ErrLocationUnavailable"],
    ["PositionTimeoutError", new PositionTimeoutError(), "ErrPositionTimeout"],
    ["RateLimitError", new RateLimitError(30), "ErrRateLimit"],
    ["ServerError", new ServerError(503), "ErrServer"],
    ["NotFoundError", new NotFoundError("Weather data", true), "ErrNotFound"],
    ["BadRequestError", new BadRequestError("bad", true), "ErrBadRequest"],
    ["AuthenticationError", new AuthenticationError(), "ErrAuth"],
  ])("%s carries userMessageKey %s", (_name, error, key) => {
    expect(error.userMessageKey).toBe(key);
  });

  it("preserves recoverable and userMessage (additive, non-behavioral)", () => {
    const auth = new AuthenticationError();
    expect(auth.recoverable).toBe(false);
    expect(auth.userMessage).toBe(
      "Weather service is temporarily unavailable. Please try again later."
    );

    const nf = new NotFoundError("Weather data", true);
    expect(nf.recoverable).toBe(true);
    expect(nf.userMessage).toBe(
      "Weather data was not found. Please check and try again."
    );
  });

  describe("NetworkError base guard", () => {
    it("assigns ErrNetwork only when no custom userMessage is supplied", () => {
      expect(new NetworkError("boom").userMessageKey).toBe("ErrNetwork");
    });
    it("does NOT assign the generic key when a custom userMessage is supplied", () => {
      // NoConnectionError passes its own userMessage via super(), then sets its
      // own key — the base guard must not have set ErrNetwork first.
      expect(new NoConnectionError().userMessageKey).toBe("ErrNoConnection");
    });
  });

  describe("ApiError base guard", () => {
    it("assigns ErrApiGeneric only when no custom userMessage is supplied", () => {
      expect(new ApiError("x", 418).userMessageKey).toBe("ErrApiGeneric");
    });
    it("keeps a caller-supplied userMessage (no generic key clobber)", () => {
      // Mirrors fetchWeather's invalid-response ApiError: custom text must render.
      const e = new ApiError("x", 200, "Weather service returned an unexpected response.");
      expect(e.userMessageKey).toBeUndefined();
      expect(e.userMessage).toBe("Weather service returned an unexpected response.");
    });
  });

  describe("toAppError generic fallbacks", () => {
    it("carries ErrUnexpected for a generic Error", () => {
      expect(toAppError(new Error("weird")).userMessageKey).toBe("ErrUnexpected");
    });
    it("carries ErrGeneric for a non-Error value", () => {
      expect(toAppError("not an error").userMessageKey).toBe("ErrGeneric");
    });
    it("still maps offline TypeError to NoConnectionError (ErrNoConnection)", () => {
      const e = toAppError(new TypeError("Network request failed"));
      expect(e).toBeInstanceOf(NoConnectionError);
      expect(e.userMessageKey).toBe("ErrNoConnection");
    });
  });
});
