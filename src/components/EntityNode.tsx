import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Key, Link2, Table, ChevronDown, ChevronUp, Search, Eye } from 'lucide-react';
import type { ParsedEntity } from '../utils/typeormParser';

export interface EntityNodeData {
  entity: ParsedEntity;
  isHighlighted?: boolean;
  isCompact?: boolean;
  onSelectEntity?: (entity: ParsedEntity) => void;
}

export const EntityNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as EntityNodeData;
  const entity = nodeData.entity;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!entity) return null;

  const filteredColumns = entity.columns.filter(
    (col) =>
      col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.dbName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pkCount = entity.columns.filter((c) => c.isPrimary).length;
  const fkCount = entity.columns.filter((c) => c.isForeignKey).length;

  return (
    <div
      className={`relative min-w-[300px] max-w-[380px] rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-200 ${
        selected || nodeData.isHighlighted
          ? 'border-indigo-400 ring-4 ring-indigo-500/30 bg-slate-900/98 shadow-indigo-500/25 scale-[1.02] z-20'
          : 'border-slate-700/90 bg-slate-900/95 hover:border-indigo-500/60 shadow-black/40'
      }`}
      onClick={() => nodeData.onSelectEntity?.(entity)}
    >
      {/* Node Top Connecting Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-slate-950 !-top-1.5 hover:!scale-125 transition-transform"
      />

      {/* Entity Table Header Banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl bg-gradient-to-r from-slate-800 via-slate-850 to-indigo-950/80 border-b border-slate-700/80">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shrink-0 shadow-md">
            <Table className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-slate-100 tracking-wide truncate flex items-center gap-1.5">
              <span>{entity.className}</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              table: <span className="text-indigo-300 font-semibold">{entity.tableName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-950/80 text-indigo-300 border border-slate-700/80">
            {entity.columns.length} cols
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onSelectEntity?.(entity);
            }}
            className="p-1 rounded-lg hover:bg-slate-700/70 text-slate-400 hover:text-indigo-300 transition-colors"
            title="Inspect Entity Properties"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded-lg hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 transition-colors"
            title={isCollapsed ? 'Expand Table' : 'Collapse Table'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Key Summary Badges Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 text-[10px] font-mono border-b border-slate-800/80">
        {pkCount > 0 && (
          <span className="flex items-center gap-1 text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-md border border-amber-400/30 font-semibold">
            <Key className="w-3 h-3 text-amber-400" /> {pkCount} PK
          </span>
        )}
        {fkCount > 0 && (
          <span className="flex items-center gap-1 text-cyan-300 bg-cyan-400/15 px-2 py-0.5 rounded-md border border-cyan-400/30 font-semibold">
            <Link2 className="w-3 h-3 text-cyan-400" /> {fkCount} FK
          </span>
        )}
        <span className="ml-auto text-slate-400 text-[10px]">
          {entity.relations.length} relations
        </span>
      </div>

      {/* Body / Columns List */}
      {!isCollapsed && (
        <div className="p-2 space-y-1">
          {entity.columns.length > 7 && (
            <div className="relative mb-2 px-1">
              <Search className="w-3 h-3 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter columns..."
                className="w-full pl-7 pr-2 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="space-y-1">
            {filteredColumns.map((col) => (
              <div
                key={col.id}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono transition-colors relative border ${
                  col.isPrimary
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-100 font-medium'
                    : col.isForeignKey
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-100 font-medium'
                    : 'bg-slate-950/60 border-slate-800/50 hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                {/* Column Name & Constraints */}
                <div className="flex items-center gap-2 truncate">
                  {col.isPrimary && (
                    <span title="Primary Key">
                      <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </span>
                  )}
                  {col.isForeignKey && (
                    <span title="Foreign Key">
                      <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    </span>
                  )}
                  {col.isUnique && !col.isPrimary && (
                    <span
                      className="px-1 py-0.2 text-[9px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0"
                      title="Unique Constraint"
                    >
                      UQ
                    </span>
                  )}
                  <span className={`truncate ${col.isPrimary ? 'font-bold text-amber-300' : 'font-medium text-slate-100'}`}>
                    {col.dbName}
                  </span>
                  {col.isNullable && (
                    <span className="text-[10px] text-slate-400 font-sans italic shrink-0" title="Nullable column">
                      ?
                    </span>
                  )}
                </div>

                {/* Data Type Badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-indigo-300 border border-slate-700/80 shrink-0 ml-2 font-mono">
                  {col.type}
                </span>

                <Handle
                  type="target"
                  position={Position.Left}
                  id={`handle-${col.dbName}-in`}
                  className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-950 !-left-1.5"
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`handle-${col.dbName}-out`}
                  className="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-slate-950 !-right-1.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Connecting Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-slate-950 !-bottom-1.5 hover:!scale-125 transition-transform"
      />
    </div>
  );
});
