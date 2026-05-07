// Apple App Store screenshot specifications.
// Sizes are the FULL screenshot size required by App Store Connect.
// Source: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications

export const DEVICES = {
  'iphone-6.9': {
    id: 'iphone-6.9',
    label: 'iPhone 6.9"',
    posterW: 1290,
    posterH: 2796,
    // physical phone shell rendered inside the poster
    shellW: 940,
    shellH: 2034,
    shellRadius: 116,
    shellPadding: 24,
    screenRadius: 92,
    notch: { w: 250, h: 70, top: 44 },
    // device screenshot native aspect ratio (for uploaded screenshot fit)
    screenshotRatio: 1290 / 2796,
  },
  'iphone-6.7': {
    id: 'iphone-6.7',
    label: 'iPhone 6.7"',
    posterW: 1290,
    posterH: 2796,
    shellW: 940,
    shellH: 2034,
    shellRadius: 116,
    shellPadding: 24,
    screenRadius: 92,
    notch: { w: 250, h: 70, top: 44 },
    screenshotRatio: 1290 / 2796,
  },
  'iphone-6.5': {
    id: 'iphone-6.5',
    label: 'iPhone 6.5"',
    posterW: 1284,
    posterH: 2778,
    shellW: 920,
    shellH: 1880,
    shellRadius: 110,
    shellPadding: 22,
    screenRadius: 88,
    notch: { w: 250, h: 70, top: 44 },
    screenshotRatio: 1284 / 2778,
  },
  'iphone-5.5': {
    id: 'iphone-5.5',
    label: 'iPhone 5.5"',
    posterW: 1242,
    posterH: 2208,
    shellW: 880,
    shellH: 1560,
    shellRadius: 64,
    shellPadding: 18,
    screenRadius: 36,
    notch: null, // home button era, no notch
    screenshotRatio: 1242 / 2208,
  },
  'ipad-13': {
    id: 'ipad-13',
    label: 'iPad 13"',
    posterW: 2064,
    posterH: 2752,
    shellW: 1380,
    shellH: 1880,
    shellRadius: 80,
    shellPadding: 30,
    screenRadius: 56,
    notch: null,
    screenshotRatio: 2064 / 2752,
  },
  'ipad-12.9': {
    id: 'ipad-12.9',
    label: 'iPad Pro 12.9"',
    posterW: 2048,
    posterH: 2732,
    shellW: 1380,
    shellH: 1840,
    shellRadius: 72,
    shellPadding: 28,
    screenRadius: 50,
    notch: null,
    screenshotRatio: 2048 / 2732,
  },
};

export const DEVICE_LIST = Object.values(DEVICES);

export function getDevice(id) {
  return DEVICES[id] || DEVICES['iphone-6.9'];
}
