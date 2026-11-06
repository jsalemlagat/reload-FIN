import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Sparkles, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { formatPHP } from '../utils/currency';

interface ReceiptScanResult {
  amount?: number;
  whatPurchased?: string;
  fromWhere?: string;
  date?: string;
  category?: string;
  whyPurchased?: string;
  detectedText?: string;
}

interface ReceiptScannerModalProps {
  onApplyExtracted: (result: ReceiptScanResult, imageBase64: string) => void;
  onClose: () => void;
}

export default function ReceiptScannerModal({
  onApplyExtracted,
  onClose,
}: ReceiptScannerModalProps) {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('upload');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera stream when camera mode is active
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (activeMode === 'camera' && !capturedImage) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        .then((stream) => {
          currentStream = stream;
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setActiveMode('upload');
          setErrorMessage('Camera access was not granted or not available. Please upload a receipt photo instead.');
        });
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeMode, capturedImage]);

  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    setCapturedImage(dataUrl);
    processImageWithAI(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      processImageWithAI(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImageWithAI = async (base64Img: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const res = await fetch('/api/receipt-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server OCR request failed (${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.result) {
        setScanResult(data.result);
      } else {
        throw new Error('AI could not parse receipt structure.');
      }
    } catch (err: any) {
      console.warn('OCR error fallback:', err);
      setErrorMessage(
        err?.message?.includes('GEMINI_API_KEY')
          ? 'Gemini API Key is not set in secrets. You can still attach this photo and fill fields manually.'
          : 'Could not auto-extract receipt text. You can still attach the photo and edit fields manually.'
      );
      // Fallback empty result so user can still apply the photo
      setScanResult({
        amount: 0,
        whatPurchased: 'Receipt attached',
        fromWhere: 'Store / Merchant',
        date: new Date().toISOString().slice(0, 10),
        category: 'Groceries',
        whyPurchased: 'Ministry expense',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Receipt Camera Scanner
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">
                  Gemini OCR
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Auto-captures amount, merchant, date, and description
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport & Controls */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {!capturedImage ? (
            <div className="space-y-4">
              {/* Tab Selector: Live Camera vs File Upload */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveMode('upload')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    activeMode === 'upload'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('camera')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    activeMode === 'camera'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Live Camera
                </button>
              </div>

              {/* Mode 1: Live Camera Stream */}
              {activeMode === 'camera' ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Overlay */}
                  <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <span className="text-[10px] font-mono text-white/80 bg-black/40 px-2 py-0.5 rounded self-start">
                      Align receipt within frame
                    </span>
                  </div>

                  <div className="absolute bottom-4 inset-x-0 flex justify-center">
                    <button
                      type="button"
                      onClick={captureFromVideo}
                      className="w-14 h-14 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                    >
                      <div className="w-11 h-11 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode 2: File Upload / Gallery */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Tap to Choose Receipt Photo
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Take a snapshot or select from your gallery. AI will read the vendor, items, and total amount.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Image Preview & OCR Parsing Status */
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-slate-950 max-h-48 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                <img
                  src={capturedImage}
                  alt="Captured Receipt"
                  className="max-h-48 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={handleRetake}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1 hover:bg-black/80"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retake
                </button>
              </div>

              {/* Processing Spinner */}
              {isProcessing && (
                <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-center space-y-2">
                  <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse mx-auto" />
                  <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    Scanning Receipt with Gemini AI...
                  </div>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                    Extracting Philippine Peso amounts, merchant name, and item description.
                  </p>
                </div>
              )}

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Extracted Details Preview */}
              {scanResult && !isProcessing && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>AI Extracted Details</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Ready to Apply
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400">Total Amount</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                        {formatPHP(scanResult.amount || 0)}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400">Category</div>
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {scanResult.category || 'Outflow'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 col-span-2">
                      <div className="text-[10px] text-slate-400">Merchant / Store</div>
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {scanResult.fromWhere || 'Not specified'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 col-span-2">
                      <div className="text-[10px] text-slate-400">Item Description</div>
                      <div className="text-slate-800 dark:text-slate-200 truncate">
                        {scanResult.whatPurchased || 'Receipt items'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          {capturedImage && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                if (capturedImage && scanResult) {
                  onApplyExtracted(scanResult, capturedImage);
                  onClose();
                }
              }}
              className="flex-1 h-11 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-transform"
            >
              <Check className="w-4 h-4" />
              Use Extracted Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
