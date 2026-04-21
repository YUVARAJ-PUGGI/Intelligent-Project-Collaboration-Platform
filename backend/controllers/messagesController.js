const Project = require('../models/Project');
const Message = require('../models/Message');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { buildConvertedTaskFromMessage } = require('../services/messageService');

async function canAccessProject(projectId, userId) {
  return Project.exists({ _id: projectId, 'members.user': userId });
}

async function sendMessage(req, res) {
  try {
    const { project, content } = req.body;
    const hasAccess = await canAccessProject(project, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You cannot post in that project' });
    }

    const message = await Message.create({ project, sender: req.user._id, content });
    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatarColor title');
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
  sendMessage,
  convertMessageToTask,
};
