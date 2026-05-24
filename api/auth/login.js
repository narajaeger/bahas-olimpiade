const { verifyUser, readBody, sendJson } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  try {
    const { email, password } = await readBody(req);
    if (!email || !password) return sendJson(res, 400, { error: 'Lengkapi email dan password.' });

    const cleanEmail = String(email).trim().toLowerCase();
    const result = await verifyUser(cleanEmail, password);
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 401, { error: err.message });
  }
};
