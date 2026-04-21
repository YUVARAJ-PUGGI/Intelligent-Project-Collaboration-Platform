const router = require('express').Router();
const auth = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

router.get('/', auth, notificationsController.listNotifications);
router.patch('/:id/read', auth, notificationsController.markAsRead);
router.patch('/read-all', auth, notificationsController.markAllRead);

module.exports = router;
