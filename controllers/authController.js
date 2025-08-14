const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { withDb } = require("../config/db");
const uuid = require("uuid");

function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, store_id: user.store_id },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
};

exports.verifyToken = (req, res, next) => {
  try {
    if(req.user !== null) {
      console.log(req.user)
      return res.status(200).json({ isLogin: true, user: req.user });
    }
    return res.status(401).json({ isLogin: false, user: {} });
  } catch (e) { next(e); }
};

exports.loginCustomer = async (req, res, next) => {
  try {
    const { name, pin } = req.body;
    const rows = await withDb(conn => conn.query("SELECT * FROM customers WHERE name = ?", [name]).then(([r]) => r));
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(pin, user.pin_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ token: sign(user), user: { id: user.id, name: user.name, role: "CUSTOMER" } });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const rows = await withDb(conn => conn.query("SELECT * FROM staff WHERE username = ?", [username]).then(([r]) => r));
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ token: sign(user), user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) { next(e); }
};

exports.logout = async (req, res) => {
  res.json({ message: "Logged out" });
};

exports.registerCustomer = async (req, res, next) => {
  try {
    const { name, phone, pin, email } = req.body;
    const pin_hash = await bcrypt.hash(pin, 10);
    const user_id = uuid.v4();
    await withDb(conn => conn.query(
      "INSERT INTO customers (id, name, pin_hash, phone, email) VALUES (?, ?, ?, ?, ?)",
      [user_id, name, pin_hash, phone, email]
    ));
    await withDb(conn => conn.query(
      "INSERT INTO accounts (customer_id) VALUES (?)",
      [user_id]
    ));
    res.json({ message: "User registered" });
  } catch (e) { next(e); }
};

exports.register = async (req, res, next) => {
  try {
    const { username, password, role, store_id } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await withDb(conn => conn.query(
      "INSERT INTO staff (username, password_hash, role, store_id, active) VALUES (?, ?, ?, ?, 1)",
      [username, hash, role || "ADMIN", store_id || null]
    ));
    res.json({ message: "Staff registered" });
  } catch (e) { next(e); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const rows = await withDb(conn => conn.query("SELECT * FROM staff WHERE id = ?", [userId]).then(([r]) => r));
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) return res.status(400).json({ message: "Old password incorrect" });
    const hash = await bcrypt.hash(newPassword, 10);
    await withDb(conn => conn.query("UPDATE staff SET password_hash = ? WHERE id = ?", [hash, userId]));
    res.json({ message: "Password changed" });
  } catch (e) { next(e); }
};
