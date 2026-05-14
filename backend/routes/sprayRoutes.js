import express from "express";
import axios from "axios";
import pool from "../../database/db.js";

const router = express.Router();

// ESP32 IP definition, mutable by frontend
let ESP32_IP = "http://10.57.42.207";

router.post("/connect", (req, res) => {
  const { ip } = req.body;
  if (ip) {
    ESP32_IP = ip.startsWith("http") ? ip : `http://${ip}`;
  }
  res.json({ message: "ESP32 IP updated successfully", ip: ESP32_IP });
});

router.post("/", async (req, res) => {
  console.log("POST /api/spray called with body:", req.body);
  const { duration, crop_name, disease_name, infection_level, spray_type } = req.body;

  try {
    // 1. Store log in DB first (always do this)
    await pool.query(
      `INSERT INTO spray_logs (duration, crop_name, disease_name, infection_level, spray_type) VALUES ($1, $2, $3, $4, $5)`,
      [duration, crop_name || null, disease_name || null, infection_level || null, spray_type || 'Manual']
    );
    console.log("Spray log saved to database");

    // 2. Attempt to trigger hardware
    try {
      console.log(`Attempting to trigger ESP32 at ${ESP32_IP}`);
      // Use a shorter timeout for hardware calls
      await axios.get(`${ESP32_IP}/spray?time=${duration}`, { timeout: 3000 });
      res.json({ message: "Spray triggered and logged", status: "success" });
    } catch (hwError) {
      console.error("Hardware trigger failed:", hwError.message);
      
      // If it's a local IP and we're in production, it's a known limitation
      const isLocalIp = ESP32_IP.includes("192.168.") || ESP32_IP.includes("10.") || ESP32_IP.includes("localhost");
      const errorMsg = isLocalIp 
        ? "Hardware unreachable (Local IP detected in cloud deployment). Please use a public URL or ngrok."
        : `Hardware unreachable: ${hwError.message}`;
        
      res.json({ 
        message: "Logged to database, but hardware trigger failed", 
        error: errorMsg,
        status: "partial_success" 
      });
    }
  } catch (error) {
    console.error("Database logging failed:", error);
    res.status(500).json({ error: "Failed to process spray request" });
  }
});

router.post("/stop", async (req, res) => {
  try {
    await axios.get(`${ESP32_IP}/stop`, { timeout: 2000 });
    res.json({ message: "Spray stopped" });
  } catch (error) {
    console.error("Stop failed:", error.message);
    res.status(500).json({ error: "Stop failed", details: error.message });
  }
});

export default router;
