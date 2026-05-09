const router = require('express').Router();
const auth = require('../middleware/auth');
const decisionController = require('../controllers/decisionController');

// Mark a message as decision/fix/update/blocker
router.post('/mark', auth, decisionController.markMessageAsDecision);

// Unmark a decision
router.delete('/:decisionId', auth, decisionController.unmarkDecision);

// Get decisions for a task
router.get('/task/:taskId', auth, decisionController.getTaskDecisions);

// Get decisions for a project
router.get('/project/:projectId', auth, decisionController.getProjectDecisions);

// Get high-priority blockers in a project
router.get('/project/:projectId/blockers', auth, decisionController.getActiveBlockers);

// Update decision status
router.patch('/:decisionId/status', auth, decisionController.updateDecisionStatus);

// Search decisions
router.get('/search', auth, decisionController.searchDecisions);

module.exports = router;
