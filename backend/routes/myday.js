const router = require('express').Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// FEATURE 4: My Day View
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);
    const in3Days    = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [todayTasks, dueSoon, overdue] = await Promise.all([
      Task.find({ assignee: req.user._id, status: { $ne: 'done' }, dueDate: { $gte: todayStart, $lte: todayEnd } })
        .populate('project', 'name color').sort('priority'),
      Task.find({ assignee: req.user._id, status: { $ne: 'done' }, dueDate: { $gt: todayEnd, $lte: in3Days } })
        .populate('project', 'name color').sort('dueDate'),
      Task.find({ assignee: req.user._id, status: { $ne: 'done' }, dueDate: { $lt: todayStart } })
        .populate('project', 'name color').sort('dueDate'),
    ]);

    res.json({ todayTasks, dueSoon, overdue });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
