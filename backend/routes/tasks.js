const router = require('express').Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { project, title, description, assignee, priority, dueDate, status } = req.body;
    const task = await Task.create({ project, title, description, assignee: assignee || null, priority, dueDate: dueDate || null, status: status || 'todo', createdBy: req.user._id });
    if (assignee && assignee !== req.user._id.toString()) {
      await Notification.create({ user: assignee, type: 'task_assigned', message: `You were assigned: "${title}"`, project, task: task._id });
    }
    await Activity.create({ project, user: req.user._id, action: 'created task', entityType: 'task', entityId: task._id, details: title });
    const pop = await Task.findById(task._id).populate('assignee', 'name email avatarColor').populate('createdBy', 'name');
    res.status(201).json(pop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update task
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const prevAssignee = task.assignee?.toString();
    const prevStatus = task.status;
    Object.assign(task, req.body);
    await task.save();
    if (req.body.assignee && req.body.assignee !== prevAssignee) {
      await Notification.create({ user: req.body.assignee, type: 'task_assigned', message: `You were assigned: "${task.title}"`, project: task.project, task: task._id });
    }
    const actionLabel = req.body.status && req.body.status !== prevStatus ? `moved task to ${req.body.status}` : 'updated task';
    await Activity.create({ project: task.project, user: req.user._id, action: actionLabel, entityType: 'task', entityId: task._id, details: task.title });
    const pop = await Task.findById(task._id).populate('assignee', 'name email avatarColor').populate('createdBy', 'name');
    res.json(pop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await Activity.create({ project: task.project, user: req.user._id, action: 'deleted task', entityType: 'task', entityId: task._id, details: task.title });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
