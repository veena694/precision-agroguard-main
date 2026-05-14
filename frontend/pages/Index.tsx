import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, Droplets, Leaf, TrendingDown, Zap, X, Check, Cpu, Wifi, Video } from "lucide-react";

const SPRAY_CONFIG: Record<string, { LOW: number; MEDIUM: number; HIGH: number }> = {
  "tomato/early_blight": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "tomato/late_blight": { LOW: 3, MEDIUM: 5, HIGH: 8 },
  "tomato/bacterial_spot": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "tomato/leaf_mold": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "tomato/mosaic_virus": { LOW: 3, MEDIUM: 5, HIGH: 7 },
  "tomato/septoria_leaf_spot": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "tomato/spider_mites": { LOW: 3, MEDIUM: 5, HIGH: 7 },
  "tomato/target_spot": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "tomato/yellowleaf_curl_virus": { LOW: 3, MEDIUM: 5, HIGH: 7 },

  "potato/bacteria": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "potato/early_blight": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "potato/fungi": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "potato/late_blight": { LOW: 3, MEDIUM: 5, HIGH: 8 },
  "potato/pest": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "potato/virus": { LOW: 3, MEDIUM: 5, HIGH: 7 },

  "bellpepper/bacterial_spot": { LOW: 2, MEDIUM: 4, HIGH: 6 },

  "eggplant/insect_pest": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "eggplant/leaf_spot": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "eggplant/mosaic_virus": { LOW: 3, MEDIUM: 5, HIGH: 7 },
  "eggplant/small_leaf": { LOW: 2, MEDIUM: 4, HIGH: 6 },
  "eggplant/white_mold": { LOW: 3, MEDIUM: 5, HIGH: 7 },
  "eggplant/wilt": { LOW: 3, MEDIUM: 5, HIGH: 7 },
};

