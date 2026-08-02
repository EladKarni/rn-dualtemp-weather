/**
 * Guards the Hebrew meridiem against overflowing the hourly forecast card.
 *
 * This has regressed once. 628854e switched formatTime to moment's lowercase
 * `a` token, which abbreviates "לפני/אחרי הצהריים" to "לפנה״צ"/"אחה״צ" and fixed
 * the midday columns. But moment's Hebrew locale returns "לפנות בוקר" — ten
 * characters — for 00:00-04:59 at either case, so that band kept overflowing
 * and went unnoticed, because the columns only show the next few hours and the
 * fix was checked during the day.
 *
 * The length assertion is the part that generalises: it fails for ANY band that
 * grows too long, not only the one that was wrong.
 */
import fs from "fs";
import path from "path";
import moment from "moment";
import { installHebrewMeridiem } from "../hebrewMeridiem";

const meridiemAt = (hour: number): string =>
  moment().locale("he").hour(hour).minute(0).format("a");

// Captured BEFORE the override is installed. moment.updateLocale mutates the
// locale registry globally and cannot be undone in-process, so this has to run
// at module scope, ahead of the install below.
const momentDefaultPreDawn = meridiemAt(1);

installHebrewMeridiem();

describe("Hebrew meridiem", () => {
  it("is actually changing something — moment's own pre-dawn form is too long", () => {
    // Pins the premise. If moment ever ships its own abbreviation this fails,
    // and the override should then be deleted rather than silently duplicated.
    expect(momentDefaultPreDawn).toBe("לפנות בוקר");
    expect(momentDefaultPreDawn.length).toBeGreaterThan(6);
  });

  it("abbreviates the pre-dawn band, which moment itself does not", () => {
    for (const hour of [0, 1, 2, 3, 4]) {
      expect(meridiemAt(hour)).toBe("בלילה");
    }
  });

  it("leaves every other band exactly as moment defines it", () => {
    expect(meridiemAt(5)).toBe("בבוקר");
    expect(meridiemAt(9)).toBe("בבוקר");
    expect(meridiemAt(10)).toBe('לפנה"צ');
    expect(meridiemAt(11)).toBe('לפנה"צ');
    expect(meridiemAt(12)).toBe('אחה"צ');
    expect(meridiemAt(17)).toBe('אחה"צ');
    expect(meridiemAt(18)).toBe("בערב");
    expect(meridiemAt(23)).toBe("בערב");
  });

  it("keeps every hour short enough for the hourly card", () => {
    // The in-app hourly card and the widget's hour column are both sized for a
    // time plus a meridiem of roughly this width. "לפנות בוקר" broke out of the
    // card; the longest form that fits is "לפנה״צ".
    for (let hour = 0; hour < 24; hour++) {
      expect(meridiemAt(hour).length).toBeLessThanOrEqual(6);
    }
  });

  it("is wired into the app, not just available to this test", () => {
    // The assertions above call installHebrewMeridiem() themselves, so they
    // would keep passing if the production call site were ever deleted. The
    // language store is where moment's locales are registered and is the only
    // place that runs before a Hebrew time can be formatted.
    const store = fs.readFileSync(
      path.join(__dirname, "../../store/useLanguageStore.ts"),
      "utf8"
    );
    expect(store).toMatch(/import\s*\{\s*installHebrewMeridiem\s*\}/);
    expect(store).toMatch(/installHebrewMeridiem\(\)/);
  });
});
