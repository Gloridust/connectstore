// Default App Store Connect localized text fields.
// Each entry: { id, labelKey, type, max, hint }
// Lengths follow App Store Connect limits (text-side; URL fields untyped).

export const DEFAULT_FIELDS = [
  { id: 'name', labelKey: 'field.name', type: 'text', max: 30 },
  { id: 'subtitle', labelKey: 'field.subtitle', type: 'text', max: 30 },
  { id: 'promotionalText', labelKey: 'field.promotionalText', type: 'textarea', max: 170 },
  { id: 'description', labelKey: 'field.description', type: 'textarea', max: 4000 },
  { id: 'keywords', labelKey: 'field.keywords', type: 'text', max: 100 },
  { id: 'whatsNew', labelKey: 'field.whatsNew', type: 'textarea', max: 4000 },
  { id: 'supportUrl', labelKey: 'field.supportUrl', type: 'url' },
  { id: 'marketingUrl', labelKey: 'field.marketingUrl', type: 'url' },
  { id: 'privacyUrl', labelKey: 'field.privacyUrl', type: 'url' },
];

export const FIELD_TYPES = ['text', 'textarea', 'url'];

// Common App Store localization codes. Users can add others.
export const COMMON_LOCALES = [
  { code: 'en-US', label: 'English (U.S.)' },
  { code: 'en-GB', label: 'English (U.K.)' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'es-ES', label: 'Español' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'ru', label: 'Русский' },
  { code: 'it', label: 'Italiano' },
];

export function localeLabel(code) {
  const m = COMMON_LOCALES.find((x) => x.code === code);
  return m ? m.label : code;
}
