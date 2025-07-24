# セットアップガイド - カードボックス期待値計算サービス

## 📋 事前準備

### 必要なアカウント
- [ ] GitHubアカウント
- [ ] Vercelアカウント
- [ ] Supabaseアカウント
- [ ] Googleアカウント（Sheets API用）
- [ ] Stripeアカウント（Phase 2.0以降）

### 開発環境
- [ ] Node.js v20以上
- [ ] Git
- [ ] VSCode（推奨）
- [ ] Chrome/Edge（開発者ツール用）

## 🚀 プロジェクトセットアップ手順

### 1. GitHubリポジトリの準備

```bash
# リポジトリのクローン（URLは後で確認）
git clone https://github.com/[username]/cardgame_kitaichikun.git
cd cardgame_kitaichikun

# 開発ブランチの作成
git checkout -b develop
```

### 2. Next.jsプロジェクトの初期化

```bash
# Next.jsプロジェクトの作成
npx create-next-app@latest . --typescript --tailwind --app

# 質問への回答
# ✔ Would you like to use ESLint? → Yes
# ✔ Would you like to use `src/` directory? → No
# ✔ Would you like to customize the default import alias? → No
```

### 3. 追加パッケージのインストール

```bash
# 基本パッケージ
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react

# 開発用パッケージ
npm install -D @types/node
```

### 4. Supabaseプロジェクトの設定

#### 4.1 Supabaseプロジェクト作成
1. [Supabase](https://supabase.com)にログイン
2. 「New Project」をクリック
3. プロジェクト名：`cardgame-kitaichikun`
4. データベースパスワードを設定（安全に保管）
5. リージョン：Northeast Asia (Tokyo)を選択

#### 4.2 環境変数の設定
```bash
# .env.localファイルを作成
touch .env.local
```

`.env.local`に以下を記載：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

### 5. プロジェクト構造の作成

```bash
# 必要なディレクトリを作成
mkdir -p components/{ui,features,layouts}
mkdir -p lib/{supabase,calculations,utils}
mkdir -p hooks
mkdir -p types
mkdir -p supabase/{migrations,functions}
```

### 6. 基本設定ファイルの作成

#### 6.1 TypeScript設定
`tsconfig.json`に以下を追加：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 6.2 Tailwind設定
`tailwind.config.ts`を確認・調整

### 7. Supabase初期設定

#### 7.1 Supabaseクライアントの作成
`lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 8. Gitの設定

#### 8.1 .gitignoreの確認
以下が含まれていることを確認：
```
# dependencies
/node_modules

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### 9. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

## 🔍 動作確認チェックリスト

- [ ] `npm run dev`でエラーなく起動する
- [ ] http://localhost:3000 でNext.jsのデフォルトページが表示される
- [ ] Tailwind CSSが適用されている
- [ ] TypeScriptのエラーがない

## 🛠️ VSCode推奨拡張機能

以下の拡張機能をインストール：
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript React code snippets
- GitLens

## 📝 次のステップ

1. **データベース設計**
   - Supabaseでテーブルを作成
   - マイグレーションファイルの作成

2. **認証機能の実装**
   - Supabase Authの設定
   - ログイン/新規登録画面の作成

3. **基本UIコンポーネント**
   - 共通コンポーネントの作成
   - レイアウトの実装

## ⚠️ トラブルシューティング

### npm installでエラーが出る場合
```bash
# キャッシュをクリア
npm cache clean --force
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### Supabase接続エラー
- 環境変数が正しく設定されているか確認
- Supabaseダッシュボードでプロジェクトの状態を確認

### ポート3000が使用中
```bash
# 別のポートで起動
npm run dev -- -p 3001
```

---

最終更新日：2025-07-23