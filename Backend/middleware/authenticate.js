const authenticate = (req, res, next) => {
    req.user = { username: "testuser", role: "admin" }; // Example user
    next();
  };
  
  const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Admins only" });
    }
    next();
  };
  
  module.exports = { authenticate, authorizeAdmin };
  