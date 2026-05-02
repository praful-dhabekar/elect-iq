/**
 * useAnalytics — GA4 event tracking hook.
 *
 * Why: Centralises all gtag calls so they can be easily mocked in tests.
 * Test strategy: Mock window.gtag = jest.fn() and assert calls in unit tests.
 *
 * Tracked events (exact names, no additions):
 *  - "chat_message_sent"     → user sends a chat message
 *  - "tab_switched"          → { tab_name } user changes active tab
 *  - "jargon_term_clicked"   → { term }     user opens a jargon card
 *  - "language_changed"      → { language } user selects a different language
 * @returns {{ trackEvent: (eventName: string, params?: Record<string, string>) => void }}
 */
export function useAnalytics() {
  /**
   * Fires a GA4 event if gtag is available on window.
   * @param {string} eventName - The GA4 event name.
   * @param {Record<string, string>} [params={}] - Optional event parameters.
   */
  const trackEvent = (eventName, params = {}) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, params);
    }
  };

  return { trackEvent };
}
