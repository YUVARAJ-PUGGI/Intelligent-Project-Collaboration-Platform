const router = require('express').Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

router.get('/', auth, async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user._id })
      .populate('project', 'name color').sort('-createdAt').limit(30);
    res.json(notes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
