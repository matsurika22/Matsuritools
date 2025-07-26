#!/bin/bash

# Google Sheets連携の環境変数設定スクリプト
# このファイルをコピーして setup-sheets.sh として使用してください

echo "🔧 Google Sheets連携の環境変数を設定します"
echo ""

# 現在の.env.localの内容を確認
if [ -f ".env.local" ]; then
    echo "✅ .env.local ファイルが見つかりました"
else
    echo "❌ .env.local ファイルが見つかりません"
    echo "まず Supabase の設定を完了してください"
    exit 1
fi

echo ""
echo "📋 以下の情報が必要です："
echo "1. Google Cloud Platform のプロジェクトID"
echo "2. Googleスプレッドシートのシート ID" 
echo "3. サービスアカウントのJSONキーファイル"
echo ""

# プロジェクトIDの入力
read -p "Google Cloud Project ID を入力してください: " PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    echo "❌ プロジェクトIDが入力されていません"
    exit 1
fi

# スプレッドシートIDの入力
read -p "Google Sheets ID を入力してください: " SHEETS_ID
if [ -z "$SHEETS_ID" ]; then
    echo "❌ スプレッドシートIDが入力されていません"
    exit 1
fi

# サービスアカウントキーファイルの確認
SERVICE_ACCOUNT_FILE="service-account-key.json"
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ $SERVICE_ACCOUNT_FILE が見つかりません"
    echo "ダウンロードしたJSONファイルを '$SERVICE_ACCOUNT_FILE' という名前でこのフォルダに配置してください"
    exit 1
fi

echo "✅ サービスアカウントキーファイルが見つかりました"

# JSONキーを1行に変換（改行とスペースを除去）
JSON_KEY=$(cat "$SERVICE_ACCOUNT_FILE" | tr -d '\n' | tr -s ' ')

# .env.localに追記
echo "" >> .env.local
echo "# Google Sheets Integration" >> .env.local
echo "GOOGLE_SHEETS_ID=$SHEETS_ID" >> .env.local
echo "GOOGLE_SERVICE_ACCOUNT_KEY='$JSON_KEY'" >> .env.local

echo ""
echo "✅ 環境変数の設定が完了しました！"
echo ""
echo "🔒 セキュリティ注意事項："
echo "- service-account-key.json ファイルは削除することをお勧めします"
echo "- .env.local ファイルは絶対にGitにコミットしないでください"
echo ""
echo "🚀 次のステップ："
echo "1. npm install でライブラリをインストール"
echo "2. npm run sync-sheets でデータを同期"
echo ""

# セキュリティのため、JSONファイルの削除を提案
read -p "service-account-key.json ファイルを削除しますか？ (y/N): " DELETE_JSON
if [ "$DELETE_JSON" = "y" ] || [ "$DELETE_JSON" = "Y" ]; then
    rm "$SERVICE_ACCOUNT_FILE"
    echo "✅ JSONキーファイルを削除しました"
fi