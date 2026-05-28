const { sendJson, fulfillOrder } = require('../_lib');

// Parses JSON or URL-encoded body (iPaymu may send either format).
function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve({});
      try { return resolve(JSON.parse(data)); } catch (_) {}
      const out = {};
      try { new URLSearchParams(data).forEach((v, k) => (out[k] = v)); } catch (_) {}
      resolve(out);
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

  const body = await parseBody(req);

  // iPaymu notify fields (supports both camelCase and snake_case)
  const trxId = body.trxId || body.trx_id || '';
  const status = String(body.status || '');
  const referenceId = body.referenceId || body.reference_id || '';

  // Only process status=1 (berhasil/paid)
  if (status !== '1') return sendJson(res, 200, { message: 'ok' });
  if (!referenceId) return sendJson(res, 400, { error: 'Missing referenceId' });

  try {
    const order = await fulfillOrder(referenceId, trxId);
    if (!order) {
      // Already fulfilled or not found — still return 200 so iPaymu stops retrying
      return sendJson(res, 200, { message: 'ok' });
    }
    return sendJson(res, 200, { message: 'subscription activated' });
  } catch (err) {
    console.error('[notify] fulfillOrder error:', err);
    return sendJson(res, 500, { error: 'Internal error' });
  }
};
