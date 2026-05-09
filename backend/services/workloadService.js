const Task = require('../models/Task');
const mongoose = require('mongoose');

/**
 * calculateWorkload(developerId)
 * Sums estimatedHours of tasks assigned to developer with status TODO or IN_PROGRESS
 * Returns a number (hours)
 */
async function calculateWorkload(developerId) {
  if (!developerId) return 0;

  const result = await Task.aggregate([
    {
      $match: {
        assignee: new mongoose.Types.ObjectId(developerId),
        status: { $in: ['todo', 'inprogress'] },
      },
    },
    {
      $group: {
        _id: null,
        totalHours: { $sum: { $ifNull: ['$estimatedHours', 0] } },
      },
    },
  ]);

  return (result[0] && result[0].totalHours) || 0;
}

module.exports = {
  calculateWorkload,
};
