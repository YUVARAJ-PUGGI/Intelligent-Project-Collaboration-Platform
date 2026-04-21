const router = require('express').Router();
const auth = require('../middleware/auth');
const tasksController = require('../controllers/tasksController');

router.post('/', auth, tasksController.createTask);
router.patch('/:id', auth, tasksController.updateTask);
router.delete('/:id', auth, tasksController.deleteTask);

module.exports = router;
