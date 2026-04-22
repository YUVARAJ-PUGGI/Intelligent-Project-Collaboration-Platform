const router = require('express').Router();
const auth = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');

router.get('/task/:taskId', auth, messagesController.listTaskMessages);
router.post('/task/:taskId', auth, messagesController.sendTaskMessage);
router.post('/', auth, messagesController.sendTaskMessage);
router.post('/:id/convert', auth, messagesController.convertMessageToTask);

module.exports = router;
