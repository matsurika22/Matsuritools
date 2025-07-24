# カードボックス期待値計算サービス

## 📊 サービス概要

デュエル・マスターズのカードボックスを開封して、全カードを店舗に売却した場合の**換金期待値**を計算するWebサービスです。

### 主な機能
- 📈 **期待値計算**: ボックス購入価格と買取価格から期待値を即座に算出
- 🎯 **プラス収支確率**: 利益が出る確率をパーセンテージで表示
- 📱 **スマホ対応**: どこでも簡単に計算可能
- 🔐 **アクセスコード認証**: 弾ごとのライセンス管理

## 🚀 Phase 1.1 MVP（10営業日以内リリース目標）

### 実装機能
- 1弾のみ対応
- アクセスコード発行・検証機能
- 期待値＆プラス収支確率の表示
- 価格入力（直接入力／CSVアップロード）
- Admin画面（データ管理）

## 💻 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS v4
- **認証・DB**: Supabase
- **ホスティング**: Vercel
- **決済**: Stripe（Phase 2.0以降）

## 🏗️ プロジェクト構成

```
cardgame_kitaichikun/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
├── lib/             # ユーティリティ関数
├── public/          # 静的ファイル
├── styles/          # グローバルスタイル
├── doc/             # 開発ドキュメント
└── supabase/        # Supabase設定・マイグレーション
```

## 🛠️ セットアップ

### 必要な環境
- Node.js v20以上
- npm または yarn

### 環境構築手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/MK-272/cardgame_kitaichikun.git
cd cardgame_kitaichikun
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
`.env.local`ファイルを作成し、以下を設定：
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **開発サーバーの起動**
```bash
npm run dev
```

## 📝 開発ガイドライン

詳細な開発ガイドラインは [claude.md](./claude.md) を参照してください。

## 🔒 セキュリティ

- APIキーや秘密情報は `.env.local` に保存
- SQLインジェクション・XSS対策を実装
- HTTPS通信（Vercel提供）

## 📄 ライセンス

本プロジェクトはプライベートプロジェクトです。

## 📞 お問い合わせ

開発者：キララさん

---

※ このサービスは投資助言を行うものではありません。  
※ カードゲームの著作権は各権利者に帰属します。