/**
 * Review-mandated test #5 — `formatDataAge` boundary table.
 *
 * This test DOCUMENTS the *current* intended behavior of `formatDataAge`
 * (src/widgets/utils/widgetDataUtils.ts). It is deliberately written against
 * the shipping contract, latent bugs and all, so any change to the function is
 * a conscious one.
 *
 * Current contract (as implemented today):
 *   - ageMinutes < 30        -> null   (data considered "fresh", no age chip)
 *   - 30 <= ageMinutes < 60  -> "Xm ago"
 *   - 60 <= ageMinutes < 1440-> "Xh ago"   (Math.floor(minutes / 60))
 *   - ageMinutes >= 1440     -> "Xd ago"    (Math.floor(hours / 24))
 *
 * LATENT BUG documented here: the `if (ageMinutes < 1) return 'Just now';`
 * branch (widgetDataUtils.ts) is DEAD CODE. It sits *after* the `< 30 -> null`
 * guard, so any age small enough to be "Just now" already returned null. The
 * "Just now" string can never be produced. The test below pins that fact.
 *
 * TODO(Worker K, Phase 3): Worker K finalizes the localized `formatDataAge`
 * contract. Per the plan it KEEPS the `>= 1440 -> "Xd ago"` days branch and
 * only deletes the unreachable "Just now" branch, replacing the English
 * literals with i18n keys. When that lands, update the string expectations
 * below (m/h/d suffixes become localized) but the numeric BOUNDARIES
 * (0/29/30/59/60/1439/1440) and the `< 30 -> null` / days-branch semantics must
 * still hold — Worker K's spec re-affirms 1439 -> hours, 1440 -> days.
 */
import { formatDataAge } from '../widgetDataUtils';

describe('formatDataAge — boundary table (current shipping contract)', () => {
  // The exact boundary set the review mandated.
  it.each<[number, string | null]>([
    [0, null],        // fresh
    [29, null],       // still fresh (just under the 30-min threshold)
    [30, '30m ago'],  // first minute that shows an age chip
    [59, '59m ago'],  // last "minutes" value
    [60, '1h ago'],   // first "hours" value (floor(60/60) === 1)
    [1439, '23h ago'],// last "hours" value (floor(1439/60) === 23)
    [1440, '1d ago'], // first "days" value (floor(1440/60)/24 === 1)
  ])('formatDataAge(%p) === %p', (ageMinutes, expected) => {
    expect(formatDataAge(ageMinutes)).toBe(expected);
  });
});

describe('formatDataAge — the "Just now" branch is dead code', () => {
  // Anything small enough to reach the (unreachable) `< 1 -> "Just now"` branch
  // is caught first by the `< 30 -> null` guard. Prove the string never appears.
  it.each([0, 0.0001, 0.5, 0.9, 0.999])(
    'formatDataAge(%p) returns null, never "Just now"',
    (ageMinutes) => {
      const result = formatDataAge(ageMinutes);
      expect(result).toBeNull();
      expect(result).not.toBe('Just now');
    }
  );
});

describe('formatDataAge — rounding and unit-transition sanity', () => {
  it('rounds fractional minutes in the "minutes" band', () => {
    // 45.4 -> Math.round -> 45
    expect(formatDataAge(45.4)).toBe('45m ago');
    // 45.6 -> Math.round -> 46
    expect(formatDataAge(45.6)).toBe('46m ago');
  });

  it('floors within the "hours" band', () => {
    // 119 minutes -> floor(119/60) === 1 hour
    expect(formatDataAge(119)).toBe('1h ago');
    // 120 minutes -> floor(120/60) === 2 hours
    expect(formatDataAge(120)).toBe('2h ago');
  });

  it('floors within the "days" band', () => {
    // 2 full days -> floor(2880/60)=48h -> floor(48/24)=2 days
    expect(formatDataAge(2880)).toBe('2d ago');
    // 2879 minutes -> 47h -> still 1 day
    expect(formatDataAge(2879)).toBe('1d ago');
  });
});
