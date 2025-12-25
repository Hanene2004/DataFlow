import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Dashboard } from '../components/Dashboard';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

export function SharedDashboardPage() {
    const { id } = useParams<{ id: string }>();
    const { datasets, setActiveId, activeDataset } = useData();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        // Simulate fetching/finding dataset
        const timer = setTimeout(() => {
            const found = datasets.find(d => d.id === id);
            if (found) {
                setActiveId(id);
                setError(null);
            } else {
                setError("Dataset not found or access denied.");
            }
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [id, datasets, setActiveId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Loading Secure View...</h2>
                </div>
            </div>
        );
    }

    if (error || !activeDataset) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center border-t-4 border-red-500">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-6">{error || "This dashboard is effectively private."}</p>
                    <Link to="/" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Read Only Banner */}
            <div className="bg-indigo-600 text-white px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wide">Read-Only Mode</span>
                </div>
                <div className="text-xs font-mono opacity-80">
                    Viewing: {activeDataset.filename}
                </div>
            </div>

            <div className="p-6 max-w-[1600px] mx-auto">
                <Dashboard
                    data={activeDataset.data}
                    columns={activeDataset.columns}
                    stats={activeDataset.stats}
                    domain={activeDataset.domain}
                    summary={activeDataset.summary}
                    anomalies={activeDataset.anomalies}
                    recommendations={activeDataset.recommendations}
                    quality_score={activeDataset.quality_score}
                    kpis={activeDataset.kpis || []}
                    totalMissing={activeDataset.stats.reduce((acc, curr) => acc + curr.missing, 0)}
                    annotations={activeDataset.annotations}
                />
            </div>
        </div>
    );
}
