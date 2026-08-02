import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

import { logger } from "../utils/logger";
import { scrubBreadcrumb, scrubEventValues } from "../utils/sentryScrubbing";

/**
 * Sentry initialization, as a side effect of importing this module.
 *
 * MUST stay the first import in index.js. Metro/Babel transpiles ESM to CJS and
 * emits `require()` calls in source order, so importing this first is what makes
 * Sentry.init run before the rest of the app's module graph is evaluated —
 * including src/widgets/widgetTaskHandler, which pulls in the stores, i18n, the
 * logger and fetchWeather at module scope.
 *
 * This used to live in App.tsx's module body, wedged between its imports. That
 * worked for App.tsx's own requires, but it made crash reporting depend on an
 * invisible chain: index.js -> RootComponent -> App. The Android widget's
 * headless task reports through logger.exception / logger.flush and had no
 * involvement with that chain beyond happening to sit downstream of it, so
 * lazy-loading RootComponent would have killed widget reporting silently, with
 * no test to catch it. Owning the bootstrap explicitly at the entry point makes
 * the ordering a stated requirement instead of an accident.
 *
 * Exports nothing on purpose — it is imported for its side effect only.
 */

// Initialize Sentry - only if DSN is provided
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
// EXPO_PUBLIC_SENTRY_FORCE_ENABLE=true opts a dev build into actually sending
// events, so the pipeline can be smoke-tested without cutting a release build.
const sentryForceEnable =
  Constants.expoConfig?.extra?.sentryForceEnable === true;
// Which build produced this event. Without it every build — including the
// internal `preview` ones that generate most field traffic — lands in Sentry's
// default "production" environment and is indistinguishable from a real release.
// __DEV__ is checked first because `buildProfile` is derived from
// EAS_BUILD_PROFILE, which is unset outside EAS and falls back to "production" —
// so a force-enabled dev build would otherwise label itself as a real release.
const sentryEnvironment: string = __DEV__
  ? "development"
  : (Constants.expoConfig?.extra?.buildProfile ?? "production");

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__, // Enable debug mode in development
    enabled: !__DEV__ || sentryForceEnable, // Only send from release builds (or an explicit dev opt-in)
    environment: sentryEnvironment,
    sendDefaultPii: false, // don't let Sentry attach IP / default identifiers
    // Defense-in-depth scrubbing (S2): strip GPS query strings from the default
    // fetch/XHR breadcrumbs Sentry attaches automatically, and — before any
    // event leaves the device — delete precise-coordinate extras then value-scrub
    // every URL/coordinate at any depth. So location can't reach Sentry even if
    // a call site forgets to sanitize.
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend(event) {
      const extra = event.extra;
      if (extra) {
        for (const key of [
          "latitude",
          "longitude",
          "lat",
          "long",
          "lon",
          "lng",
        ]) {
          delete extra[key];
        }
      }
      return scrubEventValues(event);
    },
  });
  if (__DEV__) {
    logger.info(
      sentryForceEnable
        ? `Sentry initialized (dev mode - events FORCE-ENABLED, environment: ${sentryEnvironment})`
        : "Sentry initialized (dev mode - events disabled)",
    );
  }
} else if (__DEV__) {
  logger.info(
    "Sentry not initialized: No DSN provided. Set EXPO_PUBLIC_SENTRY_DSN environment variable to enable.",
  );
}
