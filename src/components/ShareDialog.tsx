import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Globe, Lock, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatasetState } from '../context/DataContext';
import toast from 'react-hot-toast';

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    dataset: DatasetState;
    onUpdateVisibility: (id: string, visibility: 'private' | 'public' | 'shared') => Promise<void>;
}

export function ShareDialog({ isOpen, onClose, dataset, onUpdateVisibility }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const shareUrl = `${window.location.origin}/share/${dataset.id}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVisibilityChange = async (vis: 'private' | 'public' | 'shared') => {
        setLoading(true);
        try {
            await onUpdateVisibility(dataset.id, vis);
            toast.success(`Dataset is now ${vis}`);
        } catch (error) {
            toast.error("Failed to update visibility");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 z-50">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            Share Dataset
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="space-y-6">
                        {/* Visibility Toggle */}
                        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                            <button
                                onClick={() => handleVisibilityChange('private')}
                                disabled={loading}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${dataset.visibility === 'private' || !dataset.visibility
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Private
                            </button>
                            <button
                                onClick={() => handleVisibilityChange('public')}
                                disabled={loading}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${dataset.visibility === 'public'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                Public Link
                            </button>
                        </div>

                        {/* Link Section */}
                        <AnimatePresence mode="wait">
                            {dataset.visibility === 'public' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Anyone with this link can view the analyzed report.
                                    </p>

                                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                                        <input
                                            type="text"
                                            readOnly
                                            value={shareUrl}
                                            className="flex-1 bg-transparent border-none text-xs text-slate-600 dark:text-slate-300 font-mono px-2 focus:ring-0"
                                        />
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-center text-slate-400 font-medium">
                                Changes to visibility are automatically saved.
                            </p>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
