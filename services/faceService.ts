
import { FACE_API_MODELS_URI, MATCH_THRESHOLD } from '../constants';

const faceapi = window.faceapi;

export const loadModels = async (): Promise<void> => {
  if (!faceapi) throw new Error("FaceAPI not loaded");
  
  // Load necessary models for detection and recognition
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_API_MODELS_URI),
    faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODELS_URI),
    faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_MODELS_URI)
  ]);
};

export const getFaceDescriptor = async (input: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | null> => {
  if (!faceapi) return null;
  
  // Safety check for video elements
  if (input instanceof HTMLVideoElement) {
      if (input.paused || input.ended || input.readyState === 0) return null;
  }

  // Use SSD Mobilenet for higher accuracy than TinyFaceDetector
  // We use slightly higher confidence to avoid false positives during auto-scan
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
};

export const compareFaces = (descriptor1: Float32Array, descriptor2: Float32Array): boolean => {
  if (!faceapi) return false;
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return distance < MATCH_THRESHOLD;
};

export const detectAllFaces = async (img: HTMLImageElement): Promise<Float32Array[]> => {
  if (!faceapi) return [];
  
  const detections = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections.map((d: any) => d.descriptor);
};
