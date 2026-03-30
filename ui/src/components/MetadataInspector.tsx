'use client';

import React, { useState } from 'react';
import { Span } from '@/lib/api';
import {
  X,
  Terminal,
  Database,
  Clock,
  Code2,
  Tag as TagIcon,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MetadataInspectorProps {
  span: Span | null;
  onClose: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-white/10 transition-colors" title="Copy">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />}
    </button>
  );
}

function JsonSection({
  icon,
  label,
  data,
}: {
  icon?: React.ReactNode;
  label: string;
  data: unknown;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (data === null || data === undefined) return null;

  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase hover:text-gray-300 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {icon}{label}
        </button>
        <CopyButton text={text} />
      </div>
      {!collapsed && (
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 overflow-hidden group hover:border-indigo-500/30 transition-all">
          <pre className="text-[11px] font-mono text-gray-400 overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-48 overflow-y-auto">
            {text}
          </pre>
        </div>
      )}
    </section>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all group">
      <div className="flex items-center gap-2 mb-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xs font-semibold capitalize truncate" title={value}>{value}</div>
    </div>
  );
}

export function MetadataInspector({ span, onClose }: MetadataInspectorProps) {
  if (!span) return null;

  const formatDate = (date: string) => new Date(date).toLocaleTimeString();
  const duration = span.end_time
    ? `${Math.round(new Date(span.end_time).getTime() - new Date(span.start_time).getTime())}ms`
    : 'In progress';

  const statusColor =
    span.status === 'success' ? 'bg-emerald-500' :
    span.status === 'failure' ? 'bg-red-500' :
    'bg-yellow-500 animate-pulse';

  return (
    <aside className="w-96 border-l border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl flex flex-col h-full z-40 overflow-hidden animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0a0f]/90 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
          <h2 className="font-semibold text-sm truncate" title={span.name}>{span.name}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton text={span.span_id} />
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-500 hover:text-gray-200" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Span ID */}
        <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider shrink-0">Span ID</span>
          <span className="text-[11px] font-mono text-gray-400 truncate flex-1" title={span.span_id}>{span.span_id}</span>
          <CopyButton text={span.span_id} />
        </div>

        {/* Core telemetry */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            <Clock className="w-3 h-3" /> Core Telemetry
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InfoCard icon={<Terminal className="w-3 h-3" />} label="Type" value={span.type} />
            <InfoCard icon={<Database className="w-3 h-3" />} label="Status" value={span.status || 'pending'} />
            <InfoCard icon={<Clock className="w-3 h-3" />} label="Start" value={formatDate(span.start_time)} />
            <InfoCard icon={<Clock className="w-3 h-3" />} label="Duration" value={duration} />
          </div>
        </section>

        {/* Error */}
        {span.error && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-red-400 font-mono tracking-widest uppercase">
              <AlertTriangle className="w-3 h-3" /> Error
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <pre className="text-[11px] font-mono text-red-400 whitespace-pre-wrap">{span.error}</pre>
            </div>
          </section>
        )}

        {/* Tags */}
        {span.tags && span.tags.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              <TagIcon className="w-3 h-3" /> Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {span.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-none px-2 py-1 text-[11px] font-medium">
                  #{tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Input / Output */}
        <JsonSection icon={<ChevronRight className="w-3 h-3" />} label="Input Payload" data={span.input} />
        <JsonSection icon={<ChevronDown className="w-3 h-3" />} label="Output Payload" data={span.output} />

        {/* State diff */}
        {(span.state_before || span.state_after) && (
          <section className="space-y-3 border-t border-white/5 pt-6">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              <Code2 className="w-3 h-3" /> State Transition
            </div>
            <JsonSection label="Before" data={span.state_before} />
            <JsonSection label="After" data={span.state_after} />
          </section>
        )}

        {/* Metadata */}
        {span.metadata && Object.keys(span.metadata).length > 0 && (
          <JsonSection icon={<Database className="w-3 h-3" />} label="Metadata" data={span.metadata} />
        )}
      </div>
    </aside>
  );
}
