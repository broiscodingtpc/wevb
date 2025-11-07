const cron = require('node-cron');

const store = require('../store');
const dexService = require('../services/dexScreener');
const aiEngine = require('../services/aiEngine');

const formatTweet = (insight) => {
  if (!insight) {
    return null;
  }
  const top = insight.insights?.[0];
  const summary = insight.summary || 'Signal update available.';
  const base = `MetaPulse Signal Brief — ${new Date(insight.meta?.generatedAt || Date.now()).toLocaleDateString()}`;
  const highlight = top ? `${top.symbol}: ${top.insight}` : '';
  const risk = insight.risk ? `Risk: ${insight.risk}` : '';
  const footer = '#MetaPulse #Solana';
  const text = [base, summary, highlight, risk, footer]
    .filter((line) => line && line.trim())
    .join('\n');
  return text.length <= 280 ? text : `${text.slice(0, 275)}…`;
};

async function runInsightCycle(source = 'scheduled', telegramBot, twitterPoster) {
  try {
    const latestProfiles = await dexService.fetchLatestProfiles();
    store.setMarketSnapshot(latestProfiles);

    const focusTokens = latestProfiles.tokens.slice(0, 8);
    if (!focusTokens.length) {
      return;
    }

    const insight = await aiEngine.generateInsight(focusTokens, { requestId: `${source}-${Date.now()}` });
    store.addSignal({
      source,
      summary: insight.summary,
      insights: insight.insights,
      risk: insight.risk,
      nextSteps: insight.nextSteps,
      meta: insight.meta,
    });

    if (telegramBot?.notifyChannel) {
      telegramBot.notifyChannel(insight).catch((err) => {
        console.error('Telegram notify failed', err.message);
      });
    }

    if (twitterPoster) {
      const tweet = formatTweet(insight);
      if (tweet) {
        twitterPoster
          .publishUpdate(tweet)
          .catch((err) => console.error('Twitter post failed', err.message));
      }
    }
  } catch (err) {
    console.error('Insight cycle failed', err.message);
  }
}

function startSchedulers({ io, telegramBot, twitterPoster }) {
  cron.schedule('0 0,8,16 * * *', () => runInsightCycle('cron', telegramBot, twitterPoster));

  cron.schedule('*/30 * * * *', async () => {
    try {
      const latest = await dexService.fetchLatestProfiles();
      store.setMarketSnapshot(latest);
    } catch (err) {
      console.error('Market refresh failed', err.message);
    }
  });

  (async () => {
    try {
      const latest = await dexService.fetchLatestProfiles();
      store.setMarketSnapshot(latest);
      if (latest.tokens && latest.tokens.length) {
        runInsightCycle('bootstrap', telegramBot, twitterPoster);
      }
    } catch (err) {
      console.error('Initial market snapshot failed', err.message);
    }
  })();

  store.events.on('market:update', (payload) => {
    io.emit('market:update', payload);
  });
}

module.exports = {
  startSchedulers,
};


