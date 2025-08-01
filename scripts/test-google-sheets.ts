import { GoogleSheetsService } from '../lib/services/google-sheets'
import dotenv from 'dotenv'
import path from 'path'

// .env.localファイルを読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function testGoogleSheets() {
  console.log('🔍 Google Sheetsからデータを取得中...\n')
  
  try {
    const sheetsService = new GoogleSheetsService()
    
    // DM25-RP1のスプレッドシートIDを取得
    const spreadsheetId = 'your_spreadsheet_id' // ここに実際のIDを入れる必要があります
    
    // スプレッドシートからデータを読み込む
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/your_spreadsheet_id/values/your_range?key=' + process.env.GOOGLE_SHEETS_API_KEY)
    
    if (!response.ok) {
      console.error('❌ Google Sheets APIエラー:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    console.log('取得したデータ:', data)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 環境変数を確認
console.log('環境変数の確認:')
console.log('GOOGLE_SHEETS_API_KEY:', process.env.GOOGLE_SHEETS_API_KEY ? '設定済み' : '未設定')
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '設定済み' : '未設定')
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '設定済み' : '未設定')

testGoogleSheets()