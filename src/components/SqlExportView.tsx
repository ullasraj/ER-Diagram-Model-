import React, { useState } from 'react';
import type { ParsedEntity, EntityRelationshipEdge } from '../utils/typeormParser';
import { generateSqlDDL } from '../utils/sqlGenerator';
import type { SqlDialect } from '../utils/sqlGenerator';
import { Database, Copy, Check, Download } from 'lucide-react';

interface SqlExportViewProps {
  entities: ParsedEntity[];
  edges: EntityRelationshipEdge[];
}

export const SqlExportView: React.FC<SqlExportViewProps> = ({ entities, edges }) => {
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');
  const [copied, setCopied] = useState(false);

  const sqlDDL = generateSqlDDL(entities, edges, dialect);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlDDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlDDL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${dialect}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Options Header */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              SQL DDL Script Exporter
            </h2>
            <p className="text-xs text-slate-400">
              Generate native CREATE TABLE & Foreign Key scripts from your TypeORM entity models.
            </p>
          </div>
        </div>

        {/* Dialect Selector & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setDialect('postgresql')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                dialect === 'postgresql'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PostgreSQL
            </button>
            <button
              onClick={() => setDialect('mysql')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                dialect === 'mysql'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MySQL
            </button>
            <button
              onClick={() => setDialect('sqlite')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                dialect === 'sqlite'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SQLite
            </button>
          </div>

          <button
            onClick={handleCopySQL}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-xl border border-slate-700 transition-colors font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied SQL!' : 'Copy SQL'}
          </button>

          <button
            onClick={handleDownloadSQL}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-xl transition-colors font-medium shadow-md"
          >
            <Download className="w-4 h-4" /> Download .sql
          </button>
        </div>
      </div>

      {/* SQL Script Display Area */}
      <div className="flex-1 p-6 bg-slate-950 flex flex-col overflow-hidden">
        <textarea
          readOnly
          value={sqlDDL}
          className="flex-1 w-full p-5 bg-slate-900/90 text-emerald-300 font-mono text-xs leading-relaxed rounded-2xl border border-slate-800 focus:outline-none resize-none shadow-2xl custom-scrollbar"
        />
      </div>
    </div>
  );
};
