const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('@models/User');
const auth = require('@middleware/auth');
const { AUTH } = require('@constants/urls');

// Manual registration
router.post(AUTH.REGISTER, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Manual login
router.post(AUTH.LOGIN, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Google OAuth routes
router.get(AUTH.GOOGLE, (req, res, next) => {
  console.log('\n=== Starting Google OAuth Flow ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

// AUTH.GOOGLE_CALLBACK
router.get(AUTH.GOOGLE_CALLBACK,
  (req, res, next) => {
    console.log('\n=== Google OAuth Callback Received ===');
    console.log('Callback URL:', req.originalUrl);
    console.log('Query parameters:', JSON.stringify(req.query, null, 2));
    passport.authenticate('google', { 
      failureRedirect: AUTH.FAILURE,
      session: false
    })(req, res, next);
  },
  async (req, res) => {
    console.log('\n=== Processing Google OAuth Callback ===');
    console.log('User object:', req.user ? {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name
    } : 'No user found');
    
    try {
      if (!req.user) {
        console.log('❌ Authentication failed: No user found');
        return res.redirect(AUTH.FAILURE);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('✅ Authentication successful');
      console.log('Generated JWT token for user:', req.user._id);

      // Instead of redirecting, send the token directly
      res.json({
        message: 'Google authentication successful',
        token,
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name
        }
      });
    } catch (error) {
      console.error('❌ Error in callback processing:', error);
      console.error('Google callback error:', error);
      res.redirect(AUTH.FAILURE);
    }
  }
);

// Success and failure routes for OAuth
router.get(AUTH.SUCCESS, (req, res) => {
  res.json({ message: 'Authentication successful', token: req.query.token });
});

router.get(AUTH.FAILURE, (req, res) => {
  res.status(401).json({ message: 'Authentication failed' });
});

router.get(AUTH.PROTECTED, auth, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

// Logout route
router.post(AUTH.LOGOUT, auth, (req, res) => {
  try {
    // Note: Since JWT is stateless, the actual token invalidation happens on the client side
    // This endpoint is used to trigger client-side cleanup
    res.json({ 
      message: 'Logout successful',
      success: true 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error during logout', 
      error: error.message 
    });
  }
});

module.exports = router; 