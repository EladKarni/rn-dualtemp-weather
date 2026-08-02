import { useCallback, useEffect, useState } from 'react';

/**
 * Stable identity string for an error, used to key a user's dismissal to a
 * specific error instance (code + message). When the error changes to a new
 * identity — or clears — the previously-recorded dismissal no longer matches,
 * so a fresh error re-shows the banner.
 */
function errorIdentity(error: unknown): string | null {
  if (error == null) return null;
  const code = (error as { code?: string }).code;
  const name = (error as { name?: string }).name;
  const message = error instanceof Error ? error.message : String(error);
  return `${code ?? name ?? 'ERR'}:${message}`;
}

/**
 * Manages the "dismiss the cached-data error banner" lifecycle.
 *
 * The banner's dismissal is keyed to the current error's identity rather than a
 * sticky boolean, fixing the tier-2 bug where dismissing one error permanently
 * suppressed every future error banner. When `hasForecastError` goes false, or
 * the error's identity changes, the dismissal resets automatically.
 *
 * @param hasForecastError - Whether the forecast query is currently in error.
 * @param forecastError - The current forecast query error (any shape).
 */
export function useWeatherLoadingState(
  hasForecastError: boolean,
  forecastError: unknown
) {
  const errorId = hasForecastError ? errorIdentity(forecastError) : null;
  const [dismissedErrorId, setDismissedErrorId] = useState<string | null>(null);

  // Reset the dismissal when the error clears (errorId === null) or its identity
  // changes, so a NEW error re-shows the banner even after a previous dismissal.
  useEffect(() => {
    if (dismissedErrorId !== null && dismissedErrorId !== errorId) {
      setDismissedErrorId(null);
    }
  }, [errorId, dismissedErrorId]);

  const isErrorDismissed = errorId !== null && dismissedErrorId === errorId;

  const dismissError = useCallback(() => {
    setDismissedErrorId(errorId);
  }, [errorId]);

  return {
    isErrorDismissed,
    dismissError,
  };
}
