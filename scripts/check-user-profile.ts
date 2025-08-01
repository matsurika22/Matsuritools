import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// .env.localファイルを読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済' : '未設定')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserProfile() {
  console.log('🔍 ユーザープロファイルを確認中...')
  
  try {
    // user_profilesテーブルの構造を確認
    const { data: columns } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0)
    
    console.log('\nuser_profilesテーブルの構造:', columns)
    
    // 全ユーザーのプロファイルを取得
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (error) {
      console.error('❌ エラー:', error)
      
      // テーブルが存在しない場合は作成を試みる
      if (error.code === '42P01') {
        console.log('\n📦 user_profilesテーブルが存在しません。作成を試みます...')
        
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
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
          `
        })
        
        if (createError) {
          console.error('❌ テーブル作成エラー:', createError)
        } else {
          console.log('✅ user_profilesテーブルを作成しました')
        }
      }
      return
    }
    
    console.log(`\n✅ ${profiles?.length || 0}件のプロファイルが見つかりました`)
    
    if (profiles && profiles.length > 0) {
      console.log('\nユーザープロファイル一覧:')
      profiles.forEach(profile => {
        console.log(`- ID: ${profile.id}`)
        console.log(`  Role: ${profile.role || 'なし'}`)
        console.log(`  Created: ${profile.created_at}`)
      })
    }
    
    // 管理者ユーザーがいるか確認
    const adminProfiles = profiles?.filter(p => p.role === 'admin') || []
    console.log(`\n👮 管理者ユーザー数: ${adminProfiles.length}`)
    
    if (adminProfiles.length === 0) {
      console.log('\n⚠️  管理者ユーザーが存在しません。')
      console.log('管理者を設定するには、Supabaseダッシュボードで直接user_profilesテーブルを編集するか、')
      console.log('以下のSQLを実行してください:')
      console.log("\nINSERT INTO user_profiles (id, role) VALUES ('ユーザーID', 'admin')")
      console.log("ON CONFLICT (id) DO UPDATE SET role = 'admin';")
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkUserProfile()