const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const colors = ['#6366f1','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#ec4899'];

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true },
  avatarColor:  { type: String, default: () => colors[Math.floor(Math.random() * colors.length)] },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(pw) {
  return bcrypt.compare(pw, this.password);
};

module.exports = mongoose.model('User', userSchema);
