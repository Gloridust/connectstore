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
  let r1, g1, b1;
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

// Build a poster palette from TWO source colors:
//   bgHex     — drives the poster background ("cream") and surface ("card")
//   accentHex — drives the headline emphasis ("ink"/"ink2") and brand mark
//
// Text neutrals are pulled toward the accent hue (so they read as part of the
// same family) while bg variants are pulled from the background hue. This
// keeps "warm paper + cool ink" combos coherent (e.g. cream paper + navy ink).
//
//   ink   = accent (clamped to a readable dark)
//   ink2  = lighter twin of ink (used for italic emphasis)
//   cream = very light, low-sat tint of the bg hue (background)
//   card  = slightly lighter / different cream for surfaces
//   char  = near-black tinted with the accent hue (primary text)
//   char2 = mid-tone tinted with accent (secondary text)
//   char3 = light mute (meta)
//   char4 = very pale divider
//   rouge = complementary warm accent
export function buildPalette(bgHex, accentHex) {
  // Backward-compat: if called with one arg, treat it as accent and use
  // a default cream background.
  if (accentHex == null) {
    accentHex = bgHex;
    bgHex = '#f4ecd8';
  }

  const bgHsl = hexToHsl(bgHex);
  const accentHsl = hexToHsl(accentHex);

  // ---- Background family (from bgHex) ----
  // Allow user to pick a richly-colored swatch but render the actual paper
  // softer: clamp lightness ≥ 0.86 and saturation ≤ 0.28 so text stays legible.
  const bgL = clamp(bgHsl.l, 0.82, 0.97);
  const bgS = Math.min(bgHsl.s, 0.32);
  const cream = hslToHex({ h: bgHsl.h, s: bgS, l: bgL });
  // Card is brighter/cleaner than cream (sits on top of it)
  const card = hslToHex({
    h: bgHsl.h,
    s: clamp(bgS * 0.85, 0, 0.28),
    l: clamp(bgL + 0.04, 0.86, 0.99),
  });

  // ---- Accent family (from accentHex) ----
  const ah = accentHsl.h;
  const aS = clamp(accentHsl.s, 0, 1);
  const inkL = clamp(accentHsl.l, 0.18, 0.45);
  const ink = hslToHex({ h: ah, s: aS, l: inkL });
  const ink2 = hslToHex({
    h: ah,
    s: clamp(aS * 0.85, 0, 1),
    l: clamp(inkL + 0.15, 0, 0.7),
  });

  // ---- Text neutrals — tinted toward the ACCENT hue, so the type belongs
  // to the same family as the headline emphasis even on a warm bg ----
  const char = hslToHex({ h: ah, s: 0.08, l: 0.1 });
  const char2 = hslToHex({ h: ah, s: 0.1, l: 0.32 });
  const char3 = hslToHex({ h: ah, s: 0.06, l: 0.55 });
  const char4 = hslToHex({ h: ah, s: 0.05, l: 0.82 });

  // Complementary accent (rouge) — accent hue + 200, warmed up
  const rougeHue = (ah + 200) % 360;
  const rouge = hslToHex({ h: rougeHue, s: 0.55, l: 0.5 });

  // Soft accent "wash" — a light tint of the accent hue, used as the top stop
  // of a gradient background so the headline sits in a subtle accent glow.
  const wash = hslToHex({ h: ah, s: clamp(aS * 0.4, 0.1, 0.22), l: 0.93 });

  return {
    bg: bgHex,
    accent: accentHex,
    ink,
    ink2,
    cream,
    card,
    char,
    char2,
    char3,
    char4,
    rouge,
    wash,
  };
}

// CSS background value for a poster, given the palette and a style.
//   'solid'    -> flat cream
//   'gradient' -> soft accent wash fading into cream
//   'radial'   -> accent glow behind the headline area
export function backgroundFor(palette, style) {
  switch (style) {
    case 'gradient':
      return `linear-gradient(180deg, ${palette.wash} 0%, ${palette.cream} 62%)`;
    case 'radial':
      return `radial-gradient(120% 70% at 50% 0%, ${palette.wash} 0%, ${palette.cream} 60%)`;
    case 'solid':
    default:
      return palette.cream;
  }
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
    '--cs-wash': p.wash,
  };
}
