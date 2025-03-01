const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(201).json({
      message: "User registered successfully!!!",
      user: newUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res
      .status(200)
      .json({ message: "user logged in successfully!!!", user, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
