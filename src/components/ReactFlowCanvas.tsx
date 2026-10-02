import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { ParsedEntity, EntityRelationshipEdge } from '../utils/typeormParser';
import { EntityNode } from './EntityNode';
import { RelationEdge } from './RelationEdge';
import {
  LayoutGrid,
  Maximize2,
  Download,
  Search,
  Filter,
  ArrowDownUp,
  ArrowLeftRight,
  Plus,
  Upload,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ReactFlowCanvasProps {
  entities: ParsedEntity[];
  edges: EntityRelationshipEdge[];
  onSelectEntity: (entity: ParsedEntity) => void;
  onOpenSaveModal: () => void;
  onAddEntityClick: () => void;
  onUploadClick: () => void;
  onLoadPresetClick: () => void;
}

const nodeTypes = {
  entityNode: EntityNode,
};

const edgeTypes = {
  relationEdge: RelationEdge,
};

function getDagreLayout(
  entities: ParsedEntity[],
  relationshipEdges: EntityRelationshipEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 80 : 120,
    ranksep: isHorizontal ? 160 : 150,
    marginx: 60,
    marginy: 60,
  });

  const nodeWidth = 340;
  const calculateNodeHeight = (ent: ParsedEntity) => {
    return 150 + ent.columns.length * 36;
  };

  entities.forEach((ent) => {
    const height = calculateNodeHeight(ent);
    dagreGraph.setNode(ent.className, {
      width: isHorizontal ? nodeWidth + 40 : nodeWidth,
      height: isHorizontal ? height + 20 : height,
    });
  });

  relationshipEdges.forEach((relEdge) => {
    dagreGraph.setEdge(relEdge.sourceEntity, relEdge.targetEntity);
  });

  dagre.layout(dagreGraph);

  const nodes: Node[] = entities.map((ent) => {
    const nodeWithPosition = dagreGraph.node(ent.className);
    const height = calculateNodeHeight(ent);

    return {
      id: ent.className,
      type: 'entityNode',
      data: {
        entity: ent,
      },
      position: {
        x: nodeWithPosition ? nodeWithPosition.x - nodeWidth / 2 : Math.random() * 400,
        y: nodeWithPosition ? nodeWithPosition.y - height / 2 : Math.random() * 400,
      },
    };
  });

  const edges: Edge[] = relationshipEdges.map((relEdge) => {
    const isManyToMany = relEdge.relationType === 'ManyToMany';
    const isOneToOne = relEdge.relationType === 'OneToOne';

    let strokeColor = '#818cf8';
    if (isManyToMany) strokeColor = '#f472b6';
    if (isOneToOne) strokeColor = '#38bdf8';

    return {
      id: relEdge.id,
      source: relEdge.sourceEntity,
      target: relEdge.targetEntity,
      type: 'relationEdge',
      data: {
        cardinalityLabel: relEdge.cardinalityLabel,
        relationType: relEdge.relationType,
        sourceProperty: relEdge.sourceProperty,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2.5,
        stroke: strokeColor,
      },
    };
  });

  return { nodes, edges };
}

