const { v4: uuidv4 } = require('uuid'); 
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const amqp = require('amqplib');
const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true }, 
    amount:    { type: Number, required: true }, // So tien học phi cần thanh toan
    payerId:  { type: String, required: true }, // Id người thanh toan
    status:   { type: String, required: true, enum: ['completed', 'pending', 'failed'], default: 'pending' },
    studentId: { type: String, required: true }, //Id người được thanh toan
    createdAt: { type: Date, default: Date.now },
});
const Payment = mongoose.model('Payment', paymentSchema);


// API tạo giao dịch thanh toán mới
app.post('/payments', async (req, res) => {
    try {
        const { payerId, studentId, email } = req.body;
        
        //Kiểm tra xem đã có payment pending cho studentId này chưa
        const existingPayment = await Payment.findOne({ 
            studentId, 
            status: 'pending' 
        });

        if (existingPayment) {
            // Nếu đã có payment pending, gửi lại OTP cho payment cũ
            await sendOtpToQueue({ 
                transactionId: existingPayment.paymentId, 
                email 
            });
            
            return res.status(200).json({ 
                message: 'Payment already exists, OTP resent', 
                paymentId: existingPayment.paymentId 
            });
        }


        // 1. Lấy thông tin học phí từ Tuition-service
        const tuitionRes = await axios.get(`http://tuition-service:3005/tuitions/${studentId}`);
        if (!tuitionRes.data || tuitionRes.status !== 200) {
    return res.status(404).json({ message: 'Tuition record not found' });
}
        const tuition = tuitionRes.data;

        // 2. Kiểm tra trạng thái học phí
        if (tuition.status === 'paid') {
            return res.status(400).json({ message: 'Tuition already paid' });
        }

        // 3. Dùng đúng số tiền học phí để tạo payment
        const amount = tuition.tuitionAmount;
        const paymentId = uuidv4(); // Sử dụng uuid để sinh paymentId
        const payment = new Payment({ paymentId, amount, payerId, studentId, status: 'pending' });
        await payment.save();

        // 4. Gửi OTP 
        await sendOtpToQueue({ transactionId: paymentId, email });

        // 5. Trả về thông tin giao dịch

        res.status(201).json({ message: 'Payment created, OTP sent', paymentId });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Hàm gửi tin nhắn đến RabbitMQ
async function sendOtpToQueue(message) {
    const queue = 'otp_queue';
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    setTimeout(() => { conn.close(); }, 500); // Đóng kết nối sau khi gửi
}

// Cập nhật trạng thái giao dịch theo paymentId
app.put('/payments/:paymentId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const payment = await Payment.findOneAndUpdate(
            { paymentId: req.params.paymentId },
            { status },
            { new: true }
        );
        if (!payment) return res.status(404).send('Payment record not found');

        if (status === 'completed') {
            // 1. Lấy thông tin user hiện tại
            const userRes = await axios.get(`http://user-service:3002/users/${payment.payerId}`);
            const user = userRes.data;

            // 2. Kiểm tra số dư
            if (user.balance < payment.amount) {
                return res.status(400).send('Số dư không đủ để thanh toán');
            }

            // 3. Trừ tiền và cập nhật số dư
            const newBalance = user.balance - payment.amount;
            await axios.put(`http://user-service:3002/users/${payment.payerId}/balance`, {
                balance: newBalance
            });

            // 4. Gọi Tuition-service để cập nhật trạng thái học phí
            await axios.put(`http://tuition-service:3005/tuitions/${payment.studentId}/status`, {
                status: 'paid'
            });
        }

        res.send(payment);
    } catch (error) {
        res.status(500).send('Server error');
    }
});


// API lấy thông tin giao dịch theo paymentId
app.get('/payments/:paymentId', async (req, res) => {
    try {
        const payment = await Payment.findOne({ paymentId: req.params.paymentId });
        if (!payment) return res.status(404).send('Payment record not found');
        res.send(payment);
    } catch (error) {
        res.status(500).send('Server error');
    }
});


// API lấy tất cả giao dịch
app.get('/payments/payer/:payerId', async (req, res) => {
    try {
        const { payerId } = req.params;
        const payments = await Payment.find({ payerId });
        res.send(payments);
    } catch (error) {
        res.status(500).send('Server error');
    }
});
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});