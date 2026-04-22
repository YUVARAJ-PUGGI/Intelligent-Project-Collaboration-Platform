const Task = require('../models/Task');
const { getMyDayRange } = require('../services/myDayService');

async function getMyDay(req, res) {
  try {
    const { todayStart, todayEnd, in3Days } = getMyDayRange();

    const [todayTasks, dueSoon, overdue] = await Promise.all([
      Task.find({ assignee: req.user._id, status: { $ne: 'done' }, dueDate: { $gte: todayStart, $lte: todayEnd } })
        .populate('project', 'name color description')
        .sort('priority'),
      Task.find({ assignee: req.user._id, status: { $ne: 'done' }, dueDate: { $gt: todayEnd, $lte: in3Days } })
        .populate('project', 'name color description')
        .sort('dueDate'),
      Task.find({ assignee: req.user._id, status: { $ne: 'done' }, dueDate: { $lt: todayStart } })
        .populate('project', 'name color description')
        .sort('dueDate'),
    ]);

    return res.json({ todayTasks, dueSoon, overdue });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getMyDay,
};
