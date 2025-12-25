import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragEndEvent } from '@dnd-kit/core';
import { StatisticsCards } from './StatisticsCards';
import { InteractiveChart } from './InteractiveChart';
import { AdvancedStatsTable } from './AdvancedStatsTable';
import { KPISection } from './KPISection';
import { ColumnStats } from '../utils/analysis';
import { KPI } from './KPISection';
import { SmartAnalysis } from './SmartAnalysis';
import { QuickStatsWidget } from './QuickStatsWidget';
import { Lightbulb } from 'lucide-react';

interface DashboardProps {
    data: Record<string, unknown>[];
    columns: string[];
    stats: ColumnStats[];
    domain?: string;
    summary?: string;
    anomalies?: string[];
    recommendations?: string[];
    quality_score?: { score: number, penalties: string[], grade: string };
    kpis: KPI[];
    totalMissing: number;
    annotations?: { id: string, x: string | number, y: number, text: string, chartType: string }[];
}

const SortableItem = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1, // Ensure dragging item is on top
        touchAction: 'none' // Essential for dnd on touch devices
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
            <div className="card-3d glass-card h-full relative group overflow-hidden">
                {children}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-lg shadow-lg">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
            </div>
        </div>
    );
};

export function Dashboard({
    data,
    columns,
    stats,
    domain,
    summary,
    anomalies,
    recommendations,
    quality_score,
    kpis,
    totalMissing,
    annotations
}: DashboardProps) {
    const [items, setItems] = useState(['stats-cards', 'smart-analysis', 'kpi-section', 'main-chart', 'quick-stats', 'recommendations', 'stats-table']);

    // Load saved layout and merge with new default items
    useEffect(() => {
        const defaultItems = ['stats-cards', 'smart-analysis', 'kpi-section', 'main-chart', 'quick-stats', 'recommendations', 'stats-table'];
        const savedLayout = localStorage.getItem('dashboard_layout');
        if (savedLayout) {
            try {
                const parsed = JSON.parse(savedLayout);
                // Merge to ensure new components (like smart-analysis) are included
                const merged = [...new Set([...parsed, ...defaultItems])];
                setItems(merged);
            } catch {
                console.error("Failed to parse layout");
                setItems(defaultItems);
            }
        }
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newItems = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('dashboard_layout', JSON.stringify(newItems));
                return newItems;
            });
        }
    };

    const renderComponent = (id: string) => {
        switch (id) {
            case 'stats-cards':
                return (
                    <div className="p-4 h-full flex flex-col justify-center">
                        <StatisticsCards
                            rowCount={data.length}
                            columnCount={columns.length}
                            missingCount={totalMissing}
                            numericColumns={stats.filter(s => s.type === 'numeric').length}
                        />
                    </div>
                );
            case 'smart-analysis':
                return (
                    <div className="h-full">
                        <SmartAnalysis
                            domain={domain || 'General'}
                            summary={summary || "Analysis is generating..."}
                            anomalies={anomalies || []}
                        />
                    </div>
                );
            case 'recommendations':
                return (
                    <div className="p-6 h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-6 h-6 text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Smart Recommendations</h2>
                        </div>
                        {recommendations && recommendations.length > 0 ? (
                            <ul className="space-y-3">
                                {recommendations.map((rec, i) => (
                                    <li key={i} className="flex gap-3 text-gray-700 dark:text-gray-300">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No specific recommendations yet. Data looks standard.</p>
                        )}
                        {quality_score && (
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500 uppercase">Quality Grade</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-2xl font-black ${quality_score.score > 80 ? 'text-green-500' : quality_score.score > 50 ? 'text-amber-500' : 'text-red-500'
                                        }`}>
                                        {quality_score.grade}
                                    </span>
                                    <span className="text-gray-400">({quality_score.score}%)</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'kpi-section':
                return (
                    <div className="p-4">
                        <KPISection kpis={kpis} />
                    </div>
                );
            case 'main-chart':
                return (
                    <div className="p-4">
                        <InteractiveChart data={data} columns={columns} stats={stats} annotations={annotations} />
                    </div>
                );
            case 'stats-table':
                return (
                    <div className="p-4 overflow-auto max-h-[500px]">
                        <AdvancedStatsTable stats={stats} />
                    </div>
                );
            case 'quick-stats':
                return (
                    <div className="p-4">
                        <QuickStatsWidget data={data} stats={stats} quality_score={quality_score} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={rectSortingStrategy}
            >
                {/* Main Grid Layout */}
                <div className="space-y-6 pb-20">
                    {/* Top Row - KPI Cards (Full Width) */}
                    {items.includes('kpi-section') && (
                        <div className="animate-scale-in">
                            <SortableItem id="kpi-section">
                                {renderComponent('kpi-section')}
                            </SortableItem>
                        </div>
                    )}

                    {/* Stats Cards (Full Width) */}
                    {items.includes('stats-cards') && (
                        <div className="animate-scale-in" style={{ animationDelay: '50ms' }}>
                            <SortableItem id="stats-cards">
                                {renderComponent('stats-cards')}
                            </SortableItem>
                        </div>
                    )}

                    {/* Main Content - 3 Column Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Left Column - 2 spans */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Smart Analysis */}
                            {items.includes('smart-analysis') && (
                                <div className="animate-scale-in" style={{ animationDelay: '100ms' }}>
                                    <SortableItem id="smart-analysis">
                                        {renderComponent('smart-analysis')}
                                    </SortableItem>
                                </div>
                            )}

                            {/* Main Chart */}
                            {items.includes('main-chart') && (
                                <div className="animate-scale-in" style={{ animationDelay: '150ms' }}>
                                    <SortableItem id="main-chart">
                                        {renderComponent('main-chart')}
                                    </SortableItem>
                                </div>
                            )}

                            {/* Recommendations */}
                            {items.includes('recommendations') && (
                                <div className="animate-scale-in" style={{ animationDelay: '200ms' }}>
                                    <SortableItem id="recommendations">
                                        {renderComponent('recommendations')}
                                    </SortableItem>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Sidebar Widgets */}
                        <div className="space-y-6">
                            {items.includes('quick-stats') && (
                                <div className="animate-scale-in" style={{ animationDelay: '250ms' }}>
                                    <SortableItem id="quick-stats">
                                        {renderComponent('quick-stats')}
                                    </SortableItem>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row - Stats Table (Full Width) */}
                    {items.includes('stats-table') && (
                        <div className="animate-scale-in" style={{ animationDelay: '300ms' }}>
                            <SortableItem id="stats-table">
                                {renderComponent('stats-table')}
                            </SortableItem>
                        </div>
                    )}
                </div>
            </SortableContext>
        </DndContext>
    );
}
