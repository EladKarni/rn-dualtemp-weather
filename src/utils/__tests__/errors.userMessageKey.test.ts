/**
 * Worker F — additive error-taxonomy changes.
 *
 *  - AppError gains an optional `userMessageKey` (5th ctor arg) resolved by the
 *    UI at render time.
 *  - DuplicateLocationError / MaxLocationsError carry the right userMessageKey
 *    and remain non-recoverable UserErrors (so no Retry button is offered).
 */
import {
  AppError,
  UserError,
  DuplicateLocationError,
  MaxLocationsError,
} from "../errors";

describe("AppError.userMessageKey (additive)", () => {
  it("defaults to undefined", () => {
    expect(new AppError("m", "u", "CODE").userMessageKey).toBeUndefined();
  });

  it("is set via the optional 5th constructor argument", () => {
    const e = new AppError("m", "u", "CODE", true, "SomeKey");
    expect(e.userMessageKey).toBe("SomeKey");
    // Existing positional args are unaffected.
    expect(e.userMessage).toBe("u");
    expect(e.code).toBe("CODE");
    expect(e.recoverable).toBe(true);
  });
});

describe("DuplicateLocationError", () => {
  it("carries userMessageKey 'DuplicateLocation' and is a non-recoverable UserError", () => {
    const e = new DuplicateLocationError();
    expect(e).toBeInstanceOf(UserError);
    expect(e).toBeInstanceOf(AppError);
    expect(e.userMessageKey).toBe("DuplicateLocation");
    expect(e.recoverable).toBe(false);
    expect(e.userMessage).toBeTruthy(); // fallback text present
  });
});

describe("MaxLocationsError", () => {
  it("carries userMessageKey 'MaxLocationsReached' and is a non-recoverable UserError", () => {
    const e = new MaxLocationsError();
    expect(e).toBeInstanceOf(UserError);
    expect(e).toBeInstanceOf(AppError);
    expect(e.userMessageKey).toBe("MaxLocationsReached");
    expect(e.recoverable).toBe(false);
    expect(e.userMessage).toBeTruthy();
  });
});
