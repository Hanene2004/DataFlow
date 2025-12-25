import { Brain, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface SmartAnalysisProps {
    domain: string;
    summary: string;
    anomalies: string[];
}

export function SmartAnalysis({ domain, summary, anomalies }: SmartAnalysisProps) {
    const getDomainColor = (d: string) => {
        switch (d) {
            case 'Financial': return 'bg-green-100 text-green-800 border-green-200';
            case 'HR': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Commercial': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Smart Analysis</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDomainColor(domain)}`}>
                        {domain} Dataset
                    </span>
                </div>

                <div className="flex items-start gap-3 mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <FileText className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                    <p>{summary}</p>
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                    Data Health & Anomalies
                </h3>

                {anomalies && anomalies.length === 0 ? (
                    <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">No anomalies detected. Data quality looks good!</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {anomalies && anomalies.map((anomaly, index) => (
                            <div key={index} className="flex items-start gap-3 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>{anomaly}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
