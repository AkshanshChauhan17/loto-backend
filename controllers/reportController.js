const { withDb } = require("../config/db");

exports.salesReport = async (req, res, next) => {
  try {
    const { from, to, cashier } = req.query;
    const rows = await withDb(conn => conn.query(
      `SELECT t.id, t.serial, t.total_amount, t.purchase_time, s.username as cashier
       FROM tickets t LEFT JOIN staff s ON s.id = t.staff_id
       WHERE t.purchase_time BETWEEN ? AND ?
       ${cashier ? "AND t.staff_id = ?" : ""}
       ORDER BY t.purchase_time DESC`,
      cashier ? [from, to, cashier] : [from, to]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.topupReport = async (req, res, next) => {
  try {
    const { from, to, cashier } = req.query;
    const rows = await withDb(conn => conn.query(
      `SELECT id, customer_id, amount, method, staff_id, created_at
       FROM topups WHERE created_at BETWEEN ? AND ?
       ${cashier ? "AND staff_id = ?" : ""}
       ORDER BY created_at DESC`,
      cashier ? [from, to, cashier] : [from, to]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.activityReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const rows = await withDb(conn => conn.query(
      "SELECT * FROM activity_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC",
      [from, to]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.exportClosingSummary = async (req, res, next) => {
  try {
    res.json({ url: null, message: "Generate PDF (stub) — integrate pdfkit later" });
  } catch (e) { next(e); }
};

exports.exportToTelegram = async (req, res, next) => {
  try {
    res.json({ message: "Telegram export (stub) — integrate Telegram Bot API later" });
  } catch (e) { next(e); }
};
