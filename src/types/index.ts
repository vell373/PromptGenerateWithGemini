/**
 * Gemini APIのレスポンス型定義
 * 実際のレスポンス構造に合わせて調整が必要
 */
export interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
  promptFeedback?: {
    blockReason?: string;
  };
}

/**
 * エラー情報を含むカスタムエラー型
 */
export class GeminiAPIError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}
