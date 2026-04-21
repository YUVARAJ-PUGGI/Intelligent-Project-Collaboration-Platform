const router = require('express').Router();
const auth = require('../middleware/auth');
const projectsController = require('../controllers/projectsController');

router.get('/', auth, projectsController.listProjects);
router.post('/', auth, projectsController.createProject);
router.get('/team/overview', auth, projectsController.listTeamOverview);
router.get('/:id', auth, projectsController.getProject);
router.patch('/:id', auth, projectsController.updateProject);
router.delete('/:id', auth, projectsController.deleteProject);
router.post('/:id/members', auth, projectsController.addMember);
router.delete('/:id/members/:uid', auth, projectsController.removeMember);
router.get('/:id/tasks', auth, projectsController.listProjectTasks);
router.get('/:id/risks', auth, projectsController.listProjectRisks);
router.get('/:id/workload', auth, projectsController.listProjectWorkload);
router.get('/:id/messages', auth, projectsController.listProjectMessages);
router.get('/:id/activity', auth, projectsController.listProjectActivity);

module.exports = router;
