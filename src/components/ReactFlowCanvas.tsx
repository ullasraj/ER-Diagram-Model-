import React, { useCallback, useEffect, useState, useRef } from 'react';
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
import { getEntityColor } from '../utils/colorUtils';
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
  Palette,
  CheckSquare,
  Square,
  ChevronDown,
  X,
  Table,
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
  direction: 'TB' | 'LR' = 'TB',
  colorMode: 'table' | 'relation' = 'table'
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

  const entityColorMap = new Map<string, ReturnType<typeof getEntityColor>>();
  entities.forEach((ent, idx) => {
    const colorTheme = getEntityColor(ent.className, idx);
    entityColorMap.set(ent.className, colorTheme);
    dagreGraph.setNode(ent.className, {
      width: isHorizontal ? nodeWidth + 40 : nodeWidth,
      height: calculateNodeHeight(ent),
    });
  });

  relationshipEdges.forEach((relEdge) => {
    dagreGraph.setEdge(relEdge.sourceEntity, relEdge.targetEntity);
  });

  dagre.layout(dagreGraph);

  const nodes: Node[] = entities.map((ent, idx) => {
    const nodeWithPosition = dagreGraph.node(ent.className);
    const height = calculateNodeHeight(ent);
    const colorTheme = entityColorMap.get(ent.className) || getEntityColor(ent.className, idx);

    return {
      id: ent.className,
      type: 'entityNode',
      data: {
        entity: ent,
        colorTheme,
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

    const sourceTheme = entityColorMap.get(relEdge.sourceEntity) || getEntityColor(relEdge.sourceEntity);

    let strokeColor = sourceTheme.stroke;
    if (colorMode === 'relation') {
      strokeColor = '#818cf8';
      if (isManyToMany) strokeColor = '#f472b6';
      if (isOneToOne) strokeColor = '#38bdf8';
    }

    return {
      id: relEdge.id,
      source: relEdge.sourceEntity,
      target: relEdge.targetEntity,
      type: 'relationEdge',
      data: {
        cardinalityLabel: relEdge.cardinalityLabel,
        relationType: relEdge.relationType,
        sourceProperty: relEdge.sourceProperty,
        edgeColor: strokeColor,
        edgeTextColor: colorMode === 'table' ? sourceTheme.text : undefined,
        edgeBgColor: colorMode === 'table' ? sourceTheme.bg : undefined,
        edgeBorderColor: colorMode === 'table' ? sourceTheme.border : undefined,
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
  const [selectedTableClasses, setSelectedTableClasses] = useState<string[]>([]);
  const [tableSearchText, setTableSearchText] = useState('');
  const [showTablePickerDropdown, setShowTablePickerDropdown] = useState(false);
  const [selectedRelationFilter, setSelectedRelationFilter] = useState<string>('all');
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [colorMode, setColorMode] = useState<'table' | 'relation'>('table');
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as unknown as globalThis.Node)) {
        setShowTablePickerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyLayout = useCallback(
    (direction: 'TB' | 'LR' = layoutDirection, mode: 'table' | 'relation' = colorMode) => {
      if (entities.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }
      const { nodes: layoutNodes, edges: layoutEdges } = getDagreLayout(
        entities,
        relationshipEdges,
        direction,
        mode
      );
      setNodes(layoutNodes);
      setEdges(layoutEdges);

      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 50);
    },
    [entities, relationshipEdges, layoutDirection, colorMode, fitView, setNodes, setEdges]
  );

  useEffect(() => {
    applyLayout(layoutDirection, colorMode);
  }, [entities, relationshipEdges, layoutDirection, colorMode, applyLayout]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const ent = entities.find((e) => e.className === node.id);
    if (ent) onSelectEntity(ent);
  };

  const toggleDirection = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(nextDir);
  };

  const toggleColorMode = () => {
    const nextMode = colorMode === 'table' ? 'relation' : 'table';
    setColorMode(nextMode);
  };

  const toggleBgVariant = () => {
    if (bgVariant === BackgroundVariant.Dots) setBgVariant(BackgroundVariant.Lines);
    else if (bgVariant === BackgroundVariant.Lines) setBgVariant(BackgroundVariant.Cross);
    else setBgVariant(BackgroundVariant.Dots);
  };

  // Multi-table selection handlers
  const handleToggleTableSelection = (className: string) => {
    setSelectedTableClasses((prev) => {
      if (prev.includes(className)) {
        return prev.filter((c) => c !== className);
      } else {
        return [...prev, className];
      }
    });
  };

  const handleSelectAllTables = () => {
    setSelectedTableClasses(entities.map((e) => e.className));
  };

  const handleClearTableSelection = () => {
    setSelectedTableClasses([]);
  };

  // Filter nodes based on multi-selected table picker
  const visibleNodes = nodes.filter((n) => {
    if (selectedTableClasses.length === 0) return true; // Default: show all
    return selectedTableClasses.includes(n.id);
  });

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  // Filter edges so relationship lines are only shown for visible tables
  const visibleEdges = edges.filter((e) => {
    // Edge relation type filter
    if (selectedRelationFilter !== 'all' && e.data?.relationType !== selectedRelationFilter) {
      return false;
    }
    // Only display edges connecting selected visible tables
    if (selectedTableClasses.length > 0) {
      return visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target);
    }
    return true;
  });

  const searchedEntities = entities.filter(
    (e) =>
      e.className.toLowerCase().includes(tableSearchText.toLowerCase()) ||
      e.tableName.toLowerCase().includes(tableSearchText.toLowerCase())
  );

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
        nodes={visibleNodes}
        edges={visibleEdges}
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
          nodeColor={(node) => {
            const ent = node.data?.entity as ParsedEntity;
            if (ent) {
              const theme = getEntityColor(ent.className);
              return theme.stroke;
            }
            return '#6366f1';
          }}
          maskColor="rgba(9, 13, 22, 0.85)"
          className="!bg-slate-900/90 !border-slate-800 !rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
        />

        {/* Top Floating Controls Panel */}
        <Panel position="top-left" className="flex flex-wrap items-center gap-2.5">
          {/* Multi-Select Table Picker Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowTablePickerDropdown(!showTablePickerDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 backdrop-blur-md border rounded-xl shadow-xl text-xs font-semibold transition-all ${
                selectedTableClasses.length > 0
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/25'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-indigo-300" />
              <span>
                {selectedTableClasses.length > 0
                  ? `Showing ${selectedTableClasses.length} of ${entities.length} Tables`
                  : `Select Tables (${entities.length})`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Dropdown Menu */}
            {showTablePickerDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-3 backdrop-blur-2xl animate-in fade-in duration-150 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-indigo-400" /> Multi-Table Picker
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={handleSelectAllTables}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={handleClearTableSelection}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      Show All
                    </button>
                  </div>
                </div>

                {/* Search box inside table picker */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={tableSearchText}
                    onChange={(e) => setTableSearchText(e.target.value)}
                    placeholder="Search table list..."
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {tableSearchText && (
                    <button
                      onClick={() => setTableSearchText('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Checkbox List of Tables */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {searchedEntities.map((ent, idx) => {
                    const isChecked = selectedTableClasses.includes(ent.className);
                    const colorTheme = getEntityColor(ent.className, idx);

                    return (
                      <div
                        key={ent.className}
                        onClick={() => handleToggleTableSelection(ent.className)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-colors border ${
                          isChecked
                            ? 'bg-indigo-950/60 border-indigo-500/50 text-slate-100 font-semibold'
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border"
                            style={{ backgroundColor: colorTheme.stroke, borderColor: colorTheme.stroke }}
                          />
                          <span className="truncate">{ent.className}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-sans shrink-0 ml-2">
                          ({ent.tableName})
                        </span>
                      </div>
                    );
                  })}
                  {searchedEntities.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-3">No tables match "{tableSearchText}"</p>
                  )}
                </div>

                {selectedTableClasses.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{selectedTableClasses.length} tables selected</span>
                    <button
                      onClick={handleClearTableSelection}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}
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

          {/* Color Mode Toggle */}
          <button
            onClick={toggleColorMode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-xs font-medium text-slate-200 border border-slate-800 rounded-xl shadow-xl transition-all"
            title="Toggle between Distinct Table Line Colors and Relation Type Colors"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>{colorMode === 'table' ? 'Colors: Distinct Tables' : 'Colors: Relation Types'}</span>
          </button>

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
        <Panel position="bottom-right" className="hidden md:flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-xl text-[11px] font-mono text-slate-300 max-w-xl">
          <span className="text-slate-400 font-sans font-medium">
            {colorMode === 'table' ? 'Table Connection Colors:' : 'Relation Type Colors:'}
          </span>

          {colorMode === 'table' ? (
            entities.slice(0, 6).map((ent, idx) => {
              const theme = getEntityColor(ent.className, idx);
              return (
                <span key={ent.id} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full border"
                    style={{ backgroundColor: theme.stroke, borderColor: theme.stroke }}
                  />
                  <span style={{ color: theme.text }}>{ent.className}</span>
                </span>
              );
            })
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> N:1 / 1:N
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> 1:1
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span> N:M
              </span>
            </>
          )}
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
