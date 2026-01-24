const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Validation schemas
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  language: Joi.string().valid('english', 'hindi', 'telugu', 'tamil', 'marathi').default('english'),
  context: Joi.string().optional()
});

// All routes require authentication (except test)
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await geminiService.generateFarmingAdvice(message || "Hello");
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.use(protect);

// Mock responses for fallback
const MOCK_RESPONSES = {
  english: {
    greeting: "Namaste! I'm your farming assistant. Ask me anything about crops, diseases, weather, or farming techniques.",
    default: "I'm here to help with farming advice. You can ask me about crop diseases, weather conditions, farming techniques, or agricultural questions."
  },
  hindi: {
    greeting: "नमस्ते! मैं आपका कृषि सहायक हूं। फसलों, बीमारियों, मौसम के बारे में पूछें।",
    default: "मैं कृषि सलाह देने के लिए यहां हूं। आप मुझसे कोई भी कृषि प्रश्न पूछ सकते हैं।"
  }
};

// @desc    Send message to farming chatbot
// @route   POST /api/chatbot/message
// @access  Private
router.post('/message', async (req, res) => {
  try {
    const { error, value } = messageSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { message, language = 'english' } = value;

    try {
      console.log(`Processing chatbot message: "${message}" in ${language}`);
      // Use Gemini for response generation
      const response = await geminiService.generateFarmingAdvice(message, language);
      console.log('Gemini response generated successfully');

      res.json({
        success: true,
        data: {
          response,
          language,
          timestamp: new Date(),
          model: process.env.ENABLE_MOCK_GEMINI === 'true' ? 'Mock' : 'Gemini-powered'
        }
      });
    } catch (geminiError) {
      console.warn('Gemini response failed:', geminiError.message);

      // Fallback response
      const mockResponse = MOCK_RESPONSES[language]?.default || MOCK_RESPONSES.english.default;

      res.json({
        success: true,
        data: {
          response: mockResponse,
          language,
          timestamp: new Date(),
          model: 'Fallback',
          warning: 'Using fallback response. Gemini API unavailable.'
        }
      });
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message'
    });
  }
});

// @desc    Get disease information from chatbot
// @route   GET /api/chatbot/disease/:name
// @access  Private
router.get('/disease/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { language = 'english' } = req.query;

    try {
      const response = await geminiService.generateFarmingAdvice(
        `What is ${name} in crops? How to treat it?`,
        language
      );

      res.json({
        success: true,
        data: {
          disease: name,
          information: response,
          language
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          disease: name,
          information: `${name} is a crop disease. Please consult with local agricultural experts for specific treatment.`,
          language
        }
      });
    }
  } catch (error) {
    console.error('Disease info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disease information'
    });
  }
});

// @desc    Get farming tips
// @route   GET /api/chatbot/tips
// @access  Private
router.get('/tips', async (req, res) => {
  try {
    const { crop, season, language = 'english' } = req.query;

    try {
      const query = `Give me 3-4 practical farming tips for ${crop || 'general crops'} in ${season || 'current season'}.`;
      const response = await geminiService.generateFarmingAdvice(query, language);

      res.json({
        success: true,
        data: {
          crop: crop || 'general',
          season: season || 'current',
          tips: response,
          language
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          tips: "Practice crop rotation, monitor weather, ensure proper irrigation, and maintain soil health.",
          language
        }
      });
    }
  } catch (error) {
    console.error('Tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tips'
    });
  }
});

module.exports = router;
