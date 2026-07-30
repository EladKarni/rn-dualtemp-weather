/**
 * Guards the one ordering requirement Sentry initialization depends on.
 *
 * Metro/Babel transpiles ESM to CJS and emits `require()` calls in source order,
 * so `import './src/config/sentryBootstrap'` being the FIRST import in index.js
 * is what makes Sentry.init run before the rest of the module graph — notably
 * src/widgets/widgetTaskHandler, which pulls in the stores, i18n, the logger and
 * fetchWeather at module scope.
 *
 * Nothing about that requirement is visible at the call site: the import has no
 * bindings, so an "organize imports" pass, an alphabetical sort, or a merge that
 * drops it would all leave working-looking code with crash reporting quietly
 * initialized too late (or, if the import is removed outright, not at all). This
 * test is the only thing that fails when that happens.
 */
import { readFileSync } from "fs";
import { join } from "path";

const REPO_ROOT = join(__dirname, "..", "..", "..");
const BOOTSTRAP_SPECIFIER = "./src/config/sentryBootstrap";

const readIndex = () => readFileSync(join(REPO_ROOT, "index.js"), "utf8");

/** Import specifiers in index.js, in source order. */
const importSpecifiers = (source: string): string[] =>
  Array.from(source.matchAll(/^\s*import\s+[^;]*?['"]([^'"]+)['"]/gm)).map(
    (m) => m[1],
  );

describe("index.js Sentry bootstrap ordering", () => {
  it("imports the Sentry bootstrap", () => {
    expect(importSpecifiers(readIndex())).toContain(BOOTSTRAP_SPECIFIER);
  });

  it("imports it before anything else", () => {
    const specifiers = importSpecifiers(readIndex());
    expect(specifiers.length).toBeGreaterThan(1);
    expect(specifiers[0]).toBe(BOOTSTRAP_SPECIFIER);
  });

  it("imports it before the widget task handler, whose module graph must be covered", () => {
    const specifiers = importSpecifiers(readIndex());
    const widget = specifiers.findIndex((s) => s.includes("widgetTaskHandler"));
    expect(widget).toBeGreaterThan(-1);
    expect(specifiers.indexOf(BOOTSTRAP_SPECIFIER)).toBeLessThan(widget);
  });

  it("keeps it a side-effect-only import, so no binding invites reordering", () => {
    // `import './x'` — no `from`, no braces. A named import would let a
    // formatter group it with the others and lose the first position.
    expect(readIndex()).toMatch(
      /^\s*import\s+['"]\.\/src\/config\/sentryBootstrap['"]\s*;?\s*$/m,
    );
  });
});
