import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Wrench, Cpu, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Span } from '@/lib/api';

const NodeWrapper = ({ children, status, selected }: { children: React.ReactNode, status: string, selected?: boolean }) => (
  <div className={cn(
    "px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md shadow-2xl min-w-[200px] transition-all duration-300",
    selected && "ring-2 ring-primary border-primary/50 shadow-primary/20",
    status === 'failure' && "border-red-500/50 bg-red-500/5 shadow-red-500/10",
    status === 'success' && "border-emerald-500/30 bg-emerald-500/5 shadow-emerald-500/5"
  )}>
    {children}
  </div>
);

const NodeHeader = ({ type, name, status }: { type: string, name: string, status: string }) => {
  const Icon = type === 'agent' ? Bot : type === 'tool' ? Wrench : Cpu;
  const StatusIcon = status === 'success' ? CheckCircle2 : status === 'failure' ? AlertCircle : Clock;
  
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-1.5 rounded-lg",
          type === 'agent' ? "bg-blue-500/10 text-blue-400" : type === 'tool' ? "bg-orange-500/10 text-orange-400" : "bg-purple-500/10 text-purple-400"
        )}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{type}</span>
      </div>
      <StatusIcon className={cn(
        "size-3.5",
        status === 'success' ? "text-emerald-500" : status === 'failure' ? "text-red-500" : "text-zinc-600 animate-pulse"
      )} />
    </div>
  );
};

export const AgentNode = memo(({ data, selected }: any) => {
  const span: Span = data.span;
  return (
    <NodeWrapper status={span.status} selected={selected}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-zinc-700 !border-zinc-800" />
      <NodeHeader type={span.type} name={span.name} status={span.status} />
      <div className="text-sm font-semibold text-white truncate mb-1">{span.name}</div>
      {span.output && (
        <div className="text-[10px] text-zinc-400 italic line-clamp-1 border-t border-zinc-800 pt-1 mt-1">
          {JSON.stringify(span.output).substring(0, 50)}...
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-zinc-700 !border-zinc-800" />
    </NodeWrapper>
  );
});

export const ToolNode = memo(({ data, selected }: any) => {
    const span: Span = data.span;
    return (
      <NodeWrapper status={span.status} selected={selected}>
        <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-zinc-700 !border-zinc-800" />
        <NodeHeader type="tool" name={span.name} status={span.status} />
        <div className="text-sm font-semibold text-white truncate">{span.name}</div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-zinc-700 !border-zinc-800" />
      </NodeWrapper>
    );
});

export const LLMNode = memo(({ data, selected }: any) => {
    const span: Span = data.span;
    return (
      <NodeWrapper status={span.status} selected={selected}>
        <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-zinc-700 !border-zinc-800" />
        <NodeHeader type="llm" name={span.name} status={span.status} />
        <div className="text-sm font-semibold text-white truncate">{span.name}</div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-zinc-700 !border-zinc-800" />
      </NodeWrapper>
    );
});
