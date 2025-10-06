require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected for Notification Service'))
  .catch(err => console.error('MongoDB connection error:', err));

const otpSchema = new mongoose.Schema({
  transactionId: { type: String, required: true },
  email: { type: String, required: true },
  otp: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

const OTP = mongoose.model('OTP', otpSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Tạo và gửi OTP
app.post('/otp', async (req, res) => {
  try {
    const { transactionId, email } = req.body;
    if (!transactionId || !email) {
      return res.status(400).json({ message: 'Missing transactionId or email' });
    }

    let otp;
    do {
      otp = generateOTP();
    } while (await OTP.findOne({ otp }));

    const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

    const otpRecord = new OTP({ transactionId, email, otp, expiresAt });
    await otpRecord.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'OTP sent successfully',
      transactionId
    });

  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Xác thực OTP
app.post('/otp/verify', async (req, res) => {
  try {
    const { transactionId, otp } = req.body;
    if (!transactionId || !otp) {
      return res.status(400).json({ message: 'Missing transactionId or otp' });
    }

    const otpRecord = await OTP.findOne({
      transactionId,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lấy tất cả OTP theo transactionId 
app.get('/notifications/otp/:transactionId', async (req, res) => {
  try {
    const otpRecords = await OTP.find({ transactionId: req.params.transactionId })
      .sort({ createdAt: -1 });
    if (!otpRecords.length) {
      return res.status(404).json({ message: 'No OTP records found' });
    }
    res.json(otpRecords);
  } catch (error) {
    console.error('Error fetching OTP records:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
