/**
 * Conversation Summary Service
 * 
 * Handles generation, caching, and updates of AI-powered conversation summaries
 */

const Message = require('../models/Message');
const Task = require('../models/Task');
const ConversationSummary = require('../models/ConversationSummary');
const AIService = require('./aiService');

const ConversationSummaryService = {
  /**
   * Generate or update summary for a task
   * @param {String} taskId - Task ID to summarize
   * @param {Boolean} force - Force regenerate even if cached
   * @returns {Promise<Object>} Generated summary
   */
  async generateTaskSummary(taskId, force = false) {
    try {
      // Check if summary already exists and is fresh
      if (!force) {
        const existing = await ConversationSummary.findOne({ task: taskId });
        if (existing && !existing.isStale && existing.lastUpdated > new Date(Date.now() - 3600000)) {
          return existing;
        }
      }

      // Fetch all messages for the task
      const messages = await Message.find({ task: taskId })
        .populate('sender', 'name')
        .sort('createdAt')
        .exec();

      if (messages.length === 0) {
        return await this.createEmptySummary(taskId);
      }

      // Format messages for AI
      const formattedMessages = messages.map(msg => ({
        content: msg.content,
        senderName: msg.sender?.name || 'Unknown',
        timestamp: msg.createdAt,
      }));

      // Load task details so AI can include task context
      const task = await Task.findById(taskId);
      if (!task) {
        return await this.createEmptySummary(taskId);
      }

      // Generate summary using AI (include task context)
      const summaryData = await AIService.generateConversationSummary(formattedMessages, {
        taskTitle: task.title,
        taskStatus: task.status,
        taskPriority: task.priority,
      });

      // Find or create summary document
      let summary = await ConversationSummary.findOne({ task: taskId });

      if (summary) {
        // Update existing
        summary.summary = summaryData.summary;
        summary.keyPoints = summaryData.keyPoints;
        summary.identifiedIssues = summaryData.identifiedIssues;
        summary.decisions = summaryData.decisions;
        summary.pendingWork = summaryData.pendingWork;
        summary.blockers = summaryData.blockers;
        summary.messageCount = messages.length;
        summary.lastUpdated = new Date();
        summary.isStale = false;
        await summary.save();
      } else {
        // Create new
        const task = await Task.findById(taskId);
        summary = await ConversationSummary.create({
          task: taskId,
          project: task.project,
          summary: summaryData.summary,
          keyPoints: summaryData.keyPoints,
          identifiedIssues: summaryData.identifiedIssues,
          decisions: summaryData.decisions,
          pendingWork: summaryData.pendingWork,
          blockers: summaryData.blockers,
          messageCount: messages.length,
        });
      }

      return summary;
    } catch (error) {
      console.error('Error generating task summary:', error);
      throw error;
    }
  },

  /**
   * Get existing summary or generate if not exists
   * @param {String} taskId - Task ID
   * @returns {Promise<Object>} Summary
   */
  async getTaskSummary(taskId) {
    try {
      let summary = await ConversationSummary.findOne({ task: taskId });

      if (!summary) {
        summary = await this.generateTaskSummary(taskId);
      }

      return summary;
    } catch (error) {
      console.error('Error fetching task summary:', error);
      throw error;
    }
  },

  /**
   * Mark summary as stale when new messages are added
   * @param {String} taskId - Task ID
   */
  async markSummaryStale(taskId) {
    try {
      await ConversationSummary.updateOne(
        { task: taskId },
        { isStale: true }
      );
    } catch (error) {
      console.error('Error marking summary stale:', error);
    }
  },

  /**
   * Get summaries for multiple tasks
   * @param {Array<String>} taskIds - Array of task IDs
   * @returns {Promise<Array>} Array of summaries
   */
  async getTaskSummaries(taskIds) {
    try {
      const summaries = await ConversationSummary.find({
        task: { $in: taskIds }
      });

      return summaries;
    } catch (error) {
      console.error('Error fetching task summaries:', error);
      throw error;
    }
  },

  /**
   * Get summaries for a project
   * @param {String} projectId - Project ID
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} Array of summaries
   */
  async getProjectSummaries(projectId, options = {}) {
    try {
      const { limit = 20, skip = 0, sortBy = '-lastUpdated' } = options;

      const summaries = await ConversationSummary.find({ project: projectId })
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate('task', 'title status');

      return summaries;
    } catch (error) {
      console.error('Error fetching project summaries:', error);
      throw error;
    }
  },

  /**
   * Create an empty summary for a task with no messages
   * @param {String} taskId - Task ID
   * @returns {Promise<Object>} Empty summary
   */
  async createEmptySummary(taskId) {
    const task = await Task.findById(taskId);
    return await ConversationSummary.create({
      task: taskId,
      project: task.project,
      summary: 'No messages in this task discussion yet.',
      keyPoints: [],
      identifiedIssues: [],
      decisions: [],
      pendingWork: [],
      blockers: [],
      messageCount: 0,
    });
  },

  /**
   * Delete summary for a task
   * @param {String} taskId - Task ID
   */
  async deleteSummary(taskId) {
    try {
      await ConversationSummary.deleteOne({ task: taskId });
    } catch (error) {
      console.error('Error deleting summary:', error);
      throw error;
    }
  },
};

module.exports = ConversationSummaryService;
