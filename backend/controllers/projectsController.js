const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Message = require('../models/Message');
const { Developer, findIdentityByEmail } = require('../services/identityService');
const { calculateProjectStats, riskWindow, isExistingMember } = require('../services/projectService');

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

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
      .populate('members.user', 'name email avatarColor title role')
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
      .populate('members.user', 'name email avatarColor title role');

    return res.status(201).json(populatedProject);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getProject(req, res) {
  try {
    const project = await Project.findOne(projectMemberQuery(req.params.id, req.user._id))
      .populate('owner', 'name email avatarColor title')
      .populate('members.user', 'name email avatarColor title bio role');

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
      .populate('members.user', 'name email avatarColor title role');

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
    const user = await findIdentityByEmail(req.body.email.toLowerCase());
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
      .populate('members.user', 'name email avatarColor title role');

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
      .populate('members.user', 'name email avatarColor title role');

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

function buildHealthLevel(score) {
  if (score >= 70) return 'red';
  if (score >= 40) return 'yellow';
  return 'green';
}

async function getProjectHealthScore(req, res) {
  try {
    const project = await requireProjectMember(req.params.id, req.user._id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { now, in24h, twoDaysAgo } = riskWindow();
    const [total, done, overdue, dueSoon, stale] = await Promise.all([
      Task.countDocuments({ project: req.params.id }),
      Task.countDocuments({ project: req.params.id, status: 'done' }),
      Task.countDocuments({ project: req.params.id, status: { $ne: 'done' }, dueDate: { $lt: now, $ne: null } }),
      Task.countDocuments({ project: req.params.id, status: { $ne: 'done' }, dueDate: { $gte: now, $lte: in24h } }),
      Task.countDocuments({ project: req.params.id, status: 'inprogress', updatedAt: { $lt: twoDaysAgo } }),
    ]);

    const open = Math.max(total - done, 0);
    const progressRatio = total ? done / total : 0;
    const riskRaw = (overdue * 25) + (stale * 30) + (dueSoon * 10) + (open * 3);
    const score = Math.min(100, Math.max(0, Math.round((progressRatio * 30) + Math.min(70, riskRaw / 2))));
    const level = buildHealthLevel(score);

    const reasons = [];
    if (overdue > 0) reasons.push(`${overdue} overdue task(s)`);
    if (stale > 0) reasons.push(`${stale} stale in-progress task(s)`);
    if (dueSoon > 0) reasons.push(`${dueSoon} task(s) due in 24h`);
    if (!reasons.length) reasons.push('Flow is healthy with no immediate blockers.');

    const bottlenecks = await Task.find({
      project: req.params.id,
      $or: [
        { status: { $ne: 'done' }, dueDate: { $lt: now, $ne: null } },
        { status: 'inprogress', updatedAt: { $lt: twoDaysAgo } },
      ],
    })
      .populate('assignee', 'name avatarColor title')
      .sort({ dueDate: 1, updatedAt: 1 })
      .limit(10);

    return res.json({
      level,
      score,
      reasons,
      metrics: { total, done, open, overdue, dueSoon, stale },
      bottlenecks,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

function priorityWeight(priority) {
  if (priority === 'high') return 30;
  if (priority === 'low') return 10;
  return 20;
}

async function checkAssignmentRisk(req, res) {
  try {
    const project = await Project.findOne(projectMemberQuery(req.params.id, req.user._id))
      .populate('members.user', 'name role avatarColor title');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { assigneeId, dueDate, priority = 'medium' } = req.body;
    if (!assigneeId) {
      return res.status(400).json({ message: 'assigneeId is required' });
    }

    const developerMembers = project.members
      .filter((member) => member.user && member.user.role === 'developer');
    const assigneeMember = developerMembers.find((member) => member.user._id.toString() === assigneeId.toString());

    if (!assigneeMember) {
      return res.status(400).json({ message: 'Assignee is not a member of this project' });
    }

    const now = new Date();
    const in12h = new Date(now.getTime() + (12 * 60 * 60 * 1000));
    const dueAt = dueDate ? new Date(dueDate) : null;

    const developerIds = developerMembers.map((member) => member.user._id);
    const developerTasks = await Task.find({
      assignee: { $in: developerIds },
      status: { $ne: 'done' },
    }).select('assignee priority dueDate');

    const loadByDeveloper = new Map();
    developerIds.forEach((developerId) => {
      loadByDeveloper.set(developerId.toString(), {
        activeTasks: 0,
        urgentTasks: 0,
        highPriorityDueSoon: 0,
      });
    });

    for (const task of developerTasks) {
      const key = task.assignee.toString();
      const load = loadByDeveloper.get(key);
      if (!load) continue;

      load.activeTasks += 1;
      const isDueSoon = task.dueDate && new Date(task.dueDate) <= in12h;
      if (isDueSoon) {
        load.urgentTasks += 1;
        if (task.priority === 'high') {
          load.highPriorityDueSoon += 1;
        }
      }
    }

    const assigneeLoad = loadByDeveloper.get(assigneeId.toString()) || {
      activeTasks: 0,
      urgentTasks: 0,
      highPriorityDueSoon: 0,
    };

    const dueSoonPenalty = dueAt && dueAt <= in12h ? 20 : 0;
    const projectedScore = Math.min(
      100,
      (assigneeLoad.activeTasks * 14)
      + (assigneeLoad.urgentTasks * 16)
      + (assigneeLoad.highPriorityDueSoon * 18)
      + priorityWeight(priority)
      + dueSoonPenalty
    );

    const isOverloaded = projectedScore >= 70 || assigneeLoad.activeTasks >= 4 || assigneeLoad.highPriorityDueSoon >= 3;
    const suggestedExtensionHours = isOverloaded ? Math.max(2, Math.ceil((projectedScore - 55) / 10) * 2) : 0;

    let recommendation = 'Assignment looks healthy for this member.';

    let alternative = null;
    if (developerMembers.length > 1) {
      const alternatives = developerMembers
        .filter((member) => member.user._id.toString() !== assigneeId.toString())
        .map((member) => {
          const load = loadByDeveloper.get(member.user._id.toString()) || {
            activeTasks: 0,
            urgentTasks: 0,
            highPriorityDueSoon: 0,
          };
          return { member, load };
        })
        .sort((a, b) => {
          if (a.load.activeTasks !== b.load.activeTasks) {
            return a.load.activeTasks - b.load.activeTasks;
          }
          if (a.load.urgentTasks !== b.load.urgentTasks) {
            return a.load.urgentTasks - b.load.urgentTasks;
          }
          return a.load.highPriorityDueSoon - b.load.highPriorityDueSoon;
        });

      if (alternatives.length) {
        alternative = alternatives[0];
      }
    }

    if (isOverloaded) {
      const baseWarning = `Warning: ${assigneeLoad.highPriorityDueSoon} high-priority task(s) and ${assigneeLoad.urgentTasks} total task(s) are due in the next 12 hours for this developer.`;
      if (alternative && alternative.load.activeTasks === 0) {
        recommendation = `${baseWarning} Suggest a ${suggestedExtensionHours}h extension or reassigning to ${alternative.member.user.name}, who is currently free.`;
      } else if (alternative) {
        recommendation = `${baseWarning} Suggest a ${suggestedExtensionHours}h extension or reassigning to ${alternative.member.user.name} (${alternative.load.activeTasks} active tasks).`;
      } else {
        recommendation = `${baseWarning} Suggest a ${suggestedExtensionHours}h extension to avoid a delivery bottleneck.`;
      }
    }

    return res.json({
      assigneeId,
      isOverloaded,
      score: projectedScore,
      suggestion: recommendation,
      suggestedExtensionHours,
      metrics: {
        activeTasks: assigneeLoad.activeTasks,
        urgentTasks: assigneeLoad.urgentTasks,
        highPriorityDueSoon: assigneeLoad.highPriorityDueSoon,
      },
      alternative: alternative
        ? {
            userId: alternative.member.user._id,
            name: alternative.member.user.name,
            activeTasks: alternative.load.activeTasks,
            urgentTasks: alternative.load.urgentTasks,
          }
        : null,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listProjectWorkload(req, res) {
  try {
    const project = await Project.findOne(projectMemberQuery(req.params.id, req.user._id))
      .populate('members.user', 'name email avatarColor title role');

    if (!project) {
      return res.status(404).json({ message: 'Not found' });
    }

    const developerMembers = project.members.filter((member) => member.user && member.user.role === 'developer');
    const now = new Date();
    const in12h = new Date(now.getTime() + (12 * 60 * 60 * 1000));

    const workload = await Promise.all(developerMembers.map(async (member) => {
      const [active, done, total, urgent12h] = await Promise.all([
        Task.countDocuments({ assignee: member.user._id, status: { $ne: 'done' } }),
        Task.countDocuments({ assignee: member.user._id, status: 'done' }),
        Task.countDocuments({ assignee: member.user._id }),
        Task.countDocuments({
          assignee: member.user._id,
          status: { $ne: 'done' },
          dueDate: { $gte: now, $lte: in12h },
        }),
      ]);

      return {
        user: member.user,
        role: member.role,
        active,
        done,
        total,
        urgent12h,
        availability: active === 0 ? 'free' : active <= 2 ? 'light' : active <= 4 ? 'busy' : 'overloaded',
        isOverloaded: active >= 4 || urgent12h >= 3,
      };
    }));

    return res.json(workload);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listAvailableDevelopers(req, res) {
  try {
    const project = await Project.findOne(projectMemberQuery(req.params.id, req.user._id))
      .populate('members.user', 'name email avatarColor title role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const developers = await Developer.find({})
      .select('name email avatarColor title role')
      .sort('name');

    const memberEmails = new Set(
      (project.members || [])
        .map((member) => normalizeEmail(member.user?.email))
        .filter(Boolean)
    );

    const result = developers.map((developer) => ({
      user: developer,
      isMember: memberEmails.has(normalizeEmail(developer.email)),
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listManagerTaskMonitor(req, res) {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .select('_id name color')
      .sort('-updatedAt');

    const projectIds = projects.map((project) => project._id);
    if (!projectIds.length) {
      return res.json({ tasks: [], summary: { total: 0, done: 0, active: 0, overdue: 0, stale: 0 } });
    }

    const now = new Date();
    const staleCutoff = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
    const dueSoonCutoff = new Date(now.getTime() + (24 * 60 * 60 * 1000));

    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name color')
      .populate('assignee', 'name avatarColor title role')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1, dueDate: 1 });

    const monitorTasks = tasks.map((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const overdue = Boolean(dueDate && task.status !== 'done' && dueDate < now);
      const dueSoon = Boolean(dueDate && task.status !== 'done' && dueDate >= now && dueDate <= dueSoonCutoff);
      const stale = Boolean(task.status === 'inprogress' && task.updatedAt < staleCutoff);

      return {
        _id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        updatedAt: task.updatedAt,
        project: task.project,
        assignee: task.assignee,
        overdue,
        dueSoon,
        stale,
        position: overdue ? 'overdue' : stale ? 'stale' : task.status === 'done' ? 'done' : task.status,
      };
    });

    const summary = monitorTasks.reduce((accumulator, task) => {
      accumulator.total += 1;
      if (task.status === 'done') accumulator.done += 1;
      else accumulator.active += 1;
      if (task.overdue) accumulator.overdue += 1;
      if (task.stale) accumulator.stale += 1;
      return accumulator;
    }, { total: 0, done: 0, active: 0, overdue: 0, stale: 0 });

    return res.json({ tasks: monitorTasks, summary });
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
  listAvailableDevelopers,
  listManagerTaskMonitor,
  listProjectMessages,
  listProjectActivity,
  listTeamOverview,
  getProjectHealthScore,
  checkAssignmentRisk,
};
