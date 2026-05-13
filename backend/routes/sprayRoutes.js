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
  try {
    const { duration } = req.body;

    // Send command to ESP32
    await axios.get(`${ESP32_IP}/spray?time=${duration}`);

    // Store log in DB
    await pool.query(
      `INSERT INTO spray_logs (duration) VALUES ($1)`,
      [duration]
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
