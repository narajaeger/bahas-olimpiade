const crypto = require('crypto');
const https = require('https');
const { getBearerToken, getUserByToken, sendJson, readBody, createOrder } = require('../_lib');

const VALID_BIDANG = {
  osn: ['matematika', 'fisika', 'kimia', 'biologi', 'informatika', 'astronomi', 'ekonomi', 'kebumian', 'geografi'],
  'osn-smp': ['matematika', 'ipa', 'ips'],
  'osn-sd': ['matematika', 'ipa'],
  onmipa: ['matematika', 'fisika', 'kimia', 'biologi'],
};

const PRICE = 25000;

function buildHeaders(va, apiKey, body) {
  const bodyStr = JSON.stringify(body);
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
  const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;
  const signature = crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return { 'Content-Type': 'application/json', va, signature, timestamp };
}

async function iPaymuPost(body) {
  const va = process.env.IPAYMU_VA;
  const apiKey = process.env.IPAYMU_API_KEY;
  if (!va || !apiKey) throw new Error('IPAYMU_VA dan IPAYMU_API_KEY belum diset di environment variables.');

  const sandbox = process.env.IPAYMU_SANDBOX !== 'false';
  const host = sandbox ? 'sandbox.ipaymu.com' : 'my.ipaymu.com';
  const bodyStr = JSON.stringify(body);
  const headers = buildHeaders(va, apiKey, body);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: host,
        path: '/api/v2/payment',
        method: 'POST',
        headers: { ...headers, Accept: 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Respons iPaymu tidak valid: ' + data)); }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const token = getBearerToken(req);
  const user = await getUserByToken(token);
  if (!user) return sendJson(res, 401, { error: 'Tidak terautentikasi.' });

  const body = await readBody(req);
  const o = String(body.olympiad || '').toLowerCase();
  const b = String(body.bidang || '').toLowerCase();

  if (!VALID_BIDANG[o] || !VALID_BIDANG[o].includes(b))
    return sendJson(res, 400, { error: 'Olympiad atau bidang tidak valid.' });

  const referenceId = `BO-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
  const bidangLabel = ['ipa', 'ips'].includes(b) ? b.toUpperCase() : b.charAt(0).toUpperCase() + b.slice(1);

  try {
    await createOrder(referenceId, user.email, o, b, PRICE);
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }

  let result;
  try {
    result = await iPaymuPost({
      product: [`${o.toUpperCase()} ${bidangLabel} — 1 Bulan`],
      qty: [1],
      price: [PRICE],
      amount: PRICE,
      returnUrl: `${siteUrl}/payment-success.html`,
      cancelUrl: `${siteUrl}/dashboard.html`,
      notifyUrl: `${siteUrl}/api/payment/notify`,
      referenceId,
      buyerName: user.name || user.email,
      buyerEmail: user.email,
      buyerPhone: '08000000000',
    });
  } catch (err) {
    return sendJson(res, 500, { error: 'Gagal menghubungi payment gateway: ' + err.message });
  }

  if (result.Status !== 200) {
    return sendJson(res, 400, { error: result.Message || 'Gagal membuat pembayaran.' });
  }

  return sendJson(res, 200, { paymentUrl: result.Data?.Url });
};
