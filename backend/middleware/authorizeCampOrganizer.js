module.exports = (req, res, next) => {
  if (req.user?.role !== "camp_organizer") {
    return res.status(403).json({ message: "Camp organizer access required." });
  }

  return next();
};
