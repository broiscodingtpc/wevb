const { RateLimiterMemory } = require('rate-limiter-flexible');
const { TwitterApi } = require('twitter-api-v2');

const config = {
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_KEY_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};

const limiter = new RateLimiterMemory({
  keyPrefix: 'mp-twitter',
  points: 3,
  duration: 24 * 60 * 60,
});

let client = null;
if (config.appKey && config.appSecret && config.accessToken && config.accessSecret) {
  client = new TwitterApi({
    appKey: config.appKey,
    appSecret: config.appSecret,
    accessToken: config.accessToken,
    accessSecret: config.accessSecret,
  });
} else {
  console.warn('Twitter credentials missing. Auto-posting disabled.');
}

async function publishUpdate(text) {
  if (!client) {
    console.warn('Twitter client unavailable; skipping post.');
    return { skipped: true };
  }
  if (!text || !text.trim()) {
    throw new Error('tweet_empty');
  }

  await limiter.consume('global');
  try {
    const tweet = await client.v2.tweet(text.trim());
    const status = await limiter.get('global');
    return {
      id: tweet.data?.id,
      rateLimit: status ? Math.max(0, limiter.points - status.consumedPoints) : limiter.points,
    };
  } catch (err) {
    limiter.reward('global', 1);
    throw err;
  }
}

function remainingQuota() {
  return limiter
    .get('global')
    .then((state) => (state ? Math.max(0, limiter.points - state.consumedPoints) : limiter.points));
}

module.exports = {
  publishUpdate,
  remainingQuota,
};


