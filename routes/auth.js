const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { auth } = require("../middleware/authMiddleware");
router.post("/verify", auth(), ctrl.verifyToken);
router.post("/login", ctrl.loginCustomer); // Customer
router.post("/login/staff", ctrl.login); // Staff
router.post("/logout", ctrl.logout);
router.post("/register", ctrl.registerCustomer); // Customer
router.post("/register/staff", ctrl.register); // Staff
router.put("/password", ctrl.changePassword);
module.exports = router;