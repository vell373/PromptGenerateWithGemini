import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { config } from '../utils/config';

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// Gemini モデルを設定
const modelName = "gemini-1.5-pro";
console.log(`Using Gemini model: ${modelName} (config value was: ${config.geminiModelName})`);

// モデルの取得
const model = genAI.getGenerativeModel({ model: modelName });

// 生成設定
const generationConfig = {
  temperature: 0.9, // クリエイティビティのバランス (0.2-0.9)
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, // 出力トークン数の上限
};

// セーフティ設定
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Gemini APIを使用して回答を生成する
 * @param fullPrompt 完全なプロンプト文字列
 * @returns 生成された回答
 */
export async function generateGeminiResponse(fullPrompt: string): Promise<string> {
  try {
    console.log(`Sending request to Gemini API with model: ${modelName}`);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;

    // セーフティフィルターによるブロックをチェック
    if (response.promptFeedback?.blockReason) {
      console.warn(`Gemini response blocked: ${response.promptFeedback.blockReason}`, response.promptFeedback);
      throw new Error(`Gemini content generation blocked: ${response.promptFeedback.blockReason}`);
    }

    // レスポンス構造の検証
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn("Gemini API returned an empty or unexpected response structure.", response);
      throw new Error("Gemini API returned an empty or unexpected response.");
    }

    return response.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);

    // より詳細なエラーメッセージを提供
    if (error.message && typeof error.message === 'string') {
      if (error.message.includes("not found for API version")) {
        console.error(`モデル "${modelName}" はAPIで利用できません。`);
        console.error("利用可能なモデルについては、Google AI Studio (https://aistudio.google.com/) または");
        console.error("Google Cloud Console (https://console.cloud.google.com/) の Vertex AI セクションで確認してください。");

        // Gemini 2.5 Proが利用できない場合、Gemini 1.5 Proを代替として試す
        console.log("Attempting to use gemini-1.5-pro as fallback model...");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await fallbackModel.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig,
          safetySettings,
        });

        const response = result.response;

        // セーフティフィルターによるブロックをチェック
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Gemini content generation blocked: ${response.promptFeedback.blockReason}`);
        }

        // レスポンス構造の検証
        if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error("Gemini API returned an empty or unexpected response.");
        }

        console.log("Successfully used fallback model gemini-1.5-pro");
        return response.candidates[0].content.parts[0].text;
      } else if (error.message.includes("API key not valid")) {
        console.error("APIキーが無効です。Google Cloud Consoleで有効なAPIキーを生成し、.envファイルに設定してください。");
      } else {
        console.error(`詳細なエラーメッセージ: ${error.message}`);
      }
    }

    throw error; // 呼び出し元で詳細なエラーハンドリングを行う
  }
}
