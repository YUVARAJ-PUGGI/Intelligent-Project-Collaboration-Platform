/**
 * Conversation Summary Controller
 * 
 * Handles API endpoints for generating and retrieving conversation summaries
 */

const Project = require('../models/Project');
const ConversationSummaryService = require('../services/conversationSummaryService');

async function canAccessProject(projectId, userId) {
  return Project.exists({ _id: projectId, 'members.user': userId });
}

/**
 * GET /api/summaries/task/:taskId
 * Get or generate summary for a specific task
 */
async function getTaskSummary(req, res) {
  try {
    const { taskId } = req.params;
    const { generate = false } = req.query;

    // Verify task access
    const Task = require('../models/Task');
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasAccess = await canAccessProject(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }

    // Get or generate summary
    const summary = await ConversationSummaryService.getTaskSummary(taskId);

    // Auto-generate if requested or if stale
    if (generate || summary.isStale) {
      const freshSummary = await ConversationSummaryService.generateTaskSummary(taskId, true);
      return res.json(freshSummary);
    }

    return res.json(summary);
  } catch (err) {
    console.error('Error getting task summary:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/summaries/task/:taskId/regenerate
 * Force regenerate summary for a task
 */
async function regenerateTaskSummary(req, res) {
  try {
    const { taskId } = req.params;

    const Task = require('../models/Task');
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasAccess = await canAccessProject(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }

    const summary = await ConversationSummaryService.generateTaskSummary(taskId, true);
    return res.json(summary);
  } catch (err) {
    console.error('Error regenerating summary:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/summaries/project/:projectId
 * Get summaries for all tasks in a project
 */
async function getProjectSummaries(req, res) {
  try {
    const { projectId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const hasAccess = await canAccessProject(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this project' });
    }

    const summaries = await ConversationSummaryService.getProjectSummaries(projectId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
    });

    return res.json(summaries);
  } catch (err) {
    console.error('Error getting project summaries:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getTaskSummary,
  regenerateTaskSummary,
  getProjectSummaries,
};
