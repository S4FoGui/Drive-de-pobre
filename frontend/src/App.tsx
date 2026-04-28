import { useState, useEffect, useRef } from 'react'
import logo from './icon do drive de pobre.png'
import agentIcon from '../elem.png'
import {
  Search, Folder, Plus, Trash2, Lock, LogOut, Video, Filter, X, Settings, Send, Sparkles, Upload, ChevronDown, Download, Link2, Eye, EyeOff, Check, Palette, Database, Bot, BookOpen, AlertCircle, AlertTriangle, FileText, Globe
} from 'lucide-react'

interface Material { id: string; title: string; subject: string; type: 'video' | 'pdf' | 'link'; url: string; }
interface ThemeConfig { primary: string; bgMain: string; bgCard: string; textMain: string; }
interface ThemePreset { id: string; name: string; config: ThemeConfig; }
interface AIConfig { provider: 'groq' | 'gemini' | 'openai'; apiKey: string; model?: string; }

const API_URL = '/api';
const LOCAL_DATA_KEY = 'dp_site_data';
const DEFAULT_PRESET_ID = 'preset-default';
const GEMINI_MODEL = 'gemini-2.0-flash';
const DEFAULT_SUBJECTS = ['Matemática', 'Física', 'Química'];
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


const mergeSubjects = (list: string[]) => {
  return Array.from(new Set(list.filter(Boolean)));
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

const extractJsonFromText = (text: string) => {
  // Tenta encontrar um array primeiro (prioridade para batch actions)
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    let content = arrayMatch[0];
    while (content.length > 0) {
      try {
        return JSON.parse(content);
      } catch {
        const lastIndex = content.lastIndexOf(']');
        if (lastIndex <= 0) break;
        content = content.substring(0, lastIndex);
        const nextLastIndex = content.lastIndexOf(']');
        if (nextLastIndex === -1) break;
        content = content.substring(0, nextLastIndex + 1);
      }
    }
  }

  // Tenta encontrar um objeto único
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    let content = objectMatch[0];
    while (content.length > 0) {
      try {
        return JSON.parse(content);
      } catch {
        const lastIndex = content.lastIndexOf('}');
        if (lastIndex <= 0) break;
        content = content.substring(0, lastIndex);
        const nextLastIndex = content.lastIndexOf('}');
        if (nextLastIndex === -1) break;
        content = content.substring(0, nextLastIndex + 1);
      }
    }
  }
  
  throw new Error("A IA não retornou um formato JSON válido que pudesse ser recuperado.");
};

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
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Todas')
  const [selectedType, setSelectedType] = useState<'todos' | 'video' | 'pdf' | 'link'>('todos')
  const [playingMaterial, setPlayingMaterial] = useState<Material | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 100;
  
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isExportingDrive, setIsExportingDrive] = useState(false)
  const [isImportingDrive, setIsImportingDrive] = useState(false)
  const [password, setPassword] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [presetNameInput, setPresetNameInput] = useState('')
  const [newMaterial, setNewMaterial] = useState({ title: '', subject: '', type: 'video' as 'video' | 'pdf' | 'link', url: '' })
  const [formErrors, setFormErrors] = useState<{ title?: string; url?: string }>({})
  const [storedPassword, setStoredPassword] = useState('admin')
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const visibleThemePresets = [DEFAULT_PRESET, ...themePresets.filter(p => p.id !== DEFAULT_PRESET_ID)]
  const importDriveInputRef = useRef<HTMLInputElement | null>(null)
  // Export filters
  const [exportSubjects, setExportSubjects] = useState<string[] | null>(null) // null = all
  const [exportIncludePresets, setExportIncludePresets] = useState(true)
  const activeExportSubjects = exportSubjects ?? subjects

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
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Falha ao enviar arquivo para o servidor.');
      }

      const data = await res.json();
      setNewMaterial({ ...newMaterial, url: data.url });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const applyPersistedData = (data: Partial<PersistedData & { password?: string }>) => {
    if (Array.isArray(data.materials)) setMaterials(data.materials);
    if (Array.isArray(data.subjects)) setSubjects(mergeSubjects(data.subjects));
    if (data.theme) setTheme(data.theme);
    if (data.password) setStoredPassword(data.password);
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          api?.zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          api?.zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          api?.zoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveData = (m: Material[], s: string[], t: ThemeConfig, presets: ThemePreset[]) => {
    const payload = { materials: m, subjects: mergeSubjects(s), theme: t, themePresets: presets };
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(payload));
    fetch(`${API_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    }).catch(() => console.log('Nao foi possivel salvar no servidor, dados mantidos localmente.'));
  };

  const toggleExportSubject = (sub: string) => {
    const current = exportSubjects ?? subjects;
    if (current.includes(sub)) {
      setExportSubjects(current.filter(s => s !== sub));
    } else {
      setExportSubjects([...current, sub]);
    }
  };

  const changePassword = async () => {
    if (!newPasswordInput) return alert('Digite a nova senha');
    setIsChangingPassword(true);
    try {
      const res = await fetch(`${API_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPasswordInput })
      });
      if (res.ok) {
        setStoredPassword(newPasswordInput);
        setNewPasswordInput('');
        alert('Senha alterada com sucesso!');
      } else {
        alert('Erro ao alterar senha');
      }
    } catch (error) {
      alert('Erro de conexão');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Utilitário: baixa um blob como arquivo com o nome dado
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportDrive = async () => {
    setIsExportingDrive(true);
    try {
      const selectedSubs = exportSubjects ?? subjects;
      const res = await fetch(`${API_URL}/export-drive-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterSubjects: selectedSubs, includePresets: exportIncludePresets }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Erro HTTP ${res.status}`);
      }

      const zipBlob = await res.blob();
      const filename = `drive-export-${new Date().toISOString().slice(0, 10)}.zip`;
      downloadBlob(zipBlob, filename);
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
    if (!presetNameInput.trim()) return;
    const newPreset: ThemePreset = {
      id: Date.now().toString(),
      name: presetNameInput.trim(),
      config: { ...theme }
    };
    const up = [...themePresets, newPreset];
    setThemePresets(up);
    saveData(materials, subjects, theme, up);
    setShowPresetModal(false);
    setPresetNameInput('');
  };

  const applyPreset = (preset: ThemePreset) => {
    setTheme(preset.config);
    saveData(materials, subjects, preset.config, themePresets);
  };

  const deletePreset = (id: string) => {
    if (id === DEFAULT_PRESET_ID) return;
    setConfirmDialog({
      message: 'Excluir este preset de tema?',
      onConfirm: () => {
        const up = themePresets.filter(p => p.id !== id);
        setThemePresets(up);
        saveData(materials, subjects, theme, up);
      }
    });
  };

  const addSubject = () => {
    if (newSubjectName && !subjects.includes(newSubjectName)) {
      const up = mergeSubjects([...subjects, newSubjectName]); setSubjects(up); saveData(materials, up, theme, themePresets); setNewSubjectName('');
    }
  };

  const removeSubject = (sub: string) => {
    const subMaterials = materials.filter(m => m.subject === sub);
    const count = subMaterials.length;
    const msg = count > 0
      ? `Excluir a matéria "${sub}" e seus ${count} material(is)? Esta ação não pode ser desfeita.`
      : `Excluir a matéria "${sub}"?`;
    setConfirmDialog({
      message: msg,
      onConfirm: () => {
        // Remove PDFs do servidor
        subMaterials.forEach(m => {
          if (m.type === 'pdf' && m.url) {
            fetch(`${API_URL}/delete-file`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: m.url }),
            }).catch(err => console.error('Erro ao deletar arquivo:', err));
          }
        });
        const newMaterials = materials.filter(m => m.subject !== sub);
        const newSubjects = subjects.filter(s => s !== sub);
        setMaterials(newMaterials);
        setSubjects(newSubjects);
        saveData(newMaterials, newSubjects, theme, themePresets);
        // Se estava filtrando por essa matéria, volta para "Todas"
        if (selectedSubject === sub) setSelectedSubject('Todas');
      }
    });
  };

  const addMaterial = () => {
    const errors: { title?: string; url?: string } = {};
    if (!newMaterial.title.trim()) errors.title = 'O título é obrigatório.';
    if (!newMaterial.url.trim()) errors.url = 'O link ou arquivo é obrigatório.';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});

    // Auto-detect YouTube for manual addition
    const finalMaterial = { ...newMaterial };
    if (isYouTubeUrl(finalMaterial.url)) {
      finalMaterial.type = 'video';
    }

    // Auto-create subject if it doesn't exist
    let updatedSubjects = [...subjects];
    if (finalMaterial.subject && !updatedSubjects.includes(finalMaterial.subject)) {
      updatedSubjects = mergeSubjects([...updatedSubjects, finalMaterial.subject]);
      setSubjects(updatedSubjects);
    }

    const up = [...materials, { ...finalMaterial, id: Date.now().toString() }];
    setMaterials(up); saveData(up, updatedSubjects, theme, themePresets); setShowAddModal(false);
    setNewMaterial({ title: '', subject: subjects[0] || '', type: 'video', url: '' });
  };

  const deleteMaterial = (id: string) => {
    setConfirmDialog({
      message: 'Tem certeza que deseja excluir este material?',
      onConfirm: () => {
        const materialToDelete = materials.find(m => m.id === id);
        const up = materials.filter(m => m.id !== id);
        setMaterials(up); 
        saveData(up, subjects, theme, themePresets);

        if (materialToDelete?.type === 'pdf' && materialToDelete.url) {
          fetch(`${API_URL}/delete-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: materialToDelete.url })
          }).catch(err => console.error('Erro ao deletar arquivo fisico:', err));
        }
      }
    });
  };

  const extractLinks = (text: string) => {
    const links: { title: string, url: string }[] = [];
    let cleanedText = text;

    const mdRegex = /\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g;
    cleanedText = cleanedText.replace(mdRegex, (_match, title, url) => {
      links.push({ title: title.trim() || 'Novo Material', url: url.trim() });
      return '[LINK]';
    });

    const plainRegex = /(https?:\/\/[^\s]+)/g;
    cleanedText = cleanedText.replace(plainRegex, (_match, url) => {
      links.push({ title: 'Novo Material', url: url.trim() });
      return '[LINK]';
    });

    return { links, cleanedText };
  };

  // Tenta detectar o nome da matéria localmente no texto do usuário
  const detectSubjectLocally = (text: string): string | null => {
    const lower = text.toLowerCase();
    // Padrões comuns: "crie a pasta X", "adicione na pasta X", "na matéria X", "pasta X"
    const patterns = [
      /(?:cri[ea]r?|adicionar?|colocar?)\s+(?:a\s+)?(?:pasta|mat[ée]ria|folder)\s+["']?([\w\s-]+?)["']?(?:\s+e\s|\s*$|\s*\n)/i,
      /(?:pasta|mat[ée]ria|folder)\s+["']?([\w\s-]+?)["']?(?:\s+e\s|\s*$|\s*\n)/i,
      /(?:adicione?\s+(?:em|na|no|para)\s+)([\w\s-]+?)(?:\s*$|\s*\n|\s*#)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
    // Tenta encontrar uma matéria existente mencionada no texto
    for (const sub of subjects) {
      if (lower.includes(sub.toLowerCase())) {
        return sub;
      }
    }
    return null;
  };

  const callAiAgent = async () => {
    if (!aiConfig.apiKey) return alert('API Key ausente!');
    setIsAiLoading(true);

    const { links: extractedLinks, cleanedText } = extractLinks(aiPrompt);
    const isBatchMode = extractedLinks.length >= 3;

    // Em batch mode, resolve 100% local — NUNCA chama a IA para batch
    if (isBatchMode) {
      try {
        // Prioridade: 1) detectar do texto, 2) pasta selecionada na sidebar, 3) última pasta criada
        let targetSubject = detectSubjectLocally(aiPrompt);
        
        if (!targetSubject && selectedSubject !== 'Todas') {
          targetSubject = selectedSubject;
        }
        
        if (!targetSubject && subjects.length > 0) {
          targetSubject = subjects[subjects.length - 1]; // última pasta criada
        }
        
        if (!targetSubject) {
          targetSubject = 'Geral';
        }
        
        let newSubjects = [...subjects];
        if (!newSubjects.some(s => s.toLowerCase() === targetSubject!.toLowerCase())) {
          newSubjects = mergeSubjects([...newSubjects, targetSubject]);
        }
        // Usa o nome exato da matéria existente ou o novo
        const exactSubject = newSubjects.find(s => s.toLowerCase() === targetSubject!.toLowerCase()) || targetSubject;
        const batchMaterials: Material[] = extractedLinks.map((link, idx) => ({
          id: `${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 8)}`,
          title: link.title,
          subject: exactSubject,
          type: isYouTubeUrl(link.url) ? 'video' : 'link',
          url: link.url
        }));
        const newMaterials = [...materials, ...batchMaterials];
        setMaterials(newMaterials);
        setSubjects(newSubjects);
        saveData(newMaterials, newSubjects, theme, themePresets);
        setAiPrompt('');
        return;
      } finally {
        setIsAiLoading(false);
      }
    }

    let sys = "";
    let finalPrompt = aiPrompt;

    if (isBatchMode) {
      sys = `Admin Drive de Pobre. Materias: [${subjects.join(', ')}]. O usuário enviou ${extractedLinks.length} links que foram interceptados pelo sistema (substituídos por [LINK]). Identifique a matéria de destino. Retorne APENAS UM JSON: {"action": "BATCH_ADD", "subject": "NOME_DA_MATERIA"}. Se não souber, use "${subjects[0] || 'Geral'}". Não retorne mais nada.`;
      // Enviar apenas as primeiras 5 linhas do texto limpo para economizar tokens
      const lines = cleanedText.split('\n').filter(l => l.trim());
      finalPrompt = lines.slice(0, 5).join('\n') + (lines.length > 5 ? `\n... (${lines.length} linhas no total)` : '');
    } else {
      sys = `Admin Drive de Pobre. Materias: [${subjects.join(', ')}]. Ações disponíveis (JSON): {"action": "ADD_SUBJECT", "name": "N"}, {"action": "DELETE_SUBJECT", "name": "N"}, {"action": "ADD_MATERIAL", "title": "T", "subject": "S", "type": "video|pdf|link", "url": "U"}, {"action": "EDIT_MATERIAL", "title": "T", "subject": "S", "type": "video|pdf|link", "url": "U"}, {"action": "DELETE_MATERIAL", "title": "T"}, {"action": "CLEAR_SUBJECT", "subject": "S"}, {"action": "REORDER_VIDEOS", "subject": "S"}, {"action": "MOVE_ALL", "fromSubject": "S", "toSubject": "S"}. REGRAS: Se o link for do YouTube, use type: "video". Para EDIT/DELETE, informe o "title" exato baseado no prompt do usuário para localizar. A ação CLEAR_SUBJECT apaga todos os vídeos de uma matéria. A ação MOVE_ALL move todos os materiais de uma matéria para outra. A ação REORDER_VIDEOS ordena os vídeos de uma matéria extraindo os números do título. Para UMA ação responda com um único JSON. Para MÚLTIPLAS, use array JSON [...]. Nunca inclua texto fora do JSON.`;
    }

    try {
      const isOpenAICompat = aiConfig.provider === 'groq' || aiConfig.provider === 'openai';
      const openaiUrl = aiConfig.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const openaiModel = aiConfig.provider === 'groq'
        ? 'llama-3.3-70b-versatile'
        : (aiConfig.model || 'gpt-4o-mini');

      const res = await fetch(
        isOpenAICompat
          ? openaiUrl
          : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${aiConfig.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isOpenAICompat && { 'Authorization': `Bearer ${aiConfig.apiKey}` }),
          },
          body: JSON.stringify(
            isOpenAICompat
              ? { model: openaiModel, messages: [{ role: 'system', content: sys }, { role: 'user', content: finalPrompt }] }
              : { contents: [{ parts: [{ text: sys + '\n' + finalPrompt }] }] }
          ),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `Erro HTTP ${res.status}`);
      }

      const text = isOpenAICompat
        ? data?.choices?.[0]?.message?.content
        : data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join(' ');

      if (!text) {
        const blockReason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
        throw new Error(blockReason ? `Resposta bloqueada: ${blockReason}` : 'A IA nao retornou texto utilizavel.');
      }

      // Extrai JSON robustamente
      const parsed = extractJsonFromText(text);
      let actions: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed];

      // SAFETY: Se estamos em batch mode (links extraídos) mas a IA não retornou BATCH_ADD,
      // forçar BATCH_ADD para não perder as URLs reais
      if (isBatchMode && extractedLinks.length > 0) {
        const hasBatchAdd = actions.some(a => a.action === 'BATCH_ADD');
        if (!hasBatchAdd) {
          // Tenta extrair o subject da resposta da IA
          const aiSubject = actions[0]?.subject || actions[0]?.name || '';
          actions = [{ action: 'BATCH_ADD', subject: String(aiSubject || subjects[0] || 'Geral') }];
        }
      }

      // Aplica todas as ações em batch sobre snapshots locais
      let newMaterials = [...materials];
      let newSubjects = [...subjects];

      const subjectCountsBefore: Record<string, number> = {};
      materials.forEach(m => { subjectCountsBefore[m.subject] = (subjectCountsBefore[m.subject] || 0) + 1; });
      const deletedFilesIds = new Set<string>();

      for (const act of actions) {
        const findMaterialId = () => {
          if (act.id) return String(act.id);
          if (act.title) {
            const searchTitle = String(act.title).toLowerCase().trim();
            const found = newMaterials.find(m => m.title.toLowerCase().includes(searchTitle) || searchTitle.includes(m.title.toLowerCase()));
            return found?.id;
          }
          return undefined;
        };

        if (act.action === "ADD_SUBJECT") {
          newSubjects = mergeSubjects([...newSubjects, String(act.name || '')]);

        } else if (act.action === "BATCH_ADD") {
          const subject = String(act.subject || newSubjects[0] || '');
          // Auto-criar a matéria se não existir
          if (!newSubjects.some(s => s.toLowerCase() === subject.toLowerCase())) {
            newSubjects = mergeSubjects([...newSubjects, subject]);
          }
          const batchMaterials: Material[] = extractedLinks.map((link, idx) => ({
            id: `${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 8)}`,
            title: link.title,
            subject,
            type: isYouTubeUrl(link.url) ? 'video' : 'link',
            url: link.url
          }));
          newMaterials = [...newMaterials, ...batchMaterials];

        } else if (act.action === "DELETE_SUBJECT") {
          const subName = String(act.name || '').trim();
          const found = newSubjects.find(s => s.toLowerCase() === subName.toLowerCase());
          if (found) {
            newSubjects = newSubjects.filter(s => s !== found);
            // Delete all materials in this subject
            materials.filter(m => m.subject === found).forEach(m => deletedFilesIds.add(m.id));
          }

        } else if (act.action === "ADD_MATERIAL") {
          const url = String(act.url || '');
          // Bloquear materiais com URL placeholder [LINK]
          if (url === '[LINK]' || url === '' || url === 'undefined') continue;
          const type = isYouTubeUrl(url) ? 'video' : ((act.type as 'video' | 'pdf' | 'link') || 'video');
          const matSubject = String(act.subject || newSubjects[0] || '');
          // Auto-criar a matéria se não existir
          if (matSubject && !newSubjects.some(s => s.toLowerCase() === matSubject.toLowerCase())) {
            newSubjects = mergeSubjects([...newSubjects, matSubject]);
          }
          newMaterials = [...newMaterials, {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            title: String(act.title || ''),
            subject: matSubject,
            type,
            url,
          }];

        } else if (act.action === "EDIT_MATERIAL") {
          const materialId = findMaterialId();
          if (materialId) {
            const url = act.url ? String(act.url) : undefined;
            const type = url && isYouTubeUrl(url) ? 'video' : (act.type ? act.type as 'video' | 'pdf' | 'link' : undefined);

            newMaterials = newMaterials.map(m => m.id === materialId ? {
              ...m,
              ...(act.title ? { title: String(act.title) } : {}),
              ...(act.subject ? { subject: String(act.subject) } : {}),
              ...(type ? { type } : {}),
              ...(url ? { url } : {}),
            } : m);
          }

        } else if (act.action === "DELETE_MATERIAL") {
          const materialId = findMaterialId();
          if (materialId) {
            deletedFilesIds.add(materialId);
          }
        } else if (act.action === "CLEAR_SUBJECT") {
          const targetSubject = String(act.subject || '').toLowerCase();
          materials.filter(m => m.subject.toLowerCase() === targetSubject).forEach(m => deletedFilesIds.add(m.id));
        } else if (act.action === "MOVE_ALL") {
          const fromSub = String(act.fromSubject || '').toLowerCase();
          const toSub = String(act.toSubject || '');
          if (toSub && !newSubjects.some(s => s.toLowerCase() === toSub.toLowerCase())) {
            newSubjects = mergeSubjects([...newSubjects, toSub]);
          }
          const exactToSub = newSubjects.find(s => s.toLowerCase() === toSub.toLowerCase()) || toSub;
          newMaterials = newMaterials.map(m => m.subject.toLowerCase() === fromSub ? { ...m, subject: exactToSub } : m);
        } else if (act.action === "REORDER_VIDEOS") {
          const targetSubject = String(act.subject || '').toLowerCase();
          const subjectMats = newMaterials.filter(m => m.subject.toLowerCase() === targetSubject);
          const otherMats = newMaterials.filter(m => m.subject.toLowerCase() !== targetSubject);
          
          subjectMats.sort((a, b) => {
            const numA = parseInt(a.title.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.title.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
          });
          
          newMaterials = [...otherMats, ...subjectMats];
        }
      }

      // Efetiva a deleção dos arquivos
      for (const id of deletedFilesIds) {
        const materialToDelete = newMaterials.find(m => m.id === id);
        newMaterials = newMaterials.filter(m => m.id !== id);
        if (materialToDelete?.type === 'pdf' && materialToDelete.url) {
           fetch(`${API_URL}/delete-file`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ url: materialToDelete.url })
           }).catch(err => console.error('Erro ao deletar arquivo fisico:', err));
        }
      }

      // Commit do batch
      setMaterials(newMaterials);
      setSubjects(newSubjects);
      saveData(newMaterials, newSubjects, theme, themePresets);
      setAiPrompt('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro IA';
      alert(`Erro IA: ${message}`);
    } finally { setIsAiLoading(false); }
  };

  const isYouTubeUrl = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('youtube.com') || lower.includes('youtu.be');
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSubject, selectedType]);

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const api = (window as any).electronAPI;

  return (
    <div className="app-container">
      {/* Custom Title Bar */}
      <div className="titlebar">
        <div className="titlebar-drag">
          <img src={logo} alt="Logo" className="titlebar-logo" />
          <span className="titlebar-title">Drive de Pobre</span>
        </div>
        <div className="titlebar-controls">
          <button className="titlebar-btn titlebar-btn-minimize" onClick={() => api?.minimize()} aria-label="Minimizar">
            <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="2" rx="1" fill="currentColor"/></svg>
          </button>
          <button className="titlebar-btn titlebar-btn-maximize" onClick={() => api?.maximize()} aria-label="Maximizar">
            <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
          </button>
          <button className="titlebar-btn titlebar-btn-close" onClick={() => api?.close()} aria-label="Fechar">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <aside className="sidebar">
        <h2 className="nav-item" style={{ fontSize: '1.5rem', opacity: 1, cursor: 'default', gap: '0.5rem' }}>
          <img src={logo} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} /> 
          Drive de Pobre
        </h2>
        <div className={`nav-item ${selectedSubject === 'Todas' ? 'active' : ''}`} onClick={() => setSelectedSubject('Todas')}><Filter size={20} /> Todas</div>
        {subjects.map(s => ( <div key={s} className={`nav-item ${selectedSubject === s ? 'active' : ''}`} onClick={() => setSelectedSubject(s)}><Folder size={20} /> {s}</div> ))}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {isAdmin ? (
            <>
              <div className="nav-item" onClick={() => setShowAdminPanel(true)}>
                <Settings size={20} /> Painel de Controle
              </div>
              <div className="nav-item" onClick={() => { setIsAdmin(false); localStorage.removeItem('dp_admin'); }} style={{ color: '#ff4d4d' }}>
                <LogOut size={20} /> Sair do Admin
              </div>
            </>
          ) : (
            <div className="nav-item" onClick={() => setShowLogin(true)}>
              <Lock size={20} /> Acesso Admin
            </div>
          )}
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

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button 
              className="btn" 
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
              }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Anterior
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', background: 'var(--bg-card)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button 
              className="btn" 
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
              }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Próxima
            </button>
          </div>
        )}

        <div className="grid">
          {paginatedMaterials.map(m => (
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

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem', marginBottom: '2rem' }}>
            <button 
              className="btn" 
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Anterior
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', background: 'var(--bg-card)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button 
              className="btn" 
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Próxima
            </button>
          </div>
        )}
      </main>

      {/* MODAL CONFIGURAÇÕES */}
      {showAdminPanel && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Settings size={22} style={{ opacity: 0.8 }} />
                <h2 style={{ margin: 0 }}>Painel Admin</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {savedIndicator && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '0.3rem 0.8rem', borderRadius: '999px', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <Check size={13} /> Salvo
                  </span>
                )}
                <button className="modal-close" onClick={() => setShowAdminPanel(false)}><X size={20} /></button>
              </div>
            </div>

            {/* SEÇÃO: INTELIGÊNCIA ARTIFICIAL */}
            <div className="admin-section">
              <div className="admin-section-title">
                <Bot size={16} />
                <span>Inteligência Artificial</span>
              </div>
              <CustomSelect
                label="Provedor"
                value={aiConfig.provider}
                options={[
                  {value: 'groq', label: '⚡ Groq (Rápido)'},
                  {value: 'gemini', label: '✨ Gemini (Google)'},
                  {value: 'openai', label: '🤖 OpenAI (GPT)'},
                ]}
                onChange={val => {
                  const up = {...aiConfig, provider: val as 'groq' | 'gemini' | 'openai', model: val === 'openai' ? (aiConfig.model || 'gpt-4o-mini') : undefined};
                  setAiConfig(up);
                  localStorage.setItem('dp_ai_config', JSON.stringify(up));
                }}
              />
              {aiConfig.provider === 'openai' && (
                <CustomSelect
                  label="Modelo"
                  value={aiConfig.model || 'gpt-4o-mini'}
                  options={[
                    {value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido e barato)'},
                    {value: 'gpt-4o', label: 'GPT-4o (Mais capaz)'},
                    {value: 'gpt-4-turbo', label: 'GPT-4 Turbo'},
                    {value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Legado)'},
                  ]}
                  onChange={val => {
                    const up = {...aiConfig, model: val};
                    setAiConfig(up);
                    localStorage.setItem('dp_ai_config', JSON.stringify(up));
                  }}
                />
              )}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🔑 API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showApiKey ? 'text' : 'password'}
                    value={aiConfig.apiKey}
                    placeholder="Cole sua chave aqui..."
                    onChange={e => {
                      const up = {...aiConfig, apiKey: e.target.value};
                      setAiConfig(up);
                      localStorage.setItem('dp_ai_config', JSON.stringify(up));
                    }}
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, display: 'flex', alignItems: 'center' }}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {aiConfig.apiKey && (
                  <p style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Check size={12} /> Chave configurada
                  </p>
                )}
              </div>
            </div>

            {/* SEÇÃO: APARÊNCIA */}
            <div className="admin-section">
              <div className="admin-section-title">
                <Palette size={16} />
                <span>Aparência</span>
              </div>
              <div className="color-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                  { label: 'Cor Principal', key: 'primary' as const, val: theme.primary },
                  { label: 'Fundo', key: 'bgMain' as const, val: theme.bgMain },
                  { label: 'Cards', key: 'bgCard' as const, val: theme.bgCard },
                  { label: 'Texto', key: 'textMain' as const, val: theme.textMain },
                ].map(({ label, key, val }) => (
                  <div className="form-group" key={key} style={{ marginBottom: 0 }}>
                    <label className="form-label">{label}</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={val} onChange={e => updateTheme({ [key]: e.target.value })} />
                      <input
                        type="text"
                        value={val}
                        maxLength={7}
                        onChange={e => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateTheme({ [key]: v });
                        }}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', fontFamily: 'monospace', width: '80px', opacity: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', justifyContent: 'center' }} onClick={() => api?.zoomReset()}>
                   <Search size={16} /> Resetar Zoom (100%)
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label className="form-label" style={{ marginBottom: 0, opacity: 0.7, fontSize: '0.85rem' }}>Presets salvos</label>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setShowPresetModal(true)}>
                  <Plus size={13} /> Salvar Tema Atual
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {visibleThemePresets.map(p => (
                  <div key={p.id} className={`preset-tag ${theme.primary === p.config.primary && theme.bgMain === p.config.bgMain ? 'active' : ''}`} onClick={() => applyPreset(p)}>
                    <div style={{ width: 24, height: 24, borderRadius: '6px', background: `linear-gradient(135deg, ${p.config.primary}, ${p.config.bgMain})`, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem' }}>{p.name}</span>
                    {p.id !== DEFAULT_PRESET_ID && (
                      <Trash2 size={12} onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} style={{ opacity: 0.45, cursor: 'pointer', marginLeft: '0.2rem' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO: BACKUP */}
            <div className="admin-section">
              <div className="admin-section-title">
                <Database size={16} />
                <span>Backup do Drive</span>
              </div>

              {/* Filtro de matérias */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontSize: '0.82rem', opacity: 0.7 }}>Matérias a exportar</label>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', opacity: 0.55, color: 'var(--text-main)', textDecoration: 'underline', padding: 0 }}
                    onClick={() => setExportSubjects(activeExportSubjects.length === subjects.length ? [] : null)}
                  >
                    {activeExportSubjects.length === subjects.length ? 'Desmarcar todas' : 'Marcar todas'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {subjects.map(s => {
                    const checked = activeExportSubjects.includes(s);
                    return (
                      <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', padding: '0.3rem 0.75rem', borderRadius: '999px', border: `1px solid ${checked ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}`, background: checked ? 'rgba(99,102,241,0.15)' : 'transparent', transition: 'all 0.2s', userSelect: 'none' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleExportSubject(s)} style={{ accentColor: 'var(--primary)', width: '13px', height: '13px' }} />
                        {s}
                      </label>
                    );
                  })}
                  {subjects.length === 0 && <span style={{ fontSize: '0.8rem', opacity: 0.45, fontStyle: 'italic' }}>Nenhuma matéria cadastrada.</span>}
                </div>
              </div>

              {/* Filtro de presets */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={exportIncludePresets}
                    onChange={e => setExportIncludePresets(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                  />
                  <span style={{ opacity: 0.8 }}>Incluir presets de tema ({visibleThemePresets.length})</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  className="btn"
                  style={{ border: '1px solid var(--border)', background: 'transparent', flex: 1, opacity: activeExportSubjects.length === 0 ? 0.45 : 1 }}
                  onClick={exportDrive}
                  disabled={isExportingDrive || activeExportSubjects.length === 0}
                  title={activeExportSubjects.length === 0 ? 'Selecione ao menos uma matéria' : ''}
                >
                  <Download size={16} />{isExportingDrive ? 'Exportando...' : `Exportar Drive${activeExportSubjects.length < subjects.length ? ` (${activeExportSubjects.length}/${subjects.length})` : ''}`}
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => importDriveInputRef.current?.click()} disabled={isImportingDrive}>
                  <Upload size={16} />{isImportingDrive ? 'Importando...' : 'Importar Drive'}
                </button>
                <input ref={importDriveInputRef} type="file" accept=".zip,.json,.pdf" multiple onChange={importDrive} style={{ display: 'none' }} />
              </div>
            </div>

            {/* SEÇÃO: MATÉRIAS */}
            <div className="admin-section">
              <div className="admin-section-title">
                <BookOpen size={16} />
                <span>Gestão de Matérias</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <input
                  className="form-input"
                  placeholder="Nome da nova matéria..."
                  value={newSubjectName}
                  style={{ flex: 1, marginBottom: 0 }}
                  onChange={e => setNewSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubject()}
                />
                <button className="btn btn-primary" onClick={addSubject}>
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {subjects.length === 0 && (
                  <p style={{ fontSize: '0.85rem', opacity: 0.5, fontStyle: 'italic' }}>Nenhuma matéria cadastrada.</p>
                )}
                {subjects.map(s => (
                  <span key={s} className="tag" style={{ padding: '0.4rem 0.8rem', gap: '0.5rem' }}>
                    {s}
                    <button
                      onClick={() => removeSubject(s)}
                      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', lineHeight: 1 }}
                      title={`Remover ${s}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* SEÇÃO: SEGURANÇA */}
            <div className="admin-section" style={{ marginBottom: 0 }}>
              <div className="admin-section-title">
                <Lock size={16} />
                <span>Segurança</span>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Nova senha de administrador..."
                  value={newPasswordInput}
                  style={{ flex: 1, marginBottom: 0 }}
                  onChange={e => setNewPasswordInput(e.target.value)}
                />
                <button className="btn btn-primary" onClick={changePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </button>
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
            <div className="form-group"><label>Senha</label><input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && (password === storedPassword ? (setIsAdmin(true), localStorage.setItem('dp_admin', 'true'), setShowLogin(false), setPassword('')) : alert('Senha incorreta!'))} /></div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => password === storedPassword ? (setIsAdmin(true), localStorage.setItem('dp_admin', 'true'), setShowLogin(false), setPassword('')) : alert('Senha incorreta!')}>Entrar</button>
          </div>
        </div>
      )}

      {/* MODAL NOVO MATERIAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'var(--primary)', borderRadius: '10px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} style={{ color: 'white' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Novo Material</h2>
              </div>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setFormErrors({}); }}><X size={20} /></button>
            </div>

            {/* TÍTULO */}
            <div className="form-group">
              <label className="form-label">Título</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input
                  className="form-input"
                  placeholder="Nome do material..."
                  value={newMaterial.title}
                  style={{ paddingLeft: '2.5rem', borderColor: formErrors.title ? '#ef4444' : undefined }}
                  onChange={e => { setNewMaterial({...newMaterial, title: e.target.value}); if (formErrors.title) setFormErrors(p => ({...p, title: undefined})); }}
                />
              </div>
              {formErrors.title && (
                <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {formErrors.title}
                </p>
              )}
            </div>

            {/* MATÉRIA */}
            <div style={{ marginBottom: '1.5rem' }}>
              <CustomSelect
                label="Matéria"
                value={newMaterial.subject}
                options={subjects.map(s => ({ value: s, label: s }))}
                onChange={val => setNewMaterial({...newMaterial, subject: val})}
              />
            </div>

            {/* TIPO - CARD PICKER */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Tipo</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {([
                  { value: 'video', label: 'Vídeo', icon: <Video size={24} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
                  { value: 'pdf', label: 'PDF', icon: <BookOpen size={24} />, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)' },
                  { value: 'link', label: 'Link', icon: <Globe size={24} />, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewMaterial({...newMaterial, type: opt.value})}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '1rem 0.5rem',
                      borderRadius: '1rem',
                      border: `2px solid ${newMaterial.type === opt.value ? opt.border : 'var(--border)'}`,
                      background: newMaterial.type === opt.value ? opt.bg : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: newMaterial.type === opt.value ? opt.color : 'inherit',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: newMaterial.type === opt.value ? opt.bg : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${newMaterial.type === opt.value ? opt.border : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: newMaterial.type === opt.value ? opt.color : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.2s',
                    }}>
                      {opt.icon}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: newMaterial.type === opt.value ? 1 : 0.5 }}>{opt.label}</span>
                    {newMaterial.type === opt.value && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* LINK / URL */}
            <div className="form-group">
              <label className="form-label">
                {newMaterial.type === 'pdf' ? 'Arquivo PDF ou Link' : 'Link / URL'}
              </label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Link2 size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', borderColor: formErrors.url ? '#ef4444' : undefined }}
                    placeholder={newMaterial.type === 'pdf' ? 'Cole o link ou use o botão →' : newMaterial.type === 'link' ? 'https://site.com' : 'https://youtube.com/watch?v=...'}
                    value={newMaterial.url}
                    onChange={e => { setNewMaterial({...newMaterial, url: e.target.value}); if (formErrors.url) setFormErrors(p => ({...p, url: undefined})); }}
                  />
                </div>
                {newMaterial.type === 'pdf' && (
                  <label
                    className="btn btn-primary"
                    style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                    title="Enviar arquivo PDF"
                  >
                    {isUploading ? (
                      <span style={{ opacity: 0.7 }}>Enviando...</span>
                    ) : (
                      <><Upload size={16} /> Upload</>
                    )}
                    <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
                  </label>
                )}
              </div>
              {formErrors.url && (
                <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {formErrors.url}
                </p>
              )}
              {isUploading && !formErrors.url && (
                <p style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '0.4rem' }}>Enviando arquivo para o servidor...</p>
              )}
              {newMaterial.url && newMaterial.type === 'pdf' && !isUploading && (
                <p style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Check size={12} /> Arquivo pronto
                </p>
              )}
            </div>

            {/* BOTÃO */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem', marginTop: '0.5rem' }}
              onClick={addMaterial}
              disabled={isUploading}
            >
              <Plus size={18} />
              Adicionar Material
            </button>
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
              (() => {
                const embedUrl = getEmbedUrl(playingMaterial.url);
                const isYoutube = embedUrl.includes('youtube.com/embed/');
                return isYoutube ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: 'black', borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <iframe src={embedUrl} frameBorder="0" allowFullScreen allow="autoplay" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></iframe>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem', background: 'rgba(0,0,0,0.3)', borderRadius: '1.5rem', minHeight: '200px', textAlign: 'center' }}>
                    <Video size={48} style={{ opacity: 0.35 }} />
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', margin: 0 }}>
                      URL inválida ou não reconhecida como YouTube.<br />
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', opacity: 0.5, wordBreak: 'break-all' }}>{playingMaterial.url || '(vazio)'}</span>
                    </p>
                    {playingMaterial.url && (
                      <a href={playingMaterial.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
                        Abrir link externo
                      </a>
                    )}
                  </div>
                );
              })()
            ) : (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '1.5rem', overflow: 'hidden', minHeight: '70vh' }}>
                <iframe src={playingMaterial.url} frameBorder="0" style={{ width: '100%', height: '70vh' }}></iframe>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SALVAR PRESET */}
      {showPresetModal && (
        <div className="modal-overlay" onClick={() => setShowPresetModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Salvar Preset</h2>
              <button className="modal-close" onClick={() => setShowPresetModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Nome do Preset</label>
              <input
                className="form-input"
                placeholder="Ex: Tema Escuro Azul"
                value={presetNameInput}
                onChange={e => setPresetNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') savePreset(); }}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={savePreset}>
              <Check size={16} /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)} style={{ zIndex: 9999 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{
            maxWidth: '380px',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            background: 'var(--theme-bg-card)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            borderRadius: '16px'
          }}>
            <div style={{ marginBottom: '1.5rem', color: '#e74c3c', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(231, 76, 60, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <AlertTriangle size={42} strokeWidth={1.5} />
              </div>
            </div>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--theme-text)', fontSize: '1.25rem', fontWeight: 600 }}>Tem certeza?</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text)', border: '1px solid rgba(255,255,255,0.1)' }} 
                onClick={() => setConfirmDialog(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: '#e74c3c', color: '#fff', border: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(231, 76, 60, 0.3)' }} 
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
