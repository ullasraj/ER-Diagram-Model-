import React, { useState } from 'react';
import {
  FileCode,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Save,
  ChevronDown,
} from 'lucide-react';
import { SAMPLE_PRESETS } from '../utils/sampleEntities';
import type { EntityPreset } from '../utils/sampleEntities';

export interface EntityFile {
  id: string;
  fileName: string;
  code: string;
}

interface CodeEditorProps {
  files: EntityFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onUpdateCode: (fileId: string, code: string) => void;
  onAddFile: (fileName: string, code: string) => void;
  onDeleteFile: (fileId: string) => void;
  onLoadPreset: (preset: EntityPreset) => void;
  onOpenSaveModal: () => void;
  parsedEntityCount: number;
  parsedEdgeCount: number;
  errors: string[];
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onUpdateCode,
  onAddFile,
  onDeleteFile,
  onLoadPreset,
  onOpenSaveModal,
  parsedEntityCount,
  parsedEdgeCount,
  errors,
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file) => {
      const isCodeOrSql =
        file.name.endsWith('.ts') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.sql') ||
        file.name.endsWith('.txt');

      if (isCodeOrSql) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onAddFile(file.name, content);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const parsed = JSON.parse(content);
            const items = Array.isArray(parsed) ? parsed : parsed.files;
            if (Array.isArray(items)) {
              items.forEach((item: any) => {
                if (item.fileName && item.code) {
                  onAddFile(item.fileName, item.code);
                }
              });
            }
          } catch (err) {
            console.error('Failed to parse JSON model:', err);
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;

    Array.from(droppedFiles).forEach((file) => {
      const isCodeOrSql =
        file.name.endsWith('.ts') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.sql') ||
        file.name.endsWith('.txt');

      if (isCodeOrSql) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onAddFile(file.name, content);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const parsed = JSON.parse(content);
            const items = Array.isArray(parsed) ? parsed : parsed.files;
            if (Array.isArray(items)) {
              items.forEach((item: any) => {
                if (item.fileName && item.code) {
                  onAddFile(item.fileName, item.code);
                }
              });
            }
          } catch (err) {
            console.error('Failed to parse JSON model:', err);
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const handleAddNewFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    let formattedName = newFileName.trim();
    if (!formattedName.endsWith('.ts') && !formattedName.endsWith('.js')) {
      formattedName += '.ts';
    }
    const className = formattedName
      .replace(/\.(ts|js)$/, '')
      .replace(/[^a-zA-Z0-9]/g, '');
    const templateCode = `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';\n\n@Entity('${className.toLowerCase()}s')\nexport class ${className || 'NewEntity'} {\n  @PrimaryGeneratedColumn('uuid')\n  id: string;\n\n  @Column()\n  name: string;\n}`;
    onAddFile(formattedName, templateCode);
    setNewFileName('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
      {/* Top Presets & Action Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-950/70">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-indigo-400" /> Entities ({files.length})
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSaveModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors font-medium"
              title="Save Model or Diagram"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" /> Save
            </button>

            <label
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg cursor-pointer transition-colors"
              title="Upload .ts / .js / .sql / .json files"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
              <input
                type="file"
                multiple
                accept=".ts,.js,.sql,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPresetDropdown(!showPresetDropdown)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800/80 text-xs font-medium text-slate-300 border border-slate-800 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Load Sample Preset Model...
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showPresetDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-1 space-y-1">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onLoadPreset(preset);
                    setShowPresetDropdown(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-indigo-950/60 hover:text-indigo-200 text-xs transition-colors group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Tabs Bar */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto custom-scrollbar min-h-[37px]">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelectFile(file.id)}
            className={`group flex items-center gap-2 px-3 py-2 text-xs font-mono border-r border-slate-800/80 cursor-pointer border-b-2 transition-colors shrink-0 ${
              file.id === activeFile?.id
                ? 'bg-slate-900 text-indigo-400 border-b-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border-b-transparent hover:bg-slate-900/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 opacity-75" />
            <span>{file.fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(file.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
              title="Delete file"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Add New File Button */}
        {isAdding ? (
          <form onSubmit={handleAddNewFileSubmit} className="flex items-center px-2 py-1 gap-1">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Entity.ts"
              className="px-2 py-0.5 text-xs bg-slate-950 border border-indigo-500 rounded text-slate-200 outline-none w-28 font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-0.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-2 text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-900/60 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> New Entity
          </button>
        )}
      </div>

      {/* Code Editor Body / Textarea */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative flex-1 bg-slate-950 flex flex-col overflow-hidden"
      >
        {activeFile ? (
          <div className="relative flex-1 flex">
            {/* Line Numbers */}
            <div className="select-none py-3 px-2 text-right bg-slate-950 text-slate-600 text-xs font-mono border-r border-slate-900 space-y-1 w-10 shrink-0">
              {activeFile.code.split('\n').map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              value={activeFile.code}
              onChange={(e) => onUpdateCode(activeFile.id, e.target.value)}
              placeholder="Paste TypeORM entity TypeScript code here..."
              spellCheck={false}
              className="flex-1 w-full h-full p-3 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-indigo-500/30 selection:text-indigo-200"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4 m-4 rounded-2xl border-2 border-dashed border-slate-800">
            <FolderOpen className="w-10 h-10 text-slate-600" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300">No Entity Files Open</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Add an entity file, upload code files, or pick a sample model preset to start visualizing your database.
              </p>
            </div>
            <div className="flex flex-col w-full gap-2 pt-2">
              <button
                onClick={() => setIsAdding(true)}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create New Entity
              </button>
              <button
                onClick={() => setShowPresetDropdown(true)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Load Sample Preset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Parse Status Footer Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-slate-300">
            Parsed: <strong className="text-indigo-400">{parsedEntityCount}</strong> Tables,{' '}
            <strong className="text-cyan-400">{parsedEdgeCount}</strong> Edges
          </span>
        </div>

        {errors.length > 0 && (
          <span
            className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-mono text-[11px]"
            title={errors.join('\n')}
          >
            <AlertCircle className="w-3.5 h-3.5" /> {errors.length} Warnings
          </span>
        )}
      </div>
    </div>
  );
};
