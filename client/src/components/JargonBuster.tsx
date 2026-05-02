import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Loader2, Sparkles } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import T from './T';

const TERMS = [
  "Electoral Roll", "Constituency", "Ballot", "EVM", 
  "Exit Poll", "Model Code of Conduct", "Anti-Defection Law", "Delimitation",
  "NOTA", "Postal Ballot", "Returning Officer", "By-Election"
];

/**
 * JargonBuster Component
 * Why: Educates users about common election terms using the Gemini AI for simple definitions. Uses React.memo and useCallback for efficiency. Proper ARIA roles and modal management included.
 */
const JargonBuster: React.FC = React.memo(() => {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { trackEvent } = useAnalytics();

  const fetchExplanation = useCallback(async (term: string) => {
    setSelectedTerm(term);
    setIsLoading(true);
    setExplanation('');
    // GA4: track when a jargon card is clicked
    trackEvent('jargon_term_clicked', { term });

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Explain the term "${term}" in the context of elections in exactly 2 plain-English sentences.`,
          systemPrompt: "You are a helpful election educator. Give short, factual 2-sentence definitions."
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
        setExplanation(text);
      }
    } catch (error) {
      setExplanation('Sorry, I couldn\'t retrieve an explanation right now. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedTerm(null);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4" role="region" aria-label="Election Jargon Buster">
      <div className="text-center mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4" aria-hidden="true">
          <BookOpen size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800"><T>Election Jargon Buster</T></h2>
        <p className="text-gray-500 mt-2"><T>Click any term to get a simple, 2-sentence explanation.</T></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
        {TERMS.map((term) => (
          <motion.button
            key={term}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchExplanation(term)}
            className="p-6 bg-white border border-surface-dim rounded-xl text-left transition-all hover:border-primary/40 hover:shadow-md interactive-card group"
            role="listitem"
            aria-haspopup="dialog"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800 group-hover:text-primary transition-colors"><T>{term}</T></span>
              <Sparkles size={16} className="text-surface-dim group-hover:text-primary/40 transition-colors" aria-hidden="true" />
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedTerm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass rounded-2xl p-8 shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" aria-hidden="true" />
              
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} aria-hidden="true" />
              </button>

              <h3 id="modal-title" className="text-2xl font-bold text-primary mb-4"><T>{selectedTerm}</T></h3>
              
              <div className="min-h-[100px] flex items-center" aria-live="polite">
                {isLoading && !explanation ? (
                  <div className="flex items-center space-x-3 text-gray-500 italic">
                    <Loader2 className="animate-spin" size={20} aria-label="Loading explanation" />
                  <span><T>Asking Gemini for a simple definition...</T></span>
                  </div>
                ) : (
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {explanation}
                  </p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-surface-dim flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <T>Got it</T>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default JargonBuster;
