const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');

const PORT = process.env.PORT || 5000;

async function start() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/synergysphere';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('[ok] MongoDB connected to:', uri);
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

  const [alice, bob, carol, dave, eve] = await User.create([
    { name: 'Alice Singh', email: 'alice@demo.com', password: 'password123', avatarColor: '#1a73e8', title: 'Product Lead', bio: 'Coordinates scope, priorities, and the final demo flow.' },
    { name: 'Bob Kumar', email: 'bob@demo.com', password: 'password123', avatarColor: '#1e8e3e', title: 'Frontend Engineer', bio: 'Owns interaction polish, auth UX, and reusable UI patterns.' },
    { name: 'Carol Mehta', email: 'carol@demo.com', password: 'password123', avatarColor: '#e8710a', title: 'Project Analyst', bio: 'Tracks delivery health, metrics, and dashboard visibility.' },
    { name: 'Dave Sharma', email: 'dave@demo.com', password: 'password123', avatarColor: '#d93025', title: 'Collaboration Engineer', bio: 'Builds messaging flows, team coordination, and project workspace tools.' },
    { name: 'Eve Patel', email: 'eve@demo.com', password: 'password123', avatarColor: '#9334e6', title: 'QA Support', bio: 'Tests flows, verifies fixes, and keeps the release stable.' },
  ]);

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
    { project: project._id, sender: alice._id, content: 'Please update your tasks before the demo review.' },
    { project: project._id, sender: bob._id, content: 'Login flow is ready for testing.' },
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

start().catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
