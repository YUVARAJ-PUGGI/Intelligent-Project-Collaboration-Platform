function normalizeStatus(value) {
  if (!value) return 'todo';
  const normalized = String(value).trim().toLowerCase().replace('-', '').replace(/\s+/g, '');
  if (normalized === 'inprogress') return 'inprogress';
  if (normalized === 'done') return 'done';
  return 'todo';
}

function normalizePriority(value) {
  if (!value) return 'medium';
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'low' || normalized === 'high') return normalized;
  return 'medium';
}

function buildTaskPayload(body, userId) {
  const { project, title, description, assignee, priority, dueDate, status } = body;
  return {
    project,
    title,
    description,
    assignee: assignee || null,
    priority: normalizePriority(priority),
    dueDate: dueDate || null,
    status: normalizeStatus(status),
    createdBy: userId,
  };
}

function getTaskUpdateAction(previousStatus, nextStatus) {
  if (nextStatus && nextStatus !== previousStatus) {
    return `moved task to ${nextStatus}`;
  }
  return 'updated task';
}

function shouldNotifyAssignee(nextAssignee, previousAssignee, currentUserId) {
  return Boolean(nextAssignee && nextAssignee !== previousAssignee && nextAssignee !== currentUserId);
}

module.exports = {
  buildTaskPayload,
  getTaskUpdateAction,
  shouldNotifyAssignee,
  normalizeStatus,
  normalizePriority,
};
