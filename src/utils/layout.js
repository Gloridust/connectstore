// Per-poster layout model. Kept in its own module (not the Poster component)
// so it can be imported by the editor, storage, and tests without tripping
// React Fast Refresh's "components-only export" rule.

export const DEFAULT_LAYOUT = {
  textPos: 'top', // 'top' | 'bottom' | 'none'
  bgStyle: 'solid', // 'solid' | 'gradient' | 'radial'
  showDevice: true,
  showFooter: true,
  deviceScale: 1, // 0.6 – 1.3
  deviceOffsetY: 0, // -200 – 400 px (poster space)
  rotation: 0, // -12 – 12 deg
  fontScale: 1, // 0.7 – 1.4
};

export function normalizeLayout(layout) {
  return { ...DEFAULT_LAYOUT, ...(layout || {}) };
}
