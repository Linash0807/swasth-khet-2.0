const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_MODEL = 'gemini-flash-latest';

class GeminiService {
  /**
   * Analyzes an image of a crop to detect diseases
   * @param {string} imagePath - Path to the image file
   * @returns {Object} - Analysis result in JSON format
   */
  async analyzeCropDisease(imagePath) {
    if (process.env.ENABLE_MOCK_GEMINI === 'true') {
      console.log('[GEMINI] Using Mock for disease analysis');
      return this._getMockDiseaseResult();
    }

    try {
      console.log(`[GEMINI] Analyzing crop disease with model: ${DEFAULT_MODEL}`);
      const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const imageExtension = path.extname(imagePath).slice(1).toLowerCase();
      const mimeType = this._getMimeType(imageExtension);

      const prompt = `You are an expert agricultural pathologist. Analyze this crop image and provide a detailed disease diagnosis. 
      If the image is not related to crops or plants, return a JSON with an "error" field set to true and a helpful message.
      
      Structure your response as a valid JSON object:
      {
        "disease": "Specific name of the disease or 'Healthy'",
        "confidence": 0-100,
        "severity": "low|medium|high|none",
        "affectedParts": ["leaves", "stems", etc],
        "symptoms": ["list of observable symptoms"],
        "treatment": {
          "immediate": ["actions to take now"],
          "chemical": ["recommended fungicides/pesticides if applicable"],
          "organic": ["natural remedies"],
          "preventive": ["how to prevent in future"]
        },
        "harvestingRecommendation": "safe|risky|wait",
        "estimatedRecoveryDays": number,
        "affectedYield": "percentage estimate",
        "notes": "additional expert observations"
      }`;

      const response = await model.generateContent([
        { inlineData: { data: base64Image, mimeType: mimeType } },
        prompt
      ]);

      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('AI failed to generate a valid JSON response structure.');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error(`[GEMINI_ERROR] Disease analysis failed:`, error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Generates farming advice based on a query
   * @param {string} query - The user's question
   * @param {string} language - Preferred language
   * @returns {string} - AI generated advice
   */
  async generateFarmingAdvice(query, language = 'english') {
    if (process.env.ENABLE_MOCK_GEMINI === 'true') {
      return "Demo Response: Ensure proper irrigation and soil nutrition.";
    }

    try {
      console.log(`[GEMINI] Generating farming advice with model: ${DEFAULT_MODEL}`);
      const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

      const systemPrompt = `You are an expert agricultural advisor providing practical, sustainable, and effective farming advice. 
      Respond concisely in ${language}. If you don't know the answer, suggest consulting a local agricultural officer.`;

      const response = await model.generateContent([`${systemPrompt}\n\nQuestion: ${query}`]);
      return response.response.text();
    } catch (error) {
      console.error(`[GEMINI_ERROR] Chat advice failed:`, error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Predicts crop yield based on provided data
   */
  async predictYield(cropData) {
    try {
      const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
      const prompt = `As an agricultural AI, analyze this crop data and predict yield in JSON format:
      ${JSON.stringify(cropData, null, 2)}
      
      {
        "estimatedYield": "quantity",
        "yieldRange": "min-max",
        "confidence": "percentage",
        "factors": ["positive", "risks"],
        "recommendations": ["suggestions"]
      }`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) throw new Error('Invalid response format');
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[GEMINI_ERROR] Yield prediction failed:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Forecasts disease risk based on weather and location
   */
  async forecastDisease(locationData, weatherData) {
    try {
      const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
      const prompt = `Analyze data and forecast disease risks in JSON format:
      Location: ${JSON.stringify(locationData)}
      Weather: ${JSON.stringify(weatherData)}
      
      {
        "riskLevel": "low|medium|high",
        "likelyDiseases": [{"name": "...", "probability": "...", "riskFactors": []}],
        "recommendations": [],
        "monitoringAdvice": ""
      }`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) throw new Error('Invalid response format');
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[GEMINI_ERROR] Disease forecast failed:', error.message);
      throw this._handleError(error);
    }
  }

  // Helper Methods
  _getMimeType(extension) {
    const types = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    };
    return types[extension] || 'image/jpeg';
  }

  _handleError(error) {
    let message = error.message;
    let status = 500;

    if (message.includes('429') || message.includes('quota')) {
      message = "Quota exceeded for the AI service. Please try again in 60 seconds.";
      status = 429;
    } else if (message.includes('401') || message.includes('API_KEY_INVALID')) {
      message = "AI service authentication failed. Please check the API key.";
      status = 401;
    } else if (message.includes('Candidate was blocked')) {
      message = "The image or request was flagged by safety filters. Please try a different approach.";
      status = 422;
    }

    const refinedError = new Error(message);
    refinedError.status = status;
    return refinedError;
  }

  _getMockDiseaseResult() {
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
}

module.exports = new GeminiService();
