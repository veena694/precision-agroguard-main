import pptxgen from "pptxgenjs";

const pptx = new pptxgen();

// Define a common theme/style
const TITLE_STYLE = { fontSize: 32, bold: true, color: "2D5A27", align: "center" };
const BODY_STYLE = { fontSize: 18, color: "333333", bullet: true };

// --- SLIDE 1: Title ---
let slide1 = pptx.addSlide();
slide1.addText("Precision AgroGuard", { x: 0, y: 2, w: "100%", fontSize: 48, bold: true, color: "2D5A27", align: "center" });
slide1.addText("AI-Powered Smart Agriculture & Automated Spraying", { x: 0, y: 3.5, w: "100%", fontSize: 24, color: "555555", align: "center" });
slide1.addText("Project Overview & Technical Documentation", { x: 0, y: 4.5, w: "100%", fontSize: 18, italic: true, align: "center" });

// --- SLIDE 2: Problem ---
let slide2 = pptx.addSlide();
slide2.addText("The Problem", TITLE_STYLE);
slide2.addText([
    { text: "Late disease detection leads to total crop loss" },
    { text: "Over-spraying wastes chemicals and harms soil health" },
    { text: "Human exposure to toxic pesticides during manual spraying" },
    { text: "High labor costs and lack of precision in traditional farming" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 3: The Solution ---
let slide3 = pptx.addSlide();
slide3.addText("The Solution: Precision AgroGuard", TITLE_STYLE);
slide3.addText([
    { text: "Real-time AI analysis using high-accuracy leaf capture" },
    { text: "Targeted spraying triggered only when infection is found" },
    { text: "Full-stack integration from mobile dashboard to field hardware" },
    { text: "Automated logging and history for long-term field health" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 4: Architecture ---
let slide4 = pptx.addSlide();
slide4.addText("System Architecture", TITLE_STYLE);
slide4.addText([
    { text: "Frontend: React.js with Tailwind CSS for a premium UI" },
    { text: "Backend: Node.js Express API for processing & AI execution" },
    { text: "Database: PostgreSQL (Supabase) for persistent records" },
    { text: "Cloud: Cloudinary for image hosting & HF Spaces for deployment" },
    { text: "Hardware: ESP32 with Wi-Fi based relay control" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 5: The AI Ensemble (Brain) ---
let slide5 = pptx.addSlide();
slide5.addText("AI Ensemble Logic", TITLE_STYLE);
slide5.addText([
    { text: "Parallel processing using 5 State-of-the-Art models" },
    { text: "Architectures: ViT, DeiT, EfficientNet, MaxViT, and Hybrid" },
    { text: "Consensus Voting: Only act if models agree on infection" },
    { text: "Higher reliability than single-model systems" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 6: Image Preprocessing ---
let slide6 = pptx.addSlide();
slide6.addText("Preprocessing & Normalization", TITLE_STYLE);
slide6.addText([
    { text: "Fast resizing to 224x224 pixels using Sharp" },
    { text: "Normalization using ImageNet Mean & Standard Deviation" },
    { text: "Multi-format tensor generation (NCHW & NHWC)" },
    { text: "Ensuring models receive high-quality data for inference" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 7: Hardware Integration ---
let slide7 = pptx.addSlide();
slide7.addText("IoT Hardware & ESP32", TITLE_STYLE);
slide7.addText([
    { text: "ESP32 acts as the field executor" },
    { text: "Relay Module controls the sprayer pump" },
    { text: "Wi-Fi communication via local IP networking" },
    { text: "Automated timing: 5s/10s spray bursts based on AI results" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 8: Premium UI Experience ---
let slide8 = pptx.addSlide();
slide8.addText("User Interface & Experience", TITLE_STYLE);
slide8.addText([
    { text: "Glassmorphism design with clean, modern visuals" },
    { text: "Live Mode: Real-time status update during spraying" },
    { text: "Smart Alerts: Categorized by crop and disease type" },
    { text: "Responsive: Fully functional on smartphones & tablets" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 9: Deployment & Infrastructure ---
let slide9 = pptx.addSlide();
slide9.addText("Cloud Deployment & Scale", TITLE_STYLE);
slide9.addText([
    { text: "Dockerized container for OS-level stability" },
    { text: "Hugging Face Spaces: 16GB RAM for multi-model loading" },
    { text: "Git LFS: Handling 670MB of AI weight files" },
    { text: "Secure secret management for DB & API keys" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 10: Future Roadmap ---
let slide10 = pptx.addSlide();
slide10.addText("Future Scope", TITLE_STYLE);
slide10.addText([
    { text: "Autonomous drone-mounted spraying systems" },
    { text: "Expansion to multi-crop detection (50+ types)" },
    { text: "Mesh networking for large-scale farm coverage" },
    { text: "Solar-powered hardware units for off-grid operation" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 11: Impact Summary ---
let slide11 = pptx.addSlide();
slide11.addText("Impact & Sustainability", TITLE_STYLE);
slide11.addText([
    { text: "Reduction in pesticide chemical usage by up to 40%" },
    { text: "Improved farmer health by reducing chemical contact" },
    { text: "Higher crop yields through early disease mitigation" },
    { text: "Data-driven farming for the next generation" }
], { x: 1, y: 1.5, w: 8, h: 4, ...BODY_STYLE });

// --- SLIDE 12: Thank You ---
let slide12 = pptx.addSlide();
slide12.addText("Thank You!", { x: 0, y: 3, w: "100%", fontSize: 48, bold: true, color: "2D5A27", align: "center" });
slide12.addText("Questions & Discussion", { x: 0, y: 4.5, w: "100%", fontSize: 24, align: "center" });

pptx.writeFile({ fileName: "AgroGuard_Presentation.pptx" }).then(fileName => {
    console.log(`Presentation generated: ${fileName}`);
});
