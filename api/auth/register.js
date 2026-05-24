const { createUser, readBody, sendJson } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  try {
    const { name, email, password } = await readBody(req);
    if (!name || !email || !password)
      return sendJson(res, 400, { error: 'Lengkapi semua field.' });
    if (password.length < 6)
      return sendJson(res, 400, { error: 'Password minimal 6 karakter.' });

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return sendJson(res, 400, { error: 'Email tidak valid.' });

    const result = await createUser(String(name).trim(), cleanEmail, password);
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }
};
