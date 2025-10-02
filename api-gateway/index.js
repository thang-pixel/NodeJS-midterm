require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'http://localhost:3001', // React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Proxy cho auth-service
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL, // http://localhost:3000
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '',   // xoá "/api/auth", còn lại "/login"
  },
  logLevel: 'debug'
}));

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway is running' });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`🚀 API Gateway running on port ${PORT}`));
