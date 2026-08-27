import express from "express";
import jwt from "jsonwebtoken";
import { encryptText, decryptText } from "../utils/encryption.js";
import { authenticate, requireAdmin, JWT_SECRET, JWT_EXPIRES_IN } from "../middleware/auth.js";

const router = express.Router();

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const { User } = req.app.locals.models;
    const user = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });

    if (!user || decryptText(user.password) !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ success: true, token, user: toPublicUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  res.json({ success: true });
});

// Rehydrate the logged-in user (role, name, email) on page load/refresh.
router.get("/me", authenticate, async (req, res) => {
  const { User } = req.app.locals.models;
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(401).json({ success: false, message: "User no longer exists" });
  }
  res.json({ success: true, user: toPublicUser(user) });
});

// Admin-only: list the two accounts (no password) so the admin can see who's who.
router.get("/users", authenticate, requireAdmin, async (req, res) => {
  const { User } = req.app.locals.models;
  const users = await User.findAll({ order: [["role", "ASC"]] });
  res.json({ success: true, data: users.map(toPublicUser) });
});

// Admin-only: reveal a user's current plaintext password, so the admin can
// hand it out to the team member (passwords are stored reversibly for this).
router.get("/users/:id/password", authenticate, requireAdmin, async (req, res) => {
  const { User } = req.app.locals.models;
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json({ success: true, password: decryptText(user.password) });
});

// Admin-only: set/rotate a user's password (e.g. handing the team member a
// fresh password after generating or choosing one).
router.put("/users/:id/password", authenticate, requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  const { User } = req.app.locals.models;
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await user.update({ password: encryptText(password) });
  res.json({ success: true, message: "Password updated successfully" });
});

export default router;
