import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPI {
    label: string;
    value: string;
    trend: number;
    trend_label: string;
}

interface KPISectionProps {
    kpis: KPI[];
}

export function KPISection({ kpis }: KPISectionProps) {
    if (!kpis || kpis.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, index) => (
                <div
                    key={index}
                    className="card-3d glass-card p-6 relative overflow-hidden group animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    {/* Gradient background overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Content */}
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">{kpi.label}</p>
                        <div className="flex items-baseline gap-2 mb-4">
                            <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                {kpi.value}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <div className={`p-1.5 rounded-lg ${kpi.trend > 0 ? 'bg-green-100 dark:bg-green-900/30' :
                                    kpi.trend < 0 ? 'bg-red-100 dark:bg-red-900/30' :
                                        'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                {kpi.trend > 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 animate-float" />
                                ) : kpi.trend < 0 ? (
                                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                                ) : (
                                    <Minus className="w-4 h-4 text-gray-400" />
                                )}
                            </div>

                            <span className={`text-sm font-bold ${kpi.trend > 0 ? 'text-green-600 dark:text-green-400' :
                                    kpi.trend < 0 ? 'text-red-600 dark:text-red-400' :
                                        'text-gray-500'
                                }`}>
                                {Math.abs(kpi.trend).toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{kpi.trend_label}</span>
                        </div>
                    </div>

                    {/* Decorative corner gradient */}
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </div>
            ))}
        </div>
    );
}
