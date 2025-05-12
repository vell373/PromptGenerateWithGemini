import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("エラー: GEMINI_API_KEY が .env ファイルに設定されていません。");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("利用可能なモデルのリストを確認します...");
    console.log("---------------------------------------------------------------------");
    console.log("注: `@google/generative-ai` SDKには、直接利用可能なモデルを一覧表示する");
    console.log("高レベルな `listModels` 関数は提供されていません。");
    console.log("エラーメッセージの 'Call ListModels' は、APIの低レベルな機能や、");
    console.log("Google Cloud Console (Vertex AI) 経由での確認を示唆している可能性が高いです。");
    console.log("\n以下の手順で、利用可能なモデルをご確認ください:");
    console.log("1. Google AI Studio ([https://aistudio.google.com/](https://aistudio.google.com/)) にアクセスし、APIキーに関連付けられたプロジェクトでモデルを確認します。");
    console.log("2. Google Cloud Console ([https://console.cloud.google.com/](https://console.cloud.google.com/)) にアクセスし、");
    console.log("   APIキーに関連付けられたプロジェクトの Vertex AI > Model Garden または モデル セクションを確認します。");
    console.log("   特定のモデルはリージョンによって利用可否が異なる場合があるため、プロジェクトのリージョン設定もご確認ください。");
    console.log("---------------------------------------------------------------------");

    // 一般的に利用可能とされるモデル名の例 (実際の利用可否はプロジェクト設定とリージョンに依存します)
    const commonModels = [
      "gemini-pro",
      "gemini-1.0-pro", 
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro-latest",
      "gemini-pro-vision"
    ];

    console.log("\n一般的なモデル名の例 (利用可能かどうかは上記の方法で確認してください):");
    commonModels.forEach(model => console.log(`- ${model}`));

    console.log("\nもし上記の方法で確認しても問題が解決しない場合は、APIキーが有効であること、");
    console.log("関連するGoogle Cloudプロジェクトで \\\"Generative Language API\\\" または ");
    console.log("\\\"Vertex AI API\\\" が有効になっていることを再度ご確認ください。");

  } catch (error) {
    console.error("処理中にエラーが発生しました:", error);
  }
}

listModels();
