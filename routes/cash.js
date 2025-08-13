const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/cashController");

router.post("/float", auth(), permit("ADMIN","MANAGER"), ctrl.setFloat);
router.post("/pickup", auth(), permit("ADMIN","MANAGER"), ctrl.cashPickup);
router.post("/dropoff", auth(), permit("ADMIN","MANAGER"), ctrl.cashDropoff);
router.get("/summary", auth(), permit("ADMIN","MANAGER"), ctrl.dailySummary);

module.exports = router;
