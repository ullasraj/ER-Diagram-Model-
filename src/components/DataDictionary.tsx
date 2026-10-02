import React, { useState } from 'react';
import type { ParsedEntity, EntityRelationshipEdge } from '../utils/typeormParser';
import { Search, Table, Key, Link2, ArrowRight } from 'lucide-react';

interface DataDictionaryProps {
  entities: ParsedEntity[];
  edges: EntityRelationshipEdge[];
}

export const DataDictionary: React.FC<DataDictionaryProps> = ({ entities, edges }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntities = entities.filter(
    (e) =>
      e.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.columns.some((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto font-sans">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-400" /> Database Schema & Data Dictionary
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detailed columnar specification of all parsed TypeORM tables and {edges.length} relationships.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tables or columns..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Entity Cards */}
      <div className="space-y-8">
        {filteredEntities.map((entity) => {
          const entityEdges = edges.filter(
            (e) => e.sourceEntity === entity.className || e.targetEntity === entity.className
          );

          return (
            <div
              key={entity.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Entity Title Header */}
              <div className="px-6 py-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      {entity.className}{' '}
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {entity.tableName}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      File: {entity.fileName} • {entity.columns.length} columns • {entityEdges.length} connected edges
                    </p>
                  </div>
                </div>
              </div>

              {/* Columns Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                      <th className="py-3 px-6">Column Name</th>
                      <th className="py-3 px-4">DB Name</th>
                      <th className="py-3 px-4">Data Type</th>
                      <th className="py-3 px-4">TypeScript Type</th>
                      <th className="py-3 px-4">Constraints</th>
                      <th className="py-3 px-4">Default Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {entity.columns.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-6 font-semibold flex items-center gap-2">
                          {col.isPrimary && (
                            <span title="Primary Key">
                              <Key className="w-3.5 h-3.5 text-amber-400" />
                            </span>
                          )}
                          {col.isForeignKey && (
                            <span title="Foreign Key">
                              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                            </span>
                          )}
                          <span className={col.isPrimary ? 'text-amber-300 font-bold' : ''}>
                            {col.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-indigo-300">{col.dbName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px]">
                            {col.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{col.tsType}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {col.isPrimary && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                PK
                              </span>
                            )}
                            {col.isForeignKey && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                FK ({col.foreignKeyTarget?.entityName})
                              </span>
                            )}
                            {col.isUnique && !col.isPrimary && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                UNIQUE
                              </span>
                            )}
                            {col.isNullable ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                                NULLABLE
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                NOT NULL
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {col.defaultValue !== undefined ? (
                            <code className="text-slate-300">{col.defaultValue}</code>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Entity Relations Summary */}
              {entity.relations.length > 0 && (
                <div className="px-6 py-3 bg-slate-950/40 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" /> Model Relations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {entity.relations.map((rel) => (
                      <div
                        key={rel.id}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono flex items-center gap-2"
                      >
                        <span className="text-indigo-400 font-semibold">{rel.propertyName}</span>
                        <span className="text-slate-500">({rel.relationType})</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-cyan-300">{rel.targetEntity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
