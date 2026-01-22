// Dynamic pricing service for marketplace
// Handles price recommendations based on market data, demand, and trends

class DynamicPricingService {
  // Base market prices (in ₹ per kg) - can be fetched from external APIs
  static baseMarketPrices = {
    'wheat': 2000,
    'rice': 3000,
    'corn': 1500,
    'tomato': 30,
    'potato': 15,
    'onion': 20,
    'cabbage': 15,
    'cauliflower': 25,
    'brinjal': 35,
    'chilli': 80,
    'garlic': 100,
    'turmeric': 60,
    'sugarcane': 3500,
    'cotton': 50,
    'soybean': 4000,
    'chickpea': 6000,
    'lentil': 7000,
    'groundnut': 8000,
    'apple': 80,
    'mango': 40,
    'banana': 15,
    'grape': 100
  };

  static getMarketPrice(crop) {
    const cropLower = crop.toLowerCase().trim();
    return this.baseMarketPrices[cropLower] || null;
  }

  static calculateDynamicPrice(crop, quantity, quality = 'standard', organic = false, daysToHarvest = 0) {
    const basePrice = this.getMarketPrice(crop);
    if (!basePrice) return null;

    let price = basePrice;

    // Quality adjustment
    const qualityMultipliers = {
      'premium': 1.3,
      'grade_a': 1.15,
      'grade_b': 1.0,
      'standard': 0.85
    };
    price *= qualityMultipliers[quality] || 1.0;

    // Organic premium
    if (organic) {
      price *= 1.25;
    }

    // Quantity discount (bulk pricing)
    let quantityDiscount = 1.0;
    if (quantity > 1000) quantityDiscount = 0.95; // 5% discount for >1000 units
    else if (quantity > 500) quantityDiscount = 0.97; // 3% discount for >500 units
    else if (quantity > 100) quantityDiscount = 0.98; // 2% discount for >100 units

    price *= quantityDiscount;

    // Harvest timing adjustment
    // If harvest is very soon, slight discount; if far, slight premium
    if (daysToHarvest >= 0) {
      if (daysToHarvest <= 7) {
        price *= 1.05; // Premium for immediate harvest
      } else if (daysToHarvest > 30) {
        price *= 0.95; // Discount for future harvest
      }
    }

    return Math.round(price);
  }

  static getSuggestedPriceRange(crop, quantity, quality = 'standard', organic = false) {
    const basePrice = this.getMarketPrice(crop);
    if (!basePrice) return null;

    // Calculate min and max prices
    const minPrice = Math.round(basePrice * 0.85); // 15% below market
    const maxPrice = Math.round(basePrice * 1.25); // 25% above market
    const suggestedPrice = this.calculateDynamicPrice(crop, quantity, quality, organic);

    return {
      minPrice,
      suggestedPrice: suggestedPrice || basePrice,
      maxPrice,
      baseMarketPrice: basePrice
    };
  }

  static getPriceComparison(listings) {
    // Group listings by crop type
    const grouped = {};
    
    listings.forEach(listing => {
      const crop = listing.crop.toLowerCase();
      if (!grouped[crop]) {
        grouped[crop] = [];
      }
      grouped[crop].push(listing.price);
    });

    // Calculate statistics for each crop
    const comparison = {};
    Object.entries(grouped).forEach(([crop, prices]) => {
      const sorted = prices.sort((a, b) => a - b);
      comparison[crop] = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        median: sorted[Math.floor(sorted.length / 2)],
        listingCount: prices.length
      };
    });

    return comparison;
  }

  static getTrendingPrices(crop, historicalData) {
    // Analyze price trends (mock implementation)
    // In production, this would connect to historical price APIs
    
    if (!historicalData || historicalData.length === 0) {
      return {
        trend: 'stable',
        percentChange: 0,
        recommendation: 'Market stable - fair pricing'
      };
    }

    const avgHistorical = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const currentAvg = this.getMarketPrice(crop) || avgHistorical;
    const percentChange = ((currentAvg - avgHistorical) / avgHistorical) * 100;

    let trend = 'stable';
    let recommendation = 'Market stable - fair pricing';

    if (percentChange > 10) {
      trend = 'rising';
      recommendation = 'Prices rising - good time to sell';
    } else if (percentChange < -10) {
      trend = 'falling';
      recommendation = 'Prices falling - consider storing for later';
    }

    return {
      trend,
      percentChange: Math.round(percentChange),
      recommendation
    };
  }

  static generatePriceAlert(crop, currentPrice, marketPrice) {
    const percentDiff = ((currentPrice - marketPrice) / marketPrice) * 100;

    if (Math.abs(percentDiff) < 5) {
      return {
        type: 'neutral',
        message: 'Price is at market rate'
      };
    } else if (percentDiff > 15) {
      return {
        type: 'overpriced',
        message: `Your price is ${Math.round(percentDiff)}% above market average`,
        suggestion: 'Consider lowering price to attract more buyers'
      };
    } else if (percentDiff < -15) {
      return {
        type: 'underpriced',
        message: `Your price is ${Math.round(Math.abs(percentDiff))}% below market average`,
        suggestion: 'You could increase price and still be competitive'
      };
    } else if (percentDiff > 5) {
      return {
        type: 'slightly_high',
        message: 'Price is slightly above market average'
      };
    } else {
      return {
        type: 'slightly_low',
        message: 'Price is slightly below market average'
      };
    }
  }
}

module.exports = DynamicPricingService;
