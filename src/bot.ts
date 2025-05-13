import { Message } from 'discord.js';
import { initializeDiscordClient, replyToMessage, editMessage } from './services/discordService';
import { generateGeminiResponse } from './services/geminiService';
import { loadPrompt, getPrompt, fillPrompt } from './managers/promptManager';
import { getFixedResponse, ErrorType } from './utils/errorHandler';

/**
 * メッセージを処理する関数
 * @param message Discordメッセージオブジェクト
 */
async function handleMessage(message: Message): Promise<void> {
  // 処理中メッセージの参照を保持
  let processingMessage: Message | null = null;
  
  try {
    // メンションを除いたメッセージ本文を取得
    const clientMentionRegex = new RegExp(`<@!?${message.client.user!.id}>`, 'g');
    const userMessage = message.content.replace(clientMentionRegex, '').trim();

    // 簡単な入力チェック
    if (!userMessage || userMessage.length < 5) {
      const response = getFixedResponse(ErrorType.InvalidInput, `User message: "${userMessage}"`);
      await replyToMessage(message, response);
      return;
    }

    // ユーザーに処理中を伝える
    try {
      // 「プロンプトを生成中です」というメッセージを送信
      processingMessage = await replyToMessage(message, "プロンプトを生成中です...");
      
      // タイピングインジケータも送信する（オプション）
      if ('sendTyping' in message.channel) {
        // @ts-ignore - TypeScriptの型チェックを一時的に無視
        await message.channel.sendTyping();
      }
    } catch (error) {
      console.warn("Failed to send processing message or typing indicator:", error);
      // 処理中メッセージの送信に失敗しても処理を続行
    }

    // プロンプトの取得と整形
    const promptTemplate = getPrompt();
    const fullPrompt = fillPrompt(promptTemplate, userMessage);

    console.log(`Sending to Gemini - User: ${message.author.tag}, Message: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`);
    
    // Gemini APIで回答を生成
    const geminiResponse = await generateGeminiResponse(fullPrompt);
    console.log(`Received from Gemini - Response length: ${geminiResponse.length} characters`);

    // 処理中メッセージがあれば編集、なければ新規メッセージを送信
    if (processingMessage) {
      await editMessage(processingMessage, geminiResponse);
    } else {
      await replyToMessage(message, geminiResponse);
    }

  } catch (error: any) {
    let response: string;
    
    // エラーの種類に応じた定型文を取得
    if (error.message && (
        error.message.includes("Gemini") || 
        error.message.includes("blocked") || 
        error.message.includes("API")
    )) {
      response = getFixedResponse(ErrorType.GeminiAPIError, error);
    } else {
      response = getFixedResponse(ErrorType.UnexpectedError, error);
    }
    
    // 処理中メッセージがあれば編集、なければ新規メッセージを送信
    if (processingMessage) {
      await editMessage(processingMessage, response);
    } else {
      await replyToMessage(message, response);
    }
  }
}

/**
 * ボットを初期化する関数
 * index.tsから呼び出されるためにエクスポート
 */
export async function initializeBot() {
  try {
    console.log("Loading prompt...");
    await loadPrompt(); // Bot起動時にプロンプトをロード
    
    console.log("Initializing Discord client...");
    await initializeDiscordClient(handleMessage);
    
    console.log("Discord Bot is running!");
    return true;
  } catch (error) {
    console.error("Failed to start the bot:", error);
    throw error;
  }
}

// 直接実行された場合のみ起動する
if (require.main === module) {
  initializeBot().catch(error => {
    console.error("Unhandled error in initializeBot:", error);
    process.exit(1);
  });
}
