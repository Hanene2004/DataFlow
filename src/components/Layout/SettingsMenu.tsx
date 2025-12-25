import { useState } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Monitor, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useSettings, Language, DateFormat } from '../../context/SettingsContext';

interface SettingsMenuProps {
    isOpen: boolean;
}

type ThemeMode = 'light' | 'dark' | 'auto';

export function SettingsMenu({ isOpen }: SettingsMenuProps) {
    const { theme, setTheme } = useTheme();
    const {
        language, setLanguage,
        dateFormat, setDateFormat,
        formatDate
    } = useSettings();

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const handleThemeChange = (newTheme: ThemeMode) => {
        if (newTheme === 'auto') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setTheme(systemTheme);
        } else {
            setTheme(newTheme);
        }
        setActiveDropdown(null);
    };

    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang);
        setActiveDropdown(null);
    };

    const handleDateFormatChange = (format: DateFormat) => {
        setDateFormat(format);
        setActiveDropdown(null);
    };

    const themeOptions: { value: ThemeMode; label: string; icon: any }[] = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'auto', label: 'Auto', icon: Monitor }
    ];

    const languageOptions: { value: Language; label: string }[] = [
        { value: 'EN', label: 'English' },
        { value: 'FR', label: 'Français' }
    ];

    const dateFormatOptions: DateFormat[] = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

    if (!isOpen) return null;

    return (
        <div className="px-3 py-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 mb-2">
                <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wider">Settings</span>
            </div>

            <div className="mt-2 space-y-1">
                {/* Theme */}
                <div className="relative">
                    <button
                        onClick={() => setActiveDropdown(activeDropdown === 'theme' ? null : 'theme')}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span>Theme</span>
                        <span className="text-xs text-gray-400 capitalize">{theme}</span>
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'theme' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden"
                            >
                                {themeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleThemeChange(option.value)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <option.icon className="w-4 h-4" />
                                        <span className="flex-1 text-left">{option.label}</span>
                                        {theme === option.value && <Check className="w-4 h-4 text-indigo-600" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Language */}
                <div className="relative">
                    <button
                        onClick={() => setActiveDropdown(activeDropdown === 'language' ? null : 'language')}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span>Language</span>
                        <span className="text-xs text-gray-400">{language}</span>
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'language' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden"
                            >
                                {languageOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleLanguageChange(option.value)}
                                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <span>{option.label}</span>
                                        {language === option.value && <Check className="w-4 h-4 text-indigo-600" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Date Format */}
                <div className="relative">
                    <button
                        onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span>Date format</span>
                        <span className="text-xs text-gray-400">{formatDate(new Date())}</span>
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'date' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden"
                            >
                                {dateFormatOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleDateFormatChange(option)}
                                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {/* Use the formatDate helper with the specific option for preview */}
                                        <span>{formatDate(new Date(), option)}</span>
                                        {dateFormat === option && <Check className="w-4 h-4 text-indigo-600" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
