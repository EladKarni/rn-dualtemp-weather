/**
 * Review-mandated test #8 — i18n key parity across all six locales.
 *
 * DYNAMIC by design: it reads every locale export at runtime and compares the
 * SORTED key sets. It never hardcodes a key count or a key list, so it stays
 * green through concurrent/later locale edits (Worker D deleting keys, Worker F
 * adding `DuplicateLocation`, Worker K adding widget/error keys, Worker I
 * pruning dead keys). The only invariant asserted is: every locale defines
 * exactly the same set of keys.
 */
import { en } from '../en';
import { es } from '../es';
import { fr } from '../fr';
import { ar } from '../ar';
import { he } from '../he';
import { zh } from '../zh';

// Reference locale is English; every other locale is compared against the union
// of all keys so that a key missing from ANY locale (including en) is caught.
const locales: Record<string, Record<string, string>> = {
  en,
  es,
  fr,
  ar,
  he,
  zh,
};

const sortedKeys = (obj: Record<string, string>): string[] =>
  Object.keys(obj).sort();

describe('i18n locale key parity', () => {
  const localeNames = Object.keys(locales);

  it('loads all six locales', () => {
    expect(localeNames).toEqual(
      expect.arrayContaining(['en', 'es', 'fr', 'ar', 'he', 'zh'])
    );
    expect(localeNames).toHaveLength(6);
  });

  it('every locale exposes an identical sorted key set', () => {
    // Build the union of every key seen in any locale.
    const unionKeys = Array.from(
      new Set(localeNames.flatMap((name) => Object.keys(locales[name])))
    ).sort();

    // Report per-locale the keys it is MISSING relative to the union. An empty
    // object means full parity; a non-empty object names the offenders, which
    // makes a failure immediately actionable.
    const missingByLocale: Record<string, string[]> = {};
    for (const name of localeNames) {
      const keys = new Set(Object.keys(locales[name]));
      const missing = unionKeys.filter((k) => !keys.has(k));
      if (missing.length > 0) {
        missingByLocale[name] = missing;
      }
    }

    expect(missingByLocale).toEqual({});
  });

  it('all locales agree with the English key set exactly', () => {
    const enKeys = sortedKeys(en);
    for (const name of localeNames) {
      expect({ locale: name, keys: sortedKeys(locales[name]) }).toEqual({
        locale: name,
        keys: enKeys,
      });
    }
  });

  it('no locale has empty-string or missing values for any key', () => {
    for (const name of localeNames) {
      for (const [key, value] of Object.entries(locales[name])) {
        expect(typeof value).toBe('string');
        expect(`${name}.${key}: ${value}`.length).toBeGreaterThan(
          `${name}.${key}: `.length
        );
      }
    }
  });
});
