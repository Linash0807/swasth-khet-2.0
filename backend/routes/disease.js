const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const { Crop } = require('../models/Crop');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Mock disease database - fallback when Gemini is unavailable
const DISEASE_DATABASE = {
  'leaf_blight': {
    name: 'Leaf Blight',
    confidence: 94,
    severity: 'medium',
    symptoms: ['Yellow spots on leaves', 'Brown edges', 'Wilting'],
    treatment: {
      immediate: ['Remove infected leaves immediately'],
      chemical: ['Apply copper-based fungicide'],
      organic: ['Neem oil spray'],
      preventive: ['Rotate crops annually', 'Use disease-resistant varieties']
    }
  },
  'powdery_mildew': {
    name: 'Powdery Mildew',
    confidence: 87,
    severity: 'low',
    symptoms: ['White powdery coating on leaves', 'Leaf curling', 'Stunted growth'],
    treatment: {
      immediate: ['Remove infected parts'],
      chemical: ['Sulfur-based fungicide'],
      organic: ['Baking soda solution', 'Potassium bicarbonate'],
      preventive: ['Plant in full sun', 'Avoid crowded planting']
    }
  }
};

// @desc    Analyze crop disease from image using Gemini Vision API
// @route   POST /api/disease/analyze
// @access  Private
router.post('/analyze', uploadSingle, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const filePath = req.file.path;

    try {
      // Use Gemini Vision API for analysis
      const analysis = await geminiService.analyzeCropDisease(filePath);

      // Check if Gemini reported an error (e.g., image is not a plant)
      if (analysis.error === "true" || analysis.error === true) {
        return res.status(422).json({
          success: false,
          message: analysis.message || 'The uploaded image could not be identified as a crop or plant. Please upload a clear photo of a crop leaf.',
          data: {
            report: null,
            imageUrl: `/uploads/${req.file.filename}`,
            analyzedAt: new Date()
          }
        });
      }

      res.json({
        success: true,
        data: {
          report: analysis,
          imageUrl: `/uploads/${req.file.filename}`,
          analyzedAt: new Date(),
          model: process.env.ENABLE_MOCK_GEMINI === 'true' ? 'Demo Mode' : 'Gemini AI'
        }
      });
    } catch (geminiError) {
      console.error('Gemini analysis failed:', geminiError.message);
      res.status(geminiError.status || 500).json({
        success: false,
        message: geminiError.message || 'AI analysis failed',
        error: geminiError.message
      });
    }
  } catch (error) {
    console.error('Disease analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during analysis'
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
