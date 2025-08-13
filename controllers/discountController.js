const { withDb } = require("../config/db");

exports.listDiscounts = async (req, res, next) => {
  try {
    const rows = await withDb(conn => conn.query(
      "SELECT * FROM discounts WHERE active = 1"
    ).then(([r])=>r));
    res.json(rows);
  } catch (e) { next(e); }
};

exports.applyDiscountToTicket = async (req, res, next) => {
  try {
    const { customer_id, game_id, bet_type, amount } = req.body;
    // Look up active rules
    const rows = await withDb(conn => conn.query(
      "SELECT percent, min_bet FROM discounts WHERE game_id = ? AND bet_type = ? AND active = 1 ORDER BY id DESC LIMIT 1",
      [game_id, bet_type]
    ).then(([r])=>r));
    const rule = rows[0];
    if (!rule || amount < rule.min_bet) return res.json({ credit: 0 });
    const credit = Math.round((amount * rule.percent) ) / 100;
    // Create discount credit to be used on same ticket/game
    await withDb(conn => conn.query(
      "INSERT INTO discount_credits (customer_id, game_id, amount_remaining) VALUES (?, ?, ?)",
      [customer_id, game_id, credit]
    ));
    res.json({ credit });
  } catch (e) { next(e); }
};

exports.updateDiscountRule = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { percent, min_bet, active } = req.body;
    await withDb(conn => conn.query("UPDATE discounts SET percent = ?, min_bet = ?, active = ? WHERE id = ?",
      [percent, min_bet, active ? 1 : 0, id]));
    res.json({ message: "Discount rule updated" });
  } catch (e) { next(e); }
};
