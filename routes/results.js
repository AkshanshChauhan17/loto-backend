// routes/resultRoutes.js
const express = require("express");
const router = express.Router();
const { postResult } = require("../controllers/resultController");

// Admin manually posts result per game
router.post("/:game_id", postResult);

module.exports = router;
