
import ort from 'onnxruntime-node';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODELS_DIR = path.resolve(__dirname, '../../models');

const LABELS = [
  'bellpepper/bacterial_spot', 'bellpepper/healthy', 'eggplant/healthy', 'eggplant/insect_pest', 
  'eggplant/leaf_spot', 'eggplant/mosaic_virus', 'eggplant/small_leaf', 'eggplant/white_mold', 
  'eggplant/wilt', 'potato/bacteria', 'potato/early_blight', 'potato/fungi', 
  'potato/healthy', 'potato/late_blight', 'potato/pest', 'potato/virus', 
  'tomato/bacterial_spot', 'tomato/early_blight', 'tomato/healthy', 'tomato/late_blight', 
  'tomato/leaf_mold', 'tomato/mosaic_virus', 'tomato/septoria_leaf_spot', 'tomato/spider_mites', 
  'tomato/target_spot', 'tomato/yellowleaf_curl_virus'
];

class AnalysisService {
  constructor() {
    this.sessions = {};
    this.modelConfigs = {
      'deit': { file: 'deit.onnx', output: 'output', format: 'NCHW' },
      'efficientnet': { file: 'efficientnet.onnx', output: 'dense', format: 'NHWC' },
      'hybrid': { file: 'hybrid.onnx', output: 'output', format: 'NCHW' },
      'maxvit': { file: 'maxvit.onnx', output: 'output', format: 'NCHW' },
      'vit': { file: 'vit.onnx', output: 'output', format: 'NCHW' }
    };
  }

  async init() {
    for (const [name, config] of Object.entries(this.modelConfigs)) {
      if (!this.sessions[name]) {
        const modelPath = path.join(MODELS_DIR, config.file);
        console.log(`Loading model: ${name} from ${modelPath}`);
        this.sessions[name] = await ort.InferenceSession.create(modelPath);
      }
    }
  }

  async preprocess(imageBuffer, format) {
    const { data, info } = await sharp(imageBuffer)
      .resize(224, 224, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const inputData = new Float32Array(width * height * 3);
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    if (format === 'NHWC') {
      // [1, 224, 224, 3]
      for (let i = 0; i < data.length; i++) {
        const channel = i % 3;
        inputData[i] = (data[i] / 255.0 - mean[channel]) / std[channel];
      }
      return new ort.Tensor('float32', inputData, [1, 224, 224, 3]);
    } else {
      // [1, 3, 224, 224] (NCHW)
      const stride = width * height;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 3;
          const pos = y * width + x;
          inputData[pos] = (data[idx] / 255.0 - mean[0]) / std[0]; // R
          inputData[pos + stride] = (data[idx + 1] / 255.0 - mean[1]) / std[1]; // G
          inputData[pos + 2 * stride] = (data[idx + 2] / 255.0 - mean[2]) / std[2]; // B
        }
      }
      return new ort.Tensor('float32', inputData, [1, 3, 224, 224]);
    }
  }

  async analyze(imageBuffer) {
    try {
      console.log("Starting analysis...");
      await this.init();
      
      const tensorNCHW = await this.preprocess(imageBuffer, 'NCHW');
      const tensorNHWC = await this.preprocess(imageBuffer, 'NHWC');

      const allPredictions = [];
      for (const [name, session] of Object.entries(this.sessions)) {
        try {
          const config = this.modelConfigs[name];
          const inputTensor = config.format === 'NHWC' ? tensorNHWC : tensorNCHW;
          
          const feeds = { input: inputTensor };
          console.log(`Running inference for ${name}...`);
          const startTime = Date.now();
          const results = await session.run(feeds);
          const output = results[config.output].data;
          allPredictions.push(output);
        } catch (modelError) {
          console.error(`Error during inference for ${name}:`, modelError);
          // Continue with other models if one fails
        }
      }

      if (allPredictions.length === 0) {
        throw new Error("All models failed during inference");
      }

      const numModels = allPredictions.length;
      const numClasses = LABELS.length;
      const ensemblePred = new Float32Array(numClasses).fill(0);

      for (const pred of allPredictions) {
        // Check if output is already softmaxed (sum close to 1)
        const sum = Array.from(pred).reduce((a, b) => a + b, 0);
        const probs = Math.abs(sum - 1.0) < 0.01 ? Array.from(pred) : this.softmax(pred);
        
        for (let i = 0; i < numClasses; i++) {
          ensemblePred[i] += probs[i] / numModels;
        }
      }

      const results = Array.from(ensemblePred)
        .map((prob, index) => ({
          name: LABELS[index],
          percent: Math.round(prob * 100)
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3);

      console.log("Analysis completed successfully:", results);

      return {
        topResults: results,
        recommendSpray: results[0].percent >= 20 && !results[0].name.includes('healthy'),
        infectionLevel: results[0].percent >= 65 ? "HIGH" : results[0].percent >= 40 ? "MEDIUM" : "LOW"
      };
    } catch (error) {
      console.error("ANALYSIS SERVICE ERROR:", error);
      throw error;
    }
  }

  softmax(logits) {
    const maxLogit = Math.max(...logits);
    const scores = Array.from(logits).map(l => Math.exp(l - maxLogit));
    const totalScore = scores.reduce((a, b) => a + b, 0);
    return scores.map(s => s / totalScore);
  }
}

export const analysisService = new AnalysisService();
