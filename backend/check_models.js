const axios = require('axios');
require('dotenv').config();

async function checkModels() {
    const key = process.env.GEMINI_API_KEY;
    console.log('Checking models for key:', key.substring(0, 10) + '...');
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const modelNames = response.data.models.map(m => m.name);
        console.log('MODEL_NAMES:', modelNames.join(', '));
    } catch (err) {

        if (err.response) {
            console.log('Error Response:', err.response.status, err.response.data);
        } else {
            console.log('Error:', err.message);
        }
    }
}

checkModels();
