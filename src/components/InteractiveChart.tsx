import { useState, useRef, useEffect, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceDot
} from 'recharts';
import { Download, ZoomIn, Settings, MessageSquarePlus } from 'lucide-react';
import { useData } from '../context/DataContext';
import * as Dialog from '@radix-ui/react-dialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ColumnStats } from '../utils/analysis';

interface InteractiveChartProps {
    data: Record<string, unknown>[];
    columns: string[];
    stats: ColumnStats[];
    title?: string;
    annotations?: { id: string, x: string | number, y: number, text: string, chartType: string }[];
}

type ChartType = 'line' | 'bar' | 'area' | 'scatter';

export function InteractiveChart({ data, columns, stats, title = "Interactive Analysis", annotations = [] }: InteractiveChartProps) {
    const { activeDataset, addAnnotation } = useData();
    const [chartType, setChartType] = useState<ChartType>('line');
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');
    const [showBrush, setShowBrush] = useState(false);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [newAnnotation, setNewAnnotation] = useState<{ x: string | number, y: number } | null>(null);
    const [annotationText, setAnnotationText] = useState('');
    const chartRef = useRef<HTMLDivElement>(null);

    // Auto-select numeric columns for Y-axis and potentially categorical/date for X
    const numericColumns = useMemo(() => stats.filter(s => s.type === 'numeric').map(s => s.name), [stats]);

    // Initialize defaults in effect to avoid render-time state settings
    useEffect(() => {
        if (columns.length > 0 && (!xAxis || !columns.includes(xAxis))) {
            setXAxis(columns[0]);
        }
        if (numericColumns.length > 0 && (!yAxis || !numericColumns.includes(yAxis))) {
            setYAxis(numericColumns[0]);
        }
    }, [columns, numericColumns]);

    const handleExportPNG = async () => {
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current);
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = "chart-export.png";
            link.click();
        }
    };

    const handleExportPDF = async () => {
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current);
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("chart-export.pdf");
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-white/20 ring-1 ring-black/5">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                                {entry.name}:
                            </span>
                            <span className="font-black text-gray-900 dark:text-white">
                                {Number(entry.value).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
            onClick: (e: any) => {
                if (isAnnotating && e && e.activeLabel) {
                    const yVal = e.activePayload && e.activePayload[0] ? e.activePayload[0].value : 0;
                    setNewAnnotation({ x: e.activeLabel, y: Number(yVal) });
                }
            },
            style: { cursor: isAnnotating ? 'crosshair' : 'default' }
        };

        const renderAnnotations = () => {
            return annotations
                .filter(a => a.chartType === chartType)
                .map((a, i) => (
                    <ReferenceDot
                        key={i}
                        x={a.x}
                        y={a.y}
                        r={6}
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth={2}
                    />
                ));
        };

        const AxisContent = (
            <>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700 opacity-50" />
                <XAxis
                    dataKey={xAxis}
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {showBrush && <Brush dataKey={xAxis} height={30} stroke="#8884d8" fill="transparent" />}
            </>
        );

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {AxisContent}
                        {renderAnnotations()}
                        <Bar
                            dataKey={yAxis}
                            fill="url(#colorGradient)"
                            radius={[4, 4, 0, 0]}
                            animationDuration={1500}
                            animationEasing="ease-out"
                        >
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                        </Bar>
                    </BarChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorGradientArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {AxisContent}
                        {renderAnnotations()}
                        <Area
                            type="monotone"
                            dataKey={yAxis}
                            stroke="#6366f1"
                            fillOpacity={1}
                            fill="url(#colorGradientArea)"
                            strokeWidth={3}
                            animationDuration={2000}
                        />
                    </AreaChart>
                );
            case 'scatter':
                return (
                    <ScatterChart {...commonProps}>
                        {AxisContent}
                        {renderAnnotations()}
                        <Scatter
                            name={yAxis}
                            dataKey={yAxis}
                            fill="#8884d8"
                            animationDuration={1000}
                        />
                    </ScatterChart>
                );
            default:
                return (
                    <LineChart {...commonProps}>
                        {AxisContent}
                        {renderAnnotations()}
                        <Line
                            type="monotone"
                            dataKey={yAxis}
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 8, strokeWidth: 0 }}
                            animationDuration={2000}
                            animationEasing="ease-in-out"
                        />
                    </LineChart>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    {title}
                </h3>

                <div className="flex flex-wrap gap-2">
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as ChartType)}
                        className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="area">Area Chart</option>
                        <option value="scatter">Scatter Plot</option>
                    </select>

                    <select
                        value={xAxis}
                        onChange={(e) => setXAxis(e.target.value)}
                        className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        {columns.map((c: string) => <option key={c} value={c}>X: {c}</option>)}
                    </select>

                    <select
                        value={yAxis}
                        onChange={(e) => setYAxis(e.target.value)}
                        className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        {numericColumns.map((c: string) => <option key={c} value={c}>Y: {c}</option>)}
                    </select>

                    <button
                        onClick={() => setIsAnnotating(!isAnnotating)}
                        className={`p-2 rounded-md transition-colors ${isAnnotating ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                        title="Add Annotation"
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setShowBrush(!showBrush)}
                        className={`p-2 rounded-md ${showBrush ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                        title="Toggle Zoom"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleExportPNG}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200"
                        title="Export PNG"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleExportPDF}
                        className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100"
                        title="Export PDF"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div ref={chartRef} className="h-[400px] w-full bg-white dark:bg-gray-800 p-2 flex items-center justify-center" style={{ touchAction: isAnnotating ? 'none' : 'auto', minWidth: 0, minHeight: 400 }}>
                {numericColumns.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        {renderChart()}
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                        <p className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">No Numeric Data Detected</p>
                        <p className="text-xs text-gray-500 font-medium">This dataset contains only categorical or text variables. Try switching datasets or checking your file format.</p>
                    </div>
                )}
            </div>

            {/* Annotation Dialog */}
            <Dialog.Root open={!!newAnnotation} onOpenChange={() => setNewAnnotation(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 z-50">
                        <Dialog.Title className="text-lg font-black text-slate-900 dark:text-white mb-4">Add Comment</Dialog.Title>
                        <textarea
                            autoFocus
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm outline-none border border-transparent focus:border-indigo-500 transition-colors"
                            rows={3}
                            placeholder="What did you observe here?"
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setNewAnnotation(null)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (activeDataset && newAnnotation) {
                                        addAnnotation(activeDataset.id, {
                                            x: newAnnotation.x,
                                            y: newAnnotation.y,
                                            text: annotationText,
                                            chartType
                                        });
                                        setAnnotationText('');
                                        setNewAnnotation(null);
                                        setIsAnnotating(false);
                                    }
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm"
                            >
                                Save Note
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
