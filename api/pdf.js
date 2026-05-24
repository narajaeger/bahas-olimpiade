// PDF gatekeeper.
// Rules:
// - type=soal: always free; can be viewed or downloaded
// - type=pembahasan: 2024 free; other years require active subscription for (olympiad,bidang)
// - Even when allowed, "pembahasan" is served with inline disposition + headers that
//   discourage download (combined with JS viewer which renders via PDF.js).
//
// PDFs live in /public/pdfs/{olympiad}/{bidang}/{tahun}/{soal|pembahasan}.pdf

const fs = require('fs');
const path = require('path');
const {
  getUserByToken,
  hasActiveSubscription,
  sendJson,
} = require('./_lib');

const VALID_OLYMPIAD = ['osn', 'onmipa'];
const VALID_BIDANG = {
  osn: ['matematika', 'fisika', 'kimia', 'biologi', 'informatika', 'astronomi', 'ekonomi', 'kebumian', 'geografi'],
  onmipa: ['matematika', 'fisika', 'kimia', 'biologi'],
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });

  const { type, olympiad, bidang, tahun, mode, token } = req.query || {};

  if (!type || !olympiad || !bidang || !tahun)
    return sendJson(res, 400, { error: 'Parameter tidak lengkap.' });

  const t = String(type).toLowerCase();
  const o = String(olympiad).toLowerCase();
  const b = String(bidang).toLowerCase();
  const y = String(tahun);

  if (!['soal', 'pembahasan'].includes(t))
    return sendJson(res, 400, { error: 'Type tidak valid.' });
  if (!VALID_OLYMPIAD.includes(o))
    return sendJson(res, 400, { error: 'Olympiad tidak valid.' });
  if (!VALID_BIDANG[o].includes(b))
    return sendJson(res, 400, { error: 'Bidang tidak valid.' });
  const yearNum = parseInt(y, 10);
  if (isNaN(yearNum) || yearNum < 2010 || yearNum > 2024)
    return sendJson(res, 400, { error: 'Tahun harus antara 2010-2024.' });

  // Block download attempts for pembahasan
  const wantsDownload = mode === 'download';
  if (t === 'pembahasan' && wantsDownload) {
    return sendJson(res, 403, { error: 'Pembahasan tidak dapat diunduh.' });
  }

  // Access control for pembahasan
  if (t === 'pembahasan' && yearNum !== 2024) {
    const user = await getUserByToken(token);
    if (!user) {
      return sendJson(res, 401, {
        error: 'Pembahasan ini memerlukan langganan. Silakan masuk.',
      });
    }
    if (!await hasActiveSubscription(user.email, o, b)) {
      return sendJson(res, 403, {
        error: `Anda belum berlangganan ${o.toUpperCase()} bidang ${b}.`,
      });
    }
  }

  // Locate the PDF
  const fileName = t === 'soal' ? 'soal.pdf' : 'pembahasan.pdf';
  const pdfPath = path.join(
    process.cwd(),
    'public',
    'pdfs',
    o,
    b,
    y,
    fileName
  );

  // If file is missing, serve a generated placeholder so the UX still works
  if (!fs.existsSync(pdfPath)) {
    const placeholder = makePlaceholderPdf({ type: t, olympiad: o, bidang: b, tahun: y });
    return sendPdf(res, placeholder, t, { download: wantsDownload, olympiad: o, bidang: b, tahun: y });
  }

  const buf = fs.readFileSync(pdfPath);
  return sendPdf(res, buf, t, { download: wantsDownload, olympiad: o, bidang: b, tahun: y });
};

function sendPdf(res, buffer, type, opts) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', buffer.length);
  // Strong anti-cache so direct shares don't leak
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent embedding from other origins
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");

  const fileName = `${type}-${opts.olympiad}-${opts.bidang}-${opts.tahun}.pdf`;

  if (type === 'pembahasan') {
    // Inline only — never download for pembahasan
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  } else {
    // Soal: respect mode
    res.setHeader(
      'Content-Disposition',
      `${opts.download ? 'attachment' : 'inline'}; filename="${fileName}"`
    );
  }
  res.end(buffer);
}

// Minimal placeholder PDF generator (single page).
// Produces a tiny valid PDF document with one line of text.
// Used only when the actual PDF hasn't been uploaded yet — keeps demo running.
function makePlaceholderPdf({ type, olympiad, bidang, tahun }) {
  const title = `${type.toUpperCase()} ${olympiad.toUpperCase()} ${bidang} ${tahun}`;
  const sub = `Bahas Olimpiade — placeholder. Ganti file ini dengan PDF asli di public/pdfs/${olympiad}/${bidang}/${tahun}/${type}.pdf`;
  const escape = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const stream = `BT
/F1 22 Tf
72 720 Td
(${escape(title)}) Tj
0 -36 Td
/F1 12 Tf
(${escape(sub)}) Tj
0 -24 Td
(Letakkan PDF di folder yang sesuai untuk mengganti placeholder ini.) Tj
ET`;

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let out = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    out += String(off).padStart(10, '0') + ' 00000 n \n';
  });
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(out, 'binary');
}
