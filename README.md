# MetaPulse AI - Signal Console

Human-grade market intelligence for Solana.

## Features

- Aurora background with animated gradients
- PillNav with smooth GSAP hover effects
- MagicBento interactive cards (particles, tilt, magnetism, ripple)
- Real-time signal console synced with MetaPulse Bot
- AI-powered analytics with daily rate limits
- Non-custodial wallet demo
- Telegram bot + Twitter broadcast integration

## Tech Stack

- Pure HTML/CSS/JavaScript front-end
- GSAP for animations
- Express.js + Socket.IO backend
- Telegraf for Telegram bot automation
- DexScreener integration for market data
- Twitter API v2 for scheduled posts
- Railway ready

## Development

```bash
npm install
npm start
```

Server will run on `http://localhost:3000`

## Deployment

This project is configured for Railway deployment:

1. Push to GitHub
2. Connect to Railway
3. Deploy automatically

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `SESSION_SECRET` - Secret for signing session tokens
- `METAPULSE_AI_KEY` - Private key for the MetaPulse insight engine
- `METAPULSE_AI_URL` - Optional override for the insight engine endpoint
- `METAPULSE_AI_MODEL` - Optional override for the insight model id
- `DEXSCREENER_API_URL` - DexScreener profiles endpoint
- `TELEGRAM_BOT_TOKEN` - Token for the MetaPulse Telegram bot
- `TELEGRAM_CHAT_ID` - Channel/chat for broadcast updates
- `TWITTER_API_KEY` / `TWITTER_API_KEY_SECRET`
- `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_TOKEN_SECRET`
- `CORS_ORIGIN` - Optional comma-separated origins for API access
- `SOCKET_PATH` - Optional custom path for Socket.IO

## License

MIT

