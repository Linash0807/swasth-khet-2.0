const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  crop: {
    type: String,
    required: [true, 'Crop type is required'],
    trim: true
  },
  variety: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.1, 'Quantity must be at least 0.1']
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton', 'pieces'],
    default: 'kg'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceUnit: {
    type: String,
    enum: ['per_kg', 'per_quintal', 'per_ton', 'per_piece', 'total'],
    default: 'per_kg'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  harvestDate: {
    type: Date,
    required: [true, 'Harvest date is required']
  },
  quality: {
    type: String,
    enum: ['premium', 'grade_a', 'grade_b', 'standard'],
    default: 'standard'
  },
  organic: {
    type: Boolean,
    default: false
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'sold', 'expired', 'cancelled'],
    default: 'active'
  },
  contactInfo: {
    phone: String,
    email: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'email', 'both'],
      default: 'both'
    }
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    contactMethod: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
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
marketplaceSchema.index({ seller: 1 });
marketplaceSchema.index({ crop: 1 });
marketplaceSchema.index({ location: 1 });
marketplaceSchema.index({ status: 1 });
marketplaceSchema.index({ expiresAt: 1 });
marketplaceSchema.index({ createdAt: -1 });
marketplaceSchema.index({ price: 1 });

// Update the updatedAt field before saving
marketplaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for days until expiry
marketplaceSchema.virtual('daysUntilExpiry').get(function() {
  return Math.floor((this.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted price
marketplaceSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price}/${this.unit}`;
});

// Ensure virtual fields are serialized
marketplaceSchema.set('toJSON', { virtuals: true });
marketplaceSchema.set('toObject', { virtuals: true });

// Auto-expire listings after 30 days
marketplaceSchema.pre('save', function(next) {
  if (this.isModified('createdAt') && !this.expiresAt) {
    this.expiresAt = new Date(this.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Marketplace', marketplaceSchema);
