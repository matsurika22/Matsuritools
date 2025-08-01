import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// .env.localファイルを読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdminUser() {
  console.log('🔍 現在のユーザーを確認中...')
  
  try {
    // auth.usersから全ユーザーを取得
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ ユーザー一覧取得エラー:', authError)
      return
    }
    
    console.log(`\n✅ ${authUsers.users.length}人のユーザーが見つかりました`)
    
    if (authUsers.users.length === 0) {
      console.log('⚠️  ユーザーが存在しません。先にユーザー登録を行ってください。')
      return
    }
    
    console.log('\n現在のユーザー一覧:')
    authUsers.users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   作成日: ${new Date(user.created_at).toLocaleString('ja-JP')}`)
      console.log(`   メタデータ:`, user.user_metadata)
    })
    
    // 最初のユーザーのIDを取得（または特定のメールアドレスで検索）
    const firstUser = authUsers.users[0]
    console.log(`\n👮 ${firstUser.email} を管理者として設定します...`)
    
    // user_profilesテーブルが存在するか確認
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (tableError && tableError.code === '42P01') {
      console.log('\n📦 user_profilesテーブルが存在しません')
      console.log('Supabaseダッシュボードで以下のSQLを実行してください:')
      console.log(`
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL USING (true);

-- 管理者ユーザーを追加
INSERT INTO user_profiles (id, role) VALUES ('${firstUser.id}', 'admin');
      `)
      return
    }
    
    // user_profilesに管理者として追加/更新
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({
        id: firstUser.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    
    if (upsertError) {
      console.error('❌ プロファイル更新エラー:', upsertError)
      return
    }
    
    console.log('✅ 管理者権限を設定しました')
    
    // 確認
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', firstUser.id)
      .single()
    
    console.log('\n更新後のプロファイル:', profile)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

setupAdminUser()