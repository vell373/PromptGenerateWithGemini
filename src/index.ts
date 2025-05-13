import express from 'express';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

// 環境変数の読み込み
dotenv.config();

// bot.tsからmain関数をインポート
// 直接インポートしないように変更
import { initializeBot } from './bot';

const app = express();
const port = process.env.PORT || 3000;
let botInitialized = false;

// Webサーバーの設定
app.get('/', (req: Request, res: Response) => {
  res.send('Prompt Builder Bot is running!');
});

// ヘルスチェック用エンドポイント
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Webサーバーの起動
const server = app.listen(port, async () => {
  console.log(`Web server running at http://0.0.0.0:${port}`);
  
  // ボットがまだ初期化されていない場合のみ初期化
  if (!botInitialized) {
    try {
      console.log('Initializing Discord bot...');
      await initializeBot();
      botInitialized = true;
      console.log('Discord bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Discord bot:', error);
    }
  }
});

// シャットダウン処理
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
