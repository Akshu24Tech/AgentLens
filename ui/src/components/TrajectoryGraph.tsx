'use client';

import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Span } from '@/lib/api';
import { AgentNode, ToolNode, LLMNode } from './nodes/SpanNodes';

interface TrajectoryGraphProps {
  spans: Span[];
  selectedSpanId: string | null;
  onSelectSpan: (id: string | null) => void;
}

const nodeTypes = { agent: AgentNode, tool: ToolNode, llm: LLMNode };

const NODE_W = 220;
const NODE_H = 90;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return {
    nodes: nodes.map(n => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
    }),
    edges,
  };
}

function GraphInner({ spans, selectedSpanId, onSelectSpan }: TrajectoryGraphProps) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Rebuild graph whenever spans or selection changes
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!spans.length) return { nodes: [], edges: [] };

    const rawNodes: Node[] = spans.map(span => ({
      id: span.span_id,
      data: { label: span.name, span },
      position: { x: 0, y: 0 },
      type: (['agent', 'tool', 'llm'].includes(span.type) ? span.type : 'agent') as string,
      selected: span.span_id === selectedSpanId,
    }));

    const rawEdges: Edge[] = spans
      .filter(s => s.parent_id)
      .map(s => ({
        id: `e-${s.parent_id}-${s.span_id}`,
        source: s.parent_id!,
        target: s.span_id,
        type: ConnectionLineType.SmoothStep,
        animated: s.status === 'pending',
        style: {
          stroke: s.status === 'failure' ? '#ef4444' : '#3f3f46',
          strokeWidth: 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: s.status === 'failure' ? '#ef4444' : '#3f3f46',
          width: 16,
          height: 16,
        },
      }));

    return getLayoutedElements(rawNodes, rawEdges);
  }, [spans, selectedSpanId]);

  // Sync into ReactFlow state
  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // Fit view after layout settles
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutedNodes, layoutedEdges]);

  if (!spans.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-600 italic text-sm">
        No spans in this trace
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectSpan(node.id)}
        onPaneClick={() => onSelectSpan(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        className="bg-zinc-950"
        deleteKeyCode={null}
      >
        <Background color="#1f1f23" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          style={{ background: '#09090b', border: '1px solid #27272a' }}
          maskColor="rgba(0,0,0,0.7)"
          nodeColor={n => {
            if (n.type === 'agent') return '#3b82f6';
            if (n.type === 'tool') return '#f97316';
            return '#a855f7';
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function TrajectoryGraph(props: TrajectoryGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
