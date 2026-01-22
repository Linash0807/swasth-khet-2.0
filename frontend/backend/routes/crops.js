const express = require('express');
const Joi = require('joi');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const cropSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  farm: Joi.string().required(), // ObjectId
  variety: Joi.string().max(50).optional(),
  sowingDate: Joi.date().required(),
  expectedHarvestDate: Joi.date().greater(Joi.ref('sowingDate')).required(),
  area: Joi.number().min(0.01).required(),
  status: Joi.string().valid('planned', 'sown', 'growing', 'ready_to_harvest', 'harvested', 'failed').optional(),
  healthStatus: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'critical').optional(),
  notes: Joi.string().max(500).optional()
});

// All routes require authentication
router.use(protect);

// @desc    Get all crops for logged in user
// @route   GET /api/crops
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { farmId } = req.query;

    let query = { farmer: req.user._id };

    if (farmId) {
      query.farm = farmId;
    }

    const crops = await Crop.find(query)
      .populate('farm', 'name location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: crops
    });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single crop
// @route   GET /api/crops/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.user._id
    }).populate('farm', 'name location area');

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.json({
      success: true,
      data: crop
    });
  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new crop
// @route   POST /api/crops
// @access  Private
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error } = cropSchema.validate(req.body);
    if (error) {
      console.warn('Crop validation error:', error.details[0].message, 'Data:', req.body);
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { farm, area, ...cropData } = req.body;

    // Verify farm ownership
    const farmDoc = await Farm.findOne({
      _id: farm,
      owner: req.user._id
    });

    if (!farmDoc) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found or access denied'
      });
    }

    // Check if farm has enough available area
    const existingCrops = await Crop.find({ farm });
    const usedArea = existingCrops.reduce((sum, crop) => sum + crop.area, 0);
    const availableArea = farmDoc.area - usedArea;

    if (area > availableArea) {
      return res.status(400).json({
        success: false,
        message: `Insufficient farm area. Available: ${availableArea} acres`
      });
    }

    // Create crop
    const crop = await Crop.create({
      ...cropData,
      farm,
      farmer: req.user._id,
      area
    });

    // Add crop to farm's crops array
    await Farm.findByIdAndUpdate(farm, {
      $push: { crops: crop._id }
    });

    const populatedCrop = await Crop.findById(crop._id).populate('farm', 'name location');

    res.status(201).json({
      success: true,
      data: populatedCrop
    });
  } catch (error) {
    console.error('Create crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update crop
// @route   PUT /api/crops/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.user._id
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // If updating area, check farm capacity
    if (req.body.area && req.body.area !== crop.area) {
      const farm = await Farm.findById(crop.farm);
      const otherCrops = await Crop.find({
        farm: crop.farm,
        _id: { $ne: req.params.id }
      });
      const usedArea = otherCrops.reduce((sum, c) => sum + c.area, 0);
      const availableArea = farm.area - usedArea;

      if (req.body.area > availableArea) {
        return res.status(400).json({
          success: false,
          message: `Insufficient farm area. Available: ${availableArea} acres`
        });
      }
    }

    const updatedCrop = await Crop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farm', 'name location');

    res.json({
      success: true,
      data: updatedCrop
    });
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.user._id
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Remove crop from farm's crops array
    await Farm.findByIdAndUpdate(crop.farm, {
      $pull: { crops: crop._id }
    });

    await Crop.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Crop deleted successfully'
    });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get crop analytics
// @route   GET /api/crops/:id/analytics
// @access  Private
router.get('/:id/analytics', async (req, res) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.user._id
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Calculate analytics
    const analytics = {
      ageInDays: crop.ageInDays,
      daysUntilHarvest: crop.daysUntilHarvest,
      growthProgress: crop.expectedHarvestDate ?
        Math.min(100, Math.max(0, ((Date.now() - crop.sowingDate) / (crop.expectedHarvestDate - crop.sowingDate)) * 100)) : 0,
      healthScore: crop.healthStatus === 'excellent' ? 100 :
        crop.healthStatus === 'good' ? 75 :
          crop.healthStatus === 'fair' ? 50 :
            crop.healthStatus === 'poor' ? 25 : 0,
      diseaseIncidents: crop.diseases ? crop.diseases.length : 0,
      inputCosts: crop.inputs ? (
        (crop.inputs.seeds?.cost || 0) +
        (crop.inputs.fertilizers?.reduce((sum, f) => sum + f.cost, 0) || 0) +
        (crop.inputs.pesticides?.reduce((sum, p) => sum + p.cost, 0) || 0)
      ) : 0
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get crop analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
