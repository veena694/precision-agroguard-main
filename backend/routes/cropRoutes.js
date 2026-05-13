import express from "express";
import pool from "../../database/db.js";

const router = express.Router();

/* GET all crops */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT crops.*, farms.farm_name
      FROM crops
      LEFT JOIN farms ON crops.farm_id = farms.id
      ORDER BY crops.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch crops" });
  }
});

/* CREATE crop */
router.post("/", async (req, res) => {
  try {
    const { farm_id, crop_name, crop_variety, planting_date } = req.body;
    const normalizedFarmId = farm_id ? String(farm_id).trim() : null;

    const result = await pool.query(
      `INSERT INTO crops (farm_id, crop_name, crop_variety, planting_date)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [normalizedFarmId, crop_name, crop_variety, planting_date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create crop" });
  }
});

export default router;
