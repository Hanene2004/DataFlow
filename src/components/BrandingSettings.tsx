import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, X, Upload, Palette, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface BrandingConfig {
    companyName: string;
    logoUrl: string;
    primaryColor: string;
}

interface BrandingSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: BrandingConfig) => void;
}

export function BrandingSettings({ isOpen, onClose, onSave }: BrandingSettingsProps) {
    const [config, setConfig] = useState<BrandingConfig>({
        companyName: '',
        logoUrl: '',
        primaryColor: '#6366f1' // Indigo-500 default
    });

    useEffect(() => {
        const saved = localStorage.getItem('company_branding');
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse branding settings", e);
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('company_branding', JSON.stringify(config));
        onSave(config);
        toast.success("Branding settings saved!");
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-500" />
                            Company Branding
                        </Dialog.Title>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Company Name
                            </label>
                            <input
                                type="text"
                                value={config.companyName}
                                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                                placeholder="Acme Corp"
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Logo URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Logo URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.logoUrl}
                                    onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            {config.logoUrl && (
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-slate-800 rounded-lg flex justify-center">
                                    <img src={config.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                                </div>
                            )}
                        </div>

                        {/* Primary Color */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Palette className="w-4 h-4" /> Report Theme Color
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={config.primaryColor}
                                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                    className="w-12 h-12 rounded cursor-pointer border-none"
                                />
                                <span className="text-sm text-gray-500 font-mono uppercase">{config.primaryColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-500/30"
                        >
                            Save Settings
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
