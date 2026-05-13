
import ort from 'onnxruntime-node';
import path from 'path';

async function checkShape(modelName) {
    const modelPath = path.resolve('models', modelName);
    const session = await ort.InferenceSession.create(modelPath);
    console.log(`Model: ${modelName}`);
    console.log(`Input Names:`, session.inputNames);
    console.log(`Output Names:`, session.outputNames);
    // but we can try to run with both and see which one fails.
    
    try {
        const data = new Float32Array(1 * 3 * 224 * 224).fill(0);
        const tensor = new ort.Tensor('float32', data, [1, 3, 224, 224]);
        const results = await session.run({ [session.inputNames[0]]: tensor });
        const outputName = session.outputNames[0];
        console.log(`  [1, 3, 224, 224] WORKED, Output: ${outputName}, Length: ${results[outputName].data.length}`);
    } catch (e) {
        console.log(`  [1, 3, 224, 224] FAILED: ${e.message}`);
    }

    try {
        const data = new Float32Array(1 * 224 * 224 * 3).fill(0);
        const tensor = new ort.Tensor('float32', data, [1, 224, 224, 3]);
        const results = await session.run({ [session.inputNames[0]]: tensor });
        const outputName = session.outputNames[0];
        console.log(`  [1, 224, 224, 3] WORKED, Output: ${outputName}, Length: ${results[outputName].data.length}`);
    } catch (e) {
        console.log(`  [1, 224, 224, 3] FAILED: ${e.message}`);
    }
}

const models = ['deit.onnx', 'efficientnet.onnx', 'hybrid.onnx', 'maxvit.onnx', 'vit.onnx'];
for (const m of models) {
    await checkShape(m);
}
