const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { findIdentityById, migrateLegacyUser } = require('../services/identityService');

async function auth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'You are not logged in. Please log in to get access.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'synergysphere_ultra_secret_2024');
    let currentUser = await findIdentityById(decoded.id);

    if (!currentUser) {
      const legacyUser = await User.findById(decoded.id);
      if (legacyUser) {
        currentUser = await migrateLegacyUser(legacyUser);
      }
    }

    if (!currentUser) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token or authorization failed.' });
  }
}

module.exports = auth;