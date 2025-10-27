const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock chatbot responses - in production, integrate with AI service
const CHATBOT_RESPONSES = {
  english: {
    greeting: "Namaste! I'm your farming assistant. Ask me anything about crops, diseases, weather, or farming techniques. I can help in Hindi, English, Telugu, and Tamil!",
    default: "I'm here to help with farming advice. You can ask me about crop diseases, weather conditions, farming techniques, or general agricultural questions.",
    diseases: {
      "leaf blight": "Leaf blight is a common fungal disease. Remove infected leaves immediately and apply copper-based fungicide. Improve air circulation around plants.",
      "powdery mildew": "Powdery mildew appears as white powdery spots. Apply sulfur-based fungicide and ensure good air circulation. Avoid overhead watering.",
      "root rot": "Root rot is caused by overwatering. Improve drainage, reduce watering frequency, and use well-draining soil. Remove affected plants.",
      "aphids": "Aphids are small insects that cluster on stems. Use insecticidal soap or neem oil. Introduce beneficial insects like ladybugs."
    },
    weather: {
      "rain": "Heavy rain can cause waterlogging. Ensure proper drainage in your fields. Delay pesticide application until after rain.",
      "drought": "During drought, prioritize irrigation for high-value crops. Use mulch to conserve soil moisture. Consider drought-resistant varieties.",
      "heat": "High temperatures stress plants. Provide shade for sensitive crops, increase irrigation, and avoid fertilizing during peak heat."
    },
    crops: {
      "wheat": "Wheat prefers well-drained soil with pH 6.0-7.0. Plant in winter months. Requires about 50-75 cm rainfall or irrigation.",
      "rice": "Rice needs flooded conditions. Plant in monsoon season. Requires 120-150 cm water. Use high-yielding varieties.",
      "tomato": "Tomatoes need full sun, warm temperatures (21-29°C), and well-drained soil. Stake plants for support. Watch for blight diseases.",
      "corn": "Corn needs full sun and fertile soil. Plant after last frost. Requires consistent moisture. Watch for corn borers."
    },
    techniques: {
      "organic farming": "Organic farming avoids synthetic chemicals. Use compost, crop rotation, beneficial insects, and natural pest control methods.",
      "drip irrigation": "Drip irrigation delivers water directly to roots, reducing water waste by 30-50%. Ideal for water-scarce areas.",
      "crop rotation": "Crop rotation prevents soil depletion and reduces pest/disease problems. Rotate crops with different nutrient needs.",
      "composting": "Composting turns organic waste into nutrient-rich fertilizer. Mix green and brown materials. Turn pile regularly."
    }
  },
  hindi: {
    greeting: "नमस्ते! मैं आपका कृषि सहायक हूं। फसलों, बीमारियों, मौसम या कृषि तकनीकों के बारे में कुछ भी पूछें। मैं हिंदी, अंग्रेजी, तेलुगु और तमिल में मदद कर सकता हूं!",
    default: "मैं कृषि सलाह देने के लिए यहां हूं। आप मुझसे फसल की बीमारियों, मौसम की स्थिति, कृषि तकनीकों या सामान्य कृषि प्रश्न पूछ सकते हैं।",
    diseases: {
      "लीफ ब्लाइट": "लीफ ब्लाइट एक आम फंगल बीमारी है। संक्रमित पत्तियों को तुरंत हटा दें और कॉपर-आधारित कवकनाशी लागू करें। पौधों के आसपास हवा का संचार सुधारें।",
      "पाउडरी मिल्ड्यू": "पाउडरी मिल्ड्यू सफेद पाउडरी धब्बों के रूप में दिखाई देता है। सल्फर-आधारित कवकनाशी लागू करें और अच्छा हवा संचार सुनिश्चित करें। ऊपर से पानी देने से बचें।"
    }
  },
  telugu: {
    greeting: "నమస్కారం! నేను మీ వ్యవసాయ సహాయకుడు. పంటలు, వ్యాధులు, వాతావరణం లేదా వ్యవసాయ పద్ధతుల గురించి ఏదైనా అడగండి. నేను హిందీ, ఇంగ్లీష్, తెలుగు మరియు తమిళంలో సహాయం చేయగలను!",
    default: "వ్యవసాయ సలహా ఇవ్వడానికి నేను ఇక్కడ ఉన్నాను. మీరు నాకు పంట వ్యాధులు, వాతావరణ పరిస్థితులు, వ్యవసాయ పద్ధతులు లేదా సాధారణ వ్యవసాయ ప్రశ్నలను అడగవచ్చు."
  },
  tamil: {
    greeting: "வணக்கம்! நான் உங்கள் விவசாய உதவியாளர். பயிர்கள், நோய்கள், வானிலை அல்லது விவசாய நுட்பங்கள் பற்றி எதையும் கேளுங்கள். நான் இந்தி, ஆங்கிலம், தெலுங்கு மற்றும் தமிழில் உதவ முடியும்!",
    default: "விவசாய ஆலோசனை கொடுக்க நான் இங்கே இருக்கிறேன். பயிர் நோய்கள், வானிலை நிலவரம், விவசாய நுட்பங்கள் அல்லது பொதுவான விவசாய கேள்விகளை என்னிடம் கேட்கலாம்."
  }
};

// Validation schema
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(500).required(),
  language: Joi.string().valid('english', 'hindi', 'telugu', 'tamil').default('english')
});

