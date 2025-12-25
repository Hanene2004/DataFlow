import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useNotification, Notification as NotificationType } from '../context/NotificationContext';

export function ToastContainer() {
    const { notifications, remove } = useNotification();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <Toast key={notification.id} notification={notification} onClose={() => remove(notification.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

interface ToastProps {
    notification: NotificationType;
    onClose: () => void;
}

function Toast({ notification, onClose }: ToastProps) {
    const { type, message } = notification;

    const config = {
        success: {
            icon: CheckCircle,
            bgClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            iconClass: 'text-green-600 dark:text-green-400',
            textClass: 'text-green-800 dark:text-green-200'
        },
        error: {
            icon: XCircle,
            bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            iconClass: 'text-red-600 dark:text-red-400',
            textClass: 'text-red-800 dark:text-red-200'
        },
        info: {
            icon: Info,
            bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            iconClass: 'text-blue-600 dark:text-blue-400',
            textClass: 'text-blue-800 dark:text-blue-200'
        },
        warning: {
            icon: AlertTriangle,
            bgClass: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
            iconClass: 'text-yellow-600 dark:text-yellow-400',
            textClass: 'text-yellow-800 dark:text-yellow-200'
        }
    };

    const { icon: Icon, bgClass, iconClass, textClass } = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`${bgClass} border rounded-xl p-4 shadow-lg backdrop-blur-sm flex items-start gap-3 min-w-[300px]`}
        >
            <Icon className={`w-5 h-5 ${iconClass} shrink-0 mt-0.5`} />
            <p className={`flex-1 text-sm font-medium ${textClass}`}>{message}</p>
            <button
                onClick={onClose}
                className={`${iconClass} hover:opacity-70 transition-opacity shrink-0`}
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
