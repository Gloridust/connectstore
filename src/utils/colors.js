// Generate an App-Store-poster-friendly palette from a single key color.
// The key color becomes the primary accent ("ink"); we derive a warm
// background (cream) and a set of neutral text shades that share the hue.

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h.split('').map((c) => c + c).join('')
      : h.padEnd(6, '0').slice(0, 6);
  const num = parseInt(v, 16);
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

export function hexToHsl(hex) {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

// Build a poster palette from a key (accent) color.
// Strategy:
//   ink   = key color (slightly darkened if too light)
//   ink2  = lighter / softer twin of ink
//   cream = very light desaturated tint of the key hue (background)
//   card  = slightly lighter cream for surfaces
//   char  = near-black tinted with the same hue (primary text)
//   char2 = mid-tone for secondary text
//   char3 = light mute for meta
//   char4 = very pale divider
//   rouge = complementary warm accent
export function buildPalette(keyHex) {
  const baseHsl = hexToHsl(keyHex);
  const h = baseHsl.h;
  const s = clamp(baseHsl.s, 0, 1);

  // Ensure ink reads as a deep accent; clamp lightness 18%–45%
  const inkL = clamp(baseHsl.l, 0.18, 0.45);
  const ink = hslToHex({ h, s, l: inkL });
  const ink2 = hslToHex({
    h,
    s: clamp(s * 0.85, 0, 1),
    l: clamp(inkL + 0.15, 0, 0.7),
  });

  // Warm background — same hue, very low sat, very high lightness
  const cream = hslToHex({ h, s: clamp(s * 0.18, 0, 0.18), l: 0.92 });
  const card = hslToHex({ h, s: clamp(s * 0.14, 0, 0.16), l: 0.96 });

  // Text neutrals tinted with the same hue
  const char = hslToHex({ h, s: 0.06, l: 0.1 });
  const char2 = hslToHex({ h, s: 0.08, l: 0.32 });
  const char3 = hslToHex({ h, s: 0.06, l: 0.55 });
  const char4 = hslToHex({ h, s: 0.05, l: 0.82 });

  // Complementary warm accent (rouge) — hue + 180, warmed up
  const rougeHue = (h + 200) % 360;
  const rouge = hslToHex({ h: rougeHue, s: 0.55, l: 0.5 });

  return { key: keyHex, ink, ink2, cream, card, char, char2, char3, char4, rouge };
}

export function paletteToCssVars(p) {
  return {
    '--cs-cream': p.cream,
    '--cs-card': p.card,
    '--cs-ink': p.ink,
    '--cs-ink2': p.ink2,
    '--cs-char': p.char,
    '--cs-char2': p.char2,
    '--cs-char3': p.char3,
    '--cs-char4': p.char4,
    '--cs-rouge': p.rouge,
  };
}