// All routes require authentication
router.use(protect);

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
// @access  Private
router.post('/message', async (req, res) => {
  try {
    // Validate input
    const { error } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { message, language = 'english' } = req.body;
    const responses = CHATBOT_RESPONSES[language] || CHATBOT_RESPONSES.english;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    let response = responses.default;
    const lowerMessage = message.toLowerCase();

    // Check for keywords and provide specific responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('namaste') ||
        lowerMessage.includes('नमस्ते') || lowerMessage.includes('నమస్కారం') || lowerMessage.includes('வணக்கம்')) {
      response = responses.greeting;
    }
    // Disease-related queries
    else if (lowerMessage.includes('disease') || lowerMessage.includes('blight') || lowerMessage.includes('mildew') ||
             lowerMessage.includes('rot') || lowerMessage.includes('aphid') || lowerMessage.includes('बीमारी') ||
             lowerMessage.includes('వ్యాధి') || lowerMessage.includes('நோய்')) {
      // Check for specific diseases
      for (const [key, value] of Object.entries(responses.diseases || {})) {
        if (lowerMessage.includes(key)) {
          response = value;
          break;
        }
      }
    }
    // Weather-related queries
    else if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('drought') ||
             lowerMessage.includes('heat') || lowerMessage.includes('temperature') || lowerMessage.includes('मौसम') ||
             lowerMessage.includes('వాతావరణం') || lowerMessage.includes('வானிலை')) {
      for (const [key, value] of Object.entries(responses.weather || {})) {
        if (lowerMessage.includes(key)) {
          response = value;
          break;
        }
      }
    }
    // Crop-related queries
    else if (lowerMessage.includes('wheat') || lowerMessage.includes('rice') || lowerMessage.includes('tomato') ||
             lowerMessage.includes('corn') || lowerMessage.includes('गेहूं') || lowerMessage.includes('चावल') ||
             lowerMessage.includes('टमाटर') || lowerMessage.includes('गेंहू') || lowerMessage.includes('వరిగా') ||
             lowerMessage.includes('వరిగా') || lowerMessage.includes('தானியம்') || lowerMessage.includes('அரிசி')) {
      for (const [key, value] of Object.entries(responses.crops || {})) {
        if (lowerMessage.includes(key)) {
          response = value;
          break;
        }
      }
    }
    // Technique-related queries
    else if (lowerMessage.includes('organic') || lowerMessage.includes('irrigation') || lowerMessage.includes('rotation') ||
             lowerMessage.includes('compost') || lowerMessage.includes('technique') || lowerMessage.includes('method') ||
             lowerMessage.includes('जैविक') || lowerMessage.includes('सिंचाई') || lowerMessage.includes('क्रॉप रोटेशन') ||
             lowerMessage.includes('कंपोस्ट') || lowerMessage.includes('సాంకేతిక') || lowerMessage.includes('నీటిపారుదల') ||
             lowerMessage.includes('உரம்') || lowerMessage.includes('நீர்ப்பாசனம்')) {
      for (const [key, value] of Object.entries(responses.techniques || {})) {
        if (lowerMessage.includes(key)) {
          response = value;
          break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        message: response,
        language: language,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message'
    });
  }
});

// @desc    Get suggested questions
// @route   GET /api/chatbot/suggestions
// @access  Private
router.get('/suggestions', async (req, res) => {
  try {
    const { language = 'english' } = req.query;

    const suggestions = {
      english: [
        "What's the best time to plant wheat?",
        "How do I treat yellow leaves on tomato plants?",
        "What fertilizer should I use for rice?",
        "How much water does corn need?",
        "What are the symptoms of leaf blight?",
        "How to implement drip irrigation?"
      ],
      hindi: [
        "गेहूं बोने का सबसे अच्छा समय क्या है?",
        "टमाटर के पत्तों पर पीले रंग के धब्बों का इलाज कैसे करें?",
        "चावल के लिए कौन सा उर्वरक इस्तेमाल करना चाहिए?",
        "मक्का को कितना पानी चाहिए?",
        "लीफ ब्लाइट के लक्षण क्या हैं?",
        "ड्रिप सिंचाई कैसे लागू करें?"
      ],
      telugu: [
        "గోధుమలు నాటడానికి ఉత్తమ సమయం ఏమిటి?",
        "టొమాటో ఆకులపై పసుపు రంగు మచ్చలకు చికిత్స ఎలా?",
        "వరిగా కోసం ఏ ఎరువు వాడాలి?",
        "మొక్కజొన్నకు ఎంత నీరు కావాలి?",
        "లీఫ్ బ్లైట్ లక్షణాలు ఏమిటి?",
        "డ్రిప్ నీటిపారుదల ఎలా అమలు చేయాలి?"
      ],
      tamil: [
        "கோதுமை நடவு செய்ய சிறந்த நேரம் என்ன?",
        "தக்காளி இலைகளில் மஞ்சள் கறைகளுக்கு சிகிச்சை எப்படி?",
        "அரிசிக்கு எந்த உரம் பயன்படுத்த வேண்டும்?",
        "சோளத்திற்கு எவ்வளவு தண்ணீர் தேவை?",
        "இலை நலிவின் அறிகுறிகள் என்ன?",
        "துளி நீர்ப்பாசனத்தை எப்படி செயல்படுத்துவது?"
      ]
    };

    res.json({
      success: true,
      data: suggestions[language] || suggestions.english
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get chatbot statistics
// @route   GET /api/chatbot/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    // Mock statistics - in production, track actual usage
    const stats = {
      totalConversations: 1247,
      languagesUsed: {
        english: 45,
        hindi: 30,
        telugu: 15,
        tamil: 10
      },
      popularTopics: [
        { topic: 'Disease Diagnosis', count: 423 },
        { topic: 'Weather Advice', count: 312 },
        { topic: 'Crop Management', count: 298 },
        { topic: 'Irrigation', count: 214 }
      ],
      averageResponseTime: '1.2 seconds'
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