const ReactFlowInner: React.FC<ReactFlowCanvasProps> = ({
  entities,
  edges: relationshipEdges,
  onSelectEntity,
  onOpenSaveModal,
  onAddEntityClick,
  onUploadClick,
  onLoadPresetClick,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelationFilter, setSelectedRelationFilter] = useState<string>('all');
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const { fitView } = useReactFlow();

  const applyLayout = useCallback(
    (direction: 'TB' | 'LR' = layoutDirection) => {
      if (entities.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }
      const { nodes: layoutNodes, edges: layoutEdges } = getDagreLayout(
        entities,
        relationshipEdges,
        direction
      );
      setNodes(layoutNodes);
      setEdges(layoutEdges);

      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 50);
    },
    [entities, relationshipEdges, layoutDirection, fitView, setNodes, setEdges]
  );

  useEffect(() => {
    applyLayout(layoutDirection);
  }, [entities, relationshipEdges, layoutDirection, applyLayout]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const ent = entities.find((e) => e.className === node.id);
    if (ent) onSelectEntity(ent);
  };

  const toggleDirection = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(nextDir);
  };

  const toggleBgVariant = () => {
    if (bgVariant === BackgroundVariant.Dots) setBgVariant(BackgroundVariant.Lines);
    else if (bgVariant === BackgroundVariant.Lines) setBgVariant(BackgroundVariant.Cross);
    else setBgVariant(BackgroundVariant.Dots);
  };

  const filteredNodes = nodes.map((n) => {
    const ent = n.data?.entity as ParsedEntity;
    const isMatch =
      !searchTerm ||
      ent?.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent?.tableName.toLowerCase().includes(searchTerm.toLowerCase());

    return {
      ...n,
      data: {
        ...n.data,
        isHighlighted: isMatch && searchTerm.length > 0,
        onSelectEntity,
      },
      style: {
        opacity: searchTerm && !isMatch ? 0.25 : 1,
        transition: 'all 0.3s ease',
      },
    };
  });

  const filteredEdges = edges.filter((e) => {
    if (selectedRelationFilter === 'all') return true;
    return e.data?.relationType === selectedRelationFilter;
  });

  // Empty State Canvas Overlay
  if (entities.length === 0) {
    return (
      <div className="w-full h-full relative bg-slate-950 flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-5 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">No Entity Models Loaded</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Create a new entity, upload TypeORM entity code, or load a sample preset to generate interactive ER diagrams.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={onAddEntityClick}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Create New Entity
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onUploadClick}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" /> Upload Code
              </button>
              <button
                onClick={onLoadPresetClick}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sample Models
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-950">
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        fitView
        colorMode="dark"
        minZoom={0.1}
        maxZoom={2.5}
        defaultEdgeOptions={{ animated: true }}
      >
        <Background variant={bgVariant} color="#334155" gap={24} size={1} />
        <Controls className="!bg-slate-900/90 !border-slate-800 !text-slate-200 !rounded-2xl !shadow-2xl overflow-hidden backdrop-blur-md" />
        <MiniMap
          nodeColor={() => '#6366f1'}
          maskColor="rgba(9, 13, 22, 0.85)"
          className="!bg-slate-900/90 !border-slate-800 !rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
        />

        {/* Top Floating Controls Panel */}
        <Panel position="top-left" className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl flex items-center px-3 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search table..."
              className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-32 md:w-44 text-xs"
            />
          </div>

          {/* Relation Filter */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl flex items-center px-3 py-1.5 text-xs gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedRelationFilter}
              onChange={(e) => setSelectedRelationFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-200 text-xs font-medium cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                All Relations
              </option>
              <option value="ManyToOne" className="bg-slate-900 text-indigo-300">
                ManyToOne (N:1)
              </option>
              <option value="OneToMany" className="bg-slate-900 text-indigo-300">
                OneToMany (1:N)
              </option>
              <option value="OneToOne" className="bg-slate-900 text-sky-300">
                OneToOne (1:1)
              </option>
              <option value="ManyToMany" className="bg-slate-900 text-pink-300">
                ManyToMany (N:M)
              </option>
            </select>
          </div>

          {/* Layout Direction Toggle */}
          <button
            onClick={toggleDirection}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-xs font-medium text-slate-200 border border-slate-800 rounded-xl shadow-xl transition-all"
            title={`Switch to ${layoutDirection === 'TB' ? 'Horizontal (L-R)' : 'Vertical (T-B)'} layout`}
          >
            {layoutDirection === 'TB' ? (
              <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>Layout: {layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}</span>
          </button>

          {/* Canvas Grid Background Toggle */}
          <button
            onClick={toggleBgVariant}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-slate-300 border border-slate-800 rounded-xl shadow-xl transition-all"
            title="Toggle Grid Style"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Fit View */}
          <button
            onClick={() => fitView({ padding: 0.2, duration: 400 })}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-slate-300 border border-slate-800 rounded-xl shadow-xl transition-all"
            title="Fit Diagram to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Save & Export Modal Trigger */}
          <button
            onClick={onOpenSaveModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all ml-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save & Export</span>
          </button>
        </Panel>

        {/* Bottom Right Relation Legend */}
        <Panel position="bottom-right" className="hidden md:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-xl text-[11px] font-mono text-slate-300">
          <span className="text-slate-400">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> N:1 / 1:N
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> 1:1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span> N:M
          </span>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = (props) => (
  <ReactFlowProvider>
    <ReactFlowInner {...props} />
  </ReactFlowProvider>
);
