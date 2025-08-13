const { withDb, tx } = require("../config/db");

exports.setFloat = async (req, res, next) => {
  try {
    const { amount, store_id } = req.body;
    await withDb(conn => conn.query(
      "INSERT INTO cash_transactions (store_id, type, amount, manager_id, staff_id, note) VALUES (?, 'FLOAT', ?, ?, ?, ?)",
      [store_id || req.user.store_id, amount, req.user.id, req.user.id, "Start of day float"]
    ));
    res.json({ message: "Start of day float set" });
  } catch (e) { next(e); }
};

exports.cashPickup = async (req, res, next) => {
  try {
    const { amount, store_id, note } = req.body;
    await withDb(conn => conn.query(
      "INSERT INTO cash_transactions (store_id, type, amount, manager_id, staff_id, note) VALUES (?, 'PICKUP', ?, ?, ?, ?)",
      [store_id || req.user.store_id, amount, req.user.id, req.user.id, note || null]
    ));
    res.json({ message: "Cash pickup recorded" });
  } catch (e) { next(e); }
};

exports.cashDropoff = async (req, res, next) => {
  try {
    const { amount, store_id, note } = req.body;
    await withDb(conn => conn.query(
      "INSERT INTO cash_transactions (store_id, type, amount, manager_id, staff_id, note) VALUES (?, 'DROPOFF', ?, ?, ?, ?)",
      [store_id || req.user.store_id, amount, req.user.id, req.user.id, note || null]
    ));
    res.json({ message: "Cash drop-off recorded" });
  } catch (e) { next(e); }
};

exports.dailySummary = async (req, res, next) => {
  try {
    const store_id = req.query.store_id || req.user.store_id;
    const rows = await withDb(conn => conn.query(
      "SELECT type, SUM(amount) as total FROM cash_transactions WHERE store_id = ? AND DATE(created_at)=CURDATE() GROUP BY type",
      [store_id]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};
