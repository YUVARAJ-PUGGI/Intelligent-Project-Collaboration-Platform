const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignee:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:      { type: String, enum: ['todo','inprogress','done'], default: 'todo' },
  priority:    { type: String, enum: ['low','medium','high'], default: 'medium' },
  dueDate:     { type: Date, default: null },
  tags:        [{ type: String, trim: true }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
