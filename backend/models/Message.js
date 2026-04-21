const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  project:         { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sender:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:         { type: String, required: true },
  convertedToTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
