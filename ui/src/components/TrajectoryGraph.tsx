'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  ConnectionLineType
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

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  llm: LLMNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' as any : 'top' as any;
    node.sourcePosition = isHorizontal ? 'right' as any : 'bottom' as any;

    // We are shifting the dagre node position (which is center-based)
    // to top left, so it matches the React Flow node anchor point
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: newNodes, edges };
};

const TrajectoryGraph = ({ spans, selectedSpanId, onSelectSpan }: TrajectoryGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!spans.length) return;

    const initialNodes: Node[] = spans.map((span) => ({
      id: span.span_id,
      data: { label: span.name, span },
      position: { x: 0, y: 0 },
      type: span.type as any || 'agent',
      selected: span.span_id === selectedSpanId,
      style: {
        border: span.span_id === selectedSpanId ? '2px solid #6366f1' : '1px solid transparent',
        borderRadius: '8px',
      }
    }));

    const initialEdges: Edge[] = spans
      .filter(span => span.parent_id)
      .map(span => ({
        id: `e-${span.parent_id}-${span.span_id}`,
        source: span.parent_id!,
        target: span.span_id,
        type: ConnectionLineType.SmoothStep,
        animated: span.status === 'pending',
        style: { 
            stroke: span.status === 'failure' ? '#ef4444' : '#3f3f46',
            strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: span.status === 'failure' ? '#ef4444' : '#3f3f46',
        },
      }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [spans, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-zinc-950/20 backdrop-blur-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectSpan(node.id)}
        onPaneClick={() => onSelectSpan(null)}
        fitView
        className="bg-zinc-950"
      >
        <Background color="#111" gap={24} size={1} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-zinc-100" />
        <MiniMap 
            style={{ background: '#09090b', border: '1px solid #27272a' }}
            maskColor="rgba(0, 0, 0, 0.7)"
            nodeColor={(n) => {
                if (n.type === 'agent') return '#3b82f6';
                if (n.type === 'tool') return '#f97316';
                return '#a855f7';
            }}
        />
      </ReactFlow>
    </div>
  );
};

export { TrajectoryGraph };
