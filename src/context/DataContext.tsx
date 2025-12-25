import { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { ColumnStats, calculateColumnStats } from '../utils/analysis';
import { cleanData, CleaningMethod } from '../utils/cleaning';
import { logActivity } from '../utils/activityLogger';
import { KPI } from '../components/KPISection';
import { Session, AuthChangeEvent, PostgrestError } from '@supabase/supabase-js';
import { DuplicateGroup } from '../utils/fuzzy';

// Define the shape of our Dataset State
export interface DatasetState {
  id: string;
  user_id?: string;
  filename: string;
  data: Record<string, unknown>[];
  columns: string[];
  stats: ColumnStats[];
  domain?: string;
  summary?: string;
  anomalies?: string[];
  kpis?: KPI[];
  versions?: { timestamp: number, data: Record<string, unknown>[], stats: ColumnStats[] }[];
  quality_score?: { score: number, penalties: string[], grade: string };
  recommendations?: string[];
  created_at?: string;
  visibility?: 'private' | 'public' | 'shared';
  shared_with?: string[]; // Array of emails
  annotations?: { id: string, x: string | number, y: number, text: string, chartType: string }[];
  correlations?: { col1: string, col2: string, correlation: number }[];
}

export interface ComparisonResult {
  row_diff: { difference: number };
  schema_diff: { added_columns: string[], removed_columns: string[] };
  value_comparison: { column: string, mean_v1: number, mean_v2: number, diff_pct: number, status: string }[];
}

interface DataContextType {
  session: Session | null;
  loadingSession: boolean;
  datasets: DatasetState[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  activeDataset: DatasetState | null;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  isMerging: boolean;
  setIsMerging: (merging: boolean) => void;

  // Actions
  handleLogout: () => Promise<void>;
  addDataset: (dataset: DatasetState) => void;
  updateDataset: (id: string, updates: Partial<DatasetState>) => void;
  handleClean: (column: string, method: CleaningMethod, customValue?: string | number) => void;
  handleDeduplicate: (resolutions: { group: DuplicateGroup, action: string }[]) => void;
  handleUndo: () => void;
  loginAsGuest: () => void;
  compareDatasets: (id1: string, id2: string) => Promise<void>;
  comparisonResult: ComparisonResult | null;
  renameDataset: (id: string, newName: string) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;

  shareDataset: (id: string, visibility: 'private' | 'public' | 'shared', sharedWith?: string[]) => Promise<void>;
  addAnnotation: (id: string, annotation: { x: string | number, y: number, text: string, chartType: string }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [datasets, setDatasets] = useState<DatasetState[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const fetchDatasets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setDatasets(data as DatasetState[]);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    }
  }, [activeId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setLoadingSession(false);
      if (session) fetchDatasets();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      if (session) fetchDatasets();
      else setDatasets([]);
    });

    return () => subscription.unsubscribe();
  }, [activeId, fetchDatasets]);

  const activeDataset = activeId ? datasets.find(d => d.id === activeId) || null : null;

  // Derive columns if they are missing or empty (for recovery of old datasets)
  if (activeDataset && (!activeDataset.columns || activeDataset.columns.length === 0) && activeDataset.data.length > 0) {
    activeDataset.columns = Object.keys(activeDataset.data[0]);
  }
  if (activeDataset && (!activeDataset.stats || activeDataset.stats.length === 0) && activeDataset.data.length > 0) {
    // Basic fallback stats if missing
    activeDataset.stats = activeDataset.columns.map(col => calculateColumnStats(activeDataset.data, col));
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDatasets([]);
    setActiveId(null);
  };

  const addDataset = (dataset: DatasetState) => {
    setDatasets(prev => {
      if (prev.find(d => d.id === dataset.id)) return prev;
      return [dataset, ...prev];
    });
    if (!activeId) setActiveId(dataset.id);
    logActivity({
      type: 'upload',
      description: `Uploaded dataset "${dataset.filename}"`,
      metadata: {
        rows: dataset.data.length,
        columns: dataset.columns.length,
        filename: dataset.filename
      },
      datasetId: dataset.id
    });
  };

  const updateDataset = (id: string, updates: Partial<DatasetState>) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const handleClean = (column: string, method: CleaningMethod, customValue?: string | number) => {
    if (!activeDataset) return;

    const currentVersion = {
      timestamp: Date.now(),
      data: [...activeDataset.data],
      stats: [...activeDataset.stats]
    };

    const cleanedData = cleanData(activeDataset.data, column, method, activeDataset.stats, customValue);
    const newStats = activeDataset.columns.map((col) => calculateColumnStats(cleanedData, col));

    const updateData = {
      data: cleanedData,
      stats: newStats,
      versions: [...(activeDataset.versions || []), currentVersion]
    };

    updateDataset(activeDataset.id, updateData);

    const isGuest = session?.user?.id === 'guest-user';
    if (!isGuest) {
      supabase.from('datasets').update(updateData).eq('id', activeDataset.id).then(({ error }: { error: PostgrestError | null }) => {
        if (error) console.error("Failed to sync cleaned data to Supabase:", error);
      });
    }
  };

  const handleDeduplicate = (resolutions: { group: DuplicateGroup, action: string }[]) => {
    if (!activeDataset) return;

    const currentVersion = {
      timestamp: Date.now(),
      data: [...activeDataset.data],
      stats: [...activeDataset.stats]
    };

    let newData = [...activeDataset.data];
    const indicesToRemove = new Set<number>();

    resolutions.forEach(res => {
      if (res.action === 'keep_main') {
        res.group.duplicates.forEach((d) => indicesToRemove.add(d.index));
      } else if (res.action === 'keep_duplicate') {
        const mainIdx = res.group.mainIndex;
        const dupIdx = res.group.duplicates[0].index;
        newData[mainIdx] = { ...newData[dupIdx] };
        res.group.duplicates.forEach((d) => indicesToRemove.add(d.index));
      } else if (res.action === 'merge') {
        const mainIdx = res.group.mainIndex;
        res.group.duplicates.forEach((d) => {
          Object.keys(newData[d.index]).forEach(key => {
            if (newData[mainIdx][key] === null || newData[mainIdx][key] === undefined || newData[mainIdx][key] === '') {
              newData[mainIdx][key] = newData[d.index][key];
            }
          });
          indicesToRemove.add(d.index);
        });
      }
    });

    newData = newData.filter((_, idx) => !indicesToRemove.has(idx));
    const newStats = activeDataset.columns.map((col) => calculateColumnStats(newData, col));

    const updateData = {
      data: newData,
      stats: newStats,
      versions: [...(activeDataset.versions || []), currentVersion]
    };

    updateDataset(activeDataset.id, updateData);

    const isGuest = session?.user?.id === 'guest-user';
    if (!isGuest) {
      supabase.from('datasets').update(updateData).eq('id', activeDataset.id).then(({ error }: { error: PostgrestError | null }) => {
        if (error) console.error("Failed to sync deduplicated data to Supabase:", error);
      });
    }
  };

  const handleUndo = () => {
    if (!activeDataset || !activeDataset.versions || activeDataset.versions.length === 0) return;

    const lastVersion = activeDataset.versions[activeDataset.versions.length - 1];
    const remainingVersions = activeDataset.versions.slice(0, -1);

    const updateData = {
      data: lastVersion.data,
      stats: lastVersion.stats,
      versions: remainingVersions
    };

    updateDataset(activeDataset.id, updateData);

    const isGuest = session?.user?.id === 'guest-user';
    if (!isGuest) {
      supabase.from('datasets').update(updateData).eq('id', activeDataset.id).then(({ error }: { error: PostgrestError | null }) => {
        if (error) console.error("Failed to sync undo to Supabase:", error);
      });
    }
  };

  const loginAsGuest = () => {
    const guestSession: Session = {
      user: {
        id: 'guest-user',
        email: 'guest@example.com',
        user_metadata: { full_name: 'Guest User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        phone: '',
        email_confirmed_at: new Date().toISOString(),
        identities: [],
        factors: []
      },
      access_token: 'guest-token',
      refresh_token: 'guest-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    setSession(guestSession);
  };

  const compareDatasets = async (id1: string, id2: string) => {
    const d1 = datasets.find(d => d.id === id1);
    const d2 = datasets.find(d => d.id === id2);
    if (!d1 || !d2) return;

    try {
      const response = await fetch('http://localhost:8000/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data1: d1.data,
          data2: d2.data,
          name1: d1.filename,
          name2: d2.filename
        })
      });

      if (response.ok) {
        const result = await response.json();
        setComparisonResult(result);
      }
    } catch (error) {
      console.error("Comparison failed", error);
    }
  };

  const renameDataset = async (id: string, newName: string) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, filename: newName } : d));

    const isGuest = session?.user?.id === 'guest-user';
    if (!isGuest) {
      const { error } = await supabase.from('datasets').update({ filename: newName }).eq('id', id);
      if (error) console.error("Failed to rename dataset:", error);
    }
  };

  const deleteDataset = async (id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
    if (activeId === id) setActiveId(null);

    const isGuest = session?.user?.id === 'guest-user';
    if (!isGuest) {
      const { error } = await supabase.from('datasets').delete().eq('id', id);
      if (error) console.error("Failed to delete dataset:", error);
    }
  };

  const shareDataset = async (id: string, visibility: 'private' | 'public' | 'shared', sharedWith: string[] = []) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, visibility, shared_with: sharedWith } : d));

    const isGuest = session?.user?.id === 'guest-user';
    if (!isGuest) {
      const { error } = await supabase.from('datasets').update({ visibility, shared_with: sharedWith }).eq('id', id);
      if (error) console.error("Failed to update dataset permissions:", error);
    }
  }


  const addAnnotation = (id: string, annotation: { x: string | number, y: number, text: string, chartType: string }) => {
    setDatasets(prev => prev.map(d => {
      if (d.id === id) {
        const newAnnotation = { ...annotation, id: crypto.randomUUID() };
        const updated = { ...d, annotations: [...(d.annotations || []), newAnnotation] };

        // Sync to Supabase (optional, but good for persistence)
        const isGuest = session?.user?.id === 'guest-user';
        if (!isGuest) {
          supabase.from('datasets').update({ annotations: updated.annotations }).eq('id', id).then(({ error }) => {
            if (error) console.error("Failed to sync annotation:", error);
          });
        }
        return updated;
      }
      return d;
    }));
  };

  return (
    <DataContext.Provider value={{
      session,
      loadingSession,
      datasets,
      activeId,
      setActiveId,
      activeDataset,
      isUploading,
      setIsUploading,
      isMerging,
      setIsMerging,
      handleLogout,
      addDataset,
      updateDataset,
      handleClean,
      handleDeduplicate,
      handleUndo,
      loginAsGuest,
      compareDatasets,
      comparisonResult,
      renameDataset,
      deleteDataset,
      shareDataset,
      addAnnotation
    }}>
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
