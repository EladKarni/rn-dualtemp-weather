/**
 * Worker F — render-state machine.
 *
 * Verifies `computeScreenState` produces exactly ONE mutually-exclusive screen
 * for any input, with the precedence error > content > loading > skeleton, and
 * that the two previously-overlapping input combinations the review proved
 * (double SkeletonScreen, and Skeleton+Loading) each resolve to a single state.
 */
import { computeScreenState, ScreenState } from "../useRenderDecision";

// The module under test transitively imports logger -> @sentry/react-native,
// whose session timer otherwise keeps the jest worker alive. Mock it (as the
// other suites do) for clean teardown.
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    exception: jest.fn(),
    setTag: jest.fn(),
  },
}));

type Inputs = Parameters<typeof computeScreenState>[0];

const base: Inputs = {
  splashTimeoutExpired: true,
  forecast: undefined,
  refreshing: false,
  hasForecastError: false,
};

describe("computeScreenState — precedence & exclusivity", () => {
  const cases: {
    name: string;
    input: Inputs;
    expected: ScreenState;
  }[] = [
    {
      name: "error: post-timeout error with no forecast",
      input: { ...base, hasForecastError: true, forecast: undefined },
      expected: "error",
    },
    {
      name: "content: forecast present wins over a concurrent error (banner overlays)",
      input: { ...base, forecast: { current: {} }, hasForecastError: true },
      expected: "content",
    },
    {
      name: "content: forecast present, no error",
      input: { ...base, forecast: { current: {} } },
      expected: "content",
    },
    {
      name: "loading: refreshing, no forecast, no error",
      input: { ...base, refreshing: true },
      expected: "loading",
    },
    {
      name: "skeleton: nothing loading, no forecast, no error",
      input: { ...base },
      expected: "skeleton",
    },
    {
      name: "error requires the splash timeout to have expired",
      input: {
        ...base,
        splashTimeoutExpired: false,
        hasForecastError: true,
      },
      // pre-timeout error with no forecast and not refreshing -> skeleton fallback
      expected: "skeleton",
    },
    {
      name: "error is not chosen while a forecast is available (content instead)",
      input: {
        ...base,
        hasForecastError: true,
        forecast: { current: {} },
      },
      expected: "content",
    },
  ];

  it.each(cases)("$name -> $expected", ({ input, expected }) => {
    expect(computeScreenState(input)).toBe(expected);
  });

  it("only ever returns one of the four known states", () => {
    const valid: ScreenState[] = ["loading", "skeleton", "error", "content"];
    for (const splashTimeoutExpired of [true, false]) {
      for (const refreshing of [true, false]) {
        for (const hasForecastError of [true, false]) {
          for (const forecast of [undefined, { current: {} }]) {
            const state = computeScreenState({
              splashTimeoutExpired,
              refreshing,
              hasForecastError,
              forecast,
            });
            expect(valid).toContain(state);
          }
        }
      }
    }
  });
});

describe("computeScreenState — previously-overlapping cases resolve to ONE screen", () => {
  // Overlap A (old): guard1 (splashTimeoutExpired && essentialResourcesLoading)
  // AND guard5 (fallback) both mounted a SkeletonScreen. No forecast, not
  // refreshing, no error, post-timeout.
  it("double-skeleton case -> single 'skeleton'", () => {
    expect(
      computeScreenState({
        splashTimeoutExpired: true,
        forecast: undefined,
        refreshing: false,
        hasForecastError: false,
      })
    ).toBe("skeleton");
  });

  // Overlap B (old): guard1/guard3 (skeleton) AND guard2 (LoadingScreen) mounted
  // simultaneously. Post-timeout, refreshing, no forecast, no error.
  it("skeleton+loading case -> single 'loading'", () => {
    expect(
      computeScreenState({
        splashTimeoutExpired: true,
        forecast: undefined,
        refreshing: true,
        hasForecastError: false,
      })
    ).toBe("loading");
  });
});
