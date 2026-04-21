function calculateProjectStats(total, done, overdue) {
  return {
    total,
    done,
    overdue,
    pct: total ? Math.round((done / total) * 100) : 0,
  };
}

function riskWindow() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  return { now, in24h, twoDaysAgo };
}

function isExistingMember(project, userId) {
  return project.members.some((member) => member.user.toString() === userId.toString());
}

module.exports = {
  calculateProjectStats,
  riskWindow,
  isExistingMember,
};
