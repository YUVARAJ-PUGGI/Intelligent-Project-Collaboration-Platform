const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const app = require('./app');

const PORT = process.env.PORT || 5000;

async function start() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/synergysphere';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('[ok] MongoDB connected to:', uri);
    await ensureDemoAccounts();
    await normalizeDatabaseState();
  } catch (err) {
    console.log('[warn] Local MongoDB not found, starting in-memory server...');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('[ok] In-memory MongoDB started');
    await seedDemoData();
  }

  app.listen(PORT, () => {
    console.log(`SynergySphere -> http://localhost:${PORT}`);
    console.log('');
    console.log('Demo logins:');
    console.log('   alice@demo.com / password123');
    console.log('   bob@demo.com   / password123');
    console.log('   carol@demo.com / password123');
  });
}

async function seedDemoData() {
  const User = require('./models/User');
  const Project = require('./models/Project');
  const Task = require('./models/Task');
  const Message = require('./models/Message');
  const Activity = require('./models/Activity');
  const Notification = require('./models/Notification');

  console.log('Seeding demo data...');
  await ensureDemoAccounts();

  const [alice, bob, carol, dave, eve] = await Promise.all([
    User.findOne({ email: 'alice@demo.com' }),
    User.findOne({ email: 'bob@demo.com' }),
    User.findOne({ email: 'carol@demo.com' }),
    User.findOne({ email: 'dave@demo.com' }),
    User.findOne({ email: 'eve@demo.com' }),
  ]);

  if (!alice || !bob || !carol || !dave || !eve) {
    throw new Error('Failed to prepare demo identities before seeding data');
  }

  const project = await Project.create({
    name: 'Hackathon Collaboration Hub',
    description: 'Team workspace for student hackathon execution.',
    owner: alice._id,
    color: '#1a73e8',
    members: [
      { user: alice._id, role: 'owner' },
      { user: bob._id, role: 'member' },
      { user: carol._id, role: 'member' },
      { user: dave._id, role: 'member' },
    ]
  });

  const tasks = await Task.create([
    { project: project._id, title: 'Setup auth and login flow', description: 'JWT login and signup screens', assignee: bob._id, status: 'done', priority: 'high', dueDate: new Date(Date.now() - 86400000), tags: ['frontend', 'auth'], createdBy: alice._id },
    { project: project._id, title: 'Build project dashboard', description: 'Show progress and notifications', assignee: carol._id, status: 'inprogress', priority: 'high', dueDate: new Date(Date.now() + 20 * 3600000), tags: ['dashboard'], createdBy: alice._id },
    { project: project._id, title: 'Add threaded discussion', description: 'Project chat area for decisions', assignee: dave._id, status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 86400000), tags: ['chat'], createdBy: alice._id },
  ]);

  await Message.create([
    { project: project._id, task: tasks[1]._id, sender: alice._id, content: 'Please update your progress notes before the demo review.' },
    { project: project._id, task: tasks[0]._id, sender: bob._id, content: 'Login flow is ready for testing.' },
  ]);

  await Activity.create([
    { project: project._id, user: alice._id, action: 'created project', entityType: 'project', entityId: project._id, details: project.name },
    { project: project._id, user: bob._id, action: 'completed task', entityType: 'task', entityId: tasks[0]._id, details: 'Setup auth and login flow' },
  ]);

  await Notification.create([
    { user: bob._id, type: 'task_assigned', message: 'You were assigned: "Setup auth and login flow"', project: project._id, task: tasks[0]._id },
    { user: carol._id, type: 'task_due', message: 'Task due soon: "Build project dashboard"', project: project._id, task: tasks[1]._id },
  ]);

  console.log('Demo data seeded.');
}

