const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Підключення до MongoDB (можете вставити свій рядок або локальний uri)
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://karynayevtieieva_db_user:WLA55yOb5eSsfmJG@work-tracker-claster.8ywh7mn.mongodb.net/?appName=Work-tracker-claster";

mongoose
  .connect(MONGO_URI, {
    family: 4,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Схема користувача в базі даних
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rate: { type: Number, default: 0 },
  logs: [
    {
      date: String,
      h: Number,
    },
  ],
});

const User = mongoose.model("User", userSchema);

// Реєстрація
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      logs: [],
      rate: 0,
    });
    await newUser.save();
    res.json({ success: true, message: "Реєстрація успішна!" });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Користувач вже існує або сталася помилка.",
    });
  }
});

// Логін
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ success: false, message: "Невірний логін або пароль." });
    }
    res.json({
      success: true,
      user: { username: user.username, rate: user.rate, logs: user.logs },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Помилка сервера." });
  }
});

// Оновлення даних (ставки, годин, логів)
app.post("/api/update", async (req, res) => {
  try {
    const { username, rate, logs } = req.body;
    const user = await User.findOneAndUpdate(
      { username },
      { rate, logs },
      { new: true }
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Користувача не знайдено." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Помилка збереження." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
