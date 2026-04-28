#!/bin/bash

# HDIMA Development Protocol - Uninstallation Script
# Task: Remove "Drive de Pobre" from the system

APP_NAME="Drive de Pobre"
APP_DIR="$HOME/Applications/DriveDePobre"
DESKTOP_FILE="$HOME/.local/share/applications/drive-de-pobre.desktop"
DATA_DIR="$HOME/.config/drive-de-pobre"

echo "🗑️  Iniciando desinstalação de $APP_NAME..."

# 1. Remover atalho do menu
if [ -f "$DESKTOP_FILE" ]; then
    echo "📝 Removendo atalho do menu..."
    rm "$DESKTOP_FILE"
    update-desktop-database ~/.local/share/applications/ 2>/dev/null
else
    echo "ℹ️  Atalho do menu não encontrado."
fi

# 2. Remover diretório da aplicação
if [ -d "$APP_DIR" ]; then
    echo "📂 Removendo arquivos do programa em $APP_DIR..."
    rm -rf "$APP_DIR"
else
    echo "ℹ️  Pasta do programa não encontrada."
fi

# 3. Perguntar sobre dados do usuário
echo ""
read -p "❓ Deseja apagar também os dados salvos (banco de dados e temas) em $DATA_DIR? (s/N): " response
if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
    if [ -d "$DATA_DIR" ]; then
        echo "🧹 Removendo dados do usuário..."
        rm -rf "$DATA_DIR"
    else
        echo "ℹ️  Pasta de dados não encontrada."
    fi
else
    echo "💾 Dados do usuário preservados em $DATA_DIR."
fi

echo ""
echo "✅ Desinstalação concluída!"
