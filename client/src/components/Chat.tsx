import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAnalytics } from '../hooks/useAnalytics';
import T from './T';
import { useT } from '../context/TranslationContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = "You are an election education assistant. Answer questions about election processes, voter rights, timelines, and civic participation in simple, neutral, factual language. Never express political opinions or favor any party or candidate.";

/**
 * TypingIndicator Component
 * Why: Provides a visual cue (animated three dots) to the user that the AI is processing their request.
 */
const TypingIndicator = () => (
  <div className="flex space-x-1.5 p-3 bg-surface-container border border-surface-dim rounded-bubble rounded-tl-none w-16 items-center justify-center" aria-label="AI is typing">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.2, 
          delay: i * 0.2,
          ease: "easeInOut"
        }}
        className="w-1.5 h-1.5 bg-primary rounded-full"
      />
    ))}
  </div>
);

/**
 * Chat Component
 * Why: Provides the main conversational interface with the Gemini AI. Wrapped in React.memo for efficiency. Uses useCallback to optimize event handlers.
 */
const Chat: React.FC = React.memo(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  const welcomeKey = 'Hello! I am your ElectIQ assistant. How can I help you learn about the election process today?';
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { trackEvent } = useAnalytics();
  const { t } = useT();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialise welcome message after context is available
  useEffect(() => {
    setMessages([{ role: 'assistant', content: welcomeKey }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    // GA4: track when user sends a chat message
    trackEvent('chat_message_sent');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: SYSTEM_PROMPT
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to server');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantText = '';
      const decoder = new TextDecoder();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        
        if (isFirstChunk && assistantText.trim().length > 0) {
          setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
          isFirstChunk = false;
        } else if (!isFirstChunk) {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            const rest = prev.slice(0, -1);
            return [...rest, { ...last, content: assistantText }];
          });
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I am having trouble connecting right now. Please check your connection or try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const showTypingIndicator = isLoading && (messages[messages.length - 1]?.role === 'user');

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto glass rounded-2xl overflow-hidden mt-4" role="region" aria-label="Chat Interface">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start max-w-[85%] space-x-2">
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1" aria-hidden="true">
                    <Bot size={18} className="text-primary" />
                  </div>
                )}
                <div 
                  className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                  role="log"
                  aria-label={`${m.role} message`}
                >
                  {m.role === 'assistant' ? (
                    <div className="markdown-content prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content === welcomeKey ? t(welcomeKey) : m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center mt-1" aria-hidden="true">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {showTypingIndicator && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1" aria-hidden="true">
                  <Bot size={18} className="text-primary" />
                </div>
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/50 border-t border-surface-dim">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('Ask about voter registration, polling, or election rules...')}
            className="w-full bg-white border border-surface-dim rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={isLoading}
            aria-label="Message ElectIQ assistant"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} aria-label="Loading" /> : <Send size={20} aria-hidden="true" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center" aria-live="off">
          <T>ElectIQ provides factual information based on official election processes.</T>
        </p>
      </div>
    </div>
  );
});

export default Chat;
