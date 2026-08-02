/**
 * `formatDataAge` boundary table — FINALIZED contract (Phase 3, Worker K).
 *
 * Originally review-mandated test #5 (Worker H) documented the shipping
 * behavior, latent bugs and all, with a TODO handing the contract to Worker K.
 * Worker K has now:
 *   - localized the m/h/d strings via i18n (en resolves to the same literals),
 *   - deleted the unreachable `< 1 -> "Just now"` branch,
 *   - KEPT the `>= 1440 -> "Xd ago"` days branch.
 *
 * Finalized contract:
 *   - ageMinutes < 30        -> null   (fresh; no age chip)
 *   - 30 <= ageMinutes < 60  -> "Xm ago"   (Math.round(minutes))
 *   - 60 <= ageMinutes < 1440-> "Xh ago"   (Math.floor(minutes / 60))
 *   - ageMinutes >= 1440     -> "Xd ago"   (Math.floor(hours / 24))
 *
 * The numeric BOUNDARIES (0/29/30/59/60/1439/1440) and `< 30 -> null` semantics
 * are unchanged from Worker H's table. The expected strings are the localized
 * output for the default (en) locale, which is byte-identical to the old
 * literals — proving the localization is behavior-preserving for en.
 */
import { formatDataAge } from '../widgetDataUtils';
import { i18n } from '../../../localization/i18n';

// i18n-js ships ESM that jest-expo does not transform, so mock the localization
// module — but back it with the REAL locale tables + %{...} interpolation and a
// mutable locale, so this test verifies the actual localized output (not keys).
// babel-plugin-jest-hoist lifts this above the imports.
jest.mock('../../../localization/i18n', () => {
  const { en } = jest.requireActual('../../../localization/en') as {
    en: Record<string, string>;
  };
  const { zh } = jest.requireActual('../../../localization/zh') as {
    zh: Record<string, string>;
  };
  const tables: Record<string, Record<string, string>> = { en, zh };
  const state = { locale: 'en' };
  return {
    i18n: {
      get locale() {
        return state.locale;
      },
      set locale(value: string) {
        state.locale = value;
      },
      t: (key: string, opts?: Record<string, unknown>): string => {
        const template = (tables[state.locale] ?? en)[key] ?? key;
        return opts
          ? template.replace(/%\{(\w+)\}/g, (_m, k: string) =>
              String(opts[k] ?? '')
            )
          : template;
      },
    },
  };
});

// Pin the locale so the assertions are deterministic regardless of test order.
beforeAll(() => {
  i18n.locale = 'en';
});

describe('formatDataAge — boundary table (finalized, localized)', () => {
  // The exact boundary set the review mandated, incl. 1439 -> hours, 1440 -> days.
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

describe('formatDataAge — ages below the 30-minute threshold return null', () => {
  // The old unreachable `< 1 -> "Just now"` branch has been removed; anything
  // below the 30-min freshness threshold still returns null (no age chip), and
  // the "Just now" string can never be produced.
  it.each([0, 0.0001, 0.5, 0.9, 0.999, 15, 29.9])(
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

describe('formatDataAge — localization', () => {
  it('renders the localized age string when the locale changes', () => {
    i18n.locale = 'zh';
    // zh: WidgetAgeMinutes === "%{count} 分钟前"
    expect(formatDataAge(30)).toBe('30 分钟前');
    i18n.locale = 'en'; // restore for any later assertions
  });
});
