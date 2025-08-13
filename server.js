const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { errorHandler, notFound } = require("./middleware/errorHandler");
const { withDb } = require("./config/db");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Health check
app.get("/health", async (req, res) => {
  try {
    await withDb(async (conn) => { await conn.query("SELECT 1"); });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/games", require("./routes/games"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/cash", require("./routes/cash"));
app.use("/api/discounts", require("./routes/discounts"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/security", require("./routes/security"));
app.use("/api/reports", require("./routes/reports"));

// 404 + errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
