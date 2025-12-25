import { useData } from '../context/DataContext';
import { SmartAnalysis } from '../components/SmartAnalysis';
import { AdvancedStatsTable } from '../components/AdvancedStatsTable';
import { DataTable } from '../components/DataTable';
import { ShareModal } from '../components/ShareModal';
import { BrandingSettings, BrandingConfig } from '../components/BrandingSettings';
import { Charts } from '../components/Charts';
import {
    FileDown, Loader2, Share2, Settings, Layout, Type,
    BarChart2, CheckSquare, AlignLeft, AlertCircle,
    PieChart, ChevronDown, ChevronRight
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useNotification } from '../context/NotificationContext';
import { logActivity } from '../utils/activityLogger';
import { motion, AnimatePresence } from 'framer-motion';

export function ReportsPage() {
    const { activeDataset } = useData();
    const { success, error } = useNotification();
    const [exporting, setExporting] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [brandingOpen, setBrandingOpen] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Report Configuration State
    const [sections, setSections] = useState({
        header: true,
        executiveSummary: true,
        smartAnalysis: true,
        kpis: true,
        charts: true,
        dataQuality: true,
        detailedStats: false,
        rawData: false,
        limitations: true,
        footer: true
    });

    const [collapsedCharts, setCollapsedCharts] = useState(false);
    const [selectedChartTypes, setSelectedChartTypes] = useState({
        distribution: true,
        correlation: true,
        timeSeries: true,
        scatter: false
    });

    // Custom Text State
    const [customText, setCustomText] = useState({
        title: 'Data Analysis Report',
        executiveSummary: 'This report provides a comprehensive analysis of the dataset. Key trends and anomalies have been identified to support decision-making.',
        limitations: 'Data limitations: The analysis is based on the provided dataset. Missing values were handled according to standard procedures.',
        notes: ''
    });

    // Branding State
    const [branding, setBranding] = useState<BrandingConfig>({
        companyName: '',
        logoUrl: '',
        primaryColor: '#6366f1' // Indigo-500
    });

    useEffect(() => {
        const saved = localStorage.getItem('company_branding');
        if (saved) {
            try {
                setBranding(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load branding", e);
            }
        }
    }, [brandingOpen]);

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleChartType = (key: keyof typeof selectedChartTypes) => {
        setSelectedChartTypes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff', // Force white for PDF
                onclone: (clonedDoc) => {
                    // Fix chart widths in cloned document if needed
                    const charts = clonedDoc.getElementsByClassName('recharts-wrapper');
                    Array.from(charts).forEach((chart: any) => {
                        chart.style.visibility = 'visible';
                    });
                }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Simple Pagination (Slice by Height)
            if (pdfHeight > 297) {
                let heightLeft = pdfHeight;
                let position = 0;
                const pageHeight = 295; // A4 height approx

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }

            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            const filename = `${activeDataset?.filename || 'report'}_analysis.pdf`;
            pdf.save(filename);
            success('PDF report downloaded successfully!');

            logActivity({
                type: 'export_pdf',
                description: `Exported PDF report for "${activeDataset?.filename}"`,
                metadata: {
                    filename: activeDataset?.filename,
                    pdfName: filename
                },
                datasetId: activeDataset?.id
            });
        } catch (err) {
            console.error('PDF generation failed', err);
            error('Failed to generate PDF. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (!activeDataset) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <FileDown className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Active Dataset</h2>
                <p className="text-gray-500 max-w-sm">Please upload or select a dataset from the dashboard to start generating reports.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
            {/* Sidebar Controls */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-full lg:w-80 flex-shrink-0 space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-12"
            >

                {/* Actions */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Export & Share</h3>
                    <div className="space-y-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={exporting}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                            {exporting ? 'Generating PDF...' : 'Download Report'}
                        </button>
                        <button
                            onClick={() => setShareModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 hover:border-indigo-100 dark:hover:border-indigo-900 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-xl font-bold transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                            Share Link
                        </button>
                    </div>
                </div>

                {/* Configuration */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Report Sections</h3>
                        <button onClick={() => setBrandingOpen(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-indigo-600" title="Branding Settings">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        {[
                            { id: 'header', label: 'Header & Logo', icon: Layout },
                            { id: 'executiveSummary', label: 'Executive Summary', icon: AlignLeft },
                            { id: 'smartAnalysis', label: 'AI Insights', icon: Type },
                            { id: 'kpis', label: 'Key Metrics', icon: CheckSquare },
                            { id: 'charts', label: 'Visualizations', icon: PieChart, hasSubMenu: true },
                            { id: 'dataQuality', label: 'Data Quality & Health', icon: AlertCircle },
                            { id: 'detailedStats', label: 'Detailed Statistics', icon: BarChart2 },
                            { id: 'rawData', label: 'Raw Data Preview', icon: FileDown },
                            { id: 'limitations', label: 'Data Limitations', icon: AlertCircle },
                        ].map((item) => (
                            <div key={item.id}>
                                <button
                                    onClick={() => toggleSection(item.id as keyof typeof sections)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${sections[item.id as keyof typeof sections]
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <item.icon className={`w-4 h-4 ${sections[item.id as keyof typeof sections] ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <span className="flex-1 text-left text-sm">{item.label}</span>

                                    {item.hasSubMenu && (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); setCollapsedCharts(!collapsedCharts); }}
                                            className="p-1 hover:bg-black/5 rounded"
                                        >
                                            <ChevronDown className={`w-3 h-3 transition-transform ${!collapsedCharts ? 'rotate-0' : '-rotate-90'}`} />
                                        </div>
                                    )}

                                    {sections[item.id as keyof typeof sections] && !item.hasSubMenu && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    )}
                                </button>

                                {/* Sub-menu for Charts */}
                                {item.id === 'charts' && sections.charts && !collapsedCharts && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="ml-8 mt-1 space-y-1 border-l-2 border-gray-100 pl-2 overflow-hidden"
                                    >
                                        <button onClick={() => toggleChartType('distribution')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                                            <div className={`w-3 h-3 border rounded ${selectedChartTypes.distribution ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                {selectedChartTypes.distribution && <CheckSquare className="w-3 h-3 text-white" />}
                                            </div>
                                            Data Distribution
                                        </button>
                                        <button onClick={() => toggleChartType('timeSeries')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                                            <div className={`w-3 h-3 border rounded ${selectedChartTypes.timeSeries ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                {selectedChartTypes.timeSeries && <CheckSquare className="w-3 h-3 text-white" />}
                                            </div>
                                            Time Series Trends
                                        </button>
                                        <button onClick={() => toggleChartType('correlation')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                                            <div className={`w-3 h-3 border rounded ${selectedChartTypes.correlation ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                {selectedChartTypes.correlation && <CheckSquare className="w-3 h-3 text-white" />}
                                            </div>
                                            Correlation Matrix
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Live Preview Area */}
            <div className="flex-1 bg-gray-100/50 dark:bg-slate-900/50 rounded-2xl overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    ref={reportRef}
                    className="max-w-[210mm] mx-auto min-h-[297mm] bg-white text-slate-900 shadow-xl rounded-none p-[20mm] relative"
                >
                    {/* 1. Header with Branding */}
                    {sections.header && (
                        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                            <div>
                                {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="Logo" className="h-16 object-contain mb-4" />
                                ) : (
                                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-gray-400">
                                        <div className="font-bold text-xs uppercase">Logo</div>
                                    </div>
                                )}
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight" style={{ color: branding.primaryColor }}>
                                    {customText.title}
                                </h1>
                                <p className="text-slate-500 mt-2 font-medium">{branding.companyName || 'MultiHub Analytics'}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">Analysis Report</div>
                                <div className="text-sm text-slate-500 mt-1">{activeDataset.filename}</div>
                                <div className="text-xs text-slate-400 mt-4">{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    )}

                    {/* 2. Executive Summary */}
                    {sections.executiveSummary && (
                        <div className="mb-10 p-6 bg-slate-50 rounded-xl border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                                <AlignLeft className="w-5 h-5 text-slate-400" />
                                Executive Summary
                            </h2>
                            <textarea
                                value={customText.executiveSummary}
                                onChange={(e) => setCustomText({ ...customText, executiveSummary: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-slate-600 leading-relaxed resize-none focus:ring-0 text-justify"
                                rows={4}
                            />
                        </div>
                    )}

                    {/* 3. KPIs Grid */}
                    {sections.kpis && activeDataset.kpis && activeDataset.kpis.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wide border-l-4 pl-3" style={{ borderColor: branding.primaryColor }}>
                                Key Performance Indicators
                            </h2>
                            <div className="grid grid-cols-3 gap-6">
                                {activeDataset.kpis.slice(0, 6).map((kpi, i) => (
                                    <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">{kpi.label}</div>
                                        <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
                                        <div className={`text-xs font-bold mt-2 ${kpi.trend && kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {kpi.trend_label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. Visualizations Section */}
                    {sections.charts && (
                        <div className="mb-12 break-inside-avoid">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wide border-l-4 pl-3" style={{ borderColor: branding.primaryColor }}>
                                Key Visualizations
                            </h2>
                            <div className="space-y-8">
                                {/* Simply reusing Charts component for now, but in reality we'd filter based on selectedChartTypes */}
                                <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                    <Charts
                                        data={activeDataset.data}
                                        columns={activeDataset.columns}
                                        stats={activeDataset.stats}
                                    />
                                    {/* Note: Ideally pass selectedChartTypes to Charts component to filter which ones to show */}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Smart Analysis */}
                    {sections.smartAnalysis && (
                        <div className="mb-12">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wide border-l-4 pl-3" style={{ borderColor: branding.primaryColor }}>
                                Insights & Anomalies
                            </h2>
                            <SmartAnalysis
                                domain={activeDataset.domain || 'General'}
                                summary={activeDataset.summary || ''}
                                anomalies={activeDataset.anomalies || []}
                            />
                        </div>
                    )}

                    {/* 6. Data Quality */}
                    {sections.dataQuality && activeDataset.quality_score && (
                        <div className="mb-12 page-break-inside-avoid">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wide border-l-4 pl-3" style={{ borderColor: branding.primaryColor }}>
                                Data Health
                            </h2>
                            <div className="flex gap-8 items-start p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-center">
                                    <div className={`text-5xl font-black mb-2 ${activeDataset.quality_score.score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {activeDataset.quality_score.score}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Quality Score</div>
                                </div>
                                <div className="flex-1 border-l border-slate-200 pl-8">
                                    <h4 className="font-bold text-slate-900 mb-3">Health Issues Detected</h4>
                                    <ul className="space-y-2">
                                        {activeDataset.quality_score.penalties.map((p, i) => (
                                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                <span className="text-red-500 mt-1">•</span> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. Detailed Stats */}
                    {sections.detailedStats && (
                        <div className="mb-12 break-before-page">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wide border-l-4 pl-3" style={{ borderColor: branding.primaryColor }}>
                                Statistical Appendix
                            </h2>
                            <AdvancedStatsTable stats={activeDataset.stats} />
                        </div>
                    )}

                    {/* 8. Raw Data */}
                    {sections.rawData && (
                        <div className="mb-12 break-before-page">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wide border-l-4 pl-3" style={{ borderColor: branding.primaryColor }}>
                                Data Sample
                            </h2>
                            <DataTable data={activeDataset.data} columns={activeDataset.columns} maxRows={15} />
                        </div>
                    )}

                    {/* 9. Limitations & Footer */}
                    {sections.limitations && (
                        <div className="mt-12 pt-8 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Methodology & Limitations</h4>
                            <textarea
                                value={customText.limitations}
                                onChange={(e) => setCustomText({ ...customText, limitations: e.target.value })}
                                className="w-full bg-transparent border-none p-0 text-slate-400 text-xs italic resize-none"
                            />
                        </div>
                    )}

                    {sections.footer && (
                        <div className="mt-8 text-center text-xs text-slate-300">
                            Generated by MultiHub Analytics • {new Date().getFullYear()}
                        </div>
                    )}

                </motion.div>
            </div>

            {/* Branding Modal */}
            <BrandingSettings
                isOpen={brandingOpen}
                onClose={() => setBrandingOpen(false)}
                onSave={(newConfig) => {
                    setBranding(newConfig);
                    setBrandingOpen(false);
                }}
            />

            {/* Share Modal */}
            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                reportData={activeDataset as any}
            />
        </div>
    );
}
