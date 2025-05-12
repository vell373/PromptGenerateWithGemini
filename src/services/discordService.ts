import { Client, GatewayIntentBits, Partials, Message, MessageCreateOptions, TextChannel, DMChannel, NewsChannel, ThreadChannel } from 'discord.js';
import { config } from '../utils/config';

// Discordクライアントの初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // メッセージ内容の読み取りに必要
    GatewayIntentBits.GuildMembers,   // Botへのメンションを検知するために推奨
  ],
  partials: [Partials.Message, Partials.Channel],
});

/**
 * Discordクライアントを初期化し、メッセージハンドラを設定する
 * @param onMessageHandler メッセージ受信時のハンドラ関数
 * @returns Promise<void>
 */
export function initializeDiscordClient(onMessageHandler: (message: Message) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once('ready', () => {
      console.log(`Logged in as ${client.user?.tag}!`);
      resolve();
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return; // Bot自身のメッセージは無視
      if (!client.user || !message.mentions.has(client.user.id)) return; // Botへのメンションがない場合は無視

      await onMessageHandler(message);
    });

    client.login(config.discordToken).catch(err => {
      console.error("Failed to login to Discord:", err);
      reject(err);
    });
  });
}

/**
 * メッセージに返信する
 * @param originalMessage 元のメッセージ
 * @param content 返信内容
 * @returns Promise<Message> 送信されたメッセージオブジェクト
 */
export async function replyToMessage(originalMessage: Message, content: string): Promise<Message | null> {
  try {
    // Discordのメッセージ長制限（2000文字）を考慮
    if (content.length > 2000) {
      const chunks = splitMessage(content);
      let lastMessage = null;
      for (const chunk of chunks) {
        lastMessage = await originalMessage.reply(chunk);
      }
      return lastMessage;
    } else {
      return await originalMessage.reply(content);
    }
  } catch (error) {
    console.error("Failed to send reply message:", error);
    // フォールバックとしてチャンネルに直接送信を試みる
    try {
      // Discord.js v14では、TextBasedChannelインターフェースを実装しているチャンネルのみがsendメソッドを持つ
      if ('send' in originalMessage.channel) {
        // @ts-ignore - TypeScriptの型チェックを一時的に無視
        return await originalMessage.channel.send(`${originalMessage.author}, エラーが発生したため、直接メッセージを送信します: ${content.substring(0, 1900)}`);
      } else {
        console.error("Channel does not support sending messages");
      }
    } catch (sendError) {
      console.error("Failed to send message to channel after reply failed:", sendError);
    }
    return null;
  }
}

/**
 * チャンネルがメッセージを送信できるか確認するヘルパー関数
 * @param channel チャンネルオブジェクト
 * @returns 送信可能かどうか
 */
function isTextBasedChannel(channel: any): channel is TextChannel | DMChannel | NewsChannel | ThreadChannel {
  return channel && typeof channel.send === 'function';
}

/**
 * 既存のメッセージを編集する
 * @param message 編集するメッセージオブジェクト
 * @param newContent 新しい内容
 * @returns Promise<Message | null> 編集されたメッセージオブジェクトまたはnull
 */
export async function editMessage(message: Message, newContent: string): Promise<Message | null> {
  try {
    // Discordのメッセージ長制限（2000文字）を考慮
    if (newContent.length > 2000) {
      const chunks = splitMessage(newContent);
      // 最初のチャンクでメッセージを編集
      const editedMessage = await message.edit(chunks[0]);

      // 残りのチャンクがあれば、追加のメッセージとして送信
      if (chunks.length > 1) {
        for (let i = 1; i < chunks.length; i++) {
          try {
            await message.reply(chunks[i]);
          } catch (error) {
            console.warn("Failed to reply with additional chunk, trying channel.send", error);
            try {
              // チャンネルがメッセージを送信できるか確認
              if (message.channel && isTextBasedChannel(message.channel)) {
                await message.channel.send(chunks[i]);
              } else {
                console.warn("Channel does not support sending messages");
              }
            } catch (sendError) {
              console.error("Failed to send additional chunk to channel", sendError);
            }
          }
        }
      }

      return editedMessage;
    } else {
      return await message.edit(newContent);
    }
  } catch (error) {
    console.error("Failed to edit message:", error);
    return null;
  }
}

/**
 * 長いメッセージを複数のチャンクに分割する
 * @param text 分割するテキスト
 * @param maxLength 最大長（デフォルト1900文字）
 * @returns 分割されたテキストの配列
 */
function splitMessage(text: string, maxLength: number = 1900): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  // 行ごとに分割し、チャンクに追加
  const lines = text.split('\n');
  for (const line of lines) {
    // 現在のチャンクに行を追加するとmaxLengthを超える場合
    if (currentChunk.length + line.length + 1 > maxLength) {
      // 現在のチャンクが空でなければ追加
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // 行自体が長すぎる場合は分割
      if (line.length > maxLength) {
        let remainingLine = line;
        while (remainingLine.length > 0) {
          const chunk = remainingLine.substring(0, maxLength);
          chunks.push(chunk);
          remainingLine = remainingLine.substring(maxLength);
        }
      } else {
        currentChunk = line;
      }
    } else {
      // 現在のチャンクに行を追加
      if (currentChunk.length > 0) {
        currentChunk += '\n';
      }
      currentChunk += line;
    }
  }

  // 最後のチャンクを追加
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
