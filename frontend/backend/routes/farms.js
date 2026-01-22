const express = require('express');
const Joi = require('joi');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const farmSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  location: Joi.string().min(1).required(),
  area: Joi.number().min(0.1).required(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }).optional(),
  soilType: Joi.string().valid('clay', 'sandy', 'loamy', 'silt', 'peat', 'chalky').optional(),
  irrigationType: Joi.string().valid('drip', 'sprinkler', 'flood', 'rainfed', 'manual').optional(),
  notes: Joi.string().max(500).optional()
});

// All routes require authentication
router.use(protect);

// @desc    Get all farms for logged in user
// @route   GET /api/farms
// @access  Private
router.get('/', async (req, res) => {
  try {
    const farms = await Farm.find({ owner: req.user._id })
      .populate('crops')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: farms
    });
  } catch (error) {
    console.error('Get farms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single farm
// @route   GET /api/farms/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).populate('crops');

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    res.json({
      success: true,
      data: farm
    });
  } catch (error) {
    console.error('Get farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new farm
// @route   POST /api/farms
// @access  Private
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error } = farmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Add owner to farm data
    const farmData = {
      ...req.body,
      owner: req.user._id
    };

    const farm = await Farm.create(farmData);

    res.status(201).json({
      success: true,
      data: farm
    });
  } catch (error) {
    console.error('Create farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update farm
// @route   PUT /api/farms/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    // Validate input
    const { error } = farmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    res.json({
      success: true,
      data: farm
    });
  } catch (error) {
    console.error('Update farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete farm
// @route   DELETE /api/farms/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    // Check if farm has active crops
    const activeCrops = await Crop.countDocuments({
      farm: req.params.id,
      status: { $in: ['planned', 'sown', 'growing', 'ready_to_harvest'] }
    });

    if (activeCrops > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete farm with active crops. Please harvest or remove crops first.'
      });
    }

    const farm = await Farm.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    res.json({
      success: true,
      message: 'Farm deleted successfully'
    });
  } catch (error) {
    console.error('Delete farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get farm statistics
// @route   GET /api/farms/:id/stats
// @access  Private
router.get('/:id/stats', async (req, res) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const crops = await Crop.find({ farm: req.params.id });

    const stats = {
      totalArea: farm.area,
      usedArea: crops.reduce((sum, crop) => sum + crop.area, 0),
      availableArea: farm.area - crops.reduce((sum, crop) => sum + crop.area, 0),
      totalCrops: crops.length,
      activeCrops: crops.filter(crop => ['sown', 'growing', 'ready_to_harvest'].includes(crop.status)).length,
      harvestedCrops: crops.filter(crop => crop.status === 'harvested').length,
      healthScore: farm.healthScore
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get farm stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
