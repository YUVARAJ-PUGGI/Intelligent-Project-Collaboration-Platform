const mongoose = require('mongoose');

// This model stores semantic embeddings and searchable content for messages
const searchIndexSchema = new mongoose.Schema({
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true, unique: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  content: { type: String, required: true }, // original message content
  contentHash: { type: String }, // hash of content for deduplication
  embedding: [Number], // semantic embedding vector (for vector search)
  keywords: [{ type: String }], // extracted keywords for keyword search
  entityType: {
    type: String,
    enum: ['discussion', 'error_log', 'code_snippet', 'screenshot', 'decision', 'fix'],
    default: 'discussion',
  },
  metadata: {
    fileName: String, // if it's a file/log
    language: String, // programming language if code snippet
    stackTrace: String, // if it's an error
  },
  searchableText: { type: String }, // combined text for full-text search
}, { timestamps: true });

// Compound indexes for efficient searches
searchIndexSchema.index({ task: 1, createdAt: -1 });
searchIndexSchema.index({ project: 1 });
searchIndexSchema.index({ keywords: 1 });
searchIndexSchema.index({ entityType: 1, task: 1 });
searchIndexSchema.index({ searchableText: 'text' }); // Full-text search index

module.exports = mongoose.model('SearchIndex', searchIndexSchema);
