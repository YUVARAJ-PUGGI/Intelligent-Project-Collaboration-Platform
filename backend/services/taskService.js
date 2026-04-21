function buildTaskPayload(body, userId) {
  const { project, title, description, assignee, priority, dueDate, status } = body;
  return {
    project,
    title,
    description,
    assignee: assignee || null,
    priority,
    dueDate: dueDate || null,
    status: status || 'todo',
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
};
