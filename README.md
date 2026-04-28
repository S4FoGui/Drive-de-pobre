# Drive de Pobre 🚀

> Gerenciador de materiais de estudo com interface estilo Discord — agora como aplicativo desktop nativo para Linux e Windows.

[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-blue?style=flat-square)](#-downloads)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Made with](https://img.shields.io/badge/stack-React%20%2B%20Express-61DAFB?style=flat-square&logo=react)](https://react.dev/)

---

## 📥 Downloads

Baixe o instalador pronto para o seu sistema:

| Sistema | Arquivo | Notas |
|---|---|---|
| 🐧 **Linux** (Debian/Arch/Ubuntu) | `Drive de Pobre-1.0.0.AppImage` | Não precisa instalar, só executar |
| 🪟 **Windows** | `Drive de Pobre Setup 1.0.0.exe` | Instalador padrão NSIS |

---

## ✨ Principais Funcionalidades

- **🤖 Agente de IA Admin** — Adicione, edite ou remova conteúdos usando linguagem natural via Gemini ou Groq.
- **🎨 Personalização Total** — Altere cores do sistema em tempo real e salve presets de temas.
- **📂 Gestão de Materiais:**
  - **Vídeos:** Links do YouTube com player interno.
  - **PDFs:** Upload local ou links externos.
  - **Links:** Atalhos rápidos para referências externas.
- **💾 Dados Locais** — Tudo salvo localmente na máquina do usuário (sem nuvem, sem conta).
- **📤 Exportar/Importar Drive** — Gere backups completos do seu drive incluindo PDFs físicos.
- **🔐 Área Administrativa** — Painel protegido para gestão de matérias, temas e IA.

---

## 🖥️ Usando o App (Desktop)

### Linux (AppImage)

Você pode rodar o arquivo diretamente ou integrá-lo ao seu sistema (menu de aplicativos) usando o script automatizado:

**Instalação Automática (Menu de Apps):**
```bash
# O script configura o ícone, move o app para ~/Applications e cria o atalho
./install.sh
```

**Desinstalação:**
```bash
# Remove o atalho do menu e os arquivos do sistema
./uninstall.sh
```

**Execução Manual:**
```bash
chmod +x "Drive de Pobre-1.0.0.AppImage"
./"Drive de Pobre-1.0.0.AppImage"
```

### Windows

Execute o arquivo `Drive de Pobre Setup 1.0.0.exe` e siga o instalador. O app abrirá automaticamente após a instalação.

> **Nota:** Os dados (banco de dados e uploads) são salvos na pasta de dados do usuário do sistema operacional — eles persistem entre atualizações do app.

---

## 🛠️ Tecnologias

| Camada | Stack |
|---|---|
| Desktop Shell | Electron 41 |
| Frontend | React + Vite + TypeScript + Lucide Icons |
| Backend | Node.js + Express + Multer |
| IA | Google Gemini API + Groq API |
| Build | electron-builder (AppImage + NSIS) |

---

## 🔧 Desenvolvimento Local

### Requisitos
- [Node.js](https://nodejs.org/) 18+

### Instalação
```bash
# Na raiz do projeto
npm install

# No frontend
cd frontend && npm install && cd ..
```

### Rodando em modo web (sem Electron)

**Terminal 1 — Backend:**
```bash
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Acesse `http://localhost:5173`.

### Rodando como app Electron

```bash
npm start
```

---

## 📦 Build de Produção

```bash
# Linux (.AppImage)
npm run build:linux

# Windows (.exe) — requer wine32 no Linux
npm run build:windows
```

Os arquivos gerados ficam na raiz do projeto.

---

## 🔐 Área do Administrador

- **Botão:** "Área Admin" no final do menu lateral.
- **Senha padrão:** `admin` (pode ser alterada no Painel Admin > Segurança).

---

## 📁 Estrutura do Projeto

```
.
├── main.js              # Entry point do Electron
├── server.js            # API Express (backend)
├── install.sh           # Script de instalação para Linux (AppImage)
├── uninstall.sh         # Script de desinstalação para Linux
├── frontend/            # Interface React (Vite)
├── database.json        # Banco de dados local (dev)
├── uploads/             # PDFs enviados (dev)
├── exports/             # Backups gerados (dev)
└── scratch/             # Scripts utilitários e testes
```

> Em produção (app empacotado), `database.json` e `uploads/` são salvos na pasta de dados do usuário do SO, não dentro do `.asar`.
