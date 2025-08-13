const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/gameController");

router.get("/", auth(false), ctrl.listGames);
router.get("/:id", auth(false), ctrl.getGame);
router.get("/:id/draws", auth(false), ctrl.listDraws);
router.get("/:id/draws/latest", auth(false), ctrl.latestDraw);
router.get("/:id/discounts", auth(false), ctrl.getDiscounts);
router.put("/:id/discounts", auth(), permit("ADMIN","MANAGER"), ctrl.updateDiscounts);

module.exports = router;
