import { useState, useMemo, useEffect } from 'react';
import { parseTypeORMEntities } from './utils/typeormParser';
import type { ParsedEntity } from './utils/typeormParser';
import { generateMermaidDiagram } from './utils/mermaidGenerator';
import { SAMPLE_PRESETS } from './utils/sampleEntities';
import type { EntityPreset } from './utils/sampleEntities';
import { CodeEditor } from './components/CodeEditor';
import type { EntityFile } from './components/CodeEditor';
import { ReactFlowCanvas } from './components/ReactFlowCanvas';
import { MermaidView } from './components/MermaidView';
import { DataDictionary } from './components/DataDictionary';
import { SqlExportView } from './components/SqlExportView';
import { EntityInspector } from './components/EntityInspector';
import { SaveModal } from './components/SaveModal';
import {
  Network,
  Code2,
  Table,
  Database,
  PanelLeftClose,
  PanelLeft,
  Save,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'typeorm_er_studio_files_v2';

export function App() {
  // Initialize with saved localStorage files or an empty array (no default samples auto-loaded)
  const [files, setFiles] = useState<EntityFile[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved entity files from localStorage:', e);
    }
    return [];
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return files.length > 0 ? files[0].id : '';
  });

  const [activeTab, setActiveTab] = useState<'flow' | 'mermaid' | 'dictionary' | 'sql'>('flow');
  const [showCodeSidebar, setShowCodeSidebar] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<ParsedEntity | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [showPresetMenu, setShowPresetMenu] = useState<boolean>(false);

  // Auto-persist files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.warn('Failed to persist files to localStorage:', e);
    }
  }, [files]);

  // Keep activeFileId valid if files array changes
  useEffect(() => {
    if (files.length > 0) {
      const exists = files.some((f) => f.id === activeFileId);
      if (!exists) {
        setActiveFileId(files[0].id);
      }
    } else {
      setActiveFileId('');
    }
  }, [files, activeFileId]);

  // Live parsing whenever entity code files change
  const parseResult = useMemo(() => {
    return parseTypeORMEntities(files);
  }, [files]);

  const { entities, edges, errors } = parseResult;

  const mermaidCode = useMemo(() => {
    return generateMermaidDiagram(entities, edges);
  }, [entities, edges]);

  // Handlers for code editor
  const handleUpdateCode = (fileId: string, newCode: string) => {
    setFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, code: newCode } : file))
    );
  };

  const handleAddFile = (fileName: string, code: string) => {
    const newId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newFile: EntityFile = { id: newId, fileName, code };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== fileId);
      if (activeFileId === fileId && remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleLoadPreset = (preset: EntityPreset) => {
    setFiles(preset.files);
    setActiveFileId(preset.files[0].id);
    setSelectedEntity(null);
    setShowPresetMenu(false);
  };

  const handleClearAll = () => {
    if (files.length === 0) return;
    if (window.confirm('Clear all entity files from canvas workspace?')) {
      setFiles([]);
      setActiveFileId('');
      setSelectedEntity(null);
    }
  };

  const handleCreateNewBlankEntity = () => {
    const entityName = `Entity${files.length + 1}`;
    const fileName = `${entityName}.ts`;
    const code = `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';\n\n@Entity('${entityName.toLowerCase()}s')\nexport class ${entityName} {\n  @PrimaryGeneratedColumn('uuid')\n  id: string;\n\n  @Column({ type: 'varchar', length: 150 })\n  name: string;\n\n  @CreateDateColumn()\n  createdAt: Date;\n}`;
    handleAddFile(fileName, code);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Application Navigation Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setShowCodeSidebar(!showCodeSidebar)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title={showCodeSidebar ? 'Hide Code Editor' : 'Show Code Editor'}
          >
            {showCodeSidebar ? (
              <PanelLeftClose className="w-4 h-4 text-indigo-400" />
            ) : (
              <PanelLeft className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Logo Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                TypeORM ER Visualizer
              </h1>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Interactive Entity Relationship Diagram Studio
              </p>
            </div>
          </div>
        </div>

        {/* View Tabs Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('flow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'flow'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive ER</span>
          </button>

          <button
            onClick={() => setActiveTab('mermaid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'mermaid'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Mermaid View</span>
          </button>

          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'dictionary'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Data Dictionary</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL DDL</span>
          </button>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-2">
          {/* Sample Models Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Sample Models</span>
            </button>

            {showPresetMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-40 space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Preset Model
                </div>
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className="w-full text-left p-2 rounded-xl hover:bg-indigo-950/80 text-xs transition-colors group"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-indigo-300">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Entity Button */}
          <button
            onClick={handleCreateNewBlankEntity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            title="Create blank entity file"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">+ Entity</span>
          </button>

          {/* Clear Workspace Button */}
          {files.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
              title="Clear Workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Save & Export Button */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save / Export</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Code Editor Sidebar */}
        {showCodeSidebar && (
          <div className="w-80 md:w-96 shrink-0 h-full border-r border-slate-800 z-20">
            <CodeEditor
              files={files}
              activeFileId={activeFileId}
              onSelectFile={(id) => setActiveFileId(id)}
              onUpdateCode={handleUpdateCode}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              onLoadPreset={handleLoadPreset}
              onOpenSaveModal={() => setIsSaveModalOpen(true)}
              parsedEntityCount={entities.length}
              parsedEdgeCount={edges.length}
              errors={errors}
            />
          </div>
        )}

        {/* Center Main View Canvas */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-950">
          {activeTab === 'flow' && (
            <ReactFlowCanvas
              entities={entities}
              edges={edges}
              onSelectEntity={(entity) => setSelectedEntity(entity)}
              onOpenSaveModal={() => setIsSaveModalOpen(true)}
              onAddEntityClick={handleCreateNewBlankEntity}
              onUploadClick={() => {
                setShowCodeSidebar(true);
              }}
              onLoadPresetClick={() => setShowPresetMenu(true)}
            />
          )}

          {activeTab === 'mermaid' && <MermaidView mermaidCode={mermaidCode} />}

          {activeTab === 'dictionary' && (
            <DataDictionary entities={entities} edges={edges} />
          )}

          {activeTab === 'sql' && <SqlExportView entities={entities} edges={edges} />}
        </div>

        {/* Right Drawer: Entity Inspector */}
        {selectedEntity && (
          <EntityInspector
            entity={selectedEntity}
            onClose={() => setSelectedEntity(null)}
          />
        )}
      </div>

      {/* Save & Export Modal */}
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        files={files}
        entities={entities}
        edges={edges}
        mermaidCode={mermaidCode}
        onLoadFiles={(newFiles) => {
          setFiles(newFiles);
          if (newFiles.length > 0) setActiveFileId(newFiles[0].id);
        }}
        onSaveToLocalStorage={() => {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
        }}
      />
    </div>
  );
}

export default App;
