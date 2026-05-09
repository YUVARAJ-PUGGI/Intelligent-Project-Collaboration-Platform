const mongoose = require('mongoose');

const conversationSummarySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, unique: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  summary: { type: String, required: true },
  keyPoints: [{ type: String }], // array of extracted key points
  identifiedIssues: [{ type: String }], // issues identified in discussion
  decisions: [{ type: String }], // decisions made
  pendingWork: [{ type: String }], // ongoing or pending tasks
  blockers: [{ type: String }], // identified blockers
  messageCount: { type: Number, default: 0 }, // number of messages summarized
  generatedBy: { type: String, enum: ['openai', 'claude', 'custom'], default: 'openai' },
  confidence: { type: Number, min: 0, max: 1, default: 0.8 }, // AI confidence score
  lastUpdated: { type: Date, default: Date.now },
  isStale: { type: Boolean, default: false }, // true if new messages added after summary
}, { timestamps: true });

conversationSummarySchema.index({ task: 1 });
conversationSummarySchema.index({ project: 1 });
conversationSummarySchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('ConversationSummary', conversationSummarySchema);
