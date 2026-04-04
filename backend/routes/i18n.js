// ============ I18N API ROUTES ============
// GET  /api/i18n/locales              — List supported locales
// GET  /api/i18n/translations/:locale — Get all translations for a locale

const express = require('express');
const router = express.Router();
const { getSupportedLocales } = require('../i18n');

const en = require('../i18n/locales/en');
const ms = require('../i18n/locales/ms');
const zh = require('../i18n/locales/zh');
const translations = { en, ms, zh };

module.exports = function () {

  // GET /api/i18n/locales — List supported locales
  router.get('/locales', (req, res) => {
    res.json(getSupportedLocales());
  });

  // GET /api/i18n/translations/:locale — Get all translations
  router.get('/translations/:locale', (req, res) => {
    const locale = req.params.locale;
    if (!translations[locale]) {
      return res.status(404).json({ error: 'Locale not found. Supported: ' + getSupportedLocales().join(', ') });
    }
    res.json(translations[locale]);
  });

  return router;
};
