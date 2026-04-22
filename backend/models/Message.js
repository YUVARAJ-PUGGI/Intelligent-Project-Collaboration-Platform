const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  convertedToTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
}, { timestamps: true });

messageSchema.index({ task: 1, createdAt: 1 });
messageSchema.index({ project: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);