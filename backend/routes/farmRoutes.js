import express from "express";
import pool from "../../database/db.js";

const router = express.Router();

/* GET all farms */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM farms ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch farms" });
  }
});


/* CREATE farm */
router.post("/", async (req, res) => {
  try {
    const { farmer_name, farm_name, location, farm_size } = req.body;

    const result = await pool.query(
      `INSERT INTO farms (farmer_name, farm_name, location, farm_size)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [farmer_name, farm_name, location, farm_size]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create farm" });
  }
});

export default router;
