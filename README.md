# Drive de Pobre (Versão Full-Stack) 🚀

Este é um gerenciador de materiais de estudo dinâmico e inteligente. Organize seus cursos, vídeos, PDFs e links de forma personalizada com auxílio de IA e uma interface moderna.

## ✨ Principais Funcionalidades

*   **🤖 Agente de IA Admin:** Adicione, edite ou remova conteúdos usando linguagem natural através da integração com Gemini ou Groq.
*   **🎨 Personalização Total:** Altere cores do sistema em tempo real e salve seus próprios presets de temas.
*   **📂 Gestão de Materiais:** 
    *   **Vídeos:** Suporte a links do YouTube com visualização direta no player interno.
    *   **PDFs:** Upload local de arquivos ou uso de links externos.
    *   **Links:** Atalhos rápidos para sites e referências externas.
*   **💾 Persistência Híbrida:** Os dados são salvos no servidor (`database.json`) com fallback e cache no `localStorage` do navegador.
*   **📤 Exportar/Importar Drive:** Gere um backup completo do seu drive (incluindo os arquivos PDF físicos) para mover entre diferentes máquinas ou instâncias.
*   **🔐 Área Administrativa:** Painel protegido para gestão de matérias, temas e configurações de IA.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, Vite, TypeScript, Lucide Icons.
- **Backend:** Node.js, Express, Multer (Upload de arquivos).
- **IA:** Integração com APIs do Google Gemini e Groq.

## 🚀 Como rodar o projeto

### 1. Requisitos
*   [Node.js](https://nodejs.org/) instalado.

### 2. Instalação
No diretório raiz do projeto:
```bash
npm install
cd frontend
npm install
cd ..
```

### 3. Execução
Para rodar o sistema completo, você precisará de dois terminais:

**Terminal 1 (Servidor Backend):**
```bash
node server.js
```
*O servidor rodará em `http://localhost:3001`.*

**Terminal 2 (Frontend Vite):**
```bash
cd frontend
npm run dev
```
*Acesse o link que aparecerá no terminal (geralmente `http://localhost:5173`).*

---

## 🔐 Área do Administrador

Para acessar as configurações e o Agente de IA:
*   **Botão:** "Área Admin" no final do menu lateral.
*   **Senha padrão:** `admin`

## 📁 Estrutura de Arquivos

*   `server.js`: Servidor principal e API.
*   `database.json`: Banco de dados principal (materiais e temas).
*   `uploads/pdfs`: Armazenamento físico dos arquivos PDF enviados.
*   `frontend/`: Código fonte da interface React.
*   `exports/`: Pasta temporária para geração de backups do drive.

---
