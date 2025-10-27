const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock carbon calculation data
const CARBON_FACTORS = {
  fertilizer: {
    urea: 2.8, // kg CO2e per kg
    dap: 1.5,
    potash: 0.8,
    organic: 0.3
  },
  irrigation: {
    diesel: 2.7, // kg CO2e per liter
    electric: 0.5, // kg CO2e per kWh
    manual: 0
  },
  transportation: {
    tractor: 0.3, // kg CO2e per km
    truck: 0.8,
    bicycle: 0
  },
  pesticides: {
    chemical: 5.2, // kg CO2e per kg
    organic: 1.1
  }
};

// Validation schema
const carbonCalculationSchema = Joi.object({
  farmArea: Joi.number().min(0.1).required(),
  crops: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    area: Joi.number().min(0.01).required(),
    fertilizers: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      unit: Joi.string().valid('kg', 'liter', 'ton').required()
    })).optional(),
    pesticides: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      unit: Joi.string().valid('kg', 'liter').required()
    })).optional(),
    irrigation: Joi.object({
      method: Joi.string().valid('diesel', 'electric', 'manual').required(),
      amount: Joi.number().min(0).required(),
      unit: Joi.string().valid('liter', 'kwh', 'hours').required()
    }).optional(),
    transportation: Joi.object({
      method: Joi.string().valid('tractor', 'truck', 'bicycle').required(),
      distance: Joi.number().min(0).required(),
      frequency: Joi.number().min(0).required()
    }).optional()
  })).required()
});

// All routes require authentication
router.use(protect);

// @desc    Calculate carbon footprint
// @route   POST /api/carbon/calculate
// @access  Private
router.post('/calculate', async (req, res) => {
  try {
    // Validate input
    const { error } = carbonCalculationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { farmArea, crops } = req.body;

    let totalFootprint = 0;
    const breakdown = {
      fertilizers: 0,
      irrigation: 0,
      transportation: 0,
      pesticides: 0
    };

    // Calculate for each crop
    for (const crop of crops) {
      // Fertilizers
      if (crop.fertilizers) {
        for (const fertilizer of crop.fertilizers) {
          const factor = CARBON_FACTORS.fertilizer[fertilizer.type.toLowerCase()] || 1.0;
          const amount = fertilizer.unit === 'ton' ? fertilizer.amount * 1000 : fertilizer.amount;
          breakdown.fertilizers += amount * factor;
        }
      }

      // Pesticides
      if (crop.pesticides) {
        for (const pesticide of crop.pesticides) {
          const factor = pesticide.type.toLowerCase().includes('organic') ?
            CARBON_FACTORS.pesticides.organic : CARBON_FACTORS.pesticides.chemical;
          const amount = pesticide.unit === 'ton' ? pesticide.amount * 1000 : pesticide.amount;
          breakdown.pesticides += amount * factor;
        }
      }

      // Irrigation
      if (crop.irrigation) {
        const factor = CARBON_FACTORS.irrigation[crop.irrigation.method];
        breakdown.irrigation += crop.irrigation.amount * factor;
      }

      // Transportation
      if (crop.transportation) {
        const factor = CARBON_FACTORS.transportation[crop.transportation.method];
        breakdown.transportation += crop.transportation.distance * crop.transportation.frequency * factor;
      }
    }

    // Calculate total
    totalFootprint = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    // Calculate sustainability score (inverse relationship with footprint)
    const maxFootprint = farmArea * 1000; // Arbitrary max for scoring
    const sustainabilityScore = Math.max(0, Math.min(100, 100 - (totalFootprint / maxFootprint) * 100));

    const result = {
      totalFootprint: Math.round(totalFootprint * 100) / 100, // Round to 2 decimal places
      sustainabilityScore: Math.round(sustainabilityScore),
      breakdown,
      perHectare: Math.round((totalFootprint / farmArea) * 100) / 100,
      recommendations: generateRecommendations(breakdown, sustainabilityScore)
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Carbon calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating carbon footprint'
    });
  }
});

// @desc    Get carbon footprint history
// @route   GET /api/carbon/history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    // Mock historical data - in production, fetch from database
    const history = [];
    const baseFootprint = 820; // kg CO2e

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      history.push({
        date: date.toISOString().slice(0, 7), // YYYY-MM format
        totalFootprint: Math.round((baseFootprint + (Math.random() - 0.5) * 200) * 100) / 100,
        breakdown: {
          fertilizers: Math.round((350 + (Math.random() - 0.5) * 100) * 100) / 100,
          irrigation: Math.round((150 + (Math.random() - 0.5) * 50) * 100) / 100,
          transportation: Math.round((120 + (Math.random() - 0.5) * 40) * 100) / 100,
          pesticides: Math.round((200 + (Math.random() - 0.5) * 60) * 100) / 100
        },
        sustainabilityScore: Math.round(60 + Math.random() * 30)
      });
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get sustainability recommendations
// @route   GET /api/carbon/recommendations
// @access  Private
router.get('/recommendations', async (req, res) => {
  try {
    // Mock personalized recommendations
    const recommendations = [
      {
        category: 'Fertilizer Management',
        title: 'Switch to Organic Fertilizers',
        impact: 'High',
        reduction: 'Reduce emissions by 30%',
        description: 'Using organic compost and bio-fertilizers can significantly reduce your carbon footprint.',
        actionable: true
      },
      {
        category: 'Irrigation',
        title: 'Implement Drip Irrigation',
        impact: 'Medium',
        reduction: 'Reduce emissions by 15%',
        description: 'Water-efficient irrigation reduces energy consumption and wastage.',
        actionable: true
      },
      {
        category: 'Energy',
        title: 'Solar-Powered Equipment',
        impact: 'High',
        reduction: 'Reduce emissions by 25%',
        description: 'Invest in solar panels for pumps and other farm equipment.',
        actionable: true
      },
      {
        category: 'Transportation',
        title: 'Local Distribution Network',
        impact: 'Medium',
        reduction: 'Reduce emissions by 10%',
        description: 'Selling to local buyers reduces transportation emissions.',
        actionable: true
      },
      {
        category: 'Pesticides',
        title: 'Use Integrated Pest Management',
        impact: 'Medium',
        reduction: 'Reduce emissions by 20%',
        description: 'Combine biological, cultural, and chemical methods for pest control.',
        actionable: true
      }
    ];

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to generate recommendations based on footprint
function generateRecommendations(breakdown, score) {
  const recommendations = [];

  if (breakdown.fertilizers > 300) {
    recommendations.push('Consider reducing synthetic fertilizer use and switching to organic alternatives');
  }

  if (breakdown.irrigation > 100) {
    recommendations.push('Implement water-efficient irrigation systems like drip irrigation');
  }

  if (breakdown.transportation > 100) {
    recommendations.push('Optimize transportation routes and consider local distribution');
  }

  if (breakdown.pesticides > 150) {
    recommendations.push('Adopt integrated pest management practices to reduce chemical pesticide use');
  }

  if (score < 70) {
    recommendations.push('Consider renewable energy sources for farm operations');
    recommendations.push('Implement crop rotation and soil conservation practices');
  }

  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring your carbon footprint regularly');
    recommendations.push('Consider carbon offset programs for unavoidable emissions');
  }

  return recommendations.slice(0, 4);
}

module.exports = router;
