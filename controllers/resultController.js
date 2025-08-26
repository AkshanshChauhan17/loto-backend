// controllers/resultController.js
const { tx } = require("../config/db");
const { calculatePayout } = require("../utils/result");

async function postResult(req, res) {
  const game_id = req.params.game_id;
  const { winningNumbers, bonus } = req.body;

  if (!winningNumbers || !Array.isArray(winningNumbers)) {
    return res.status(400).json({ error: "Winning numbers required (array)" });
  }

  try {
    const resultData = await tx(async (conn) => {
      // 1️⃣ Insert into results
      const [resultInsert] = await conn.execute(
        `INSERT INTO results (game_id, winning_numbers, bonus) VALUES (?, ?, ?)`,
        [game_id, JSON.stringify(winningNumbers), bonus || null]
      );

      const resultId = resultInsert.insertId;

      // 2️⃣ Get all pending tickets for this game
      const [tickets] = await conn.execute(
        `SELECT * FROM tickets WHERE game_id = ? AND status = 'PENDING'`,
        [game_id]
      );

      let winners = [];

      // 3️⃣ Process each ticket
      for (const ticket of tickets) {
        // fetch its lines
        const [lines] = await conn.execute(
          `SELECT * FROM ticket_lines WHERE ticket_id = ? AND status = 'PENDING'`,
          [ticket.id]
        );

        let ticketWinTotal = 0;

        for (const line of lines) {
          const payout = calculatePayout(
            game_id,
            {
              bet_type: line.bet_type,
              numbers: line.numbers.split(",").map(n => Number(n.trim())).filter(Number.isFinite),
              stake: Number(line.stake),
              inner_type: line.inner_type,
            },
            { winningNumbers, bonus }
          );

          if (payout > 0) {
            await conn.execute(
              `UPDATE ticket_lines SET status = 'WIN', win_amount = ? WHERE id = ?`,
              [payout, line.id]
            );
            ticketWinTotal += payout;
          } else {
            await conn.execute(
              `UPDATE ticket_lines SET status = 'LOSE', win_amount = 0 WHERE id = ?`,
              [line.id]
            );
          }
        }

        // 4️⃣ Update ticket status based on total win
        if (ticketWinTotal > 0) {
          await conn.execute(
            `UPDATE tickets SET status = 'WON' WHERE id = ?`,
            [ticket.id]
          );
          winners.push({
            ticket_id: ticket.id,
            customer_id: ticket.customer_id,
            amount: ticketWinTotal,
          });
        } else {
          await conn.execute(
            `UPDATE tickets SET status = 'LOST' WHERE id = ?`,
            [ticket.id]
          );
        }
      }

      return { resultId, winners };
    });

    res.json({
      message: "Result processed successfully",
      game_id,
      winningNumbers,
      bonus: bonus || null,
      winners: resultData.winners,
    });
  } catch (err) {
    console.error("Error in postResult:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { postResult };