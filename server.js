require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/myday', require('./routes/myday'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

async function start() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/synergysphere';

  // Try connecting to the configured URI first
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ MongoDB connected to:', uri);
  } catch (err) {
    // Fall back to in-memory MongoDB
    console.log('⚠️  Local MongoDB not found, starting in-memory server...');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✅ In-memory MongoDB started');

    // Auto-seed demo data when using in-memory DB
    await seedDemoData();
  }

  app.listen(PORT, () => {
    console.log(`🚀 SynergySphere → http://localhost:${PORT}`);
    console.log('');
    console.log('🔑 Demo logins:');
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

  console.log('🌱 Seeding demo data...');

  const [alice, bob, carol, dave, eve] = await User.create([
    { name: 'Alice Singh', email: 'alice@demo.com', password: 'password123', avatarColor: '#1a73e8' },
    { name: 'Bob Kumar', email: 'bob@demo.com', password: 'password123', avatarColor: '#1e8e3e' },
    { name: 'Carol Mehta', email: 'carol@demo.com', password: 'password123', avatarColor: '#e8710a' },
    { name: 'Dave Sharma', email: 'dave@demo.com', password: 'password123', avatarColor: '#d93025' },
    { name: 'Eve Patel', email: 'eve@demo.com', password: 'password123', avatarColor: '#9334e6' },
  ]);

  const p1 = await Project.create({
    name: 'E-Commerce Platform', description: 'Full-stack e-commerce app with cart, payments and admin panel.',
    owner: alice._id, color: '#1a73e8',
    members: [
      { user: alice._id, role: 'owner' }, { user: bob._id, role: 'member' },
      { user: carol._id, role: 'member' }, { user: dave._id, role: 'member' },
    ]
  });
  const p2 = await Project.create({
    name: 'Marketing Campaign', description: 'Q2 digital marketing campaign for product launch.',
    owner: alice._id, color: '#1e8e3e',
    members: [
      { user: alice._id, role: 'owner' }, { user: eve._id, role: 'member' }, { user: carol._id, role: 'member' }
    ]
  });

  const now = new Date();
  const today = new Date(now); today.setHours(18,0,0,0);
  const yesterday = new Date(Date.now() - 86400000);
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const in20h = new Date(Date.now() + 20 * 3600000);

  const tasks = await Task.create([
    { project: p1._id, title: 'Setup authentication system', description: 'JWT auth with refresh tokens', assignee: bob._id, status: 'done', priority: 'high', dueDate: twoDaysAgo, tags: ['backend', 'security'], createdBy: alice._id },
    { project: p1._id, title: 'Design product listing page', description: 'Figma mockup + HTML/CSS implementation', assignee: carol._id, status: 'inprogress', priority: 'high', dueDate: yesterday, tags: ['frontend', 'UI'], createdBy: alice._id },
    { project: p1._id, title: 'Integrate payment gateway', description: 'Razorpay integration with webhook callbacks', assignee: bob._id, status: 'inprogress', priority: 'high', dueDate: in20h, tags: ['backend', 'payments'], createdBy: alice._id },
    { project: p1._id, title: 'Setup MongoDB schemas', description: 'User, Product, Order, Cart schemas', assignee: dave._id, status: 'done', priority: 'medium', dueDate: twoDaysAgo, tags: ['backend', 'database'], createdBy: alice._id },
    { project: p1._id, title: 'Build admin dashboard', description: 'Order management and analytics panel', assignee: dave._id, status: 'todo', priority: 'medium', dueDate: nextWeek, tags: ['frontend', 'admin'], createdBy: alice._id },
    { project: p1._id, title: 'Write API documentation', description: 'Swagger docs for all endpoints', assignee: alice._id, status: 'todo', priority: 'low', dueDate: today, tags: ['docs'], createdBy: alice._id },
    { project: p1._id, title: 'Performance optimization', description: 'Lazy loading, caching, image compression', assignee: alice._id, status: 'inprogress', priority: 'medium', dueDate: tomorrow, tags: ['performance', 'frontend'], createdBy: alice._id },
    { project: p1._id, title: 'Mobile responsive CSS', description: 'Ensure 100% mobile compatibility', assignee: carol._id, status: 'inprogress', priority: 'high', dueDate: yesterday, tags: ['frontend', 'mobile'], createdBy: alice._id },
  ]);

  await Task.create([
    { project: p2._id, title: 'Social media strategy', description: 'Plan content calendar for all platforms', assignee: eve._id, status: 'done', priority: 'high', dueDate: twoDaysAgo, tags: ['social', 'strategy'], createdBy: alice._id },
    { project: p2._id, title: 'Email newsletter design', description: 'Create HTML email templates', assignee: carol._id, status: 'inprogress', priority: 'medium', dueDate: tomorrow, tags: ['email', 'design'], createdBy: alice._id },
    { project: p2._id, title: 'Google Ads campaign', description: 'Setup and launch PPC campaign', assignee: eve._id, status: 'todo', priority: 'high', dueDate: in20h, tags: ['ads', 'PPC'], createdBy: alice._id },
    { project: p2._id, title: 'Analytics dashboard setup', description: 'Google Analytics + conversion tracking', assignee: alice._id, status: 'todo', priority: 'low', dueDate: nextWeek, tags: ['analytics'], createdBy: alice._id },
  ]);

  // Make one task stale
  await Task.updateOne({ title: 'Build admin dashboard' }, { $set: { updatedAt: new Date(Date.now() - 3 * 86400000) } });

  await Message.create([
    { project: p1._id, sender: alice._id, content: 'Team, please update your task status daily so we can track progress.' },
    { project: p1._id, sender: bob._id, content: 'Auth system is done! Moving to payment integration now.' },
    { project: p1._id, sender: carol._id, content: 'The product listing page design is almost done, need feedback from Alice.' },
    { project: p1._id, sender: dave._id, content: 'We need to add input validation to all API endpoints before launch.' },
    { project: p2._id, sender: alice._id, content: 'Let us finalize the campaign budget by Friday.' },
    { project: p2._id, sender: eve._id, content: 'Social media content is ready for review!' },
  ]);

  await Activity.create([
    { project: p1._id, user: alice._id, action: 'created project', entityType: 'project', entityId: p1._id, details: 'E-Commerce Platform' },
    { project: p1._id, user: bob._id, action: 'completed task', entityType: 'task', entityId: tasks[0]._id, details: 'Setup authentication system' },
    { project: p1._id, user: carol._id, action: 'moved task to inprogress', entityType: 'task', entityId: tasks[1]._id, details: 'Design product listing page' },
    { project: p1._id, user: alice._id, action: 'added member', entityType: 'member', entityId: dave._id, details: 'Dave Sharma' },
  ]);

  await Notification.create([
    { user: bob._id, type: 'task_assigned', message: 'You were assigned: "Integrate payment gateway"', project: p1._id, task: tasks[2]._id },
    { user: carol._id, type: 'task_overdue', message: 'Task overdue: "Design product listing page"', project: p1._id, task: tasks[1]._id },
    { user: dave._id, type: 'member_added', message: 'You were added to project "E-Commerce Platform"', project: p1._id },
  ]);

  console.log('✅ Demo data seeded!');
}

start().catch(err => { console.error('❌ Startup error:', err.message); process.exit(1); });
