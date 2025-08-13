const { withDb } = require("../config/db");

exports.logs = async (req, res, next) => {
  try {
    const rows = await withDb(conn => conn.query("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 500").then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.listAlerts = async (req, res, next) => {
  try {
    const rows = await withDb(conn => conn.query("SELECT * FROM alerts ORDER BY id DESC LIMIT 200").then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.logoutInactive = async (req, res, next) => {
  try {
    res.json({ message: "Inactive sessions would be logged out (stub)." });
  } catch (e) { next(e); }
};
