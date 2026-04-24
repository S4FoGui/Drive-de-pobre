import { useState, useEffect, useRef } from 'react'
import logo from './icon do drive de pobre.png'
import agentIcon from '../elem.png'
import {
  Search, Folder, Plus, Trash2, Lock, LogOut, Video, Filter, X, Settings, Send, Sparkles, Upload, ChevronDown, Download, Link2
} from 'lucide-react'

interface Material { id: string; title: string; subject: string; type: 'video' | 'pdf' | 'link'; url: string; }
interface ThemeConfig { primary: string; bgMain: string; bgCard: string; textMain: string; }
interface ThemePreset { id: string; name: string; config: ThemeConfig; }
interface AIConfig { provider: 'groq' | 'gemini'; apiKey: string; }

const API_URL = '/api';
const LOCAL_DATA_KEY = 'dp_site_data';
const DEFAULT_PRESET_ID = 'preset-default';
const GEMINI_MODEL = 'gemini-2.0-flash';
const SYSTEM_SUBJECTS = ['Matemática', 'Física', 'Química'];
const DEFAULT_SUBJECTS = SYSTEM_SUBJECTS;
const DEFAULT_THEME: ThemeConfig = {
  primary: '#6366f1',
  bgMain: '#0f172a',
  bgCard: '#1e293b',
  textMain: '#f8fafc',
};
const DEFAULT_PRESET: ThemePreset = {
  id: DEFAULT_PRESET_ID,
  name: 'Padrão',
  config: DEFAULT_THEME,
};

interface PersistedData {
  materials: Material[];
  subjects: string[];
  theme: ThemeConfig;
  themePresets: ThemePreset[];
}

interface ExportDriveResponse {
  ok: boolean;
  exportId: string;
  folder: string;
  downloadUrl: string;
  hasPdfs: boolean;
  error?: string;
}

const mergeSubjects = (list: string[]) => {
  const unique = Array.from(new Set([...SYSTEM_SUBJECTS, ...list.filter(Boolean)]));
  return unique;
};

