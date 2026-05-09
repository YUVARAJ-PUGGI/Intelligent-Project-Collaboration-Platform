const router = require('express').Router();
const auth = require('../middleware/auth');
const summaryController = require('../controllers/summaryController');

// Get summary for a specific task
router.get('/task/:taskId', auth, summaryController.getTaskSummary);

// Regenerate summary for a task
router.post('/task/:taskId/regenerate', auth, summaryController.regenerateTaskSummary);

// Get all summaries in a project
router.get('/project/:projectId', auth, summaryController.getProjectSummaries);

module.exports = router;
