import { Bot, InlineKeyboard, session } from 'grammy';
import type { BotContext, SessionData } from './types.js';
import * as store from './store.js';
import * as api from './api.js';

function helpText(): string {
  return (
    'Bethflow Bot\n\n' +
    '/login — Masuk ke akun Bethflow\n' +
    '/logout — Keluar\n' +
    '/boards — Lihat semua boards\n' +
    '/board N — Lihat lists di board ke-N\n' +
    '/cards N — Lihat cards di list ke-N\n' +
    '/addcard — Tambah card baru\n' +
    '/cancel — Batalkan operasi aktif\n' +
    '/help — Tampilkan bantuan ini'
  );
}

function handleApiError(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };
  return e.response?.data?.error?.message ?? e.message ?? 'Error tidak diketahui';
}

function isUnauthorized(err: unknown): boolean {
  const e = err as { response?: { status?: number } };
  return e.response?.status === 401;
}

export function createBot(botToken: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(botToken);

  bot.use(session<SessionData, BotContext>({ initial: (): SessionData => ({}) }));

  // /start & /help
  bot.command(['start', 'help'], async (ctx) => {
    await ctx.reply(helpText());
  });

  // /cancel
  bot.command('cancel', async (ctx) => {
    ctx.session.conv = undefined;
    await ctx.reply('Operasi dibatalkan.');
  });

  // /login
  bot.command('login', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    if (store.getToken(chatId)) {
      await ctx.reply('Kamu sudah login. Ketik /logout untuk keluar terlebih dahulu.');
      return;
    }
    ctx.session.conv = { cmd: 'login', step: 'email' };
    await ctx.reply('Masukkan email akun Bethflow kamu:');
  });

  // /logout
  bot.command('logout', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const token = store.getToken(chatId);
    if (!token) {
      await ctx.reply('Kamu belum login.');
      return;
    }
    try {
      await api.revokeToken(token);
    } catch {
      // token might already be expired — continue
    }
    store.deleteToken(chatId);
    ctx.session.conv = undefined;
    ctx.session.boardsCache = undefined;
    ctx.session.boardDetail = undefined;
    await ctx.reply('Berhasil logout.');
  });

  // /boards
  bot.command('boards', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const token = store.getToken(chatId);
    if (!token) {
      await ctx.reply('Kamu belum login. Ketik /login terlebih dahulu.');
      return;
    }
    try {
      const boards = await api.getBoards(token);
      if (!boards.length) {
        await ctx.reply('Kamu belum punya board.');
        return;
      }
      ctx.session.boardsCache = boards;
      const lines = boards.map((b, i) => `${i + 1}. ${b.title}${b.isPublic ? ' (publik)' : ''}`);
      await ctx.reply(
        `Boards kamu (${boards.length}):\n\n${lines.join('\n')}\n\n` +
          'Ketik /board N untuk melihat lists.',
      );
    } catch (err) {
      if (isUnauthorized(err)) {
        store.deleteToken(chatId);
        await ctx.reply('Sesi habis. Silakan /login kembali.');
      } else {
        await ctx.reply(`Gagal memuat boards: ${handleApiError(err)}`);
      }
    }
  });

  // /board N
  bot.command('board', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const token = store.getToken(chatId);
    if (!token) {
      await ctx.reply('Kamu belum login. Ketik /login terlebih dahulu.');
      return;
    }
    const n = parseInt(ctx.match ?? '', 10);
    const boards = ctx.session.boardsCache;
    if (!boards || isNaN(n) || n < 1 || n > boards.length) {
      await ctx.reply('Nomor tidak valid. Ketik /boards untuk melihat daftar board.');
      return;
    }
    try {
      const detail = await api.getBoardDetail(token, boards[n - 1]!.id);
      ctx.session.boardDetail = detail;
      if (!detail.lists.length) {
        await ctx.reply(`Board "${detail.title}" belum punya list.`);
        return;
      }
      const lines = detail.lists.map((l, i) => `${i + 1}. ${l.title} (${l.cards.length} cards)`);
      await ctx.reply(
        `Board: ${detail.title}\n\nLists:\n${lines.join('\n')}\n\n` +
          'Ketik /cards N untuk melihat cards.',
      );
    } catch (err) {
      if (isUnauthorized(err)) {
        store.deleteToken(chatId);
        await ctx.reply('Sesi habis. Silakan /login kembali.');
      } else {
        await ctx.reply(`Gagal memuat board: ${handleApiError(err)}`);
      }
    }
  });

  // /cards N
  bot.command('cards', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    if (!store.getToken(chatId)) {
      await ctx.reply('Kamu belum login.');
      return;
    }
    const n = parseInt(ctx.match ?? '', 10);
    const detail = ctx.session.boardDetail;
    if (!detail || isNaN(n) || n < 1 || n > detail.lists.length) {
      await ctx.reply('Nomor tidak valid. Ketik /board N terlebih dahulu untuk memilih board.');
      return;
    }
    const list = detail.lists[n - 1]!;
    if (!list.cards.length) {
      await ctx.reply(`List "${list.title}" kosong.`);
      return;
    }
    const lines = list.cards.map((c, i) => {
      const desc = c.description ? `\n   ${c.description.slice(0, 100)}` : '';
      return `${i + 1}. ${c.title}${desc}`;
    });
    await ctx.reply(`Cards di "${list.title}" (${list.cards.length}):\n\n${lines.join('\n\n')}`);
  });

  // /addcard — show board selection
  bot.command('addcard', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const token = store.getToken(chatId);
    if (!token) {
      await ctx.reply('Kamu belum login. Ketik /login terlebih dahulu.');
      return;
    }
    try {
      const boards = await api.getBoards(token);
      if (!boards.length) {
        await ctx.reply('Kamu belum punya board.');
        return;
      }
      ctx.session.boardsCache = boards;
      ctx.session.conv = { cmd: 'addcard', step: 'pick_board' };

      const kb = new InlineKeyboard();
      boards.slice(0, 20).forEach((b, i) => {
        kb.text(b.title.slice(0, 30), `ab_${i}`);
        if ((i + 1) % 2 === 0) kb.row();
      });
      if (boards.length % 2 !== 0) kb.row();

      await ctx.reply('Pilih board:', { reply_markup: kb });
    } catch (err) {
      if (isUnauthorized(err)) {
        store.deleteToken(chatId);
        await ctx.reply('Sesi habis. Silakan /login kembali.');
      } else {
        await ctx.reply(`Gagal memuat boards: ${handleApiError(err)}`);
      }
    }
  });

  // Callback: board selected (ab_N)
  bot.callbackQuery(/^ab_\d+$/, async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      await ctx.answerCallbackQuery();
      return;
    }
    const token = store.getToken(chatId);
    if (!token) {
      await ctx.answerCallbackQuery('Sesi habis. Ketik /login.');
      return;
    }

    const idx = parseInt(ctx.callbackQuery.data.slice(3), 10);
    const boards = ctx.session.boardsCache;
    if (!boards || idx < 0 || idx >= boards.length) {
      await ctx.answerCallbackQuery('Data tidak valid.');
      return;
    }

    await ctx.answerCallbackQuery();
    const board = boards[idx]!;

    try {
      const detail = await api.getBoardDetail(token, board.id);
      ctx.session.boardDetail = detail;

      if (!detail.lists.length) {
        ctx.session.conv = undefined;
        await ctx.editMessageText(`Board "${board.title}" belum punya list.`);
        return;
      }

      ctx.session.conv = { cmd: 'addcard', step: 'pick_list', boardId: board.id, boardTitle: board.title };

      const kb = new InlineKeyboard();
      detail.lists.forEach((l, i) => {
        kb.text(l.title.slice(0, 30), `al_${i}`);
        if ((i + 1) % 2 === 0) kb.row();
      });
      if (detail.lists.length % 2 !== 0) kb.row();

      await ctx.editMessageText(`Board: ${board.title}\nPilih list:`, { reply_markup: kb });
    } catch (err) {
      if (isUnauthorized(err)) {
        store.deleteToken(chatId);
        await ctx.editMessageText('Sesi habis. Silakan /login kembali.');
      } else {
        await ctx.editMessageText(`Gagal memuat board: ${handleApiError(err)}`);
      }
    }
  });

  // Callback: list selected (al_N)
  bot.callbackQuery(/^al_\d+$/, async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      await ctx.answerCallbackQuery();
      return;
    }

    const conv = ctx.session.conv;
    if (conv?.cmd !== 'addcard' || conv.step !== 'pick_list') {
      await ctx.answerCallbackQuery('Sesi tidak aktif. Ketik /addcard ulang.');
      return;
    }

    const idx = parseInt(ctx.callbackQuery.data.slice(3), 10);
    const detail = ctx.session.boardDetail;
    if (!detail || idx < 0 || idx >= detail.lists.length) {
      await ctx.answerCallbackQuery('Data tidak valid.');
      return;
    }

    await ctx.answerCallbackQuery();
    const list = detail.lists[idx]!;

    ctx.session.conv = {
      cmd: 'addcard',
      step: 'card_title',
      boardId: conv.boardId,
      boardTitle: conv.boardTitle,
      listId: list.id,
      listTitle: list.title,
    };

    await ctx.editMessageText(
      `Board: ${conv.boardTitle}\nList: ${list.title}\n\nKetik judul card baru:`,
      { reply_markup: { inline_keyboard: [] } },
    );
  });

  // Text message handler — multi-step conversations
  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return; // command handlers handle these

    const conv = ctx.session.conv;
    if (!conv) return;

    // Login flow
    if (conv.cmd === 'login') {
      if (conv.step === 'email') {
        ctx.session.conv = { cmd: 'login', step: 'password', email: text };
        await ctx.reply('Masukkan password kamu:');
        return;
      }
      if (conv.step === 'password') {
        const email = conv.email;
        ctx.session.conv = undefined;
        try {
          const result = await api.login(email, text);
          store.setToken(chatId, result.token);
          await ctx.reply(
            `Login berhasil! Selamat datang, ${result.displayName ?? result.username}.`,
          );
        } catch (err) {
          const msg = handleApiError(err);
          await ctx.reply(`Login gagal: ${msg}\n\nCoba lagi dengan /login.`);
        }
        return;
      }
    }

    // Add card — title step
    if (conv.cmd === 'addcard' && conv.step === 'card_title') {
      const token = store.getToken(chatId);
      if (!token) {
        ctx.session.conv = undefined;
        await ctx.reply('Sesi habis. Ketik /login kembali.');
        return;
      }
      ctx.session.conv = undefined;
      try {
        const card = await api.createCard(token, conv.listId, text);
        await ctx.reply(
          `Card berhasil dibuat!\n\nJudul: ${card.title}\nList: ${conv.listTitle}\nBoard: ${conv.boardTitle}`,
        );
      } catch (err) {
        if (isUnauthorized(err)) {
          store.deleteToken(chatId);
          await ctx.reply('Sesi habis. Silakan /login kembali.');
        } else {
          await ctx.reply(`Gagal membuat card: ${handleApiError(err)}`);
        }
      }
      return;
    }
  });

  return bot;
}
