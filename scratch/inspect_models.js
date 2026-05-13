
import ort from 'onnxruntime-node';
import path from 'path';

async function inspectModel(modelName, shape) {
    const modelPath = path.resolve('models', modelName);
    try {
        const session = await ort.InferenceSession.create(modelPath);
        console.log(`\n--- Model: ${modelName} ---`);
        
        const inputData = new Float32Array(shape.reduce((a, b) => a * b)).fill(0);
        const inputTensor = new ort.Tensor('float32', inputData, shape);
        
        const feeds = {};
        feeds[session.inputNames[0]] = inputTensor;
        
        const results = await session.run(feeds);
        const outputName = session.outputNames[0];
        const output = results[outputName];
        
        console.log(`Output ${outputName} shape:`, output.dims);
        console.log(`Number of classes:`, output.dims[output.dims.length - 1]);

    } catch (e) {
        console.error(`Failed to inspect ${modelName}:`, e.message);
    }
}

// Inspect efficientnet with [1, 224, 224, 3]
await inspectModel('efficientnet.onnx', [1, 224, 224, 3]);
