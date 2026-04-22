const router = require('express').Router();
const auth = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const tasksController = require('../controllers/tasksController');

router.post('/', auth, restrictTo('manager'), tasksController.createTask);
router.patch('/:id', auth, tasksController.updateTask);
router.delete('/:id', auth, restrictTo('manager'), tasksController.deleteTask);

module.exports = router;
