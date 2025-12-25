import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js';
import { Globe, Map as MapIcon, Layers, Maximize2 } from 'lucide-react';

interface GeoXProps {
    data: Record<string, unknown>[];
    columns: string[];
}

export function GeoX({ data, columns }: GeoXProps) {
    const [projection, setProjection] = useState<'orthographic' | 'mercator'>('orthographic');
    const [geoColumn, setGeoColumn] = useState<string>('');
    const [valueColumn, setValueColumn] = useState<string>('');
    const [is3D, setIs3D] = useState(true);

    const geoColumns = useMemo(() => {
        const keywords = ['country', 'city', 'state', 'province', 'lat', 'lon', 'longitude', 'latitude', 'geo', 'nation'];
        return columns.filter(c => keywords.some(k => c.toLowerCase().includes(k)));
    }, [columns]);

    const numericColumns = useMemo(() => {
        if (data.length === 0) return [];
        return columns.filter(c => typeof data[0][c] === 'number');
    }, [data, columns]);

    React.useEffect(() => {
        if (geoColumns.length > 0 && !geoColumn) setGeoColumn(geoColumns[0]);
        if (numericColumns.length > 0 && !valueColumn) setValueColumn(numericColumns[0]);
    }, [geoColumns, numericColumns, geoColumn, valueColumn]);

    const isCoordinates = useMemo(() => {
        const lower = geoColumn.toLowerCase();
        return lower.includes('lat') || lower.includes('lon');
    }, [geoColumn]);

    const getPlotData = () => {
        if (!geoColumn || !valueColumn) return [];

        if (isCoordinates) {
            // Find the other coordinate column
            const latCol = geoColumn.toLowerCase().includes('lat') ? geoColumn : geoColumns.find(c => c.toLowerCase().includes('lat'));
            const lonCol = geoColumn.toLowerCase().includes('lon') ? geoColumn : geoColumns.find(c => c.toLowerCase().includes('lon'));

            if (latCol && lonCol) {
                return [{
                    type: 'scattergeo',
                    mode: 'markers',
                    lat: data.map(d => d[latCol]),
                    lon: data.map(d => d[lonCol]),
                    marker: {
                        size: 8,
                        color: data.map(d => d[valueColumn]),
                        colorscale: 'Viridis',
                        showscale: true,
                    },
                    text: data.map(d => `${valueColumn}: ${d[valueColumn]}`),
                } as Plotly.Data];
            }
        }

        // Default to Choropleth
        return [{
            type: 'choropleth',
            locationmode: 'country names',
            locations: data.map(d => d[geoColumn]),
            z: data.map(d => d[valueColumn]),
            colorscale: 'Viridis',
            marker: {
                line: {
                    color: 'rgb(255,255,255)',
                    width: 0.5
                }
            },
            colorbar: {
                title: valueColumn,
                thickness: 10,
                len: 0.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                titlefont: { color: '#64748b', size: 10 },
                tickfont: { color: '#64748b', size: 8 }
            }
        } as Plotly.Data];
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Geo Controls</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Region Column</label>
                                <select
                                    value={geoColumn}
                                    onChange={(e) => setGeoColumn(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                                >
                                    {geoColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                    {geoColumns.length === 0 && <option disabled>No geo data found</option>}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Value Mapping</label>
                                <select
                                    value={valueColumn}
                                    onChange={(e) => setValueColumn(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                                >
                                    {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Visual Mode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => { setIs3D(true); setProjection('orthographic'); }}
                                        className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${is3D ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                                    >
                                        <Globe className="w-4 h-4" />
                                        <span className="text-[8px] font-black uppercase">3D Globe</span>
                                    </button>
                                    <button
                                        onClick={() => { setIs3D(false); setProjection('mercator'); }}
                                        className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${!is3D ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                                    >
                                        <MapIcon className="w-4 h-4" />
                                        <span className="text-[8px] font-black uppercase">2D Flat</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border border-gray-100 dark:border-slate-800 bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase">Intelligence Insights</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                            GeoX detected <strong>{data.length}</strong> spatial data points. {geoColumns.length > 0 ? "Geocoding is active." : "Manual mapping suggested."}
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="glass-card rounded-[2.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-2xl bg-white dark:bg-slate-950 min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-900 flex justify-between items-center bg-white dark:bg-slate-950">
                            <div>
                                <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tighter italic leading-none">Global Intelligence Map</h2>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Spatial distribution of {valueColumn}</p>
                            </div>
                            <Maximize2 className="w-4 h-4 text-slate-300" />
                        </div>

                        <div className="flex-1 relative">
                            <Plot
                                data={getPlotData()}
                                layout={{
                                    autosize: true,
                                    margin: { l: 0, r: 0, t: 0, b: 0 },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    geo: {
                                        projection: {
                                            type: projection
                                        },
                                        showcoastlines: true,
                                        coastlinecolor: '#64748b',
                                        showland: true,
                                        landcolor: '#f8fafc',
                                        showocean: true,
                                        oceancolor: '#f1f5f9',
                                        showlakes: true,
                                        lakecolor: '#e2e8f0',
                                        showcountries: true,
                                        countrycolor: '#cbd5e1',
                                        bgcolor: 'rgba(0,0,0,0)',
                                        resolution: 50,
                                        ...(is3D && {
                                            lataxis: { range: [-90, 90] },
                                            lonaxis: { range: [-180, 180] }
                                        })
                                    },
                                    template: {
                                        layout: {
                                            font: { family: 'Inter, sans-serif' }
                                        }
                                    }
                                } as Partial<Plotly.Layout>}
                                config={{
                                    responsive: true,
                                    displayModeBar: false
                                }}
                                style={{ width: '100%', height: '500px' }}
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
