const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const developerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['developer'], default: 'developer', required: true },
  avatarColor: { type: String, default: '#5b57f5' },
  title: { type: String, default: '' },
  bio: { type: String, default: '' },
}, { timestamps: true });

developerSchema.pre('save', async function(next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (!this.isModified('password')) return next();
  if (typeof this.password === 'string' && this.password.startsWith('$2')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

developerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Developer', developerSchema);
