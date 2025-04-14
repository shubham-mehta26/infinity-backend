require('module-alias/register');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();

// Import routes using absolute paths
const authRoutes = require('@routes/auth');
const { AUTH } = require('@constants/urls');

// Import passport configuration
require('@config/passport');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log('\n📨 Incoming Request:');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use(AUTH.BASE, authRoutes);

app.use('/', (req, res) => {
  res.send('Welcome to Infinity Backend');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

// Function to start server
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
      PORT++;
      startServer();
    } else {
      console.error('Server error:', error);
    }
  });
};

startServer(); 