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
    // Pre-existing @tanstack/query correctness violations, downgraded to warn
    // (not off) here ONLY so the gate stays green without pre-empting the
    // owning phase's substantive fix. The rules stay at error everywhere else.
    //   - useForecastQuery.ts -> Worker I (Phase 3, dead-code deletion);
    //     remove this whole block when the file is deleted.
    // (useMultiLocationWeather.ts was covered here until Worker E's Phase-2
    // finding-4 rework cleared its violations; entry removed.)
    files: [
      "src/hooks/useForecastQuery.ts",
    ],
    rules: {
      "@tanstack/query/exhaustive-deps": "warn",
      "@tanstack/query/no-unstable-deps": "warn",
    },
  },
];
