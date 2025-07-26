// Google Sheetsからデータベースへの同期スクリプト
// npm run sync-sheets で実行

import { createClient } from '@supabase/supabase-js'
import { SheetsSyncService } from '@/lib/services/google-sheets'

// 環境変数の読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const googleSheetsId = process.env.GOOGLE_SHEETS_ID!

if (!supabaseUrl || !supabaseServiceKey || !googleSheetsId) {
  console.error('❌ 必要な環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.error('GOOGLE_SHEETS_ID:', !!googleSheetsId)
  console.log('\n📋 必要な環境変数:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL: Supabaseプロジェクトurl')
  console.log('- SUPABASE_SERVICE_ROLE_KEY: Supabaseサービスロールキー') 
  console.log('- GOOGLE_SHEETS_ID: GoogleスプレッドシートID')
  console.log('- GOOGLE_SERVICE_ACCOUNT_KEY: Google サービスアカウントキー (JSON文字列)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncFromSheets() {
  console.log('📊 Google Sheetsからデータベースへの同期を開始します...')
  console.log(`📋 スプレッドシートID: ${googleSheetsId}`)
  
  try {
    const syncService = new SheetsSyncService(googleSheetsId, supabase)
    
    console.log('🔄 データ同期中...')
    const result = await syncService.syncAll()
    
    console.log('\n✅ 同期完了:')
    console.log(`- 弾: ${result.packs}件`)
    console.log(`- レアリティ: ${result.rarities}件`)
    console.log(`- カード: ${result.cards}件`)
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ エラー一覧:')
      result.errors.forEach(error => console.log(`  - ${error}`))
    }
    
    // 同期後のデータ確認
    console.log('\n📈 データベース内のデータ確認:')
    
    const { count: packCount } = await supabase
      .from('packs')
      .select('*', { count: 'exact', head: true })
    console.log(`- 弾: ${packCount || 0}件`)

    const { count: rarityCount } = await supabase
      .from('rarities')
      .select('*', { count: 'exact', head: true })
    console.log(`- レアリティ: ${rarityCount || 0}件`)

    const { count: cardCount } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
    console.log(`- カード: ${cardCount || 0}件`)

    // 弾別カード数の表示（groupby の代わりに個別クエリを使用）
    const { data: packList } = await supabase
      .from('packs')
      .select('id, name')
    
    if (packList && packList.length > 0) {
      console.log('\n📦 弾別カード数:')
      for (const pack of packList) {
        const { count } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('pack_id', pack.id)
        
        console.log(`  - ${pack.name} (${pack.id}): ${count || 0}枚`)
      }
    }

    console.log('\n🎉 Google Sheetsからの同期が完了しました！')
    
  } catch (error) {
    console.error('❌ 同期処理でエラーが発生しました:', error)
    
    if (error instanceof Error && error.message?.includes('Google Sheets API')) {
      console.log('\n💡 Google Sheets API の設定確認:')
      console.log('1. Google Cloud Platform でSpreadsheets APIが有効になっているか')
      console.log('2. サービスアカウントが作成され、キーがダウンロードされているか')
      console.log('3. スプレッドシートがサービスアカウントと共有されているか')
      console.log('4. シート名が正しいか（弾マスター、レアリティマスター、カードマスター）')
    }
    
    process.exit(1)
  }
}

// 特定の弾のみ同期
async function syncSpecificPack(packId: string) {
  console.log(`📦 弾「${packId}」のデータを同期中...`)
  
  try {
    const syncService = new SheetsSyncService(googleSheetsId, supabase)
    const syncedCards = await syncService.syncPack(packId)
    
    console.log(`✅ 弾「${packId}」の同期完了: ${syncedCards}枚のカードを同期`)
    
  } catch (error) {
    console.error(`❌ 弾「${packId}」の同期でエラー:`, error)
    process.exit(1)
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2)
const command = args[0]
const packId = args[1]

if (command === 'pack' && packId) {
  syncSpecificPack(packId)
} else {
  syncFromSheets()
}