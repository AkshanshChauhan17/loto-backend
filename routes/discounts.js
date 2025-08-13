const express = require("express");
const router = express.Router();
const { auth, permit } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/discountController");

router.get("/", auth(), ctrl.listDiscounts);
router.post("/apply", auth(), ctrl.applyDiscountToTicket);
router.put("/:id", auth(), permit("ADMIN","MANAGER"), ctrl.updateDiscountRule);

module.exports = router;
