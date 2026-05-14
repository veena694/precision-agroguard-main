# Precision AgroGuard: Detailed Project Documentation

Precision AgroGuard is an advanced, AI-driven agricultural system designed for real-time crop disease detection and automated, targeted pesticide spraying.

---

## 1. Core Technologies

### **Frontend**
- **React 18**: Core SPA library.
- **Tailwind CSS**: Modern styling.
- **Lucide React**: Iconography.
- **React Query**: API state management.

### **Backend**
- **Node.js & Express**: API framework.
- **ONNX Runtime**: AI model execution.
- **Sharp**: High-speed image processing.
- **PostgreSQL (Supabase)**: Relational data storage.
- **Cloudinary**: Cloud image storage.

---

## 2. Function Reference: Backend (Analysis Service)

The `backend/services/analysisService.js` is the heart of the project.

### `init()`
- **Purpose**: Loads the AI models into memory.
- **How**: Iterates through the `modelConfigs` object and uses `ort.InferenceSession.create(modelPath)` to initialize each of the 5 models.
- **Optimization**: It checks if a session already exists before loading, preventing redundant memory usage.

### `preprocess(imageBuffer, format)`
- **Purpose**: Prepares the raw image for the AI models.
- **Logic**:
    1. **Resize**: Uses `sharp` to force the image to 224x224 pixels (`fit: 'fill'`).
    2. **Normalize**: Subtracts the ImageNet mean `[0.485, 0.456, 0.406]` and divides by the standard deviation `[0.229, 0.224, 0.225]`.
    3. **Format Handling**: 
        - **NCHW**: (Channels-First) used by ViT, DeiT, MaxViT.
        - **NHWC**: (Channels-Last) used by EfficientNet.
- **Result**: Returns a `ort.Tensor` ready for inference.

### `analyze(imageBuffer)`
- **Purpose**: The main entry point for image analysis.
- **Workflow**:
    1. Calls `preprocess` twice (once for NCHW and once for NHWC).
    2. Runs `session.run()` for all 5 models in a loop.
    3. **Softmax**: Converts raw model outputs (logits) into probabilities using the `softmax()` helper.
    4. **Ensemble Averaging**: Calculates the mean probability across all 5 models for each of the 26 disease classes.
    5. **Recommendation**: Logic determines if `percent > 50%` and the label is not `healthy`.

---

## 3. Function Reference: Frontend (UI Logic)

The `frontend/pages/Index.tsx` manages the user experience.

### `uploadImage()`
- **Purpose**: Sends the selected file to the server.
- **Process**:
    1. Creates a `FormData` object containing the file and the crop ID.
    2. Sends a POST request to `/api/images/upload`.
    3. Receives the analysis results and updates the `result` state to trigger the UI transition.

### `triggerSpray(seconds)`
- **Purpose**: Controls the hardware spraying action.
- **Logic**:
    1. Updates the `liveMode` state and starts a local `setInterval` countdown for the UI.
    2. Sends an API call to `/api/spray` with the duration.
    3. **Backend Action**: The server then forwards an HTTP request to the ESP32's IP address to trigger the relay.

### `startCamera()` & `capturePhoto()`
- **Purpose**: Allows real-time leaf capture.
- **How**: 
    - `startCamera` uses `navigator.mediaDevices.getUserMedia` to stream video to a `<video>` element.
    - `capturePhoto` draws the current video frame onto a hidden `<canvas>`, converts it to a JPEG `Blob`, and then to a `File` object for the upload logic.

### `fetchAlerts()`
- **Purpose**: Syncs the detection history.
- **Logic**: Fetches recent analysis from the DB and maps the raw `detected_at` timestamps into user-friendly strings like "Today" or "Yesterday" using date comparison logic.

---

## 4. Hardware Connection Logic

The **ESP32** is integrated via a dedicated route:
- **`POST /api/spray/connect`**: The user enters the ESP32's IP address. The backend saves this IP in memory.
- **Targeted Action**: When a spray is triggered, the backend sends a request to `http://[ESP32_IP]/spray?duration=[seconds]`. This decouples the hardware from the code, allowing any ESP32 on the same network to work immediately.

---

## 5. Deployment & Performance Details

- **Hugging Face Spaces**: We use the **CPU Basic (16GB RAM)** tier. This is critical because loading 5 ONNX models consumes ~800MB of RAM, which would crash standard "Free Tier" servers (which usually limit to 512MB).
- **Git LFS**: Used to manage the 670MB of model files without bloating the Git repository size.
- **Port 7860**: The `Dockerfile` and `README.md` are configured to port 7860, as required by Hugging Face's internal load balancer.
