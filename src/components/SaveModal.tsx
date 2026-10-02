import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Save,
  FileJson,
  Image as ImageIcon,
  FileCode,
  Database,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import type { EntityFile } from './CodeEditor';
import {
  saveModelToJson,
  parseModelJsonFile,
  exportElementToPng,
  exportElementToSvg,
  saveTextFile,
} from '../utils/exportUtils';
import { generateSqlDDL } from '../utils/sqlGenerator';
import type { ParsedEntity, EntityRelationshipEdge } from '../utils/typeormParser';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: EntityFile[];
  entities: ParsedEntity[];
  edges: EntityRelationshipEdge[];
  mermaidCode: string;
  onLoadFiles: (files: EntityFile[]) => void;
  onSaveToLocalStorage: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  files,
  entities,
  edges,
  mermaidCode,
  onLoadFiles,
  onSaveToLocalStorage,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'diagram' | 'code'>('project');
  const [projectName, setProjectName] = useState('typeorm-schema');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveJson = () => {
    try {
      const sanitizedName = projectName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      saveModelToJson(files, `${sanitizedName || 'typeorm-model'}.json`);
      showStatus('Model JSON saved successfully!');
    } catch (err: any) {
      showStatus('Error saving model: ' + err.message);
    }
  };

  const handleSaveToBrowserStorage = () => {
    onSaveToLocalStorage();
    showStatus('Saved to Browser Storage!');
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedFiles = await parseModelJsonFile(file);
      if (importedFiles.length === 0) throw new Error('No files found in JSON project');
      onLoadFiles(importedFiles);
      showStatus(`Imported ${importedFiles.length} entity files!`);
      onClose();
    } catch (err: any) {
      alert('Failed to import model JSON: ' + err.message);
    }
  };

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      const flowEl = document.querySelector('.react-flow') as HTMLElement;
      if (!flowEl) throw new Error('React Flow ER Canvas element not found in DOM');
      const sanitizedName = projectName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      await exportElementToPng(flowEl, `${sanitizedName || 'er-diagram'}.png`);
      showStatus('Exported PNG image!');
    } catch (err: any) {
      alert('PNG export error: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSvg = async () => {
    setIsExporting(true);
    try {
      const flowEl = document.querySelector('.react-flow') as HTMLElement;
      if (!flowEl) throw new Error('React Flow ER Canvas element not found in DOM');
      const sanitizedName = projectName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      await exportElementToSvg(flowEl, `${sanitizedName || 'er-diagram'}.svg`);
      showStatus('Exported SVG vector diagram!');
    } catch (err: any) {
      alert('SVG export error: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSql = () => {
    const sql = generateSqlDDL(entities, edges, 'postgresql');
    const sanitizedName = projectName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    saveTextFile(sql, `${sanitizedName || 'schema'}.sql`, 'text/plain');
    showStatus('Exported PostgreSQL DDL script!');
  };

  const handleExportMermaid = () => {
    const sanitizedName = projectName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    saveTextFile(mermaidCode, `${sanitizedName || 'diagram'}.mmd`, 'text/plain');
    showStatus('Exported Mermaid diagram file!');
  };

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopiedCode('mermaid');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Save & Export Workspace</h2>
              <p className="text-xs text-slate-400">
                Save entity models, download diagram images, or export DDL scripts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Toast */}
        {saveStatus && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2 flex items-center gap-2 text-xs text-emerald-300 font-medium animate-in slide-in-from-top duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Project Title Input Bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-3">
          <label className="text-xs font-medium text-slate-400 shrink-0">Model File Name:</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="typeorm-schema"
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg text-xs font-mono text-slate-100 outline-none"
          />
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('project')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'project'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-slate-900/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" /> Save Model (.json)
          </button>
          <button
            onClick={() => setActiveTab('diagram')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'diagram'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-slate-900/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Save Diagram Image
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-slate-900/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" /> Export SQL / Code
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Save Model Project */}
          {activeTab === 'project' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Download JSON */}
                <div
                  onClick={handleSaveJson}
                  className="p-4 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Download Model Project</h3>
                  <p className="text-xs text-slate-400">
                    Saves all {files.length} entity definitions into a portable JSON file to reload later.
                  </p>
                </div>

                {/* Save LocalStorage */}
                <div
                  onClick={handleSaveToBrowserStorage}
                  className="p-4 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Save className="w-5 h-5" />
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Save to Browser Storage</h3>
                  <p className="text-xs text-slate-400">
                    Persists model state in your browser so it automatically loads when you return.
                  </p>
                </div>
              </div>

              {/* Import Model File */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Import Saved Model File</h4>
                      <p className="text-[11px] text-slate-400">
                        Upload a previously saved `.json` model project file
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                  >
                    Browse JSON File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Save ER Diagram Image */}
          {activeTab === 'diagram' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Export the currently visible Interactive ER Diagram canvas as high-resolution images or vectors.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PNG Export */}
                <div
                  onClick={handleExportPng}
                  className={`p-4 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group space-y-2 ${
                    isExporting ? 'opacity-60 cursor-wait' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform flex items-center gap-1.5">
                      {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      2x High-DPI
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Export High-Res PNG</h3>
                  <p className="text-xs text-slate-400">
                    Rasterized image format perfect for documentation, slides, and presentations.
                  </p>
                </div>

                {/* SVG Export */}
                <div
                  onClick={handleExportSvg}
                  className={`p-4 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-sky-500/50 rounded-xl cursor-pointer transition-all group space-y-2 ${
                    isExporting ? 'opacity-60 cursor-wait' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform flex items-center gap-1.5">
                      {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCode className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      Vector SVG
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Export Vector SVG</h3>
                  <p className="text-xs text-slate-400">
                    Scalable vector graphics diagram with lossless zooming for web & print.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Export SQL & Code */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SQL DDL Script */}
                <div
                  onClick={handleExportSql}
                  className="p-4 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                      <Database className="w-5 h-5" />
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Download SQL DDL (.sql)</h3>
                  <p className="text-xs text-slate-400">
                    Generates clean PostgreSQL/MySQL `CREATE TABLE` and foreign key constraint scripts.
                  </p>
                </div>

                {/* Mermaid ER */}
                <div
                  onClick={handleExportMermaid}
                  className="p-4 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-pink-500/50 rounded-xl cursor-pointer transition-all group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 group-hover:scale-105 transition-transform">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyMermaid();
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Copy Mermaid Code"
                    >
                      {copiedCode === 'mermaid' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">Mermaid ER Script (.mmd)</h3>
                  <p className="text-xs text-slate-400">
                    Export diagram definition in standard Mermaid syntax for markdown & GitHub.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{entities.length} Tables, {edges.length} Relationships parsed</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
