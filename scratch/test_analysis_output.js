
import { analysisService } from '../backend/services/analysisService.js';
import fs from 'fs/promises';
import path from 'path';

async function testAnalysis() {
    try {
        // Find an image in uploads if any, or use a dummy
        const uploadsDir = path.resolve('backend/uploads');
        const files = (await fs.readdir(uploadsDir)).filter(f => !f.startsWith('.'));
        if (files.length === 0) {
            console.log("No images to test with.");
            return;
        }

        const imagePath = path.join(uploadsDir, files[0]);
        console.log(`Testing with image: ${imagePath}`);
        const buffer = await fs.readFile(imagePath);

        const result = await analysisService.analyze(buffer);
        console.log("Full Result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(err);
    }
}

testAnalysis();