async function ensureDemoAccounts() {
  const { findIdentityByEmail, createIdentity, updateIdentity, migrateLegacyUser } = require('./services/identityService');

  const demoUsers = [
    {
      name: 'Alice Singh',
      email: 'alice@demo.com',
      password: 'password123',
      role: 'manager',
      avatarColor: '#1a73e8',
      title: 'Product Lead',
      bio: 'Coordinates scope, priorities, and the final demo flow.',
    },
    {
      name: 'Bob Kumar',
      email: 'bob@demo.com',
      password: 'password123',
      avatarColor: '#1e8e3e',
      title: 'Frontend Engineer',
      bio: 'Owns interaction polish, auth UX, and reusable UI patterns.',
    },
    {
      name: 'Carol Mehta',
      email: 'carol@demo.com',
      password: 'password123',
      avatarColor: '#e8710a',
      title: 'Project Analyst',
      bio: 'Tracks delivery health, metrics, and dashboard visibility.',
    },
    {
      name: 'Dave Sharma',
      email: 'dave@demo.com',
      password: 'password123',
      avatarColor: '#d93025',
      title: 'Collaboration Engineer',
      bio: 'Builds messaging flows, team coordination, and project workspace tools.',
    },
    {
      name: 'Eve Patel',
      email: 'eve@demo.com',
      password: 'password123',
      avatarColor: '#9334e6',
      title: 'QA Support',
      bio: 'Tests flows, verifies fixes, and keeps the release stable.',
    },
  ];

  for (const demoUser of demoUsers) {
    let existingUser = await findIdentityByEmail(demoUser.email);

    if (!existingUser) {
      const LegacyUser = require('./models/User');
      const legacy = await LegacyUser.findOne({ email: demoUser.email.toLowerCase() });
      if (legacy) {
        existingUser = await migrateLegacyUser(legacy);
      }
    }

    if (!existingUser) {
      await createIdentity(demoUser);
      continue;
    }

    await updateIdentity(existingUser, {
      name: demoUser.name,
      role: demoUser.role,
      avatarColor: demoUser.avatarColor,
      title: demoUser.title,
      bio: demoUser.bio,
      password: demoUser.password,
    });
  }
}

async function normalizeDatabaseState() {
  const Project = require('./models/Project');
  const Task = require('./models/Task');
  const Message = require('./models/Message');
  const User = require('./models/User');
  const { migrateLegacyUser } = require('./services/identityService');

  const statusMap = {
    'To-Do': 'todo',
    'In Progress': 'inprogress',
    'Done': 'done',
    todo: 'todo',
    inprogress: 'inprogress',
    done: 'done',
  };

  const priorityMap = {
    Low: 'low',
    Medium: 'medium',
    High: 'high',
    low: 'low',
    medium: 'medium',
    high: 'high',
  };

  const projects = await Project.find({});

  const users = await User.find({});
  for (const user of users) {
    let userChanged = false;

    if (user.email === 'alice@demo.com' && user.role !== 'manager') {
      user.role = 'manager';
      userChanged = true;
    }

    if (user.email === 'alice@demo.com' || user.email.endsWith('@demo.com')) {
      if (user.password && !String(user.password).startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, 12);
        userChanged = true;
      }
    }

    if (userChanged) {
      await user.save();
    }

    await migrateLegacyUser(user);
  }

  for (const project of projects) {
    let projectChanged = false;

    if (!project.color) {
      project.color = '#5b57f5';
      projectChanged = true;
    }

    if (Array.isArray(project.members) && project.members.length && !project.members[0].user) {
      project.members = project.members.map((memberId) => ({
        user: memberId,
        role: memberId.toString() === project.owner.toString() ? 'owner' : 'member',
      }));
      projectChanged = true;
    } else {
      project.members = project.members.map((member) => {
        if (member?.user && !member.role) {
          projectChanged = true;
          return { user: member.user, role: 'member' };
        }
        return member;
      });
    }

    if (projectChanged) {
      await project.save();
    }

    const tasks = await Task.find({ project: project._id });
    let fallbackDiscussionTask = tasks[0] || null;

    for (const task of tasks) {
      let taskChanged = false;

      if (!task.createdBy) {
        task.createdBy = project.owner;
        taskChanged = true;
      }

      if (statusMap[task.status] && statusMap[task.status] !== task.status) {
        task.status = statusMap[task.status];
        taskChanged = true;
      }

      if (priorityMap[task.priority] && priorityMap[task.priority] !== task.priority) {
        task.priority = priorityMap[task.priority];
        taskChanged = true;
      }

      if (!Array.isArray(task.tags)) {
        task.tags = [];
        taskChanged = true;
      }

      if (taskChanged) {
        await task.save();
      }
    }

    const messages = await Message.find({ project: project._id });
    if (!fallbackDiscussionTask && messages.length) {
      fallbackDiscussionTask = await Task.create({
        project: project._id,
        title: 'General project discussion',
        description: 'Auto-created task for legacy project chat messages.',
        assignee: null,
        createdBy: project.owner,
        status: 'todo',
        priority: 'low',
        tags: ['discussion'],
      });
    }

    for (const message of messages) {
      let messageChanged = false;

      if (!message.task && fallbackDiscussionTask) {
        message.task = fallbackDiscussionTask._id;
        messageChanged = true;
      }

      if (!message.project) {
        message.project = project._id;
        messageChanged = true;
      }

      if (messageChanged) {
        await message.save();
      }
    }
  }
}

start().catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
