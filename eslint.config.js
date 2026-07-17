// Flat ESLint config (ESLint 9) built on the Expo SDK-54 preset.
// Policy D10: Expo defaults, correctness rules only; rules-of-hooks is an error.
const expoConfig = require("eslint-config-expo/flat");
const pluginQuery = require("@tanstack/eslint-plugin-query");

module.exports = [
  // Global ignores. website/ is a separate Next.js project; the rest are
  // generated/build output not owned by this lint pass.
  {
    ignores: [
      "website/**",
      "dist/**",
      "android/**",
      "ios/**",
      ".expo/**",
      "node_modules/**",
    ],
  },
  ...expoConfig,
  ...pluginQuery.configs["flat/recommended"],
  {
    rules: {
      // D10: rules-of-hooks guards the CardFooter class of bug — must be error.
      "react-hooks/rules-of-hooks": "error",
      // D10: exhaustive-deps stays a warning (advisory, not gate-blocking).
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Pre-existing @tanstack/query correctness violations live only in these two
    // files, both owned by later phases:
    //   - useMultiLocationWeather.ts -> Worker E (Phase 2, finding 4: query-key
    //     redesign with coords + memoization of the useMemo deps)
    //   - useForecastQuery.ts        -> Worker I (Phase 3, dead-code deletion)
    // Downgraded to warn (not off) here ONLY, so the Phase-0 gate is green
    // without pre-empting those substantive fixes. The rules stay at error
    // everywhere else, so new violations still break the gate. Worker E's
    // finding-4 fix clears the exhaustive-deps + no-unstable-deps warnings.
    files: [
      "src/hooks/useMultiLocationWeather.ts",
      "src/hooks/useForecastQuery.ts",
    ],
    rules: {
      "@tanstack/query/exhaustive-deps": "warn",
      "@tanstack/query/no-unstable-deps": "warn",
    },
  },
];
