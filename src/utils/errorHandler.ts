import { config } from './config';

export enum ErrorType {
  GeminiAPIError,
  InvalidInput,
  UnexpectedError,
}

/**
 * エラータイプに応じた定型文を返す
 * @param type エラーの種類
 * @param error エラーオブジェクトまたは追加情報
 * @returns 定型文メッセージ
 */
export function getFixedResponse(type: ErrorType, error?: any): string {
  let message = '';
  switch (type) {
    case ErrorType.GeminiAPIError:
      console.error("Gemini API Error:", error);
      message = config.errorMessageApi;
      break;
    case ErrorType.InvalidInput:
      console.warn("Invalid user input:", error); // errorには元のメッセージなどを含める
      message = config.messageInvalidInput;
      break;
    case ErrorType.UnexpectedError:
    default:
      console.error("Unexpected Error:", error);
      message = config.errorMessageUnexpected;
      break;
  }
  return message;
}
