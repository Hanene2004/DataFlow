import React, { createContext, useContext, useCallback } from 'react';
import { toast, ToastOptions } from 'react-hot-toast';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {

    const success = useCallback((message: string, options?: ToastOptions) => {
        toast.success(message, options);
    }, []);

    const error = useCallback((message: string, options?: ToastOptions) => {
        toast.error(message, options);
    }, []);

    const info = useCallback((message: string, options?: ToastOptions) => {
        toast(message, { icon: 'ℹ️', ...options });
    }, []);

    const warning = useCallback((message: string, options?: ToastOptions) => {
        toast(message, { icon: '⚠️', ...options });
    }, []);

    return (
        <NotificationContext.Provider value={{ success, error, info, warning }}>
            {children}
        </NotificationContext.Provider>
    );
}

/* eslint-disable react-refresh/only-export-components */
export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
}


