/**
 * Decision Tracking Service
 * 
 * Handles marking messages as decisions, final fixes, important updates, or blockers.
 * Provides retrieval and filtering of tracked decisions.
 */

const Decision = require('../models/Decision');
const Message = require('../models/Message');

const DecisionTrackingService = {
  /**
   * Mark a message as a decision/fix/update/blocker
   * @param {String} messageId - Message ID to mark
   * @param {String} decisionType - Type: 'decision', 'final_fix', 'important_update', 'blocker'
   * @param {String} userId - User marking the message
   * @param {Object} options - Additional options (tags, priority, relatedMessages)
   * @returns {Promise<Object>} Created decision
   */
  async markMessageAsDecision(messageId, decisionType, userId, options = {}) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if already marked
      const existing = await Decision.findOne({ message: messageId });
      if (existing) {
        throw new Error('Message already marked as a decision');
      }

      const decision = await Decision.create({
        task: message.task,
        project: message.project,
        message: messageId,
        decisionType,
        content: message.content,
        markedBy: userId,
        relatedMessages: options.relatedMessages || [],
        tags: options.tags || [],
        priority: options.priority || 'medium',
      });

      return decision;
    } catch (error) {
      console.error('Error marking message as decision:', error);
      throw error;
    }
  },

  /**
   * Unmark a decision (remove decision tracking from a message)
   * @param {String} messageId - Message ID
   * @returns {Promise<void>}
   */
  async unmarkDecision(messageId) {
    try {
      await Decision.deleteOne({ message: messageId });
    } catch (error) {
      console.error('Error unmarking decision:', error);
      throw error;
    }
  },

  /**
   * Get all decisions for a task
   * @param {String} taskId - Task ID
   * @param {Object} filters - Optional filters (decisionType, priority, status)
   * @returns {Promise<Array>} Array of decisions
   */
  async getTaskDecisions(taskId, filters = {}) {
    try {
      const query = { task: taskId };

      if (filters.decisionType) {
        query.decisionType = filters.decisionType;
      }
      if (filters.priority) {
        query.priority = filters.priority;
      }
      if (filters.status) {
        query.status = filters.status;
      }

      const decisions = await Decision.find(query)
        .populate('message', 'content createdAt')
        .populate('markedBy', 'name')
        .sort('-createdAt')
        .exec();

      return decisions;
    } catch (error) {
      console.error('Error fetching task decisions:', error);
      throw error;
    }
  },

  /**
   * Get decisions by type for a task
   * @param {String} taskId - Task ID
   * @param {String} decisionType - Type to filter
   * @returns {Promise<Array>} Array of decisions
   */
  async getDecisionsByType(taskId, decisionType) {
    return this.getTaskDecisions(taskId, { decisionType });
  },

  /**
   * Get all decisions in a project
   * @param {String} projectId - Project ID
   * @param {Object} options - Query options (limit, skip, filters)
   * @returns {Promise<Array>} Array of decisions
   */
  async getProjectDecisions(projectId, options = {}) {
    try {
      const { limit = 50, skip = 0, ...filters } = options;

      const query = { project: projectId, status: 'active' };

      if (filters.decisionType) {
        query.decisionType = filters.decisionType;
      }

      const decisions = await Decision.find(query)
        .populate('task', 'title')
        .populate('message', 'content')
        .populate('markedBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .exec();

      return decisions;
    } catch (error) {
      console.error('Error fetching project decisions:', error);
      throw error;
    }
  },

  /**
   * Get high-priority blockers for a project
   * @param {String} projectId - Project ID
   * @returns {Promise<Array>} Array of high-priority blockers
   */
  async getActiveBlockers(projectId) {
    try {
      const blockers = await Decision.find({
        project: projectId,
        decisionType: 'blocker',
        status: 'active',
        priority: 'high',
      })
        .populate('task', 'title')
        .populate('markedBy', 'name')
        .sort('-createdAt')
        .exec();

      return blockers;
    } catch (error) {
      console.error('Error fetching active blockers:', error);
      throw error;
    }
  },

  /**
   * Update decision status (active -> resolved -> obsolete)
   * @param {String} decisionId - Decision ID
   * @param {String} newStatus - New status
   * @returns {Promise<Object>} Updated decision
   */
  async updateDecisionStatus(decisionId, newStatus) {
    try {
      const validStatuses = ['active', 'resolved', 'obsolete'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const decision = await Decision.findByIdAndUpdate(
        decisionId,
        { status: newStatus },
        { new: true }
      );

      return decision;
    } catch (error) {
      console.error('Error updating decision status:', error);
      throw error;
    }
  },

  /**
   * Link related messages to a decision for context
   * @param {String} decisionId - Decision ID
   * @param {Array<String>} messageIds - Message IDs to link
   * @returns {Promise<Object>} Updated decision
   */
  async linkRelatedMessages(decisionId, messageIds) {
    try {
      const decision = await Decision.findByIdAndUpdate(
        decisionId,
        { $addToSet: { relatedMessages: { $each: messageIds } } },
        { new: true }
      );

      return decision;
    } catch (error) {
      console.error('Error linking related messages:', error);
      throw error;
    }
  },

  /**
   * Search decisions by keyword
   * @param {String} projectId - Project ID
   * @param {String} keyword - Search keyword
   * @returns {Promise<Array>} Matching decisions
   */
  async searchDecisions(projectId, keyword) {
    try {
      const decisions = await Decision.find({
        project: projectId,
        $or: [
          { content: { $regex: keyword, $options: 'i' } },
          { tags: keyword },
        ],
      })
        .populate('task', 'title')
        .populate('markedBy', 'name')
        .sort('-createdAt')
        .exec();

      return decisions;
    } catch (error) {
      console.error('Error searching decisions:', error);
      throw error;
    }
  },

  /**
   * Get decision summary for a task (count by type)
   * @param {String} taskId - Task ID
   * @returns {Promise<Object>} Decision summary
   */
  async getDecisionSummary(taskId) {
    try {
      const summary = await Decision.aggregate([
        { $match: { task: require('mongoose').Types.ObjectId(taskId) } },
        { $group: { _id: '$decisionType', count: { $sum: 1 } } },
      ]);

      return summary;
    } catch (error) {
      console.error('Error getting decision summary:', error);
      throw error;
    }
  },
};

module.exports = DecisionTrackingService;
