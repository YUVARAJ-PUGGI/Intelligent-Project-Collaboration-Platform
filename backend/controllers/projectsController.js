const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Message = require('../models/Message');
const { calculateProjectStats, riskWindow, isExistingMember } = require('../services/projectService');

function projectMemberQuery(projectId, userId) {
  return { _id: projectId, 'members.user': userId };
}

async function requireProjectMember(projectId, userId, populate = '') {
  let query = Project.findOne(projectMemberQuery(projectId, userId));
  if (populate) {
    query = query.populate(populate);
  }
  return query;
}

async function listProjects(req, res) {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title')
      .sort('-createdAt');

    const data = await Promise.all(projects.map(async (project) => {
      const [total, done, overdue] = await Promise.all([
        Task.countDocuments({ project: project._id }),
        Task.countDocuments({ project: project._id, status: 'done' }),
        Task.countDocuments({ project: project._id, status: { $ne: 'done' }, dueDate: { $lt: new Date() } }),
      ]);
      return { ...project.toObject(), stats: calculateProjectStats(total, done, overdue) };
    }));

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createProject(req, res) {
  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name,
      description,
      color: color || '#5b57f5',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    await Activity.create({
      project: project._id,
      user: req.user._id,
      action: 'created project',
      entityType: 'project',
      entityId: project._id,
      details: name,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title');

    return res.status(201).json(populatedProject);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getProject(req, res) {
  try {
    const project = await Project.findOne(projectMemberQuery(req.params.id, req.user._id))
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title bio');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateProject(req, res) {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: req.body },
      { new: true }
    )
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title');

    if (!project) {
      return res.status(404).json({ message: 'Not found or not owner' });
    }

    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteProject(req, res) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Not found' });
    }

    await Promise.all([
      Task.deleteMany({ project: req.params.id }),
      Message.deleteMany({ project: req.params.id }),
      Activity.deleteMany({ project: req.params.id }),
      Notification.deleteMany({ project: req.params.id }),
    ]);

    return res.json({ message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function addMember(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or not owner' });
    }

    if (isExistingMember(project, user._id)) {
      return res.status(400).json({ message: 'User already a member' });
    }

    project.members.push({ user: user._id, role: 'member' });
    await project.save();

    await Notification.create({
      user: user._id,
      type: 'member_added',
      message: `You were added to project "${project.name}"`,
      project: project._id,
    });

    await Activity.create({
      project: project._id,
      user: req.user._id,
      action: 'added member',
      entityType: 'member',
      entityId: user._id,
      details: user.name,
    });

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title');

    return res.json(updatedProject);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function removeMember(req, res) {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $pull: { members: { user: req.params.uid } } },
      { new: true }
    )
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title');

    if (!project) {
      return res.status(404).json({ message: 'Not found' });
    }

    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listProjectTasks(req, res) {
  try {
    const project = await requireProjectMember(req.params.id, req.user._id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignee', 'name email avatarColor title')
      .populate('createdBy', 'name')
      .sort('createdAt');
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listProjectRisks(req, res) {
  try {
    const project = await requireProjectMember(req.params.id, req.user._id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { now, in24h, twoDaysAgo } = riskWindow();
    const [overdue, dueSoon, stale] = await Promise.all([
      Task.find({ project: req.params.id, status: { $ne: 'done' }, dueDate: { $lt: now, $ne: null } }).populate('assignee', 'name avatarColor title'),
      Task.find({ project: req.params.id, status: { $ne: 'done' }, dueDate: { $gte: now, $lte: in24h } }).populate('assignee', 'name avatarColor title'),
      Task.find({ project: req.params.id, status: 'inprogress', updatedAt: { $lt: twoDaysAgo } }).populate('assignee', 'name avatarColor title'),
    ]);

    return res.json({ overdue, dueSoon, stale });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listProjectWorkload(req, res) {
  try {
    const project = await Project.findOne(projectMemberQuery(req.params.id, req.user._id))
      .populate('members.user', 'name email avatarColor title');

    if (!project) {
      return res.status(404).json({ message: 'Not found' });
    }

    const workload = await Promise.all(project.members.map(async (member) => {
      const [active, done, total] = await Promise.all([
        Task.countDocuments({ project: req.params.id, assignee: member.user._id, status: { $ne: 'done' } }),
        Task.countDocuments({ project: req.params.id, assignee: member.user._id, status: 'done' }),
        Task.countDocuments({ project: req.params.id, assignee: member.user._id }),
      ]);

      return {
        user: member.user,
        role: member.role,
        active,
        done,
        total,
        isOverloaded: active >= 4,
      };
    }));

    return res.json(workload);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listProjectMessages(req, res) {
  try {
    const project = await requireProjectMember(req.params.id, req.user._id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const messages = await Message.find({ project: req.params.id })
      .populate('sender', 'name avatarColor title')
      .populate('convertedToTask', 'title status')
      .sort('createdAt')
      .limit(100);

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listProjectActivity(req, res) {
  try {
    const project = await requireProjectMember(req.params.id, req.user._id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const activities = await Activity.find({ project: req.params.id })
      .populate('user', 'name avatarColor title')
      .sort('-createdAt')
      .limit(50);

    return res.json(activities);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listTeamOverview(req, res) {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title bio')
      .sort('name');

    const projectIds = projects.map((project) => project._id);
    const assignedTasks = await Task.find({
      project: { $in: projectIds },
      assignee: { $ne: null },
    })
      .select('project assignee status dueDate');

    const memberMap = new Map();

    for (const project of projects) {
      for (const member of project.members) {
        const user = member.user;
        const key = user._id.toString();
        if (!memberMap.has(key)) {
          memberMap.set(key, {
            user,
            projects: [],
            activeTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            roles: new Set(),
          });
        }

        const entry = memberMap.get(key);
        entry.projects.push({
          id: project._id,
          name: project.name,
          color: project.color,
          role: member.role,
        });
        entry.roles.add(member.role);
      }
    }

    for (const task of assignedTasks) {
      const entry = memberMap.get(task.assignee.toString());
      if (!entry) continue;

      if (task.status === 'done') {
        entry.completedTasks += 1;
      } else {
        entry.activeTasks += 1;
        if (task.dueDate && new Date(task.dueDate) < new Date()) {
          entry.overdueTasks += 1;
        }
      }
    }

    const members = Array.from(memberMap.values())
      .map((entry) => ({
        user: entry.user,
        projectCount: entry.projects.length,
        activeTasks: entry.activeTasks,
        completedTasks: entry.completedTasks,
        overdueTasks: entry.overdueTasks,
        isOverloaded: entry.activeTasks >= 4,
        roles: Array.from(entry.roles),
        projects: entry.projects,
      }))
      .sort((a, b) => a.user.name.localeCompare(b.user.name));

    return res.json({
      projects: projects.map((project) => ({
        id: project._id,
        name: project.name,
        color: project.color,
        owner: project.owner,
        memberCount: project.members.length,
      })),
      members,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  listProjectTasks,
  listProjectRisks,
  listProjectWorkload,
  listProjectMessages,
  listProjectActivity,
  listTeamOverview,
};
