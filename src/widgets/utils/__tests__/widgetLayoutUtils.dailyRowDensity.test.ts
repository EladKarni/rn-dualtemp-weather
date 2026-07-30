/**
 * Row density for the resizable daily widget.
 *
 * The daily widget is declared resizable from 2 to 5 cells wide. Its row has to
 * shed detail as it narrows or the content overflows, so this function is the
 * single place that decides what survives at each width.
 *
 * Widths are dp. That was confirmed on device rather than assumed: rendering the
 * raw value the task handler passes in reported 203 for a three-row widget,
 * which only resolves to three rows when read as dp (at pixels it would be 74dp,
 * too short for even one row).
 */
import {
  calculateDailyRowDensity,
  type DailyRowDensity,
} from "../widgetLayoutUtils";

/** Android sizes widget cells as minWidth = 70n - 30. */
const cells = (n: number): number => 70 * n - 30;

describe("calculateDailyRowDensity", () => {
  it.each<[string, number, DailyRowDensity]>([
    ["2 cells — the declared minimum", cells(2), "narrow"],
    ["3 cells — the declared default", cells(3), "medium"],
    ["4 cells", cells(4), "full"],
    ["5 cells — the declared maximum", cells(5), "wide"],
  ])("%s (%ddp) -> %s", (_label, width, expected) => {
    expect(calculateDailyRowDensity(width)).toBe(expected);
  });

  it.each<[string, number, DailyRowDensity]>([
    ["just below the medium threshold", 179, "narrow"],
    ["exactly at the medium threshold", 180, "medium"],
    ["just below the full threshold", 249, "medium"],
    ["exactly at the full threshold", 250, "full"],
    ["just below the wide threshold", 319, "full"],
    ["exactly at the wide threshold", 320, "wide"],
  ])("%s (%ddp) -> %s", (_label, width, expected) => {
    expect(calculateDailyRowDensity(width)).toBe(expected);
  });

  it("degrades to the narrowest layout below the declared minimum", () => {
    // Android should not hand us anything under 2 cells, but a launcher that
    // does must still get a row that fits rather than one that overflows.
    expect(calculateDailyRowDensity(0)).toBe("narrow");
    expect(calculateDailyRowDensity(60)).toBe("narrow");
  });

  it("is monotonic — a wider widget never shows less detail", () => {
    // Guards against a threshold being reordered so that, say, 300dp resolves
    // to something less detailed than 250dp.
    const rank: Record<DailyRowDensity, number> = {
      narrow: 0,
      medium: 1,
      full: 2,
      wide: 3,
    };
    let previous = -1;
    for (let w = 0; w <= 600; w += 5) {
      const current = rank[calculateDailyRowDensity(w)];
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it("assumes medium, not full, when the width is unknown", () => {
    // Guessing too wide overflows the row; guessing too narrow only wastes
    // space. updateAllWeatherWidgets historically omitted the width prop
    // entirely, so this path is reachable in practice.
    expect(calculateDailyRowDensity(undefined)).toBe("medium");
  });

  it("never returns a density outside the known set", () => {
    const allowed: DailyRowDensity[] = ["wide", "full", "medium", "narrow"];
    for (let w = 0; w <= 600; w += 7) {
      expect(allowed).toContain(calculateDailyRowDensity(w));
    }
  });
});
