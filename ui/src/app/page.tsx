'use client';

import React, { useState, useEffect } from 'react';
import { getTraces, getTraceDetail, Trace, Span } from '@/lib/api';
import TrajectoryGraph from '@/components/TrajectoryGraph';
import { Activity, Clock, Layers, Box, ChevronRight, Search, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [traceDetail, setTraceDetail] = useState<{ trace: Trace; spans: Span[] } | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshTraces();
    const interval = setInterval(refreshTraces, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTraceId) {
      loadTraceDetail(selectedTraceId);
    }
  }, [selectedTraceId]);

  const refreshTraces = async () => {
    try {
      const data = await getTraces();
      setTraces(data.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()));
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch traces", err);
    }
  };

  const loadTraceDetail = async (id: string) => {
    try {
      const detail = await getTraceDetail(id);
      setTraceDetail(detail);
      if (detail.spans.length > 0) {
        setSelectedSpan(detail.spans[0]);
      }
    } catch (err) {
      console.error("Failed to fetch trace detail", err);
    }
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar: Trace List */}
      <aside className="w-80 border-r border-zinc-900 flex flex-col bg-zinc-950/50">
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Traces
          </h2>
          <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-500 font-mono">
            {traces.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-20 text-zinc-600 text-sm italic">
              Loading traces...
            </div>
          ) : traces.map((trace) => (
            <button
              key={trace.trace_id}
              onClick={() => setSelectedTraceId(trace.trace_id)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all group relative overflow-hidden",
                selectedTraceId === trace.trace_id 
                  ? "bg-primary/10 border border-primary/20 ring-1 ring-primary/10" 
                  : "hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
              )}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "font-medium text-sm truncate",
                    selectedTraceId === trace.trace_id ? "text-primary" : "text-zinc-200"
                  )}>
                    {trace.name}
                  </span>
                  <ChevronRight className={cn(
                    "size-3 transition-transform",
                    selectedTraceId === trace.trace_id ? "translate-x-0.5 opacity-100" : "opacity-0 group-hover:opacity-40"
                  )} />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono italic">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(trace.start_time).toLocaleTimeString()}
                  </span>
                  <span className="px-1.5 py-0.5 bg-zinc-900 rounded border border-zinc-800 uppercase tracking-tighter">
                    {trace.project_id}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedTraceId && traceDetail ? (
          <>
            {/* Header info bar */}
            <div className="h-12 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-medium text-zinc-300">
                  Trace: <span className="text-white ml-1">{traceDetail.trace.name}</span>
                </h3>
                <div className="h-4 w-px bg-zinc-800" />
                <div className="text-[11px] text-zinc-500 font-mono">
                  ID: {traceDetail.trace.trace_id}
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs transition-colors flex items-center gap-2">
                    <LayoutGrid className="size-3" />
                    Focus View
                 </button>
              </div>
            </div>

            {/* Viewport for Graph */}
            <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
              <TrajectoryGraph 
                spans={traceDetail.spans} 
                onSpanSelect={setSelectedSpan} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4 opacity-50">
             <div className="size-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
                <Layers className="size-8" />
             </div>
             <p className="text-sm">Select a trace to visualize the agent's path</p>
          </div>
        )}
      </div>

      {/* Right Sidebar: Span Detail/Metadata */}
      <aside className={cn(
        "w-96 border-l border-zinc-900 bg-zinc-950/50 flex flex-col transition-all",
        !selectedSpan && "translate-x-full opacity-0 pointer-events-none"
      )}>
        {selectedSpan && (
          <>
            <div className="p-4 border-b border-zinc-900">
              <h2 className="font-semibold flex items-center gap-2">
                <Box className="size-4 text-primary" />
                Span Detail
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <section className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Name</label>
                <div className="text-lg font-medium text-white">{selectedSpan.name}</div>
                <div className="flex gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    selectedSpan.status === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                  )}>
                    {selectedSpan.status}
                  </span>
                </div>
              </section>

              <section className="space-y-4">
                 <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-3 shadow-inner">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-mono">STATE BEFORE</label>
                      <pre className="text-xs bg-black/40 p-3 rounded-lg border border-white/5 overflow-x-auto text-zinc-300">
                        {JSON.stringify(selectedSpan.state_before || {}, null, 2)}
                      </pre>
                    </div>
                    
                    <div className="flex justify-center">
                      <ChevronRight className="size-4 rotate-90 text-zinc-700" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-mono">STATE AFTER</label>
                      <pre className="text-xs bg-black/40 p-3 rounded-lg border border-white/5 overflow-x-auto text-zinc-100">
                        {JSON.stringify(selectedSpan.state_after || {}, null, 2)}
                      </pre>
                    </div>
                 </div>
              </section>

              {selectedSpan.metadata && Object.keys(selectedSpan.metadata).length > 0 && (
                <section className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Metadata</label>
                  <div className="grid gap-2">
                    {Object.entries(selectedSpan.metadata).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-xs p-2 rounded bg-zinc-900 border border-zinc-800/50">
                        <span className="text-zinc-500">{key}</span>
                        <span className="text-zinc-300 font-mono">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
