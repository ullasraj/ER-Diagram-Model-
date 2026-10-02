import React from 'react';
import type { ParsedEntity } from '../utils/typeormParser';
import { X, Table, Key, Link2 } from 'lucide-react';

interface EntityInspectorProps {
  entity: ParsedEntity | null;
  onClose: () => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({ entity, onClose }) => {
  if (!entity) return null;

  return (
    <div className="w-80 md:w-96 bg-slate-900/95 border-l border-slate-800 text-slate-200 h-full flex flex-col shadow-2xl backdrop-blur-xl z-20 transition-all">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">{entity.className}</h3>
            <p className="text-[11px] font-mono text-indigo-300">table: {entity.tableName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Columns Summary */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" /> Columns ({entity.columns.length})
          </h4>
          <div className="space-y-2">
            {entity.columns.map((col) => (
              <div
                key={col.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    {col.isPrimary && <Key className="w-3 h-3 text-amber-400" />}
                    {col.isForeignKey && <Link2 className="w-3 h-3 text-cyan-400" />}
                    {col.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10px]">
                    {col.type}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 pt-1">
                  <span className="text-slate-500">DB Column: {col.dbName}</span>
                  {col.isNullable && <span className="text-slate-500">• Nullable</span>}
                  {col.isUnique && <span className="text-purple-400">• Unique</span>}
                  {col.defaultValue && <span className="text-slate-400">• default: {col.defaultValue}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relations Summary */}
        {entity.relations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-cyan-400" /> TypeORM Decorators & Edges ({entity.relations.length})
            </h4>
            <div className="space-y-2">
              {entity.relations.map((rel) => (
                <div
                  key={rel.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-400 font-bold">@{rel.relationType}</span>
                    <span className="text-cyan-300 font-semibold">{rel.targetEntity}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Property: <code className="text-slate-200">{rel.propertyName}</code>
                  </div>
                  {rel.fkColumnName && (
                    <div className="text-[10px] text-slate-500">
                      JoinColumn: {rel.fkColumnName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
