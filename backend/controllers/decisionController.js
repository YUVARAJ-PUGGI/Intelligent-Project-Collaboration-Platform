/**
 * Decision Tracking Controller
 * 
 * Handles API endpoints for marking, retrieving, and managing decisions
 */

const Project = require('../models/Project');
const Task = require('../models/Task');
const Message = require('../models/Message');
const DecisionTrackingService = require('../services/decisionTrackingService');

async function canAccessProject(projectId, userId) {
  return Project.exists({ _id: projectId, 'members.user': userId });
}

async function canAccessMessage(messageId, userId) {
  const message = await Message.findById(messageId);
  if (!message) return null;
  
  const hasAccess = await canAccessProject(message.project, userId);
  return hasAccess ? message : false;
}

/**
 * POST /api/decisions/mark
 * Mark a message as a decision/fix/update/blocker
 */
async function markMessageAsDecision(req, res) {
  try {
    const { messageId, decisionType, tags = [], priority = 'medium' } = req.body;

    if (!messageId || !decisionType) {
      return res.status(400).json({ 
        message: 'messageId and decisionType are required' 
      });
    }

    const validTypes = ['decision', 'final_fix', 'important_update', 'blocker'];
    if (!validTypes.includes(decisionType)) {
      return res.status(400).json({ 
        message: `Invalid decisionType. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    const message = await canAccessMessage(messageId, req.user._id);
    if (message === false) {
      return res.status(403).json({ message: 'You cannot access this message' });
    }
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const decision = await DecisionTrackingService.markMessageAsDecision(
      messageId,
      decisionType,
      req.user._id,
      { tags, priority }
    );

    return res.status(201).json(decision);
  } catch (err) {
    console.error('Error marking decision:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * DELETE /api/decisions/:decisionId
 * Unmark a decision (remove decision tracking)
 */
async function unmarkDecision(req, res) {
  try {
    const { decisionId } = req.params;

    const Decision = require('../models/Decision');
    const decision = await Decision.findById(decisionId);
    
    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    const hasAccess = await canAccessProject(decision.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot modify this decision' });
    }

    await DecisionTrackingService.unmarkDecision(decision.message);
    return res.json({ message: 'Decision removed' });
  } catch (err) {
    console.error('Error unmarking decision:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/decisions/task/:taskId
 * Get all decisions for a task
 */
async function getTaskDecisions(req, res) {
  try {
    const { taskId } = req.params;
    const { decisionType, priority, status } = req.query;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasAccess = await canAccessProject(task.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this task' });
    }

    const decisions = await DecisionTrackingService.getTaskDecisions(taskId, {
      decisionType,
      priority,
      status,
    });

    return res.json(decisions);
  } catch (err) {
    console.error('Error getting task decisions:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/decisions/project/:projectId
 * Get all decisions in a project
 */
async function getProjectDecisions(req, res) {
  try {
    const { projectId } = req.params;
    const { limit = 50, skip = 0, decisionType } = req.query;

    const hasAccess = await canAccessProject(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this project' });
    }

    const decisions = await DecisionTrackingService.getProjectDecisions(projectId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      decisionType,
    });

    return res.json(decisions);
  } catch (err) {
    console.error('Error getting project decisions:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/decisions/project/:projectId/blockers
 * Get high-priority blockers in a project
 */
async function getActiveBlockers(req, res) {
  try {
    const { projectId } = req.params;

    const hasAccess = await canAccessProject(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this project' });
    }

    const blockers = await DecisionTrackingService.getActiveBlockers(projectId);
    return res.json(blockers);
  } catch (err) {
    console.error('Error getting blockers:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * PATCH /api/decisions/:decisionId/status
 * Update decision status (active -> resolved -> obsolete)
 */
async function updateDecisionStatus(req, res) {
  try {
    const { decisionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const Decision = require('../models/Decision');
    const decision = await Decision.findById(decisionId);
    
    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    const hasAccess = await canAccessProject(decision.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot modify this decision' });
    }

    const updated = await DecisionTrackingService.updateDecisionStatus(decisionId, status);
    return res.json(updated);
  } catch (err) {
    console.error('Error updating decision status:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/decisions/search
 * Search decisions by keyword
 */
async function searchDecisions(req, res) {
  try {
    const { projectId, keyword } = req.query;

    if (!projectId || !keyword) {
      return res.status(400).json({ 
        message: 'projectId and keyword are required' 
      });
    }

    const hasAccess = await canAccessProject(projectId, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot access this project' });
    }

    const decisions = await DecisionTrackingService.searchDecisions(projectId, keyword);
    return res.json(decisions);
  } catch (err) {
    console.error('Error searching decisions:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  markMessageAsDecision,
  unmarkDecision,
  getTaskDecisions,
  getProjectDecisions,
  getActiveBlockers,
  updateDecisionStatus,
  searchDecisions,
};
