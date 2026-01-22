const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  async analyzeCropDisease(imagePath) {
    if (process.env.ENABLE_MOCK_GEMINI === 'true') {
      console.log('Using Mock Gemini for disease analysis');
      return {
        disease: "Leaf Blight (Demo)",
        confidence: 95,
        severity: "medium",
        affectedParts: ["leaves"],
        symptoms: ["Yellow spots", "Brown edges"],
        treatment: {
          immediate: ["Remove infected leaves"],
          chemical: ["Copper-based fungicide"],
          organic: ["Neem oil"],
          preventive: ["Crop rotation"]
        },
        harvestingRecommendation: "safe",
        estimatedRecoveryDays: 10,
        affectedYield: "5%",
        notes: "This is a demo result since MOCK_GEMINI is enabled."
      };
    }

    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting disease analysis with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Read image and convert to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const imageExtension = path.extname(imagePath).slice(1).toLowerCase();

        const mimeTypes = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp'
        };

        const mimeType = mimeTypes[imageExtension] || 'image/jpeg';

        const prompt = `You are an expert agricultural pathologist. Analyze this crop image and provide a detailed disease diagnosis.
 
Respond in JSON format with the following structure:
{
  "disease": "name of disease",
  "confidence": 85,
  "severity": "low|medium|high",
  "affectedParts": ["list", "of", "affected", "plant", "parts"],
  "symptoms": ["symptom1", "symptom2"],
  "treatment": {
    "immediate": ["action1", "action2"],
    "chemical": ["fungicide/pesticide recommendations"],
    "organic": ["organic alternatives"],
    "preventive": ["prevention measures"]
  },
  "harvestingRecommendation": "safe/delay/risky",
  "estimatedRecoveryDays": 7,
  "affectedYield": "5-10%",
  "notes": "additional important information"
}

If the image doesn't show a crop or plant, respond with:
{
  "error": "true",
  "message": "description of why analysis failed"
}`;

        const response = await model.generateContent([
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          prompt
        ]);

        const text = response.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          throw new Error('Invalid response format from Gemini');
        }

        const result = JSON.parse(jsonMatch[0]);
        console.log(`Success with model: ${modelName}`);
        return result;
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error.message);
        lastError = error;

        // If it's a quota or auth error, don't bother with other models
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('401') || error.message.includes('API_KEY_INVALID')) {
          break;
        }

        // Continue to next model if this one fails (especially on 404 or support errors)
        if (error.message.includes('404') || error.message.includes('not supported') || error.message.includes('not found')) {
          continue;
        }
      }
    }

    throw lastError || new Error(`All Gemini models failed.`);
  }

  async generateFarmingAdvice(query, language = 'english') {
    if (process.env.ENABLE_MOCK_GEMINI === 'true') {
      return "This is a demo response for farming advice. Ensure proper irrigation and soil nutrition.";
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are an expert agricultural advisor helping Indian farmers. Provide practical, actionable farming advice in ${language} language. Be concise and farmer-friendly. Avoid technical jargon.`;

      const response = await model.generateContent([
        `${systemPrompt}\n\nFarmer's question: ${query}`
      ]);

      return response.response.text();
    } catch (error) {
      console.error('Gemini Advice Generation Error:', error);
      throw error;
    }
  }

  async predictYield(cropData) {
    if (process.env.ENABLE_MOCK_GEMINI === 'true') {
      return {
        estimatedYield: "50 quintals",
        yieldRange: "45-55",
        confidence: "90%",
        factors: ["Good rainfall", "Timely sowing"],
        recommendations: ["Maintain nitrogen levels"]
      };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `As an agricultural AI, analyze this crop data and predict yield:
${JSON.stringify(cropData, null, 2)}

Provide a JSON response with:
{
  "estimatedYield": "quantity in quintal/ton",
  "yieldRange": "minimum-maximum",
  "confidence": "percentage",
  "factors": ["positive_factors", "risk_factors"],
  "recommendations": ["optimization_suggestions"]
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini Yield Prediction Error:', error);
      throw error;
    }
  }

  async forecastDisease(locationData, weatherData) {
    if (process.env.ENABLE_MOCK_GEMINI === 'true') {
      return {
        riskLevel: "low",
        likelyDiseases: [],
        recommendations: ["Keep monitoring"],
        monitoringAdvice: "Check for pests weekly"
      };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `As an agricultural disease forecasting AI, analyze this data and predict disease risks:
Location: ${JSON.stringify(locationData)}
Current Weather: ${JSON.stringify(weatherData)}

Provide a JSON response with:
{
  "riskLevel": "low|medium|high",
  "likelyDiseases": [
    {
      "name": "disease_name",
      "probability": "percentage",
      "riskFactors": ["factor1", "factor2"]
    }
  ],
  "recommendations": ["preventive_measures"],
  "monitoringAdvice": "what to watch for"
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini Disease Forecast Error:', error);
      throw error;
    }
  }
}

module.exports = new GeminiService();
