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

const tuitionSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    tuitionAmount: { type: Number, required: true },
    duedate: { type: Date, required: true },
    status: { type: String, required: true, enum: ['paid', 'unpaid'], default: 'unpaid' },

});

const Tuition = mongoose.model('Tuition', tuitionSchema);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});