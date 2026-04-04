// ============ INTERNATIONALIZATION (i18n) ENGINE ============
// Supports: English (en), Malay (ms), Chinese (zh)
// Usage:
//   const { t, setLocale, getLocale, getSupportedLocales } = require('./i18n');
//   t('error.not_found', 'en')  => 'Not found'
//   t('error.not_found', 'ms')  => 'Tidak dijumpai'
//   t('error.not_found', 'zh')  => '未找到'

const en = require('./locales/en');
const ms = require('./locales/ms');
const zh = require('./locales/zh');

const locales = { en, ms, zh };
let defaultLocale = 'en';

/**
 * Translate a key to a specific locale
 * Supports nested keys with dot notation: 'error.not_found'
 * Falls back to English, then returns the key itself
 * @param {string} key - Dot-notation translation key
 * @param {string} [locale] - Target locale (en/ms/zh)
 * @param {Object} [params] - Interpolation params: { name: 'John' } => 'Hello {{name}}' -> 'Hello John'
 * @returns {string}
 */
function t(key, locale, params) {
  locale = locale || defaultLocale;
  
  // Resolve nested key
  const resolve = (obj, path) => {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  };

  let val = resolve(locales[locale], key);
  
  // Fallback chain: requested locale -> English -> key
  if (val === undefined && locale !== 'en') {
    val = resolve(locales.en, key);
  }
  if (val === undefined) return key;

  // Interpolate {{param}} placeholders
  if (params && typeof val === 'string') {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(v));
    }
  }

  return val;
}

/**
 * Express middleware: sets req.locale from Accept-Language header or ?lang= query
 */
function i18nMiddleware(req, res, next) {
  // Priority: ?lang= query > Accept-Language header > default
  let locale = req.query.lang;
  
  if (!locale || !locales[locale]) {
    const accept = req.headers['accept-language'] || '';
    // Parse Accept-Language: en-US,en;q=0.9,zh-CN;q=0.8,ms;q=0.7
    const langs = accept.split(',').map(l => l.split(';')[0].trim().split('-')[0].toLowerCase());
    locale = langs.find(l => locales[l]) || defaultLocale;
  }

  req.locale = locale;
  // Attach translator to request for convenience
  req.t = (key, params) => t(key, locale, params);
  next();
}

function setDefaultLocale(locale) {
  if (locales[locale]) defaultLocale = locale;
}

function getDefaultLocale() { return defaultLocale; }
function getSupportedLocales() { return Object.keys(locales); }

module.exports = { t, i18nMiddleware, setDefaultLocale, getDefaultLocale, getSupportedLocales };
