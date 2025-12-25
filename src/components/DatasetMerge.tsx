import { useState } from 'react';
import { GitMerge, ArrowRight, Loader } from 'lucide-react';

interface DatasetBasic {
    id: string;
    filename: string;
    columns: string[];
}

interface DatasetMergeProps {
    datasets: DatasetBasic[];
    onMerge: (params: { dataset1Id: string, dataset2Id: string, transformKey: string, how: string }) => void;
    isMerging: boolean;
}

export function DatasetMerge({ datasets, onMerge, isMerging }: DatasetMergeProps) {
    const [dataset1Id, setDataset1Id] = useState<string>('');
    const [dataset2Id, setDataset2Id] = useState<string>('');
    const [mergeKey, setMergeKey] = useState<string>('');
    const [how, setHow] = useState<string>('inner');

    const dataset1 = datasets.find(d => d.id === dataset1Id);
    const dataset2 = datasets.find(d => d.id === dataset2Id);

    // Find common columns
    const commonColumns = dataset1 && dataset2
        ? dataset1.columns.filter(c => dataset2.columns.includes(c))
        : [];

    const handleMergeClick = () => {
        if (dataset1Id && dataset2Id && mergeKey) {
            onMerge({ dataset1Id, dataset2Id, transformKey: mergeKey, how });
        }
    };

    if (datasets.length < 2) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 text-center">
                <GitMerge className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Upload at least two datasets to perform a merge.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
                <GitMerge className="w-6 h-6 text-violet-600" />
                <h3 className="text-xl font-bold text-gray-800">Merge Datasets</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dataset 1</label>
                    <select
                        value={dataset1Id}
                        onChange={(e) => setDataset1Id(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    >
                        <option value="">Select Dataset...</option>
                        {datasets.map(d => (
                            <option key={d.id} value={d.id}>{d.filename}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-center md:pt-6">
                    <div className="bg-gray-100 p-2 rounded-full">
                        <ArrowRight className="w-5 h-5 text-gray-500 transform rotate-90 md:rotate-0" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dataset 2</label>
                    <select
                        value={dataset2Id}
                        onChange={(e) => setDataset2Id(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    >
                        <option value="">Select Dataset...</option>
                        {datasets.filter(d => d.id !== dataset1Id).map(d => (
                            <option key={d.id} value={d.id}>{d.filename}</option>
                        ))}
                    </select>
                </div>
            </div>

            {dataset1Id && dataset2Id && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Common Column (Key)</label>
                        <select
                            value={mergeKey}
                            onChange={(e) => setMergeKey(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500"
                        >
                            <option value="">Select Key...</option>
                            {commonColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        {commonColumns.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No common columns found.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merge Strategy</label>
                        <select
                            value={how}
                            onChange={(e) => setHow(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500"
                        >
                            <option value="inner">Inner Join (Keep matches)</option>
                            <option value="outer">Outer Join (Keep all)</option>
                            <option value="left">Left Join (Keep Dataset 1)</option>
                            <option value="right">Right Join (Keep Dataset 2)</option>
                        </select>
                    </div>
                </div>
            )}

            <button
                onClick={handleMergeClick}
                disabled={isMerging || !dataset1Id || !dataset2Id || !mergeKey}
                className="w-full md:w-auto bg-violet-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {isMerging ? (
                    <>
                        <Loader className="w-4 h-4 animate-spin" /> Merging...
                    </>
                ) : (
                    'Merge Datasets'
                )}
            </button>
        </div>
    );
}
