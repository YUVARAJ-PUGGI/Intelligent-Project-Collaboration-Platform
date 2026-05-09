/**
 * Search Controller
 * 
 * Handles API endpoints for semantic and keyword-based search across tasks
 */

const Project = require('../models/Project');
const Task = require('../models/Task');
const SemanticSearchService = require('../services/semanticSearchService');

async function canAccessProject(projectId, userId) {
  return Project.exists({ _id: projectId, 'members.user': userId });
}

/**
 * POST /api/search/task/:taskId
 * Search messages within a task using natural language
 */
async function searchTaskMessages(req, res) {
  try {
    const { taskId } = req.params;
    const { query, limit = 10, entityType } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'search query is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasAccess = await canAccessProject(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }

    const results = await SemanticSearchService.semanticSearch(taskId, query, {
      limit: parseInt(limit),
      entityType,
    });

    return res.json({
      query,
      taskId,
      resultCount: results.length,
      results,
    });
  } catch (err) {
    console.error('Error searching task:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/search/project
 * Search across all tasks in a project
 */
async function searchProject(req, res) {
  try {
    const { projectId, query, limit = 20, entityType } = req.body;

    if (!projectId || !query) {
      return res.status(400).json({ 
        message: 'projectId and query are required' 
      });
    }

    const hasAccess = await canAccessProject(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this project' });
    }

    const results = await SemanticSearchService.projectWideSearch(
      projectId,
      query,
      {
        limit: parseInt(limit),
        entityType,
      }
    );

    return res.json({
      query,
      projectId,
      resultCount: results.length,
      results,
    });
  } catch (err) {
    console.error('Error searching project:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/search/task/:taskId/errors
 * Find all error logs/stack traces in a task
 */
async function findErrorLogs(req, res) {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasAccess = await canAccessProject(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }

    const errors = await SemanticSearchService.findErrorLogs(taskId);
    return res.json({ taskId, errorCount: errors.length, errors });
  } catch (err) {
    console.error('Error finding error logs:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/search/task/:taskId/code-snippets
 * Find all code snippets in a task
 */
async function findCodeSnippets(req, res) {
  try {
    const { taskId } = req.params;
    const { language } = req.query;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasAccess = await canAccessProject(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }

    const snippets = await SemanticSearchService.findCodeSnippets(taskId, language);
    return res.json({ taskId, snippetCount: snippets.length, snippets });
  } catch (err) {
    console.error('Error finding code snippets:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/search/message/:messageId/related
 * Find discussions related to a specific message
 */
async function findRelatedDiscussions(req, res) {
  try {
    const { messageId } = req.params;
    const { limit = 5, taskId } = req.query;

    const Message = require('../models/Message');
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const hasAccess = await canAccessProject(message.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this message' });
    }

    const related = await SemanticSearchService.findRelatedDiscussions(messageId, {
      limit: parseInt(limit),
      taskId,
    });

    return res.json({ 
      messageId, 
      relatedCount: related.length, 
      related 
    });
  } catch (err) {
    console.error('Error finding related discussions:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/search/index-task
 * Manually index all messages in a task for searching
 */
async function indexTaskMessages(req, res) {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasAccess = await canAccessProject(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }

    const result = await SemanticSearchService.indexTaskMessages(taskId);
    return res.json({
      message: `Indexed ${result.indexed} messages for task ${taskId}`,
      ...result,
    });
  } catch (err) {
    console.error('Error indexing task messages:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  searchTaskMessages,
  searchProject,
  findErrorLogs,
  findCodeSnippets,
  findRelatedDiscussions,
  indexTaskMessages,
};