export default function Index() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [sprayRemaining, setSprayRemaining] = useState(0);
  const [result, setResult] = useState<any>(null);
  const sprayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [esp32Ip, setEsp32Ip] = useState("10.57.42.207");
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const formatLabel = (label: string) => {
    if (!label) return "N/A";
    const parts = label.split('/');
    if (parts.length < 2) return label;
    const crop = parts[0];
    const disease = parts[1];
    return `${crop.charAt(0).toUpperCase() + crop.slice(1)}: ${disease.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`;
  };

  const getSprayTime = (disease: string, level: string, isBurst: boolean = false) => {
    if (!disease || disease.includes('healthy')) return 0;
    const config = SPRAY_CONFIG[disease] || { LOW: 2, MEDIUM: 4, HIGH: 6 };
    if (isBurst) return config.LOW;
    return config[level as keyof typeof config] || config.MEDIUM;
  };

  const triggerSpray = async (seconds: number, details: any = {}) => {
    setLiveMode(true);
    setSprayRemaining(seconds);

    if (sprayIntervalRef.current) {
      clearInterval(sprayIntervalRef.current);
    }

    try {
      sprayIntervalRef.current = setInterval(() => {
        setSprayRemaining((prev) => {
          if (prev <= 1) {
            if (sprayIntervalRef.current) clearInterval(sprayIntervalRef.current);
            setLiveMode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 1. Attempt direct trigger from browser (works if on local network and browser allows it)
      let directSuccess = false;
      if (esp32Ip) {
        try {
          const espUrl = esp32Ip.startsWith('http') ? esp32Ip : `http://${esp32Ip}`;
          // Use 'no-cors' mode as ESP32 usually doesn't have CORS headers
          // and 'no-cors' doesn't trigger preflight, but we can't see result
          await fetch(`${espUrl}/spray?time=${seconds}`, { 
            mode: 'no-cors',
            credentials: 'omit'
          });
          console.log("Browser attempted direct hardware trigger");
          directSuccess = true;
        } catch (e) {
          console.warn("Direct browser trigger failed (expected on HTTPS):", e);
        }
      }

      const payload = {
        duration: seconds,
        ...details
      };
      console.log("Triggering spray via backend:", payload);

      const response = await fetch("/api/spray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.status === "partial_success") {
        console.warn("Backend logged the spray but couldn't reach hardware:", data.error);
        // Only show alert if direct browser trigger also failed
        if (!directSuccess) {
          alert(`🚀 ACTION REQUIRED: Hardware Trigger Failed\n\nSince this site is deployed on the cloud, the backend cannot reach your local IP (${esp32Ip}).\n\nTO FIX THIS:\n1. Try using HTTP instead of HTTPS (replace https:// with http:// in the address bar).\n2. OR use ngrok to get a public URL for your ESP32.\n\nClick 'Connect Device' in the header for step-by-step instructions.`);
        }
      }
    } catch (error) {
      console.error("Failed to trigger spray:", error);
      setLiveMode(false);
      setSprayRemaining(0);
      if (sprayIntervalRef.current) clearInterval(sprayIntervalRef.current);
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/images/history/recent");
        if (!response.ok) throw new Error("Failed to fetch alerts");
        const data = await response.json();

        const mappedAlerts = data.map((item: any) => {
          const date = new Date(item.detected_at);
          const now = new Date();
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const isToday = date.toDateString() === now.toDateString();
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const isYesterday = date.toDateString() === yesterday.toDateString();

          let timestamp = `${timeStr} ${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
          if (isToday) timestamp = `${timeStr} Today`;
          else if (isYesterday) timestamp = `${timeStr} Yesterday`;

          return {
            field: item.crop_name || "Unknown Crop",
            timestamp,
            message: `${item.confidence_score}% ${item.disease_name.split('/').pop()?.replace('_', ' ')} detected`
          };
        });

        setAlerts(mappedAlerts);
      } catch (error) {
        console.error("Fetch alerts error:", error);
      }
    };

    fetchAlerts();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (cameraMode && !cameraActive) {
      startCamera();
    }
    return () => {
      if (cameraActive) {
        stopCamera();
      }
      if (sprayIntervalRef.current) {
        clearInterval(sprayIntervalRef.current);
      }
    };
  }, [cameraMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      const errorMessage = getErrorMessage(error);
      alert(errorMessage);
      setCameraMode(false);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      alert("Please select an image first");
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      console.log("Upload success:", data);

      if (data.analysis && !data.analysis.error) {
        const top = data.analysis.topResults;
        setResult({
          cropType: data.crop_name || "Unknown Crop",
          disease1: top[0] || { name: "N/A", percent: 0 },
          disease2: top[1] || { name: "N/A", percent: 0 },
          disease3: top[2] || { name: "N/A", percent: 0 },
          recommendSpray: data.analysis.recommendSpray,
          infectionLevel: data.analysis.infectionLevel
        });
      } else {
        setResult({
          cropType: data.crop_name || "Unknown Crop",
          disease1: { name: "Analysis Failed", percent: 0 },
          disease2: { name: "Please try again", percent: 0 },
          disease3: { name: "N/A", percent: 0 },
          recommendSpray: false,
          infectionLevel: "LOW"
        });
      }

    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    switch (error.name) {
      case "NotAllowedError":
        return "Camera access denied. Please allow camera permissions in your browser settings and reload the page.";
      case "NotFoundError":
        return "No camera found on this device.";
      case "NotReadableError":
        return "Camera is in use by another application.";
      case "OverconstrainedError":
        return "Your device camera does not meet the required specifications.";
      case "TypeError":
        return "Invalid camera request. Please try again.";
      default:
        return "Unable to access camera. Ensure you're on HTTPS and have granted permissions.";
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreview(reader.result as string);
              setCameraMode(false);
              stopCamera();
            };
            reader.readAsDataURL(blob);
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  const handleCapture = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResult({
        cropType: "Tomato Leaf",
        disease1: { name: "Early Blight", percent: 72 },
        disease2: { name: "Late Blight", percent: 15 },
        disease3: { name: "Leaf Spot", percent: 13 },
        recommendSpray: true,
        infectionLevel: "HIGH",
      });
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-auto min-h-16 py-2 md:py-0 md:h-16 items-center justify-between flex-wrap gap-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path d="M12 2C12 2 8 6 8 12C8 16.4183 9.79086 20 12 20C14.2091 20 16 16.4183 16 12C16 6 12 2 12 2Z" fill="currentColor" />
                <g transform="translate(14, 12) scale(0.6)">
                  <circle cx="0" cy="0" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="0" cy="0" r="1.5" fill="currentColor" />
                  <g>
                    <rect x="-1" y="-6" width="2" height="2" fill="currentColor" />
                    <rect x="4.2" y="-4.2" width="2" height="2" fill="currentColor" transform="rotate(45 5.2 -3.2)" />
                    <rect x="6" y="-1" width="2" height="2" fill="currentColor" />
                    <rect x="4.2" y="4.2" width="2" height="2" fill="currentColor" transform="rotate(45 5.2 5.2)" />
                    <rect x="-1" y="6" width="2" height="2" fill="currentColor" />
                    <rect x="-6.2" y="4.2" width="2" height="2" fill="currentColor" transform="rotate(45 -5.2 5.2)" />
                    <rect x="-8" y="-1" width="2" height="2" fill="currentColor" />
                    <rect x="-6.2" y="-4.2" width="2" height="2" fill="currentColor" transform="rotate(45 -5.2 -3.2)" />
                  </g>
                </g>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Precision AgroGuard</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">AI Spraying System</p>
            </div>
            {liveMode && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium text-accent">LIVE</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <Button
              size="sm"
              className={liveMode ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90"}
              onClick={() => {
                if (!liveMode) {
                  const time = result ? getSprayTime(result.disease1.name, result.infectionLevel) : 5;
                  triggerSpray(time, result ? {
                    crop_name: result.cropType,
                    disease_name: result.disease1.name,
                    infection_level: result.infectionLevel,
                    spray_type: 'Live Mode'
                  } : {
                    spray_type: 'Manual'
                  });
                } else {
                  setLiveMode(false);
                  setSprayRemaining(0);
                  if (sprayIntervalRef.current) clearInterval(sprayIntervalRef.current);
                  fetch("/api/spray/stop", { method: "POST" }).catch(console.error);
                }
              }}
            >
              <Zap className={`h-4 w-4 md:mr-2 ${liveMode ? "animate-pulse" : ""}`} />
              <span className="hidden xs:inline">{liveMode ? (sprayRemaining > 0 ? `Live (${sprayRemaining}s)` : "Live") : "Live Mode"}</span>
              <span className="xs:hidden">{liveMode ? (sprayRemaining > 0 ? `${sprayRemaining}s` : "Live") : "Live"}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDeviceModal(true)}>
              Connect Device
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <section className="mb-12">
          <div className="mx-auto max-w-3xl text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Intelligent Crop Protection
            </h2>
            <p className="text-base md:text-lg text-muted-foreground px-4">
              Real-time disease detection and targeted spraying for precision agriculture. Reduce pesticide use while maximizing yield.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Analyze Crop</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Capture or upload a crop photo for AI analysis
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
                <Leaf className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Auto-Detection Enabled</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI ensemble will automatically identify your crop type and detect any diseases from the image.
                </p>
              </div>

              {!preview ? (
                <div className="space-y-4">
                  {!cameraMode ? (
                    <>
                      <div className="border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors border-border hover:border-primary/50 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="photo-input"
                        />
                        <label htmlFor="photo-input" className="block cursor-pointer">
                          <Camera className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                          <p className="font-medium text-foreground mb-1">Click to upload photo</p>
                          <p className="text-sm text-muted-foreground">or drag and drop</p>
                        </label>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">OR</span>
                        </div>
                      </div>
                      <Button onClick={() => setCameraMode(true)} variant="outline" className="w-full">
                        <Video className="h-4 w-4 mr-2" />
                        Take Photo with Camera
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover rounded-lg bg-black" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1 bg-primary hover:bg-primary/90">
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Photo
                        </Button>
                        <Button onClick={() => { setCameraMode(false); stopCamera(); }} variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <img src={preview} alt="Selected crop" className="w-full h-64 object-cover rounded-lg" />
                  <div className="flex gap-2">
                    <Button onClick={uploadImage} disabled={analyzing} className="flex-1 bg-primary hover:bg-primary/90">
                      {analyzing ? "Analyzing..." : "Analyze Crop"}
                    </Button>
                    <Button onClick={() => { setPreview(""); setSelectedFile(null); setResult(null); }} variant="outline" className="flex-1">
                      Change Photo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className={`bg-gradient-to-r p-6 border-b border-border ${result.infectionLevel === "HIGH" ? "from-destructive/10 to-accent/10" : "from-primary/10 to-secondary/10"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.infectionLevel === "HIGH" ? <AlertCircle className="h-5 w-5 text-destructive" /> : <Leaf className="h-5 w-5 text-primary" />}
                    <h3 className="text-xl font-semibold text-foreground">Analysis Results</h3>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-lg bg-muted/30 border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Primary Detection</p>
                    <h4 className="text-2xl font-bold text-foreground">{formatLabel(result.disease1.name).split(': ')[1] || "Healthy"}</h4>
                    <p className="text-sm font-medium text-primary mt-1">{result.disease1.percent}% Confidence Score</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border border-border bg-background">
                      <p className="text-xs text-muted-foreground mb-1">Plant Type</p>
                      <p className="font-semibold text-foreground">{result.cropType}</p>
                    </div>
                    <div className={`p-3 rounded-lg border border-border ${result.recommendSpray ? "bg-destructive/5 border-destructive/20" : "bg-primary/5 border-primary/20"}`}>
                      <p className="text-xs text-muted-foreground mb-1">Spray Required</p>
                      <p className={`font-bold ${result.recommendSpray ? "text-destructive" : "text-primary"}`}>{result.recommendSpray ? "YES" : "NO"}</p>
                    </div>
                  </div>

                  {result.recommendSpray ? (
                    <div className="mt-4 p-4 rounded-xl bg-destructive border border-destructive/20 text-white shadow-lg shadow-destructive/20 animate-in zoom-in duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <Droplets className="h-6 w-6 text-white" />
                        <div>
                          <p className="font-bold">Infection Detected</p>
                          <p className="text-xs text-white/80">Targeted spraying is required for this area.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => triggerSpray(getSprayTime(result.disease1.name, result.infectionLevel), {
                            crop_name: result.cropType,
                            disease_name: result.disease1.name,
                            infection_level: result.infectionLevel,
                            spray_type: 'Normal'
                          })}
                          className="bg-white text-destructive hover:bg-white/90 font-bold border-none"
                        >
                          Spray Now ({getSprayTime(result.disease1.name, result.infectionLevel)}s)
                        </Button>
                        <Button
                          onClick={() => triggerSpray(getSprayTime(result.disease1.name, result.infectionLevel, true), {
                            crop_name: result.cropType,
                            disease_name: result.disease1.name,
                            infection_level: result.infectionLevel,
                            spray_type: 'Burst'
                          })}
                          variant="outline"
                          className="bg-transparent border-white/40 text-white hover:bg-white/10 font-bold"
                        >
                          Short Burst ({getSprayTime(result.disease1.name, result.infectionLevel, true)}s)
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-primary">
                      <Check className="h-6 w-6" />
                      <div>
                        <p className="font-bold">Plant is Healthy</p>
                        <p className="text-xs opacity-80">No immediate spray action is required.</p>
                      </div>
                    </div>
                  )}

                  <Button onClick={() => setResult(null)} variant="outline" className="w-full mt-4">Analyze Another Plant</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-accent" />
                    <h3 className="text-xl font-semibold text-foreground">Recent Alerts</h3>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {alerts.length > 0 ? (showAllAlerts ? alerts : alerts.slice(0, 6)).map((alert, idx) => (
                    <div key={idx} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground">{alert.field}</p>
                        <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  )) : <div className="p-8 text-center text-muted-foreground">No recent alerts found.</div>}
                </div>

                {alerts.length > 6 && (
                  <div className="p-3 border-t border-border text-center">
                    <Button variant="ghost" size="sm" className="text-primary font-semibold" onClick={() => setShowAllAlerts(!showAllAlerts)}>
                      {showAllAlerts ? "View Less" : `View More (${alerts.length - 6} more)`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Camera, title: "Real-time Capture", desc: "Instant photo analysis" },
              { icon: Leaf, title: "AI Detection", desc: "Multi-disease identification" },
              { icon: Droplets, title: "Smart Spraying", desc: "Targeted application" },
              { icon: Zap, title: "Live Alerts", desc: "Push notifications" },
            ].map((feature, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-card p-6 text-center hover:border-primary/50 transition-colors">
                <feature.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/30 py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Precision AgroGuard. All rights reserved.</p>
        </div>
      </footer>

      {showDeviceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" />Connect ESP32 Hardware</h2>
              <button onClick={() => setShowDeviceModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {!deviceConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Enter the IP address or public URL of your ESP32 hardware.</p>
                  
                  {window.location.protocol === 'https:' && (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 space-y-3">
                      <p className="font-bold">⚠️ Cloud Deployment Detected</p>
                      <p>Because this site is running on <strong>HTTPS</strong> and the backend is in the <strong>Cloud</strong>, it cannot talk to your local IP address directly.</p>
                      
                      <div className="space-y-2">
                        <p className="font-bold underline">Pick one way to fix this:</p>
                        <ol className="list-decimal ml-4 space-y-1">
                          <li><strong>Easiest:</strong> Use <a href={window.location.href.replace('https://', 'http://')} className="underline font-bold text-amber-700">HTTP Version</a> of this site. This allows your browser to talk directly to your hardware.</li>
                          <li><strong>Best:</strong> Use <a href="https://ngrok.com" target="_blank" rel="noreferrer" className="underline font-bold text-amber-700">ngrok</a>. Run it on your PC to get a public URL (e.g., <code>https://your-id.ngrok.app</code>) and paste it below.</li>
                          <li><strong>Settings:</strong> Click the "Lock" icon in your browser address bar &rarr; Site Settings &rarr; allow <strong>"Insecure content"</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">ESP32 IP or URL</label>
                    <input 
                      type="text" 
                      value={esp32Ip} 
                      onChange={(e) => setEsp32Ip(e.target.value)} 
                      placeholder="e.g., 192.168.0.105 or my-esp32.ngrok-free.app" 
                      className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary/50 text-foreground" 
                    />
                  </div>
                  <Button onClick={async () => {
                    try {
                      const response = await fetch("/api/spray/connect", { 
                        method: "POST", 
                        headers: { "Content-Type": "application/json" }, 
                        body: JSON.stringify({ ip: esp32Ip }) 
                      });
                      if (response.ok) {
                        setDeviceName(`ESP32 (${esp32Ip})`);
                        setDeviceConnected(true);
                      }
                    } catch (error) { alert("Failed to connect to backend"); }
                  }} className="w-full bg-primary hover:bg-primary/90">Connect Hardware</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <div><p className="font-medium text-foreground">Connected</p><p className="text-sm text-muted-foreground">{deviceName}</p></div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Status:</p>
                    <p>Endpoint updated on server.</p>
                    {(esp32Ip.includes('192.168.') || esp32Ip.includes('10.')) && window.location.hostname !== 'localhost' && (
                      <p className="text-destructive font-bold">Warning: Local IP detected. Cloud backend cannot reach this device.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                {deviceConnected && <Button onClick={() => { setDeviceConnected(false); setDeviceName(""); }} variant="outline" className="flex-1">Disconnect</Button>}
                <Button onClick={() => setShowDeviceModal(false)} className={deviceConnected ? "flex-1" : "w-full"} variant={deviceConnected ? "default" : "outline"}>{deviceConnected ? "Close" : "Cancel"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
