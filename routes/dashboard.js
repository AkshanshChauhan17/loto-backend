const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/dashboardController");

router.get("/overview", auth(), ctrl.overview);
router.get("/alerts", auth(), ctrl.alerts);
router.get("/settings", auth(), permit("ADMIN","MANAGER"), ctrl.getSettings);
router.put("/settings", auth(), permit("ADMIN","MANAGER"), ctrl.updateSettings);

module.exports = router;
