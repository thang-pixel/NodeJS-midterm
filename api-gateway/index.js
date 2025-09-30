require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Cấu hình proxy cho auth-service
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '', // Bỏ /api/auth từ đường dẫn gửi đến service
  },
}));

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway is running' });
});

// Chạy server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));