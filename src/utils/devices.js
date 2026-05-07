// Apple App Store screenshot specifications.
// posterW × posterH is the FULL screenshot size required by App Store Connect.
// shellW/shellH/shellRadius/screenRadius are visual proportions that mimic the
// physical iPhone/iPad in the poster — sized so that the inner screen keeps the
// device's true display aspect ratio. Dynamic Island / notch dimensions are
// approximations of Apple's published values, scaled down to look right inside
// the poster's coordinate system.
// Reference:
// https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
// https://www.paintcodeapp.com/news/iphone-16-screen-sizes
//
// notch shape: 'island' = floating capsule (Dynamic Island, iPhone 14 Pro+)
//              'notch'  = top-attached rounded rect (iPhone X..13 era)
//              null     = none (home-button era / iPad)

export const DEVICES = {
  'iphone-6.9': {
    id: 'iphone-6.9',
    label: 'iPhone 6.9"',
    posterW: 1290,
    posterH: 2796,
    shellW: 942,
    shellH: 2026,
    shellRadius: 162,
    shellPadding: 22,
    screenRadius: 132,
    notch: { kind: 'island', w: 296, h: 88, top: 38 },
    screenshotRatio: 1290 / 2796,
  },
  'iphone-6.7': {
    id: 'iphone-6.7',
    label: 'iPhone 6.7"',
    posterW: 1290,
    posterH: 2796,
    shellW: 942,
    shellH: 2026,
    shellRadius: 162,
    shellPadding: 22,
    screenRadius: 132,
    notch: { kind: 'island', w: 296, h: 88, top: 38 },
    screenshotRatio: 1290 / 2796,
  },
  'iphone-6.5': {
    id: 'iphone-6.5',
    label: 'iPhone 6.5"',
    posterW: 1284,
    posterH: 2778,
    shellW: 920,
    shellH: 1980,
    shellRadius: 144,
    shellPadding: 22,
    screenRadius: 116,
    notch: { kind: 'notch', w: 430, h: 64 },
    screenshotRatio: 1284 / 2778,
  },
  'iphone-5.5': {
    id: 'iphone-5.5',
    label: 'iPhone 5.5"',
    posterW: 1242,
    posterH: 2208,
    shellW: 880,
    shellH: 1556,
    shellRadius: 70,
    shellPadding: 18,
    screenRadius: 6,
    // home-button era — keep a slim earpiece + camera bar instead of a notch
    notch: { kind: 'home', earpiece: { w: 130, h: 14, top: 24 }, camera: { offset: 100, r: 14 } },
    screenshotRatio: 1242 / 2208,
  },
  'ipad-13': {
    id: 'ipad-13',
    label: 'iPad 13"',
    posterW: 2064,
    posterH: 2752,
    shellW: 1380,
    shellH: 1880,
    shellRadius: 90,
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
    shellRadius: 86,
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
