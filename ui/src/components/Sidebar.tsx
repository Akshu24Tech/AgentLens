'use client';

import React from 'react';
import { Trace } from '@/lib/api';
import {
  Activity,
  Clock,
  Terminal,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  traces: Trace[];
  selectedTraceId: string | null;
  onSelectTrace: (id: string) => void;
  isLoading?: boolean;
}

export function Sidebar({ traces, selectedTraceId, onSelectTrace, isLoading }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-white/5 bg-[#0a0a0f]/80 backdrop-blur-3xl flex flex-col h-full z-40 shrink-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-sm tracking-tight">Traces</h2>
        </div>
        <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-gray-400">
          {traces.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs text-gray-500 italic">Loading traces...</span>
          </div>
        ) : traces.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <Terminal className="w-8 h-8 text-gray-700" />
            <div className="text-xs text-gray-500 italic">
              No traces captured yet.<br />Start your agents to see logs.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {traces.map((trace) => {
              const isSelected = selectedTraceId === trace.trace_id;
              const status = (trace.metadata?.status as string) || 'success';
              const hasError = status === 'failure';
              const isRunning = status === 'pending';

              let timeStr = '';
              try {
                timeStr = formatDistanceToNow(new Date(trace.start_time), { addSuffix: true });
              } catch {
                timeStr = trace.start_time;
              }

              return (
                <div
                  key={trace.trace_id}
                  onClick={() => onSelectTrace(trace.trace_id)}
                  className={`group p-4 transition-all cursor-pointer relative
                    ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-r" />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <span className={`text-[13px] font-medium transition-colors leading-snug
                      ${isSelected ? 'text-indigo-300' : 'text-gray-300 group-hover:text-gray-100'}`}>
                      {trace.name || 'Untitled Trace'}
                    </span>
                    <div className="shrink-0 mt-0.5">
                      {hasError ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      ) : isRunning ? (
                        <Clock className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span className="truncate max-w-[110px]" title={trace.trace_id}>
                      {trace.trace_id.split('-')[0]}
                    </span>
                    <span>{timeStr}</span>
                  </div>

                  {trace.tags && trace.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trace.tags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-indigo-500/5 text-indigo-400/70 rounded text-[9px] border border-indigo-500/10"
                        >
                          #{tag}
                        </span>
                      ))}
                      {trace.tags.length > 4 && (
                        <span className="px-1.5 py-0.5 text-gray-600 text-[9px]">+{trace.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
