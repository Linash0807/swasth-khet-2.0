const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Mock disease database - in production, this would be an AI/ML service
const DISEASE_DATABASE = {
  'leaf_blight': {
    name: 'Leaf Blight',
    confidence: 94,
    severity: 'medium',
    symptoms: ['Yellow spots on leaves', 'Brown edges', 'Wilting'],
    treatment: [
      'Remove infected leaves immediately',
      'Apply copper-based fungicide',
      'Improve air circulation around plants',
      'Water at base of plant, not leaves'
    ],
    preventive: [
      'Rotate crops annually',
      'Use disease-resistant varieties',
      'Maintain proper plant spacing',
      'Monitor regularly for early signs'
    ]
  },
  'powdery_mildew': {
    name: 'Powdery Mildew',
    confidence: 87,
    severity: 'low',
    symptoms: ['White powdery coating on leaves', 'Leaf curling', 'Stunted growth'],
    treatment: [
      'Apply sulfur-based fungicide',
      'Increase air circulation',
      'Avoid overhead watering',
      'Remove infected plant parts'
    ],
    preventive: [
      'Plant in full sun',
      'Avoid crowded planting',
      'Water early in the day',
      'Apply preventive fungicide'
    ]
  },
  'root_rot': {
    name: 'Root Rot',
    confidence: 91,
    severity: 'high',
    symptoms: ['Yellowing leaves', 'Root discoloration', 'Foul smell from roots', 'Plant wilting'],
    treatment: [
      'Improve drainage immediately',
      'Remove affected plants',
      'Apply fungicide to soil',
      'Reduce watering frequency',
      'Use well-draining soil mix'
    ],
    preventive: [
      'Ensure proper drainage',
      'Avoid overwatering',
      'Use sterilized soil',
      'Rotate crops regularly'
    ]
  },
  'aphid_infestation': {
    name: 'Aphid Infestation',
    confidence: 78,
    severity: 'medium',
    symptoms: ['Clusters of small insects on stems', 'Curled leaves', 'Sticky residue', 'Ant presence'],
    treatment: [
      'Spray with insecticidal soap',
      'Introduce beneficial insects',
      'Remove heavily infested parts',
      'Apply neem oil solution'
    ],
    preventive: [
      'Regular monitoring',
      'Encourage natural predators',
      'Avoid excessive nitrogen fertilizer',
      'Plant companion plants'
    ]
  }
};

// Get random disease for demo purposes
const getRandomDisease = () => {
  const diseases = Object.values(DISEASE_DATABASE);
  return diseases[Math.floor(Math.random() * diseases.length)];
};

// Validation schema
const analysisSchema = Joi.object({
  imageUrl: Joi.string().optional(),
  cropType: Joi.string().optional(),
  location: Joi.string().optional()
});

// All routes require authentication
router.use(protect);

// @desc    Analyze crop disease from image
// @route   POST /api/disease/analyze
// @access  Private
router.post('/analyze', uploadSingle, handleUploadError, async (req, res) => {
  try {
    // In production, this would send the image to an AI/ML service
    // For now, we'll simulate the analysis

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get random disease for demo (in production, analyze the actual image)
    const disease = getRandomDisease();

    const analysis = {
      disease: disease.name,
      confidence: disease.confidence,
      severity: disease.severity,
      symptoms: disease.symptoms,
      treatment: disease.treatment,
      preventive: disease.preventive,
      imageUrl: `/uploads/${req.file.filename}`,
      analyzedAt: new Date(),
      recommendations: [
        'Monitor the plant closely for the next few days',
        'Follow treatment recommendations immediately',
        'Consider consulting local agricultural extension services',
        'Keep records of treatments applied'
      ]
    };

    res.json({
      success: true,
      data: {
        report: analysis,
        analysis: {
          model: 'SwasthKhet-AI-v1.0',
          processingTime: '2.1 seconds',
          confidence: disease.confidence
        }
      }
    });
  } catch (error) {
    console.error('Disease analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing image'
    });
  }
});

// @desc    Get disease analysis reports
// @route   GET /api/disease/reports
// @access  Private
router.get('/reports', async (req, res) => {
  try {
    // In production, this would fetch from database
    // For now, return mock data
    const mockReports = [
      {
        id: '1',
        cropType: 'Tomato',
        disease: 'Leaf Blight',
        confidence: 94,
        severity: 'medium',
        analyzedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        imageUrl: '/uploads/sample-tomato-blight.jpg',
        status: 'treated'
      },
      {
        id: '2',
        cropType: 'Wheat',
        disease: 'Powdery Mildew',
        confidence: 87,
        severity: 'low',
        analyzedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        imageUrl: '/uploads/sample-wheat-mildew.jpg',
        status: 'monitoring'
      }
    ];

    res.json({
      success: true,
      data: mockReports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get disease information
// @route   GET /api/disease/info/:diseaseName
// @access  Private
router.get('/info/:diseaseName', async (req, res) => {
  try {
    const diseaseKey = req.params.diseaseName.toLowerCase().replace(/\s+/g, '_');
    const disease = DISEASE_DATABASE[diseaseKey];

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease information not found'
      });
    }

    res.json({
      success: true,
      data: disease
    });
  } catch (error) {
    console.error('Get disease info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all known diseases
// @route   GET /api/disease/types
// @access  Private
router.get('/types', async (req, res) => {
  try {
    const diseases = Object.values(DISEASE_DATABASE).map(disease => ({
      name: disease.name,
      severity: disease.severity,
      commonCrops: ['Tomato', 'Potato', 'Wheat', 'Rice', 'Corn'] // Mock data
    }));

    res.json({
      success: true,
      data: diseases
    });
  } catch (error) {
    console.error('Get disease types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
