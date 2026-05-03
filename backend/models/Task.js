const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: { type: Date },
  // estimated effort in hours (used for workload calculations)
  estimatedHours: { type: Number, default: 0, min: 0 },
  tags: [{ type: String }],
}, { timestamps: true });

// index common query fields for performance
taskSchema.index({ assignee: 1 });
taskSchema.index({ project: 1 });

module.exports = mongoose.model('Task', taskSchema);