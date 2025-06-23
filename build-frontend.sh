#!/bin/bash

echo "Building React frontend..."

# フロントエンドディレクトリに移動
cd frontend

# 依存関係をインストール
echo "Installing dependencies..."
npm install

# 本番用ビルド
echo "Building for production..."
npm run build

echo "Frontend build completed!"
echo "Files are available in frontend/dist/"
