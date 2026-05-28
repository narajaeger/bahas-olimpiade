// Dashboard JS
(function () {
  const token = localStorage.getItem('bo_token');
  if (!token) {
    location.href = '/login.html';
    return;
  }

  const name = localStorage.getItem('bo_name');
  if (name) document.getElementById('user-name').textContent = `· ${name}`;

  const BIDANG_BY_OLYMPIAD = {
    osn: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Informatika', 'Astronomi', 'Ekonomi', 'Kebumian', 'Geografi'],
    'osn-smp': ['Matematika', 'IPA', 'IPS'],
    'osn-sd': ['Matematika', 'IPA'],
    onmipa: ['Matematika', 'Fisika', 'Kimia', 'Biologi'],
  };

  const olympiadSel = document.getElementById('sub-olympiad');
  const bidangSel = document.getElementById('sub-bidang');

  olympiadSel.addEventListener('change', () => {
    const v = olympiadSel.value;
    bidangSel.innerHTML = '<option value="">-- Pilih bidang --</option>';
    if (BIDANG_BY_OLYMPIAD[v]) {
      BIDANG_BY_OLYMPIAD[v].forEach((b) => {
        const opt = document.createElement('option');
        opt.value = b.toLowerCase();
        opt.textContent = b;
        bidangSel.appendChild(opt);
      });
    }
  });

  async function loadSubscriptions() {
    try {
      const res = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.clear();
        location.href = '/login.html';
        return;
      }
      const data = await res.json();
      renderSubs(data.subscriptions || []);
    } catch (err) {
      console.error(err);
    }
  }

  function renderSubs(subs) {
    const list = document.getElementById('subscriptions-list');
    if (!subs.length) {
      list.innerHTML = '<li class="sub-empty">Belum ada langganan aktif.</li>';
      return;
    }
    list.innerHTML = subs
      .map((s) => {
        const label = `${s.olympiad.toUpperCase()} · ${s.bidang.charAt(0).toUpperCase() + s.bidang.slice(1)}`;
        const exp = new Date(s.expiresAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        return `<li><span>${label}<br><small style="color:var(--text-muted);font-weight:400">Berakhir ${exp}</small></span><span class="sub-active-tag">AKTIF</span></li>`;
      })
      .join('');
  }

  document.getElementById('subscribe-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('sub-msg');
    const btn = e.target.querySelector('button[type="submit"]');
    msg.className = 'auth-msg';
    msg.textContent = 'Membuat tagihan pembayaran…';
    btn.disabled = true;

    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 200 && data.paymentUrl) {
        msg.classList.add('success');
        msg.textContent = '✓ Mengalihkan ke halaman pembayaran…';
        window.location.href = data.paymentUrl;
      } else {
        msg.classList.add('error');
        msg.textContent = data.error || 'Gagal membuat pembayaran.';
        btn.disabled = false;
      }
    } catch (err) {
      msg.classList.add('error');
      msg.textContent = 'Terjadi kesalahan jaringan.';
      btn.disabled = false;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    location.href = '/';
  });

  loadSubscriptions();
})();
