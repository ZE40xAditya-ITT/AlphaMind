import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import LoadingSpinner from './common/LoadingSpinner';

const GlobalChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'Hello! I am your AlphaMind Global Copilot. Ask me anything about the market or how to use the platform.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFAQClick = (faq: string) => {
    setQuery(faq);
    // Optionally auto-submit:
    // handleSubmit FAQ directly
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    setQuery(faq);
    setTimeout(() => {
        const form = document.getElementById('global-chatbot-form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 50);
  };

  const faqs = [
    "What is the overall market sentiment?",
    "How does the diversification score work?",
    "What are the top performing sectors right now?",
    "How are AI recommendations generated?"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await api.post('/copilot/ask-global', { question: userMessage });
      setMessages(prev => [...prev, { role: 'bot', content: res.data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I encountered an error while fetching the response.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-50 ${isOpen ? 'hidden' : ''}`}
      >
        <MessageSquare size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden z-50"
            style={{ height: '500px' }}
          >
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} />
                <h3 className="font-bold">Global Copilot</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0B1121]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700'
                  }`}>
                    <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 text-slate-500 rounded-2xl rounded-bl-none p-3 shadow-sm border border-slate-100 dark:border-slate-700">
                    <LoadingSpinner message="Thinking..." />
                  </div>
                </div>
              )}
              
              {messages.length === 1 && !isLoading && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider px-1">Suggested Questions</p>
                  <div className="flex flex-wrap gap-2">
                    {faqs.map((faq, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => {
                          setQuery(faq);
                          setMessages(prev => [...prev, { role: 'user', content: faq }]);
                          setIsLoading(true);
                          api.post('/copilot/ask-global', { question: faq })
                            .then(res => setMessages(prev => [...prev, { role: 'bot', content: res.data.answer }]))
                            .catch(() => setMessages(prev => [...prev, { role: 'bot', content: 'Error fetching response.' }]))
                            .finally(() => setIsLoading(false));
                        }}
                        className="text-left text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-xl transition border border-indigo-100 dark:border-indigo-800"
                      >
                        {faq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form id="global-chatbot-form" onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              />
              <button type="submit" disabled={!query || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition disabled:opacity-50 shrink-0">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalChatbot;
