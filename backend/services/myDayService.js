function getMyDayRange(now = new Date()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return { todayStart, todayEnd, in3Days };
}

module.exports = {
  getMyDayRange,
};
