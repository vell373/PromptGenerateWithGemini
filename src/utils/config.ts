import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  promptFilePath: process.env.PROMPT_FILE_PATH || 'prompts/default.txt',
  geminiModelName: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash-latest',
  errorMessageApi: process.env.ERROR_MESSAGE_API || "申し訳ありません、AIとの通信中にエラーが発生しました。しばらくしてからもう一度お試しください。",
  errorMessageUnexpected: process.env.ERROR_MESSAGE_UNEXPECTED || "申し訳ありません、予期せぬエラーが発生しました。",
  messageInvalidInput: process.env.MESSAGE_INVALID_INPUT || "メッセージが理解できませんでした。もう少し具体的に質問していただけますか？",
};

// 必須の設定値がない場合はエラーをスローして起動を中止
if (!config.discordToken || !config.geminiApiKey) {
  console.error("Error: DISCORD_TOKEN and GEMINI_API_KEY must be set in .env file.");
  process.exit(1);
}
