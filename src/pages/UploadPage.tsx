import { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { useData, DatasetState } from '../context/DataContext';
import { ColumnStats, calculateCorrelations, calculateAllColumnStats } from '../utils/analysis';
import { generateExecutiveSummary, generateAnalysisRecommendations, detectDomain, detectAnomalies } from '../utils/ai_insights';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { KPI } from '../components/KPISection';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function UploadPage() {
    const { addDataset, setActiveId, isUploading, setIsUploading, session } = useData();
    const [uploadProgress, setUploadProgress] = useState<{ step: string, percent: number } | null>(null);
    const [pendingUploads, setPendingUploads] = useState<{ data: Record<string, unknown>[], filename: string, columns: string[], file: File, sheetName?: string }[] | null>(null);
    const navigate = useNavigate();

    const handleUpload = async (
        uploadedFiles: { data: Record<string, unknown>[], filename: string, columns: string[], file: File, sheetName?: string }[]
    ) => {
        if (uploadedFiles.length > 1) {
            setPendingUploads(uploadedFiles);
            return;
        }
        await processFiles(uploadedFiles);
    };

    const processFiles = async (
        filesToProcess: { data: Record<string, unknown>[], filename: string, columns: string[], file: File, sheetName?: string }[]
    ) => {
        setIsUploading(true);
        try {
            for (const file of filesToProcess) {
                let processedData = file.data;
                let processedColumns = file.columns;
                let processedStats: ColumnStats[] = [];
                let qualityScore = undefined;
                let recommendations = undefined;
                let domain = 'General';
                let summary = '';
                let anomalies: string[] = [];
                let kpis: KPI[] = [];
                let correlations = [];

                setUploadProgress({ step: `Processing ${file.filename}...`, percent: 10 });

                // Backend call (with timeout + graceful fallback)
                try {
                    setUploadProgress({ step: 'Sending to smart engine...', percent: 25 });
                    const formData = new FormData();
                    formData.append('file', file.file);
                    if (file.sheetName) {
                        formData.append('sheet_name', file.sheetName);
                    }

                    const controller = new AbortController();
                    const timeoutId = window.setTimeout(() => controller.abort(), 60000); // 60s for large files

                    const response = await fetch('http://localhost:8000/upload', {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal
                    });

                    window.clearTimeout(timeoutId);

                    if (response.ok) {
                        setUploadProgress({ step: 'Processing engine results...', percent: 60 });
                        const result = await response.json();
                        processedData = result.data || file.data;
                        processedColumns = result.columns || file.columns;
                        processedStats = result.stats;
                        qualityScore = result.quality_score;
                        recommendations = result.recommendations;
                        domain = result.domain || 'General';
                        summary = result.summary || '';
                        anomalies = result.anomalies || [];
                        kpis = result.kpis || [];
                        correlations = result.correlations || [];
                    } else {
                        throw new Error("Backend failed");
                    }
                } catch (err) {
                    console.warn("Backend upload failed/timed out, falling back to optimized local processing", err);
                    setUploadProgress({ step: 'Optimizing local data snapshots...', percent: 30 });

                    // 1. Calculate Stats (Optimized Single Pass)
                    processedStats = calculateAllColumnStats(file.data, file.columns);
                    setUploadProgress({ step: 'Mapping correlations...', percent: 50 });

                    // 2. Calculate Correlations
                    correlations = calculateCorrelations(file.data, file.columns);
                    setUploadProgress({ step: 'Extracting patterns...', percent: 70 });

                    // 3. Detect Domain
                    domain = detectDomain(file.columns);

                    // 4. Detect Anomalies
                    anomalies = detectAnomalies(processedStats);

                    // 5. Generate Summary
                    summary = generateExecutiveSummary(file.data, processedStats);

                    // 6. Generate Recommendations
                    const aiRecs = generateAnalysisRecommendations(processedStats, correlations);
                    recommendations = aiRecs.map(r => r.description);
                }

                setUploadProgress({ step: 'Finalizing database synchronization...', percent: 85 });

                // Supabase Save (only if not guest)
                const isGuest = session?.user?.id === 'guest-user' || !session;
                let savedData = null;
                let saveError = null;

                if (!isGuest) {
                    const { data, error } = await supabase.from('datasets').insert({
                        filename: file.filename,
                        data: processedData,
                        row_count: processedData.length,
                        column_count: processedColumns.length,
                        columns: processedColumns,
                        stats: processedStats,
                        quality_score: qualityScore,
                        recommendations: recommendations,
                        domain: domain,
                        summary: summary,
                        anomalies: anomalies,
                        kpis: kpis,
                        correlations: correlations,
                        user_id: session?.user?.id
                    }).select().single();
                    savedData = data;
                    saveError = error;
                }

                setUploadProgress({ step: 'Activating workspace...', percent: 95 });

                if (saveError || isGuest) {
                    if (saveError) {
                        console.error("Failed to save to Supabase:", saveError);
                        // Specific check for schema mismatch (missing columns)
                        if (saveError.code === 'PGRST204') {
                            toast.error("Database schema mismatch detected. Please run the consolidation script in Supabase.", {
                                duration: 8000,
                                icon: '🗄️'
                            });
                        }
                    }
                    const localId = crypto.randomUUID();
                    addDataset({
                        id: localId,
                        filename: file.filename,
                        data: processedData,
                        columns: processedColumns,
                        stats: processedStats,
                        quality_score: qualityScore,
                        recommendations: recommendations,
                        domain: domain,
                        summary: summary,
                        anomalies: anomalies,
                        kpis: kpis,
                        correlations: correlations
                    });
                    setActiveId(localId);
                } else if (savedData) {
                    addDataset(savedData as DatasetState);
                    setActiveId(savedData.id);
                }
            }
            setUploadProgress({ step: 'Success!', percent: 100 });
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'import : " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
            setPendingUploads(null);
        }
    };

    const handleMergeConfirm = async () => {
        if (!pendingUploads) return;
        setIsUploading(true);
        setUploadProgress({ step: 'Merging files via Smart Engine...', percent: 10 });

        try {
            const formData = new FormData();
            pendingUploads.forEach(file => {
                formData.append('files', file.file);
            });

            const response = await fetch('http://localhost:8000/upload-multiple', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Merge failed");
            }

            const result = await response.json();

            // Add the single merged dataset
            const id = crypto.randomUUID();
            addDataset({
                id: id,
                filename: result.filename,
                data: result.data,
                columns: result.columns,
                stats: result.stats,
                quality_score: result.quality_score,
                recommendations: result.recommendations,
                domain: result.domain,
                summary: result.summary,
                anomalies: result.anomalies,
                kpis: result.kpis,
                correlations: result.correlations
            });
            setActiveId(id);

            setUploadProgress({ step: 'Success!', percent: 100 });
            setTimeout(() => navigate('/dashboard'), 500);

        } catch (error) {
            console.error("Merge error:", error);
            toast.error("Failed to merge files: " + (error instanceof Error ? error.message : "Unknown error"));
            // Fallback to separate uploads? Or just stop.
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
            setPendingUploads(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            {/* Merge Confirmation Modal */}
            <AnimatePresence>
                {pendingUploads && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-black mb-2 text-center text-gray-900 dark:text-white">Merge Datasets?</h3>
                            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 font-medium">
                                You selected {pendingUploads.length} files. Do you want to merge them into a single dataset (even with different columns)?
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleMergeConfirm}
                                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                                >
                                    <span>Yes, Merge All Files</span>
                                </button>
                                <button
                                    onClick={() => processFiles(pendingUploads)}
                                    className="w-full py-4 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    No, Keep Separate
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gradient Header */}
            <div className="relative mb-12 p-8 rounded-3xl gradient-indigo overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 text-center text-white">
                    <h1 className="text-4xl font-black mb-3 animate-fadeInUp">Upload Your Data</h1>
                    <p className="text-indigo-100 text-lg animate-fadeInUp" style={{ animationDelay: '0.1s' }}>Transform your data into actionable insights</p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            </div>

            {/* Progress Feedback Overlay */}
            <AnimatePresence>
                {(isUploading || uploadProgress) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${uploadProgress?.percent === 100 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                    {uploadProgress?.percent === 100 ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : uploadProgress?.percent === 0 ? (
                                        <AlertCircle className="w-5 h-5 text-amber-500" />
                                    ) : (
                                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {uploadProgress?.step || 'Preparing files...'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Please keep this tab open while we process your data.
                                    </p>
                                </div>
                            </div>
                            <span className="text-2xl font-black text-blue-600">
                                {uploadProgress?.percent || 0}%
                            </span>
                        </div>

                        <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress?.percent || 0}%` }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <FileUpload onUpload={handleUpload} isUploading={isUploading} />

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="card-interactive group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Secure</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your data is processed locally or securely on our private cloud.</p>
                </div>

                <div className="card-interactive group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Fast</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Instant analysis and automated statistics generation.</p>
                </div>

                <div className="card-interactive group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Smart</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered insights and recommendations.</p>
                </div>
            </div>
        </div>
    );
}
