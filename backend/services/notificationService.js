function unreadFilter(userId) {
  return { user: userId, isRead: false };
}

module.exports = {
  unreadFilter,
};
