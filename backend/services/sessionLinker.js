const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const store = require('../store');

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-meta';

function createLinkCode(chatId, profile = {}) {
  return store.createLinkCode({ chatId, ...profile });
}

function consumeLinkCode(code) {
  return store.consumeLinkCode(code);
}

function createSession(chatProfile) {
  const sessionId = uuid();
  const payload = {
    sessionId,
    chatId: chatProfile.chatId,
    username: chatProfile.username || null,
    firstName: chatProfile.firstName || null,
  };
  const token = jwt.sign(payload, SESSION_SECRET, { expiresIn: '7d' });
  store.registerSession(sessionId, payload);
  return { token, profile: payload };
}

function revokeSession(sessionId) {
  store.revokeSession(sessionId);
}

function getProfile(sessionId) {
  return store.getProfile(sessionId);
}

function getSessionSecret() {
  return SESSION_SECRET;
}

module.exports = {
  createLinkCode,
  consumeLinkCode,
  createSession,
  revokeSession,
  getProfile,
  getSessionSecret,
};


