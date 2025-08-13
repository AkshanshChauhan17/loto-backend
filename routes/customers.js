const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/customerController");

router.get("/", auth(), ctrl.searchCustomers);
router.get("/:id", auth(), ctrl.getCustomer);
router.get("/:id/tickets", auth(), ctrl.getCustomerTickets);
router.get("/:id/topup-history", auth(), ctrl.getTopups);
router.post("/:id/topup", auth(), ctrl.topUpCustomer);
router.put("/:id/reset-pin", auth(), permit("ADMIN","MANAGER"), ctrl.resetPin);

module.exports = router;
