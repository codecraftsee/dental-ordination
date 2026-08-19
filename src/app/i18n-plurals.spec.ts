import enJson from '../../public/i18n/en.json';
import srJson from '../../public/i18n/sr.json';

/**
 * Guards a bug the unit tests structurally cannot catch: `translatePlural` picks
 * the right category, but whether the *string* behind that category is right is
 * data, not code.
 *
 * Serbian's `one` category covers 21, 31, 101 — not just 1 — so a `_one` value
 * that hardcodes "1" renders "1 dokument" for a patient with 21 of them.
 * `translatePlural` substitutes `{count}` and does nothing if the placeholder is
 * absent, so the placeholder is mandatory in Serbian. English `one` only ever
 * means 1, so it is exempt.
 *
 * The bundles are imported rather than read off disk, so the assertions run
 * against the same JSON the app ships — no cwd assumptions, and a renamed file
 * fails to compile instead of at runtime.
 */
const en: Record<string, string> = enJson;
const sr: Record<string, string> = srJson;

const pluralSuffix = /_(one|few|other)$/;

describe('i18n plural forms', () => {
  it('every Serbian _one value carries {count}', () => {
    const offenders = Object.entries(sr)
      .filter(([key]) => key.endsWith('_one'))
      .filter(([, value]) => !value.includes('{count}'))
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`);

    expect(offenders).toEqual([]);
  });

  it('_few is Serbian only, and Serbian defines one/few/other together', () => {
    expect(Object.keys(en).filter(k => k.endsWith('_few'))).toEqual([]);

    for (const key of Object.keys(sr).filter(k => k.endsWith('_few'))) {
      const base = key.slice(0, -'_few'.length);
      expect(sr[`${base}_one`], `${base} is missing _one`).toBeDefined();
      expect(sr[`${base}_other`], `${base} is missing _other`).toBeDefined();
    }
  });

  it('any pluralised key exists in both languages', () => {
    const bases = (table: Record<string, string>) =>
      new Set(
        Object.keys(table)
          .filter(k => pluralSuffix.test(k))
          .map(k => k.replace(pluralSuffix, '')),
      );

    const enBases = bases(en);
    const srBases = bases(sr);
    expect([...enBases].filter(b => !srBases.has(b))).toEqual([]);
    expect([...srBases].filter(b => !enBases.has(b))).toEqual([]);
  });
});
