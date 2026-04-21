require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Message = require('./models/Message');
const Activity = require('./models/Activity');
const Notification = require('./models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/synergysphere');
  console.log('🌱 Seeding database...');

  // Clear all
  await Promise.all([User.deleteMany(), Project.deleteMany(), Task.deleteMany(), Message.deleteMany(), Activity.deleteMany(), Notification.deleteMany()]);

  // Create users
  const [alice, bob, carol, dave, eve] = await User.create([
    { name: 'Alice Singh', email: 'alice@demo.com', password: 'password123', avatarColor: '#6366f1' },
    { name: 'Bob Kumar', email: 'bob@demo.com', password: 'password123', avatarColor: '#10b981' },
    { name: 'Carol Mehta', email: 'carol@demo.com', password: 'password123', avatarColor: '#f59e0b' },
    { name: 'Dave Sharma', email: 'dave@demo.com', password: 'password123', avatarColor: '#f43f5e' },
    { name: 'Eve Patel', email: 'eve@demo.com', password: 'password123', avatarColor: '#8b5cf6' },
  ]);

  // Create projects
  const p1 = await Project.create({
    name: 'E-Commerce Platform', description: 'Build a full-stack e-commerce app with cart, payments and admin panel.',
    owner: alice._id, color: '#6366f1',
    members: [
      { user: alice._id, role: 'owner' }, { user: bob._id, role: 'member' },
      { user: carol._id, role: 'member' }, { user: dave._id, role: 'member' },
    ]
  });

  const p2 = await Project.create({
    name: 'Marketing Campaign', description: 'Q2 digital marketing campaign for product launch across all channels.',
    owner: alice._id, color: '#10b981',
    members: [
      { user: alice._id, role: 'owner' }, { user: eve._id, role: 'member' }, { user: carol._id, role: 'member' }
    ]
  });

  const yesterday = new Date(Date.now() - 86400000);
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const in20h = new Date(Date.now() + 20 * 3600000);

  // Tasks for p1
  const tasks = await Task.create([
    { project: p1._id, title: 'Setup authentication system', description: 'JWT auth with refresh tokens', assignee: bob._id, status: 'done', priority: 'high', dueDate: twoDaysAgo, createdBy: alice._id },
    { project: p1._id, title: 'Design product listing page', description: 'Figma mockup + HTML/CSS implementation', assignee: carol._id, status: 'inprogress', priority: 'high', dueDate: yesterday, createdBy: alice._id },
    { project: p1._id, title: 'Integrate payment gateway', description: 'Razorpay integration with webhook callbacks', assignee: bob._id, status: 'inprogress', priority: 'high', dueDate: in20h, createdBy: alice._id },
    { project: p1._id, title: 'Setup MongoDB schemas', description: 'User, Product, Order, Cart schemas', assignee: dave._id, status: 'done', priority: 'medium', dueDate: twoDaysAgo, createdBy: alice._id },
    { project: p1._id, title: 'Build admin dashboard', description: 'Order management and analytics panel', assignee: dave._id, status: 'todo', priority: 'medium', dueDate: nextWeek, createdBy: alice._id },
    { project: p1._id, title: 'Write API documentation', description: 'Swagger docs for all endpoints', assignee: carol._id, status: 'todo', priority: 'low', dueDate: nextWeek, createdBy: alice._id },
    { project: p1._id, title: 'Performance optimization', description: 'Lazy loading, caching, image compression', assignee: bob._id, status: 'todo', priority: 'medium', dueDate: nextWeek, createdBy: alice._id },
    { project: p1._id, title: 'Mobile responsive CSS', description: 'Ensure 100% mobile compatibility', assignee: carol._id, status: 'inprogress', priority: 'high', dueDate: yesterday, createdBy: alice._id },
  ]);

  // Tasks for p2
  await Task.create([
    { project: p2._id, title: 'Social media strategy', description: 'Plan content calendar for Instagram, Twitter, LinkedIn', assignee: eve._id, status: 'done', priority: 'high', dueDate: twoDaysAgo, createdBy: alice._id },
    { project: p2._id, title: 'Email newsletter design', description: 'Create HTML email templates', assignee: carol._id, status: 'inprogress', priority: 'medium', dueDate: tomorrow, createdBy: alice._id },
    { project: p2._id, title: 'Google Ads campaign', description: 'Setup and launch PPC campaign', assignee: eve._id, status: 'todo', priority: 'high', dueDate: in20h, createdBy: alice._id },
    { project: p2._id, title: 'Analytics dashboard setup', description: 'Google Analytics + conversion tracking', assignee: alice._id, status: 'todo', priority: 'low', dueDate: nextWeek, createdBy: alice._id },
  ]);

  // Update stale task (set updatedAt to 3 days ago manually)
  await Task.updateOne({ title: 'Build admin dashboard' }, { $set: { updatedAt: new Date(Date.now() - 3 * 86400000) } });

  // Messages
  await Message.create([
    { project: p1._id, sender: alice._id, content: 'Team, please update your task status daily so we can track progress.' },
    { project: p1._id, sender: bob._id, content: 'Auth system is done! Moving to payment integration now.' },
    { project: p1._id, sender: carol._id, content: 'The product listing page design is almost done, need feedback from Alice.' },
    { project: p1._id, sender: dave._id, content: 'We need to add input validation to all API endpoints before launch.' },
    { project: p2._id, sender: alice._id, content: 'Let us finalize the campaign budget by Friday.' },
    { project: p2._id, sender: eve._id, content: 'Social media content is ready for review!' },
  ]);

  // Activity
  await Activity.create([
    { project: p1._id, user: alice._id, action: 'created project', entityType: 'project', entityId: p1._id, details: 'E-Commerce Platform' },
    { project: p1._id, user: bob._id, action: 'completed task', entityType: 'task', entityId: tasks[0]._id, details: 'Setup authentication system' },
    { project: p1._id, user: carol._id, action: 'moved task to inprogress', entityType: 'task', entityId: tasks[1]._id, details: 'Design product listing page' },
    { project: p1._id, user: alice._id, action: 'added member', entityType: 'member', entityId: dave._id, details: 'Dave Sharma' },
  ]);

  // Notifications
  await Notification.create([
    { user: bob._id, type: 'task_assigned', message: 'You were assigned: "Integrate payment gateway"', project: p1._id, task: tasks[2]._id },
    { user: carol._id, type: 'task_overdue', message: 'Task overdue: "Design product listing page"', project: p1._id, task: tasks[1]._id },
    { user: dave._id, type: 'member_added', message: 'You were added to project "E-Commerce Platform"', project: p1._id },
  ]);

  console.log('✅ Seed complete!');
  console.log('');
  console.log('🔑 Demo login credentials:');
  console.log('   alice@demo.com / password123');
  console.log('   bob@demo.com   / password123');
  console.log('   carol@demo.com / password123');
  await mongoose.disconnect();
}

seed().catch(console.error);