function CustomSelect({ options, value, onChange, label }: { options: {value: string, label: string}[], value: string, onChange: (v: string) => void, label?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="custom-select-container">
      {label && <label className="form-label">{label}</label>}
      <div className="custom-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selected?.label}</span>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', opacity: 0.5 }} />
      </div>
      {isOpen && (
        <>
          <div className="custom-select-overlay" onClick={() => setIsOpen(false)} />
          <div className="custom-select-options">
            {options.map(opt => (
              <div 
                key={opt.value} 
                className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS)
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME)
  const [themePresets, setThemePresets] = useState<ThemePreset[]>([])
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: 'groq', apiKey: '' })
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Todas')
  const [selectedType, setSelectedType] = useState<'todos' | 'video' | 'pdf' | 'link'>('todos')
  const [playingMaterial, setPlayingMaterial] = useState<Material | null>(null)
  
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExportingDrive, setIsExportingDrive] = useState(false)
  const [isImportingDrive, setIsImportingDrive] = useState(false)
  const [password, setPassword] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newMaterial, setNewMaterial] = useState({ title: '', subject: '', type: 'video' as 'video' | 'pdf' | 'link', url: '' })
  const visibleThemePresets = [DEFAULT_PRESET, ...themePresets.filter(p => p.id !== DEFAULT_PRESET_ID)]
  const importDriveInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--bg-main', theme.bgMain);
    root.style.setProperty('--bg-card', theme.bgCard);
    root.style.setProperty('--text-main', theme.textMain);
  }, [theme]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Falha ao ler o PDF.'));
        reader.readAsDataURL(file);
      });

      setNewMaterial({ ...newMaterial, url: dataUrl });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const applyPersistedData = (data: Partial<PersistedData>) => {
    if (Array.isArray(data.materials)) setMaterials(data.materials);
    if (Array.isArray(data.subjects)) setSubjects(mergeSubjects(data.subjects));
    if (data.theme) setTheme(data.theme);
    if (Array.isArray(data.themePresets)) setThemePresets(data.themePresets.filter(p => p.id !== DEFAULT_PRESET_ID));
  };

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/materials`);
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const data = await res.json();
      applyPersistedData(data);
      localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify({
        materials: Array.isArray(data.materials) ? data.materials : [],
        subjects: mergeSubjects(Array.isArray(data.subjects) ? data.subjects : DEFAULT_SUBJECTS),
        theme: data.theme || DEFAULT_THEME,
        themePresets: Array.isArray(data.themePresets) ? data.themePresets.filter((p: ThemePreset) => p.id !== DEFAULT_PRESET_ID) : [],
      }));
    } catch {
      const savedData = localStorage.getItem(LOCAL_DATA_KEY);
      if (savedData) {
        try {
          applyPersistedData(JSON.parse(savedData));
        } catch {
          console.log('Falha ao recuperar dados locais');
        }
      }
    }
  };

  useEffect(() => {
    loadData();
    const savedAi = localStorage.getItem('dp_ai_config');
    if (savedAi) setAiConfig(JSON.parse(savedAi));
    if (localStorage.getItem('dp_admin') === 'true') setIsAdmin(true);
  }, []);

  const saveData = (m: Material[], s: string[], t: ThemeConfig, presets: ThemePreset[]) => {
    const payload = { materials: m, subjects: mergeSubjects(s), theme: t, themePresets: presets };
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(payload));
    fetch(`${API_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => console.log('Nao foi possivel salvar no servidor, dados mantidos localmente.'));
  };

  const exportDrive = async () => {
    setIsExportingDrive(true);
    try {
      const res = await fetch(`${API_URL}/export-drive`, { method: 'POST' });
      const data: ExportDriveResponse = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao exportar drive.');

      const supportsDirectoryPicker = 'showDirectoryPicker' in window;
      if (!supportsDirectoryPicker) {
        alert(data.hasPdfs
          ? `Drive exportado com sucesso.\nPasta criada no servidor: ${data.folder}\nJSON: ${window.location.origin}${data.downloadUrl}`
          : `Drive exportado com sucesso.\nJSON: ${window.location.origin}${data.downloadUrl}`);
        return;
      }

      const directoryHandle = await (window as unknown as Window & {
        showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker();

      const driveResponse = await fetch(data.downloadUrl);
      if (!driveResponse.ok) throw new Error('Falha ao baixar o drive exportado.');
      const driveBlob = await driveResponse.blob();
      const driveText = await driveBlob.text();
      const driveJson = JSON.parse(driveText) as { materials?: Array<{ type?: string; exportFile?: string }> };

      const driveFileHandle = await directoryHandle.getFileHandle('drive.json', { create: true });
      const driveWritable = await driveFileHandle.createWritable();
      await driveWritable.write(driveBlob);
      await driveWritable.close();

      if (Array.isArray(driveJson.materials)) {
        for (const material of driveJson.materials) {
          if (material.type !== 'pdf' || !material.exportFile) continue;

          const exportFilePath = material.exportFile.replace(/^\/+/, '');
          const pdfUrl = `/exports/${data.exportId}/${exportFilePath}`;
          const pdfResponse = await fetch(pdfUrl);
          if (!pdfResponse.ok) continue;

          const pdfBlob = await pdfResponse.blob();
          const fileName = exportFilePath.split('/').pop() || `arquivo-${Date.now()}.pdf`;
          const pdfDirHandle = await directoryHandle.getDirectoryHandle('pdfs', { create: true });
          const pdfFileHandle = await pdfDirHandle.getFileHandle(fileName, { create: true });
          const pdfWritable = await pdfFileHandle.createWritable();
          await pdfWritable.write(pdfBlob);
          await pdfWritable.close();
        }
      }

      alert('Drive exportado com sucesso para a pasta selecionada.');
    } catch (error) {
      alert(`Erro ao exportar drive: ${error instanceof Error ? error.message : 'Falha desconhecida.'}`);
    } finally {
      setIsExportingDrive(false);
    }
  };

  const importDrive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsImportingDrive(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const res = await fetch(`${API_URL}/import-drive`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao importar drive.');
      await loadData();
      alert(`Drive importado com sucesso. ${data.importedCount || 0} materiais adicionados.`);
    } catch (error) {
      alert(`Erro ao importar drive: ${error instanceof Error ? error.message : 'Falha desconhecida.'}`);
    } finally {
      if (importDriveInputRef.current) {
        importDriveInputRef.current.value = '';
      }
      setIsImportingDrive(false);
    }
  };

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    saveData(materials, subjects, newTheme, themePresets);
  };

  const savePreset = () => {
    const name = prompt('Nome do preset:');
    if (!name) return;
    const newPreset: ThemePreset = {
      id: Date.now().toString(),
      name,
      config: { ...theme }
    };
    const up = [...themePresets, newPreset];
    setThemePresets(up);
    saveData(materials, subjects, theme, up);
  };

  const applyPreset = (preset: ThemePreset) => {
    setTheme(preset.config);
    saveData(materials, subjects, preset.config, themePresets);
  };

  const deletePreset = (id: string) => {
    if (id === DEFAULT_PRESET_ID) return;
    if (window.confirm('Excluir preset?')) {
      const up = themePresets.filter(p => p.id !== id);
      setThemePresets(up);
      saveData(materials, subjects, theme, up);
    }
  };

  const addSubject = () => {
    if (newSubjectName && !subjects.includes(newSubjectName)) {
      const up = mergeSubjects([...subjects, newSubjectName]); setSubjects(up); saveData(materials, up, theme, themePresets); setNewSubjectName('');
    }
  };

  const removeSubject = (sub: string) => {
    if (SYSTEM_SUBJECTS.includes(sub)) return;
    if (window.confirm(`Excluir "${sub}"?`)) {
      const up = subjects.filter(s => s !== sub); setSubjects(up); saveData(materials, up, theme, themePresets);
    }
  };

  const addMaterial = () => {
    if (!newMaterial.title || !newMaterial.url) return;
    const up = [...materials, { ...newMaterial, id: Date.now().toString() }];
    setMaterials(up); saveData(up, subjects, theme, themePresets); setShowAddModal(false);
  };

  const deleteMaterial = (id: string) => {
    if (window.confirm('Excluir?')) {
      const up = materials.filter(m => m.id !== id); setMaterials(up); saveData(up, subjects, theme, themePresets);
    }
  };

  const callAiAgent = async () => {
    if (!aiConfig.apiKey) return alert('API Key ausente!');
    setIsAiLoading(true);
    const sys = `Admin Drive de Pobre. Materias: [${subjects.join(', ')}]. Materiais: [${materials.map(m => `${m.id}::${m.title}::${m.subject}::${m.type}`).join(' | ')}]. Ações JSON: {"action": "ADD_SUBJECT", "name": "N"}, {"action": "ADD_MATERIAL", "title": "T", "subject": "S", "type": "video|pdf|link", "url": "U"}, {"action": "EDIT_MATERIAL", "id": "ID", "title": "T", "subject": "S", "type": "video|pdf|link", "url": "U"}, {"action": "DELETE_MATERIAL", "id": "ID"}. Se nao souber o id, pode enviar "title" para localizar o material existente pelo titulo. Responda com apenas um JSON valido.`;
    try {
      const res = await fetch(aiConfig.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${aiConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(aiConfig.provider === 'groq' && { 'Authorization': `Bearer ${aiConfig.apiKey}` }) },
        body: JSON.stringify(aiConfig.provider === 'groq' ? { model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: sys }, { role: "user", content: aiPrompt }] } : { contents: [{ parts: [{ text: sys + "\n" + aiPrompt }] }] })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `Erro HTTP ${res.status}`);
      }

      const text = aiConfig.provider === 'groq'
        ? data?.choices?.[0]?.message?.content
        : data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join(' ');

      if (!text) {
        const blockReason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
        throw new Error(blockReason ? `Resposta bloqueada: ${blockReason}` : 'A IA nao retornou texto utilizavel.');
      }

      const match = text.match(/\{.*\}/s);
      if (match) {
        const act = JSON.parse(match[0]);
        const findMaterialId = () => {
          if (act.id) return String(act.id);
          if (act.title) {
            const found = materials.find(m => m.title.toLowerCase() === String(act.title).toLowerCase());
            return found?.id;
          }
          return undefined;
        };

        if (act.action === "ADD_SUBJECT") { const up = mergeSubjects([...subjects, act.name]); setSubjects(up); saveData(materials, up, theme, themePresets); }
        else if (act.action === "ADD_MATERIAL") { const up = [...materials, { ...act, id: Date.now().toString() }]; setMaterials(up); saveData(up, subjects, theme, themePresets); }
        else if (act.action === "EDIT_MATERIAL") {
          const materialId = findMaterialId();
          if (!materialId) {
            alert('IA nao encontrou o material para editar.');
          } else {
            const up = materials.map(m => m.id === materialId ? {
              ...m,
              ...(act.title ? { title: act.title } : {}),
              ...(act.subject ? { subject: act.subject } : {}),
              ...(act.type ? { type: act.type } : {}),
              ...(act.url ? { url: act.url } : {}),
            } : m);
            setMaterials(up);
            saveData(up, subjects, theme, themePresets);
          }
        }
        else if (act.action === "DELETE_MATERIAL") {
          const materialId = findMaterialId();
          if (!materialId) {
            alert('IA nao encontrou o material para excluir.');
          } else {
            const up = materials.filter(m => m.id !== materialId);
            setMaterials(up);
            saveData(up, subjects, theme, themePresets);
          }
        }
        setAiPrompt('');
      } else {
        throw new Error('A IA nao retornou um JSON valido.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro IA';
      alert(`Erro IA: ${message}`);
    } finally { setIsAiLoading(false); }
  };

  const getEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : url
  }

  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : null
  }

  const getPdfPreviewUrl = (url: string) => {
    if (!url) return ''
    return `${url}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`
  }

  const filteredMaterials = materials.filter(m => {
    const normalizedQuery = searchQuery.toLowerCase().trim()
    const matchesSearch =
      normalizedQuery === '' ||
      m.title.toLowerCase().includes(normalizedQuery) ||
      m.subject.toLowerCase().includes(normalizedQuery) ||
      m.type.toLowerCase().includes(normalizedQuery) ||
      m.url.toLowerCase().includes(normalizedQuery)
    const matchesSubject = selectedSubject === 'Todas' || m.subject === selectedSubject
    const matchesType = selectedType === 'todos' || m.type === selectedType
    return matchesSearch && matchesSubject && matchesType
  })

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2 className="nav-item" style={{ fontSize: '1.5rem', opacity: 1, cursor: 'default', gap: '0.5rem' }}>
          <img src={logo} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} /> 
          Drive de Pobre
        </h2>
        <div className={`nav-item ${selectedSubject === 'Todas' ? 'active' : ''}`} onClick={() => setSelectedSubject('Todas')}><Filter size={20} /> Todas</div>
        {subjects.map(s => ( <div key={s} className={`nav-item ${selectedSubject === s ? 'active' : ''}`} onClick={() => setSelectedSubject(s)}><Folder size={20} /> {s}</div> ))}
        <div style={{ marginTop: 'auto' }}>
          {isAdmin ? (
            <><div className="nav-item" onClick={() => setShowAdminPanel(true)}><Settings size={20} /> Painel Admin</div><div className="nav-item" onClick={() => { setIsAdmin(false); localStorage.removeItem('dp_admin'); }}><LogOut size={20} /> Sair</div></>
          ) : ( <div className="nav-item" onClick={() => setShowLogin(true)}><Lock size={20} /> Área Admin</div> )}
        </div>
      </aside>

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', gap: '1.5rem' }}>
          <div className="search-container">
            <Search size={20} />
            <input placeholder="O que você está procurando?" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={() => { setNewMaterial({ title: '', subject: subjects[0] || 'Matemática', type: 'video', url: '' }); setShowAddModal(true); }}><Plus size={20} /> Novo Material</button>}
        </header>

        <div className="type-filters">
          <button className={`type-filter-btn ${selectedType === 'todos' ? 'active' : ''}`} onClick={() => setSelectedType('todos')}>Todos</button>
          <button className={`type-filter-btn ${selectedType === 'video' ? 'active' : ''}`} onClick={() => setSelectedType('video')}>Videos</button>
          <button className={`type-filter-btn ${selectedType === 'pdf' ? 'active' : ''}`} onClick={() => setSelectedType('pdf')}>PDFs</button>
          <button className={`type-filter-btn ${selectedType === 'link' ? 'active' : ''}`} onClick={() => setSelectedType('link')}>Links</button>
        </div>

        {isAdmin && (
          <div style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-main) 100%)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--primary)', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src={agentIcon} alt="Agente IA" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '14px' }} />
              <h3>Agente de IA Admin <Sparkles size={16} /></h3>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="form-input" placeholder="Ex: Adicione Biologia..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyPress={e => e.key === 'Enter' && callAiAgent()} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={callAiAgent} disabled={isAiLoading}><Send size={20} /></button>
            </div>
          </div>
        )}

        <div className="grid">
          {filteredMaterials.map(m => (
            <div key={m.id} className="card">
              <div
                style={{ background: 'rgba(0,0,0,0.1)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: m.type === 'link' ? 'default' : 'pointer' }}
                onClick={() => { if (m.type !== 'link') setPlayingMaterial(m) }}
              >
                {m.type === 'video' && getYouTubeThumbnail(m.url) ? (
                  <img
                    src={getYouTubeThumbnail(m.url)!}
                    alt={m.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : m.type === 'video' ? <Video size={56} /> : m.type === 'link' ? <Link2 size={56} /> : (
                  <iframe
                    src={getPdfPreviewUrl(m.url)}
                    title={m.title}
                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                  />
                )}
              </div>
              <div className="card-body">
                <span className="tag">{m.subject}</span>
                <h4 style={{ margin: '0.5rem 0 1.2rem 0', fontSize: '1.1rem' }}>{m.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {m.type === 'link' ? (
                    <a href={m.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}>
                      Abrir
                    </a>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', flex: 1 }} onClick={() => setPlayingMaterial(m)}>{m.type === 'video' ? 'Assistir' : 'Ler'}</button>
                  )}
                  {m.type === 'pdf' && (
                    <a href={m.url} download target="_blank" rel="noreferrer" className="btn" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} title="Exportar/Download">
                      <Download size={18} />
                    </a>
                  )}
                  {isAdmin && <button onClick={() => deleteMaterial(m.id)} className="btn-danger" style={{ padding: '0.5rem', border: 'none', borderRadius: '0.5rem' }}><Trash2 size={20} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredMaterials.length === 0 && (
          <div className="empty-state">
            Nenhum material encontrado para a busca/filtro atual.
          </div>
        )}
      </main>

      {/* MODAL CONFIGURAÇÕES */}
      {showAdminPanel && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Painel Admin</h2>
              <button className="modal-close" onClick={() => setShowAdminPanel(false)}><X size={20} /></button>
            </div>
            <CustomSelect 
              label="🚀 Provedor IA"
              value={aiConfig.provider} 
              options={[{value: 'groq', label: 'Groq'}, {value: 'gemini', label: 'Gemini'}]}
              onChange={val => { 
                const up = {...aiConfig, provider: val as any}; 
                setAiConfig(up); 
                localStorage.setItem('dp_ai_config', JSON.stringify(up)); 
              }} 
            />
            <div className="form-group"><label>🔑 API Key</label><input className="form-input" type="password" value={aiConfig.apiKey} onChange={e => { const up = {...aiConfig, apiKey: e.target.value}; setAiConfig(up); localStorage.setItem('dp_ai_config', JSON.stringify(up)); }} /></div>
            <div className="color-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group"><label>Principal</label><div className="color-input-wrapper"><input type="color" value={theme.primary} onChange={e => updateTheme({ primary: e.target.value })} /></div></div>
              <div className="form-group"><label>Fundo</label><div className="color-input-wrapper"><input type="color" value={theme.bgMain} onChange={e => updateTheme({ bgMain: e.target.value })} /></div></div>
              <div className="form-group"><label>Cards</label><div className="color-input-wrapper"><input type="color" value={theme.bgCard} onChange={e => updateTheme({ bgCard: e.target.value })} /></div></div>
              <div className="form-group"><label>Texto</label><div className="color-input-wrapper"><input type="color" value={theme.textMain} onChange={e => updateTheme({ textMain: e.target.value })} /></div></div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} onClick={exportDrive} disabled={isExportingDrive}>
                  {isExportingDrive ? 'Exportando...' : 'Exportar Drive'}
                </button>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} onClick={() => importDriveInputRef.current?.click()} disabled={isImportingDrive}>
                  {isImportingDrive ? 'Importando...' : 'Adicionar Drive'}
                </button>
                <input
                  ref={importDriveInputRef}
                  type="file"
                  accept=".json,.pdf"
                  multiple
                  onChange={importDrive}
                  style={{ display: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>🎨 Presets de Cores</label>
                <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} onClick={savePreset}>
                  <Plus size={14} style={{ marginRight: '0.4rem' }} /> Salvar Atual
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {visibleThemePresets.map(p => (
                  <div key={p.id} className={`preset-tag ${theme.primary === p.config.primary && theme.bgMain === p.config.bgMain ? 'active' : ''}`} onClick={() => applyPreset(p)}>
                    <div className="preset-dot" style={{ background: p.config.primary }} />
                    {p.name}
                    {p.id !== DEFAULT_PRESET_ID && (
                      <Trash2 size={12} onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} style={{ opacity: 0.5 }} />
                    )}
                  </div>
                ))}
                {themePresets.length === 0 && <p style={{ fontSize: '0.85rem', opacity: 0.5, fontStyle: 'italic' }}>O preset Padrao fica sempre disponivel.</p>}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <label className="form-group"><label>📚 Gestão de Matérias</label>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <input className="form-input" placeholder="Nova..." value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                  <button className="btn btn-primary" onClick={addSubject}>Add</button>
                </div>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1.2rem' }}>
                {subjects.map(s => <span key={s} className="tag" style={{ padding: '0.4rem 1rem' }}>{s} {!SYSTEM_SUBJECTS.includes(s) && <Trash2 size={14} onClick={() => removeSubject(s)} style={{ cursor: 'pointer' }} />}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Acesso Admin</h2>
              <button className="modal-close" onClick={() => setShowLogin(false)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Senha</label><input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && (password === 'admin' ? (setIsAdmin(true), localStorage.setItem('dp_admin', 'true'), setShowLogin(false), setPassword('')) : alert('Erro'))} /></div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => password === 'admin' ? (setIsAdmin(true), localStorage.setItem('dp_admin', 'true'), setShowLogin(false), setPassword('')) : alert('Erro')}>Entrar</button>
          </div>
        </div>
      )}

      {/* MODAL NOVO MATERIAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>➕ Novo Material</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group"><label>Título</label><input className="form-input" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <CustomSelect 
                label="Matéria"
                value={newMaterial.subject}
                options={subjects.map(s => ({ value: s, label: s }))}
                onChange={val => setNewMaterial({...newMaterial, subject: val})}
              />
              <CustomSelect 
                label="Tipo"
                value={newMaterial.type}
                options={[{value: 'video', label: 'Vídeo'}, {value: 'pdf', label: 'PDF'}, {value: 'link', label: 'Link'}]}
                onChange={val => setNewMaterial({...newMaterial, type: val as 'video' | 'pdf' | 'link'})}
              />
            </div>
            <div className="form-group">
              <label>{newMaterial.type === 'pdf' ? 'Arquivo PDF / Link' : 'Link / URL'}</label>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input 
                  className="form-input" 
                  style={{ flex: 1 }}
                  placeholder={newMaterial.type === 'pdf' ? 'Cole o link ou suba um arquivo' : newMaterial.type === 'link' ? 'Cole o link do site aqui' : 'Cole o link aqui'}
                  value={newMaterial.url} 
                  onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} 
                />
                {newMaterial.type === 'pdf' && (
                  <label className="btn btn-primary" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                    <Upload size={20} />
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileUpload} 
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                    />
                  </label>
                )}
              </div>
              {isUploading && <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.4rem' }}>Enviando arquivo...</p>}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={addMaterial}>Adicionar</button>
          </div>
        </div>
      )}

      {/* PLAYER */}
      {playingMaterial && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '1000px', padding: '1.5rem' }}>
            <div className="modal-header">
              <h2>{playingMaterial.title}</h2>
              <button className="modal-close" onClick={() => setPlayingMaterial(null)}><X size={20} /></button>
            </div>
            {playingMaterial.type === 'video' ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: 'black', borderRadius: '1.5rem', overflow: 'hidden' }}>
                <iframe src={getEmbedUrl(playingMaterial.url)} frameBorder="0" allowFullScreen allow="autoplay" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></iframe>
              </div>
            ) : (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '1.5rem', overflow: 'hidden', minHeight: '70vh' }}>
                <iframe src={playingMaterial.url} frameBorder="0" style={{ width: '100%', height: '70vh' }}></iframe>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
