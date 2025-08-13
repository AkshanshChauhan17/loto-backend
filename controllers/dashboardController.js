const { withDb } = require("../config/db");

exports.overview = async (req, res, next) => {
  try {
    const store_id = req.user.store_id;
    const [[sales]] = await withDb(conn => conn.query(
      "SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as qty FROM tickets WHERE DATE(purchase_time)=CURDATE() AND store_id = ?",
      [store_id]
    ));
    const [[topups]] = await withDb(conn => conn.query(
      "SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as qty FROM topups WHERE DATE(created_at)=CURDATE() AND store_id = ?",
      [store_id]
    ));
    const [[customers]] = await withDb(conn => conn.query(
      "SELECT COUNT(DISTINCT customer_id) as served FROM tickets WHERE DATE(purchase_time)=CURDATE() AND store_id = ?",
      [store_id]
    ));
    res.json({
      ticket_sales: sales,
      topups,
      customers_served: customers.served
    });
  } catch (e) { next(e); }
};

exports.alerts = async (req, res, next) => {
  try {
    const rows = await withDb(conn => conn.query(
      "SELECT * FROM alerts WHERE store_id = ? ORDER BY id DESC LIMIT 200",
      [req.user.store_id]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.getSettings = async (req, res, next) => {
  try {
    // Simple placeholder settings
    res.json({ operational_hours: "09:00-21:00", enabled_games: [1,2,3,4,5,6] });
  } catch (e) { next(e); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    // Persist as needed in a table; this is a placeholder
    res.json({ message: "Settings updated (stub)" });
  } catch (e) { next(e); }
};
