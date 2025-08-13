const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/ticketController");

router.get("/", auth(), ctrl.listTickets);
router.get("/:id", auth(), ctrl.getTicket);
router.post("/", auth(), ctrl.purchaseTicket);
router.post("/:id/void", auth(), ctrl.voidTicket);
router.post("/:id/exchange", auth(), ctrl.exchangeTicket);
router.post("/:id/reprint", auth(), ctrl.reprintTicket);
router.get("/:id/status", auth(), ctrl.ticketStatus);

module.exports = router;
