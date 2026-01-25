const axios = require('axios');

async function test() {
    try {
        console.log('Sending test request to http://localhost:5000/api/chatbot/test...');
        const res = await axios.post('http://localhost:5000/api/chatbot/test', {
            message: 'Hello, this is a diagnostic test.'
        });
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.error('Error Response:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error Message:', err.message);
        }
    }
}

test();
