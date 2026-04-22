const User = require('../models/User');
const { signToken, toSafeUser } = require('../services/authService');
const {
  findIdentityByEmail,
  createIdentity,
  updateIdentity,
  migrateLegacyUser,
  syncLegacyUser,
} = require('../services/identityService');

async function signup(req, res) {
  try {
    const { name, email, password, role, avatarColor, title, bio } = req.body;
    const normalizedEmail = email.toLowerCase();
    const legacyAccount = await User.findOne({ email: normalizedEmail });
    if (await findIdentityByEmail(normalizedEmail) || legacyAccount) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (!['manager', 'developer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const user = await createIdentity({ name, email: normalizedEmail, password, role, avatarColor, title, bio });
    return res.json({ token: signToken(user._id), user: toSafeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    let user = await findIdentityByEmail(normalizedEmail);

    if (!user) {
      const legacyUser = await User.findOne({ email: normalizedEmail });
      if (legacyUser) {
        user = await migrateLegacyUser(legacyUser);
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    const isLegacyPlaintextPassword = user.password === password;

    if (!isPasswordValid && !isLegacyPlaintextPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (isLegacyPlaintextPassword) {
      user.password = password;
      await user.save();
      await syncLegacyUser(user);
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
    const updates = {};

    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') {
        updates[key] = req.body[key];
      }
    }

    if (req.body.password) {
      updates.password = req.body.password;
    }

    if (req.body.email && req.body.email !== req.user.email) {
      const existing = await findIdentityByEmail(req.body.email.toLowerCase());
      const legacyExisting = await User.findOne({ email: req.body.email.toLowerCase() });

      if ((existing && existing._id.toString() !== req.user._id.toString()) || (legacyExisting && legacyExisting._id.toString() !== req.user._id.toString())) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      updates.email = req.body.email.toLowerCase();
    }

    const updated = await updateIdentity(req.user, updates);
    return res.json({ user: toSafeUser(updated) });
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
