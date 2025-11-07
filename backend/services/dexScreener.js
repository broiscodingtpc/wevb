const axios = require('axios');

const SOURCE_URL = process.env.DEXSCREENER_API_URL || 'https://api.dexscreener.com/token-profiles/latest/v1';

const safeNumber = (value) => {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return 0;
  }
  return num;
};

const normalizeToken = (token) => {
  return {
    id: token?.id || token?.address || token?.pairAddress || token?.pairId || token?.tokenAddress || null,
    name: token?.name || token?.token?.name || 'Unknown',
    symbol: token?.symbol || token?.token?.symbol || '—',
    chain: token?.chainId || token?.chain || token?.chainType || 'unknown',
    priceUsd: safeNumber(token?.priceUsd || token?.price?.usd),
    liquidityUsd: safeNumber(token?.liquidity?.usd || token?.liquidityUsd),
    volume24hUsd: safeNumber(token?.volume?.h24 || token?.volume24hUsd),
    change24h: safeNumber(token?.priceChange?.h24 || token?.change24h),
    createdAt: token?.createdAt || token?.listedAt || null,
    marketCap: safeNumber(token?.marketCap?.usd || token?.marketCapUsd),
    url: token?.url || token?.link || null,
    score: safeNumber(token?.metaScore || token?.score),
    pools: token?.pools || [],
  };
};

const buildHighlights = (tokens) => {
  const byChange = [...tokens]
    .filter((t) => t.change24h !== null && t.change24h !== undefined)
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, 5);

  const byVolume = [...tokens]
    .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
    .slice(0, 5);

  const steady = [...tokens]
    .filter((t) => t.change24h >= 0 && t.volume24hUsd > 0)
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, 5);

  return {
    movers: byChange,
    volumeLeaders: byVolume,
    steadyGainers: steady,
  };
};

async function fetchLatestProfiles() {
  const response = await axios.get(SOURCE_URL, { timeout: 12000 });
  const payload = response.data || {};
  const entries = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.profiles) ? payload.profiles : [];
  const tokens = entries.map(normalizeToken).filter((t) => t.id);
  return {
    tokens,
    highlights: buildHighlights(tokens),
    sourceTimestamp: new Date().toISOString(),
  };
}

module.exports = {
  fetchLatestProfiles,
  buildHighlights,
};


