const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farms');
const cropRoutes = require('./routes/crops');
const diseaseRoutes = require('./routes/disease');
const weatherRoutes = require('./routes/weather');
const marketplaceRoutes = require('./routes/marketplace');
const carbonRoutes = require('./routes/carbon');
const chatbotRoutes = require('./routes/chatbot');
const contactRoutes = require('./routes/contact');

const app = express();

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
// CORS configuration - Allow production origin and localhost
const allowedOrigins = [
  'https://swasth-khet-2-0.onrender.com',
  'https://swasth-khet-2-0-1.onrender.com',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swasth-khet')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/contact', contactRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Swasth Khet API is running' });
});

// Serve static files from the React frontend app
const staticPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(staticPath));

app.get('*', (req, res, next) => {
  // If it's an API route that reached here, it's a true API 404
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Otherwise serve the React app
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (req.path === '/') {
    res.json({
      success: true,
      message: 'Welcome to Swasth Khet API',
      status: `Running (${process.env.NODE_ENV || 'development'})`,
      hasBuild: fs.existsSync(staticPath)
    });
  } else {
    next();
  }
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    mode: process.env.NODE_ENV,
    hasStatic: fs.existsSync(path.join(__dirname, '../frontend/dist'))
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

