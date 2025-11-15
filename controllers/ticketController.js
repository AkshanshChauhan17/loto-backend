const { withDb, tx } = require("../config/db");

function genSerial() {
    return "T" + Date.now() + Math.floor(Math.random() * 1000);
}

exports.listTickets = async(req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const status = req.query.status || null;
        const gameId = req.query.game_id ? Number(req.query.game_id) : null;
        const search = req.query.search || null;

        const sortBy = req.query.sortBy || "id";
        const sortOrder = (req.query.sortOrder || "DESC").toUpperCase();

        let whereClauses = [];
        let params = [];

        if (status && status !== "all") {
            whereClauses.push("status = ?");
            params.push(status);
        }

        if (gameId !== null && !isNaN(gameId)) {
            whereClauses.push("game_id = ?");
            params.push(gameId);
        }

        if (search) {
            whereClauses.push("serial LIKE ?");
            params.push(`%${search}%`);
        }

        const whereSQL = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

        const query = `
      SELECT id, serial, customer_id, game_id, total_amount, status, purchase_time
      FROM tickets
      ${whereSQL}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

        const finalParams = [...params, limit, offset];

        const rows = await withDb(conn =>
            conn.query(query, finalParams).then(([data]) => data)
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
            // Normalize incoming values
            const betType = String(l.bet_type || "").toUpperCase();
            const isBonusFlag = Boolean(l.bonus); // frontend boolean indicating a 'true' bonus
            let stake = Number(l.stake || 0);
            const numbers = Array.isArray(l.numbers) ? l.numbers : [];

            // Basic validation: stake must be >=1 for non-bonus lines
            if (stake < 1 && !isBonusFlag) {
                return res.status(400).json({ message: "Invalid stake" });
            }

            // CASE A: Real BONUS line (frontend explicitly marks bonus: true)
            if (betType === "BONUS" && isBonusFlag) {
                // If frontend sent a stake, use it; otherwise derive from numbers as legacy fallback
                if (!stake || stake < 0) {
                    const lineCount = numbers.length === 2 ? 2 : numbers.length === 10 ? 10 : 1;
                    stake = lineCount * 1; // $1 per line fallback
                }

                // Treat this as bonus (not deducted from normal account; counted in bonusTotal)
                bonusTotal += stake;

                processedLines.push({
                    ...l,
                    bet_type: betType,
                    stake,
                    discount: Number(l.discount || 0),
                    freePlay: Boolean(l.freePlay) || false,
                    addToWin: Number(l.addToWin || 0),
                });

                // skip normal processing
                continue;
            }

            // CASE B: Non-bonus or bet_type === "BONUS" but bonus flag is false
            // We'll treat it as a normal wager (subject to same validation/rounding/discount rules)

            // Max limits for certain bet types
            if (["C3", "C2C3", "C4"].includes(betType) && stake > 300) {
                return res
                    .status(400)
                    .json({ message: `Bet limit exceeded for ${betType} (max $300)` });
            }

            // Multi-line rounding (non-bonus only)
            if (lines.length > 1) {
                // original intention: round up to nearest 0.5, extra safeguard
                stake = Math.ceil(stake * 2) / 2;
                // the extra if in your original code looked suspicious; keep consistent rounding
            }

            // accumulate as normal
            normalTotal += stake;

            // Discounts only for non-bonus lines and only if stake >= 5
            if (stake >= 5) {
                switch (betType) {
                    case "C3":
                        discountCredit += stake * 0.20; // 20%
                        break;
                    case "C1":
                    case "C2":
                    case "C4":
                    case "BONUS": // NOTE: when a 'BONUS' line sent with bonus:false, treat like normal and give 10%
                        discountCredit += stake * 0.10;
                        break;
                    default:
                        // others: no discount
                        break;
                }
            }

            processedLines.push({
                ...l,
                bet_type: betType,
                stake,
                discount: Number(l.discount || 0),
                freePlay: Boolean(l.freePlay) || false,
                addToWin: Number(l.addToWin || 0),
            });
        } // end for lines

        // --- Calculate totals ---
        // Round totals to 2 decimals to avoid float errors
        normalTotal = Number(normalTotal.toFixed(2));
        bonusTotal = Number(bonusTotal.toFixed(2));
        discountCredit = Number(discountCredit.toFixed(2));

        const grandTotal = Number((normalTotal + bonusTotal).toFixed(2));
        const serial = genSerial();
        const expiry_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // --- Database Transaction ---
        const result = await tx(async(conn) => {
            // --- Deduct normal balance only (bonusTotal treated separately) ---
            if (normalTotal > 0) {
                const [
                    [acc]
                ] = await conn.query(
                    "SELECT balance FROM accounts WHERE customer_id = ?", [customer_id]
                );

                if (!acc || acc.balance < normalTotal) throw new Error("Insufficient balance");

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
                        String(l.numbers || ""),
                        Number(l.stake),
                        l.inner_type || null,
                        // is_bonus should reflect whether frontend flagged it as a real bonus
                        (l.bet_type === "BONUS" && Boolean(l.bonus)) ? 1 : 0,
                        l.freePlay ? 1 : 0,
                        Number(l.discount || 0),
                        Number(l.addToWin || 0),
                    ]
                );
            }

            // Optionally credit discount/free-play to customer's account or store credit here:
            // e.g. if you want to persist discountCredit as free play:
            // if(discountCredit > 0) await conn.query("UPDATE accounts SET free_play = free_play + ? WHERE customer_id = ?", [discountCredit, customer_id]);

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
            expiry_date,
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