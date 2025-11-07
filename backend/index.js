const path = require('path');
const http = require('http');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const apiRouter = require('./routes/api');
const { initTelegramBot } = require('./services/telegramBot');
const { startSchedulers } = require('./jobs/scheduler');
const twitterPoster = require('./services/twitterPoster');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: process.env.SOCKET_PATH || '/socket.io',
});

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api', apiRouter());

const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'metapulse-wow.html'));
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 3000;

const telegramBot = initTelegramBot(io);
startSchedulers({ io, telegramBot, twitterPoster });

server.listen(port, () => {
  console.log(`MetaPulse backend running on port ${port}`);
});

process.on('SIGINT', () => {
  telegramBot.teardown();
  server.close(() => {
    process.exit(0);
  });
});


