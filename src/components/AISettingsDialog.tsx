import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Key, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { llmService } from '../services/LLMService';
import toast from 'react-hot-toast';

interface AISettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AISettingsDialog({ isOpen, onClose }: AISettingsDialogProps) {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setIsSaved(true);
            llmService.initialize(savedKey);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!apiKey.trim()) {
            toast.error("Please enter a valid API Key");
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey.trim());
        llmService.initialize(apiKey.trim());
        setIsSaved(true);
        toast.success("Gemini API Key saved successfully!");
        onClose();
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setIsSaved(false);
        toast.success("API Key removed");
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fadeIn" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 z-[70] outline-none overflow-hidden">

                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <Dialog.Title className="text-xl font-black text-slate-900 dark:text-white">AI Intelligence</Dialog.Title>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Google Gemini Flash</p>
                                </div>
                            </div>
                            <Dialog.Close asChild>
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 p-4 rounded-2xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                    MultiHub uses local storage to keep your API key. We never send your key to our own servers; it stays in your browser.
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                    Gemini API Key
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Key className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Enter your key here..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 pl-12 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                                    />
                                    {isSaved && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">Active</span>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-3 text-[11px] text-slate-400 px-1 leading-relaxed">
                                    Don't have a key? Get one for free at the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Google AI Studio</a>.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Activate Intelligence
                                </button>
                                {isSaved && (
                                    <button
                                        onClick={handleClear}
                                        className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-2xl font-bold text-sm transition-all"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
