const { EventEmitter } = require('events');
const { v4: uuid } = require('uuid');

const signals = [];
let marketSnapshot = { tokens: [], fetchedAt: null };

const linkCodes = new Map();
const sessions = new Map();

const emitter = new EventEmitter();

const SIGNAL_LIMIT = 20;

function addSignal(signal) {
  signals.unshift({ ...signal, id: uuid(), createdAt: new Date().toISOString() });
  while (signals.length > SIGNAL_LIMIT) {
    signals.pop();
  }
  emitter.emit('signals:update', getSignals());
}

function getSignals() {
  return signals.map((signal) => ({ ...signal }));
}

function setMarketSnapshot(snapshot) {
  const tokens = Array.isArray(snapshot)
    ? snapshot
    : Array.isArray(snapshot?.tokens)
    ? snapshot.tokens
    : [];
  marketSnapshot = {
    tokens,
    highlights: snapshot?.highlights || null,
    sourceTimestamp: snapshot?.sourceTimestamp || null,
    fetchedAt: new Date().toISOString(),
  };
  emitter.emit('market:update', marketSnapshot);
}

function getMarketSnapshot() {
  return marketSnapshot;
}

function createLinkCode(chatProfile) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const timeout = setTimeout(() => {
    linkCodes.delete(code);
  }, 5 * 60 * 1000);
  linkCodes.set(code, { ...chatProfile, expiresAt, timeout });
  return { code, expiresAt };
}

function consumeLinkCode(code) {
  const entry = linkCodes.get(code);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt < Date.now()) {
    clearTimeout(entry.timeout);
    linkCodes.delete(code);
    return null;
  }
  clearTimeout(entry.timeout);
  linkCodes.delete(code);
  const { timeout, ...profile } = entry;
  return profile;
}

function registerSession(sessionId, profile) {
  sessions.set(sessionId, { ...profile, sessionId, linkedAt: new Date().toISOString() });
}

function getProfile(sessionId) {
  return sessions.get(sessionId) || null;
}

function revokeSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  addSignal,
  getSignals,
  setMarketSnapshot,
  getMarketSnapshot,
  createLinkCode,
  consumeLinkCode,
  registerSession,
  getProfile,
  revokeSession,
  events: emitter,
};


