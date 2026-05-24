// Auth page (login + register)
(function () {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      document.getElementById('login-tab').style.display = which === 'login' ? 'block' : 'none';
      document.getElementById('register-tab').style.display = which === 'register' ? 'block' : 'none';
    })
  );

  async function postJson(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      return { status: res.status, data: { error: text } };
    }
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('login-msg');
    msg.className = 'auth-msg';
    msg.textContent = 'Memproses...';
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());

    const { status, data } = await postJson('/api/auth/login', body);

    if (status === 200 && data.token) {
      localStorage.setItem('bo_token', data.token);
      localStorage.setItem('bo_email', data.email);
      localStorage.setItem('bo_name', data.name || '');
      msg.classList.add('success');
      msg.textContent = '✓ Berhasil masuk! Mengalihkan...';
      setTimeout(() => (location.href = '/dashboard.html'), 700);
    } else {
      msg.classList.add('error');
      msg.textContent = data.error || 'Login gagal.';
    }
  });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('register-msg');
    msg.className = 'auth-msg';
    msg.textContent = 'Memproses...';
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());

    const { status, data } = await postJson('/api/auth/register', body);

    if (status === 200 && data.token) {
      localStorage.setItem('bo_token', data.token);
      localStorage.setItem('bo_email', data.email);
      localStorage.setItem('bo_name', data.name || '');
      msg.classList.add('success');
      msg.textContent = '✓ Akun berhasil dibuat! Mengalihkan...';
      setTimeout(() => (location.href = '/dashboard.html'), 700);
    } else {
      msg.classList.add('error');
      msg.textContent = data.error || 'Pendaftaran gagal.';
    }
  });
})();
