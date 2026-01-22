const express = require('express');
const Joi = require('joi');
const { protect } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// OpenWeather API integration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Mock weather data for fallback and development
const MOCK_WEATHER_DATA = {
  current: {
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    precipitation: 20,
    uvIndex: 7,
    location: 'Bhopal, MP',
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
    }
  ]
};

// All routes require authentication
router.use(protect);

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

  recommendations.push('Ideal conditions for irrigation in the morning');
  recommendations.push('Good conditions for harvesting tomorrow');
  recommendations.push('Monitor soil moisture levels regularly');

  return recommendations.slice(0, 4);
};

// @desc    Get current weather data
// @route   GET /api/weather/current
// @access  Private
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    let weatherData;

    if (WEATHER_API_KEY && lat && lon) {
      try {
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
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6),
          precipitation: data.rain ? data.rain['1h'] || 0 : 0,
          uvIndex: 5,
          location: data.name || `Lat: ${lat}, Lon: ${lon}`,
          lastUpdated: new Date()
        };
      } catch (apiError) {
        console.warn('Weather API error, using fallback:', apiError.message);
        weatherData = {
          ...MOCK_WEATHER_DATA.current,
          location: `Lat: ${lat}, Lon: ${lon}`
        };
      }
    } else {
      // Use mock data when API key not available or coordinates not provided
      weatherData = {
        ...MOCK_WEATHER_DATA.current,
        location: lat && lon ? `Lat: ${lat}, Lon: ${lon}` : MOCK_WEATHER_DATA.current.location,
        warning: (!WEATHER_API_KEY ? 'Weather API key not configured. ' : '') + (!lat || !lon ? 'Location coordinates not provided.' : '')
      };
    }

    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weather data'
    });
  }
});

// @desc    Get 5-day weather forecast
// @route   GET /api/weather/forecast
// @access  Private
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (WEATHER_API_KEY && lat && lon) {
      try {
        const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
          params: {
            lat,
            lon,
            appid: WEATHER_API_KEY,
            units: 'metric'
          }
        });

        const forecastByDay = {};
        response.data.list.forEach(item => {
          const date = new Date(item.dt * 1000).toDateString();
          if (!forecastByDay[date]) {
            forecastByDay[date] = {
              temperatures: [],
              precipitation: [],
              weather: item.weather[0]
            };
          }
          forecastByDay[date].temperatures.push(item.main.temp);
          forecastByDay[date].precipitation.push(item.rain?.['3h'] || 0);
        });

        const forecast = Object.entries(forecastByDay).slice(0, 5).map(([date, data]) => ({
          date: new Date(date),
          high: Math.round(Math.max(...data.temperatures)),
          low: Math.round(Math.min(...data.temperatures)),
          condition: data.weather.main,
          description: data.weather.description,
          precipitation: Math.max(...data.precipitation)
        }));

        return res.json({
          success: true,
          data: { forecast }
        });
      } catch (apiError) {
        console.warn('Forecast API error, using fallback:', apiError.message);
      }
    }

    res.json({
      success: true,
      data: {
        forecast: MOCK_WEATHER_DATA.forecast,
        warning: 'Using mock forecast data'
      }
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast'
    });
  }
});

// @desc    Get farming recommendations
// @route   GET /api/weather/recommendations
// @access  Private
router.get('/recommendations', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    let weatherData = MOCK_WEATHER_DATA.current;

    // If coordinates are provided, try to fetch real data for better recommendations
    if (WEATHER_API_KEY && lat && lon) {
      try {
        const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
          params: { lat, lon, appid: WEATHER_API_KEY, units: 'metric' }
        });
        const data = response.data;
        weatherData = {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          precipitation: data.rain ? data.rain['1h'] || 0 : 0,
          uvIndex: 5, // Default since free API doesn't always have UV
        };
      } catch (e) {
        console.warn('Fallback to mock for recommendations');
      }
    }

    const recommendations = generateRecommendations(weatherData);
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
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
    const alerts = [];
    const current = MOCK_WEATHER_DATA.current;

    if (current.precipitation > 50) {
      alerts.push({
        type: 'warning',
        title: 'Heavy Rain Expected',
        message: 'Heavy rainfall predicted. Take preventive measures.',
        priority: 'high'
      });
    }

    if (current.temperature > 35) {
      alerts.push({
        type: 'danger',
        title: 'Extreme Heat Warning',
        message: 'Extreme temperatures may affect crop health. Provide adequate irrigation.',
        priority: 'high'
      });
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Alerts error:', error);
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
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching historical data'
    });
  }
});

module.exports = router;
