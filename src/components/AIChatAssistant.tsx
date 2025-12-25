import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { llmService } from '../services/LLMService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function AIChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your AI Data Assistant. Ask me anything about your current dataset!' }
    ]);
    const [loading, setLoading] = useState(false);
    const { activeDataset } = useData();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = async () => {
        if (!message.trim() || !activeDataset || loading) return;

        if (!llmService.isReady) {
            setHistory(prev => [...prev, { role: 'assistant', content: "Please set your Gemini API Key in the AI Settings (Sparkles icon) to enable advanced chat." }]);
            return;
        }

        const userMsg = message;
        setMessage('');
        setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const context = {
                filename: activeDataset.filename,
                stats: activeDataset.stats.map(s => ({ name: s.name, type: s.type, mean: s.mean, missing: s.missing })),
                sample: activeDataset.data.slice(0, 2)
            };

            const reply = await llmService.generateInsight(userMsg, context);
            setHistory(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (error: any) {
            setHistory(prev => [...prev, { role: 'assistant', content: `Sorry, I hit an error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-indigo-700 transition-colors"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                <MessageSquare className="w-6 h-6" />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1"
                >
                    <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </motion.div>
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center bg-gradient-to-r from-indigo-600 to-violet-600">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">AI Data Assistant</h3>
                                    <p className="text-[10px] text-indigo-100">Powered by MultiHub ML</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {!activeDataset && (
                                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs italic">
                                    Please upload a dataset to enable me to analyze it for you!
                                </div>
                            )}
                            {history.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-slate-700/50 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-slate-600'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-slate-700/50 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={activeDataset ? "Ask about your data..." : "Upload data first..."}
                                    disabled={!activeDataset || loading}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors disabled:opacity-50"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!activeDataset || loading || !message.trim()}
                                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200 dark:shadow-none"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-2 text-center">MultiHub Assistant can analyze stats and patterns in your data.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
