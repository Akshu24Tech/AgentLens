'use client';

import React from 'react';
import { Span } from '@/lib/api';
import { 
  X, 
  Terminal, 
  Database, 
  Clock, 
  Code2, 
  Tag as TagIcon,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MetadataInspectorProps {
  span: Span | null;
  onClose: () => void;
}

export function MetadataInspector({ span, onClose }: MetadataInspectorProps) {
  if (!span) return null;

  const formatDate = (date: string) => new Date(date).toLocaleTimeString();

  return (
    <aside className="w-96 border-l border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl flex flex-col h-full z-40 overflow-hidden animate-in slide-in-from-right-4 duration-300">
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-inherit z-10">
        <div className="flex items-center gap-2">
          <Badge variant={(span.status === 'failure' ? 'destructive' : 'secondary') as any} className="h-2 w-2 rounded-full p-0 border-none" />
          <h2 className="font-semibold text-sm truncate max-w-[200px]">{span.name}</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-gray-200" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Core Info */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">
            <Clock className="w-3 h-3" /> Core Telemetry
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InfoCard icon={<Terminal className="w-3 h-3"/>} label="Type" value={span.type} />
            <InfoCard icon={<Database className="w-3 h-3"/>} label="Status" value={span.status || 'pending'} />
            <InfoCard icon={<Clock className="w-3 h-3"/>} label="Start" value={formatDate(span.start_time)} />
            <InfoCard icon={<Database className="w-3 h-3"/>} label="Duration" value={span.end_time ? `${Math.round((new Date(span.end_time).getTime() - new Date(span.start_time).getTime()))}ms` : 'In progress'} />
          </div>
        </section>

        {/* Tags */}
        {span.tags && span.tags.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">
              <TagIcon className="w-3 h-3" /> Agent Behavioral Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {span.tags.map(tag => (
                <Badge key={tag} variant={"secondary" as any} className="bg-indigo-500/10 text-indigo-400 border-none px-2 py-1 text-[11px] font-medium">#{tag}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* Input/Output */}
        <JsonSection icon={<ChevronRight className="w-3 h-3"/>} label="Input Payload" data={span.input} />
        <JsonSection icon={<ChevronDown className="w-3 h-3"/>} label="Output Payload" data={span.output} />
        
        {/* State Changes */}
        {(span.state_before || span.state_after) && (
          <section className="space-y-3 border-t border-white/5 pt-6">
             <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                <Code2 className="w-3 h-3" /> State Transition (Diff)
             </div>
             <JsonSection label="State Before" data={span.state_before} collapsible />
             <JsonSection label="State After" data={span.state_after} collapsible />
          </section>
        )}
      </div>
    </aside>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all group">
      <div className="flex items-center gap-2 mb-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xs font-semibold capitalize truncate">{value}</div>
    </div>
  );
}

function JsonSection({ icon, label, data, collapsible = false }: { icon?: React.ReactNode, label: string, data: any, collapsible?: boolean }) {
  if (!data) return null;
  
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">
        {icon}{label}
      </div>
      <div className="bg-black/40 border border-white/10 rounded-lg p-3 overflow-hidden group hover:border-indigo-500/30 transition-all">
        <pre className="text-[11px] font-mono text-gray-400 overflow-x-auto selection:bg-indigo-500/30 custom-scrollbar whitespace-pre-wrap">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </section>
  );
}

function CheckCircle2(props: any) { return <Database {...props}/> } 
