import fs from 'fs/promises';
import path from 'path';
import { config } from '../utils/config';

let currentPrompt: string = '';

/**
 * 指定されたファイルパスからプロンプト文字列を読み込む
 * @returns Promise<void>
 */
export async function loadPrompt(): Promise<void> {
  try {
    const filePath = path.resolve(config.promptFilePath);
    currentPrompt = await fs.readFile(filePath, 'utf-8');
    console.log(`Prompt loaded successfully from ${filePath}`);
  } catch (error) {
    console.error(`Error loading prompt from ${config.promptFilePath}:`, error);
    // フォールバックとしてハードコードされたプロンプトを設定
    currentPrompt = "ユーザーの質問「{{user_message}}」に簡潔に答えてください。"; // デフォルトプロンプト
    console.warn("Using fallback prompt due to error loading prompt file.");
  }
}

/**
 * 現在ロードされているプロンプトを取得する
 * @returns プロンプト文字列
 */
export function getPrompt(): string {
  if (!currentPrompt) {
    // 通常はloadPromptでロードされるが、万が一空の場合のフォールバック
    console.warn("Prompt is not loaded. Using default fallback prompt.");
    return "ユーザーの質問「{{user_message}}」に簡潔に答えてください。";
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
