import { useEffect, useState } from 'react';
import { supabase, Dataset } from '../lib/supabase';
import { Clock, FileText, Calendar, Database, X, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryProps {
    onLoad: (dataset: Dataset) => void;
    onClose: () => void;
}

export function History({ onLoad, onClose }: HistoryProps) {
    const [history, setHistory] = useState<Dataset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('datasets')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Failed to load history. Please ensure Supabase is configured.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end transition-opacity">
            <div className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-800">History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-gray-500">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center p-8 bg-red-50 rounded-lg">
                            <p className="text-red-600 mb-2">{error}</p>
                            <button
                                onClick={fetchHistory}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <HistoryIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>No upload history found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                            <h3 className="font-semibold text-gray-800 truncate max-w-[200px]" title={item.filename}>
                                                {item.filename}
                                            </h3>
                                        </div>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                                            {format(new Date(item.created_at || new Date()), 'MMM d, yyyy')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-4 h-4 text-gray-400" />
                                            <span>{item.row_count?.toLocaleString()} rows</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>{format(new Date(item.created_at || new Date()), 'HH:mm')}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onLoad(item)}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 py-2 rounded-md transition-colors border border-gray-200 hover:border-blue-200 font-medium text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Load Dataset
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function HistoryIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}
