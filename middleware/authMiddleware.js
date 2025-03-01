const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure _id is used, not id
    req.user = await User.findById(decoded.id || decoded._id).select(
      "-password"
    );

    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    next(); // Proceed to next middleware/controller
  } catch (error) {
    console.error("Auth Error:", error);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again." });
    } else if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token. Authentication failed." });
    }

    return res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = authMiddleware;
