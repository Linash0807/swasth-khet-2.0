// Carbon Footprint Calculation Service
// Tracks eco-friendly practices and calculates carbon reduction

class CarbonFootprintService {
  // Emission factors (kg CO2 per unit)
  static emissionFactors = {
    // Fertilizers
    'synthetic_fertilizer': 4.5,      // kg CO2 per kg fertilizer
    'organic_fertilizer': 0.8,         // kg CO2 per kg compost
    'urea': 3.2,                       // kg CO2 per kg
    'dap': 2.8,                        // kg CO2 per kg
    'potash': 1.2,                     // kg CO2 per kg

    // Pesticides
    'chemical_pesticide': 2.5,         // kg CO2 per liter
    'neem_oil': 0.3,                   // kg CO2 per liter
    'organic_pesticide': 0.4,          // kg CO2 per liter

    // Fuel
    'diesel': 2.68,                    // kg CO2 per liter
    'petrol': 2.31,                    // kg CO2 per liter
    'electricity': 0.95,               // kg CO2 per kWh (India average)

    // Irrigation
    'flood_irrigation': 0.5,           // kg CO2 per hour/hectare
    'drip_irrigation': 0.15,           // kg CO2 per hour/hectare
    'sprinkler_irrigation': 0.25,      // kg CO2 per hour/hectare

    // Transportation
    'manual_transport': 0.0,           // kg CO2
    'bullock_cart': 0.1,               // kg CO2 per km
    'tractor': 0.8,                    // kg CO2 per km
    'truck': 0.6                       // kg CO2 per km
  };

  // Calculate baseline carbon footprint (business as usual)
  static calculateBaselineFootprint(farmData) {
    let totalFootprint = 0;

    // Fertilizer emissions
    if (farmData.fertilizerUsage) {
      const syntheticFertilizer = farmData.fertilizerUsage.synthetic || 0;
      totalFootprint += syntheticFertilizer * this.emissionFactors.synthetic_fertilizer;
    }

    // Pesticide emissions
    if (farmData.pesticideUsage) {
      const chemicalPesticide = farmData.pesticideUsage.chemical || 0;
      totalFootprint += chemicalPesticide * this.emissionFactors.chemical_pesticide;
    }

    // Fuel emissions
    if (farmData.fuelUsage) {
      const diesel = farmData.fuelUsage.diesel || 0;
      totalFootprint += diesel * this.emissionFactors.diesel;
    }

    // Irrigation emissions
    if (farmData.irrigationHours && farmData.irrigationType) {
      const emissionFactor = this.emissionFactors[farmData.irrigationType] || 0.5;
      totalFootprint += farmData.irrigationHours * farmData.area * emissionFactor;
    }

    return Math.round(totalFootprint * 100) / 100;
  }

  // Calculate carbon footprint with eco-friendly practices
  static calculateEcofriendlyFootprint(farmData) {
    let totalFootprint = 0;

    // Organic fertilizer
    if (farmData.fertilizerUsage) {
      const organicFertilizer = farmData.fertilizerUsage.organic || 0;
      totalFootprint += organicFertilizer * this.emissionFactors.organic_fertilizer;
    }

    // Organic pesticide
    if (farmData.pesticideUsage) {
      const organicPesticide = farmData.pesticideUsage.organic || 0;
      totalFootprint += organicPesticide * this.emissionFactors.organic_pesticide;
    }

    // Drip irrigation (efficient)
    if (farmData.irrigationHours && farmData.irrigationType === 'drip') {
      totalFootprint += farmData.irrigationHours * farmData.area * 
                        this.emissionFactors.drip_irrigation;
    }

    // Manual transport
    if (farmData.transportMethod === 'manual') {
      totalFootprint += 0;
    }

    return Math.round(totalFootprint * 100) / 100;
  }

  // Calculate carbon reduction percentage
  static calculateCarbonReduction(baselineFootprint, ecofriendlyFootprint) {
    if (baselineFootprint === 0) return 0;
    return Math.round(((baselineFootprint - ecofriendlyFootprint) / baselineFootprint) * 100);
  }

  // Get eco-friendly recommendations
  static getEcofriendlyRecommendations(farmData) {
    const recommendations = [];

    // Fertilizer recommendations
    if (farmData.fertilizerUsage?.synthetic > 0) {
      recommendations.push({
        practice: 'Switch to organic fertilizer',
        impact: 'Reduce emissions by 82% for fertilizer',
        savings: Math.round(farmData.fertilizerUsage.synthetic * 
                           (this.emissionFactors.synthetic_fertilizer - 
                            this.emissionFactors.organic_fertilizer) * 100) / 100,
        priority: 'high',
        implementation: 'Start using compost, vermicompost, or FYM'
      });
    }

    // Pesticide recommendations
    if (farmData.pesticideUsage?.chemical > 0) {
      recommendations.push({
        practice: 'Use organic pest control',
        impact: 'Reduce emissions by 84% for pesticide',
        savings: Math.round(farmData.pesticideUsage.chemical * 
                           (this.emissionFactors.chemical_pesticide - 
                            this.emissionFactors.organic_pesticide) * 100) / 100,
        priority: 'high',
        implementation: 'Use neem oil, manual picking, beneficial insects'
      });
    }

    // Irrigation recommendations
    if (farmData.irrigationType === 'flood' || farmData.irrigationType === 'sprinkler') {
      recommendations.push({
        practice: 'Install drip irrigation',
        impact: 'Reduce irrigation emissions by 70%',
        savings: Math.round(farmData.irrigationHours * farmData.area * 
                           (this.emissionFactors[farmData.irrigationType] - 
                            this.emissionFactors.drip_irrigation) * 100) / 100,
        priority: 'high',
        implementation: 'Investment required, but saves water and reduces labor'
      });
    }

    // Crop rotation recommendation
    recommendations.push({
      practice: 'Practice crop rotation',
      impact: 'Improve soil health, reduce disease, 10-15% yield improvement',
      priority: 'medium',
      implementation: 'Rotate with legumes to fix nitrogen naturally'
    });

    // Conservation agriculture
    recommendations.push({
      practice: 'Adopt conservation agriculture',
      impact: 'Reduce fuel emissions, improve soil carbon',
      priority: 'medium',
      implementation: 'Reduce/zero tilling, mulching, crop residue management'
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Calculate carbon credit potential (mock)
  static calculateCarbonCreditPotential(carbonReductionKg) {
    // Assume ₹400 per ton CO2 reduced (based on Indian carbon credit rates)
    const costPerTon = 400;
    const reductionTons = carbonReductionKg / 1000;
    
    return {
      reductionTons: Math.round(reductionTons * 100) / 100,
      potentialValue: Math.round(reductionTons * costPerTon * 100) / 100,
      currency: '₹'
    };
  }

  // Calculate sustainability score (0-100)
  static calculateSustainabilityScore(farmData) {
    let score = 50; // Base score

    // Fertilizer practices
    if (farmData.fertilizerUsage?.organic >= 50) score += 10;
    if (farmData.fertilizerUsage?.synthetic === 0) score += 5;

    // Pesticide practices
    if (farmData.pesticideUsage?.organic >= 50) score += 10;
    if (farmData.pesticideUsage?.chemical === 0) score += 5;

    // Irrigation efficiency
    if (farmData.irrigationType === 'drip') score += 15;

    // Crop diversity
    if (farmData.cropDiversity >= 3) score += 10;

    // Conservation practices
    if (farmData.conservationAgriculture) score += 10;
    if (farmData.mulching) score += 5;

    return Math.min(100, Math.max(0, score));
  }
}

module.exports = CarbonFootprintService;
