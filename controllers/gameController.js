const { withDb } = require("../config/db");

exports.listGames = async (req, res, next) => {
  try {
    const rows = await withDb(conn => conn.query("SELECT id, code, name, active FROM games ORDER BY id").then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.getGame = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [game] = await withDb(conn => conn.query("SELECT * FROM games WHERE id = ?", [id]).then(([r])=>r));
    if (!game) return res.status(404).json({ message: "Not found" });
    res.json(game);
  } catch (e) { next(e); }
};

exports.listDraws = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await withDb(conn => conn.query(
      "SELECT id, draw_date, main_numbers, bonus_number FROM draws WHERE game_id = ? ORDER BY draw_date DESC LIMIT 200",
      [id]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.latestDraw = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [row] = await withDb(conn => conn.query(
      "SELECT id, draw_date, main_numbers, bonus_number FROM draws WHERE game_id = ? ORDER BY draw_date DESC LIMIT 1",
      [id]
    ).then(([r])=>r));
    res.json(row || null);
  } catch (e) { next(e); }
};

exports.getDiscounts = async (req, res, next) => {
  try {
    const game_id = req.params.id;
    const rows = await withDb(conn => conn.query(
      "SELECT id, bet_type, percent, min_bet, active, starts_at, ends_at FROM discounts WHERE game_id = ? AND active = 1",
      [game_id]
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.updateDiscounts = async (req, res, next) => {
  try {
    const game_id = req.params.id;
    const { rules } = req.body; // [{bet_type, percent, min_bet}]
    // Simple approach: deactivate existing, insert new
    await withDb(async (conn) => {
      await conn.query("UPDATE discounts SET active = 0 WHERE game_id = ?", [game_id]);
      for (const r of (rules || [])) {
        await conn.query(
          "INSERT INTO discounts (game_id, bet_type, percent, min_bet, active) VALUES (?, ?, ?, ?, 1)",
          [game_id, r.bet_type, r.percent, r.min_bet || 0]
        );
      }
    });
    res.json({ message: "Discounts updated" });
  } catch (e) { next(e); }
};
