const router = require('express').Router();
const auth = require('../middleware/auth');
const myDayController = require('../controllers/myDayController');

router.get('/', auth, myDayController.getMyDay);

module.exports = router;
