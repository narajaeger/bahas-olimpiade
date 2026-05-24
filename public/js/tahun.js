// Tahun page — builds list of years 2010-2024 for chosen olympiad+bidang
(function () {
  const params = new URLSearchParams(location.search);
  const olympiad = params.get('olympiad');
  const bidang = params.get('bidang');

  if (!olympiad || !bidang) {
    location.href = '/';
    return;
  }

  const olympiadLabel = olympiad.toUpperCase();
  const bidangLabel = bidang.charAt(0).toUpperCase() + bidang.slice(1);

  document.title = `${olympiadLabel} ${bidangLabel} — Pilih Tahun | Bahas Olimpiade`;
  document.getElementById('page-title').textContent = `${olympiadLabel} ${bidangLabel}`;

  const bc = document.getElementById('breadcrumb');
  bc.innerHTML = `
    <a href="/">Beranda</a> <span>›</span>
    <a href="/${olympiad}.html">${olympiadLabel}</a> <span>›</span>
    <span>${bidangLabel}</span>
  `;

  const backLink = document.getElementById('back-link');
  if (backLink) backLink.href = `/${olympiad}.html`;

  const grid = document.getElementById('tahun-grid');
  const years = [];
  for (let y = 2024; y >= 2010; y--) years.push(y);

  grid.innerHTML = years
    .map((year) => {
      const isFree = year === 2024;
      return `
        <a href="/material.html?olympiad=${olympiad}&bidang=${bidang}&tahun=${year}" class="tahun-card">
          ${isFree ? '<span class="tahun-badge">PEMBAHASAN GRATIS</span>' : ''}
          <div class="tahun-year">${year}</div>
          <div class="tahun-label">Klik untuk lihat</div>
        </a>
      `;
    })
    .join('');

  // Persist auth state in nav
  const token = localStorage.getItem('bo_token');
  const navAuth = document.querySelector('.nav-links .btn-nav');
  if (token && navAuth) {
    navAuth.textContent = 'Dashboard';
    navAuth.setAttribute('href', '/dashboard.html');
  }
})();
