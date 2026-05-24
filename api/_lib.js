const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diset.');
  return createClient(url, key);
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

async function createUser(name, email, password) {
  const sb = getSupabase();
  const { data: existing } = await sb.from('users').select('email').eq('email', email).maybeSingle();
  if (existing) throw new Error('Email sudah terdaftar.');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const { error } = await sb.from('users').insert({ name, email, password_hash: passwordHash, salt });
  if (error) throw new Error('Gagal mendaftarkan akun: ' + error.message);
  return _issueToken(sb, email, name);
}

async function verifyUser(email, password) {
  const sb = getSupabase();
  const { data: u } = await sb.from('users').select('*').eq('email', email).maybeSingle();
  if (!u) throw new Error('Email atau password salah.');
  const passwordHash = hashPassword(password, u.salt);
  if (passwordHash !== u.password_hash) throw new Error('Email atau password salah.');
  return _issueToken(sb, email, u.name);
}

async function _issueToken(sb, email, name) {
  const token = crypto.randomBytes(24).toString('hex');
  await sb.from('tokens').insert({ token, email });
  return { token, email, name };
}

async function getUserByToken(token) {
  if (!token) return null;
  const sb = getSupabase();
  const { data: t } = await sb.from('tokens').select('email').eq('token', token).maybeSingle();
  if (!t) return null;
  const { data: user } = await sb.from('users').select('name, email').eq('email', t.email).maybeSingle();
  return user || null;
}

async function getSubscriptions(email) {
  const sb = getSupabase();
  const now = new Date().toISOString();
  const { data } = await sb.from('subscriptions').select('olympiad, bidang, expires_at').eq('email', email).gt('expires_at', now);
  return (data || []).map((s) => ({ olympiad: s.olympiad, bidang: s.bidang, expiresAt: s.expires_at }));
}

async function addSubscription(email, olympiad, bidang) {
  const sb = getSupabase();
  const now = new Date();
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const nowIso = now.toISOString();

  const { data: existing } = await sb
    .from('subscriptions')
    .select('id, expires_at')
    .eq('email', email)
    .eq('olympiad', olympiad)
    .eq('bidang', bidang)
    .gt('expires_at', nowIso)
    .maybeSingle();

  if (existing) {
    const newExpiry = new Date(new Date(existing.expires_at).getTime() + oneMonth).toISOString();
    await sb.from('subscriptions').update({ expires_at: newExpiry }).eq('id', existing.id);
  } else {
    const expiresAt = new Date(now.getTime() + oneMonth).toISOString();
    await sb.from('subscriptions').insert({ email, olympiad, bidang, expires_at: expiresAt });
  }

  return getSubscriptions(email);
}

async function hasActiveSubscription(email, olympiad, bidang) {
  const subs = await getSubscriptions(email);
  return subs.some((s) => s.olympiad === olympiad && s.bidang === bidang);
}

function getBearerToken(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth) return null;
  return auth.split(' ')[1] || null;
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
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
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
