const { withDb, tx } = require("../config/db");

exports.searchCustomers = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const sql = q ? `WHERE name LIKE ? OR phone LIKE ? OR id = ?` : "";
    const params = q ? [`%${q}%`, `%${q}%`, Number(q) || 0] : [];
    const rows = await withDb(conn => conn.query(`SELECT id, name, phone FROM customers ${sql} LIMIT 50`, params).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [cust] = await withDb(conn => conn.query("SELECT id, name, phone, created_at FROM customers WHERE id = ?", [id]).then(([r])=>r));
    if (!cust) return res.status(404).json({ message: "Not found" });
    const [bal] = await withDb(conn => conn.query("SELECT balance FROM accounts WHERE customer_id = ?", [id]).then(([r])=>r));
    res.json({ ...cust, balance: bal ? bal.balance : 0 });
  } catch (e) { next(e); }
};

exports.topUpCustomer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { amount, method, receipt_id } = req.body;
    await tx(async (conn) => {
      await conn.query("UPDATE accounts SET balance = balance + ? WHERE customer_id = ?", [amount, id]);
      await conn.query(
        "INSERT INTO topups (customer_id, amount, method, staff_id, store_id, receipt_id) VALUES (?, ?, ?, ?, ?, ?)",
        [id, amount, method || "CASH", req.user?.id || null, req.user?.store_id || null, receipt_id || null]
      );
    });
    res.json({ message: "Top up successful" });
  } catch (e) { next(e); }
};

exports.resetPin = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { pin_hash } = req.body;
    await withDb(conn => conn.query("UPDATE customers SET pin_hash = ? WHERE id = ?", [pin_hash, id]));
    res.json({ message: "PIN reset" });
  } catch (e) { next(e); }
};

exports.getTopups = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await withDb(conn => conn.query(
      "SELECT id, amount, method, receipt_id, created_at FROM topups WHERE customer_id = ? ORDER BY id DESC LIMIT 200",
      [id]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.getCustomerTickets = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await withDb(conn => conn.query(
      "SELECT id, serial, game_id, total_amount, status, purchase_time FROM tickets WHERE customer_id = ? ORDER BY id DESC LIMIT 200",
      [id]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};
