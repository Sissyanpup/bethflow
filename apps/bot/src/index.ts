import { createBot } from './bot.js';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

const bot = createBot(botToken);

bot.catch((err) => {
  console.error('Bot error:', (err as Error).message);
});

console.log('Bethflow Telegram Bot is running...');
bot.start();
