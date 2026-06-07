import { describe, it, expect } from 'vitest';
import { DEFAULT_LAYOUT, normalizeLayout } from './layout';

describe('normalizeLayout', () => {
  it('returns the defaults for null/undefined', () => {
    expect(normalizeLayout(undefined)).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout(null)).toEqual(DEFAULT_LAYOUT);
  });

  it('fills missing keys but keeps provided overrides', () => {
    const out = normalizeLayout({ rotation: 8, textPos: 'bottom' });
    expect(out.rotation).toBe(8);
    expect(out.textPos).toBe('bottom');
    // untouched keys come from defaults
    expect(out.deviceScale).toBe(DEFAULT_LAYOUT.deviceScale);
    expect(out.showFooter).toBe(DEFAULT_LAYOUT.showFooter);
  });

  it('does not mutate the input', () => {
    const input = { rotation: 3 };
    normalizeLayout(input);
    expect(Object.keys(input)).toEqual(['rotation']);
  });

  it('has sensible defaults', () => {
    expect(DEFAULT_LAYOUT.textPos).toBe('top');
    expect(DEFAULT_LAYOUT.bgStyle).toBe('solid');
    expect(DEFAULT_LAYOUT.deviceScale).toBe(1);
    expect(DEFAULT_LAYOUT.fontScale).toBe(1);
    expect(DEFAULT_LAYOUT.rotation).toBe(0);
  });
});
