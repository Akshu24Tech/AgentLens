'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TrajectoryGraph } from '@/components/TrajectoryGraph';
import { MetadataInspector } from '@/components/MetadataInspector';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { SearchFilter, SearchFilters } from '@/components/SearchFilter';
import { api, getWebSocket, getTags, searchTraces, Trace, Span } from '@/lib/api';
import { 
  LayoutDashboard, 
  Layers, 
  Settings, 
  PlusCircle, 
  ChevronRight,
  Database,
  Globe,
  MoreVertical,
  Activity,
  Binary,
  BarChart3,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('demo-project');
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<any>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [traceDetail, setTraceDetail] = useState<{ trace: Trace; spans: Span[] } | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchFilters>({ query: '', status: 'all', tag: 'all' });

  const fetchProjectData = useCallback(async () => {
    try {
      setIsLoading(true);
      const metricsRes = await api.get(`/projects/${selectedProjectId}`);
      setProjectMetrics(metricsRes.data.metrics);

      // Unified search/fetch
      const results = await searchTraces({
        project_id: selectedProjectId,
        q: searchParams.query,
        tag: searchParams.tag === 'all' ? undefined : searchParams.tag,
        status: searchParams.status === 'all' ? undefined : searchParams.status
      });
      
      setTraces(results);
      
      const tags = await getTags();
      setAvailableTags(tags);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch project data:', err);
      setIsLoading(false);
    }
  }, [selectedProjectId, searchParams]);

  const fetchTraceDetail = useCallback(async (traceId: string) => {
    try {
      const res = await api.get(`/traces/${traceId}`);
      setTraceDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch trace detail:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjectData();
    
    // Set up WebSocket for real-time updates
    const ws = getWebSocket(selectedProjectId);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'trace_created') {
        setTraces(prev => [message.data, ...prev]);
        setProjectMetrics((prev: any) => ({
           ...prev,
           total_traces: (prev?.total_traces || 0) + 1
        }));
      } else if (message.type === 'span_updated') {
        // If we are looking at this specific trace, we should consider refreshing it
        // Note: For extreme performance, we'd just update the specific span in state
        // but for now, fetching trace detail is safer.
        setProjectMetrics((prev: any) => ({
           ...prev,
           total_spans: (prev?.total_spans || 0) + 1
        }));
      }
    };

    return () => ws.close();
  }, [selectedProjectId, fetchProjectData]);

  // Separate effect to refresh trace detail when spans update
  useEffect(() => {
    if (selectedTraceId) {
      fetchTraceDetail(selectedTraceId);
    }
  }, [selectedTraceId, fetchTraceDetail]);

  const selectedSpan = traceDetail?.spans.find(s => s.span_id === selectedSpanId) || null;

  return (
    <div className="flex h-screen bg-[#050508] text-gray-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* 1. Project Navigation Strip (Fixed Left) */}
      <div className="w-16 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col items-center py-6 gap-6 z-50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 group cursor-pointer hover:scale-105 transition-all">
          <Database className="w-5 h-5 text-white" />
        </div>
        
        <nav className="flex flex-col gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group relative">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            <div className="absolute left-14 bg-black/90 border border-white/10 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">Dashboard</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group relative">
            <Globe className="w-5 h-5 text-gray-400 group-hover:text-gray-200" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group relative">
            <Layers className="w-5 h-5 text-gray-400 group-hover:text-gray-200" />
          </div>
        </nav>

        <div className="flex flex-col gap-4 mt-auto">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
          <div className="w-8 h-8 rounded-full border border-indigo-500/50 p-0.5 animate-pulse">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"></div>
          </div>
        </div>
      </div>

      {/* 2. Trace List Sidebar */}
      <Sidebar 
         traces={traces} 
         selectedTraceId={selectedTraceId} 
         onSelectTrace={(id) => {
           setSelectedTraceId(id);
           setSelectedSpanId(null);
         }} 
      />

      {/* 3. Main Stage */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-6 z-40">
           <div className="flex items-center gap-2 text-sm">
             <span className="text-gray-500 hover:text-gray-400 cursor-pointer" onClick={() => setSelectedTraceId(null)}>Projects</span>
             <ChevronRight className="w-3 h-3 text-gray-600" />
             <span className="text-indigo-400 font-medium">{selectedProjectId}</span>
             {selectedTraceId && (
               <>
                 <ChevronRight className="w-3 h-3 text-gray-600" />
                 <span className="text-gray-200 font-semibold truncate max-w-[200px]">
                   {traces.find(t => t.trace_id === selectedTraceId)?.name || 'Untitled Trace'}
                 </span>
               </>
             )}
           </div>

           <div className="flex items-center gap-3 flex-1 px-8 max-w-2xl">
              <SearchFilter 
                availableTags={availableTags} 
                onSearch={setSearchParams} 
              />
           </div>

           <div className="flex items-center gap-3">
             <button 
               onClick={() => setSelectedTraceId(null)}
               className="text-xs px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
             >
               <Layers className="w-3 h-3" /> All Projects
             </button>
             <button className="h-8 w-8 rounded-md bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 flex items-center justify-center transition-all shadow-lg shadow-indigo-500/10">
               <PlusCircle className="w-4 h-4 text-white" />
             </button>
           </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex">
          {selectedTraceId ? (
            <>
              {/* Visualization Canvas */}
              <div className="flex-1 relative">
                {traceDetail ? (
                  <TrajectoryGraph 
                    spans={traceDetail.spans}
                    selectedSpanId={selectedSpanId}
                    onSelectSpan={setSelectedSpanId}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                    <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500 italic">Synthesizing trajectory...</span>
                  </div>
                )}
              </div>

              {/* Inspector Panel */}
              <MetadataInspector 
                span={selectedSpan} 
                onClose={() => setSelectedSpanId(null)} 
              />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,_#1a1d2d_0%,_transparent_60%)]">
               {projectMetrics && (
                 <ProjectDashboard 
                   projectName={selectedProjectId} 
                   metrics={projectMetrics} 
                 />
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
