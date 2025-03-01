const express = require("express");

const Expense = require("../models/Expense");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { amount, category, date, notes } = req.body;
    if (!amount || !category || !date) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields" });
    }
    const newExpense = new Expense({
      user: req.user._id,
      amount,
      category,
      date,
      notes,
    });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { category } = req.query;

    let filter = { user: req.user._id };

    if (category) {
      filter.category = { $regex: new RegExp(category, "i") }; // Case-insensitive filtering
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { amount, category, date, notes } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    expense.amount = amount || expense.amount;
    expense.category = category || expense.category;
    expense.date = date || expense.date;
    expense.notes = notes || expense.notes;
    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    await expense.deleteOne();
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

module.exports = router;
