import moment from "moment";
import "moment/locale/he";

/**
 * Shorten the Hebrew pre-dawn meridiem.
 *
 * moment's Hebrew locale abbreviates only around midday: lowercase `a` turns
 * "לפני/אחרי הצהריים" into "לפנה״צ"/"אחה״צ". For hours 00:00-04:59 it returns
 * "לפנות בוקר" — ten characters, with no short variant at either case — which
 * overflows the hourly forecast card. 628854e switched formatTime to lowercase
 * `a` and fixed the midday columns, but this band has no abbreviation to switch
 * to, so it kept overflowing.
 *
 * Every other band is reproduced exactly as moment defines it; only the
 * pre-dawn one changes, to "בלילה" — standard Hebrew for those hours and the
 * same length as the neighbouring "בבוקר"/"בערב", so it fits the width the card
 * was already built for instead of needing a layout change.
 *
 * "לפנות בוקר" stays in meridiemParse so a string produced by an older build
 * still parses. isPM is deliberately left alone: it lists only the afternoon
 * and evening forms, and the pre-dawn hours are correctly AM.
 *
 * Lives in its own module because moment.updateLocale must run before anything
 * formats a Hebrew time, and because it is then testable without dragging in
 * the language store's AsyncStorage and i18n dependencies.
 *
 * Deliberately NOT in src/localization/: every `*.ts` there is a locale table,
 * and appConfig.test.ts enumerates that directory to assert each shipped
 * language is declared to iOS — a non-table file there reads as a seventh
 * language and fails the gate.
 */
export const installHebrewMeridiem = (): void => {
  moment.updateLocale("he", {
    meridiem: (hour: number, _minute: number, isLower: boolean): string => {
      if (hour < 5) return "בלילה";
      if (hour < 10) return "בבוקר";
      if (hour < 12) return isLower ? 'לפנה"צ' : "לפני הצהריים";
      if (hour < 18) return isLower ? 'אחה"צ' : "אחרי הצהריים";
      return "בערב";
    },
    meridiemParse:
      /אחה"צ|לפנה"צ|אחרי הצהריים|לפני הצהריים|לפנות בוקר|בלילה|בבוקר|בערב/i,
  });
};
