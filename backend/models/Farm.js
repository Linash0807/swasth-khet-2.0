const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Farm name is required'],
    trim: true,
    maxlength: [100, 'Farm name cannot exceed 100 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  area: {
    type: Number,
    required: [true, 'Area is required'],
    min: [0.1, 'Area must be at least 0.1 acres']
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  soilType: {
    type: String,
    enum: ['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalky'],
    default: 'loamy'
  },
  irrigationType: {
    type: String,
    enum: ['drip', 'sprinkler', 'flood', 'rainfed', 'manual'],
    default: 'rainfed'
  },
  crops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'abandoned'],
    default: 'active'
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
farmSchema.index({ owner: 1 });
farmSchema.index({ location: 1 });
farmSchema.index({ status: 1 });
farmSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
farmSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total crop area
farmSchema.virtual('totalCropArea').get(function() {
  return this.crops ? this.crops.length : 0;
});

// Ensure virtual fields are serialized
farmSchema.set('toJSON', { virtuals: true });
farmSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Farm', farmSchema);
