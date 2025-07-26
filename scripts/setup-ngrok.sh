#!/bin/bash

# ngrokのセットアップスクリプト

echo "📱 スマホからアクセスできるようにngrokをセットアップします"

# ngrokがインストールされているか確認
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrokがインストールされていません"
    echo "📥 インストール方法:"
    echo ""
    echo "Mac (Homebrew):"
    echo "  brew install ngrok"
    echo ""
    echo "その他:"
    echo "  https://ngrok.com/download からダウンロード"
    echo ""
    exit 1
fi

echo "✅ ngrokがインストールされています"
echo ""
echo "🚀 ngrokを起動します..."
echo "起動後、表示されるURLをスマホで開いてください"
echo ""
echo "例: https://abc123.ngrok.io"
echo ""

# Next.jsサーバーとngrokを起動
ngrok http 3000