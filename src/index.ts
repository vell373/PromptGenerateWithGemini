import express from 'express';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

// bot.tsからmain関数をインポート
import './bot';

// 環境変数の読み込み
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Webサーバーの設定
app.get('/', (req: Request, res: Response) => {
  res.send('Prompt Builder Bot is running!');
});

// Webサーバーの起動
app.listen(port, () => {
  console.log(`Web server running at http://localhost:${port}`);
});
