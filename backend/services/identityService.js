const User = require('../models/User');
const Developer = require('../models/Developer');
const ProjectManager = require('../models/ProjectManager');

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function getModelForRole(role) {
  return role === 'manager' ? ProjectManager : Developer;
}

async function syncLegacyUser(identityDoc) {
  const payload = {
    name: identityDoc.name,
    email: normalizeEmail(identityDoc.email),
    password: identityDoc.password,
    role: identityDoc.role,
    avatarColor: identityDoc.avatarColor,
    title: identityDoc.title,
    bio: identityDoc.bio,
  };

  const existing = await User.findById(identityDoc._id);
  if (!existing) {
    await User.create({ _id: identityDoc._id, ...payload });
    return;
  }

  existing.name = payload.name;
  existing.email = payload.email;
  existing.password = payload.password;
  existing.role = payload.role;
  existing.avatarColor = payload.avatarColor;
  existing.title = payload.title;
  existing.bio = payload.bio;
  await existing.save();
}

async function findIdentityByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const [manager, developer] = await Promise.all([
    ProjectManager.findOne({ email: normalizedEmail }),
    Developer.findOne({ email: normalizedEmail }),
  ]);

  return manager || developer;
}

async function findIdentityById(id) {
  const [manager, developer] = await Promise.all([
    ProjectManager.findById(id),
    Developer.findById(id),
  ]);

  return manager || developer;
}

async function createIdentity(payload) {
  const Model = getModelForRole(payload.role);
  const identity = await Model.create({
    name: payload.name,
    email: normalizeEmail(payload.email),
    password: payload.password,
    role: payload.role,
    avatarColor: payload.avatarColor,
    title: payload.title,
    bio: payload.bio,
  });

  await syncLegacyUser(identity);
  return identity;
}

async function updateIdentity(identity, updates) {
  const allowed = ['name', 'email', 'password', 'avatarColor', 'title', 'bio'];

  for (const key of allowed) {
    if (typeof updates[key] === 'undefined') continue;
    if (key === 'email') {
      identity.email = normalizeEmail(updates.email);
      continue;
    }
    identity[key] = updates[key];
  }

  await identity.save();
  await syncLegacyUser(identity);
  return identity;
}

async function migrateLegacyUser(legacyUser) {
  const Model = getModelForRole(legacyUser.role || 'developer');
  const existing = await Model.findOne({ email: normalizeEmail(legacyUser.email) });
  if (existing) {
    await syncLegacyUser(existing);
    return existing;
  }

  const migrated = await Model.create({
    _id: legacyUser._id,
    name: legacyUser.name,
    email: normalizeEmail(legacyUser.email),
    password: legacyUser.password,
    role: legacyUser.role || 'developer',
    avatarColor: legacyUser.avatarColor,
    title: legacyUser.title,
    bio: legacyUser.bio,
  });

  await syncLegacyUser(migrated);
  return migrated;
}

module.exports = {
  Developer,
  ProjectManager,
  findIdentityByEmail,
  findIdentityById,
  createIdentity,
  updateIdentity,
  migrateLegacyUser,
  syncLegacyUser,
};
