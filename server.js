const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const FRONTEND_DIST = path.join(__dirname, 'frontend/dist');
const DB_FILE = path.join(__dirname, 'database.json');
const PDF_DIR = path.join(__dirname, 'uploads/pdfs');
const EXPORTS_DIR = path.join(__dirname, 'exports');
const GENERAL_LINKS_DIR = path.join(__dirname, 'uploads/links-gerais');
const VIDEO_LINKS_DIR = path.join(__dirname, 'uploads/links-video');
const GENERAL_LINKS_FILE = path.join(GENERAL_LINKS_DIR, 'links.json');
const VIDEO_LINKS_FILE = path.join(VIDEO_LINKS_DIR, 'links.json');
const SYSTEM_SUBJECTS = ['Matemática', 'Física', 'Química'];
const DEFAULT_DATA = {
  materials: [],
  subjects: SYSTEM_SUBJECTS,
  theme: {
    primary: '#6366f1',
    bgMain: '#0f172a',
    bgCard: '#1e293b',
    textMain: '#f8fafc'
  },
  themePresets: []
};

app.use(cors());
app.use(express.json({ limit: '50mb' }));

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`Erro ao ler ${file}:`, error);
    return fallback;
  }
}

function writeJsonFile(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function normalizeSubjects(subjects) {
  return Array.from(new Set([...SYSTEM_SUBJECTS, ...((subjects || []).filter(Boolean))]));
}

function copyIfExists(source, destination) {
  if (!fs.existsSync(source)) return;
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function getStoredPdfNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('/files/')) return null;
    return decodeURIComponent(parsed.pathname.replace('/files/', ''));
  } catch {
    return null;
  }
}

function buildMaterialId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

// Configuração de armazenamento dos PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(PDF_DIR);
    cb(null, PDF_DIR);
  },
  filename: (req, file, cb) => {
    // Remove espaços e caracteres especiais para evitar erro no link
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({ storage });
const importUpload = multer({ storage: multer.memoryStorage() });

// Serve os arquivos da pasta uploads
app.use('/files', express.static(PDF_DIR));
app.use('/api/files', express.static(PDF_DIR));

function readDatabase() {
  const baseData = { ...DEFAULT_DATA, ...readJsonFile(DB_FILE, DEFAULT_DATA) };
  const generalLinks = readJsonFile(GENERAL_LINKS_FILE, []);
  const videoLinks = readJsonFile(VIDEO_LINKS_FILE, []);

  return {
    ...baseData,
    subjects: normalizeSubjects(baseData.subjects),
    materials: [...(baseData.materials || []), ...generalLinks, ...videoLinks],
  };
}

function saveDatabase(data) {
  const materials = Array.isArray(data.materials) ? data.materials : [];
  const generalLinks = materials.filter((item) => item.type === 'link');
  const videoLinks = materials.filter((item) => item.type === 'video');
  const remainingMaterials = materials.filter((item) => item.type !== 'link' && item.type !== 'video');

  writeJsonFile(GENERAL_LINKS_FILE, generalLinks);
  writeJsonFile(VIDEO_LINKS_FILE, videoLinks);
  writeJsonFile(DB_FILE, {
    ...DEFAULT_DATA,
    ...data,
    subjects: normalizeSubjects(data.subjects),
    materials: remainingMaterials,
  });
}

function getFileBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// Rota para Upload
function handleUpload(req, res) {
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  const fileUrl = `${getFileBaseUrl(req)}/files/${req.file.filename}`;
  res.json({ url: fileUrl });
}

app.post('/upload', upload.single('pdf'), handleUpload);
app.post('/api/upload', upload.single('pdf'), handleUpload);

function handleGetMaterials(req, res) {
  res.json(readDatabase());
}

function handleSave(req, res) {
  saveDatabase(req.body);
  res.send('Salvo com sucesso');
}

function handleExportDrive(req, res) {
  const data = readDatabase();
  const exportId = `drive-export-${Date.now()}`;
  const exportDir = path.join(EXPORTS_DIR, exportId);
  const pdfExportDir = path.join(exportDir, 'pdfs');

  ensureDir(exportDir);

  const exportMaterials = data.materials.map((material) => {
    if (material.type !== 'pdf') {
      return material;
    }

    const storedPdfName = getStoredPdfNameFromUrl(material.url);
    if (!storedPdfName) {
      return material;
    }

    copyIfExists(path.join(PDF_DIR, storedPdfName), path.join(pdfExportDir, storedPdfName));

    return {
      ...material,
      exportFile: `pdfs/${storedPdfName}`,
    };
  });

  writeJsonFile(path.join(exportDir, 'drive.json'), {
    exportedAt: new Date().toISOString(),
    subjects: data.subjects,
    theme: data.theme,
    themePresets: data.themePresets,
    materials: exportMaterials,
  });

  res.json({
    ok: true,
    exportId,
    folder: exportDir,
    downloadUrl: `/exports/${exportId}/drive.json`,
    hasPdfs: exportMaterials.some((item) => item.type === 'pdf'),
  });
}

function handleImportDrive(req, res) {
  const files = Array.isArray(req.files) ? req.files : [];
  const jsonFile = files.find((file) => file.originalname.toLowerCase().endsWith('.json'));

  if (!jsonFile) {
    return res.status(400).json({ error: 'Envie um arquivo JSON do drive.' });
  }

  let imported;
  try {
    imported = JSON.parse(jsonFile.buffer.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'JSON do drive inválido.' });
  }

  const current = readDatabase();
  const pdfFilesByName = new Map(files.map((file) => [file.originalname, file]));
  const importedMaterials = Array.isArray(imported.materials) ? imported.materials.map((material) => {
    const baseMaterial = {
      ...material,
      id: material.id || buildMaterialId(),
    };

    if (material.type !== 'pdf' || !material.exportFile) {
      return baseMaterial;
    }

    const exportedPdfName = path.basename(material.exportFile);
    const uploadedPdf = pdfFilesByName.get(exportedPdfName);

    if (!uploadedPdf) {
      return baseMaterial;
    }

    ensureDir(PDF_DIR);
    const storedPdfName = `${Date.now()}-${uploadedPdf.originalname.replace(/\s+/g, '_')}`;
    fs.writeFileSync(path.join(PDF_DIR, storedPdfName), uploadedPdf.buffer);

    return {
      ...baseMaterial,
      url: `${getFileBaseUrl(req)}/files/${storedPdfName}`,
    };
  }) : [];

  const merged = {
    materials: [...current.materials, ...importedMaterials],
    subjects: normalizeSubjects([...(current.subjects || []), ...((imported.subjects || []).filter(Boolean))]),
    theme: current.theme,
    themePresets: Array.isArray(imported.themePresets) ? [...(current.themePresets || []), ...imported.themePresets] : current.themePresets,
  };

  saveDatabase(merged);
  res.json({ ok: true, importedCount: importedMaterials.length });
}

app.get('/materials', handleGetMaterials);
app.get('/api/materials', handleGetMaterials);
app.post('/save', handleSave);
app.post('/api/save', handleSave);
app.post('/api/export-drive', handleExportDrive);
app.post('/api/import-drive', importUpload.any(), handleImportDrive);
app.use('/exports', express.static(EXPORTS_DIR));

if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/files/')) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor de arquivos rodando em http://localhost:${PORT}`);
  console.log(`📂 PDFs serão salvos em: ${path.join(__dirname, 'uploads/pdfs')}`);
});
