const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/securityController");

router.get("/logs", auth(), permit("ADMIN","MANAGER"), ctrl.logs);
router.get("/alerts", auth(), permit("ADMIN","MANAGER"), ctrl.listAlerts);
router.post("/logout-inactive", auth(), permit("ADMIN","MANAGER"), ctrl.logoutInactive);

module.exports = router;
