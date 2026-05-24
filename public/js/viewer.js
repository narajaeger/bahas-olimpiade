// Secure PDF viewer using PDF.js - no download, no native PDF UI
(function () {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const params = new URLSearchParams(location.search);
  const olympiad = params.get('olympiad');
  const bidang = params.get('bidang');
  const tahun = params.get('tahun');

  if (!olympiad || !bidang || !tahun) {
    location.href = '/';
    return;
  }

  const olympiadLabel = olympiad.toUpperCase();
  const bidangLabel = bidang.charAt(0).toUpperCase() + bidang.slice(1);
  document.getElementById('title').textContent =
    `Pembahasan — ${olympiadLabel} ${bidangLabel} ${tahun}`;
  document.title = `Pembahasan ${olympiadLabel} ${bidangLabel} ${tahun} | Bahas Olimpiade`;

  document.getElementById('back-btn').addEventListener('click', () => {
    location.href = `/material.html?olympiad=${olympiad}&bidang=${bidang}&tahun=${tahun}`;
  });

  // Anti-download/screenshot deterrents
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    // Block Ctrl+S, Ctrl+P, Ctrl+Shift+S
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')
    ) {
      e.preventDefault();
    }
  });
  // Detect dev tools open (basic — for deterrence only)
  // Note: not foolproof, but standard practice for paid content viewers.

  let pdfDoc = null;
  let currentPage = 1;
  let scale = 1.4;
  const container = document.getElementById('pdf-container');
  const loader = document.getElementById('loader');
  const pageInfo = document.getElementById('curr-page');
  const totalPages = document.getElementById('total-pages');

  // Fetch user identity to embed in watermark
  const token = localStorage.getItem('bo_token');
  const userEmail = localStorage.getItem('bo_email') || 'tamu';

  const pdfUrl =
    `/api/pdf?type=pembahasan&olympiad=${olympiad}&bidang=${bidang}&tahun=${tahun}&mode=view` +
    (token ? `&token=${encodeURIComponent(token)}` : '');

  async function loadPdf() {
    try {
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: false,
      });
      pdfDoc = await loadingTask.promise;
      totalPages.textContent = pdfDoc.numPages;
      loader.style.display = 'none';
      await renderAllPages();
    } catch (err) {
      console.error(err);
      loader.innerHTML = `
        <div class="error-box">
          <h3>⚠️ Tidak dapat memuat pembahasan</h3>
          <p style="margin-top: 0.8rem;">${err.message || 'Terjadi kesalahan.'}</p>
          <p style="margin-top: 0.8rem;">
            Jika tahun ini berbayar, pastikan Anda sudah berlangganan bidang <b>${bidangLabel}</b>.
          </p>
          <p style="margin-top: 1rem;">
            <a href="/login.html">Masuk / Berlangganan</a> ·
            <a href="javascript:history.back()">Kembali</a>
          </p>
        </div>
      `;
    }
  }

  async function renderAllPages() {
    // Clear existing
    Array.from(container.querySelectorAll('.pdf-canvas-wrap')).forEach((el) => el.remove());

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const wrap = document.createElement('div');
      wrap.className = 'pdf-canvas-wrap';
      wrap.dataset.page = pageNum;

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const watermark = document.createElement('div');
      watermark.className = 'watermark';
      watermark.textContent = `bahas-olimpiade · ${userEmail}`;

      wrap.appendChild(canvas);
      wrap.appendChild(watermark);
      container.appendChild(wrap);

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
    }

    pageInfo.textContent = currentPage;
  }

  // Nav controls — scroll to specific page
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      scrollToPage(currentPage);
    }
  });
  document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < (pdfDoc?.numPages || 1)) {
      currentPage++;
      scrollToPage(currentPage);
    }
  });
  document.getElementById('zoom-in').addEventListener('click', () => {
    if (scale < 3) {
      scale += 0.2;
      renderAllPages();
    }
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    if (scale > 0.6) {
      scale -= 0.2;
      renderAllPages();
    }
  });

  function scrollToPage(num) {
    const el = container.querySelector(`.pdf-canvas-wrap[data-page="${num}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    pageInfo.textContent = num;
  }

  // Update current page on scroll
  container.addEventListener('scroll', () => {
    const wraps = container.querySelectorAll('.pdf-canvas-wrap');
    const containerTop = container.scrollTop;
    for (const w of wraps) {
      if (w.offsetTop + w.offsetHeight / 2 > containerTop) {
        currentPage = parseInt(w.dataset.page, 10);
        pageInfo.textContent = currentPage;
        break;
      }
    }
  });

  loadPdf();
})();
