const router = require('express').Router();
const auth = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// Search within a task
router.post('/task/:taskId', auth, searchController.searchTaskMessages);

// Project-wide search
router.post('/project', auth, searchController.searchProject);

// Find error logs in a task
router.get('/task/:taskId/errors', auth, searchController.findErrorLogs);

// Find code snippets in a task
router.get('/task/:taskId/code-snippets', auth, searchController.findCodeSnippets);

// Find related discussions
router.get('/message/:messageId/related', auth, searchController.findRelatedDiscussions);

// Index messages in a task
router.post('/index-task', auth, searchController.indexTaskMessages);

module.exports = router;
