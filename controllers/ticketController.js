const { withDb, tx } = require("../config/db");

function genSerial() {
    return "T" + Date.now() + Math.floor(Math.random() * 1000);
}

exports.listTickets = async(req, res, next) => {
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

exports.getTicket = async(req, res, next) => {
    try {
        const id = req.params.id;
        const [t] = await withDb(conn => conn.query("SELECT * FROM tickets WHERE id = ?", [id]).then(([r]) => r));
        if (!t) return res.status(404).json({ message: "Not found" });
        const lines = await withDb(conn => conn.query("SELECT * FROM ticket_lines WHERE ticket_id = ?", [id]).then(([r]) => r));
        res.json({...t, lines });
    } catch (e) { next(e); }
};

exports.getBonusAmount = async(req, res, next) => {
    try {
        const { customer_id } = req.params;
        const [
            [result]
        ] = await db.query(
            `SELECT SUM(amount_remaining) AS total_bonus
       FROM discount_credits
       WHERE customer_id = ? AND amount_remaining > 0`, [customer_id]
        );

        res.json({
            customer_id,
            total_bonus: result.total_bonus || 0
        });
    } catch (err) {
        next(err);
    }
};

exports.purchaseTicket = async(req, res, next) => {
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
            if (stake < 1 && !l.bonus)
                return res.status(400).json({ message: "Invalid stake" });

            // --- BONUS lines come directly from frontend ---
            if (l.bet_type === "BONUS") {
                // use stake and discount from frontend
                bonusTotal += stake;
                processedLines.push({
                    ...l,
                    stake,
                    discount: Number(l.discount || 0),
                    freePlay: false,
                    addToWin: 0
                });
                continue; // skip rest of the logic for BONUS
            }

            // --- Normal line processing (non-BONUS) ---
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

            normalTotal += stake;

            // --- Discounts only for non-bonus lines ---
            if (stake >= 5) {
                switch (l.bet_type) {
                    case "C3":
                        discountCredit += stake * 0.2; // 20% free play
                        break;
                    case "C1":
                    case "C2":
                    case "C4":
                        discountCredit += stake * 0.1; // 10% free play
                        break;
                }
            }

            processedLines.push({
                ...l,
                stake,
                discount: Number(l.discount || 0),
                freePlay: false,
                addToWin: 0
            });
        }

        // --- Calculate totals ---
        const grandTotal = normalTotal + bonusTotal;
        const serial = genSerial();
        const expiry_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // --- Database Transaction ---
        const result = await tx(async(conn) => {
            // --- Deduct normal balance ---
            if (normalTotal > 0) {
                const [
                    [acc]
                ] = await conn.query(
                    "SELECT balance FROM accounts WHERE customer_id = ?", [customer_id]
                );

                if (!acc || acc.balance < normalTotal)
                    throw new Error("Insufficient balance");

                await conn.query(
                    "UPDATE accounts SET balance = balance - ? WHERE customer_id = ?", [normalTotal, customer_id]
                );
            }

            // --- Insert ticket ---
            const [ins] = await conn.query(
                `INSERT INTO tickets 
          (serial, customer_id, store_id, staff_id, game_id, draw_id, total_amount, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`, [
                    serial,
                    customer_id,
                    store_id || null,
                    req.user ? .id || null,
                    game_id,
                    draw_id || null,
                    grandTotal
                ]
            );
            const ticket_id = ins.insertId;

            // --- Insert lines ---
            for (const l of processedLines) {
                await conn.query(
                    `INSERT INTO ticket_lines (
            ticket_id, 
            bet_type, 
            numbers, 
            stake, 
            status, 
            inner_type, 
            is_bonus, 
            free_play, 
            bonus_amount, 
            add_to_win
          ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`, [
                        ticket_id,
                        l.bet_type,
                        String(l.numbers),
                        Number(l.stake),
                        l.inner_type || null,
                        l.bet_type === "BONUS" ? 1 : 0,
                        l.freePlay || false,
                        l.discount || 0,
                        l.addToWin || 0
                    ]
                );
            }

            return { ticket_id, discountCredit, normalTotal, bonusTotal };
        });

        // --- Response ---
        res.status(201).json({
            message: "Ticket purchased",
            ticket_id: result.ticket_id,
            serial,
            normal_total: result.normalTotal,
            bonus_total: result.bonusTotal,
            discount_credit: result.discountCredit,
            expiry_date
        });
    } catch (e) {
        next(e);
    }
};

exports.voidTicket = async(req, res, next) => {
    try {
        const id = req.params.id;
        // Basic: allow void if pending
        await tx(async(conn) => {
            const [
                [t]
            ] = await conn.query("SELECT status, customer_id, total_amount FROM tickets WHERE id = ?", [id]);
            if (!t) throw new Error("Not found");
            if (t.status !== "PENDING") throw new Error("Cannot void after draw or if already processed");
            await conn.query("UPDATE tickets SET status = 'VOID' WHERE id = ?", [id]);
            await conn.query("UPDATE ticket_lines SET status = 'VOID' WHERE ticket_id = ?", [id]);
            await conn.query("UPDATE accounts SET balance = balance + ? WHERE customer_id = ?", [t.total_amount, t.customer_id]);
        });
        res.json({ message: "Ticket voided" });
    } catch (e) { next(e); }
};

exports.exchangeTicket = async(req, res, next) => {
    try {
        // For brevity, just mark original as EXCHANGED and create a new ticket with provided lines
        const { new_lines } = req.body;
        if (!Array.isArray(new_lines) || !new_lines.length) return res.status(400).json({ message: "No new lines" });
        res.json({ message: "Exchange endpoint placeholder — implement business rules as needed" });
    } catch (e) { next(e); }
};

exports.reprintTicket = async(req, res, next) => {
    try {
        const id = req.params.id;
        await withDb(conn => conn.query("UPDATE tickets SET is_copy = 1 WHERE id = ?", [id]));
        res.json({ message: "Reprint marked as copy" });
    } catch (e) { next(e); }
};

exports.ticketStatus = async(req, res, next) => {
    try {
        const id = req.params.id;
        const [
            [t]
        ] = await withDb(conn => conn.query("SELECT status FROM tickets WHERE id = ?", [id]));
        if (!t) return res.status(404).json({ message: "Not found" });
        res.json(t);
    } catch (e) { next(e); }
};