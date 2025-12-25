import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import {
    FileText,
    Layout,
    Plus,
    Trash2,
    Download,
    Eye,
    LineChart,
    PieChart,
    Sigma,
    Share2,
    Check,
    ShieldAlert,
    Lightbulb,
    Target,
    GitMerge,
    ListChecks,
    Activity,
    TrendingUp,
    Sparkles,
    Settings
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { exportProfessionalExcel } from '../utils/export';
import { BrandingSettings, BrandingConfig } from './BrandingSettings';
import { ColumnStats, CorrelationData } from '../utils/analysis';
import { useNotification } from '../context/NotificationContext';
import Plot from 'react-plotly.js';
import type { Data as PlotlyData } from 'plotly.js';

interface ReportBuilderProps {
    data: Record<string, unknown>[];
    columns: string[];
    stats: ColumnStats[];
    correlations: CorrelationData[];
}

interface ReportElement {
    id: string;
    type: 'chart' | 'stat' | 'text' | 'table' | 'kpi' | 'recommendation' | 'risk' | 'driver' | 'action_plan' | 'simulation';
    title: string;
    config: Record<string, unknown>;
}

export function ReportBuilder({ data, columns, stats, correlations }: ReportBuilderProps) {
    const { activeDataset } = useData();
    const { success, info } = useNotification();
    const [elements, setElements] = useState<ReportElement[]>([
        { id: '1', type: 'text', title: 'Executive Summary', config: { content: 'This report summarizes the key insights discovered during the data analysis phase. MultiHub AI has detected significant patterns in the distribution and relationships of the variables.' } },
        { id: '2', type: 'kpi', title: 'Core Performance KPI', config: { label: 'Data Quality Score', value: stats.length > 0 ? (100 - (stats.reduce((a, s) => a + s.missing, 0) / (stats.reduce((a, s) => a + s.count, 0) || 1)) * 100).toFixed(1) + '%' : '100%', sublabel: 'Overall Data Integrity', status: 'positive' } }
    ]);

    const [isPreview, setIsPreview] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [sharedLink, setSharedLink] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [branding, setBranding] = useState<BrandingConfig | null>(null);

    // Load Branding
    useEffect(() => {
        const saved = localStorage.getItem('company_branding');
        if (saved) {
            try {
                setBranding(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load branding", e);
            }
        }
    }, [isSettingsOpen]);

    useEffect(() => {
        setElements(prev => {
            const recapIndex = prev.findIndex(el => el.type === 'recommendation' && !el.config.headline);
            if (recapIndex === -1) return prev;

            const topCorr = correlations[0];
            const numRows = data.length;

            const updated = [...prev];
            const recap = { ...updated[recapIndex], config: { ...updated[recapIndex].config } };
            recap.config.headline = `Dataset Performance Audit: ${numRows} Nodes`;
            recap.config.bullet = `Our engine identified ${columns.length} active dimensions. ${topCorr ? `The strongest strategic link is between ${topCorr.col1} and ${topCorr.col2} (${(topCorr.correlation * 100).toFixed(1)}% coupling).` : 'Stability remains high across all indicators.'}`;
            updated[recapIndex] = recap;

            return updated;
        });
    }, [data, correlations, columns]);

    const addElement = (type: ReportElement['type']) => {
        let initialConfig = {};
        if (type === 'kpi') initialConfig = { label: 'New KPI', value: '0', sublabel: 'Description', status: 'positive' };
        if (type === 'recommendation') initialConfig = { headline: 'Strategic Action', bullet: 'Detail your recommendation here.' };
        if (type === 'risk') initialConfig = { severity: 5, description: 'Potential data variance detected.' };
        if (type === 'text') initialConfig = { content: 'New context block...' };
        if (type === 'stat') initialConfig = { column: columns[0] };
        if (type === 'driver') initialConfig = { target: columns[0] };
        if (type === 'action_plan') initialConfig = { items: [{ label: 'Priority Action', completed: false }] };
        if (type === 'simulation') initialConfig = { factor: columns[0], impact: columns[1] || columns[0], sensitivity: 'High' };
        if (type === 'chart') initialConfig = { chartType: 'bar', xAxis: columns[0], yAxis: columns[1] || columns[0] };

        const newEl: ReportElement = {
            id: Math.random().toString(36).substr(2, 9),
            type: type,
            title: (type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) + ' Insight',
            config: initialConfig
        };
        setElements([...elements, newEl]);
    };

    const removeElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id));
    };

    const handleShare = async () => {
        if (!activeDataset) return;
        setIsSharing(true);
        try {
            const reportId = crypto.randomUUID();
            const { error } = await supabase
                .from('shared_reports')
                .insert([{
                    id: reportId,
                    dataset_id: activeDataset.id,
                    config: elements,
                    title: elements[0]?.title || 'Shared Analysis Report',
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            const url = `${window.location.origin}/share/${reportId}`;
            setSharedLink(url);
            navigator.clipboard.writeText(url);
            success('Report published successfully! Link copied to clipboard.');
        } catch (err) {
            console.error("Failed to share report:", err);
            // Fallback for demo if table doesn't exist
            setSharedLink(`${window.location.origin}/share/demo-report-id`);
            navigator.clipboard.writeText(`${window.location.origin}/share/demo-report-id`);
            info('Demo mode: Link generated and copied.');
        } finally {
            setIsSharing(false);
        }
    };

    const handleAutoGenerate = () => {
        const newElements: ReportElement[] = [];

        // 1. Executive Summary
        newElements.push({
            id: crypto.randomUUID(),
            type: 'text',
            title: 'Executive Summary',
            config: {
                content: `Comprehensive analysis of the ${activeDataset?.filename || 'dataset'} reveals ${data.length} records across ${columns.length} dimensions. The data indicates strong stability with localized variances.`
            }
        });

        // 2. Core Stats (Top Numeric Column)
        const numericStats = stats.filter(s => s.type === 'numeric');
        if (numericStats.length > 0) {
            const topStat = numericStats.sort((a, b) => (b.mean || 0) - (a.mean || 0))[0];
            newElements.push({
                id: crypto.randomUUID(),
                type: 'stat',
                title: 'Key Metrics',
                config: { column: topStat.column }
            });
        }

        // 3. Top Correlations as Charts
        const topCorrelations = correlations.slice(0, 2);
        topCorrelations.forEach((corr, _) => {
            newElements.push({
                id: crypto.randomUUID(),
                type: 'chart',
                title: `Trend Analysis: ${corr.col1} vs ${corr.col2}`,
                config: {
                    chartType: 'scatter',
                    xAxis: corr.col1,
                    yAxis: corr.col2
                }
            });
        });

        // 4. Risk Assessment
        const riskCol = stats.find(s => s.missingPercent > 5);
        if (riskCol) {
            newElements.push({
                id: crypto.randomUUID(),
                type: 'risk',
                title: 'Data Integrity Alert',
                config: {
                    severity: Math.min(10, Math.floor(riskCol.missingPercent / 5) + 2),
                    description: `Detected ${riskCol.missingPercent.toFixed(1)}% missing data in '${riskCol.column}'. Recommended remediation: Imputation or row exclusion.`
                }
            });
        }

        // 5. Strategic Recommendation
        newElements.push({
            id: crypto.randomUUID(),
            type: 'recommendation',
            title: 'Strategic Directive',
            config: {
                headline: 'Optimize Data Collection',
                bullet: 'Enhance consistency in secondary dimensions to improve predictive model accuracy.'
            }
        });

        setElements(newElements);
        success("Smart Report Auto-Generated!");
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                        {branding?.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto mix-blend-multiply dark:mix-blend-normal" />}
                        {branding?.companyName ? `${branding.companyName} Report` : 'Executive Report Builder'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Compose and curate your analytical masterpieces.</p>
                </div>

                <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Settings className="w-4 h-4" /> Branding
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsPreview(!isPreview)}
                        className={`px-6 py-2.5 border rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all ${isPreview ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'}`}
                    >
                        <Eye className="w-4 h-4" /> {isPreview ? 'Exit Preview' : 'Preview'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleShare}
                        disabled={isSharing}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${sharedLink ? 'bg-emerald-500 text-white shadow-emerald-500/25' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'
                            }`}
                    >
                        {sharedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        {isSharing ? 'Publishing...' : sharedLink ? 'Link Copied' : 'Share Dashboard'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAutoGenerate}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> Auto-Magic
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => exportProfessionalExcel(data, stats, correlations, 'MultiHub_Executive_Report.xlsx')}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </motion.button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Toolbox
                        </h4>

                        <div className="space-y-2">
                            {[
                                { type: 'kpi' as const, icon: <Target className="w-4 h-4" />, label: 'Exec KPI' },
                                { type: 'recommendation' as const, icon: <Lightbulb className="w-4 h-4" />, label: 'Strategic Rec' },
                                { type: 'driver' as const, icon: <GitMerge className="w-4 h-4" />, label: 'Decision Driver' },
                                { type: 'action_plan' as const, icon: <ListChecks className="w-4 h-4" />, label: 'Action Plan' },
                                { type: 'simulation' as const, icon: <Activity className="w-4 h-4" />, label: 'What-If Sim' },
                                { type: 'chart' as const, icon: <LineChart className="w-4 h-4" />, label: 'Visual Insight' },
                                { type: 'stat' as const, icon: <Sigma className="w-4 h-4" />, label: 'Stat Summary' },
                                { type: 'text' as const, icon: <FileText className="w-4 h-4" />, label: 'Context Block' },
                                { type: 'risk' as const, icon: <ShieldAlert className="w-4 h-4" />, label: 'Risk Factor' },
                                { type: 'table' as const, icon: <Layout className="w-4 h-4" />, label: 'Data Sample' }
                            ].map(tool => (
                                <button
                                    key={tool.type}
                                    onClick={() => addElement(tool.type)}
                                    className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 group"
                                >
                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm group-hover:text-indigo-500 transition-colors">
                                        {tool.icon}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{tool.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {elements.map((el, index) => (
                                <Reorder.Item
                                    key={el.id}
                                    value={el}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className={`group relative bg-white dark:bg-slate-900 rounded-3xl border shadow-sm hover:shadow-xl transition-all ${isPreview ? 'border-transparent dark:bg-slate-900/40 p-0' : 'border-gray-100 dark:border-slate-800 p-8'
                                        }`}
                                >
                                    {isPreview ? (
                                        <div className="p-10">
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                                                {el.type === 'text' && <FileText className="w-6 h-6 text-indigo-500" />}
                                                {el.type === 'stat' && <Sigma className="w-6 h-6 text-emerald-500" />}
                                                {el.type === 'chart' && <LineChart className="w-6 h-6 text-purple-500" />}
                                                {el.type === 'table' && <Layout className="w-6 h-6 text-blue-500" />}
                                                {el.type === 'kpi' && <Target className="w-6 h-6 text-indigo-600" />}
                                                {el.type === 'recommendation' && <Lightbulb className="w-6 h-6 text-amber-500" />}
                                                {el.type === 'risk' && <ShieldAlert className="w-6 h-6 text-rose-500" />}
                                                {el.type === 'driver' && <GitMerge className="w-6 h-6 text-cyan-500" />}
                                                {el.type === 'action_plan' && <ListChecks className="w-6 h-6 text-emerald-500" />}
                                                {el.type === 'simulation' && <Activity className="w-6 h-6 text-fuchsia-500" />}
                                                {el.title}
                                            </h3>
                                            {/* Preview content matches SharedReportPage logic */}
                                            {el.type === 'text' && <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{(el.config.content as string)}</p>}
                                            {el.type === 'kpi' && (
                                                <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                                    <div className="text-center md:text-left">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{(el.config.label as string)}</p>
                                                        <h2 className="text-6xl font-black text-slate-950 dark:text-white italic tracking-tighter">{(el.config.value as string)}</h2>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{(el.config.sublabel as string)}</p>
                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${el.config.status === 'positive' ? 'text-emerald-500' : 'text-rose-500'}`}>{el.config.status as string}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {el.type === 'driver' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {correlations.filter(c => c.col1 === el.config.target || c.col2 === el.config.target)
                                                        .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                                                        .slice(0, 4)
                                                        .map(c => {
                                                            const other = c.col1 === el.config.target ? c.col2 : c.col1;
                                                            const impactValue = Math.abs(c.correlation) * 100;
                                                            return (
                                                                <div key={other} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-xs font-black uppercase text-slate-900 dark:text-white">{other}</span>
                                                                        <span className="text-[10px] font-black text-cyan-500 uppercase">Impact: {impactValue.toFixed(1)}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-cyan-500" style={{ width: `${impactValue}%` }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                            {el.type === 'simulation' && (
                                                <div className="bg-gradient-to-br from-fuchsia-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                                        <Activity className="w-32 h-32" />
                                                    </div>
                                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                        <div>
                                                            <h4 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Sensitivity Analysis</h4>
                                                            <p className="text-sm text-fuchsia-100/70 font-medium">Predicting the direct impact of variable shifts on core indicators.</p>
                                                        </div>
                                                        <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                                                            {(() => {
                                                                const correlation = correlations.find(c =>
                                                                    (c.col1 === el.config.factor && c.col2 === el.config.impact) ||
                                                                    (c.col1 === el.config.impact && c.col2 === el.config.factor)
                                                                )?.correlation || 0;
                                                                const sensitivity = Math.abs(correlation) > 0.7 ? 'High' : Math.abs(correlation) > 0.4 ? 'Moderate' : 'Low';
                                                                return (
                                                                    <>
                                                                        <div className="flex justify-between items-end mb-4">
                                                                            <div className="text-center">
                                                                                <p className="text-[8px] font-black uppercase opacity-60">Variable</p>
                                                                                <p className="text-xs font-black">{(el.config.factor as string)}</p>
                                                                            </div>
                                                                            <div className="h-6 w-[1px] bg-white/20" />
                                                                            <div className="text-center px-4">
                                                                                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">{sensitivity}</p>
                                                                                <p className="text-[8px] font-black uppercase opacity-60">Coupling</p>
                                                                            </div>
                                                                            <div className="h-6 w-[1px] bg-white/20" />
                                                                            <div className="text-center">
                                                                                <p className="text-[8px] font-black uppercase opacity-60">Indicator</p>
                                                                                <p className="text-xs font-black">{(el.config.impact as string)}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-center pt-4 border-t border-white/10">
                                                                            <p className="text-[10px] font-black italic">
                                                                                "A +10% shift in {String(el.config.factor)} is projected to yield a {(correlation * 10).toFixed(1)}% {correlation >= 0 ? 'increase' : 'decrease'} in {String(el.config.impact)}."
                                                                            </p>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {el.type === 'recommendation' && (
                                                <div className="bg-indigo-600 dark:bg-indigo-900/30 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                                        <TrendingUp className="w-40 h-40" />
                                                    </div>
                                                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 italic relative z-10">Strategic Action Item</h4>
                                                    <div className="relative z-10 space-y-4">
                                                        <p className="text-xl font-bold border-l-4 border-white/30 pl-6 leading-tight">{(el.config.headline as string)}</p>
                                                        <p className="text-sm text-indigo-100 dark:text-indigo-200/70 font-medium leading-relaxed max-w-2xl">{(el.config.bullet as string)}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {el.type === 'risk' && (
                                                <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start gap-8">
                                                    <div className="flex-shrink-0 flex flex-col items-center">
                                                        <div className="w-20 h-20 bg-rose-500 text-white rounded-3xl flex items-center justify-center text-4xl font-black italic shadow-lg shadow-rose-500/30 mb-2">
                                                            {el.config.severity as number}
                                                        </div>
                                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Risk Index</p>
                                                    </div>
                                                    <div className="pt-2">
                                                        <h4 className="text-lg font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight mb-2 italic">Intelligence Warning</h4>
                                                        <p className="text-slate-600 dark:text-rose-200/70 font-medium leading-relaxed">
                                                            {(el.config.description as string)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {el.type === 'action_plan' && (
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2.5rem] space-y-4">
                                                    {((el.config.items as { label: string, completed: boolean }[]) || []).map((item, i) => (
                                                        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all group">
                                                            <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                                                                {item.completed && <Check className="w-4 h-4 text-emerald-500" />}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {el.type === 'stat' && (
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {(() => {
                                                        const col = el.config.column as string;
                                                        const s = stats.find(x => x.column === col);
                                                        if (!s) return <p className="text-xs italic text-slate-400">Select a valid column</p>;
                                                        return [
                                                            { label: 'Sample Count', value: s.count.toLocaleString() },
                                                            { label: 'Mean Value', value: s.mean?.toFixed(2) || 'N/A' },
                                                            { label: 'Std Deviation', value: s.std?.toFixed(2) || 'N/A' },
                                                            { label: 'Integrity', value: (100 - s.missingPercent).toFixed(1) + '%' }
                                                        ].map((item, i) => (
                                                            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                                                <p className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic">{item.value}</p>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            )}
                                            {el.type === 'table' && (
                                                <div className="overflow-x-auto rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                                    <table className="w-full text-left text-xs bg-white dark:bg-slate-900">
                                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                                            <tr>
                                                                {columns.slice(0, 5).map(c => (
                                                                    <th key={c} className="px-6 py-4 font-black text-slate-400 uppercase italic tracking-tighter">
                                                                        {c}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.slice(0, 5).map((r, i) => (
                                                                <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                                                    {columns.slice(0, 5).map(c => (
                                                                        <td key={c} className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                                                            {String(r[c])}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {el.type === 'chart' && (
                                                <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                                    {(() => {
                                                        const chartType = (el.config.chartType as 'bar' | 'scatter' | 'line') || 'bar';
                                                        const plotData: Partial<PlotlyData>[] = [{
                                                            x: data.map(r => r[el.config.xAxis as string] as number),
                                                            y: data.map(r => r[el.config.yAxis as string] as number),
                                                            type: chartType === 'line' ? 'scatter' : chartType,
                                                            mode: chartType === 'line' ? 'lines+markers' : 'markers',
                                                            marker: { color: '#6366f1' }
                                                        }];
                                                        return (
                                                            <Plot
                                                                data={plotData}
                                                                layout={{
                                                                    autosize: true,
                                                                    height: 300,
                                                                    margin: { l: 40, r: 20, t: 20, b: 40 },
                                                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                                                    xaxis: { gridcolor: '#f1f5f9' },
                                                                    yaxis: { gridcolor: '#f1f5f9' }
                                                                }}
                                                                useResizeHandler
                                                                style={{ width: '100%' }}
                                                                config={{ displayModeBar: false }}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            {/* Other simplified builders... */}
                                        </div>
                                    ) : (
                                        <div className="transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-6 bg-slate-200 dark:bg-slate-700 rounded-full cursor-move" />
                                                    <input
                                                        className="bg-transparent border-none text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter outline-none w-full"
                                                        value={el.title}
                                                        onChange={(e) => {
                                                            const newEls = [...elements];
                                                            const idx = newEls.findIndex(x => x.id === el.id);
                                                            newEls[idx].title = e.target.value;
                                                            setElements(newEls);
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeElement(el.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="min-h-[100px] border-l-2 border-slate-50 dark:border-slate-800/50 pl-6">
                                                {el.type === 'text' && (
                                                    <textarea
                                                        className="w-full bg-transparent border-none text-sm text-gray-500 dark:text-gray-400 leading-relaxed outline-none resize-none"
                                                        rows={3}
                                                        value={(el.config.content as string) || ''}
                                                        onChange={(e) => {
                                                            const newEls = [...elements];
                                                            const idx = newEls.findIndex(x => x.id === el.id);
                                                            newEls[idx].config.content = e.target.value;
                                                            setElements(newEls);
                                                        }}
                                                    />
                                                )}
                                                {el.type === 'kpi' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase">Label / Value</label>
                                                            <div className="flex gap-2">
                                                                <input className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs font-bold" value={(el.config.label as string) || ''} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.label = e.target.value; setElements(n);
                                                                }} placeholder="KPI Label" />
                                                                <input className="w-24 bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs font-black text-indigo-500" value={(el.config.value as string) || ''} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.value = e.target.value; setElements(n);
                                                                }} placeholder="Val" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase">Subtext / Status</label>
                                                            <div className="flex gap-2">
                                                                <input className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs" value={(el.config.sublabel as string) || ''} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.sublabel = e.target.value; setElements(n);
                                                                }} placeholder="Growth/Description" />
                                                                <select className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs" value={(el.config.status as string) || 'positive'} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.status = e.target.value; setElements(n);
                                                                }}>
                                                                    <option value="positive">Positive</option>
                                                                    <option value="negative">Negative</option>
                                                                    <option value="neutral">Neutral</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {el.type === 'recommendation' && (
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase">Input / AI Forge</label>
                                                            <button
                                                                onClick={() => {
                                                                    const topCorr = correlations[0];
                                                                    const n = [...elements];
                                                                    const el_f = n.find(x => x.id === el.id)!;
                                                                    el_f.config.headline = `Optimize ${topCorr?.col1 || 'Primary Value'}`;
                                                                    el_f.config.bullet = `Our analysis shows a high correlation (${(topCorr?.correlation || 0).toFixed(2)}) between ${topCorr?.col1} and ${topCorr?.col2}. Focus initiatives on this nexus.`;
                                                                    setElements(n);
                                                                }}
                                                                className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:bg-indigo-50 p-1 px-2 rounded-lg"
                                                            >
                                                                <Activity className="w-3 h-3" /> Auto-Forge
                                                            </button>
                                                        </div>
                                                        <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm font-bold" value={(el.config.headline as string) || ''} onChange={(e) => {
                                                            const n = [...elements]; n.find(x => x.id === el.id)!.config.headline = e.target.value; setElements(n);
                                                        }} placeholder="Strategic Headline" />
                                                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs outline-none" rows={2} value={(el.config.bullet as string) || ''} onChange={(e) => {
                                                            const n = [...elements]; n.find(x => x.id === el.id)!.config.bullet = e.target.value; setElements(n);
                                                        }} placeholder="Strategic Detail" />
                                                    </div>
                                                )}
                                                {el.type === 'risk' && (
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase">Risk Level / Intelligence</label>
                                                            <button
                                                                onClick={() => {
                                                                    const badCol = stats.sort((a, b) => b.missing - a.missing)[0];
                                                                    const highVar = stats.filter(s => s.type === 'numeric' && s.std && s.mean && s.std > s.mean).sort((a, b) => (b.std! / b.mean!) - (a.std! / a.mean!))[0];

                                                                    const n = [...elements];
                                                                    const el_f = n.find(x => x.id === el.id)!;

                                                                    if (badCol && badCol.missing > 0) {
                                                                        el_f.config.severity = Math.floor(badCol.missingPercent / 10) + 3;
                                                                        el_f.config.description = `Critical data integrity risk detected in '${badCol.column}'. ${badCol.missing} records are null, representing ${(badCol.missingPercent).toFixed(1)}% of the dataset.`;
                                                                    } else if (highVar) {
                                                                        el_f.config.severity = 6;
                                                                        el_f.config.description = `High volatility detected in '${highVar.column}'. Standard deviation (${highVar.std?.toFixed(2)}) exceeds historical variance limits.`;
                                                                    } else {
                                                                        el_f.config.severity = 2;
                                                                        el_f.config.description = "Low statistical risk. Background variance remains within normal operational parameters.";
                                                                    }
                                                                    setElements(n);
                                                                }}
                                                                className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1 hover:bg-rose-50 p-1 px-2 rounded-lg"
                                                            >
                                                                <ShieldAlert className="w-3 h-3" /> Risk Scan
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-4 items-center">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-gray-400 uppercase">Risk Level</label>
                                                                <input type="number" min="1" max="10" className="w-16 bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs font-black text-red-500" value={(el.config.severity as number) || 5} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.severity = parseInt(e.target.value); setElements(n);
                                                                }} />
                                                            </div>
                                                            <textarea className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs outline-none" rows={2} value={(el.config.description as string) || ''} onChange={(e) => {
                                                                const n = [...elements]; n.find(x => x.id === el.id)!.config.description = e.target.value; setElements(n);
                                                            }} placeholder="Describe the risk factor..." />
                                                        </div>
                                                    </div>
                                                )}
                                                {el.type === 'driver' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black uppercase text-gray-400">Target Metric</span>
                                                            <select className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs font-bold" value={(el.config.target as string) || ''} onChange={(e) => {
                                                                const n = [...elements]; n.find(x => x.id === el.id)!.config.target = e.target.value; setElements(n);
                                                            }}>
                                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 italic">Drivers will be automatically calculated based on correlations in the shared view.</p>
                                                    </div>
                                                )}
                                                {el.type === 'action_plan' && (
                                                    <div className="space-y-2">
                                                        {((el.config.items as { label: string, completed: boolean }[]) || []).map((item, i) => (
                                                            <div key={i} className="flex gap-2 items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.completed}
                                                                    onChange={(e) => {
                                                                        const n = [...elements]; const el_found = n.find(x => x.id === el.id)!;
                                                                        const items = (el_found.config.items as { label: string, completed: boolean }[]);
                                                                        items[i].completed = e.target.checked;
                                                                        setElements(n);
                                                                    }}
                                                                    className="rounded border-gray-300 accent-emerald-500 w-4 h-4"
                                                                />
                                                                <input className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs" value={item.label} onChange={(e) => {
                                                                    const n = [...elements]; const el_found = n.find(x => x.id === el.id)!;
                                                                    const items = (el_found.config.items as { label: string, completed: boolean }[]);
                                                                    items[i].label = e.target.value;
                                                                    setElements(n);
                                                                }} />
                                                            </div>
                                                        ))}
                                                        <button onClick={() => {
                                                            const n = [...elements]; const el_found = n.find(x => x.id === el.id)!;
                                                            (el_found.config.items as { label: string, completed: boolean }[]).push({ label: 'New Action Item', completed: false });
                                                            setElements(n);
                                                        }} className="text-[10px] font-black text-indigo-500 uppercase mt-2 hover:underline">+ Add Action</button>
                                                    </div>
                                                )}
                                                {el.type === 'simulation' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase">Independent Variable</label>
                                                            <select className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs" value={(el.config.factor as string) || ''} onChange={(e) => {
                                                                const n = [...elements]; n.find(x => x.id === el.id)!.config.factor = e.target.value; setElements(n);
                                                            }}>
                                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase">Dependent Indicator</label>
                                                            <select className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs" value={(el.config.impact as string) || ''} onChange={(e) => {
                                                                const n = [...elements]; n.find(x => x.id === el.id)!.config.impact = e.target.value; setElements(n);
                                                            }}>
                                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase">Assumed Sensitivity</label>
                                                            <select className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs" value={(el.config.sensitivity as string) || 'High'} onChange={(e) => {
                                                                const n = [...elements]; n.find(x => x.id === el.id)!.config.sensitivity = e.target.value; setElements(n);
                                                            }}>
                                                                <option value="High">High</option>
                                                                <option value="Moderate">Moderate</option>
                                                                <option value="Low">Low</option>
                                                                <option value="Inversely Proportional">Inverse</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                                {el.type === 'stat' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black uppercase text-gray-400">Target Column</span>
                                                            <select className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs font-bold" value={(el.config.column as string) || ''} onChange={(e) => {
                                                                const n = [...elements]; n.find(x => x.id === el.id)!.config.column = e.target.value; setElements(n);
                                                            }}>
                                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 italic">Key metrics will be automatically calculated in the final report.</p>
                                                    </div>
                                                )}
                                                {el.type === 'chart' && (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                                                                <select className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded text-[10px] font-bold" value={(el.config.chartType as string)} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.chartType = e.target.value; setElements(n);
                                                                }}>
                                                                    <option value="bar">Bar Chart</option>
                                                                    <option value="scatter">Scatter Plot</option>
                                                                    <option value="line">Line Graph</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">X-Axis</label>
                                                                <select className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded text-[10px] font-bold" value={(el.config.xAxis as string)} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.xAxis = e.target.value; setElements(n);
                                                                }}>
                                                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Y-Axis</label>
                                                                <select className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded text-[10px] font-bold" value={(el.config.yAxis as string)} onChange={(e) => {
                                                                    const n = [...elements]; n.find(x => x.id === el.id)!.config.yAxis = e.target.value; setElements(n);
                                                                }}>
                                                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                                                            <PieChart className="w-8 h-8 text-slate-300 mb-2" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualization Active</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {el.type === 'table' && (
                                                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
                                                        <table className="w-full text-left text-[10px]">
                                                            <thead className="bg-slate-50 dark:bg-slate-800">
                                                                <tr>
                                                                    {columns.slice(0, 4).map(c => <th key={c} className="px-3 py-2 font-black text-gray-400 uppercase italic">{c}</th>)}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {data.slice(0, 3).map((r, i) => (
                                                                    <tr key={i} className="border-t border-gray-100 dark:border-slate-800">
                                                                        {columns.slice(0, 4).map(c => <td key={c} className="px-3 py-2 text-gray-500">{String(r[c])}</td>)}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <BrandingSettings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={setBranding}
            />
        </div>
    );
}
