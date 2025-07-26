# エラーログ - Matsuritools

## 🚨 エラー記録の目的

このファイルは開発中に発生したエラーとその解決方法を記録し、今後同じ問題に遭遇した際の参考資料とするためのものです。

## 📝 記載フォーマット

```markdown
## YYYY-MM-DD HH:MM - エラータイトル

### 📍 発生箇所
- ファイル名：
- 関数/コンポーネント名：
- 行番号：

### 🔴 エラー内容
```
エラーメッセージをそのまま貼り付け
```

### 🔍 原因
- エラーが発生した理由の説明

### ✅ 解決方法
1. 実施した手順1
2. 実施した手順2
3. ...

### 📚 参考リンク
- [参考にしたドキュメント](URL)

### 💡 学んだこと
- このエラーから得た知見
- 今後の予防策

---
```

## エラーログ一覧

### 2025-07-23 - ドキュメント作成時
- エラーは発生していません（初期セットアップのため）

---

## 2025-07-24 15:00 - Supabase usersテーブル カラム不存在エラー

### 📍 発生箇所
- ファイル名：lib/supabase/admin.ts
- 関数/コンポーネント名：getAllUsers()
- 行番号：40

### 🔴 エラー内容
```
GET https://gmtpxuqotxfzwwwkqlib.supabase.co/rest/v1/users?select=id%2Cemail%2Crole%2Ccreated_at%2Clast_sign_in_at&order=created_at.desc 400 (Bad Request)

Error fetching users: {code: '42703', details: null, hint: null, message: 'column users.last_sign_in_at does not exist'}
```

### 🔍 原因
- Supabaseのusersテーブルに`last_sign_in_at`カラムが存在しないにも関わらず、Admin機能でこのカラムを取得しようとしていた
- マイグレーションファイル（002_check_and_create_users.sql）を確認すると、usersテーブルには以下のカラムのみ定義されている：
  - id (UUID)
  - email (TEXT)
  - role (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

### ✅ 解決方法
1. **Admin TypeScript型定義を修正**
   - lib/supabase/admin.ts の AdminUser インターフェースから `last_sign_in_at` プロパティを削除
   
2. **データベースクエリを修正**
   - getAllUsers() 関数のselectクエリから `last_sign_in_at` を削除
   
3. **Admin画面表示を修正**
   - app/admin/users/page.tsx で「最終ログイン」列を「ユーザーID」列に変更
   - last_sign_in_at の表示ロジックを削除し、ユーザーIDの一部を表示する形に変更

### 📚 参考リンク
- [Supabase Auth Schema Documentation](https://supabase.com/docs/guides/auth/auth-schema)

### 💡 学んだこと
- データベーススキーマとアプリケーションコードの整合性を保つことの重要性
- マイグレーションファイルを確認してから機能を実装すべき
- 今後は必要に応じて `last_sign_in_at` カラムをマイグレーションで追加することも検討できる

---

## よくあるエラーと対処法（予想）

### Next.js関連

#### Module not found エラー
```
原因：必要なパッケージがインストールされていない
解決：npm install [パッケージ名]
```

#### Hydration エラー
```
原因：サーバーサイドとクライアントサイドのHTMLが一致しない
解決：useEffectを使用してクライアントサイドでのみ実行
```

### Supabase関連

#### 認証エラー
```
原因：環境変数が正しく設定されていない
解決：.env.localファイルを確認し、正しい値を設定
```

#### CORS エラー
```
原因：Supabaseの設定でCORSが許可されていない
解決：Supabaseダッシュボードで許可するドメインを追加
```

### TypeScript関連

#### 型エラー
```
原因：型定義が不適切
解決：正しい型を定義するか、型アサーションを使用
```

### Vercel関連

#### ビルドエラー
```
原因：環境変数が本番環境に設定されていない
解決：Vercelダッシュボードで環境変数を設定
```

---

## 🔧 デバッグTips

### 1. console.logの活用
```typescript
console.log('デバッグ:', {
    変数名: 変数の値,
    timestamp: new Date().toISOString()
});
```

### 2. エラーバウンダリーの実装
```typescript
// エラーが発生してもアプリ全体がクラッシュしないようにする
class ErrorBoundary extends React.Component {
    // 実装内容
}
```

### 3. 開発ツールの活用
- React Developer Tools
- Network タブでAPIリクエストを確認
- Console でエラーメッセージを確認

---

## 2025-07-26 - Supabase 406 (Not Acceptable) エラー

### 📍 発生箇所
- ファイル名：lib/supabase/auth.ts
- 関数/コンポーネント名：getCurrentUser()
- 行番号：52-56

### 🔴 エラー内容
```
GET https://gmtpxuqotxfzwwwkqlib.supabase.co/rest/v1/users?select=*&id=eq.639dcd17-77ac-4578-8f5c-b492e36767fa 406 (Not Acceptable)
```

### 🔍 原因
- Supabase REST APIが特定のクエリパターンを受け付けない
- `single()`メソッドの使用が406エラーを引き起こす可能性
- ヘッダー設定の問題（Accept/Content-Type）

### ✅ 解決方法
1. **Supabaseクライアントのヘッダー設定を更新**
   - `Accept: application/json`を明示的に追加
   - `Content-Type: application/json`も追加

2. **クエリ構造の変更**
   - `single()`の代わりに`limit(1)`を使用
   - 配列で受け取って最初の要素を取得

3. **エラーハンドリングの強化**
   - 406エラー時はauth情報のみでユーザー情報を構築
   - フォールバック処理を実装

### 📚 参考リンク
- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)

### 💡 学んだこと
- Supabase REST APIは特定のクエリパターンに敏感
- `single()`より`limit(1)`の方が安定している場合がある
- 適切なヘッダー設定は重要

---

最終更新日：2025-07-26