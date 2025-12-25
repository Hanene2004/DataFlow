import { useData } from '../context/DataContext';
import { DataCleaning } from '../components/DataCleaning';
import { MissingValues } from '../components/MissingValues';
import { getMissingValuesSummary } from '../utils/analysis';
import { Undo } from 'lucide-react';

export function CleaningPage() {
    const { activeDataset, handleClean, handleUndo } = useData();

    if (!activeDataset) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-gray-400 mb-4">No active dataset</div>
                <p className="text-gray-500">Please upload or select a dataset to perform cleaning.</p>
            </div>
        );
    }

    const { data, columns, stats } = activeDataset;
    const missingValues = getMissingValuesSummary(data, columns);

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Data Control Center</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Advanced Synthesis & Cleaning Environment</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleUndo}
                        disabled={!activeDataset.versions || activeDataset.versions.length === 0}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-all bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 disabled:opacity-20 disabled:grayscale"
                    >
                        <Undo className="w-4 h-4" />
                        Rollback Precision
                    </button>
                </div>
            </div>

            <div className="space-y-12">
                <DataCleaning
                    data={data}
                    stats={stats}
                    onClean={handleClean}
                />

                {missingValues.length > 0 && (
                    <div className="pt-12 border-t border-gray-100 dark:border-slate-800">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-8">Structural Diagnostics</h3>
                        <MissingValues missingValues={missingValues} totalRows={data.length} />
                    </div>
                )}
            </div>
        </div>
    );
}
