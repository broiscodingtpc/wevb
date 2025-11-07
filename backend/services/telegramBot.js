const { Telegraf } = require('telegraf');

const store = require('../store');
const sessionLinker = require('./sessionLinker');
const dexService = require('./dexScreener');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BROADCAST_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function formatSignal(signal) {
  if (!signal) {
    return 'No insights available yet.';
  }
  const lines = [];
  lines.push(`MetaPulse Signal Update — ${new Date(signal.meta?.generatedAt || Date.now()).toLocaleString()}`);
  if (signal.summary) lines.push(`Summary: ${signal.summary}`);
  if (Array.isArray(signal.insights) && signal.insights.length) {
    lines.push('Insights:');
    signal.insights.forEach((item) => {
      lines.push(`- ${item.symbol}: ${item.insight} (confidence ${(item.confidence * 100).toFixed(0)}%)`);
    });
  }
  lines.push(`Risk: ${signal.risk || 'N/A'}`);
  if (Array.isArray(signal.nextSteps) && signal.nextSteps.length) {
    lines.push('Next steps:');
    signal.nextSteps.forEach((step) => lines.push(`• ${step}`));
  }
  return lines.join('\n');
}

function initTelegramBot(io) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token missing; bot disabled.');
    return {
      notifyChannel: () => {},
      teardown: () => {},
    };
  }

  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

  bot.catch((err, ctx) => {
    const description = err?.description || err?.message || 'Unknown Telegram error';
    console.warn('Telegram bot error:', description, 'context:', ctx?.update?.update_id);
  });

  bot.start((ctx) => {
    ctx.reply(
      'MetaPulse Bot online. Use /signals for latest insights, /top for volume leaders, /link to connect your web session.'
    );
  });

  bot.command('signals', async (ctx) => {
    const latest = store.getSignals()[0];
    ctx.reply(formatSignal(latest));
  });

  bot.command('top', async (ctx) => {
    try {
      const snapshot = store.getMarketSnapshot();
      if (!snapshot.tokens.length) {
        const fresh = await dexService.fetchLatestProfiles();
        store.setMarketSnapshot(fresh.tokens);
      }
      const volumeLeaders = store.getMarketSnapshot().highlights?.volumeLeaders || [];
      const lines = volumeLeaders
        .map((token, idx) => `#${idx + 1} ${token.symbol} — $${token.volume24hUsd.toLocaleString()} / 24h Δ ${token.change24h.toFixed(1)}%`)
        .join('\n');
      ctx.reply(lines || 'No data available.');
    } catch (err) {
      ctx.reply('Unable to fetch data at the moment.');
    }
  });

  bot.command('link', (ctx) => {
    const chatProfile = {
      chatId: ctx.chat.id,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
    };
    const { code, expiresAt } = sessionLinker.createLinkCode(chatProfile.chatId, chatProfile);
    const message = `Session link code: ${code}\nExpires at ${new Date(expiresAt).toLocaleTimeString()}\nEnter this code inside the MetaPulse Console to link your session.`;
    ctx.reply(message);
  });

  bot.launch().then(() => {
    console.log('Telegram bot online');
  }).catch((err) => {
    console.error('Failed to launch Telegram bot', err.message);
  });

  const notifyChannel = async (signal) => {
    if (!BROADCAST_CHAT_ID) {
      return;
    }
    try {
      await bot.telegram.sendMessage(BROADCAST_CHAT_ID, formatSignal(signal));
    } catch (err) {
      console.error('Failed to broadcast signal to Telegram channel', err.message);
    }
  };

  const signalListener = (signals) => {
    const latest = signals[0];
    if (latest) {
      io.emit('signals:update', latest);
    }
  };

  store.events.on('signals:update', signalListener);

  function teardown() {
    store.events.off('signals:update', signalListener);
    bot.stop('SIGINT');
  }

  return {
    notifyChannel,
    teardown,
  };
}

module.exports = {
  initTelegramBot,
};


