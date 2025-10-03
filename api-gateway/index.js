require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

app.use((req, res, next) => {
  console.log('Received:', req.method, req.originalUrl);
  next();
});

app.use(cors({
  origin: 'http://localhost:3001', // React frontend (sửa port)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Proxy cho auth-service
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '',   // xoá "/api/auth", còn lại "/login"
  },
  logLevel: 'debug'
}));

// Proxy cho user-service
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: {
    '^/api/users': '',   
  },
}));

// Proxy cho payment-service
app.use('/api/payments', createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '',   
  },
  logLevel: 'debug'
}));

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway is running' });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`🚀 API Gateway running on port ${PORT}`));
