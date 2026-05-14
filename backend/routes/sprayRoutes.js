import express from "express";
import axios from "axios";
import pool from "../../database/db.js";

const router = express.Router();

// ESP32 IP definition, mutable by frontend
let ESP32_IP = "http://192.168.0.105";

router.post("/connect", (req, res) => {
  const { ip } = req.body;
  if (ip) {
    ESP32_IP = ip.startsWith("http") ? ip : `http://${ip}`;
  }
  res.json({ message: "ESP32 IP updated successfully", ip: ESP32_IP });
});

router.post("/", async (req, res) => {
  console.log("POST /api/spray called with body:", req.body);
  try {
    const { duration, crop_name, disease_name, infection_level, spray_type } = req.body;

    // Send command to ESP32
    await axios.get(`${ESP32_IP}/spray?time=${duration}`);

    // Store log in DB
    await pool.query(
      `INSERT INTO spray_logs (duration, crop_name, disease_name, infection_level, spray_type) VALUES ($1, $2, $3, $4, $5)`,
      [duration, crop_name || null, disease_name || null, infection_level || null, spray_type || 'Manual']
    );

    res.json({ message: "Spray triggered" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Spray failed" });
  }
});

router.post("/stop", async (req, res) => {
  try {
    await axios.get(`${ESP32_IP}/stop`);
    res.json({ message: "Spray stopped" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Stop failed" });
  }
});

export default router;
