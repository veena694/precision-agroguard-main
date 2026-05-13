
import { analysisService } from '../backend/services/analysisService.js';
import fs from 'fs';
import path from 'path';

async function test() {
    const testImagePath = path.resolve('backend/uploads', 'septoria-on-tomato-1778584853953-cc837d660c2f.jpg');
    if (!testImagePath) {
        console.error("No images found in backend/uploads to test with.");
        return;
    }

    console.log(`Testing with image: ${testImagePath}`);
    const buffer = fs.readFileSync(testImagePath);
    
    try {
        const results = await analysisService.analyze(buffer);
        console.log("Analysis Results:", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("Analysis failed:", e);
    }
}

test();
