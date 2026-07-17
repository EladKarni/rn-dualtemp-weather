/**
 * Worker F — dismissedError lifecycle.
 *
 * The banner's dismissal is keyed to the current error's identity (code +
 * message) rather than a sticky boolean, so:
 *  - dismissing an error hides the banner for THAT error only;
 *  - a NEW error (different identity) re-shows the banner;
 *  - the error clearing resets the dismissal.
 */
import { renderHook, act } from "@testing-library/react-native";
import { useWeatherLoadingState } from "../useWeatherLoadingState";
import { NoConnectionError, ServerError } from "../../utils/errors";

describe("useWeatherLoadingState — dismissedError identity lifecycle", () => {
  it("starts not-dismissed", () => {
    const err = new ServerError(500);
    const { result } = renderHook(() => useWeatherLoadingState(true, err));
    expect(result.current.isErrorDismissed).toBe(false);
  });

  it("dismiss() hides the banner for the current error", () => {
    const err = new ServerError(500);
    const { result } = renderHook(() => useWeatherLoadingState(true, err));

    act(() => result.current.dismissError());
    expect(result.current.isErrorDismissed).toBe(true);
  });

  it("stays dismissed while the same error identity persists across re-renders", () => {
    const err = new ServerError(500);
    const { result, rerender } = renderHook(
      ({ hasErr, e }) => useWeatherLoadingState(hasErr, e),
      { initialProps: { hasErr: true, e: err as unknown } }
    );

    act(() => result.current.dismissError());
    expect(result.current.isErrorDismissed).toBe(true);

    // Same error object -> still dismissed.
    rerender({ hasErr: true, e: err });
    expect(result.current.isErrorDismissed).toBe(true);
  });

  it("re-shows the banner when a NEW error identity arrives", () => {
    const first = new ServerError(500);
    const { result, rerender } = renderHook(
      ({ hasErr, e }) => useWeatherLoadingState(hasErr, e),
      { initialProps: { hasErr: true, e: first as unknown } }
    );

    act(() => result.current.dismissError());
    expect(result.current.isErrorDismissed).toBe(true);

    // A different error (different code+message) must re-show the banner.
    const second = new NoConnectionError();
    rerender({ hasErr: true, e: second });
    expect(result.current.isErrorDismissed).toBe(false);
  });

  it("resets the dismissal when the error clears", () => {
    const err = new ServerError(500);
    const { result, rerender } = renderHook(
      ({ hasErr, e }) => useWeatherLoadingState(hasErr, e),
      { initialProps: { hasErr: true, e: err as unknown } }
    );

    act(() => result.current.dismissError());
    expect(result.current.isErrorDismissed).toBe(true);

    // Error clears...
    rerender({ hasErr: false, e: null });
    expect(result.current.isErrorDismissed).toBe(false);

    // ...and the SAME error returning is shown again (not stuck-dismissed).
    rerender({ hasErr: true, e: err });
    expect(result.current.isErrorDismissed).toBe(false);
  });
});
