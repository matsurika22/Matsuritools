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

async function checkAdminStatus() {
  console.log('🔍 管理者権限の状況を確認中...\n')
  
  const targetEmail = 'mk0207yu1111@gmail.com'
  const targetId = '524aeeb6-bd1e-44ab-8fdd-40e82fa00075'
  
  try {
    // 1. usersテーブルを確認（Supabase標準）
    console.log('1. usersテーブルの確認:')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single()
    
    if (userError) {
      if (userError.code === '42P01') {
        console.log('   ❌ usersテーブルは存在しません（これは正常です）')
      } else {
        console.log('   ❌ エラー:', userError.message)
      }
    } else {
      console.log('   ✅ usersテーブルに存在:', userData)
    }
    
    // 2. user_profilesテーブルを確認
    console.log('\n2. user_profilesテーブルの確認:')
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', targetId)
      .single()
    
    if (profileError) {
      if (profileError.code === '42P01') {
        console.log('   ❌ user_profilesテーブルが存在しません')
        console.log('   → これが403エラーの原因です！')
      } else if (profileError.code === 'PGRST116') {
        console.log('   ⚠️  user_profilesテーブルは存在しますが、該当ユーザーのレコードがありません')
      } else {
        console.log('   ❌ エラー:', profileError.message)
      }
    } else {
      console.log('   ✅ プロファイル:', profileData)
      console.log(`   → role: ${profileData.role}`)
    }
    
    // 3. auth.usersから確認（Supabase Auth）
    console.log('\n3. Supabase Authでの確認:')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(targetId)
    
    if (authError) {
      console.log('   ❌ エラー:', authError.message)
    } else {
      console.log('   ✅ Auth user found:')
      console.log(`   - Email: ${authUser.user?.email}`)
      console.log(`   - Created: ${new Date(authUser.user?.created_at || '').toLocaleString('ja-JP')}`)
      console.log(`   - Metadata:`, authUser.user?.user_metadata)
    }
    
    // 4. どのテーブルを使用すべきか判断
    console.log('\n📊 分析結果:')
    if (profileError && profileError.code === '42P01') {
      console.log('user_profilesテーブルが存在しないため、作成が必要です。')
      console.log('\n以下のSQLをSupabaseダッシュボードで実行してください:')
      console.log(`
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- mk0207yu1111@gmail.com を管理者として追加
INSERT INTO user_profiles (id, role) VALUES ('${targetId}', 'admin');
      `)
    } else if (profileData && profileData.role !== 'admin') {
      console.log('user_profilesは存在しますが、管理者権限がありません。')
      console.log('\n以下のSQLで管理者権限を付与してください:')
      console.log(`UPDATE user_profiles SET role = 'admin' WHERE id = '${targetId}';`)
    } else if (profileData && profileData.role === 'admin') {
      console.log('✅ すでに管理者権限が設定されています！')
      console.log('もし403エラーが続く場合は、APIルートのコードに問題がある可能性があります。')
    }
    
    // 5. 代替案の確認
    console.log('\n5. 代替テーブルの確認:')
    
    // auth.users のapp_metadataを確認
    if (authUser?.user?.app_metadata) {
      console.log('app_metadata:', authUser.user.app_metadata)
      if (authUser.user.app_metadata.role) {
        console.log(`→ app_metadataにroleが設定されています: ${authUser.user.app_metadata.role}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

checkAdminStatus()