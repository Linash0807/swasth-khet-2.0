const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const CarbonFootprintService = require('../services/carbonService');

const router = express.Router();

// Validation schemas
const carbonEntrySchema = Joi.object({
  farmId: Joi.string().optional(),
  areaHectares: Joi.number().min(0.1).required(),
  fertilizerUsage: Joi.object({
    synthetic: Joi.number().min(0).optional(),
    organic: Joi.number().min(0).optional()
  }).optional(),
  pesticideUsage: Joi.object({
    chemical: Joi.number().min(0).optional(),
    organic: Joi.number().min(0).optional()
  }).optional(),
  fuelUsage: Joi.object({
    diesel: Joi.number().min(0).optional(),
    petrol: Joi.number().min(0).optional(),
    electricity: Joi.number().min(0).optional()
  }).optional(),
  irrigationType: Joi.string().valid('flood', 'drip', 'sprinkler', 'rainfed').optional(),
  irrigationHours: Joi.number().min(0).optional(),
  transportMethod: Joi.string().valid('manual', 'bullock_cart', 'tractor', 'truck').optional(),
  conservationAgriculture: Joi.boolean().optional(),
  mulching: Joi.boolean().optional(),
  cropDiversity: Joi.number().min(1).optional()
});

// All routes require authentication
router.use(protect);

// @desc    Calculate carbon footprint
// @route   POST /api/carbon/calculate
// @access  Private
router.post('/calculate', async (req, res) => {
  try {
    const { fertilizerUse, pesticideUse, fuelUse, energyUse } = req.body;

    // Convert to the format expected by CarbonFootprintService
    const value = {
      area: 1, // Default to 1 hectare if not specified
      fertilizerUsage: { synthetic: fertilizerUse || 0 },
      pesticideUsage: { chemical: pesticideUse || 0 },
      fuelUsage: { diesel: fuelUse || 0 },
      energyUsage: { electricity: energyUse || 0 }, // Added for clarity
      irrigationHours: 0,
      irrigationType: 'flood'
    };

    const baselineFootprint = CarbonFootprintService.calculateBaselineFootprint(value);
    const ecofriendlyFootprint = CarbonFootprintService.calculateEcofriendlyFootprint(value);
    const carbonReduction = CarbonFootprintService.calculateCarbonReduction(
      baselineFootprint,
      ecofriendlyFootprint
    );

    const recommendations = CarbonFootprintService.getEcofriendlyRecommendations(value);
    const sustainabilityScore = CarbonFootprintService.calculateSustainabilityScore(value);

    res.json({
      success: true,
      data: {
        totalFootprint: baselineFootprint,
        score: sustainabilityScore,
        metrics: {
          fertilizer: (fertilizerUse || 0) * 4.5,
          pesticides: (pesticideUse || 0) * 2.5,
          fuel: (fuelUse || 0) * 2.68,
          energy: (energyUse || 0) * 0.95
        },
        percentageBreakdown: {
          fertilizer: baselineFootprint > 0 ? ((fertilizerUse || 0) * 4.5 / baselineFootprint) * 100 : 0,
          pesticides: baselineFootprint > 0 ? ((pesticideUse || 0) * 2.5 / baselineFootprint) * 100 : 0,
          fuel: baselineFootprint > 0 ? ((fuelUse || 0) * 2.68 / baselineFootprint) * 100 : 0,
          energy: baselineFootprint > 0 ? ((energyUse || 0) * 0.95 / baselineFootprint) * 100 : 0
        },
        recommendations: recommendations.map(r => ({
          title: r.practice,
          description: r.implementation,
          impact: r.priority === 'high' ? 'High' : 'Medium',
          reduction: r.impact
        }))
      }
    });
  } catch (error) {
    console.error('Carbon calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating carbon footprint'
    });
  }
});

// @desc    Get carbon history
// @route   GET /api/carbon/history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    // Mock history data
    const mockHistory = [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        baselineFootprint: 2500,
        ecofriendlyFootprint: 1200,
        carbonReduction: 52
      },
      {
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        baselineFootprint: 2300,
        ecofriendlyFootprint: 900,
        carbonReduction: 61
      },
      {
        date: new Date(),
        baselineFootprint: 2000,
        ecofriendlyFootprint: 650,
        carbonReduction: 68
      }
    ];

    res.json({
      success: true,
      data: mockHistory
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching carbon history'
    });
  }
});

// @desc    Get recommendations
// @route   GET /api/carbon/recommendations
// @access  Private
router.get('/recommendations', async (req, res) => {
  try {
    // Return mock recommendations
    const mockRecommendations = [
      {
        practice: 'Switch to organic fertilizer',
        impact: 'Reduce emissions by 82%',
        savings: '850 kg CO2',
        priority: 'high',
        implementation: 'Start using compost or FYM'
      },
      {
        practice: 'Install drip irrigation',
        impact: 'Reduce emissions by 70%',
        savings: '450 kg CO2',
        priority: 'high',
        implementation: 'Initial investment, long-term savings'
      },
      {
        practice: 'Practice crop rotation',
        impact: 'Reduce chemical use, improve yield',
        priority: 'medium',
        implementation: 'Alternate with legumes'
      }
    ];

    res.json({
      success: true,
      data: mockRecommendations
    });
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations'
    });
  }
});

// @desc    Get sustainability score
// @route   GET /api/carbon/score
// @access  Private
router.get('/score', async (req, res) => {
  try {
    const mockScore = {
      score: 72,
      level: 'Good',
      breakdown: {
        fertilizer: 75,
        pesticide: 70,
        irrigation: 80,
        diversification: 65,
        conservation: 70
      },
      improvements: [
        'Your irrigation is efficient. Keep it up!',
        'Consider using more organic fertilizers',
        'Increase crop diversity for better sustainability'
      ],
      targetScore: 85
    };

    res.json({
      success: true,
      data: mockScore
    });
  } catch (error) {
    console.error('Score fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating sustainability score'
    });
  }
});

// @desc    Get carbon credit potential
// @route   GET /api/carbon/credits
// @access  Private
router.get('/credits', async (req, res) => {
  try {
    const mockCredits = {
      totalReduction: 1500, // kg CO2
      potentialValue: 600, // ₹
      creditsEarned: 1.5, // carbon credits
      projectStatus: 'eligible',
      nextMilestone: {
        target: 2000,
        progress: 75,
        daysToAchieve: 45
      }
    };

    res.json({
      success: true,
      data: mockCredits
    });
  } catch (error) {
    console.error('Credits fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching carbon credit information'
    });
  }
});

module.exports = router;
