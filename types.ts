
// Extend window to include faceapi which is loaded via CDN script
declare global {
  interface Window {
    faceapi: any;
  }
}

export type SourceType = 'DRIVE' | 'WEB_JSON' | 'LOCAL';

export interface DriveFile {
  id: string; 
  name: string;
  thumbnailLink: string; // Blob URL for local, Http URL for remote
  webContentLink?: string; 
  fileObject?: File; // Essential for the Local Kiosk workflow
}

export interface AppConfig {
  sourceType: SourceType;
  // Drive specific
  apiKey?: string;
  folderId?: string;
  // Web JSON specific
  jsonUrl?: string;
  // Local specific
  isLocalSession?: boolean;
}

export enum AppState {
  IDLE = 'IDLE', // Welcome Screen
  LOADING_MODELS = 'LOADING_MODELS',
  VIEWING_GALLERY = 'VIEWING_GALLERY', // New: See all photos before scanning
  SCANNING_USER = 'SCANNING_USER',
  FETCHING_PHOTOS = 'FETCHING_PHOTOS',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ScanStats {
  total: number;
  processed: number;
  found: number;
  startTime: number;
  currentFile?: string;
}