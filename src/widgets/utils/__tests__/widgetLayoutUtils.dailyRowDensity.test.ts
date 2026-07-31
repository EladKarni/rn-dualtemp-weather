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
 *
 * They are also the width the LAUNCHER measured, not the width app.json
 * declared. `minWidth = 70n - 30` sizes the declaration only; the Pixel
 * launcher on a 411dp screen was measured stepping ~97dp per cell (179dp and
 * 276dp at consecutive resize steps, 2026-07-30). Cases below therefore use
 * measured widths, and the cell numbers in their labels are that launcher's —
 * another launcher will land the same layouts on different cell counts, which
 * is exactly why the thresholds are expressed in dp.
 */
import {
  calculateDailyRowDensity,
  type DailyRowDensity,
} from "../widgetLayoutUtils";

describe("calculateDailyRowDensity", () => {
  it.each<[string, number, DailyRowDensity]>([
    ["2 cells on a 411dp Pixel launcher", 179, "narrow"],
    ["3 cells on a 411dp Pixel launcher", 276, "full"],
    ["4 cells on a 411dp Pixel launcher", 373, "wide"],
    ["5 cells on a 411dp Pixel launcher", 470, "wide"],
  ])("%s (%ddp) -> %s", (_label, width, expected) => {
    expect(calculateDailyRowDensity(width)).toBe(expected);
  });

  it.each<[string, number, DailyRowDensity]>([
    ["just below the medium threshold", 219, "narrow"],
    ["exactly at the medium threshold", 220, "medium"],
    ["just below the full threshold", 254, "medium"],
    ["exactly at the full threshold", 255, "full"],
    ["just below the wide threshold", 329, "full"],
    ["exactly at the wide threshold", 330, "wide"],
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

  it("assumes the narrowest layout when the width is unknown", () => {
    // Guessing too wide overflows the row; guessing too narrow only wastes
    // space. updateAllWeatherWidgets historically omitted the width prop
    // entirely, so this path is reachable in practice.
    expect(calculateDailyRowDensity(undefined)).toBe("narrow");
  });

  it("never returns a density outside the known set", () => {
    const allowed: DailyRowDensity[] = ["wide", "full", "medium", "narrow"];
    for (let w = 0; w <= 600; w += 7) {
      expect(allowed).toContain(calculateDailyRowDensity(w));
    }
  });
});
