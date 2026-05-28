const {
  getBearerToken,
  getUserByToken,
  getSubscriptions,
  addSubscription,
  readBody,
  sendJson,
} = require('./_lib');

const VALID_BIDANG = {
  osn: ['matematika', 'fisika', 'kimia', 'biologi', 'informatika', 'astronomi', 'ekonomi', 'kebumian', 'geografi'],
  'osn-smp': ['matematika', 'ipa', 'ips'],
  'osn-sd': ['matematika', 'ipa'],
  onmipa: ['matematika', 'fisika', 'kimia', 'biologi'],
};

module.exports = async (req, res) => {
  const token = getBearerToken(req);
  const user = await getUserByToken(token);
  if (!user) return sendJson(res, 401, { error: 'Tidak terautentikasi.' });

  if (req.method === 'GET') {
    return sendJson(res, 200, { subscriptions: await getSubscriptions(user.email) });
  }

  if (req.method === 'POST') {
    try {
      const { olympiad, bidang } = await readBody(req);
      if (!olympiad || !bidang)
        return sendJson(res, 400, { error: 'Olympiad dan bidang wajib diisi.' });

      const o = String(olympiad).toLowerCase();
      const b = String(bidang).toLowerCase();
      if (!VALID_BIDANG[o] || !VALID_BIDANG[o].includes(b))
        return sendJson(res, 400, { error: 'Olympiad atau bidang tidak valid.' });

      // NOTE: In production, integrate payment gateway (Midtrans/Xendit)
      // and only call addSubscription after successful payment webhook.
      await addSubscription(user.email, o, b);
      return sendJson(res, 200, { subscriptions: await getSubscriptions(user.email) });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
};
