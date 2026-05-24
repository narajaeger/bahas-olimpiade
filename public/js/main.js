// Main shared JS — Bahas Olimpiade
(function () {
  // Smooth scroll for in-page links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Persist auth state in nav
  const token = localStorage.getItem('bo_token');
  const navAuth = document.querySelector('.nav-links .btn-nav');
  if (token && navAuth && navAuth.tagName === 'A' && navAuth.getAttribute('href') === '/login.html') {
    navAuth.textContent = 'Dashboard';
    navAuth.setAttribute('href', '/dashboard.html');
  }
})();
