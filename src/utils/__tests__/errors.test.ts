import {
  AppError,
  ApiError,
  BadRequestError,
  NoConnectionError,
  NotFoundError,
  TimeoutError,
  toAppError,
} from "../errors";

describe("toAppError — RN network error matching (finding 6c)", () => {
  it("maps a TypeError 'Network request failed' to NoConnectionError", () => {
    const result = toAppError(new TypeError("Network request failed"));
    expect(result).toBeInstanceOf(NoConnectionError);
  });

  it("maps a TypeError 'Failed to fetch' to NoConnectionError", () => {
    const result = toAppError(new TypeError("Failed to fetch"));
    expect(result).toBeInstanceOf(NoConnectionError);
  });

  it("matches case-insensitively and on non-TypeError Errors", () => {
    const result = toAppError(new Error("NETWORK REQUEST FAILED"));
    expect(result).toBeInstanceOf(NoConnectionError);
  });

  it("passes an existing AppError straight through", () => {
    const original = new NotFoundError("Thing");
    expect(toAppError(original)).toBe(original);
  });

  it("still maps a 'timeout' message to TimeoutError", () => {
    expect(toAppError(new Error("request timeout"))).toBeInstanceOf(
      TimeoutError
    );
  });

  it("falls back to a generic AppError for unrelated errors", () => {
    const result = toAppError(new Error("something odd"));
    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe("UNKNOWN_ERROR");
  });
});

describe("NotFoundError recoverable param (finding 8)", () => {
  it("defaults recoverable to false", () => {
    expect(new NotFoundError("Weather data").recoverable).toBe(false);
  });

  it("honors an explicit recoverable: true", () => {
    expect(new NotFoundError("Weather data", true).recoverable).toBe(true);
  });
});

describe("BadRequestError userMessage & recoverable (finding 8)", () => {
  it("never pipes server details into userMessage", () => {
    const err = new BadRequestError("secret 32.0853421");
    expect(err.userMessage).toBe(
      "Invalid request. Please check your input and try again."
    );
    expect(err.userMessage).not.toContain("secret");
  });

  it("keeps server details in the internal message", () => {
    const err = new BadRequestError("secret detail");
    expect(err.message).toContain("secret detail");
  });

  it("defaults recoverable to false and honors an override", () => {
    expect(new BadRequestError("x").recoverable).toBe(false);
    expect(new BadRequestError("x", true).recoverable).toBe(true);
  });

  it("remains an ApiError subtype", () => {
    expect(new BadRequestError()).toBeInstanceOf(ApiError);
  });
});
