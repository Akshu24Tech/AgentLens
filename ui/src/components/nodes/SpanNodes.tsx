import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Wrench, Cpu, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Span } from '@/lib/api';

const typeConfig = {
  agent: { Icon: Bot, bg: 'bg-blue-500/10', text: 'text-blue-400' },
  tool:  { Icon: Wrench, bg: 'bg-orange-500/10', text: 'text-orange-400' },
  llm:   { Icon: Cpu, bg: 'bg-purple-500/10', text: 'text-purple-400' },
} as const;

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 className="size-3.5 text-emerald-500" />;
  if (status === 'failure') return <AlertCircle className="size-3.5 text-red-500" />;
  return <Clock className="size-3.5 text-zinc-600 animate-pulse" />;
}

function SpanNodeBase({ data, selected }: { data: { span: Span }; selected?: boolean }) {
  const span: Span = data.span;
  const type = (span.type in typeConfig ? span.type : 'agent') as keyof typeof typeConfig;
  const { Icon, bg, text } = typeConfig[type];

  const outputPreview = span.output
    ? JSON.stringify(span.output).substring(0, 60)
    : null;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl border bg-zinc-900/90 backdrop-blur-md shadow-2xl min-w-[200px] transition-all duration-200',
        selected
          ? 'ring-2 ring-indigo-500 border-indigo-500/50 shadow-indigo-500/20'
          : 'border-zinc-800 hover:border-zinc-600',
        span.status === 'failure' && 'border-red-500/50 bg-red-500/5',
        span.status === 'success' && !selected && 'border-emerald-500/20',
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-700 !border-zinc-800" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', bg)}>
            <Icon size={14} className={text} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{span.type}</span>
        </div>
        <StatusIcon status={span.status} />
      </div>

      {/* Name */}
      <div className="text-sm font-semibold text-white truncate mb-1" title={span.name}>
        {span.name}
      </div>

      {/* Output preview */}
      {outputPreview && (
        <div className="text-[10px] text-zinc-500 italic line-clamp-1 border-t border-zinc-800 pt-1 mt-1">
          {outputPreview}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-700 !border-zinc-800" />
    </div>
  );
}

export const AgentNode = memo(SpanNodeBase);
export const ToolNode  = memo(SpanNodeBase);
export const LLMNode   = memo(SpanNodeBase);
