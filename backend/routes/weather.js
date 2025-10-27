const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// OpenWeather API integration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo-key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Mock weather data - fallback when API is not available
const MOCK_WEATHER_DATA = {
  current: {
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    precipitation: 20,
    uvIndex: 7,
    location: 'Local Area',
    lastUpdated: new Date()
  },
  forecast: [
    {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      day: 'Tomorrow',
      high: 30,
      low: 22,
      condition: 'Sunny',
      precipitation: 10,
      humidity: 60
    },
    {
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      day: 'Day 2',
      high: 29,
      low: 21,
      condition: 'Cloudy',
      precipitation: 30,
      humidity: 70
    },
    {
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      day: 'Day 3',
      high: 27,
      low: 20,
      condition: 'Rainy',
      precipitation: 80,
      humidity: 85
    },
    {
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      day: 'Day 4',
      high: 28,
      low: 21,
      condition: 'Sunny',
      precipitation: 5,
      humidity: 55
    },
    {
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      day: 'Day 5',
      high: 31,
      low: 23,
      condition: 'Sunny',
      precipitation: 0,
      humidity: 50
    }
  ]
};

// Farming recommendations based on weather
const generateRecommendations = (weatherData) => {
  const recommendations = [];

  if (weatherData.temperature > 30) {
    recommendations.push('High temperature expected - provide shade for sensitive crops');
  }

  if (weatherData.precipitation > 50) {
    recommendations.push('Heavy rain expected - ensure proper drainage to prevent waterlogging');
  }

  if (weatherData.uvIndex > 6) {
    recommendations.push('High UV index - protect crops from direct sunlight during peak hours');
  }

  if (weatherData.humidity > 70) {
    recommendations.push('High humidity - monitor for fungal diseases');
  }

  // Default recommendations
  recommendations.push('Ideal conditions for irrigation in the morning');
  recommendations.push('Good conditions for harvesting tomorrow');
  recommendations.push('Monitor soil moisture levels regularly');

  return recommendations.slice(0, 4); // Return top 4 recommendations
};

// All routes require authentication
router.use(protect);

// @desc    Get current weather
// @route   GET /api/weather/current
// @access  Private
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    let weatherData;

    if (WEATHER_API_KEY && WEATHER_API_KEY !== 'demo-key' && lat && lon) {
      try {
        // Fetch real weather data from OpenWeather API
        const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
          params: {
            lat,
            lon,
            appid: WEATHER_API_KEY,
            units: 'metric'
          }
        });

        const data = response.data;
        weatherData = {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          precipitation: data.rain ? data.rain['1h'] || 0 : 0,
          uvIndex: 5, // OpenWeather doesn't provide UV index in free tier
          location: data.name || `Lat: ${lat}, Lon: ${lon}`,
          lastUpdated: new Date()
        };
      } catch (apiError) {
        console.log('Weather API error, using mock data:', apiError.message);
        weatherData = {
          ...MOCK_WEATHER_DATA.current,
          location: `Lat: ${lat}, Lon: ${lon}`
        };
      }
    } else {
      // Use mock data when API key not available or coordinates not provided
      weatherData = {
        ...MOCK_WEATHER_DATA.current,
        location: lat && lon ? `Lat: ${lat}, Lon: ${lon}` : MOCK_WEATHER_DATA.current.location
      };
    }

    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Get current weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weather data'
    });
  }
});

// @desc    Get weather forecast
// @route   GET /api/weather/forecast
// @access  Private
router.get('/forecast', async (req, res) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({
      success: true,
      data: MOCK_WEATHER_DATA.forecast
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast data'
    });
  }
});

// @desc    Get farming recommendations based on weather
// @route   GET /api/weather/recommendations
// @access  Private
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = generateRecommendations(MOCK_WEATHER_DATA.current);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations'
    });
  }
});

// @desc    Get weather alerts
// @route   GET /api/weather/alerts
// @access  Private
router.get('/alerts', async (req, res) => {
  try {
    // Mock alerts based on current conditions
    const alerts = [];

    if (MOCK_WEATHER_DATA.current.precipitation > 50) {
      alerts.push({
        type: 'warning',
        title: 'Heavy Rain Expected',
        message: 'Heavy rainfall predicted for tomorrow. Take preventive measures.',
        priority: 'high'
      });
    }

    if (MOCK_WEATHER_DATA.current.temperature > 35) {
      alerts.push({
        type: 'danger',
        title: 'Extreme Heat Warning',
        message: 'Extreme temperatures may affect crop health. Provide adequate irrigation.',
        priority: 'high'
      });
    }

    if (MOCK_WEATHER_DATA.current.uvIndex > 8) {
      alerts.push({
        type: 'info',
        title: 'High UV Index',
        message: 'Protect crops from excessive sun exposure.',
        priority: 'medium'
      });
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weather alerts'
    });
  }
});

// @desc    Get historical weather data
// @route   GET /api/weather/history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    // Mock historical data
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      history.push({
        date: date.toISOString().split('T')[0],
        temperature: 25 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        precipitation: Math.random() * 20,
        condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)]
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
      message: 'Error fetching historical data'
    });
  }
});

module.exports = router;
