const Project = require('../models/Project');
const Message = require('../models/Message');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { buildConvertedTaskFromMessage } = require('../services/messageService');

async function canAccessProject(projectId, userId) {
  return Project.exists({ _id: projectId, 'members.user': userId });
}

async function resolveAccessibleTask(taskId, userId) {
  const task = await Task.findById(taskId);
  if (!task) return null;

  const hasAccess = await canAccessProject(task.project, userId);
  if (!hasAccess) return 'forbidden';

  return task;
}

async function listTaskMessages(req, res) {
  try {
    const task = await resolveAccessibleTask(req.params.taskId, req.user._id);
    if (task === 'forbidden') {
      return res.status(403).json({ message: 'You cannot view this task chat' });
    }
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const messages = await Message.find({ task: task._id })
      .populate('sender', 'name avatarColor title')
      .populate('convertedToTask', 'title status')
      .sort('createdAt')
      .limit(200);

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function sendTaskMessage(req, res) {
  try {
    const taskId = req.params.taskId || req.body.task;
    const { content } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required' });
    }

    const task = await resolveAccessibleTask(taskId, req.user._id);
    if (task === 'forbidden') {
      return res.status(403).json({ message: 'You cannot post in that task chat' });
    }
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const message = await Message.create({
      project: task.project,
      task: task._id,
      sender: req.user._id,
      content,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatarColor title')
      .populate('convertedToTask', 'title status');

    return res.status(201).json(populatedMessage);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function convertMessageToTask(req, res) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const hasAccess = await canAccessProject(message.project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot update that message' });
    }

    if (message.convertedToTask) {
      return res.status(400).json({ message: 'Already converted to a task' });
    }

    const task = await Task.create(buildConvertedTaskFromMessage(message, req.user._id));
    message.convertedToTask = task._id;
    await message.save();

    await Activity.create({
      project: message.project,
      user: req.user._id,
      action: 'converted message to task',
      entityType: 'task',
      entityId: task._id,
      details: task.title,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name avatarColor title')
      .populate('createdBy', 'name');

    return res.json(populatedTask);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listTaskMessages,
  sendTaskMessage,
  convertMessageToTask,
};
