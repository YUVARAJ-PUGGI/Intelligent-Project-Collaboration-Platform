function buildConvertedTaskFromMessage(message, userId) {
  return {
    project: message.project,
    title: message.content.substring(0, 100),
    description: `Converted from discussion: "${message.content}"`,
    status: 'todo',
    priority: 'medium',
    createdBy: userId,
  };
}

module.exports = {
  buildConvertedTaskFromMessage,
};
