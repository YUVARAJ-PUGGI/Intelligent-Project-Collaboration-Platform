const jwt = require('jsonwebtoken');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'synergysphere_ultra_secret_2024', { expiresIn: '7d' });
}

function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    title: user.title,
    bio: user.bio,
  };
}

module.exports = {
  signToken,
  toSafeUser,
};
