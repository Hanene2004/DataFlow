import { useState } from 'react';
import { useData } from '../context/DataContext';
import { CorrelationMatrix } from '../components/CorrelationMatrix';
import { CorrelationInsights } from '../components/CorrelationInsights';
import { ScatterPlot } from '../components/ScatterPlot';
import { PredictionDashboard } from '../components/PredictionDashboard';
import { OutlierDetection } from '../components/OutlierDetection';
import { RegressionAnalysis } from '../components/RegressionAnalysis';
import { StatisticalTesting } from '../components/StatisticalTesting';
import { DimensionX } from '../components/DimensionX';
import { TimeSeriesAnalysis } from '../components/TimeSeriesAnalysis';
import { AdvancedDistribution } from '../components/AdvancedDistribution';
import { ReportBuilder } from '../components/ReportBuilder';
import { AIInsights } from '../components/AIInsights';
import { GeoX } from '../components/GeoX';
import { TimeMachine } from '../components/TimeMachine';
import { WhatIfSandbox } from '../components/WhatIfSandbox';
import { calculateCorrelations } from '../utils/analysis';
import { InteractiveChart } from '../components/InteractiveChart';
import { SmartHeatmap } from '../components/SmartHeatmap';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'trends' | 'correlations' | 'distribution' | 'prediction' | 'outliers' | 'regression' | 'statistics' | 'dimension-x' | 'time-series' | 'violin' | 'report' | 'ai-insights' | 'sandbox' | 'geospatial' | 'history';

export function AnalysisPage() {
    const { activeDataset } = useData();
    const [activeTab, setActiveTab] = useState<TabType>('trends');

    if (!activeDataset) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-gray-400 mb-4">No active dataset</div>
                <p className="text-gray-500">Please upload or select a dataset to view analysis.</p>
            </div>
        );
    }

    const { data, columns, stats } = activeDataset;
    const correlations = calculateCorrelations(data, columns);

    const handleAIAction = (label: string) => {
        const lower = label.toLowerCase();
        if (lower.includes('regression')) setActiveTab('regression');
        if (lower.includes('repair') || lower.includes('clean')) window.location.href = '/cleaning'; // Redirect to cleaning page
        if (lower.includes('outlier') || lower.includes('anomaly')) setActiveTab('outliers');
        if (lower.includes('predict') || lower.includes('trend')) setActiveTab('time-series');
        if (lower.includes('sandbox')) setActiveTab('sandbox');
    };

    const tabs = [
        { id: 'trends' as TabType, label: 'Trend Explorer', icon: '📈' },
        { id: 'correlations' as TabType, label: 'Correlations', icon: '🔗' },
        { id: 'distribution' as TabType, label: 'Distribution', icon: '📊' },
        { id: 'outliers' as TabType, label: 'Outliers', icon: '⚠️' },
        { id: 'regression' as TabType, label: 'Regression', icon: '📐' },
        { id: 'statistics' as TabType, label: 'Statistics', icon: '🔬' },
        { id: 'dimension-x' as TabType, label: 'Dimension X', icon: '🌌' },
        { id: 'time-series' as TabType, label: 'Chronos', icon: '🕰️' },
        { id: 'violin' as TabType, label: 'Advanced Distribution', icon: '🎻' },
        { id: 'prediction' as TabType, label: 'AI Prediction', icon: '🤖' },
        { id: 'geospatial' as TabType, label: 'Geo Intelligence', icon: '🌍' },
        { id: 'history' as TabType, label: 'Time Machine', icon: '🕰️' },
        { id: 'ai-insights' as TabType, label: 'AI Insights', icon: '🧠' },
        { id: 'sandbox' as TabType, label: 'What-If Sandbox', icon: '🎲' },
        { id: 'report' as TabType, label: 'Executive Studio', icon: '📄' }
    ];

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="relative p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden shadow-glow">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white mb-2 animate-fadeInUp">Deep Analysis</h1>
                    <p className="text-blue-100 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                        Explore your data with powerful visualization and AI tools
                    </p>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Interactive Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                ? 'text-white shadow-lg'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <span>{tab.icon}</span>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'trends' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Trend Explorer</h2>
                                <InteractiveChart data={data} columns={columns} stats={stats} />
                            </div>
                            <SmartHeatmap />
                        </div>
                    )}

                    {activeTab === 'correlations' && (
                        <div className="space-y-6">
                            <CorrelationInsights data={data} columns={columns} />
                            <CorrelationMatrix data={data} initialCorrelations={correlations} />
                        </div>
                    )}

                    {activeTab === 'distribution' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Distribution Analysis</h2>
                            <ScatterPlot data={data} stats={stats} />
                        </div>
                    )}

                    {activeTab === 'outliers' && (
                        <OutlierDetection data={data} columns={columns} />
                    )}

                    {activeTab === 'regression' && (
                        <RegressionAnalysis data={data} columns={columns} />
                    )}

                    {activeTab === 'statistics' && (
                        <StatisticalTesting data={data} columns={columns} />
                    )}

                    {activeTab === 'dimension-x' && (
                        <DimensionX data={data} columns={columns} />
                    )}

                    {activeTab === 'geospatial' && (
                        <GeoX data={data} columns={columns} />
                    )}

                    {activeTab === 'history' && (
                        <TimeMachine />
                    )}

                    {activeTab === 'time-series' && (
                        <TimeSeriesAnalysis data={data} columns={columns} />
                    )}

                    {activeTab === 'violin' && (
                        <AdvancedDistribution data={data} columns={columns} />
                    )}

                    {activeTab === 'prediction' && (
                        <PredictionDashboard data={data} columns={columns} />
                    )}

                    {activeTab === 'report' && (
                        <ReportBuilder data={data} columns={columns} stats={stats} correlations={correlations} />
                    )}

                    {activeTab === 'ai-insights' && (
                        <AIInsights data={data} stats={stats} correlations={correlations} onAction={handleAIAction} />
                    )}

                    {activeTab === 'sandbox' && (
                        <WhatIfSandbox data={data} stats={stats} correlations={correlations} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
