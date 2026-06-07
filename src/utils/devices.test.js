import { describe, it, expect } from 'vitest';
import { DEVICES, DEVICE_LIST, getDevice } from './devices';

describe('devices catalog', () => {
  it('exposes a non-empty list', () => {
    expect(DEVICE_LIST.length).toBeGreaterThan(0);
  });

  it('every device has the fields the poster renderer needs', () => {
    for (const d of DEVICE_LIST) {
      expect(typeof d.label).toBe('string');
      expect(d.posterW).toBeGreaterThan(0);
      expect(d.posterH).toBeGreaterThan(0);
      expect(d.shellW).toBeGreaterThan(0);
      expect(d.shellH).toBeGreaterThan(0);
      expect(d.screenRadius).toBeGreaterThanOrEqual(0);
    }
  });

  it('screenshot ratio matches poster dimensions', () => {
    for (const d of DEVICE_LIST) {
      expect(d.screenshotRatio).toBeCloseTo(d.posterW / d.posterH, 5);
    }
  });

  it('notch is null or a known shape', () => {
    const kinds = new Set(['island', 'notch', 'home']);
    for (const d of DEVICE_LIST) {
      if (d.notch !== null) expect(kinds.has(d.notch.kind)).toBe(true);
    }
  });

  it('iPhone 6.9" uses the exact App Store screenshot size', () => {
    expect(DEVICES['iphone-6.9'].posterW).toBe(1290);
    expect(DEVICES['iphone-6.9'].posterH).toBe(2796);
  });

  it('getDevice falls back to a sane default for unknown ids', () => {
    expect(getDevice('does-not-exist').id).toBe('iphone-6.9');
    expect(getDevice(undefined)).toBeTruthy();
  });
});
