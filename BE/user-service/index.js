require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));


const userSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phone:    { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    balance:  { type: Number, required: true, default: 0 }
});
const User = mongoose.model('User', userSchema);

// API lấy thông tin người dùng theo studentId
app.get('/users/:studentId', async (req, res) => {
    console.log('User-service received:', req.method, req.originalUrl);
    try {
        const user = await User.findOne({ studentId: req.params.studentId });
        if (!user) return res.status(404).send('User not found');
        const formattedUser = {
            ...user.toObject(),
            balance: user.balance.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
        };
        res.send(formattedUser);
    } catch (error) {
        res.status(500).send('Server error');
    }
});
//Cập nhật số dư khả dụng theo studentId
app.put('/users/:studentId/balance', async (req, res) => {
    try {
        const { balance } = req.body;
        const user = await User.findOneAndUpdate(
            { studentId: req.params.studentId },
            { balance },
            { new: true }
        );
        if (!user) return res.status(404).send('User not found');
        res.send(user);
    } catch (error) {
        res.status(500).send('Server error');
    }
});




app.listen(process.env.PORT, () => {
    console.log(`User service running on port ${process.env.PORT}`);
});