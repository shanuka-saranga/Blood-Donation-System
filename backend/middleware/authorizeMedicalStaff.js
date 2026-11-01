module.exports = (req, res, next) => {
  if (req.user?.role !== "medical_staff") {
    return res.status(403).json({ message: "Medical staff access required." });
  }

  return next();
};
