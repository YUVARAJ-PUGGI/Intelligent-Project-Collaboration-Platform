const Notification = require('../models/Notification');
const { unreadFilter } = require('../services/notificationService');

async function listNotifications(req, res) {
  try {
    const notes = await Notification.find({ user: req.user._id })
      .populate('project', 'name color')
      .sort('-createdAt')
      .limit(30);
    return res.json(notes);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const note = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );
    if (!note) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany(unreadFilter(req.user._id), { isRead: true });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllRead,
};
