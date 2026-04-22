const router = require('express').Router();
const auth = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const projectsController = require('../controllers/projectsController');

router.get('/', auth, projectsController.listProjects);
router.post('/', auth, restrictTo('manager'), projectsController.createProject);
router.get('/team/overview', auth, projectsController.listTeamOverview);
router.get('/manager/task-monitor', auth, restrictTo('manager'), projectsController.listManagerTaskMonitor);
router.get('/:id', auth, projectsController.getProject);
router.patch('/:id', auth, projectsController.updateProject);
router.delete('/:id', auth, restrictTo('manager'), projectsController.deleteProject);
router.post('/:id/members', auth, restrictTo('manager'), projectsController.addMember);
router.delete('/:id/members/:uid', auth, restrictTo('manager'), projectsController.removeMember);
router.get('/:id/tasks', auth, projectsController.listProjectTasks);
router.get('/:id/risks', auth, projectsController.listProjectRisks);
router.get('/:id/health-score', auth, projectsController.getProjectHealthScore);
router.post('/:id/assignment-check', auth, restrictTo('manager'), projectsController.checkAssignmentRisk);
router.get('/:id/workload', auth, projectsController.listProjectWorkload);
router.get('/:id/available-developers', auth, restrictTo('manager'), projectsController.listAvailableDevelopers);
router.get('/:id/messages', auth, projectsController.listProjectMessages);
router.get('/:id/activity', auth, projectsController.listProjectActivity);

module.exports = router;
