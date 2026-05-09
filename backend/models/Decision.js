const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
  decisionType: {
    type: String,
    enum: ['decision', 'final_fix', 'important_update', 'blocker'],
    required: true,
  },
  content: { type: String, required: true }, // the decision/note content
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relatedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }], // messages related to this decision
  status: {
    type: String,
    enum: ['active', 'resolved', 'obsolete'],
    default: 'active',
  },
  tags: [{ type: String }], // for filtering decisions
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
}, { timestamps: true });

decisionSchema.index({ task: 1, decisionType: 1 });
decisionSchema.index({ project: 1 });
decisionSchema.index({ markedBy: 1 });
decisionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Decision', decisionSchema);
