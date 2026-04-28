const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const AdmZip = require('adm-zip');

const app = express();
const PORT = 3001;

// FRONTEND_DIST is static, so it stays in __dirname (inside app.asar)
const FRONTEND_DIST = path.join(__dirname, 'frontend/dist');

// Mutable paths must use USER_DATA_PATH when running via Electron, to avoid read-only errors
const basePath = process.env.USER_DATA_PATH || __dirname;
const DB_FILE = path.join(basePath, 'database.json');
const PDF_DIR = path.join(basePath, 'uploads/pdfs');
const EXPORTS_DIR = path.join(basePath, 'exports');
const GENERAL_LINKS_DIR = path.join(basePath, 'uploads/links-gerais');
const VIDEO_LINKS_DIR = path.join(basePath, 'uploads/links-video');
const GENERAL_LINKS_FILE = path.join(GENERAL_LINKS_DIR, 'links.json');
const VIDEO_LINKS_FILE = path.join(VIDEO_LINKS_DIR, 'links.json');
const DEFAULT_DATA = {
  materials: [],
  subjects: ['Matemática', 'Física', 'Química'],
  password: 'admin',
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
  return Array.from(new Set((subjects || []).filter(Boolean)));
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
app.use('/files', (req, res) => res.status(404).send('Arquivo PDF não encontrado.'));
app.use('/api/files', (req, res) => res.status(404).send('Arquivo PDF não encontrado.'));

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

function handleDeleteFile(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).send('URL não informada.');
  
  const filename = getStoredPdfNameFromUrl(url);
  if (!filename) return res.status(400).send('Nome de arquivo inválido.');

  const filePath = path.join(PDF_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return res.json({ ok: true, message: 'Arquivo deletado.' });
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
      return res.status(500).send('Erro ao deletar arquivo.');
    }
  }
  res.json({ ok: true, message: 'Arquivo não encontrado no disco.' });
}

app.post('/api/delete-file', handleDeleteFile);

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

  // Filtros recebidos do frontend
  const filterSubjects = Array.isArray(req.body?.filterSubjects) ? req.body.filterSubjects : null;
  const includePresets = req.body?.includePresets !== false; // default true

  // Filtra materiais pelas matérias selecionadas
  const materialsToExport = filterSubjects
    ? data.materials.filter((m) => filterSubjects.includes(m.subject))
    : data.materials;

  // Filtra subjects exportadas também
  const subjectsToExport = filterSubjects
    ? data.subjects.filter((s) => filterSubjects.includes(s))
    : data.subjects;

  const exportMaterials = materialsToExport.map((material) => {
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
    subjects: subjectsToExport,
    theme: data.theme,
    themePresets: includePresets ? data.themePresets : [],
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
  const zipFile = files.find((file) => file.originalname.toLowerCase().endsWith('.zip'));
  let jsonFile = files.find((file) => file.originalname.toLowerCase().endsWith('.json'));
  let pdfFilesByName = new Map();

  if (zipFile) {
    try {
      const zip = new AdmZip(zipFile.buffer);
      const zipEntries = zip.getEntries();
      
      const jsonEntry = zipEntries.find(e => e.entryName === 'drive.json');
      if (jsonEntry) {
        jsonFile = { buffer: jsonEntry.getData() };
      }
      
      zipEntries.forEach(e => {
        if (!e.isDirectory && e.entryName.startsWith('pdfs/')) {
          pdfFilesByName.set(path.basename(e.entryName), {
            originalname: path.basename(e.entryName),
            buffer: e.getData()
          });
        }
      });
    } catch (err) {
      return res.status(400).json({ error: 'Falha ao ler o arquivo ZIP.' });
    }
  } else {
    pdfFilesByName = new Map(files.map((file) => [file.originalname, file]));
  }

  if (!jsonFile) {
    return res.status(400).json({ error: 'Envie um arquivo ZIP do drive ou um arquivo JSON.' });
  }

  let imported;
  try {
    imported = JSON.parse(jsonFile.buffer.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'JSON do drive inválido.' });
  }

  const current = readDatabase();
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

function handleExportDriveZip(req, res) {
  const data = readDatabase();

  // Filtros
  const filterSubjects = Array.isArray(req.body?.filterSubjects) ? req.body.filterSubjects : null;
  const includePresets = req.body?.includePresets !== false;

  const materialsToExport = filterSubjects
    ? data.materials.filter((m) => filterSubjects.includes(m.subject))
    : data.materials;

  const subjectsToExport = filterSubjects
    ? data.subjects.filter((s) => filterSubjects.includes(s))
    : data.subjects;

  // Monta o JSON do drive (sem exportFile, pois no ZIP os PDFs ficam em pdfs/)
  const driveJson = {
    exportedAt: new Date().toISOString(),
    subjects: subjectsToExport,
    theme: data.theme,
    themePresets: includePresets ? data.themePresets : [],
    materials: materialsToExport.map((m) => {
      if (m.type !== 'pdf') return m;
      const storedName = getStoredPdfNameFromUrl(m.url);
      return storedName ? { ...m, exportFile: `pdfs/${storedName}` } : m;
    }),
  };

  const filename = `drive-export-${Date.now()}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => {
    console.error('Erro ao gerar ZIP:', err);
    if (!res.headersSent) res.status(500).send('Erro ao gerar ZIP.');
  });

  archive.pipe(res);

  // Adiciona o drive.json ao ZIP
  archive.append(JSON.stringify(driveJson, null, 2), { name: 'drive.json' });

  // Adiciona os PDFs ao ZIP (dentro de pdfs/)
  for (const material of materialsToExport) {
    if (material.type !== 'pdf') continue;
    const storedName = getStoredPdfNameFromUrl(material.url);
    if (!storedName) continue;
    const filePath = path.join(PDF_DIR, storedName);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: `pdfs/${storedName}` });
    }
  }

  archive.finalize();
}

app.get('/materials', handleGetMaterials);
app.get('/api/materials', handleGetMaterials);
app.post('/save', handleSave);
app.post('/api/save', handleSave);
app.post('/api/export-drive', handleExportDrive);
app.post('/api/export-drive-zip', handleExportDriveZip);
app.post('/api/change-password', (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).send('Nova senha não informada.');
  
  const data = readDatabase();
  data.password = newPassword;
  saveDatabase(data);
  res.json({ ok: true, message: 'Senha alterada com sucesso.' });
});
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
