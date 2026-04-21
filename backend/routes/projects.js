const router = require('express').Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Message = require('../models/Message');

// Get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor')
      .sort('-createdAt');

    const data = await Promise.all(projects.map(async p => {
      const [total, done, overdue] = await Promise.all([
        Task.countDocuments({ project: p._id }),
        Task.countDocuments({ project: p._id, status: 'done' }),
        Task.countDocuments({ project: p._id, status: { $ne: 'done' }, dueDate: { $lt: new Date() } }),
      ]);
      return { ...p.toObject(), stats: { total, done, overdue, pct: total ? Math.round((done / total) * 100) : 0 } };
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name, description, color: color || '#6366f1',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });
    await Activity.create({ project: project._id, user: req.user._id, action: 'created project', entityType: 'project', entityId: project._id, details: name });
    const pop = await Project.findById(project._id).populate('owner', 'name email avatarColor').populate('members.user', 'name email avatarColor');
    res.status(201).json(pop);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, 'members.user': req.user._id })
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update project
router.patch('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, { $set: req.body }, { new: true }
    ).populate('owner', 'name email avatarColor').populate('members.user', 'name email avatarColor');
    if (!project) return res.status(404).json({ message: 'Not found or not owner' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found' });
    await Task.deleteMany({ project: req.params.id });
    await Message.deleteMany({ project: req.params.id });
    await Activity.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add member by email
router.post('/:id/members', auth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found with that email' });
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found or not owner' });
    if (project.members.some(m => m.user.toString() === user._id.toString()))
      return res.status(400).json({ message: 'User already a member' });
    project.members.push({ user: user._id, role: 'member' });
    await project.save();
    await Notification.create({ user: user._id, type: 'member_added', message: `You were added to project "${project.name}"`, project: project._id });
    await Activity.create({ project: project._id, user: req.user._id, action: 'added member', entityType: 'member', entityId: user._id, details: user.name });
    const updated = await Project.findById(project._id).populate('owner', 'name email avatarColor').populate('members.user', 'name email avatarColor');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove member
router.delete('/:id/members/:uid', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $pull: { members: { user: req.params.uid } } }, { new: true }
    ).populate('members.user', 'name email avatarColor');
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get tasks for project
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignee', 'name email avatarColor')
      .populate('createdBy', 'name')
      .sort('createdAt');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// FEATURE 1: Risk Alerts
router.get('/:id/risks', auth, async (req, res) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const [overdue, dueSoon, stale] = await Promise.all([
      Task.find({ project: req.params.id, status: { $ne: 'done' }, dueDate: { $lt: now, $ne: null } }).populate('assignee', 'name avatarColor'),
      Task.find({ project: req.params.id, status: { $ne: 'done' }, dueDate: { $gte: now, $lte: in24h } }).populate('assignee', 'name avatarColor'),
      Task.find({ project: req.params.id, status: 'inprogress', updatedAt: { $lt: twoDaysAgo } }).populate('assignee', 'name avatarColor'),
    ]);
    res.json({ overdue, dueSoon, stale });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// FEATURE 2: Workload Indicator
router.get('/:id/workload', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name email avatarColor');
    if (!project) return res.status(404).json({ message: 'Not found' });
    const workload = await Promise.all(project.members.map(async m => {
      const [active, done, total] = await Promise.all([
        Task.countDocuments({ project: req.params.id, assignee: m.user._id, status: { $ne: 'done' } }),
        Task.countDocuments({ project: req.params.id, assignee: m.user._id, status: 'done' }),
        Task.countDocuments({ project: req.params.id, assignee: m.user._id }),
      ]);
      return { user: m.user, role: m.role, active, done, total, isOverloaded: active >= 4 };
    }));
    res.json(workload);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ project: req.params.id })
      .populate('sender', 'name avatarColor')
      .populate('convertedToTask', 'title status')
      .sort('createdAt').limit(100);
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// FEATURE 5: Activity Timeline
router.get('/:id/activity', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ project: req.params.id })
      .populate('user', 'name avatarColor')
      .sort('-createdAt').limit(50);
    res.json(activities);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
