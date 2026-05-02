import { useState, useRef, useCallback, useEffect } from 'react';

import { SUPPORTED_LANGUAGES, TRANSLATION_BATCH_DELAY_MS, STORAGE_KEYS } from '../constants';

const ALLOWED_LANGUAGES = SUPPORTED_LANGUAGES.map(lang => lang.code);

/**
 * Returns the cached or queued translation key for a given target language + text pair.
 * Pure function — easily unit-testable without React.
 * @param {string} targetLang
 * @param {string} text
 * @returns {string}
 */
export function buildCacheKey(targetLang, text) {
  return `${targetLang}:${text}`;
}

/**
 * useTranslation — batched Cloud Translation API hook.
 *
 * Why: Batching requests for 100 ms avoids N individual API calls when many
 * <T> components mount simultaneously, keeping costs and latency low.
 * @returns {{ t: Function, language: string, setLanguage: Function, isTranslating: boolean }}
 */
export function useTranslation() {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en'
  );
  const [isTranslating, setIsTranslating] = useState(false);

  // Map<cacheKey, translatedString>
  const cache = useRef(new Map());
  // Pending texts waiting to be batched
  const pendingTexts = useRef(new Set());
  const batchTimer = useRef(null);
  // Force re-render subscribers when cache updates
  const [, forceUpdate] = useState(0);

  /**
   * Sets the language state and saves it to local storage.
   * @param {string} lang - The selected language code
   */
  const setLanguage = useCallback((lang) => {
    if (!ALLOWED_LANGUAGES.includes(lang)) return;
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    setLanguageState(lang);
  }, []);

  /**
   * Flushes the pending batch: sends one API call for all queued unique texts.
   * Gracefully falls back to original text on any error.
   * @param {string} targetLang - The language to translate to.
   * @param {string[]} texts - Array of strings to translate.
   * @returns {Promise<void>}
   */
  const flushBatch = useCallback(async (targetLang, texts) => {
    if (texts.length === 0) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, targetLanguage: targetLang }),
      });
      if (!res.ok) throw new Error('Translation request failed');
      const { translations } = await res.json();
      texts.forEach((text, i) => {
        cache.current.set(buildCacheKey(targetLang, text), translations[i] ?? text);
      });
    } catch {
      // Silently fall back — never surface translation errors to the user
      texts.forEach((text) => {
        cache.current.set(buildCacheKey(targetLang, text), text);
      });
    } finally {
      setIsTranslating(false);
      forceUpdate((n) => n + 1);
    }
  }, []);

  /**
   * t(text) — translate a string.
   * Returns original text immediately (no spinner) while a translation is in flight.
   * @param {string} text - The source English string.
   * @returns {string} - Translated or original text.
   */
  const t = useCallback((text) => {
    if (!text || language === 'en') return text;
    const key = buildCacheKey(language, text);
    if (cache.current.has(key)) return cache.current.get(key);

    // Queue for batch
    if (!pendingTexts.current.has(text)) {
      pendingTexts.current.add(text);
      clearTimeout(batchTimer.current);
      batchTimer.current = setTimeout(() => {
        const batch = [...pendingTexts.current];
        pendingTexts.current.clear();
        flushBatch(language, batch);
      }, TRANSLATION_BATCH_DELAY_MS);
    }

    return text; // Return original while translation is pending
  }, [language, flushBatch]);

  // Clear cache when language changes
  useEffect(() => {
    cache.current.clear();
    pendingTexts.current.clear();
    clearTimeout(batchTimer.current);
    forceUpdate((n) => n + 1);
  }, [language]);

  return { t, language, setLanguage, isTranslating };
}
