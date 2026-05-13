import express from "express";
import upload from "../middleware/upload.js";
import pool from "../../database/db.js";
import { analysisService } from "../services/analysisService.js";
import fs from "fs/promises";

const router = express.Router();
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const cropId = String(req.body.crop_id || "").trim() || null;
    const mimeType = req.file.mimetype;
    const originalFileName = req.file.originalname || "upload";
    const storedFileName = req.file.filename;
    const imageUrl = `/uploads/${storedFileName}`;

    if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({
        error: "Unsupported image type. Use JPG, PNG, WEBP, or GIF.",
      });
    }

    // AI Analysis
    let analysis = null;
    let detectedCrop = "Auto Detected";
    try {
      const imageBuffer = await fs.readFile(req.file.path);
      analysis = await analysisService.analyze(imageBuffer);
      if (analysis.topResults && analysis.topResults.length > 0) {
        const topLabel = analysis.topResults[0].name;
        const cropPart = topLabel.split('/')[0];
        detectedCrop = cropPart.charAt(0).toUpperCase() + cropPart.slice(1);
      }
    } catch (analysisError) {
      console.error("ANALYSIS ERROR:", analysisError);
      analysis = { error: "AI Analysis failed" };
    }

    const result = await pool.query(
      `INSERT INTO images (
         crop_id,
         crop_name,
         crop_variety,
         original_file_name,
         stored_file_name,
         image_url,
         mime_type,
         image_size_bytes,
         uploaded_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, crop_id, crop_name, crop_variety, original_file_name, stored_file_name, image_url, mime_type, image_size_bytes, uploaded_at`,
      [
        null,
        detectedCrop,
        "Auto Detected",
        originalFileName,
        storedFileName,
        imageUrl,
        mimeType,
        req.file.size,
      ]
    );

    const image = result.rows[0];

    // Save Analysis to disease_predictions
    if (analysis && !analysis.error) {
      try {
        await pool.query(
          `INSERT INTO disease_predictions (
             image_id,
             disease_name,
             confidence_score,
             infection_level,
             recommend_spray,
             analysis_results,
             detected_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            image.id,
            analysis.topResults[0].name,
            analysis.topResults[0].percent,
            analysis.infectionLevel,
            analysis.recommendSpray,
            JSON.stringify(analysis.topResults)
          ]
        );
      } catch (dbError) {
        console.error("DISEASE PREDICTION SAVE ERROR:", dbError);
      }
    }

    res.json({
      ...image,
      analysis
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);
    res.status(500).json({
      error: "Database insert failed. Recreate the images table with the latest migration."
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, crop_id, crop_name, crop_variety, original_file_name, stored_file_name, image_url, mime_type, image_size_bytes, uploaded_at
       FROM images
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("IMAGE FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

router.get("/history/recent", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        i.id as image_id,
        i.crop_name,
        i.image_url,
        dp.disease_name,
        dp.confidence_score,
        dp.infection_level,
        dp.recommend_spray,
        dp.detected_at
       FROM images i
       JOIN disease_predictions dp ON i.id = dp.image_id
       ORDER BY dp.detected_at DESC
       LIMIT 10`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("RECENT HISTORY FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to fetch recent history" });
  }
});

export default router;
