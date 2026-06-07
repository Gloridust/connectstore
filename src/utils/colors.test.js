import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  buildPalette,
  backgroundFor,
  paletteToCssVars,
} from './colors';

const HEX = /^#[0-9a-f]{6}$/i;

describe('hex <-> rgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#1a2f66')).toEqual({ r: 0x1a, g: 0x2f, b: 0x66 });
  });

  it('expands 3-digit shorthand', () => {
    expect(hexToRgb('#abc')).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
  });

  it('round-trips rgb -> hex -> rgb', () => {
    const rgb = { r: 12, g: 200, b: 255 };
    expect(hexToRgb(rgbToHex(rgb))).toEqual(rgb);
  });

  it('clamps out-of-range channels', () => {
    expect(rgbToHex({ r: -10, g: 300, b: 128 })).toBe('#00ff80');
  });
});

describe('hex <-> hsl', () => {
  it('round-trips through hsl within tolerance', () => {
    const out = hexToRgb(hslToHex(hexToHsl('#7a3a3a')));
    const orig = hexToRgb('#7a3a3a');
    for (const k of ['r', 'g', 'b']) {
      expect(Math.abs(out[k] - orig[k])).toBeLessThanOrEqual(2);
    }
  });

  it('keeps pure gray achromatic', () => {
    const hsl = hexToHsl('#808080');
    expect(hsl.s).toBe(0);
  });
});

describe('buildPalette', () => {
  it('returns all expected, valid hex tokens', () => {
    const p = buildPalette('#f4ecd8', '#1a2f66');
    for (const k of ['ink', 'ink2', 'cream', 'card', 'char', 'char2', 'char3', 'char4', 'rouge', 'wash']) {
      expect(p[k], k).toMatch(HEX);
    }
  });

  it('keeps the background light and legible even from a dark pick', () => {
    const p = buildPalette('#101010', '#1a2f66');
    const { l } = hexToHsl(p.cream);
    expect(l).toBeGreaterThanOrEqual(0.8);
  });

  it('keeps the accent ink dark enough to read on cream', () => {
    const p = buildPalette('#f4ecd8', '#88aaff');
    const { l } = hexToHsl(p.ink);
    expect(l).toBeLessThanOrEqual(0.46);
  });

  it('treats a single argument as the accent (legacy)', () => {
    const single = buildPalette('#1a2f66');
    const two = buildPalette('#f4ecd8', '#1a2f66');
    expect(single.ink).toBe(two.ink);
  });
});

describe('backgroundFor', () => {
  const p = buildPalette('#f4ecd8', '#1a2f66');
  it('solid returns flat cream', () => {
    expect(backgroundFor(p, 'solid')).toBe(p.cream);
  });
  it('gradient and radial return CSS gradients referencing palette colors', () => {
    expect(backgroundFor(p, 'gradient')).toContain('linear-gradient');
    expect(backgroundFor(p, 'gradient')).toContain(p.cream);
    expect(backgroundFor(p, 'radial')).toContain('radial-gradient');
  });
  it('falls back to solid for unknown styles', () => {
    expect(backgroundFor(p, 'whatever')).toBe(p.cream);
  });
});

describe('paletteToCssVars', () => {
  it('exposes the css custom properties used by the poster', () => {
    const vars = paletteToCssVars(buildPalette('#f4ecd8', '#1a2f66'));
    expect(vars['--cs-cream']).toMatch(HEX);
    expect(vars['--cs-ink']).toMatch(HEX);
    expect(vars['--cs-wash']).toMatch(HEX);
  });
});
