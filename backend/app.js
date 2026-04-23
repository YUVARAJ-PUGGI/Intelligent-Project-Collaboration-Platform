require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'pages')));
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/myday', require('./routes/myday'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'landing.html'));
});

app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'landing.html'));
});

app.get('/landing.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'landing.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html'));
});

module.exports = app;
