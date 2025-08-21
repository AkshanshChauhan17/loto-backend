const { withDb, tx } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

function genSerial() {
  return "T" + Date.now() + Math.floor(Math.random() * 1000);
}

exports.listTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = `
      SELECT id, serial, customer_id, game_id, total_amount, status, purchase_time 
      FROM tickets
    `;
    let params = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = await withDb(conn =>
      conn.query(query, params).then(([r]) => r)
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.getTicket = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [t] = await withDb(conn => conn.query("SELECT * FROM tickets WHERE id = ?", [id]).then(([r]) => r));
    if (!t) return res.status(404).json({ message: "Not found" });
    const lines = await withDb(conn => conn.query("SELECT * FROM ticket_lines WHERE ticket_id = ?", [id]).then(([r]) => r));
    res.json({ ...t, lines });
  } catch (e) { next(e); }
};

exports.purchaseTicket = async (req, res, next) => {
  try {
    const { customer_id, store_id, game_id, draw_id, lines } = req.body;
    if (!Array.isArray(lines) || !lines.length) {
      return res.status(400).json({ message: "No lines provided" });
    }

    // --- Calculate totals & validate limits ---
    let total = 0;
    let discountCredit = 0;

    for (const l of lines) {
      const stake = Number(l.stake || 0);
      if (stake <= 0) return res.status(400).json({ message: "Invalid stake" });

      // Max limits
      if (["C3", "C2C3", "C4"].includes(l.bet_type) && stake > 300) {
        return res.status(400).json({
          message: `Bet limit exceeded for ${l.bet_type} (max $300)`
        });
      }

      // Add to total
      total += stake;

      // Discounts (min $5 stake per line)
      if (stake >= 5) {
        if (l.bet_type === "C3") discountCredit += stake * 0.30;
        else if (["C1", "C2", "BONUS"].includes(l.bet_type)) discountCredit += stake * 0.10;
        else if (l.bet_type === "C4") discountCredit += stake * 0.10;
      }
    }

    const serial = genSerial();
    const expiry_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +1 month

    const result = await tx(async (conn) => {
      // --- Check balance ---
      const [[acc]] = await conn.query(
        "SELECT balance FROM accounts WHERE customer_id = ?",
        [customer_id]
      );
      if (!acc || acc.balance < total) throw new Error("Insufficient balance");

      // Deduct balance
      await conn.query(
        "UPDATE accounts SET balance = balance - ? WHERE customer_id = ?",
        [total, customer_id]
      );

      // --- Insert ticket ---
      const [ins] = await conn.query(
        `INSERT INTO tickets 
          (serial, customer_id, store_id, staff_id, game_id, draw_id, total_amount, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          serial,
          customer_id,
          store_id || null,
          req.user?.id || null,
          game_id,
          draw_id || null,
          total
        ]
      );
      const ticket_id = ins.insertId;

      // --- Insert ticket lines ---
      for (const l of lines) {
        await conn.query(
          `INSERT INTO ticket_lines (ticket_id, bet_type, numbers, stake, status) 
           VALUES (?, ?, ?, ?, 'PENDING')`,
          [ticket_id, l.bet_type, String(l.numbers), Number(l.stake)]
        );
      }

      // --- Insert discount credit (if any) ---
      if (discountCredit > 0) {
        await conn.query(
          `INSERT INTO discount_credits 
            (customer_id, game_id, ticket_id_source, amount_remaining, expires_at, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [customer_id, game_id, ticket_id, discountCredit, expiry_date]
        );
      }

      return { ticket_id, discountCredit };
    });

    res.status(201).json({
      message: "Ticket purchased",
      ticket_id: result.ticket_id,
      serial,
      total,
      discount_credit: result.discountCredit,
      expiry_date,
    });
  } catch (e) {
    next(e);
  }
};


exports.voidTicket = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Basic: allow void if pending
    await tx(async (conn) => {
      const [[t]] = await conn.query("SELECT status, customer_id, total_amount FROM tickets WHERE id = ?", [id]);
      if (!t) throw new Error("Not found");
      if (t.status !== "PENDING") throw new Error("Cannot void after draw or if already processed");
      await conn.query("UPDATE tickets SET status = 'VOID' WHERE id = ?", [id]);
      await conn.query("UPDATE ticket_lines SET status = 'VOID' WHERE ticket_id = ?", [id]);
      await conn.query("UPDATE accounts SET balance = balance + ? WHERE customer_id = ?", [t.total_amount, t.customer_id]);
    });
    res.json({ message: "Ticket voided" });
  } catch (e) { next(e); }
};

exports.exchangeTicket = async (req, res, next) => {
  try {
    // For brevity, just mark original as EXCHANGED and create a new ticket with provided lines
    const { new_lines } = req.body;
    if (!Array.isArray(new_lines) || !new_lines.length) return res.status(400).json({ message: "No new lines" });
    res.json({ message: "Exchange endpoint placeholder — implement business rules as needed" });
  } catch (e) { next(e); }
};

exports.reprintTicket = async (req, res, next) => {
  try {
    const id = req.params.id;
    await withDb(conn => conn.query("UPDATE tickets SET is_copy = 1 WHERE id = ?", [id]));
    res.json({ message: "Reprint marked as copy" });
  } catch (e) { next(e); }
};

exports.ticketStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [[t]] = await withDb(conn => conn.query("SELECT status FROM tickets WHERE id = ?", [id]));
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch (e) { next(e); }
};
