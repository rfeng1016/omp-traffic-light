#!/bin/zsh
set -e

cd "$(dirname "$0")"
TARGET_DIR="$HOME/.omp/bin"

mkdir -p "$TARGET_DIR"
ln -sf "$PWD/omp-light" "$TARGET_DIR/omp-light"
ln -sf "$PWD/omp-light-run" "$TARGET_DIR/omp-light-run"

# 安装 omp 扩展（事件钩子）
EXTENSIONS_DIR="$HOME/.omp/agent/extensions"
mkdir -p "$EXTENSIONS_DIR"
ln -sf "$PWD/omp-light-extension.ts" "$EXTENSIONS_DIR/omp-light-extension.ts"

echo "已接入："
echo "$TARGET_DIR/omp-light"
echo "$TARGET_DIR/omp-light-run"
echo "$EXTENSIONS_DIR/omp-light-extension.ts"
echo ""
echo "如果命令找不到，把这行加入 ~/.zshrc："
echo "export PATH=\"\$HOME/.omp/bin:\$PATH\""
