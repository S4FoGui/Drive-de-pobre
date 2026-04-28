#!/bin/bash

# HDIMA Development Protocol - Installation Script
# Task: Automate AppImage installation for "Drive de Pobre"

APP_NAME="Drive de Pobre"
APP_DIR="$HOME/Applications/DriveDePobre"
DESKTOP_FILE="$HOME/.local/share/applications/drive-de-pobre.desktop"

# 1. Identify files
APPIMAGE_FILE=$(ls *.AppImage | head -n 1)
ICON_FILE="assets/icon.png"

if [ -z "$APPIMAGE_FILE" ]; then
    echo "❌ Erro: Nenhum arquivo .AppImage encontrado nesta pasta."
    exit 1
fi

echo "🚀 Iniciando instalação de $APP_NAME..."

# 2. Prepare destination
echo "📂 Preparando diretório em $APP_DIR..."
mkdir -p "$APP_DIR"

# 3. Move files (to keep them safe)
echo "📦 Copiando arquivos..."
cp "$APPIMAGE_FILE" "$APP_DIR/drive-de-pobre.AppImage"
chmod +x "$APP_DIR/drive-de-pobre.AppImage"

if [ -f "$ICON_FILE" ]; then
    cp "$ICON_FILE" "$APP_DIR/icon.png"
    ICON_PATH="$APP_DIR/icon.png"
else
    echo "⚠️ Aviso: Ícone não encontrado em $ICON_FILE. Usando ícone padrão."
    ICON_PATH="system-run"
fi

# 4. Create Desktop Entry
echo "📝 Criando atalho no menu de aplicativos..."
cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=$APP_NAME
Exec="$APP_DIR/drive-de-pobre.AppImage"
Icon=$ICON_PATH
Type=Application
Categories=Utility;
Terminal=false
Comment=Gerenciador de Mídia Drive de Pobre
EOF

update-desktop-database ~/.local/share/applications/ 2>/dev/null

echo "✅ Instalação concluída com sucesso!"
echo "💡 Agora você pode pesquisar por '$APP_NAME' no seu menu de aplicativos."
