import { config } from '../utils/config';
import { GoogleDocsService } from '../services/googleDocsService';

let currentPrompt: string = '';
let googleDocsService: GoogleDocsService | null = null;

/**
 * プロンプトを読み込む
 * Googleドキュメントからプロンプトを読み込みます
 * @returns Promise<void>
 */
export async function loadPrompt(): Promise<void> {
  try {
    // GoogleドキュメントIDが設定されているか確認
    if (!config.googleDocId) {
      throw new Error('GoogleドキュメントIDが設定されていません');
    }

    // Googleドキュメントからプロンプトを読み込む
    await loadPromptFromGoogleDocs(config.googleDocId);
  } catch (error) {
    console.error(`Error loading prompt:`, error);
    // エラーメッセージを設定
    currentPrompt = "ドキュメントの読み込みに失敗しました。管理者に問い合わせてください。";
    console.warn("Using error message prompt due to failure loading from Google Docs.");
  }
}

// ローカルファイルからの読み込み機能は削除しました

/**
 * Googleドキュメントからプロンプトを読み込む
 * @param documentId GoogleドキュメントID
 * @returns Promise<void>
 */
async function loadPromptFromGoogleDocs(documentId: string): Promise<void> {
  try {
    // Google Docsサービスの初期化
    if (!googleDocsService) {
      googleDocsService = new GoogleDocsService();
      const initialized = await googleDocsService.initialize();
      if (!initialized) {
        throw new Error('Google Docsサービスの初期化に失敗しました');
      }
    }
    
    // ドキュメントからプロンプトを取得
    currentPrompt = await googleDocsService.getPromptFromDoc(documentId);
    console.log(`Prompt loaded successfully from Google Doc: ${documentId}`);
  } catch (error) {
    console.error(`Error loading prompt from Google Doc ${documentId}:`, error);
    throw error;
  }
}

/**
 * 現在ロードされているプロンプトを取得する
 * @returns プロンプト文字列
 */
export function getPrompt(): string {
  if (!currentPrompt) {
    // プロンプトがロードされていない場合はエラーメッセージを表示
    console.warn("Prompt is not loaded. Using error message prompt.");
    return "ドキュメントの読み込みに失敗しました。管理者に問い合わせてください。";
  }
  return currentPrompt;
}

/**
 * プロンプトテンプレート内のプレースホルダーをユーザーメッセージで置換する
 * @param promptTemplate プロンプトテンプレート
 * @param userMessage ユーザーメッセージ
 * @returns 置換後のプロンプト
 */
export function fillPrompt(promptTemplate: string, userMessage: string): string {
  return promptTemplate.replace('{{user_message}}', userMessage);
}
