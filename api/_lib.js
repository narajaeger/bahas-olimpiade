// Shared helpers for serverless functions
// In-memory store (resets on cold start). For production, swap with a real DB:
// e.g. Vercel KV, Postgres, Upstash Redis, Supabase.

const crypto = require('crypto');

// NOTE: a true "shared" store across serverless invocations needs an external DB.
// Below we use globalThis to keep it for the lifetime of the lambda instance.

if (!globalThis.__BO_STORE__) {
  globalThis.__BO_STORE__ = {
    users: new Map(),         // email -> { name, email, passwordHash, salt }
    tokens: new Map(),        // token -> email
    subscriptions: new Map(), // email -> [ { olympiad, bidang, expiresAt } ]
  };
}

const store = globalThis.__BO_STORE__;

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function createUser(name, email, password) {
  if (store.users.has(email)) {
    throw new Error('Email sudah terdaftar.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  store.users.set(email, { name, email, passwordHash, salt });
  return issueToken(email);
}

function verifyUser(email, password) {
  const u = store.users.get(email);
  if (!u) throw new Error('Email atau password salah.');
  const passwordHash = hashPassword(password, u.salt);
  if (passwordHash !== u.passwordHash) throw new Error('Email atau password salah.');
  return issueToken(email);
}

function issueToken(email) {
  const token = crypto.randomBytes(24).toString('hex');
  store.tokens.set(token, email);
  const u = store.users.get(email);
  return { token, email, name: u?.name };
}

function getUserByToken(token) {
  if (!token) return null;
  const email = store.tokens.get(token);
  if (!email) return null;
  return store.users.get(email);
}

function getSubscriptions(email) {
  const now = Date.now();
  const subs = store.subscriptions.get(email) || [];
  return subs.filter((s) => new Date(s.expiresAt).getTime() > now);
}

function addSubscription(email, olympiad, bidang) {
  const subs = store.subscriptions.get(email) || [];
  const now = Date.now();
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  // Extend if already exists
  const existing = subs.find(
    (s) => s.olympiad === olympiad && s.bidang === bidang && new Date(s.expiresAt).getTime() > now
  );
  if (existing) {
    existing.expiresAt = new Date(new Date(existing.expiresAt).getTime() + oneMonth).toISOString();
  } else {
    subs.push({
      olympiad,
      bidang,
      expiresAt: new Date(now + oneMonth).toISOString(),
    });
  }
  store.subscriptions.set(email, subs);
  return subs;
}

function hasActiveSubscription(email, olympiad, bidang) {
  return getSubscriptions(email).some(
    (s) => s.olympiad === olympiad && s.bidang === bidang
  );
}

function getBearerToken(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth) return null;
  const parts = auth.split(' ');
  return parts[1] || null;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports = {
  createUser,
  verifyUser,
  getUserByToken,
  getSubscriptions,
  addSubscription,
  hasActiveSubscription,
  getBearerToken,
  sendJson,
  readBody,
};
