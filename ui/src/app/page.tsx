'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TrajectoryGraph } from '@/components/TrajectoryGraph';
import { MetadataInspector } from '@/components/MetadataInspector';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { SearchFilter, SearchFilters } from '@/components/SearchFilter';
import {
  api, getWebSocket, getTags, searchTraces, getProjects,
  Trace, Span, Project, ProjectMetrics
} from '@/lib/api';
import {
  LayoutDashboard,
  Layers,
  ChevronRight,
  Database,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('demo-project');
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [traceDetail, setTraceDetail] = useState<{ trace: Trace; spans: Span[] } | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchFilters>({ query: '', status: 'all', tag: 'all' });
  const wsRef = useRef<WebSocket | null>(null);

  const fetchProjectData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [metricsRes, results, tags, projectList] = await Promise.all([
        api.get(`/projects/${selectedProjectId}`).catch(() => ({ data: { metrics: null } })),
        searchTraces({
          project_id: selectedProjectId,
          q: searchParams.query || undefined,
          tag: searchParams.tag === 'all' ? undefined : searchParams.tag,
          status: searchParams.status === 'all' ? undefined : searchParams.status,
        }),
        getTags(),
        getProjects(),
      ]);

      setProjectMetrics(metricsRes.data.metrics);
      setTraces(results);
      setAvailableTags(tags);
      setProjects(projectList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Cannot reach the AgentLens server. Make sure it's running on port 8001. (${msg})`);
    } finally {
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

  // WebSocket setup
  useEffect(() => {
    fetchProjectData();

    if (wsRef.current) wsRef.current.close();

    const ws = getWebSocket(selectedProjectId);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'trace_created') {
          setTraces(prev => {
            if (prev.find(t => t.trace_id === message.data.trace_id)) return prev;
            return [message.data, ...prev];
          });
          setProjectMetrics(prev => prev ? { ...prev, total_traces: prev.total_traces + 1 } : prev);
        } else if (message.type === 'span_updated') {
          setProjectMetrics(prev => prev ? { ...prev, total_spans: prev.total_spans + 1 } : prev);
          // Refresh trace detail if we're currently viewing this trace
          if (message.data.trace_id === selectedTraceId) {
            fetchTraceDetail(message.data.trace_id);
          }
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => {
      // WebSocket errors are non-fatal — REST still works
    };

    return () => ws.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, searchParams]);

  useEffect(() => {
    if (selectedTraceId) fetchTraceDetail(selectedTraceId);
    else setTraceDetail(null);
  }, [selectedTraceId, fetchTraceDetail]);

  const selectedSpan = traceDetail?.spans.find(s => s.span_id === selectedSpanId) ?? null;

  const handleSelectProject = (name: string) => {
    setSelectedProjectId(name);
    setSelectedTraceId(null);
    setSelectedSpanId(null);
    setShowProjectMenu(false);
  };

  return (
    <div className="flex h-screen bg-[#050508] text-gray-200 overflow-hidden font-sans selection:bg-indigo-500/30">

      {/* Left icon strip */}
      <div className="w-16 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col items-center py-6 gap-6 z-50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
          <Database className="w-5 h-5 text-white" />
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          <button
            title="Dashboard"
            onClick={() => setSelectedTraceId(null)}
            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors group relative
              ${!selectedTraceId ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <LayoutDashboard className={`w-5 h-5 ${!selectedTraceId ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
            <span className="absolute left-14 bg-black/90 border border-white/10 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">Dashboard</span>
          </button>

          <button
            title="All Traces"
            onClick={() => setSelectedTraceId(null)}
            className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group relative"
          >
            <Layers className="w-5 h-5 text-gray-400 group-hover:text-gray-200" />
            <span className="absolute left-14 bg-black/90 border border-white/10 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">Traces</span>
          </button>

          <button
            title="Refresh"
            onClick={fetchProjectData}
            className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group relative"
          >
            <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-gray-200" />
            <span className="absolute left-14 bg-black/90 border border-white/10 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">Refresh</span>
          </button>
        </nav>

        <div className="w-8 h-8 rounded-full border border-indigo-500/50 p-0.5">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"></div>
        </div>
      </div>

      {/* Trace list sidebar */}
      <Sidebar
        traces={traces}
        selectedTraceId={selectedTraceId}
        onSelectTrace={(id) => { setSelectedTraceId(id); setSelectedSpanId(null); }}
        isLoading={isLoading}
      />

      {/* Main stage */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-6 z-40 gap-4">
          {/* Breadcrumb + project switcher */}
          <div className="flex items-center gap-2 text-sm shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(v => !v)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <span>Projects</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showProjectMenu && (
                <div className="absolute top-8 left-0 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50 min-w-[180px] overflow-hidden">
                  {projects.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500 italic">No projects yet</div>
                  )}
                  {projects.map(p => (
                    <button
                      key={p.name}
                      onClick={() => handleSelectProject(p.name)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors
                        ${p.name === selectedProjectId ? 'text-indigo-400' : 'text-gray-300'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-indigo-400 font-medium truncate max-w-[120px]">{selectedProjectId}</span>
            {selectedTraceId && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-600" />
                <span className="text-gray-200 font-semibold truncate max-w-[180px]" title={traces.find(t => t.trace_id === selectedTraceId)?.name}>
                  {traces.find(t => t.trace_id === selectedTraceId)?.name || 'Untitled Trace'}
                </span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <SearchFilter availableTags={availableTags} onSearch={setSearchParams} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setSelectedTraceId(null); setSelectedSpanId(null); }}
              className="text-xs px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Layers className="w-3 h-3" /> All Traces
            </button>
            <button
              title="New Project"
              onClick={() => {
                const name = prompt('Enter project name:');
                if (name?.trim()) handleSelectProject(name.trim());
              }}
              className="h-8 w-8 rounded-md bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 flex items-center justify-center transition-all shadow-lg shadow-indigo-500/10"
            >
              <PlusCircle className="w-4 h-4 text-white" />
            </button>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchProjectData} className="ml-auto text-xs underline hover:no-underline">Retry</button>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden flex">
          {selectedTraceId ? (
            <>
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
              <MetadataInspector span={selectedSpan} onClose={() => setSelectedSpanId(null)} />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,_#1a1d2d_0%,_transparent_60%)]">
              <ProjectDashboard
                projectName={selectedProjectId}
                metrics={projectMetrics}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </main>

      {/* Close project menu on outside click */}
      {showProjectMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)} />
      )}
    </div>
  );
}
