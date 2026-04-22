const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const { findIdentityById } = require('../services/identityService');
const {
  buildTaskPayload,
  getTaskUpdateAction,
  shouldNotifyAssignee,
  normalizePriority,
  normalizeStatus,
} = require('../services/taskService');

async function canAccessProject(projectId, userId) {
  return Project.exists({ _id: projectId, 'members.user': userId });
}

async function loadAccessibleTask(taskId, userId) {
  const task = await Task.findById(taskId);
  if (!task) return null;

  const hasAccess = await canAccessProject(task.project, userId);
  if (!hasAccess) return 'forbidden';

  return task;
}

async function validateDeveloperAssignee(projectId, assigneeId) {
  if (!assigneeId) return null;

  const isMember = await Project.exists({ _id: projectId, 'members.user': assigneeId });
  if (!isMember) {
    return 'Assignee must be a member of the selected project';
  }

  const assignee = await findIdentityById(assigneeId);
  if (!assignee || assignee.role !== 'developer') {
    return 'Tasks can only be assigned to developers';
  }

  return null;
}

async function createTask(req, res) {
  try {
    const payload = buildTaskPayload(req.body, req.user._id);
    const hasAccess = await canAccessProject(payload.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot create tasks in that project' });
    }

    const assigneeError = await validateDeveloperAssignee(payload.project, payload.assignee);
    if (assigneeError) {
      return res.status(400).json({ message: assigneeError });
    }

    const task = await Task.create(payload);

    if (payload.assignee && payload.assignee !== req.user._id.toString()) {
      await Notification.create({
        user: payload.assignee,
        type: 'task_assigned',
        message: `You were assigned: "${payload.title}"`,
        project: payload.project,
        task: task._id,
      });
    }

    await Activity.create({
      project: payload.project,
      user: req.user._id,
      action: 'created task',
      entityType: 'task',
      entityId: task._id,
      details: payload.title,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatarColor title')
      .populate('createdBy', 'name');

    return res.status(201).json(populatedTask);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateTask(req, res) {
  try {
    const task = await loadAccessibleTask(req.params.id, req.user._id);
    if (task === 'forbidden') {
      return res.status(403).json({ message: 'You cannot update this task' });
    }
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updates = { ...req.body };

    if (req.user.role === 'developer') {
      if (!task.assignee || task.assignee.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Developers can only update tasks assigned to them' });
      }

      const disallowedField = ['project', 'assignee', 'priority', 'dueDate', 'title', 'description']
        .find((field) => typeof updates[field] !== 'undefined');
      if (disallowedField) {
        return res.status(403).json({ message: 'Developers can only update task status' });
      }
    }

    if (updates.project && updates.project.toString() !== task.project.toString()) {
      const hasTargetAccess = await canAccessProject(updates.project, req.user._id);
      if (!hasTargetAccess) {
        return res.status(403).json({ message: 'You cannot move tasks to that project' });
      }
    }

    if (typeof updates.assignee !== 'undefined') {
      const targetProjectId = updates.project || task.project;
      const assigneeError = await validateDeveloperAssignee(targetProjectId, updates.assignee);
      if (assigneeError) {
        return res.status(400).json({ message: assigneeError });
      }
    }

    if (typeof updates.status !== 'undefined') {
      updates.status = normalizeStatus(updates.status);
    }
    if (typeof updates.priority !== 'undefined') {
      updates.priority = normalizePriority(updates.priority);
    }

    const previousAssignee = task.assignee?.toString();
    const previousStatus = task.status;

    Object.assign(task, updates);
    await task.save();

    if (shouldNotifyAssignee(updates.assignee, previousAssignee, req.user._id.toString())) {
      await Notification.create({
        user: updates.assignee,
        type: 'task_assigned',
        message: `You were assigned: "${task.title}"`,
        project: task.project,
        task: task._id,
      });
    }

    await Activity.create({
      project: task.project,
      user: req.user._id,
      action: getTaskUpdateAction(previousStatus, updates.status),
      entityType: 'task',
      entityId: task._id,
      details: task.title,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatarColor title')
      .populate('createdBy', 'name');

    return res.json(populatedTask);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await loadAccessibleTask(req.params.id, req.user._id);
    if (task === 'forbidden') {
      return res.status(403).json({ message: 'You cannot delete this task' });
    }
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    await Activity.create({
      project: task.project,
      user: req.user._id,
      action: 'deleted task',
      entityType: 'task',
      entityId: task._id,
      details: task.title,
    });

    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createTask,
  updateTask,
  deleteTask,
};
