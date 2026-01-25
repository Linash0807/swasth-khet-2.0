const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const users = await User.find({}, 'email name isActive');
        console.log('Users found:', users.length);
        users.forEach(u => console.log(`- ${u.email} (${u.name}) - Active: ${u.isActive}`));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

listUsers();
