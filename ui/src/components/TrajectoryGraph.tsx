'use client';

import React, { useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Span } from '@/lib/api';

interface TrajectoryGraphProps {
  spans: Span[];
  onSpanSelect: (span: Span) => void;
}

const TrajectoryGraph = ({ spans, onSpanSelect }: TrajectoryGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes: Node[] = spans.map((span, index) => ({
      id: span.span_id,
      position: { x: 250, y: index * 100 }, // Simple vertical layout for now
      data: { label: span.name, span },
      type: 'default',
      style: { 
        background: span.status === 'success' ? '#059669' : span.status === 'failure' ? '#dc2626' : '#2563eb',
        color: '#fff',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
        width: 180,
      }
    }));

    const newEdges: Edge[] = spans
      .filter(span => span.parent_id)
      .map(span => ({
        id: `e-${span.parent_id}-${span.span_id}`,
        source: span.parent_id!,
        target: span.span_id,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [spans]);

  return (
    <div className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSpanSelect(node.data.span)}
        fitView
      >
        <Background color="#333" gap={20} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
};

export default TrajectoryGraph;
