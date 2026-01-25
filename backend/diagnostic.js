const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const logFile = 'diag_result.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function runDiagnostic() {
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    const key = process.env.GEMINI_API_KEY;
    log('--- Gemini API Diagnostic ---');
    log('API Key starts with: ' + (key ? key.substring(0, 10) + '...' : 'MISSING'));

    if (!key) {
        log('ERROR: GEMINI_API_KEY is missing in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];

    for (const m of models) {
        try {
            log(`\nTesting ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent('Hi');
            log(`SUCCESS: ${m} response: ` + result.response.text().substring(0, 30) + '...');
        } catch (err) {
            log(`FAILED ${m}: ` + err.message);
        }
    }
}

runDiagnostic();
