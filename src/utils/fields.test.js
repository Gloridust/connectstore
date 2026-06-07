import { describe, it, expect } from 'vitest';
import { DEFAULT_FIELDS, COMMON_LOCALES, FIELD_TYPES, localeLabel } from './fields';

describe('default fields', () => {
  it('includes the core App Store Connect fields', () => {
    const ids = DEFAULT_FIELDS.map((f) => f.id);
    for (const id of ['name', 'subtitle', 'promotionalText', 'description', 'keywords']) {
      expect(ids).toContain(id);
    }
  });

  it('encodes Apple character limits', () => {
    const byId = Object.fromEntries(DEFAULT_FIELDS.map((f) => [f.id, f]));
    expect(byId.name.max).toBe(30);
    expect(byId.subtitle.max).toBe(30);
    expect(byId.promotionalText.max).toBe(170);
    expect(byId.description.max).toBe(4000);
    expect(byId.keywords.max).toBe(100);
  });

  it('only uses known field types', () => {
    for (const f of DEFAULT_FIELDS) {
      expect(FIELD_TYPES).toContain(f.type);
    }
  });
});

describe('localeLabel', () => {
  it('returns a friendly label for known locales', () => {
    expect(localeLabel('zh-Hans')).toBe('简体中文');
    expect(localeLabel('en-US')).toContain('English');
  });

  it('falls back to the raw code for unknown locales', () => {
    expect(localeLabel('xx-YY')).toBe('xx-YY');
  });

  it('every common locale has a code and label', () => {
    for (const l of COMMON_LOCALES) {
      expect(l.code).toBeTruthy();
      expect(l.label).toBeTruthy();
    }
  });
});
