const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const newContact = new Contact({ name, email, message });
        await newContact.save();
        res.status(201).json({ success: true, message: 'Message saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving message', error: error.message });
    }
});

module.exports = router;
