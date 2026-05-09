/**
 * Semantic Search Service
 * 
 * Provides intelligent search capabilities for task messages and discussions.
 * Supports keyword search, semantic search, and entity-type filtering.
 */

const Message = require('../models/Message');
const SearchIndex = require('../models/SearchIndex');
const Task = require('../models/Task');
const AIService = require('./aiService');

const SemanticSearchService = {
  /**
   * Index a message for searching
   * @param {String} messageId - Message ID to index
   * @param {String} entityType - Type of content (discussion, error_log, code_snippet, etc.)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Created search index
   */
  async indexMessage(messageId, entityType = 'discussion', metadata = {}) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if already indexed
      const existing = await SearchIndex.findOne({ message: messageId });
      if (existing) {
        return existing;
      }

      // Extract keywords using AI
      const keywords = await AIService.extractKeywords(message.content);

      // Generate embedding for semantic search
      const embedding = await AIService.generateEmbedding(message.content);

      // Create searchable text (for full-text search)
      const searchableText = `${message.content} ${keywords.join(' ')}`;

      const searchIndex = await SearchIndex.create({
        message: messageId,
        task: message.task,
        project: message.project,
        content: message.content,
        keywords,
        embedding,
        entityType,
        metadata,
        searchableText,
      });

      return searchIndex;
    } catch (error) {
      console.error('Error indexing message:', error);
      throw error;
    }
  },

  /**
   * Search messages using natural language
   * Combines keyword matching and semantic similarity
   * @param {String} taskId - Task ID to search within
   * @param {String} query - Natural language search query
   * @param {Object} options - Search options (limit, entityType filter)
   * @returns {Promise<Array>} Matching messages
   */
  async semanticSearch(taskId, query, options = {}) {
    try {
      const { limit = 10, entityType = null } = options;

      // For semantic search, use full-text search combined with keyword matching
      const searchQuery = {
        task: require('mongoose').Types.ObjectId(taskId),
      };

      if (entityType) {
        searchQuery.entityType = entityType;
      }

      // First, try full-text search
      const results = await SearchIndex.find(
        {
          ...searchQuery,
          $text: { $search: query },
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .populate('message', 'content sender createdAt')
        .exec();

      // If few results, supplement with keyword matching
      if (results.length < limit / 2) {
        const queryKeywords = query.toLowerCase().split(/\s+/);
        const keywordResults = await SearchIndex.find({
          ...searchQuery,
          keywords: { $in: queryKeywords },
          _id: { $nin: results.map(r => r._id) }, // Avoid duplicates
        })
          .limit(limit - results.length)
          .populate('message', 'content sender createdAt')
          .exec();

        results.push(...keywordResults);
      }

      return results;
    } catch (error) {
      console.error('Error in semantic search:', error);
      // Fallback to basic keyword search
      return this.keywordSearch(taskId, query, options);
    }
  },

  /**
   * Search by keywords
   * @param {String} taskId - Task ID to search within
   * @param {String} keyword - Keyword to search for
   * @param {Object} options - Search options (limit, entityType)
   * @returns {Promise<Array>} Matching messages
   */
  async keywordSearch(taskId, keyword, options = {}) {
    try {
      const { limit = 10, entityType = null } = options;

      const query = {
        task: require('mongoose').Types.ObjectId(taskId),
        keywords: keyword.toLowerCase(),
      };

      if (entityType) {
        query.entityType = entityType;
      }

      const results = await SearchIndex.find(query)
        .limit(limit)
        .populate('message', 'content sender createdAt')
        .sort('-createdAt')
        .exec();

      return results;
    } catch (error) {
      console.error('Error in keyword search:', error);
      throw error;
    }
  },

  /**
   * Search for error logs/stack traces
   * @param {String} taskId - Task ID to search within
   * @returns {Promise<Array>} Error-related messages
   */
  async findErrorLogs(taskId) {
    try {
      const errors = await SearchIndex.find({
        task: require('mongoose').Types.ObjectId(taskId),
        entityType: 'error_log',
      })
        .populate('message', 'content sender createdAt')
        .sort('-createdAt')
        .exec();

      return errors;
    } catch (error) {
      console.error('Error fetching error logs:', error);
      throw error;
    }
  },

  /**
   * Find code snippets in a task discussion
   * @param {String} taskId - Task ID to search within
   * @param {String} language - Programming language (optional)
   * @returns {Promise<Array>} Code snippet messages
   */
  async findCodeSnippets(taskId, language = null) {
    try {
      const query = {
        task: require('mongoose').Types.ObjectId(taskId),
        entityType: 'code_snippet',
      };

      if (language) {
        query['metadata.language'] = language;
      }

      const snippets = await SearchIndex.find(query)
        .populate('message', 'content sender createdAt')
        .sort('-createdAt')
        .exec();

      return snippets;
    } catch (error) {
      console.error('Error finding code snippets:', error);
      throw error;
    }
  },

  /**
   * Search across a project for discussions matching a topic
   * @param {String} projectId - Project ID
   * @param {String} query - Search query
   * @param {Object} options - Search options (limit, entityType)
   * @returns {Promise<Array>} Matching discussions across all tasks
   */
  async projectWideSearch(projectId, query, options = {}) {
    try {
      const { limit = 20, entityType = null } = options;

      const searchQuery = {
        project: require('mongoose').Types.ObjectId(projectId),
      };

      if (entityType) {
        searchQuery.entityType = entityType;
      }

      const results = await SearchIndex.find(
        {
          ...searchQuery,
          $text: { $search: query },
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .populate('task', 'title')
        .populate('message', 'content sender createdAt')
        .exec();

      return results;
    } catch (error) {
      console.error('Error in project-wide search:', error);
      throw error;
    }
  },

  /**
   * Get related discussions based on content similarity
   * @param {String} messageId - Message ID to find related discussions for
   * @param {Object} options - Search options (limit, taskId)
   * @returns {Promise<Array>} Related messages
   */
  async findRelatedDiscussions(messageId, options = {}) {
    try {
      const { limit = 5, taskId = null } = options;

      const sourceMessage = await SearchIndex.findOne({ message: messageId });
      if (!sourceMessage) {
        throw new Error('Message not indexed');
      }

      const query = {};
      if (taskId) {
        query.task = require('mongoose').Types.ObjectId(taskId);
      }

      // Find messages with similar keywords
      const relatedByKeywords = await SearchIndex.find({
        ...query,
        keywords: { $in: sourceMessage.keywords },
        _id: { $ne: sourceMessage._id },
      })
        .limit(limit)
        .populate('message', 'content sender createdAt')
        .sort('-createdAt')
        .exec();

      return relatedByKeywords;
    } catch (error) {
      console.error('Error finding related discussions:', error);
      throw error;
    }
  },

  /**
   * Index all existing messages in a task
   * Used for bulk indexing when feature is first enabled
   * @param {String} taskId - Task ID
   */
  async indexTaskMessages(taskId) {
    try {
      const messages = await Message.find({ task: taskId });

      for (const message of messages) {
        await this.indexMessage(message._id, 'discussion');
      }

      return { indexed: messages.length };
    } catch (error) {
      console.error('Error indexing task messages:', error);
      throw error;
    }
  },

  /**
   * Delete search index for a message
   * @param {String} messageId - Message ID
   */
  async deleteSearchIndex(messageId) {
    try {
      await SearchIndex.deleteOne({ message: messageId });
    } catch (error) {
      console.error('Error deleting search index:', error);
      throw error;
    }
  },
};

module.exports = SemanticSearchService;
