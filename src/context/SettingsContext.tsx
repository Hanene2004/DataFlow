import React, { createContext, useContext, useState } from 'react';

export type Language = 'EN' | 'FR';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

interface SettingsContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    dateFormat: DateFormat;
    setDateFormat: (format: DateFormat) => void;
    formatNumber: (value: number) => string;
    formatDate: (date: Date | string, overrideFormat?: DateFormat) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Initialize state from localStorage or defaults
    const [language, setLanguageState] = useState<Language>(() =>
        (localStorage.getItem('language') as Language) || 'EN'
    );
    // Number format is now standardized to US/International (1,234.56)
    const [dateFormat, setDateFormatState] = useState<DateFormat>(() =>
        (localStorage.getItem('dateFormat') as DateFormat) || 'MM/DD/YYYY'
    );

    // Update localStorage when state changes
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const setDateFormat = (format: DateFormat) => {
        setDateFormatState(format);
        localStorage.setItem('dateFormat', format);
    };

    // Helper functions for formatting
    const formatNumber = (value: number): string => {
        if (isNaN(value)) return '0';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (date: Date | string, overrideFormat?: DateFormat): string => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        const formatToUse = overrideFormat || dateFormat;

        switch (formatToUse) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM/DD/YYYY':
            default:
                return `${month}/${day}/${year}`;
        }
    };

    return (
        <SettingsContext.Provider value={{
            language,
            setLanguage,
            dateFormat,
            setDateFormat,
            formatNumber,
            formatDate
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
