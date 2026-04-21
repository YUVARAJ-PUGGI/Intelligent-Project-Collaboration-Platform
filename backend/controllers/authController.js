const User = require('../models/User');
const { signToken, toSafeUser } = require('../services/authService');

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    return res.json({ token: signToken(user._id), user: toSafeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    return res.json({ token: signToken(user._id), user: toSafeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMe(req, res) {
  try {
    return res.json({ user: toSafeUser(req.user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateMe(req, res) {
  try {
    const allowed = ['name', 'avatarColor', 'title', 'bio'];
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') {
        req.user[key] = req.body[key];
      }
    }

    if (req.body.password) {
      req.user.password = req.body.password;
    }

    if (req.body.email && req.body.email !== req.user.email) {
      const existing = await User.findOne({ email: req.body.email.toLowerCase() });
      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      req.user.email = req.body.email.toLowerCase();
    }

    await req.user.save();
    return res.json({ user: toSafeUser(req.user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  signup,
  login,
  getMe,
  updateMe,
};
