
import React, { useRef, useState, useEffect } from 'react';
import { Button } from './Button';
import { getFaceDescriptor } from '../services/faceService';

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array, imageSrc: string) => void;
  isModelsLoaded: boolean;
  onCancel: () => void;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({ onFaceDetected, isModelsLoaded, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Ref to track stream for cleanup
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, []);

  // Bind stream to video element whenever active
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (isCameraActive && video && stream) {
      video.srcObject = stream;
      video.play().catch(e => {
        console.error("Error playing video:", e);
        // Retry play if it failed (sometimes needed for mobile)
        setTimeout(() => video.play().catch(console.error), 1000);
      });
    }
  }, [isCameraActive]);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setError(null);
    setCapturedImage(null);
    setCapturedDescriptor(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      streamRef.current = mediaStream;
      setIsCameraActive(true);
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please allow permissions or try uploading a selfie.");
    }
  };

  const stopCamera = () => {
    stopTracks();
    setIsCameraActive(false);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    // Trigger visual feedback
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    // Capture the image for review
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
    }
    
    const imageSrc = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageSrc);
    stopCamera(); // Freeze the UI
    
    // Immediate Quality Check
    setIsProcessing(true);
    try {
        const img = new Image();
        img.src = imageSrc;
        // Wait for image to load to ensure faceapi can read it
        await new Promise(resolve => img.onload = resolve);
        
        const descriptor = await getFaceDescriptor(img);
        
        if (descriptor) {
            setCapturedDescriptor(descriptor);
            setError(null);
        } else {
            setCapturedDescriptor(null);
            setError("No face detected. Please ensure good lighting and face the camera directly.");
        }
    } catch (err) {
        setError("Error analyzing image.");
    } finally {
        setIsProcessing(false);
    }
  };

  const confirmMatch = () => {
    if (capturedDescriptor && capturedImage) {
      onFaceDetected(capturedDescriptor, capturedImage);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsProcessing(true);
    setError(null);

    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      setCapturedImage(src); // Show review
      
      const img = new Image();
      img.onload = async () => {
        try {
          const descriptor = await getFaceDescriptor(img);
          if (descriptor) {
            setCapturedDescriptor(descriptor);
          } else {
            setError("No face detected in the uploaded photo.");
          }
        } catch (err) {
          setError("Error processing image.");
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-8 animate-fade-in-up">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
          Identify Yourself
        </h1>
        <p className="text-gray-400 text-lg max-w-lg mx-auto">
          Take a clear selfie or upload a photo to find your matches.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-gray-700 shadow-xl overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center">
        
        {/* Flash Effect */}
        {flash && <div className="absolute inset-0 bg-white z-50 animate-fade-out"></div>}

        {/* Viewport Area */}
        <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-gray-600 group">
          
          {isCameraActive && !capturedImage && (
            <>
              {/* Mirror effect for natural feel */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
              
              {/* Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
                 <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-3xl"></div>
              </div>
            </>
          )}

          {capturedImage && (
            <div className="relative w-full h-full">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                         <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                         <span className="font-semibold">Checking quality...</span>
                    </div>
                )}
            </div>
          )}

          {!isCameraActive && !capturedImage && (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-black/50">
               <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               <p>Camera is off</p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="min-h-[30px] mt-4">
          {error && (
            <div className="inline-flex items-center gap-2 text-red-400 text-sm font-semibold px-4 py-1 rounded-full bg-red-900/20 border border-red-900/50 animate-pulse">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}
          {capturedDescriptor && !isProcessing && (
             <div className="inline-flex items-center gap-2 text-green-400 text-sm font-bold px-4 py-1 rounded-full bg-green-900/20 border border-green-900/50">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               Face Detected Successfully
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 w-full">
           
           {/* Initial State: Start Buttons */}
           {!isCameraActive && !capturedImage && (
             <>
               <Button onClick={startCamera} disabled={!isModelsLoaded} className="shadow-lg shadow-primary/25">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 {isModelsLoaded ? 'Take Selfie' : 'Loading AI...'}
               </Button>
               <div className="relative">
                 <Button variant="secondary" disabled={!isModelsLoaded}>
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   Upload Photo
                 </Button>
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={handleFileUpload}
                   disabled={!isModelsLoaded}
                   className="absolute inset-0 opacity-0 cursor-pointer"
                 />
               </div>
               <Button variant="outline" onClick={onCancel}>
                 Cancel
               </Button>
             </>
           )}

           {/* Camera Active State: Capture Button */}
           {isCameraActive && (
              <div className="flex gap-4">
                  <Button onClick={handleCapture} className="px-8 shadow-primary/50">
                    Capture Photo
                  </Button>
                  <Button variant="secondary" onClick={stopCamera}>
                    Cancel
                  </Button>
              </div>
           )}

           {/* Review State: Confirm/Retake */}
           {capturedImage && !isCameraActive && (
             <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto animate-fade-in-up">
               {capturedDescriptor && (
                   <Button onClick={confirmMatch} disabled={isProcessing} className="w-full sm:w-auto">
                     Confirm & Search
                   </Button>
               )}
               <Button variant="secondary" onClick={() => { setCapturedImage(null); setCapturedDescriptor(null); startCamera(); }} className="w-full sm:w-auto">
                 Retake Photo
               </Button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
