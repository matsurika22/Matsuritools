import { GoogleAuth } from 'google-auth-library'
import dotenv from 'dotenv'
import path from 'path'

// .env.localファイルを読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function testGoogleAuth() {
  console.log('🔍 Google認証をテスト中...\n')
  
  try {
    // 環境変数の確認
    console.log('環境変数の状態:')
    console.log('GOOGLE_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '設定済み' : '未設定')
    console.log('GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? '設定済み' : '未設定')
    console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID ? `設定済み (${process.env.GOOGLE_SHEETS_ID})` : '未設定')
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        console.log('\nサービスアカウントキーの内容:')
        console.log('- type:', parsed.type)
        console.log('- project_id:', parsed.project_id)
        console.log('- private_key_id:', parsed.private_key_id ? '設定済み' : '未設定')
        console.log('- private_key:', parsed.private_key ? '設定済み' : '未設定')
        console.log('- client_email:', parsed.client_email)
      } catch (e) {
        console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEYのパースに失敗:', e)
      }
    }
    
    // GoogleAuthのテスト
    console.log('\n📋 GoogleAuthの初期化をテスト...')
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : undefined,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    })
    
    const client = await auth.getClient()
    console.log('✅ GoogleAuthクライアントの作成に成功')
    
    // 実際にスプレッドシートにアクセスしてみる
    if (process.env.GOOGLE_SHEETS_ID) {
      const { google } = await import('googleapis')
      const sheets = google.sheets({ version: 'v4', auth: client as any })
      
      console.log('\n📊 スプレッドシートへのアクセスをテスト...')
      const response = await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID
      })
      
      console.log('✅ スプレッドシートにアクセス成功:')
      console.log('- タイトル:', response.data.properties?.title)
      console.log('- シート数:', response.data.sheets?.length)
    }
    
  } catch (error) {
    console.error('\n❌ エラー:', error)
    
    if (error instanceof Error && error.message.includes('Could not load the default credentials')) {
      console.log('\n💡 解決方法:')
      console.log('1. サービスアカウントキーをJSON文字列として環境変数に設定')
      console.log('2. またはキーファイルのパスを環境変数に設定')
    }
  }
}

testGoogleAuth()