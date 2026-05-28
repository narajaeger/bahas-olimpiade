// Endpoint debug sementara — hapus setelah payment berfungsi
module.exports = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    env: {
      IPAYMU_VA: process.env.IPAYMU_VA ? '✅ ada' : '❌ tidak ada',
      IPAYMU_API_KEY: process.env.IPAYMU_API_KEY ? '✅ ada' : '❌ tidak ada',
      IPAYMU_SANDBOX: process.env.IPAYMU_SANDBOX || '(tidak diset, default: sandbox)',
      SITE_URL: process.env.SITE_URL || '❌ tidak ada',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ ada' : '❌ tidak ada',
    },
  }));
};
