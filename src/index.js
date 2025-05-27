const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database configuration
const { testConnection, sequelize } = require('./config/database');
const { syncModels } = require('./models');

// Import routes
const routes = require('./routes');

// Import middlewares
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Home route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Payment Management API',
    version: '1.0.0'
  });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models with database
    await syncModels();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
};

// Start the application
initializeApp();