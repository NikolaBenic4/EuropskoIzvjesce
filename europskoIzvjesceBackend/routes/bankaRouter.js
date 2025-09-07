const express = require("express");
const router = express.Router();
const pool = require("../db"); // prilagodi lokaciju svojem projektu

// GET /api/banka/banka-za-iban?iban=...
router.get("/banka-za-iban", async (req, res) => {
  const { iban } = req.query;
  if (!iban || typeof iban !== "string") {
    return res.status(400).json({ error: "IBAN nije zadan." });
  }
  // Makni SVE znakove osim slova/brojeva
  const ibanRaw = iban.replace(/\W/g, "").toUpperCase();
  if (ibanRaw.length < 11 || !ibanRaw.startsWith("HR")) {
    return res.status(400).json({ error: "Neispravan IBAN." });
  }
  // Uzmi substring od pozicije 4 do 8 (5.-8. znak)
  const prefix = ibanRaw.substring(4, 8);
  try {
    const result = await pool.query(
      "SELECT naziv_banke FROM banka WHERE id_banke = $1 LIMIT 1", [prefix]
    );
    if (!result.rows.length) {
      return res.json({ naziv_banke: "" });
    }
    return res.json({ naziv_banke: result.rows[0].naziv_banke });
  } catch (error) {
    console.error("Greška kod dohvaćanja banke za IBAN:", error);
    return res.status(500).json({ error: "Greška s bazom." });
  }
});

module.exports = router;
