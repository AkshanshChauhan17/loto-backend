const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/reportController");

router.get("/sales", auth(), permit("ADMIN","MANAGER"), ctrl.salesReport);
router.get("/topups", auth(), permit("ADMIN","MANAGER"), ctrl.topupReport);
router.get("/activity", auth(), permit("ADMIN","MANAGER"), ctrl.activityReport);
router.get("/export/pdf", auth(), permit("ADMIN","MANAGER"), ctrl.exportClosingSummary);
router.get("/export/telegram", auth(), permit("ADMIN","MANAGER"), ctrl.exportToTelegram);

module.exports = router;
