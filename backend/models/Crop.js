const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
    maxlength: [50, 'Crop name cannot exceed 50 characters']
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  variety: {
    type: String,
    trim: true,
    maxlength: [50, 'Variety cannot exceed 50 characters']
  },
  sowingDate: {
    type: Date,
    required: [true, 'Sowing date is required']
  },
  expectedHarvestDate: {
    type: Date,
    required: [true, 'Expected harvest date is required']
  },
  actualHarvestDate: Date,
  area: {
    type: Number,
    required: [true, 'Area is required'],
    min: [0.01, 'Area must be at least 0.01 acres']
  },
  status: {
    type: String,
    enum: ['planned', 'sown', 'growing', 'ready_to_harvest', 'harvested', 'failed'],
    default: 'planned'
  },
  healthStatus: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
    default: 'good'
  },
  yield: {
    estimated: Number, // in kg/acre
    actual: Number, // in kg/acre
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton'],
      default: 'kg'
    }
  },
  inputs: {
    seeds: {
      type: String,
      quantity: Number,
      cost: Number
    },
    fertilizers: [{
      name: String,
      quantity: Number,
      unit: String,
      cost: Number,
      applicationDate: Date
    }],
    pesticides: [{
      name: String,
      quantity: Number,
      unit: String,
      cost: Number,
      applicationDate: Date
    }],
    irrigation: {
      method: String,
      frequency: String,
      waterUsed: Number // in liters
    }
  },
  diseases: [{
    name: String,
    detectedDate: Date,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    treatment: String,
    outcome: String
  }],
  weather: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    notes: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
cropSchema.index({ farm: 1 });
cropSchema.index({ farmer: 1 });
cropSchema.index({ status: 1 });
cropSchema.index({ sowingDate: -1 });
cropSchema.index({ expectedHarvestDate: 1 });

// Update the updatedAt field before saving
cropSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for crop age in days
cropSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.sowingDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days until harvest
cropSchema.virtual('daysUntilHarvest').get(function() {
  if (this.expectedHarvestDate) {
    return Math.floor((this.expectedHarvestDate - Date.now()) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Ensure virtual fields are serialized
cropSchema.set('toJSON', { virtuals: true });
cropSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Crop', cropSchema);
