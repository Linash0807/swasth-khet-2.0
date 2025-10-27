const express = require('express');
const Joi = require('joi');
const Marketplace = require('../models/Marketplace');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const listingSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(1).max(500).required(),
  crop: Joi.string().min(1).required(),
  variety: Joi.string().max(50).optional(),
  quantity: Joi.number().min(0.1).required(),
  unit: Joi.string().valid('kg', 'quintal', 'ton', 'pieces').optional(),
  price: Joi.number().min(0).required(),
  priceUnit: Joi.string().valid('per_kg', 'per_quintal', 'per_ton', 'per_piece', 'total').optional(),
  location: Joi.string().min(1).required(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }).optional(),
  harvestDate: Joi.date().required(),
  quality: Joi.string().valid('premium', 'grade_a', 'grade_b', 'standard').optional(),
  organic: Joi.boolean().optional(),
  contactInfo: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    preferredContact: Joi.string().valid('phone', 'email', 'both').optional()
  }).optional()
});

// All routes require authentication
router.use(protect);

// @desc    Get all marketplace listings
// @route   GET /api/marketplace
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      crop,
      location,
      quality,
      organic,
      minPrice,
      maxPrice,
      limit = 20,
      page = 1
    } = req.query;

    // Build query
    let query = { status: 'active' };

    if (crop) query.crop = new RegExp(crop, 'i');
    if (location) query.location = new RegExp(location, 'i');
    if (quality) query.quality = quality;
    if (organic === 'true') query.organic = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Marketplace.find(query)
      .populate('seller', 'name email phone profile.location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Marketplace.countDocuments(query);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single listing
// @route   GET /api/marketplace/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id)
      .populate('seller', 'name email phone profile.location profile.avatar')
      .populate('inquiries.user', 'name email');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Increment view count
    await Marketplace.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new listing
// @route   POST /api/marketplace
// @access  Private
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error } = listingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Add seller to listing data
    const listingData = {
      ...req.body,
      seller: req.user._id
    };

    const listing = await Marketplace.create(listingData);

    const populatedListing = await Marketplace.findById(listing._id)
      .populate('seller', 'name email phone profile.location');

    res.status(201).json({
      success: true,
      data: populatedListing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update listing
// @route   PUT /api/marketplace/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const listing = await Marketplace.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or access denied'
      });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update inactive listing'
      });
    }

    const updatedListing = await Marketplace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('seller', 'name email phone profile.location');

    res.json({
      success: true,
      data: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete listing
// @route   DELETE /api/marketplace/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const listing = await Marketplace.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or access denied'
      });
    }

    await Marketplace.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user's listings
// @route   GET /api/marketplace/user/listings
// @access  Private
router.get('/user/listings', async (req, res) => {
  try {
    const listings = await Marketplace.find({ seller: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send inquiry about listing
// @route   POST /api/marketplace/:id/inquire
// @access  Private
router.post('/:id/inquire', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Add inquiry
    const inquiry = {
      user: req.user._id,
      message: message.trim(),
      contactMethod: req.body.contactMethod || 'email'
    };

    await Marketplace.findByIdAndUpdate(req.params.id, {
      $push: { inquiries: inquiry }
    });

    res.json({
      success: true,
      message: 'Inquiry sent successfully'
    });
  } catch (error) {
    console.error('Send inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get marketplace statistics
// @route   GET /api/marketplace/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await Marketplace.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          byCrop: {
            $push: {
              crop: '$crop',
              price: '$price',
              quantity: '$quantity'
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalListings: 0,
      avgPrice: 0,
      totalValue: 0,
      byCrop: []
    };

    res.json({
      success: true,
      data: result
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
