
import ort from 'onnxruntime-node';
import path from 'path';

async function inspectAllModels() {
    const models = ['deit.onnx', 'efficientnet.onnx', 'hybrid.onnx', 'maxvit.onnx', 'vit.onnx'];
    for (const modelName of models) {
        const modelPath = path.resolve('models', modelName);
        try {
            const session = await ort.InferenceSession.create(modelPath);
            console.log(`\n--- Model: ${modelName} ---`);
            console.log(`Input Names:`, session.inputNames);
            console.log(`Output Names:`, session.outputNames);
            
            // We can't easily get input shape from session if it's dynamic, 
            // but usually we can check session.inputNames and types.
        } catch (e) {
            console.error(`Failed to inspect ${modelName}:`, e.message);
        }
    }
}

await inspectAllModels();
