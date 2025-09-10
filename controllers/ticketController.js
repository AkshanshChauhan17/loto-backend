const { withDb, tx } = require("../config/db");

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

exports.getBonusAmount = async (req, res, next) => {
  try {
    const { customer_id } = req.params;
    const [[result]] = await db.query(
      `SELECT SUM(amount_remaining) AS total_bonus
       FROM discount_credits
       WHERE customer_id = ? AND amount_remaining > 0`,
      [customer_id]
    );

    res.json({
      customer_id,
      total_bonus: result.total_bonus || 0
    });
  } catch (err) {
    next(err);
  }
};

exports.purchaseTicket = async (req, res, next) => {
  try {
    const { customer_id, store_id, game_id, draw_id, lines } = req.body;

    if (!Array.isArray(lines) || !lines.length) {
      return res.status(400).json({ message: "No lines provided" });
    }

    let normalTotal = 0;
    let bonusTotal = 0;
    let discountCredit = 0;
    const processedLines = [];

    // --- Process each line ---
    for (const l of lines) {
      let stake = Number(l.stake || 0);
      if (stake < 1) return res.status(400).json({ message: "Invalid stake" });

      // BONUS special rule
      if (l.bet_type === "BONUS" && l.numbers?.length) {
        const lineCount =
          l.numbers.length === 2 ? 2 : l.numbers.length === 10 ? 10 : 1;
        stake = lineCount * 1; // $1 per line
      }

      // Max limits
      if (["C3", "C2C3", "C4"].includes(l.bet_type) && stake > 300) {
        return res
          .status(400)
          .json({ message: `Bet limit exceeded for ${l.bet_type} (max $300)` });
      }

      // Multi-line rounding (non-bonus only)
      if (lines.length > 1 && l.bet_type !== "BONUS") {
        stake = Math.ceil(stake * 2) / 2;
        if ((stake * 2) % 2 !== 0) stake += 0.5;
      }

      if (l.bonus) {
        bonusTotal += stake;
      } else {
        normalTotal += stake;

        // Discounts only for non-bonus lines
        if (stake >= 5) {
          switch (l.bet_type) {
            case "C3":
              discountCredit += stake * 0.20;
              break;
            case "C1":
            case "C2":
            case "C4":
            case "BONUS":
              discountCredit += stake * 0.10;
              break;
          }
        }
      }

      processedLines.push({ ...l, stake });
    }

    const grandTotal = normalTotal + bonusTotal;
    const serial = genSerial();
    const expiry_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const result = await tx(async (conn) => {
      // --- Deduct normal balance ---
      if (normalTotal > 0) {
        const [[acc]] = await conn.query(
          "SELECT balance FROM accounts WHERE customer_id = ?",
          [customer_id]
        );
        if (!acc || acc.balance < normalTotal)
          throw new Error("Insufficient balance");

        await conn.query(
          "UPDATE accounts SET balance = balance - ? WHERE customer_id = ?",
          [normalTotal, customer_id]
        );
      }

      // --- Deduct bonus balance (consume credits FIFO) ---
      if (bonusTotal > 0) {
        const [[bonusRow]] = await conn.query(
          "SELECT SUM(amount_remaining) AS total_bonus FROM discount_credits WHERE customer_id = ?",
          [customer_id]
        );
        const totalBonus = bonusRow?.total_bonus || 0;
        if (totalBonus < bonusTotal) {
          throw new Error("Insufficient bonus credits");
        }

        let remaining = bonusTotal;
        const [rows] = await conn.query(
          "SELECT id, amount_remaining FROM discount_credits WHERE customer_id = ? ORDER BY created_at ASC",
          [customer_id]
        );

        for (const r of rows) {
          if (remaining <= 0) break;

          if (r.amount_remaining <= remaining) {
            // consume whole row
            await conn.query("DELETE FROM discount_credits WHERE id = ?", [
              r.id,
            ]);
            remaining -= r.amount_remaining;
          } else {
            // partially consume
            await conn.query(
              "UPDATE discount_credits SET amount_remaining = amount_remaining - ? WHERE id = ?",
              [remaining, r.id]
            );
            remaining = 0;
          }
        }
      }

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
          grandTotal,
        ]
      );
      const ticket_id = ins.insertId;

      // --- Insert lines ---
      for (const l of processedLines) {
        await conn.query(
          `INSERT INTO ticket_lines (ticket_id, bet_type, numbers, stake, status, inner_type, is_bonus) 
           VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`,
          [
            ticket_id,
            l.bet_type,
            String(l.numbers),
            Number(l.stake),
            l.inner_type,
            l.bonus ? 1 : 0,
          ]
        );
      }

      // --- Insert discount credits (only for normal) ---
      if (normalTotal > 0 && discountCredit > 0) {
        await conn.query(
          `INSERT INTO discount_credits 
            (customer_id, game_id, ticket_id_source, amount_remaining, expires_at, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [customer_id, game_id, ticket_id, discountCredit, expiry_date]
        );
      }

      return { ticket_id, discountCredit, normalTotal, bonusTotal };
    });

    res.status(201).json({
      message: "Ticket purchased",
      ticket_id: result.ticket_id,
      serial,
      normal_total: result.normalTotal,
      bonus_total: result.bonusTotal,
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
