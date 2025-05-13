import * as readline from 'readline';
import { getAuthUrl, getTokenFromCode } from '../services/googleDocsService';
import { config } from '../utils/config';
import * as fs from 'fs';

// 標準入力からの読み取りインターフェースを作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Google認証トークンを取得するためのスクリプト
 */
async function main() {
  try {
    console.log('Google認証トークンを取得します...');
    
    // 認証情報ファイルの存在確認
    const credentialsPath = config.googleCredentialsPath;
    if (!credentialsPath) {
      console.error('認証情報ファイルのパスが設定されていません。.envファイルのGOOGLE_CREDENTIALS_PATHを確認してください。');
      rl.close();
      return;
    }
    
    if (!fs.existsSync(credentialsPath)) {
      console.error(`認証情報ファイルが見つかりません: ${credentialsPath}`);
      console.log('Google Cloud Platformからダウンロードした認証情報ファイルを上記のパスに配置してください。');
      rl.close();
      return;
    }
    
    console.log(`認証情報ファイルを確認しました: ${credentialsPath}`);
    
    // 認証URLを取得
    console.log('認証URLを生成しています...');
    const authUrl = await getAuthUrl();
    
    console.log('以下のURLをブラウザで開いて認証を行ってください:');
    console.log('\n' + authUrl + '\n');
    console.log('注意: ブラウザで認証した後、「このサイトにアクセスできません」と表示される場合がありますが、');
    console.log('それは正常な動作です。URLに表示される認証コードをコピーして、ここに入力してください。');
    console.log('認証コードは「code=」の後にある文字列です。');
    
    // ユーザーから認証コードを取得
    rl.question('\n認証コードを入力してください: ', async (code) => {
      try {
        // 入力されたコードから余分な空白を取り除く
        const trimmedCode = code.trim();
        
        if (!trimmedCode) {
          console.error('認証コードが入力されていません。もう一度試してください。');
          rl.close();
          return;
        }
        
        console.log('入力された認証コードでトークンを取得しようとしています...');
        
        // コードからトークンを取得
        await getTokenFromCode(trimmedCode);
        console.log('\n認証が完了しました。これでGoogleドキュメントからプロンプトを読み取ることができます。');
      } catch (error: any) {
        console.error('\n認証中にエラーが発生しました:');
        console.error(error.message || error);
        console.log('\nもう一度スクリプトを実行してみてください。または、認証情報が正しいか確認してください。');
      } finally {
        rl.close();
      }
    });
  } catch (error: any) {
    console.error('エラーが発生しました:', error.message || error);
    console.log('もう一度スクリプトを実行してみてください。');
    rl.close();
  }
}

// スクリプトを実行
main();
