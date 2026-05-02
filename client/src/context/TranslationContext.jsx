import { createContext, useContext } from 'react';
import { useTranslation } from '../hooks/useTranslation';

/**
 * TranslationContext — shares the translation state across the component tree
 * without prop-drilling.
 * Instantiated once at the app root so only one batch timer exists.
 */
export const TranslationContext = createContext(null);

/** Provider to be placed at the app root. */
export function TranslationProvider({ children }) {
  const translation = useTranslation();
  return (
    <TranslationContext.Provider value={translation}>
      {children}
    </TranslationContext.Provider>
  );
}

/** Hook to consume the shared translation context. */
export function useT() {
  return useContext(TranslationContext);
}
