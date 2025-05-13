import { docs_v1 } from '@googleapis/docs';
import { google } from 'googleapis';
import { config } from '../utils/config';
import * as fs from 'fs';
import * as path from 'path';

// Google Docs APIのスコープ
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

/**
 * Googleドキュメントからプロンプトを読み取るサービス
 */
export class GoogleDocsService {
  private docsClient: docs_v1.Docs | null = null;

  constructor() {
    // 初期化は initialize メソッドで行う
  }

  /**
   * サービスを初期化する
   * @returns 初期化が成功したかどうか
   */
  async initialize(): Promise<boolean> {
    try {
      // 認証情報のパスを取得
      const credentialsPath = config.googleCredentialsPath;
      
      if (!credentialsPath || !fs.existsSync(credentialsPath)) {
        console.error(`Google認証情報ファイルが見つかりません: ${credentialsPath}`);
        return false;
      }

      // 認証情報を読み込む
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      // OAuth2クライアントを作成
      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // トークンのパスを取得
      const tokenPath = path.join(path.dirname(credentialsPath), 'token.json');
      
      // トークンが存在するか確認
      if (!fs.existsSync(tokenPath)) {
        console.error(`Googleトークンファイルが見つかりません: ${tokenPath}`);
        console.error('トークンを取得するには、getGoogleToken.ts スクリプトを実行してください');
        return false;
      }

      // トークンを読み込む
      const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      oAuth2Client.setCredentials(token);

      // Google Docs APIクライアントを初期化
      this.docsClient = google.docs({ version: 'v1', auth: oAuth2Client });
      
      console.log('Google Docs APIクライアントが正常に初期化されました');
      return true;
    } catch (error: any) {
      console.error('Google Docs APIクライアントの初期化中にエラーが発生しました:', error);
      return false;
    }
  }

  /**
   * 指定されたGoogleドキュメントからプロンプトを読み取る
   * @param documentId GoogleドキュメントのドキュメントID
   * @returns プロンプトの内容
   */
  async getPromptFromDoc(documentId: string): Promise<string> {
    if (!this.docsClient) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Google Docs APIクライアントが初期化されていません');
      }
    }

    try {
      // ドキュメントの内容を取得
      const response = await this.docsClient!.documents.get({
        documentId: documentId
      });

      const document = response.data;
      
      if (!document.body || !document.body.content) {
        throw new Error('ドキュメントの内容が空です');
      }

      // ドキュメントの内容をテキストに変換
      let text = '';
      document.body.content.forEach((element: any) => {
        if (element.paragraph) {
          element.paragraph.elements?.forEach((paraElement: any) => {
            if (paraElement.textRun) {
              text += paraElement.textRun.content || '';
            }
          });
        }
      });

      return text;
    } catch (error: any) {
      console.error('Googleドキュメントの読み取り中にエラーが発生しました:', error);
      throw new Error(`Googleドキュメントの読み取りに失敗しました: ${error.message}`);
    }
  }
}

// Google認証トークンを取得するためのヘルパー関数
// このスクリプトは別途実行する必要があります
export async function getAuthUrl(): Promise<string> {
  try {
    // 認証情報のパスを取得
    const credentialsPath = config.googleCredentialsPath;
    
    if (!credentialsPath || !fs.existsSync(credentialsPath)) {
      throw new Error(`Google認証情報ファイルが見つかりません: ${credentialsPath}`);
    }

    // 認証情報を読み込む
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // OAuth2クライアントを作成
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, 
      client_secret, 
      redirect_uris[0]
    );

    // 認証URLを生成
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      // ローカルホストへのリダイレクトを避けるために追加
      prompt: 'consent',
      include_granted_scopes: true
    });

    console.log('認証URLを生成しました:', authUrl);
    return authUrl;
  } catch (error) {
    console.error('認証URL生成中にエラーが発生しました:', error);
    throw error;
  }
}

// 認証コードからトークンを取得するヘルパー関数
export async function getTokenFromCode(code: string): Promise<any> {
  try {
    console.log('受け取った認証コード:', code);
    
    // 認証情報のパスを取得
    const credentialsPath = config.googleCredentialsPath;
    
    if (!credentialsPath || !fs.existsSync(credentialsPath)) {
      throw new Error(`Google認証情報ファイルが見つかりません: ${credentialsPath}`);
    }

    // 認証情報を読み込む
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('認証情報を読み込みました');
    
    // OAuth2クライアントを作成
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, 
      client_secret, 
      redirect_uris[0]
    );
    console.log('OAuth2クライアントを作成しました');

    try {
      // コードからトークンを取得
      console.log('トークンを取得しようとしています...');
      const { tokens } = await oAuth2Client.getToken(code);
      console.log('トークンを取得しました:', tokens);
      
      // トークンを保存
      const tokenPath = path.join(path.dirname(credentialsPath), 'token.json');
      fs.writeFileSync(tokenPath, JSON.stringify(tokens));
      
      console.log(`トークンが ${tokenPath} に保存されました`);
      
      return tokens;
    } catch (tokenError: any) {
      console.error('トークン取得中にエラーが発生しました:', tokenError);
      console.error('エラー詳細:', tokenError.response?.data || tokenError.message);
      throw new Error(`トークン取得中にエラーが発生しました: ${tokenError.message}`);
    }
  } catch (error: any) {
    console.error('トークン取得処理中にエラーが発生しました:', error);
    throw error;
  }
}
