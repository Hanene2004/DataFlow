import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Sparkles,
    TrendingUp,
    Zap,
    ShieldAlert,
    BarChart3,
    ArrowRight,
    MessageSquareText
} from 'lucide-react';
import { ColumnStats, CorrelationData } from '../utils/analysis';
import { generateExecutiveSummary, generateAnalysisRecommendations } from '../utils/ai_insights';

interface AIInsightsProps {
    data: Record<string, unknown>[];
    stats: ColumnStats[];
    correlations: CorrelationData[];
    onAction?: (action: string) => void;
}

export function AIInsights({ data, stats, correlations, onAction }: AIInsightsProps) {
    const summary = useMemo(() => generateExecutiveSummary(data, stats), [data, stats]);
    const recommendations = useMemo(() => generateAnalysisRecommendations(stats, correlations), [stats, correlations]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* AI Hero Banner */}
            <div className="relative p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 opacity-50"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/40 animate-pulse">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-black text-white mb-4 tracking-tighter flex items-center gap-3">
                            Executive Intelligence <Sparkles className="w-6 h-6 text-yellow-400" />
                        </h2>
                        <div className="max-w-none text-slate-300 space-y-4">
                            <div className="whitespace-pre-wrap font-medium">
                                {summary.split('\n').map((line, i) => (
                                    <div key={i}>
                                        {line.startsWith('##') ? (
                                            <h3 className="text-xl text-white font-black mt-8 mb-4 border-l-4 border-indigo-500 pl-4 uppercase tracking-tighter">
                                                {line.replace(/^#+ /, '')}
                                            </h3>
                                        ) : line.startsWith('###') ? (
                                            <h4 className="text-lg text-indigo-400 font-bold mt-6 mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                {line.replace(/^#+ /, '')}
                                            </h4>
                                        ) : line.trim() === '' ? (
                                            <div className="h-2"></div>
                                        ) : (
                                            <p className="leading-relaxed opacity-90 text-sm">
                                                {line}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:block w-48">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Confidence Level</p>
                            <p className="text-3xl font-black text-white italic">98.4%</p>
                            <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '98.4%' }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="col-span-1 md:col-span-2 lg:col-span-3 mb-2"
                >
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Strategic Recommendations
                    </h3>
                </motion.div>

                {recommendations.map((rec, idx) => (
                    <motion.div
                        key={idx}
                        variants={item}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="p-6 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${rec.category === 'correlation' ? 'bg-blue-500/10 text-blue-500' :
                                rec.category === 'quality' ? 'bg-rose-500/10 text-rose-500' :
                                    rec.category === 'anomaly' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                {rec.category === 'correlation' && <TrendingUp className="w-5 h-5" />}
                                {rec.category === 'quality' && <ShieldAlert className="w-5 h-5" />}
                                {rec.category === 'anomaly' && <BarChart3 className="w-5 h-5" />}
                                {rec.category === 'trend' && <Zap className="w-5 h-5" />}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${rec.impact === 'high' ? 'bg-rose-500/10 text-rose-500' :
                                rec.impact === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-blue-500/10 text-blue-500'
                                }`}>
                                {rec.impact} impact
                            </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight tracking-tight">
                            {rec.title}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 italic">
                            {rec.description}
                        </p>
                        <button
                            onClick={() => onAction?.(rec.actionLabel || 'Explore Insight')}
                            className="w-full py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all"
                        >
                            {rec.actionLabel || 'Explore Insight'} <ArrowRight className="w-3 h-3" />
                        </button>
                    </motion.div>
                ))}

                {/* Simulation Prompt */}
                <motion.div
                    variants={item}
                    className="p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center gap-8 text-center md:text-left h-48 overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-black/10 opacity-50"></div>
                    <div className="relative z-10 p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                        <MessageSquareText className="w-10 h-10 text-white" />
                    </div>
                    <div className="relative z-10 flex-1">
                        <h4 className="text-2xl font-black text-white tracking-tight mb-2 italic uppercase">Unlock the Simulation Sandbox</h4>
                        <p className="text-indigo-100 text-sm font-bold opacity-80 max-w-xl">
                            Ready to take total control? Run hyper-realistic "What-If" scenarios to predict how strategic shifts will impact your bottom line.
                        </p>
                    </div>
                    <button
                        onClick={() => onAction?.('Initialize Sandbox')}
                        className="relative z-10 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95"
                    >
                        Initialize Sandbox
                    </button>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </motion.div>
            </div>
        </div>
    );
}
