const router = require('express').Router();
const auth = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');

router.post('/', auth, messagesController.sendMessage);
router.post('/:id/convert', auth, messagesController.convertMessageToTask);

module.exports = router;
