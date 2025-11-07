const express = require('express');
const jwt = require('jsonwebtoken');

const store = require('../store');
const sessionLinker = require('../services/sessionLinker');
const dexService = require('../services/dexScreener');

const SESSION_COOKIE = 'mp_session';

const buildAuthMiddleware = () => {
  return (req, res, next) => {
    const token = req.cookies?.[SESSION_COOKIE] || req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'not_authorized' });
    }
    try {
      const payload = jwt.verify(token, sessionLinker.getSessionSecret());
      req.session = payload;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'invalid_session' });
    }
  };
};

module.exports = () => {
  const router = express.Router();
  const requireAuth = buildAuthMiddleware();

  router.get('/signals', (_req, res) => {
    res.json({ data: store.getSignals() });
  });

  router.get('/market', async (_req, res) => {
    try {
      const snapshot = store.getMarketSnapshot();
      if (!snapshot || !snapshot.tokens || !snapshot.tokens.length) {
        const tokens = await dexService.fetchLatestProfiles();
        store.setMarketSnapshot(tokens);
      }
      res.json({ data: store.getMarketSnapshot() });
    } catch (err) {
      res.status(500).json({ error: 'market_unavailable' });
    }
  });

  router.post('/link-telegram', async (req, res) => {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'code_required' });
    }
    try {
      const chatProfile = sessionLinker.consumeLinkCode(code.trim());
      if (!chatProfile) {
        return res.status(404).json({ error: 'code_invalid' });
      }
      const session = sessionLinker.createSession(chatProfile);
      res.cookie(SESSION_COOKIE, session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ data: session.profile });
    } catch (err) {
      res.status(500).json({ error: 'link_failed' });
    }
  });

  router.post('/unlink', requireAuth, (req, res) => {
    sessionLinker.revokeSession(req.session.sessionId);
    res.clearCookie(SESSION_COOKIE);
    res.json({ status: 'unlinked' });
  });

  router.get('/me', requireAuth, (req, res) => {
    const profile = sessionLinker.getProfile(req.session.sessionId);
    res.json({ data: profile });
  });

  router.get('/insights/latest', (_req, res) => {
    const latest = store.getSignals()[0] || null;
    res.json({ data: latest });
  });

  return router;
};


