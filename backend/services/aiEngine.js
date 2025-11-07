const axios = require('axios');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const API_KEY = process.env.METAPULSE_AI_KEY;
const BASE_URL = process.env.METAPULSE_AI_URL || 'https://api.deepseek.com/v1';

const limiter = new RateLimiterMemory({
  keyPrefix: 'mp-ai',
  points: 3,
  duration: 24 * 60 * 60,
});

const model = process.env.METAPULSE_AI_MODEL || 'deepseek-chat';

function formatPrompt(tokens) {
  const table = tokens
    .slice(0, 8)
    .map((token, index) => `#${index + 1} ${token.symbol} (${token.name}) | Price $${token.priceUsd.toFixed(4)} | 24h Δ ${token.change24h.toFixed(2)}% | Vol24h $${token.volume24hUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`)
    .join('\n');

  return `You are the MetaPulse Insight Engine. Analyse the following Solana-centric token signals and respond with strict JSON.

Tokens:\n${table}

Return JSON with keys: summary (string, 2 sentences), insights (array of objects with keys symbol, insight, confidence(0-1)), risk (string, 1 short sentence), nextSteps (array of action strings). Keep tone precise, neutral.
`;
}

async function requestInsight(tokens) {
  if (!API_KEY) {
    throw new Error('meta_ai_key_missing');
  }

  const prompt = formatPrompt(tokens);

  const response = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model,
      messages: [
        {
          role: 'system',
          content: 'MetaPulse Insight Engine delivers concise market diagnostics. Always reply with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('meta_ai_empty_response');
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    return {
      summary: content,
      insights: tokens.slice(0, 3).map((token) => ({
        symbol: token.symbol,
        insight: 'Insight engine returned plain-text summary; manual follow-up recommended.',
        confidence: 0.4,
      })),
      risk: 'Unable to parse structured response; treat with caution.',
      nextSteps: ['Retry analysis later'],
    };
  }
}

async function generateInsight(tokens, meta = {}) {
  if (!tokens || !tokens.length) {
    throw new Error('tokens_required');
  }

  await limiter.consume('global');
  try {
    const data = await requestInsight(tokens);
    const rlState = await limiter.get('global');
    return {
      ...data,
      meta: {
        generatedAt: new Date().toISOString(),
        requestId: meta.requestId || null,
        limiter: {
          remainingToday: rlState ? Math.max(0, limiter.points - rlState.consumedPoints) : limiter.points,
        },
      },
    };
  } catch (err) {
    limiter.reward('global', 1);
    throw err;
  }
}

function getRateLimitStatus() {
  return limiter;
}

module.exports = {
  generateInsight,
  getRateLimitStatus,
};


