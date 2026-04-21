const router = require('express').Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { project, content } = req.body;
    const msg = await Message.create({ project, sender: req.user._id, content });
    const pop = await Message.findById(msg._id).populate('sender', 'name avatarColor');
    res.status(201).json(pop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// FEATURE 3: Convert message → task
router.post('/:id/convert', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.convertedToTask) return res.status(400).json({ message: 'Already converted to a task' });
    const task = await Task.create({
      project: msg.project,
      title: msg.content.substring(0, 100),
      description: `Converted from discussion: "${msg.content}"`,
      status: 'todo',
      priority: 'medium',
      createdBy: req.user._id,
    });
    msg.convertedToTask = task._id;
    await msg.save();
    await Activity.create({ project: msg.project, user: req.user._id, action: 'converted message to task', entityType: 'task', entityId: task._id, details: task.title });
    const pop = await Task.findById(task._id).populate('assignee', 'name avatarColor').populate('createdBy', 'name');
    res.json(pop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
