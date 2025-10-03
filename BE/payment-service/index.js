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
    paymentId: { type: String, required: true, unique: true },
    amount:    { type: Number, required: true },
});
const User = mongoose.model('User', userSchema);