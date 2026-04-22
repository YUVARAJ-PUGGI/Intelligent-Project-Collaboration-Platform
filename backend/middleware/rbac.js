function restrictTo(...roles) {
  return (req, res, next) => {
    // Check if the user's role is in the array of allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
}

module.exports = { restrictTo };