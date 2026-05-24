// Material page — soal vs pembahasan
(function () {
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

  document.title = `${olympiadLabel} ${bidangLabel} ${tahun} | Bahas Olimpiade`;
  document.getElementById('page-title').textContent = `${olympiadLabel} ${bidangLabel} — Tahun ${tahun}`;

  const bc = document.getElementById('breadcrumb');
  bc.innerHTML = `
    <a href="/">Beranda</a> <span>›</span>
    <a href="/${olympiad}.html">${olympiadLabel}</a> <span>›</span>
    <a href="/tahun.html?olympiad=${olympiad}&bidang=${bidang}">${bidangLabel}</a> <span>›</span>
    <span>${tahun}</span>
  `;

  const backLink = document.getElementById('back-link');
  if (backLink) backLink.href = `/tahun.html?olympiad=${olympiad}&bidang=${bidang}`;

  // Soal links (always free)
  const soalPdfUrl = `/api/pdf?type=soal&olympiad=${olympiad}&bidang=${bidang}&tahun=${tahun}`;
  document.getElementById('soal-view').href = soalPdfUrl + '&mode=view';
  document.getElementById('soal-view').setAttribute('target', '_blank');
  document.getElementById('soal-download').href = soalPdfUrl + '&mode=download';

  // Pembahasan: free for 2024, otherwise requires subscription
  const isFreePembahasan = parseInt(tahun, 10) === 2024;
  const pembahasanBadge = document.getElementById('pembahasan-badge');
  if (isFreePembahasan) {
    pembahasanBadge.textContent = 'GRATIS';
    pembahasanBadge.classList.add('material-badge-free');
  }

  const viewerUrl = `/viewer.html?olympiad=${olympiad}&bidang=${bidang}&tahun=${tahun}`;
  document.getElementById('pembahasan-view').href = viewerUrl;

  // Auth state
  const token = localStorage.getItem('bo_token');
  const navAuth = document.getElementById('auth-link');
  if (token && navAuth) {
    navAuth.textContent = 'Dashboard';
    navAuth.setAttribute('href', '/dashboard.html');
  }
})();
