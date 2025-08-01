import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.localファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkSheetNames() {
  try {
    // 認証情報の確認
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey || !spreadsheetId) {
      console.error('❌ 必要な環境変数が設定されていません');
      console.log('GOOGLE_SERVICE_ACCOUNT_KEY:', serviceAccountKey ? '設定済み' : '未設定');
      console.log('GOOGLE_SHEETS_ID:', spreadsheetId ? '設定済み' : '未設定');
      return;
    }

    // サービスアカウントキーをパース
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (error) {
      console.error('❌ サービスアカウントキーのパースに失敗しました:', error);
      return;
    }

    console.log('📊 Google Sheetsに接続中...');
    console.log(`スプレッドシートID: ${spreadsheetId}`);

    // Google Sheets APIクライアントの作成
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // スプレッドシートのメタデータを取得
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log('\n✅ スプレッドシートの情報を取得しました');
    console.log(`タイトル: ${response.data.properties?.title}`);
    console.log(`\n📋 シート一覧:`);

    // 各シートの情報を表示
    response.data.sheets?.forEach((sheet, index) => {
      const sheetName = sheet.properties?.title || '名前なし';
      const sheetId = sheet.properties?.sheetId;
      const rowCount = sheet.properties?.gridProperties?.rowCount;
      const columnCount = sheet.properties?.gridProperties?.columnCount;

      console.log(`\n${index + 1}. シート名: "${sheetName}"`);
      console.log(`   ID: ${sheetId}`);
      console.log(`   サイズ: ${rowCount}行 × ${columnCount}列`);
    });

    // 想定されるシート名との比較
    console.log('\n📝 期待されるシート名との比較:');
    const expectedNames = ['DM25-RP1_カード', 'DM25-RP1'];
    const actualNames = response.data.sheets?.map(sheet => sheet.properties?.title || '') || [];

    expectedNames.forEach(expected => {
      const exists = actualNames.includes(expected);
      console.log(`- "${expected}": ${exists ? '✅ 存在する' : '❌ 存在しない'}`);
    });

    // 実際に使用すべきシート名を提案
    if (actualNames.length > 0) {
      console.log(`\n💡 実際に使用すべきシート名: "${actualNames[0]}"`);
    }

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
    }
  }
}

// スクリプトを実行
checkSheetNames();